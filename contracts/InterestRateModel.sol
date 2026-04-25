// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title InterestRateModel
 * @dev Interest calculation model for AagesLend Protocol. Calculates rates based on pool utilization.
 */
contract InterestRateModel is Ownable {
    // Ratios are expressed in basis points (10000 = 100%)
    uint256 public constant BASE_BPS = 10000;
    uint256 public constant SECONDS_PER_YEAR = 31536000;

    // Rate model parameters
    uint256 public baseRate;        // Base minimum interest rate
    uint256 public slope1Rate;      // Rate below the kink utilization threshold
    uint256 public slope2Rate;      // Rate above the kink utilization threshold
    uint256 public kink;            // Optimal utilization threshold
    uint256 public reserveFactor;   // Percentage of interest reserved for the protocol

    event RateUpdated(string parameter, uint256 oldRate, uint256 newRate);

    constructor() Ownable(msg.sender) {
        baseRate = 200;       // 2% base rate
        slope1Rate = 500;     // 5% slope 1
        slope2Rate = 2000;    // 20% slope 2
        kink = 8000;          // 80% utilization threshold
        reserveFactor = 1000; // 10% reserve factor
    }

    /**
     * @notice Adjusts the base rate via Admin
     */
    function updateBaseRate(uint256 _baseRate) external onlyOwner {
        emit RateUpdated("baseRate", baseRate, _baseRate);
        baseRate = _baseRate;
    }

    /**
     * @notice Adjusts the slope1 rate via Admin
     */
    function updateSlope1Rate(uint256 _slope1Rate) external onlyOwner {
        emit RateUpdated("slope1Rate", slope1Rate, _slope1Rate);
        slope1Rate = _slope1Rate;
    }

    /**
     * @notice Adjusts the slope2 rate via Admin
     */
    function updateSlope2Rate(uint256 _slope2Rate) external onlyOwner {
        emit RateUpdated("slope2Rate", slope2Rate, _slope2Rate);
        slope2Rate = _slope2Rate;
    }

    /**
     * @notice Adjusts the kink threshold via Admin
     */
    function updateKink(uint256 _kink) external onlyOwner {
        require(_kink <= BASE_BPS, "AagesLend: Kink cannot exceed 100%");
        emit RateUpdated("kink", kink, _kink);
        kink = _kink;
    }

    /**
     * @notice Adjusts the reserve factor via Admin
     */
    function updateReserveFactor(uint256 _reserveFactor) external onlyOwner {
        require(_reserveFactor <= BASE_BPS, "AagesLend: Reserve factor cannot exceed 100%");
        emit RateUpdated("reserveFactor", reserveFactor, _reserveFactor);
        reserveFactor = _reserveFactor;
    }

    /**
     * @notice Calculates the Borrow Rate based on current utilization.
     * @param utilizationRatio The pool's utilization ratio in basis points.
     * @return borrowRate The annualized borrow rate in basis points.
     */
    function getBorrowRate(uint256 utilizationRatio) public view returns (uint256 borrowRate) {
        if (utilizationRatio <= kink) {
            // Formula: baseRate + (utilization * slope1)
            borrowRate = baseRate + ((utilizationRatio * slope1Rate) / BASE_BPS);
        } else {
            // Formula: baseRate + (kink * slope1) + ((utilization - kink) * slope2)
            uint256 normalRate = (kink * slope1Rate) / BASE_BPS;
            uint256 excessUtil = utilizationRatio - kink;
            uint256 jumpRate = (excessUtil * slope2Rate) / BASE_BPS;
            borrowRate = baseRate + normalRate + jumpRate;
        }
    }

    /**
     * @notice Calculates the Supply Rate based on current utilization.
     * @param utilizationRatio The pool's utilization ratio in basis points.
     * @return supplyRate The annualized supply rate in basis points.
     */
    function getSupplyRate(uint256 utilizationRatio) public view returns (uint256 supplyRate) {
        if (utilizationRatio == 0) return 0;
        
        uint256 borrowRate = getBorrowRate(utilizationRatio);
        
        // supplyRate = borrowRate * (1 - reserveFactor) * utilizationRatio
        uint256 rateToProviders = (borrowRate * (BASE_BPS - reserveFactor)) / BASE_BPS;
        supplyRate = (rateToProviders * utilizationRatio) / BASE_BPS;
    }

    /**
     * @notice Reusable calculation logic for simple interest accrual.
     * @param principal Core token balance
     * @param rate Annualized rate mapped to basis points
     * @param timeElapsed Timestamp differential
     */
    function calculateInterest(uint256 principal, uint256 rate, uint256 timeElapsed) public pure returns (uint256) {
        // Calculates linear interest based on time elapsed
        return (principal * rate * timeElapsed) / (BASE_BPS * SECONDS_PER_YEAR);
    }
}
