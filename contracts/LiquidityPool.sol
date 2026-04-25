// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title LiquidityPool
 * @dev Pool management for AagesLend Protocol.
 */
contract LiquidityPool is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // State tracking variables
    // Total liquidity deposited per token
    mapping(address => uint256) public totalLiquidity;
    // Liquidity remaining available in the pool per token
    mapping(address => uint256) public availableLiquidity;
    // Total funds borrowed out of the pool per token
    mapping(address => uint256) public totalBorrowed;

    // LP Token tracking (Structured as internal variables for simplicity)
    // user => token => LP token balance
    mapping(address => mapping(address => uint256)) public lpTokens;

    // Defines how much interest goes to reserve (e.g. 1000 = 10%)
    uint256 public constant RESERVE_FACTOR = 1000;
    
    // To protect direct core calls
    address public aagesLendCore;

    // Events
    event LiquidityAdded(address indexed user, address indexed token, uint256 amount);
    event LiquidityRemoved(address indexed user, address indexed token, uint256 amount);
    event BorrowFromPool(address indexed token, uint256 amount);
    event RepayToPool(address indexed token, uint256 amount);

    modifier onlyCore() {
        require(msg.sender == aagesLendCore, "AagesLend: Only Core can call");
        _;
    }

    constructor(address _coreAddress) {
        aagesLendCore = _coreAddress;
    }

    /**
     * @notice Lenders add funds to the pool
     * @param token Address of token being deposited
     * @param amount Amount to deposit
     */
    function addLiquidity(address token, uint256 amount) external nonReentrant {
        require(amount > 0, "AagesLend: Initial deposit must be strictly positive");
        
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        totalLiquidity[token] += amount;
        availableLiquidity[token] += amount;
        
        // Mint LP tokens representing pool share (1:1 simplification)
        lpTokens[msg.sender][token] += amount; 

        emit LiquidityAdded(msg.sender, token, amount);
    }

    /**
     * @notice Lenders withdraw their funds along with interest derived from LP share
     * @param token Address of withdrawn token
     * @param amount Unscaled amount to withdraw
     */
    function removeLiquidity(address token, uint256 amount) external nonReentrant {
        require(amount > 0, "AagesLend: Withdrawal amount must be greater than 0");
        require(lpTokens[msg.sender][token] >= amount, "AagesLend: Insufficient LP token balance");
        require(availableLiquidity[token] >= amount, "AagesLend: Insufficient available liquidity");

        // Burn LP tokens based on share
        lpTokens[msg.sender][token] -= amount; 
        
        totalLiquidity[token] -= amount;
        availableLiquidity[token] -= amount;
        
        IERC20(token).safeTransfer(msg.sender, amount);
        
        emit LiquidityRemoved(msg.sender, token, amount);
    }

    /**
     * @notice Called when AagesLendCore initiates a borrow
     * @param token Underlying borrowed asset
     * @param amount Asset units
     */
    function borrowFromPool(address token, uint256 amount) external onlyCore nonReentrant {
        require(availableLiquidity[token] >= amount, "AagesLend: Liquidity pool lacks requested capacity");
        
        availableLiquidity[token] -= amount;
        totalBorrowed[token] += amount;
        
        IERC20(token).safeTransfer(msg.sender, amount); // transfer to Core/Borrower
        
        emit BorrowFromPool(token, amount);
    }

    /**
     * @notice Called by Core during Repay sequence
     * @param token Repayment token logic
     * @param amount Quantity expected
     */
    function repayToPool(address token, uint256 amount) external onlyCore nonReentrant {
        require(amount > 0, "AagesLend: Payment must be greater than zero");
        
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        // Example implementation with interest mapping (Assume amount encompasses both principal and interest)
        // Calculating Reserve Factor Cut 
        uint256 totalInterest = 0; // Requires InterestRateModel calculation ideally 
        uint256 reserveAmount = (totalInterest * RESERVE_FACTOR) / 10000;
        
        availableLiquidity[token] += (amount - reserveAmount);
        
        if(totalBorrowed[token] >= amount) {
            totalBorrowed[token] -= amount; // Reduce overall principal tracking if less than outstanding borrow
        } else {
            totalBorrowed[token] = 0;
        }
        
        emit RepayToPool(token, amount);
    }

    /**
     * @notice Find the utilization percent ratio of the pool context.
     * @param token Base asset to reference.
     */
    function getUtilizationRatio(address token) external view returns (uint256) {
        if (totalLiquidity[token] == 0) return 0;
        return (totalBorrowed[token] * 10000) / totalLiquidity[token]; // Rendered in BPS
    }
}
