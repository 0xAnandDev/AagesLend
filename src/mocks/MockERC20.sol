// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockERC20
/// @notice Test token with configurable decimals and a rate-limited public faucet for testnet demos.
contract MockERC20 is ERC20 {
    uint8 private immutable _decimals;
    /// @notice Max tokens (in whole units) one faucet call gives.
    uint256 public immutable faucetAmount;
    uint256 public constant FAUCET_COOLDOWN = 1 days;

    mapping(address => uint256) public lastFaucet;

    error FaucetCooldown(uint256 availableAt);

    constructor(string memory name_, string memory symbol_, uint8 decimals_, uint256 faucetWholeTokens)
        ERC20(name_, symbol_)
    {
        _decimals = decimals_;
        faucetAmount = faucetWholeTokens * 10 ** decimals_;
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    /// @notice Anyone can mint `faucetAmount` once per day. Testnet only.
    function faucet() external {
        uint256 next = lastFaucet[msg.sender] + FAUCET_COOLDOWN;
        if (lastFaucet[msg.sender] != 0 && block.timestamp < next) revert FaucetCooldown(next);
        lastFaucet[msg.sender] = block.timestamp;
        _mint(msg.sender, faucetAmount);
    }

    /// @notice Unrestricted mint for tests and local scripts. Never deploy this token as a real asset.
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
