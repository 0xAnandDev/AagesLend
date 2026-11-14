// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {InterestRateModel} from "../../src/InterestRateModel.sol";

contract InterestRateModelTest is Test {
    InterestRateModel internal irm = new InterestRateModel(0.01e18, 0.04e18, 0.6e18, 0.8e18);

    function test_rateAtKeyPoints() public view {
        assertEq(irm.getBorrowRate(0), 0.01e18);
        assertEq(irm.getBorrowRate(0.4e18), 0.03e18); // 1% + 4% * 0.5
        assertEq(irm.getBorrowRate(0.8e18), 0.05e18); // kink
        assertEq(irm.getBorrowRate(0.9e18), 0.35e18); // 5% + 60% * 0.5
        assertEq(irm.getBorrowRate(1e18), 0.65e18);
    }

    function test_utilizationAbove100IsClamped() public view {
        assertEq(irm.getBorrowRate(2e18), irm.getBorrowRate(1e18));
    }

    function test_supplyRate() public view {
        // 5% * 80% * (1 - 10%) = 3.6%
        assertEq(irm.getSupplyRate(0.8e18, 0.1e18), 0.036e18);
    }

    function test_rejectsBadKink() public {
        vm.expectRevert(InterestRateModel.InvalidOptimalUtilization.selector);
        new InterestRateModel(0, 1, 1, 0);
        vm.expectRevert(InterestRateModel.InvalidOptimalUtilization.selector);
        new InterestRateModel(0, 1, 1, 1e18);
    }

    function testFuzz_rateIsMonotonic(uint256 a, uint256 b) public view {
        a = bound(a, 0, 1e18);
        b = bound(b, a, 1e18);
        assertLe(irm.getBorrowRate(a), irm.getBorrowRate(b));
    }
}
