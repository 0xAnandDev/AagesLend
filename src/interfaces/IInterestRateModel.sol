// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Borrow-rate curve used by the LendingPool.
interface IInterestRateModel {
    /// @notice Borrow rate per second, scaled to 1e18, for a given utilization (1e18 = 100%).
    function getBorrowRatePerSecond(uint256 utilization) external view returns (uint256);
}
