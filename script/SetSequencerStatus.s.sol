// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {MockV3Aggregator} from "../src/mocks/MockV3Aggregator.sol";

/// @title SetSequencerStatus
/// @notice Flip the mock L2 sequencer feed to demo the oracle's downtime protection.
/// @dev FEED=<mock sequencer address> DOWN=true|false. Coming back up starts the 1-hour grace period.
contract SetSequencerStatus is Script {
    function run() external {
        MockV3Aggregator feed = MockV3Aggregator(vm.envAddress("FEED"));
        bool down = vm.envBool("DOWN");
        vm.startBroadcast();
        feed.updateAnswer(down ? int256(1) : int256(0));
        vm.stopBroadcast();
    }
}
