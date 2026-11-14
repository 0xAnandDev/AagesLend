// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {LendingPool} from "../../src/LendingPool.sol";
import {MockERC20} from "../../src/mocks/MockERC20.sol";
import {MockV3Aggregator} from "../../src/mocks/MockV3Aggregator.sol";

/// @notice Drives random sequences of user actions against the pool for invariant testing.
contract Handler is Test {
    LendingPool public pool;
    MockERC20[] public tokens;
    MockV3Aggregator[] public feeds;
    address[] public actors;

    // Ghost state
    /// Set if any successful borrow or withdraw left the actor above their LTV limit.
    bool public limitViolated;
    bool public badDebtOccurred;
    mapping(address => uint256) public lastExchangeRate;
    bool public exchangeRateDecreased;
    uint256 public calls;
    uint256 public successfulBorrows;
    uint256 public successfulLiquidations;
    uint256 public successfulWithdraws;

    constructor(LendingPool pool_, MockERC20[] memory tokens_, MockV3Aggregator[] memory feeds_) {
        pool = pool_;
        tokens = tokens_;
        feeds = feeds_;
        for (uint256 i; i < 3; ++i) {
            address a = makeAddr(string.concat("actor", vm.toString(i)));
            actors.push(a);
            for (uint256 j; j < tokens.length; ++j) {
                vm.prank(a);
                tokens[j].approve(address(pool), type(uint256).max);
            }
        }
        _snapshotRates();
    }

    function getActors() external view returns (address[] memory) {
        return actors;
    }

    function tokenCount() external view returns (uint256) {
        return tokens.length;
    }

    // ------------------------------------------------------------- actions

    function supply(uint256 actorSeed, uint256 tokenSeed, uint256 amount) external {
        (address actor, MockERC20 t) = _pick(actorSeed, tokenSeed);
        amount = bound(amount, 1, 1_000_000 * 10 ** t.decimals());
        t.mint(actor, amount);
        vm.prank(actor);
        pool.supply(address(t), amount, actor);
        _after();
    }

    function withdraw(uint256 actorSeed, uint256 tokenSeed, uint256 amount) external {
        (address actor, MockERC20 t) = _pick(actorSeed, tokenSeed);
        (uint256 supplied,,,) = pool.getUserPosition(actor, address(t));
        if (supplied == 0) return;
        amount = bound(amount, 1, supplied);
        vm.prank(actor);
        try pool.withdraw(address(t), amount, actor) {
            successfulWithdraws++;
            _checkLimit(actor);
        } catch {}
        _after();
    }

    /// Borrow 50-100% of the actor's remaining capacity so positions sit near their limit.
    function borrow(uint256 actorSeed, uint256 tokenSeed, uint256 pct) external {
        (address actor, MockERC20 t) = _pick(actorSeed, tokenSeed);
        LendingPool.MarketView memory m = pool.getMarket(address(t));
        LendingPool.AccountData memory d = pool.getUserAccountData(actor);
        if (m.cash == 0 || m.price == 0 || d.borrowLimitUsd <= d.debtUsd) return;
        uint256 capacity = (d.borrowLimitUsd - d.debtUsd) * 10 ** m.decimals / m.price;
        uint256 amount = capacity * bound(pct, 50, 100) / 100;
        if (amount > m.cash) amount = m.cash;
        if (amount == 0) return;
        vm.prank(actor);
        try pool.borrow(address(t), amount) {
            successfulBorrows++;
            _checkLimit(actor);
        } catch {}
        _after();
    }

    function repay(uint256 actorSeed, uint256 tokenSeed, uint256 amount) external {
        (address actor, MockERC20 t) = _pick(actorSeed, tokenSeed);
        uint256 debt = pool.debtOf(actor, address(t));
        if (debt == 0) return;
        amount = bound(amount, 1, debt);
        t.mint(actor, amount);
        vm.prank(actor);
        pool.repay(address(t), amount, actor);
        _after();
    }

    function warp(uint256 dt) external {
        dt = bound(dt, 1, 30 days);
        skip(dt);
        for (uint256 i; i < feeds.length; ++i) {
            feeds[i].updateAnswer(feeds[i].answer());
        }
        _after();
    }

    /// Move one non-stablecoin price by -20%..+20%.
    function movePrice(uint256 feedSeed, uint256 pct) external {
        uint256 i = 1 + bound(feedSeed, 0, feeds.length - 2); // index 0 is the stablecoin
        pct = bound(pct, 80, 120);
        int256 p = feeds[i].answer() * int256(pct) / 100;
        if (p <= 0) return;
        feeds[i].updateAnswer(p);
        _after();
    }

    function liquidate(uint256 liquidatorSeed, uint256 borrowerSeed, uint256 collSeed, uint256 debtSeed) external {
        address liquidator = actors[bound(liquidatorSeed, 0, actors.length - 1)];
        address borrower = actors[bound(borrowerSeed, 0, actors.length - 1)];
        if (liquidator == borrower) return;
        MockERC20 coll = tokens[bound(collSeed, 0, tokens.length - 1)];
        MockERC20 debtT = tokens[bound(debtSeed, 0, tokens.length - 1)];
        uint256 debt = pool.debtOf(borrower, address(debtT));
        if (debt == 0) return;
        debtT.mint(liquidator, debt);
        uint256 scaledBefore = _totalScaledDebtSum(borrower);
        vm.prank(liquidator);
        try pool.liquidate(address(coll), address(debtT), borrower, debt) {
            successfulLiquidations++;
            // If the borrower is now debt-free in every market while still owing before, bad debt may have been cut.
            if (_totalScaledDebtSum(borrower) == 0 && scaledBefore != 0) badDebtOccurred = true;
        } catch {}
        _after();
    }

    // ------------------------------------------------------------- helpers

    function _pick(uint256 actorSeed, uint256 tokenSeed) internal view returns (address, MockERC20) {
        return (actors[bound(actorSeed, 0, actors.length - 1)], tokens[bound(tokenSeed, 0, tokens.length - 1)]);
    }

    function _totalScaledDebtSum(address user) internal view returns (uint256 s) {
        for (uint256 j; j < tokens.length; ++j) {
            s += pool.scaledDebtOf(user, address(tokens[j]));
        }
    }

    function _checkLimit(address actor) internal {
        LendingPool.AccountData memory d = pool.getUserAccountData(actor);
        if (d.debtUsd > d.borrowLimitUsd || d.healthFactor < 1e18) limitViolated = true;
    }

    function _after() internal {
        calls++;
        for (uint256 j; j < tokens.length; ++j) {
            uint256 r = pool.getMarket(address(tokens[j])).exchangeRate;
            if (r < lastExchangeRate[address(tokens[j])] && !badDebtOccurred) exchangeRateDecreased = true;
            lastExchangeRate[address(tokens[j])] = r;
        }
    }

    function _snapshotRates() internal {
        for (uint256 j; j < tokens.length; ++j) {
            lastExchangeRate[address(tokens[j])] = pool.getMarket(address(tokens[j])).exchangeRate;
        }
    }
}
