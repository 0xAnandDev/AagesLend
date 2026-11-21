// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Deploy} from "../../script/Deploy.s.sol";
import {LendingPool} from "../../src/LendingPool.sol";
import {ChainlinkOracle} from "../../src/oracle/ChainlinkOracle.sol";

/// @notice Runs the real deploy script against the test EVM so a broken script fails CI, not a live deploy.
contract DeployScriptTest is Test {
    function setUp() public {
        vm.setEnv("WRITE_DEPLOYMENT", "false");
    }

    function test_deployScriptOnLocalChain() public {
        vm.chainId(31_337);
        vm.warp(1_700_000_000);
        vm.setEnv("SEED_LIQUIDITY", "true");
        Deploy d = new Deploy();
        d.run();

        LendingPool pool = d.pool();
        assertEq(pool.getAssets().length, 3);
        assertEq(pool.getMarket(address(d.usdc())).totalSupplied, 1_000_000e6);
        assertEq(pool.getMarket(address(d.weth())).price, 3000e18);
        assertEq(address(d.oracle().sequencerUptimeFeed()), address(0), "no sequencer feed locally");
    }

    function test_deployScriptOnL2UsesSequencerFeed() public {
        vm.chainId(421_614);
        vm.warp(1_700_000_000);
        Deploy d = new Deploy();
        d.run();
        ChainlinkOracle oracle = d.oracle();
        assertTrue(address(oracle.sequencerUptimeFeed()) != address(0));
        // Mock sequencer is "up since 1 day ago", so prices are usable right away.
        assertEq(oracle.getPrice(address(d.wbtc())), 90_000e18);
    }
}
