// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Price source used by the LendingPool.
interface IPriceOracle {
    /// @notice USD price of one whole unit of `asset`, scaled to 1e18. Reverts if the price is unusable.
    function getPrice(address asset) external view returns (uint256);
}
