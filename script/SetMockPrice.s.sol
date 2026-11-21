// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {MockV3Aggregator} from "../src/mocks/MockV3Aggregator.sol";

/// @title SetMockPrice
/// @notice Move a mock price feed, e.g. to push a demo position under water and show a liquidation.
///         Also refreshes the timestamp, so run it with the current price to keep a mock feed from going stale.
/// @dev FEED=<mock feed address> PRICE=<price with 8 decimals, e.g. 250000000000 for $2,500>
contract SetMockPrice is Script {
    function run() external {
        MockV3Aggregator feed = MockV3Aggregator(vm.envAddress("FEED"));
        int256 price = vm.envInt("PRICE");
        console.log("Old price:", uint256(feed.answer()));
        vm.startBroadcast();
        feed.updateAnswer(price);
        vm.stopBroadcast();
        console.log("New price:", uint256(price));
    }
}
