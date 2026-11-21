// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseTest} from "../utils/BaseTest.sol";
import {LendingPool} from "../../src/LendingPool.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

contract SupplyWithdrawTest is BaseTest {
    function test_supply_mintsSharesOneToOneOnEmptyMarket() public {
        _supply(alice, usdc, 1000e6);
        assertEq(alUsdc.balanceOf(alice), 1000e6);
        assertEq(usdc.balanceOf(address(pool)), 1000e6);
        (uint256 supplied,,,) = pool.getUserPosition(alice, address(usdc));
        assertEq(supplied, 1000e6);
    }

    function test_supply_enablesCollateralOnFirstSupply() public {
        _supply(alice, weth, 1e18);
        assertTrue(pool.isCollateral(alice, address(weth)));
    }

    function test_supply_onBehalfOf() public {
        usdc.mint(alice, 100e6);
        vm.prank(alice);
        pool.supply(address(usdc), 100e6, bob);
        assertEq(alUsdc.balanceOf(bob), 100e6);
        assertEq(alUsdc.balanceOf(alice), 0);
        assertFalse(pool.isCollateral(bob, address(usdc)), "third party can't change bob's collateral");
    }

    function test_supply_revertsOnZero() public {
        vm.prank(alice);
        vm.expectRevert(LendingPool.ZeroAmount.selector);
        pool.supply(address(usdc), 0, alice);
    }

    function test_supply_revertsOnUnlistedAsset() public {
        address fake = makeAddr("fake");
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(LendingPool.MarketNotListed.selector, fake));
        pool.supply(fake, 1, alice);
    }

    function test_supply_respectsCap() public {
        LendingPool.AssetConfig memory c = _cfg(8000, 8500, 500, 1000);
        c.supplyCap = 1000e6;
        vm.prank(admin);
        pool.setAssetConfig(address(usdc), c);

        _supply(alice, usdc, 1000e6);
        usdc.mint(alice, 1);
        vm.prank(alice);
        vm.expectRevert(LendingPool.SupplyCapExceeded.selector);
        pool.supply(address(usdc), 1, alice);
    }

    function test_withdraw_partialAndMax() public {
        _supply(alice, usdc, 1000e6);
        vm.startPrank(alice);
        pool.withdraw(address(usdc), 400e6, alice);
        assertEq(usdc.balanceOf(alice), 400e6);
        pool.withdraw(address(usdc), type(uint256).max, alice);
        vm.stopPrank();
        assertEq(usdc.balanceOf(alice), 1000e6);
        assertEq(alUsdc.balanceOf(alice), 0);
    }

    function test_withdraw_revertsWhenMoreThanBalance() public {
        _supply(alice, usdc, 1000e6);
        vm.prank(alice);
        vm.expectRevert(LendingPool.InsufficientShares.selector);
        pool.withdraw(address(usdc), 1001e6, alice);
    }

    function test_withdraw_revertsWhenCashIsBorrowed() public {
        _supply(alice, usdc, 1000e6);
        _supply(bob, weth, 10e18);
        _borrow(bob, usdc, 900e6);
        vm.prank(alice);
        vm.expectRevert(LendingPool.InsufficientLiquidity.selector);
        pool.withdraw(address(usdc), 200e6, alice);
    }

    function test_withdraw_blockedIfItBreaksBorrowLimit() public {
        _supply(alice, usdc, 10_000e6);
        _supply(bob, weth, 1e18); // $2000, borrow limit $1500
        _borrow(bob, usdc, 1400e6);
        vm.prank(bob);
        vm.expectRevert(LendingPool.ExceedsBorrowLimit.selector);
        pool.withdraw(address(weth), 0.1e18, bob);
    }

    function test_withdraw_allowedWithinBorrowLimit() public {
        _supply(alice, usdc, 10_000e6);
        _supply(bob, weth, 1e18);
        _borrow(bob, usdc, 1000e6);
        vm.prank(bob);
        pool.withdraw(address(weth), 0.3e18, bob); // leaves $1400 * 75% = $1050 limit
        assertGe(_hf(bob), 1e18);
    }

    function test_supplierEarnsInterest() public {
        _supply(alice, usdc, 10_000e6);
        _supply(bob, weth, 10e18);
        _borrow(bob, usdc, 5000e6);
        _skip(365 days);
        (uint256 supplied,,,) = pool.getUserPosition(alice, address(usdc));
        assertGt(supplied, 10_000e6, "supplier should earn interest");
    }

    function test_pause_blocksSupplyAndWithdraw() public {
        _supply(alice, usdc, 100e6);
        vm.prank(admin);
        pool.pause();
        usdc.mint(alice, 1e6);
        vm.startPrank(alice);
        vm.expectRevert(Pausable.EnforcedPause.selector);
        pool.supply(address(usdc), 1e6, alice);
        vm.expectRevert(Pausable.EnforcedPause.selector);
        pool.withdraw(address(usdc), 1e6, alice);
        vm.stopPrank();
    }
}
