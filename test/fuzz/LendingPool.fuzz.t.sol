// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseTest} from "../utils/BaseTest.sol";
import {LendingPool} from "../../src/LendingPool.sol";

contract LendingPoolFuzzTest is BaseTest {
    /// Supplying then withdrawing everything never returns more than was put in.
    function testFuzz_supplyWithdrawRoundTripNeverProfits(uint256 seed, uint256 amount) public {
        amount = bound(amount, 1, 1e30);
        _supply(alice, weth, bound(seed, 1, 1e24)); // existing liquidity at some share price
        _supply(bob, weth, amount);
        vm.prank(bob);
        uint256 out = pool.withdraw(address(weth), type(uint256).max, bob);
        assertLe(out, amount);
        assertGe(out + 1, amount, "loses at most 1 wei to rounding");
    }

    /// Any borrow that succeeds leaves the borrower within their LTV limit.
    function testFuzz_successfulBorrowStaysWithinLtv(uint256 collateral, uint256 amount) public {
        collateral = bound(collateral, 1e12, 1000e18);
        amount = bound(amount, 1, 5_000_000e6);
        _supply(alice, usdc, 5_000_000e6);
        _supply(bob, weth, collateral);

        vm.prank(bob);
        try pool.borrow(address(usdc), amount) {
            LendingPool.AccountData memory d = pool.getUserAccountData(bob);
            assertLe(d.debtUsd, d.borrowLimitUsd);
            assertGe(d.healthFactor, 1e18);
        } catch {
            // Reverting is fine; borrowing past the limit must revert.
            uint256 limitUsd = collateral * 2000 * 7500 / 10_000; // 1e18 USD
            assertGt(amount * 1e12, limitUsd - 1e12);
        }
    }

    /// Debt never decreases with time and repaying in full always clears it.
    function testFuzz_debtGrowsAndFullRepayClears(uint256 amount, uint256 dt) public {
        amount = bound(amount, 1e6, 100_000e6);
        dt = bound(dt, 1, 5 * 365 days);
        _supply(alice, usdc, 1_000_000e6);
        _supply(bob, weth, 1000e18);
        _borrow(bob, usdc, amount);

        _skip(dt);
        uint256 debt = pool.debtOf(bob, address(usdc));
        assertGe(debt, amount);

        usdc.mint(bob, debt);
        vm.prank(bob);
        uint256 paid = pool.repay(address(usdc), type(uint256).max, bob);
        assertEq(paid, debt);
        assertEq(pool.debtOf(bob, address(usdc)), 0);
        assertEq(pool.getTotalScaledDebt(address(usdc)), 0);
    }

    /// Liquidation never pays the liquidator more than (repaid value * (1 + bonus)) and always reduces debt.
    function testFuzz_liquidationBounds(uint256 newPrice, uint256 repayAmount) public {
        _supply(alice, usdc, 1_000_000e6);
        _supply(bob, weth, 10e18); // $20k
        _borrow(bob, usdc, 15_000e6);
        newPrice = bound(newPrice, 100e8, 1870e8); // HF below 1 for any price < $1875
        repayAmount = bound(repayAmount, 1e6, 20_000e6);
        _setPrice(wethFeed, int256(newPrice));
        usdc.mint(carol, repayAmount);

        uint256 debtBefore = pool.debtOf(bob, address(usdc));
        vm.prank(carol);
        (uint256 repaid, uint256 seized) = pool.liquidate(address(weth), address(usdc), bob, repayAmount);

        assertLe(repaid, repayAmount);
        uint256 seizedUsd = seized * newPrice / 1e8; // 1e18-scaled USD (WETH has 18 dec)
        uint256 repaidUsd = repaid * 1e12;
        assertLe(seizedUsd, repaidUsd * 10_500 / 10_000 + 1e12, "bonus capped at 5%");
        assertLt(pool.debtOf(bob, address(usdc)), debtBefore);
    }
}
