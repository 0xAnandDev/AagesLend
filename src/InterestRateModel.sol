// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IInterestRateModel} from "./interfaces/IInterestRateModel.sol";

/// @title InterestRateModel
/// @notice Kinked ("jump rate") borrow-rate curve, the same shape Aave and Compound use.
///         Below the optimal utilization the rate rises gently (slope1); above it the rate rises
///         steeply (slope2) to push utilization back down and keep withdrawals possible.
/// @dev All rates are annual and scaled to 1e18 (1e18 = 100% APR). Immutable: deploy a new model to change it.
contract InterestRateModel is IInterestRateModel {
    uint256 public constant WAD = 1e18;
    uint256 public constant SECONDS_PER_YEAR = 365 days;

    uint256 public immutable baseRate;
    uint256 public immutable slope1;
    uint256 public immutable slope2;
    uint256 public immutable optimalUtilization;

    error InvalidOptimalUtilization();

    constructor(uint256 baseRate_, uint256 slope1_, uint256 slope2_, uint256 optimalUtilization_) {
        if (optimalUtilization_ == 0 || optimalUtilization_ >= WAD) revert InvalidOptimalUtilization();
        baseRate = baseRate_;
        slope1 = slope1_;
        slope2 = slope2_;
        optimalUtilization = optimalUtilization_;
    }

    /// @notice Annual borrow rate (1e18 = 100%) at `utilization` (1e18 = 100%).
    function getBorrowRate(uint256 utilization) public view returns (uint256) {
        if (utilization > WAD) utilization = WAD;
        if (utilization <= optimalUtilization) {
            return baseRate + (slope1 * utilization) / optimalUtilization;
        }
        uint256 excess = utilization - optimalUtilization;
        return baseRate + slope1 + (slope2 * excess) / (WAD - optimalUtilization);
    }

    /// @inheritdoc IInterestRateModel
    function getBorrowRatePerSecond(uint256 utilization) external view returns (uint256) {
        return getBorrowRate(utilization) / SECONDS_PER_YEAR;
    }

    /// @notice Annual supply rate suppliers earn: borrowRate * utilization * (1 - reserveFactor).
    /// @param reserveFactor Share of interest kept by the protocol, 1e18 = 100%.
    function getSupplyRate(uint256 utilization, uint256 reserveFactor) external view returns (uint256) {
        if (utilization > WAD) utilization = WAD;
        if (reserveFactor > WAD) reserveFactor = WAD;
        uint256 borrowRate = getBorrowRate(utilization);
        return borrowRate * utilization * (WAD - reserveFactor) / (WAD * WAD);
    }
}
