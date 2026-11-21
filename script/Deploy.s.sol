// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {LendingPool} from "../src/LendingPool.sol";
import {InterestRateModel} from "../src/InterestRateModel.sol";
import {ChainlinkOracle} from "../src/oracle/ChainlinkOracle.sol";
import {MockERC20} from "../src/mocks/MockERC20.sol";
import {MockV3Aggregator} from "../src/mocks/MockV3Aggregator.sol";
import {ALToken} from "../src/tokens/ALToken.sol";

/// @title Deploy
/// @notice Deploys the full protocol: test tokens, oracle (real Chainlink feeds when given, mocks otherwise),
///         rate models, the pool and its three markets, then seeds liquidity and writes
///         `deployments/<chainId>.json` for the frontend, indexer and keeper.
/// @dev Optional env vars:
///      ETH_USD_FEED, BTC_USD_FEED, USDC_USD_FEED  Chainlink proxy addresses. Unset = deploy a mock feed.
///      SEQUENCER_UPTIME_FEED   Chainlink L2 sequencer feed. Unset on a non-local chain = deploy a mock
///                              (Chainlink only publishes this feed on mainnets, not Arbitrum Sepolia).
///      FEED_HEARTBEAT          Max price age in seconds (default 1 day + 1 hour of slack for real feeds,
///                              30 days for mocks).
///      SEED_LIQUIDITY          true/false, default true. Supplies starter liquidity from the deployer.
///      WRITE_DEPLOYMENT        true/false, default true. Tests set it to false.
contract Deploy is Script {
    struct Feeds {
        address usdc;
        address weth;
        address wbtc;
        address sequencer;
        bool usdcMock;
        bool wethMock;
        bool wbtcMock;
        bool sequencerMock;
    }

    LendingPool public pool;
    ChainlinkOracle public oracle;
    MockERC20 public usdc;
    MockERC20 public weth;
    MockERC20 public wbtc;
    InterestRateModel public stableIrm;
    InterestRateModel public volatileIrm;
    Feeds public feeds;

    function run() external {
        bool isLocal = block.chainid == 31_337;
        vm.startBroadcast();
        // The broadcasting account (from --account / --private-key) becomes the owner.
        (, address deployer,) = vm.readCallers();
        console.log("Deployer:", deployer);
        console.log("Chain id:", block.chainid);

        // 1. Test tokens with a public daily faucet.
        usdc = new MockERC20("USD Coin", "USDC", 6, 10_000);
        weth = new MockERC20("Wrapped Ether", "WETH", 18, 5);
        wbtc = new MockERC20("Wrapped BTC", "WBTC", 8, 1);

        // 2. Price feeds: real Chainlink if configured, otherwise mocks the admin can move for demos.
        feeds = _feeds(isLocal);

        // 3. Oracle.
        oracle = new ChainlinkOracle(deployer);
        uint32 realHeartbeat = uint32(vm.envOr("FEED_HEARTBEAT", uint256(1 days + 1 hours)));
        uint32 mockHeartbeat = uint32(vm.envOr("FEED_HEARTBEAT", uint256(30 days)));
        oracle.setFeed(address(usdc), feeds.usdc, feeds.usdcMock ? mockHeartbeat : realHeartbeat, 0.9e18, 1.1e18);
        oracle.setFeed(address(weth), feeds.weth, feeds.wethMock ? mockHeartbeat : realHeartbeat, 0, 0);
        oracle.setFeed(address(wbtc), feeds.wbtc, feeds.wbtcMock ? mockHeartbeat : realHeartbeat, 0, 0);
        if (feeds.sequencer != address(0)) oracle.setSequencerUptimeFeed(feeds.sequencer, 1 hours);

        // 4. Rate models. Stable: 4% at 90% utilization, steep above. Volatile: 7% at 80%, steeper above.
        stableIrm = new InterestRateModel(0, 0.04e18, 0.6e18, 0.9e18);
        volatileIrm = new InterestRateModel(0, 0.07e18, 3e18, 0.8e18);

        // 5. Pool and markets. Caps keep a public testnet deployment small.
        pool = new LendingPool(deployer, address(oracle));
        pool.listMarket(
            address(usdc), _alToken(usdc), address(stableIrm), _cfg(8000, 8500, 500, 1000, 10_000_000e6, 8_000_000e6)
        );
        pool.listMarket(
            address(weth), _alToken(weth), address(volatileIrm), _cfg(7500, 8000, 500, 1500, 5000e18, 4000e18)
        );
        pool.listMarket(address(wbtc), _alToken(wbtc), address(volatileIrm), _cfg(7000, 7500, 1000, 2000, 200e8, 150e8));

        // 6. Starter liquidity so the app is usable straight away.
        if (vm.envOr("SEED_LIQUIDITY", true)) _seed(deployer);

        vm.stopBroadcast();

        if (vm.envOr("WRITE_DEPLOYMENT", true)) _write(deployer);
    }

    function _feeds(bool isLocal) internal returns (Feeds memory f) {
        f.usdc = vm.envOr("USDC_USD_FEED", address(0));
        f.weth = vm.envOr("ETH_USD_FEED", address(0));
        f.wbtc = vm.envOr("BTC_USD_FEED", address(0));
        f.sequencer = vm.envOr("SEQUENCER_UPTIME_FEED", address(0));

        if (f.usdc == address(0)) (f.usdc, f.usdcMock) = (address(new MockV3Aggregator(8, 1e8)), true);
        if (f.weth == address(0)) (f.weth, f.wethMock) = (address(new MockV3Aggregator(8, 3000e8)), true);
        if (f.wbtc == address(0)) (f.wbtc, f.wbtcMock) = (address(new MockV3Aggregator(8, 90_000e8)), true);

        if (f.sequencer == address(0) && !isLocal) {
            // Status 0 = up, and "up since" 1 day ago so the grace period is already over.
            MockV3Aggregator seq = new MockV3Aggregator(0, 0);
            seq.setRoundData(0, block.timestamp - 1 days, block.timestamp);
            (f.sequencer, f.sequencerMock) = (address(seq), true);
        }
    }

    function _alToken(MockERC20 token) internal returns (address) {
        string memory sym = token.symbol();
        return address(
            new ALToken(
                address(pool),
                address(token),
                token.decimals(),
                string.concat("AagesLend ", sym),
                string.concat("al", sym)
            )
        );
    }

    function _seed(address deployer) internal {
        uint256 u = 1_000_000e6;
        uint256 e = 300e18;
        uint256 b = 10e8;
        usdc.mint(deployer, u);
        weth.mint(deployer, e);
        wbtc.mint(deployer, b);
        usdc.approve(address(pool), u);
        weth.approve(address(pool), e);
        wbtc.approve(address(pool), b);
        pool.supply(address(usdc), u, deployer);
        pool.supply(address(weth), e, deployer);
        pool.supply(address(wbtc), b, deployer);
    }

    function _cfg(uint16 ltv, uint16 lt, uint16 bonus, uint16 rf, uint256 supplyCap, uint256 borrowCap)
        internal
        pure
        returns (LendingPool.AssetConfig memory)
    {
        return LendingPool.AssetConfig({
            ltv: ltv,
            liquidationThreshold: lt,
            liquidationBonus: bonus,
            reserveFactor: rf,
            borrowEnabled: true,
            supplyCap: supplyCap,
            borrowCap: borrowCap
        });
    }

    function _write(address deployer) internal {
        string memory o = "deployment";
        vm.serializeUint(o, "chainId", block.chainid);
        vm.serializeUint(o, "startBlock", block.number);
        vm.serializeAddress(o, "deployer", deployer);
        vm.serializeAddress(o, "LendingPool", address(pool));
        vm.serializeAddress(o, "ChainlinkOracle", address(oracle));
        vm.serializeAddress(o, "StableRateModel", address(stableIrm));
        vm.serializeAddress(o, "VolatileRateModel", address(volatileIrm));
        vm.serializeAddress(o, "USDC", address(usdc));
        vm.serializeAddress(o, "WETH", address(weth));
        vm.serializeAddress(o, "WBTC", address(wbtc));
        vm.serializeAddress(o, "alUSDC", pool.getALToken(address(usdc)));
        vm.serializeAddress(o, "alWETH", pool.getALToken(address(weth)));
        vm.serializeAddress(o, "alWBTC", pool.getALToken(address(wbtc)));
        vm.serializeAddress(o, "USDC_USD_FEED", feeds.usdc);
        vm.serializeAddress(o, "ETH_USD_FEED", feeds.weth);
        vm.serializeAddress(o, "BTC_USD_FEED", feeds.wbtc);
        vm.serializeAddress(o, "SEQUENCER_UPTIME_FEED", feeds.sequencer);
        string memory json = vm.serializeBool(o, "mockFeeds", feeds.usdcMock || feeds.wethMock || feeds.wbtcMock);

        string memory path = string.concat(vm.projectRoot(), "/deployments/", vm.toString(block.chainid), ".json");
        vm.writeJson(json, path);
        console.log("Wrote", path);
    }
}
