// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title PriceOracle (Mock Version)
 * @dev Simple manual price oracle for testing (NO Chainlink dependency)
 */
contract PriceOracle is Ownable, Pausable {

    // 🔥 Manual price storage (token => price)
    mapping(address => uint256) public prices;

    event PriceManuallySet(address indexed token, uint256 price);
    event PriceTimeoutUpdated(uint256 oldTimeout, uint256 newTimeout);

    uint256 public priceTimeout = 3600; // unused for now (kept for compatibility)

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Set price manually (USED IN DEPLOY SCRIPT)
     * @param token Token address
     * @param price Price with 8 decimals (IMPORTANT)
     */
    function setPrice(address token, uint256 price) external onlyOwner {
        require(price > 0, "AagesLend: Invalid price");
        prices[token] = price;
        emit PriceManuallySet(token, price);
    }

    /**
     * @notice Get price of token
     */
    function getPrice(address token) public view whenNotPaused returns (uint256) {
        uint256 price = prices[token];
        require(price > 0, "AagesLend: Price not set");
        return price;
    }

    /**
     * @notice Batch price fetch
     */
    function getPrices(address[] calldata tokens) external view returns (uint256[] memory) {
        uint256[] memory result = new uint256[](tokens.length);
        for (uint256 i = 0; i < tokens.length; i++) {
            result[i] = getPrice(tokens[i]);
        }
        return result;
    }

    /**
     * @notice Optional admin control (kept for future use)
     */
    function setPriceTimeout(uint256 _newTimeout) external onlyOwner {
        emit PriceTimeoutUpdated(priceTimeout, _newTimeout);
        priceTimeout = _newTimeout;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}