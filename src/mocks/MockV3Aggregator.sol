// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IAggregatorV3} from "../interfaces/IAggregatorV3.sol";

/// @title MockV3Aggregator
/// @notice Settable Chainlink-style feed for tests and local deployments. Also usable as a sequencer feed.
contract MockV3Aggregator is IAggregatorV3 {
    uint8 public immutable decimals;
    uint80 public roundId;
    int256 public answer;
    uint256 public startedAt;
    uint256 public updatedAt;

    constructor(uint8 decimals_, int256 initialAnswer) {
        decimals = decimals_;
        updateAnswer(initialAnswer);
    }

    function updateAnswer(int256 newAnswer) public {
        roundId++;
        answer = newAnswer;
        startedAt = block.timestamp;
        updatedAt = block.timestamp;
    }

    function setRoundData(int256 answer_, uint256 startedAt_, uint256 updatedAt_) external {
        roundId++;
        answer = answer_;
        startedAt = startedAt_;
        updatedAt = updatedAt_;
    }

    function latestRoundData() external view returns (uint80, int256, uint256, uint256, uint80) {
        return (roundId, answer, startedAt, updatedAt, roundId);
    }
}
