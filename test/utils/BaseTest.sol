// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {LendingPool} from "../../src/LendingPool.sol";
import {InterestRateModel} from "../../src/InterestRateModel.sol";
import {ChainlinkOracle} from "../../src/oracle/ChainlinkOracle.sol";
import {ALToken} from "../../src/tokens/ALToken.sol";
import {MockERC20} from "../../src/mocks/MockERC20.sol";
import {MockV3Aggregator} from "../../src/mocks/MockV3Aggregator.sol";

/// @notice Shared fixture: USDC (6 dec, $1), WETH (18 dec, $2000), WBTC (8 dec, $60k) with 8-decimal feeds.
abstract contract BaseTest is Test {
    LendingPool internal pool;
    ChainlinkOracle internal oracle;
    InterestRateModel internal stableIrm;
    InterestRateModel internal volatileIrm;

    MockERC20 internal usdc;
    MockERC20 internal weth;
    MockERC20 internal wbtc;
    MockV3Aggregator internal usdcFeed;
    MockV3Aggregator internal wethFeed;
    MockV3Aggregator internal wbtcFeed;

    ALToken internal alUsdc;
    ALToken internal alWeth;
    ALToken internal alWbtc;

    address internal admin = makeAddr("admin");
    address internal alice = makeAddr("alice"); // supplier
    address internal bob = makeAddr("bob"); // borrower
    address internal carol = makeAddr("carol"); // liquidator

    uint32 internal constant HEARTBEAT = 1 days;

    function setUp() public virtual {
        vm.warp(1_700_000_000);

        usdc = new MockERC20("USD Coin", "USDC", 6, 10_000);
        weth = new MockERC20("Wrapped Ether", "WETH", 18, 5);
        wbtc = new MockERC20("Wrapped BTC", "WBTC", 8, 1);

        usdcFeed = new MockV3Aggregator(8, 1e8);
        wethFeed = new MockV3Aggregator(8, 2000e8);
        wbtcFeed = new MockV3Aggregator(8, 60_000e8);

        vm.startPrank(admin);
        oracle = new ChainlinkOracle(admin);
        oracle.setFeed(address(usdc), address(usdcFeed), HEARTBEAT, 0.9e18, 1.1e18);
        oracle.setFeed(address(weth), address(wethFeed), HEARTBEAT, 0, 0);
        oracle.setFeed(address(wbtc), address(wbtcFeed), HEARTBEAT, 0, 0);

        // Stablecoin: 0% base, 4% at 90% utilization, +60% above. Volatile: 0% base, 7% at 80%, +300% above.
        stableIrm = new InterestRateModel(0, 0.04e18, 0.6e18, 0.9e18);
        volatileIrm = new InterestRateModel(0, 0.07e18, 3e18, 0.8e18);

        pool = new LendingPool(admin, address(oracle));
        alUsdc = _newALToken(usdc);
        alWeth = _newALToken(weth);
        alWbtc = _newALToken(wbtc);
        pool.listMarket(address(usdc), address(alUsdc), address(stableIrm), _cfg(8000, 8500, 500, 1000));
        pool.listMarket(address(weth), address(alWeth), address(volatileIrm), _cfg(7500, 8000, 500, 1500));
        pool.listMarket(address(wbtc), address(alWbtc), address(volatileIrm), _cfg(7000, 7500, 1000, 2000));
        vm.stopPrank();

        address[4] memory users = [alice, bob, carol, admin];
        for (uint256 i; i < users.length; ++i) {
            vm.startPrank(users[i]);
            usdc.approve(address(pool), type(uint256).max);
            weth.approve(address(pool), type(uint256).max);
            wbtc.approve(address(pool), type(uint256).max);
            vm.stopPrank();
        }
    }

    function _newALToken(MockERC20 token) internal returns (ALToken) {
        string memory sym = token.symbol();
        return new ALToken(
            address(pool), address(token), token.decimals(), string.concat("AagesLend ", sym), string.concat("al", sym)
        );
    }

    function _cfg(uint16 ltv, uint16 lt, uint16 bonus, uint16 rf)
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
            supplyCap: 0,
            borrowCap: 0
        });
    }

    function _supply(address user, MockERC20 token, uint256 amount) internal {
        token.mint(user, amount);
        vm.prank(user);
        pool.supply(address(token), amount, user);
    }

    function _borrow(address user, MockERC20 token, uint256 amount) internal {
        vm.prank(user);
        pool.borrow(address(token), amount);
    }

    function _hf(address user) internal view returns (uint256) {
        return pool.getUserAccountData(user).healthFactor;
    }

    /// @dev Move a feed and refresh the other feeds so nothing goes stale after a time warp.
    function _setPrice(MockV3Aggregator feed, int256 answer) internal {
        feed.updateAnswer(answer);
    }

    function _refreshFeeds() internal {
        usdcFeed.updateAnswer(usdcFeed.answer());
        wethFeed.updateAnswer(wethFeed.answer());
        wbtcFeed.updateAnswer(wbtcFeed.answer());
    }

    function _skip(uint256 secs) internal {
        skip(secs);
        _refreshFeeds();
    }
}
