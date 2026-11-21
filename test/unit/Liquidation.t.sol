// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseTest} from "../utils/BaseTest.sol";
import {LendingPool} from "../../src/LendingPool.sol";
import {ChainlinkOracle} from "../../src/oracle/ChainlinkOracle.sol";

contract LiquidationTest is BaseTest {
    function setUp() public override {
        super.setUp();
        _supply(alice, usdc, 100_000e6);
        _supply(bob, weth, 1e18); // $2000, liquidation limit $1600
        _borrow(bob, usdc, 1500e6); // HF 1.0667
        usdc.mint(carol, 10_000e6);
    }

    function test_cannotLiquidateHealthyPosition() public {
        vm.prank(carol);
        vm.expectRevert(LendingPool.HealthyPosition.selector);
        pool.liquidate(address(weth), address(usdc), bob, 100e6);
    }

    function test_cannotSelfLiquidate() public {
        _setPrice(wethFeed, 1800e8);
        usdc.mint(bob, 1000e6);
        vm.prank(bob);
        vm.expectRevert(LendingPool.SelfLiquidation.selector);
        pool.liquidate(address(weth), address(usdc), bob, 100e6);
    }

    function test_partialLiquidation_closeFactorAndBonus() public {
        _setPrice(wethFeed, 1800e8); // HF = 1440/1500 = 0.96
        assertLt(_hf(bob), 1e18);

        vm.prank(carol);
        (uint256 repaid, uint256 seized) = pool.liquidate(address(weth), address(usdc), bob, type(uint256).max);

        assertEq(repaid, 750e6, "50% close factor");
        // 750 USD * 1.05 / 1800 = 0.4375 WETH
        assertApproxEqAbs(seized, 0.4375e18, 1e6);
        assertApproxEqAbs(pool.convertToAssets(address(weth), alWeth.balanceOf(carol)), 0.4375e18, 1e6);
        assertEq(pool.debtOf(bob, address(usdc)), 750e6);
        assertGt(_hf(bob), 0.96e18, "liquidation must improve HF");
    }

    function test_liquidatorCanWithdrawSeizedCollateral() public {
        _setPrice(wethFeed, 1800e8);
        vm.startPrank(carol);
        pool.liquidate(address(weth), address(usdc), bob, 750e6);
        pool.withdraw(address(weth), type(uint256).max, carol);
        vm.stopPrank();
        assertApproxEqAbs(weth.balanceOf(carol), 0.4375e18, 1e6);
    }

    function test_fullLiquidationBelow095() public {
        _setPrice(wethFeed, 1700e8); // HF = 1360/1500 = 0.9067
        vm.prank(carol);
        (uint256 repaid,) = pool.liquidate(address(weth), address(usdc), bob, type(uint256).max);
        assertEq(repaid, 1500e6, "whole debt can be closed under HF 0.95");
        assertEq(pool.debtOf(bob, address(usdc)), 0);
    }

    function test_badDebt_liquidatorTakesAllCollateralAndRestIsWrittenOff() public {
        _setPrice(wethFeed, 1000e8); // collateral $1000 < debt $1500

        uint256 suppliedBefore = pool.getMarket(address(usdc)).totalSupplied;
        vm.prank(carol);
        (uint256 repaid, uint256 seized) = pool.liquidate(address(weth), address(usdc), bob, type(uint256).max);

        assertEq(seized, 1e18, "all collateral");
        assertApproxEqAbs(repaid, 952_380_953, 1, "1000 / 1.05 USDC, rounded up");
        assertEq(alWeth.balanceOf(bob), 0);
        assertEq(pool.debtOf(bob, address(usdc)), 0, "remaining debt written off");
        assertEq(pool.scaledDebtOf(bob, address(usdc)), 0);

        // Suppliers absorb the loss (no reserves yet), and the pool keeps working.
        uint256 suppliedAfter = pool.getMarket(address(usdc)).totalSupplied;
        assertApproxEqAbs(suppliedBefore - suppliedAfter, 1500e6 - repaid, 2);
        vm.prank(alice);
        pool.withdraw(address(usdc), 1000e6, alice);
    }

    function test_badDebt_reservesAbsorbFirst() public {
        _skip(365 days); // build reserves from interest
        pool.accrueInterest(address(usdc));
        uint256 reserves = pool.getMarket(address(usdc)).reserves;
        assertGt(reserves, 0);

        _setPrice(wethFeed, 500e8);
        vm.prank(carol);
        pool.liquidate(address(weth), address(usdc), bob, type(uint256).max);
        assertEq(pool.getMarket(address(usdc)).reserves, 0, "reserves used to cover bad debt");
    }

    function test_liquidationWorksWhilePaused() public {
        _setPrice(wethFeed, 1800e8);
        vm.prank(admin);
        pool.pause();
        vm.prank(carol);
        pool.liquidate(address(weth), address(usdc), bob, 100e6);
    }

    function test_liquidationBlockedOnStalePrice() public {
        _setPrice(wethFeed, 1800e8);
        skip(HEARTBEAT + 1);
        vm.prank(carol);
        vm.expectRevert();
        pool.liquidate(address(weth), address(usdc), bob, 100e6);
    }

    function test_cannotSeizeNonCollateralAsset() public {
        _supply(bob, wbtc, 1e8);
        vm.prank(bob);
        pool.setCollateral(address(wbtc), false);
        _setPrice(wethFeed, 1800e8);
        vm.prank(carol);
        vm.expectRevert(LendingPool.NotCollateral.selector);
        pool.liquidate(address(wbtc), address(usdc), bob, 100e6);
    }

    function test_badDebt_notWrittenOffWhileBorrowerHoldsNonCollateralSupply() public {
        _supply(bob, wbtc, 1e6); // 0.01 WBTC, not used as collateral
        vm.prank(bob);
        pool.setCollateral(address(wbtc), false);
        _setPrice(wethFeed, 1000e8);

        vm.prank(carol);
        pool.liquidate(address(weth), address(usdc), bob, type(uint256).max);
        assertGt(pool.debtOf(bob, address(usdc)), 0, "debt kept while bob still has funds in the pool");

        vm.prank(bob);
        vm.expectRevert(LendingPool.ExceedsBorrowLimit.selector);
        pool.withdraw(address(wbtc), 1e6, bob); // and those funds stay locked until he repays
    }
}
