// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {StdInvariant} from "forge-std/StdInvariant.sol";
import {console} from "forge-std/console.sol";
import {BaseTest} from "../utils/BaseTest.sol";
import {LendingPool} from "../../src/LendingPool.sol";
import {MockERC20} from "../../src/mocks/MockERC20.sol";
import {MockV3Aggregator} from "../../src/mocks/MockV3Aggregator.sol";
import {Handler} from "./Handler.sol";

/// @notice Stateful invariants: properties that must hold after any sequence of actions.
contract LendingPoolInvariantTest is StdInvariant, BaseTest {
    Handler internal handler;
    MockERC20[] internal tokenList;

    function setUp() public override {
        super.setUp();
        tokenList.push(usdc);
        tokenList.push(weth);
        tokenList.push(wbtc);
        MockV3Aggregator[] memory feedList = new MockV3Aggregator[](3);
        feedList[0] = usdcFeed;
        feedList[1] = wethFeed;
        feedList[2] = wbtcFeed;
        handler = new Handler(pool, tokenList, feedList);
        targetContract(address(handler));
    }

    /// The pool always holds at least the cash its books say it has.
    function invariant_poolHoldsItsCash() public view {
        for (uint256 i; i < tokenList.length; ++i) {
            LendingPool.MarketView memory m = pool.getMarket(address(tokenList[i]));
            assertGe(tokenList[i].balanceOf(address(pool)), m.cash);
        }
    }

    /// Per-user scaled debt adds up to the market total.
    function invariant_debtAccountingAddsUp() public view {
        address[] memory actors = handler.getActors();
        for (uint256 i; i < tokenList.length; ++i) {
            uint256 sum;
            for (uint256 a; a < actors.length; ++a) {
                sum += pool.scaledDebtOf(actors[a], address(tokenList[i]));
            }
            assertEq(sum, pool.getTotalScaledDebt(address(tokenList[i])));
        }
    }

    /// Users' claims never exceed what the market holds plus what it is owed.
    function invariant_suppliersClaimsAreBacked() public view {
        address[] memory actors = handler.getActors();
        for (uint256 i; i < tokenList.length; ++i) {
            LendingPool.MarketView memory m = pool.getMarket(address(tokenList[i]));
            uint256 claims;
            for (uint256 a; a < actors.length; ++a) {
                (uint256 supplied,,,) = pool.getUserPosition(actors[a], address(tokenList[i]));
                claims += supplied;
            }
            assertLe(claims, m.totalSupplied);
            assertLe(m.reserves, m.cash + m.totalDebt);
        }
    }

    /// No successful borrow or withdraw ever leaves the user over their LTV limit (or with HF < 1).
    /// (Prices and interest can still push positions under water later; that is what liquidation is for.)
    function invariant_borrowAndWithdrawRespectLimits() public view {
        assertFalse(handler.limitViolated());
    }

    /// The value of one ALToken share never goes down unless bad debt was written off.
    function invariant_sharePriceNeverDecreases() public view {
        assertFalse(handler.exchangeRateDecreased());
    }

    /// Run with -vv to see how much real activity the fuzzer generated.
    function invariant_callSummary() public view {
        console.log("calls", handler.calls());
        console.log("borrows", handler.successfulBorrows());
        console.log("withdraws", handler.successfulWithdraws());
        console.log("liquidations", handler.successfulLiquidations());
    }
}
