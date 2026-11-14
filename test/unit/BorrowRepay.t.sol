// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseTest} from "../utils/BaseTest.sol";
import {LendingPool} from "../../src/LendingPool.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

contract BorrowRepayTest is BaseTest {
    function setUp() public override {
        super.setUp();
        _supply(alice, usdc, 100_000e6);
        _supply(alice, weth, 100e18);
        _supply(bob, weth, 1e18); // $2000 collateral, $1500 borrow limit
    }

    function test_borrow_usesOraclePrice() public {
        _borrow(bob, usdc, 1500e6);
        assertEq(usdc.balanceOf(bob), 1500e6);
        assertEq(pool.debtOf(bob, address(usdc)), 1500e6);
        LendingPool.AccountData memory d = pool.getUserAccountData(bob);
        assertEq(d.collateralUsd, 2000e18);
        assertEq(d.debtUsd, 1500e18);
    }

    function test_borrow_revertsAboveLtv() public {
        vm.prank(bob);
        vm.expectRevert(LendingPool.ExceedsBorrowLimit.selector);
        pool.borrow(address(usdc), 1500e6 + 1);
    }

    function test_borrow_revertsWithoutCollateral() public {
        vm.prank(carol);
        vm.expectRevert(LendingPool.ExceedsBorrowLimit.selector);
        pool.borrow(address(usdc), 1);
    }

    function test_borrow_collateralDisabledDoesNotCount() public {
        vm.prank(bob);
        pool.setCollateral(address(weth), false);
        vm.prank(bob);
        vm.expectRevert(LendingPool.ExceedsBorrowLimit.selector);
        pool.borrow(address(usdc), 1e6);
    }

    function test_borrow_revertsWhenDisabled() public {
        LendingPool.AssetConfig memory c = _cfg(8000, 8500, 500, 1000);
        c.borrowEnabled = false;
        vm.prank(admin);
        pool.setAssetConfig(address(usdc), c);
        vm.prank(bob);
        vm.expectRevert(LendingPool.BorrowNotEnabled.selector);
        pool.borrow(address(usdc), 1e6);
    }

    function test_borrow_respectsCap() public {
        LendingPool.AssetConfig memory c = _cfg(8000, 8500, 500, 1000);
        c.borrowCap = 1000e6;
        vm.prank(admin);
        pool.setAssetConfig(address(usdc), c);
        vm.prank(bob);
        vm.expectRevert(LendingPool.BorrowCapExceeded.selector);
        pool.borrow(address(usdc), 1001e6);
    }

    function test_borrow_revertsWhenPaused() public {
        vm.prank(admin);
        pool.pause();
        vm.prank(bob);
        vm.expectRevert(Pausable.EnforcedPause.selector);
        pool.borrow(address(usdc), 1e6);
    }

    function test_debtGrowsWithTime() public {
        _borrow(bob, usdc, 1000e6);
        _skip(365 days);
        assertGt(pool.debtOf(bob, address(usdc)), 1000e6);
    }

    function test_interestMatchesRateModel() public {
        // 50% utilization of a 100k pool -> stable model gives 4% * 0.5/0.9 = 2.222% APR (linear accrual).
        _supply(bob, weth, 100e18);
        _borrow(bob, usdc, 50_000e6);
        _skip(365 days);
        uint256 debt = pool.debtOf(bob, address(usdc));
        uint256 expected = 50_000e6 + 50_000e6 * 2222 / 100_000; // ~2.222%
        assertApproxEqRel(debt, expected, 0.001e18);
    }

    function test_repay_partialAndFull() public {
        _borrow(bob, usdc, 1000e6);
        _skip(30 days);
        uint256 debt = pool.debtOf(bob, address(usdc));
        usdc.mint(bob, debt); // cover interest
        vm.startPrank(bob);
        pool.repay(address(usdc), 400e6, bob);
        assertApproxEqAbs(pool.debtOf(bob, address(usdc)), debt - 400e6, 1);
        uint256 paid = pool.repay(address(usdc), type(uint256).max, bob);
        vm.stopPrank();
        assertEq(pool.debtOf(bob, address(usdc)), 0);
        assertApproxEqAbs(paid, debt - 400e6, 1);
    }

    function test_repay_onBehalfOf() public {
        _borrow(bob, usdc, 500e6);
        usdc.mint(carol, 500e6);
        vm.prank(carol);
        pool.repay(address(usdc), 500e6, bob);
        assertEq(pool.debtOf(bob, address(usdc)), 0);
    }

    function test_repay_worksWhilePaused() public {
        _borrow(bob, usdc, 500e6);
        vm.prank(admin);
        pool.pause();
        vm.prank(bob);
        pool.repay(address(usdc), 500e6, bob);
        assertEq(pool.debtOf(bob, address(usdc)), 0);
    }

    function test_repay_revertsWithNoDebt() public {
        vm.prank(bob);
        vm.expectRevert(LendingPool.NoDebt.selector);
        pool.repay(address(usdc), 1, bob);
    }

    function test_repay_worksEvenIfOracleIsDown() public {
        _borrow(bob, usdc, 500e6);
        skip(2 days); // all feeds stale
        usdc.mint(bob, 1e6); // cover interest
        vm.prank(bob);
        pool.repay(address(usdc), type(uint256).max, bob);
        assertEq(pool.debtOf(bob, address(usdc)), 0);
    }

    function test_disableCollateral_blockedWithDebt() public {
        _borrow(bob, usdc, 100e6);
        vm.prank(bob);
        vm.expectRevert(LendingPool.ExceedsBorrowLimit.selector);
        pool.setCollateral(address(weth), false);
    }

    function test_reservesAccrueAndCanBeWithdrawn() public {
        _borrow(bob, usdc, 1000e6);
        _skip(365 days);
        vm.prank(bob);
        pool.accrueInterest(address(usdc));
        LendingPool.MarketView memory m = pool.getMarket(address(usdc));
        assertGt(m.reserves, 0);
        vm.prank(admin);
        pool.withdrawReserves(address(usdc), m.reserves, admin);
        assertEq(usdc.balanceOf(admin), m.reserves);
    }
}
