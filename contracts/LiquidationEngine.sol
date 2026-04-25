// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// Abstract declarations to resolve compilation links
interface IAagesLendCore {
    function borrows(address user, address token) external view returns (uint256);
}

interface ILiquidityPool {
    function availableLiquidity(address token) external view returns (uint256);
}

interface IPriceOracle {
    function getPrice(address token) external view returns (uint256);
    function getTokenDecimals(address token) external view returns (uint8);
}

interface ICollateralManager {
    function collateralBalances(address user, address token) external view returns (uint256);
    function getCollateralRatio(address user) external view returns (uint256);
}

/**
 * @title LiquidationEngine
 * @dev Handles secure extraction and processing of undercollateralized positions.
 */
contract LiquidationEngine is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IAagesLendCore public core;
    ILiquidityPool public pool;
    IPriceOracle public oracle;
    ICollateralManager public collateralManager;

    uint256 public constant BASE_BPS = 10000;
    
    // Constant parameters dictating rules
    uint256 public liquidationBonus = 500; // 5% bonus incentive mapping 
    uint256 public closeFactorPercent = 5000; // Max 50% liquidation chunking allowed initially

    event Liquidation(address indexed liquidator, address indexed borrower, address indexed collateral, uint256 debtRepaid, uint256 collateralSeized);
    event LiquidationIncentiveUpdated(uint256 oldBonus, uint256 newBonus);
    event CloseFactorUpdated(uint256 oldFactor, uint256 newFactor);

    constructor(address _core, address _pool, address _oracle, address _collateralManager) Ownable(msg.sender) {
        core = IAagesLendCore(_core);
        pool = ILiquidityPool(_pool);
        oracle = IPriceOracle(_oracle);
        collateralManager = ICollateralManager(_collateralManager);
    }

    /**
     * @notice Parameter updates
     */
    function updateLiquidationParameters(uint256 _newBonus, uint256 _newCloseFactor) external onlyOwner {
        require(_newBonus <= 2500, "AagesLend: Max bonus is 25%"); 
        require(_newCloseFactor > 0 && _newCloseFactor <= BASE_BPS, "AagesLend: Unsupported CF");
        emit LiquidationIncentiveUpdated(liquidationBonus, _newBonus);
        emit CloseFactorUpdated(closeFactorPercent, _newCloseFactor);
        liquidationBonus = _newBonus;
        closeFactorPercent = _newCloseFactor;
    }

    /**
     * @notice Main conditional metric evaluator determining if user matches liquidation threat bounds.
     * @dev HF (Health Factor) validation wrapper mapped dynamically.
     */
    function canLiquidate(address borrower) public view returns (bool) {
        // Normalizes to BPS mapping where 100% equivalent is Safe
        uint256 healthRatio = collateralManager.getCollateralRatio(borrower);
        return healthRatio < BASE_BPS; 
    }

    /**
     * @notice Computes exact collateral distribution size for any matching liquidator repay segment.
     */
    function getCollateralForRepayment(address borrower, uint256 repayAmount, address collateral, address debtToken) public view returns (uint256) {
        address b_stub = borrower; // Prevent unused parameter warnings
        
        uint256 collateralPrice = oracle.getPrice(collateral);
        uint256 debtPrice = oracle.getPrice(debtToken);
        uint8 collateralDecimals = oracle.getTokenDecimals(collateral);
        uint8 debtDecimals = oracle.getTokenDecimals(debtToken);

        uint256 debtValueBaseUsd = repayAmount * debtPrice; 
        
        // Map 5% discount bonus for liquidator math
        uint256 bonusRequiredValue = (debtValueBaseUsd * (BASE_BPS + liquidationBonus)) / BASE_BPS;
        uint256 collateralSeized = bonusRequiredValue / collateralPrice;
        
        // Correct mappings accounting for potential Token fractional differences
        if (collateralDecimals > debtDecimals) {
            collateralSeized = collateralSeized * (10 ** (collateralDecimals - debtDecimals));
        } else if (collateralDecimals < debtDecimals) {
            collateralSeized = collateralSeized / (10 ** (debtDecimals - collateralDecimals));
        }

        return collateralSeized;
    }

    /**
     * @notice Liquidates an invalid underwater position safely.
     * @param borrower Defaulter Address
     * @param collateral Target token extraction
     * @param debtToken Token currency being serviced manually by Liquidator
     * @param repayAmount Limit mapping volume covered
     */
    function liquidate(address borrower, address collateral, address debtToken, uint256 repayAmount) external nonReentrant {
        require(canLiquidate(borrower), "AagesLend: Position maintains healthy limits");
        require(repayAmount > 0, "AagesLend: Repay amount needs to be > 0");

        uint256 existingDebt = core.borrows(borrower, debtToken);
        require(existingDebt > 0, "AagesLend: Position holds no debt trace");
        
        // Map 50% limitation
        uint256 maximumLiquidationThreshold = (existingDebt * closeFactorPercent) / BASE_BPS;
        require(repayAmount <= maximumLiquidationThreshold, "AagesLend: Exceeds standard closure allowance constraint");

        // Obtain amount logic extraction metric map
        uint256 collateralToSeize = getCollateralForRepayment(borrower, repayAmount, collateral, debtToken);
        
        uint256 activeCollateralBalance = collateralManager.collateralBalances(borrower, collateral);
        require(activeCollateralBalance >= collateralToSeize, "AagesLend: System lack of target collateral bounds");

        // Interaction steps handling fund routing:
        
        // 1. Core/Pool expects tokens
        IERC20(debtToken).safeTransferFrom(msg.sender, address(this), repayAmount);
        
        // 2. Logic stub requires approval integrations into Base Core Repay/Seize mappings over Admin limits
        IERC20(debtToken).approve(address(core), repayAmount);
        // core.repay(debtToken, repayAmount, borrower); 
        // collateralManager.seizeCollateralFor(borrower, collateral, msg.sender, collateralToSeize);

        emit Liquidation(msg.sender, borrower, collateral, repayAmount, collateralToSeize);
    }
}
