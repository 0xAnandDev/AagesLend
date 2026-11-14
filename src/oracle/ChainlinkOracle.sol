// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable, Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {IAggregatorV3} from "../interfaces/IAggregatorV3.sol";
import {IPriceOracle} from "../interfaces/IPriceOracle.sol";

/// @title ChainlinkOracle
/// @notice Reads Chainlink USD feeds and rejects any price that is unsafe to lend against.
/// @dev Checks, in order: L2 sequencer is up and past its grace period, answer > 0, round is complete,
///      answer is not older than the feed heartbeat, and answer is inside admin-set sanity bounds
///      (protects against a feed clamping at its floor during a crash, as happened with LUNA).
contract ChainlinkOracle is IPriceOracle, Ownable2Step {
    struct FeedConfig {
        IAggregatorV3 feed;
        uint32 heartbeat; // max seconds between updates before the price is stale
        uint8 feedDecimals;
        uint256 minPrice; // 1e18-scaled USD bounds; 0 disables the check
        uint256 maxPrice;
    }

    /// @notice Chainlink L2 sequencer uptime feed. Zero address on L1 or local chains.
    IAggregatorV3 public sequencerUptimeFeed;
    /// @notice Seconds to wait after the sequencer comes back up before prices are trusted again.
    uint256 public sequencerGracePeriod = 1 hours;

    mapping(address asset => FeedConfig) public feeds;

    event FeedSet(address indexed asset, address indexed feed, uint32 heartbeat, uint256 minPrice, uint256 maxPrice);
    event SequencerFeedSet(address indexed feed, uint256 gracePeriod);

    error FeedNotSet(address asset);
    error InvalidFeedConfig();
    error InvalidPrice(address asset, int256 answer);
    error StalePrice(address asset, uint256 updatedAt);
    error PriceOutOfBounds(address asset, uint256 price);
    error SequencerDown();
    error SequencerGracePeriodNotOver();

    constructor(address owner_) Ownable(owner_) {}

    /// @notice Register or update the feed for `asset`.
    function setFeed(address asset, address feed, uint32 heartbeat, uint256 minPrice, uint256 maxPrice)
        external
        onlyOwner
    {
        if (asset == address(0) || feed == address(0) || heartbeat == 0) revert InvalidFeedConfig();
        if (maxPrice != 0 && minPrice >= maxPrice) revert InvalidFeedConfig();
        uint8 dec = IAggregatorV3(feed).decimals();
        if (dec > 18) revert InvalidFeedConfig();
        feeds[asset] = FeedConfig(IAggregatorV3(feed), heartbeat, dec, minPrice, maxPrice);
        emit FeedSet(asset, feed, heartbeat, minPrice, maxPrice);
    }

    /// @notice Set the L2 sequencer uptime feed. Pass address(0) to disable (L1 / local).
    function setSequencerUptimeFeed(address feed, uint256 gracePeriod) external onlyOwner {
        sequencerUptimeFeed = IAggregatorV3(feed);
        sequencerGracePeriod = gracePeriod;
        emit SequencerFeedSet(feed, gracePeriod);
    }

    /// @inheritdoc IPriceOracle
    function getPrice(address asset) external view returns (uint256 price) {
        _checkSequencer();

        FeedConfig memory cfg = feeds[asset];
        if (address(cfg.feed) == address(0)) revert FeedNotSet(asset);

        (, int256 answer,, uint256 updatedAt,) = cfg.feed.latestRoundData();
        if (answer <= 0) revert InvalidPrice(asset, answer);
        if (updatedAt == 0 || updatedAt > block.timestamp || block.timestamp - updatedAt > cfg.heartbeat) {
            revert StalePrice(asset, updatedAt);
        }

        // casting to 'uint256' is safe because answer > 0 was checked above
        // forge-lint: disable-next-line(unsafe-typecast)
        price = uint256(answer) * 10 ** (18 - cfg.feedDecimals);
        if ((cfg.minPrice != 0 && price < cfg.minPrice) || (cfg.maxPrice != 0 && price > cfg.maxPrice)) {
            revert PriceOutOfBounds(asset, price);
        }
    }

    function _checkSequencer() internal view {
        IAggregatorV3 seq = sequencerUptimeFeed;
        if (address(seq) == address(0)) return;
        (, int256 answer, uint256 startedAt,,) = seq.latestRoundData();
        // answer: 0 = up, 1 = down. startedAt = when the current status began.
        if (answer != 0) revert SequencerDown();
        if (startedAt == 0 || block.timestamp - startedAt <= sequencerGracePeriod) {
            revert SequencerGracePeriodNotOver();
        }
    }
}
