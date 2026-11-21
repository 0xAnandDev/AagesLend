// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Hook the receipt token calls so the pool can block transfers that would make the sender unhealthy.
interface ILendingPool {
    function validateTransfer(address asset, address from) external view;
}
