// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseTest} from "../utils/BaseTest.sol";
import {LendingPool} from "../../src/LendingPool.sol";
import {ALToken} from "../../src/tokens/ALToken.sol";
import {MockERC20} from "../../src/mocks/MockERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @notice Regression tests for the attacks that drained the old AagesLendCore, plus known DeFi attack patterns.
contract SecurityTest is BaseTest {
    /// Old bug 1: anyone could whitelist their own worthless token.
    function test_onlyOwnerCanListMarkets() public {
        MockERC20 junk = new MockERC20("Junk", "JUNK", 18, 0);
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, bob));
        pool.listMarket(address(junk), address(stableIrm), _cfg(8000, 8500, 500, 1000));
    }

    /// Old bug 2+3: borrow at a 1:1 price, then withdraw the collateral and walk away.
    function test_borrowThenWithdrawCollateralIsBlocked() public {
        _supply(alice, weth, 100e18);
        _supply(bob, usdc, 1000e6); // $1000 of USDC buys $800 of WETH, not 0.8 WETH ($1600)
        vm.prank(bob);
        vm.expectRevert(LendingPool.ExceedsBorrowLimit.selector);
        pool.borrow(address(weth), 0.8e18);

        _borrow(bob, weth, 0.4e18); // $800, exactly the limit
        vm.prank(bob);
        vm.expectRevert(LendingPool.ExceedsBorrowLimit.selector);
        pool.withdraw(address(usdc), 1e6, bob);
    }

    /// First-depositor inflation attack: donate tokens to skew the share price and steal the next deposit.
    function test_inflationAttackDoesNotWork() public {
        address attacker = makeAddr("attacker");
        vm.prank(attacker);
        usdc.approve(address(pool), type(uint256).max);
        _supply(attacker, usdc, 1); // 1 share
        usdc.mint(attacker, 1_000_000e6);
        vm.prank(attacker);
        usdc.transfer(address(pool), 1_000_000e6); // donation is ignored: cash is tracked internally

        _supply(alice, usdc, 1000e6);
        (uint256 aliceAssets,,,) = pool.getUserPosition(alice, address(usdc));
        assertApproxEqAbs(aliceAssets, 1000e6, 1, "victim keeps full value");
        (uint256 attackerAssets,,,) = pool.getUserPosition(attacker, address(usdc));
        assertLe(attackerAssets, 1, "attacker gains nothing");
    }

    function test_transferOfCollateralBlockedIfItBreaksLimit() public {
        _supply(alice, usdc, 10_000e6);
        _supply(bob, weth, 1e18);
        _borrow(bob, usdc, 1400e6);
        vm.prank(bob);
        vm.expectRevert(LendingPool.ExceedsBorrowLimit.selector);
        alWeth.transfer(carol, 0.5e18);
    }

    function test_transferAllowedWithoutDebt() public {
        _supply(bob, weth, 1e18);
        vm.prank(bob);
        alWeth.transfer(carol, 0.5e18);
        assertEq(alWeth.balanceOf(carol), 0.5e18);
    }

    function test_transferFromAlsoChecked() public {
        _supply(alice, usdc, 10_000e6);
        _supply(bob, weth, 1e18);
        _borrow(bob, usdc, 1400e6);
        vm.prank(bob);
        alWeth.approve(carol, type(uint256).max);
        vm.prank(carol);
        vm.expectRevert(LendingPool.ExceedsBorrowLimit.selector);
        alWeth.transferFrom(bob, carol, 0.5e18);
    }

    function test_onlyPoolCanMintBurnSeize() public {
        vm.startPrank(bob);
        vm.expectRevert(ALToken.OnlyPool.selector);
        alWeth.mint(bob, 1);
        vm.expectRevert(ALToken.OnlyPool.selector);
        alWeth.burn(bob, 1);
        vm.expectRevert(ALToken.OnlyPool.selector);
        alWeth.seize(alice, bob, 1);
        vm.stopPrank();
    }

    function test_validateTransferOnlyCallableByALToken() public {
        vm.expectRevert(LendingPool.OnlyALToken.selector);
        pool.validateTransfer(address(weth), bob);
    }

    function test_adminFunctionsAreOwnerOnly() public {
        vm.startPrank(bob);
        bytes memory err = abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, bob);
        vm.expectRevert(err);
        pool.setAssetConfig(address(usdc), _cfg(1, 2, 0, 0));
        vm.expectRevert(err);
        pool.setOracle(bob);
        vm.expectRevert(err);
        pool.withdrawReserves(address(usdc), 0, bob);
        vm.expectRevert(err);
        pool.pause();
        vm.stopPrank();
    }

    function test_ownershipTransferIsTwoStep() public {
        vm.prank(admin);
        pool.transferOwnership(bob);
        assertEq(pool.owner(), admin);
        vm.prank(bob);
        pool.acceptOwnership();
        assertEq(pool.owner(), bob);
    }

    function test_configValidation() public {
        vm.startPrank(admin);
        vm.expectRevert(LendingPool.InvalidConfig.selector);
        pool.setAssetConfig(address(usdc), _cfg(9000, 8500, 500, 1000)); // ltv > threshold
        vm.expectRevert(LendingPool.InvalidConfig.selector);
        pool.setAssetConfig(address(usdc), _cfg(8000, 8000, 500, 1000)); // ltv == threshold
        vm.expectRevert(LendingPool.InvalidConfig.selector);
        pool.setAssetConfig(address(usdc), _cfg(9000, 9600, 500, 1000)); // threshold * 1.05 >= 100%
        vm.expectRevert(LendingPool.InvalidConfig.selector);
        pool.setAssetConfig(address(usdc), _cfg(8000, 8500, 2500, 1000)); // bonus too high
        vm.expectRevert(LendingPool.InvalidConfig.selector);
        pool.setAssetConfig(address(usdc), _cfg(8000, 8500, 500, 6000)); // reserve factor too high
        vm.stopPrank();
    }

    function test_cannotListTwiceOrPastMax() public {
        vm.startPrank(admin);
        vm.expectRevert(abi.encodeWithSelector(LendingPool.MarketAlreadyListed.selector, address(usdc)));
        pool.listMarket(address(usdc), address(stableIrm), _cfg(8000, 8500, 500, 1000));
        for (uint256 i = 3; i < pool.MAX_ASSETS(); ++i) {
            pool.listMarket(address(new MockERC20("T", "T", 18, 0)), address(stableIrm), _cfg(0, 0, 0, 0));
        }
        address extra = address(new MockERC20("T", "T", 18, 0));
        vm.expectRevert(LendingPool.TooManyMarkets.selector);
        pool.listMarket(extra, address(stableIrm), _cfg(0, 0, 0, 0));
        vm.stopPrank();
    }

    function test_faucetCooldown() public {
        vm.startPrank(bob);
        usdc.faucet();
        assertEq(usdc.balanceOf(bob), 10_000e6);
        vm.expectRevert();
        usdc.faucet();
        skip(1 days);
        usdc.faucet();
        vm.stopPrank();
        assertEq(usdc.balanceOf(bob), 20_000e6);
    }
}
