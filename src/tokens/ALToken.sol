// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ILendingPool} from "../interfaces/ILendingPool.sol";

/// @title ALToken
/// @notice Interest-bearing receipt token for one market (cToken style). The balance is a number of
///         shares; each share is redeemable for a growing amount of the underlying as borrowers pay
///         interest. Use `LendingPool.getUserPosition` or `LendingPool.convertToAssets` to price it.
/// @dev Only the pool can mint, burn or seize. User transfers ask the pool to confirm the sender stays
///      within its borrow limit, so collateral can't be moved out from under an open loan.
contract ALToken is ERC20 {
    address public immutable pool;
    address public immutable underlying;
    uint8 private immutable _decimals;

    error OnlyPool();

    modifier onlyPool() {
        if (msg.sender != pool) revert OnlyPool();
        _;
    }

    constructor(address underlying_, uint8 decimals_, string memory name_, string memory symbol_)
        ERC20(name_, symbol_)
    {
        pool = msg.sender;
        underlying = underlying_;
        _decimals = decimals_;
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    function mint(address to, uint256 shares) external onlyPool {
        _mint(to, shares);
    }

    function burn(address from, uint256 shares) external onlyPool {
        _burn(from, shares);
    }

    /// @notice Move shares from a liquidated borrower to the liquidator, skipping the health check.
    function seize(address from, address to, uint256 shares) external onlyPool {
        _transfer(from, to, shares);
    }

    function transfer(address to, uint256 value) public override returns (bool) {
        super.transfer(to, value);
        ILendingPool(pool).validateTransfer(underlying, msg.sender);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) public override returns (bool) {
        super.transferFrom(from, to, value);
        ILendingPool(pool).validateTransfer(underlying, from);
        return true;
    }
}
