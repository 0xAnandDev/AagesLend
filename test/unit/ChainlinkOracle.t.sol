// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseTest} from "../utils/BaseTest.sol";
import {ChainlinkOracle} from "../../src/oracle/ChainlinkOracle.sol";
import {MockV3Aggregator} from "../../src/mocks/MockV3Aggregator.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract ChainlinkOracleTest is BaseTest {
    MockV3Aggregator internal sequencer;

    function test_normalizesTo18Decimals() public view {
        assertEq(oracle.getPrice(address(weth)), 2000e18);
        assertEq(oracle.getPrice(address(usdc)), 1e18);
    }

    function test_revertsOnStalePrice() public {
        skip(HEARTBEAT + 1);
        vm.expectRevert(
            abi.encodeWithSelector(ChainlinkOracle.StalePrice.selector, address(weth), block.timestamp - HEARTBEAT - 1)
        );
        oracle.getPrice(address(weth));
    }

    function test_revertsOnZeroOrNegativePrice() public {
        wethFeed.updateAnswer(0);
        vm.expectRevert(abi.encodeWithSelector(ChainlinkOracle.InvalidPrice.selector, address(weth), int256(0)));
        oracle.getPrice(address(weth));
        wethFeed.updateAnswer(-1);
        vm.expectRevert(abi.encodeWithSelector(ChainlinkOracle.InvalidPrice.selector, address(weth), int256(-1)));
        oracle.getPrice(address(weth));
    }

    function test_revertsOnIncompleteRound() public {
        wethFeed.setRoundData(2000e8, block.timestamp, 0);
        vm.expectRevert(abi.encodeWithSelector(ChainlinkOracle.StalePrice.selector, address(weth), 0));
        oracle.getPrice(address(weth));
    }

    function test_revertsOutsideSanityBounds() public {
        // USDC depeg to $0.85 is below the $0.90 floor: refuse to price it rather than trust it.
        usdcFeed.updateAnswer(0.85e8);
        vm.expectRevert(abi.encodeWithSelector(ChainlinkOracle.PriceOutOfBounds.selector, address(usdc), 0.85e18));
        oracle.getPrice(address(usdc));
    }

    function test_revertsForUnknownAsset() public {
        address x = makeAddr("x");
        vm.expectRevert(abi.encodeWithSelector(ChainlinkOracle.FeedNotSet.selector, x));
        oracle.getPrice(x);
    }

    function test_onlyOwnerCanSetFeeds() public {
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, bob));
        oracle.setFeed(address(weth), address(wethFeed), 1, 0, 0);
    }

    function test_rejectsBadFeedConfig() public {
        vm.startPrank(admin);
        vm.expectRevert(ChainlinkOracle.InvalidFeedConfig.selector);
        oracle.setFeed(address(weth), address(wethFeed), 0, 0, 0);
        vm.expectRevert(ChainlinkOracle.InvalidFeedConfig.selector);
        oracle.setFeed(address(weth), address(wethFeed), 1, 5, 5);
        vm.stopPrank();
    }

    function _withSequencer() internal {
        sequencer = new MockV3Aggregator(0, 0);
        vm.prank(admin);
        oracle.setSequencerUptimeFeed(address(sequencer), 1 hours);
    }

    function test_sequencerDownBlocksPrices() public {
        _withSequencer();
        sequencer.updateAnswer(1);
        vm.expectRevert(ChainlinkOracle.SequencerDown.selector);
        oracle.getPrice(address(weth));
    }

    function test_sequencerGracePeriod() public {
        _withSequencer();
        vm.expectRevert(ChainlinkOracle.SequencerGracePeriodNotOver.selector);
        oracle.getPrice(address(weth));

        skip(1 hours + 1);
        _refreshFeeds();
        assertEq(oracle.getPrice(address(weth)), 2000e18);
    }

    function test_sequencerDownBlocksBorrow() public {
        _supply(alice, usdc, 10_000e6);
        _supply(bob, weth, 1e18);
        _withSequencer();
        sequencer.updateAnswer(1);
        vm.prank(bob);
        vm.expectRevert(ChainlinkOracle.SequencerDown.selector);
        pool.borrow(address(usdc), 100e6);
    }
}
