// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseTest} from "../utils/BaseTest.sol";
import {LendingPool} from "../../src/LendingPool.sol";
import {InterestRateModel} from "../../src/InterestRateModel.sol";

contract ViewsTest is BaseTest {
    function test_marketListingMetadata() public view {
        address[] memory a = pool.getAssets();
        assertEq(a.length, 3);
        assertEq(a[0], address(usdc));
        assertEq(pool.getALToken(address(weth)), address(alWeth));
        assertEq(alUsdc.decimals(), 6);
        assertEq(alWbtc.symbol(), "alWBTC");
        assertEq(alWeth.name(), "AagesLend WETH");
        assertEq(pool.getAssetConfig(address(usdc)).ltv, 8000);
    }

    function test_getAllMarketsReportsRatesAndPrices() public {
        _supply(alice, usdc, 100_000e6);
        _supply(bob, weth, 100e18);
        _borrow(bob, usdc, 90_000e6); // at the 90% kink
        LendingPool.MarketView[] memory ms = pool.getAllMarkets();
        assertEq(ms.length, 3);
        assertEq(ms[0].price, 1e18);
        assertEq(ms[0].utilization, 0.9e18);
        assertApproxEqAbs(ms[0].borrowRate, 0.04e18, 1e10);
        // 4% * 90% * (1 - 10%) = 3.24%
        assertApproxEqAbs(ms[0].supplyRate, 0.0324e18, 1e10);
        assertEq(ms[1].price, 2000e18);
    }

    function test_getMarketPriceIsZeroWhenOracleFails() public {
        skip(2 days);
        assertEq(pool.getMarket(address(weth)).price, 0);
    }

    function test_exchangeRateGrowsWithInterest() public {
        _supply(alice, usdc, 100_000e6);
        _supply(bob, weth, 100e18);
        _borrow(bob, usdc, 50_000e6);
        uint256 before = pool.getMarket(address(usdc)).exchangeRate;
        _skip(365 days);
        assertGt(pool.getMarket(address(usdc)).exchangeRate, before);
        assertGt(pool.convertToAssets(address(usdc), 1000e6), 1000e6);
    }

    function test_adminCanSwapOracleAndRateModel() public {
        InterestRateModel irm = new InterestRateModel(0.5e18, 0, 0, 0.5e18);
        vm.startPrank(admin);
        pool.setInterestRateModel(address(usdc), address(irm));
        vm.expectRevert(LendingPool.ZeroAddress.selector);
        pool.setOracle(address(0));
        pool.setOracle(address(oracle));
        vm.stopPrank();
        assertEq(pool.getMarket(address(usdc)).borrowRate, (uint256(0.5e18) / 365 days) * 365 days);
    }

    function test_unpause() public {
        vm.startPrank(admin);
        pool.pause();
        pool.unpause();
        vm.stopPrank();
        _supply(alice, usdc, 1e6);
    }
}
