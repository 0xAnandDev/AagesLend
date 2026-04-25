// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AagesLendCore
 * @dev Main lending contract for AagesLend Protocol.
 */
contract AagesLendCore is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // State variables
    // mapping of users to their deposits (user => token => amount)
    mapping(address => mapping(address => uint256)) public deposits;
    // mapping of users to their borrows (user => token => amount)
    mapping(address => mapping(address => uint256)) public borrows;
    // mapping of collateral to max LTV (loan-to-value) in basis points (e.g. 8000 = 80%)
    mapping(address => uint256) public maxLTV;
    
    // mapping of supported tokens (whitelist)
    mapping(address => bool) public supportedTokens;
    address[] public supportedTokenList;

    // Events
    event Deposit(address indexed user, address indexed token, uint256 amount);
    event Borrow(address indexed user, address indexed borrowToken, uint256 borrowAmount, address indexed collateralToken, uint256 collateralAmount);
    event Repay(address indexed user, address indexed token, uint256 amount);
    event Withdraw(address indexed user, address indexed token, uint256 amount);
    event Liquidation(address indexed liquidator, address indexed borrower, address indexed collateralToken, uint256 collateralAmount);

    modifier onlyWhitelisted(address token) {
        require(supportedTokens[token], "AagesLend: Token not whitelisted");
        _;
    }

    constructor() {}

    /**
     * @dev Add a token to the whitelist.
     * @param token Token address.
     * @param ltv Maximum Loan-To-Value in basis points.
     */
    function addSupportedToken(address token, uint256 ltv) external {
        // Require AccessControl/Ownable in production
        require(ltv <= 8000, "AagesLend: LTV cannot exceed 80%");
        if (!supportedTokens[token]) {
            supportedTokens[token] = true;
            supportedTokenList.push(token);
        }
        maxLTV[token] = ltv;
    }

    /**
     * @notice Users deposit to earn interest
     * @param token Address of the token to deposit
     * @param amount Amount to deposit
     */
    function deposit(address token, uint256 amount) external nonReentrant onlyWhitelisted(token) {
        require(amount > 0, "AagesLend: Deposit amount must be greater than 0");
        
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        deposits[msg.sender][token] += amount;
        
        emit Deposit(msg.sender, token, amount);
    }

    /**
     * @notice Borrow against collateral
     * @param collateral Address of the collateral token
     * @param collateralAmount Amount of collateral to deposit
     * @param borrowToken Address of the token to borrow
     * @param borrowAmount Amount to borrow
     */
    function borrow(address collateral, uint256 collateralAmount, address borrowToken, uint256 borrowAmount) 
        external 
        nonReentrant 
        onlyWhitelisted(collateral) 
        onlyWhitelisted(borrowToken) 
    {
        require(collateralAmount > 0 && borrowAmount > 0, "AagesLend: Amounts must be greater than 0");
        
        uint256 ltv = maxLTV[collateral];
        require(ltv > 0, "AagesLend: Collateral not accepted for borrowing");
        require(ltv <= 8000, "AagesLend: LTV cannot exceed 80%"); // Safety enforce LTV requirements

        // Without PriceOracle integration, assuming 1:1 price ratio for demonstration
        // Enforce basic LTV constraint based on assumption
        uint256 maxBorrowAmount = (collateralAmount * ltv) / 10000;
        require(borrowAmount <= maxBorrowAmount, "AagesLend: Borrow limits exceeded max LTV");

        // Lock collateral from borrower
        IERC20(collateral).safeTransferFrom(msg.sender, address(this), collateralAmount);
        
        // Update user positions
        deposits[msg.sender][collateral] += collateralAmount; 
        borrows[msg.sender][borrowToken] += borrowAmount;

        // Disburse borrowed tokens
        IERC20(borrowToken).safeTransfer(msg.sender, borrowAmount);

        emit Borrow(msg.sender, borrowToken, borrowAmount, collateral, collateralAmount);
    }

    /**
     * @notice Repay borrowed amount
     * @param token Address of the borrowed token
     * @param amount Amount to repay
     * @param borrower Address of the borrower to repay on behalf of
     */
    function repay(address token, uint256 amount, address borrower) external nonReentrant onlyWhitelisted(token) {
        require(amount > 0, "AagesLend: Repay amount must be greater than 0");
        require(borrows[borrower][token] >= amount, "AagesLend: Repay amount exceeds current borrow balance");

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        borrows[borrower][token] -= amount;

        emit Repay(borrower, token, amount);
    }

    /**
     * @notice Withdraw lent funds
     * @param token Address of the deposited token
     * @param amount Amount to withdraw
     */
    function withdraw(address token, uint256 amount) external nonReentrant {
        require(amount > 0, "AagesLend: Withdraw amount must be greater than 0");
        require(deposits[msg.sender][token] >= amount, "AagesLend: Insufficient funds to withdraw");

        deposits[msg.sender][token] -= amount;
        IERC20(token).safeTransfer(msg.sender, amount);

        emit Withdraw(msg.sender, token, amount);
    }

    /**
     * @notice Liquidate undercollateralized positions
     * @param borrower Address of the undercollateralized borrower
     * @param collateral Address of the collateral token to seize
     */
    function liquidate(address borrower, address collateral) external nonReentrant {
        // Logic will utilize an Oracle to check user Health Factor.
        // Requires Integration with a real Price Oracle moving forward.

        emit Liquidation(msg.sender, borrower, collateral, 0); // Event stub
    }
}
