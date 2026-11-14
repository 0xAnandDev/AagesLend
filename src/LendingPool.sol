// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable, Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

import {ALToken} from "./tokens/ALToken.sol";
import {IPriceOracle} from "./interfaces/IPriceOracle.sol";
import {IInterestRateModel} from "./interfaces/IInterestRateModel.sol";
import {ILendingPool} from "./interfaces/ILendingPool.sol";

/// @title LendingPool
/// @author AagesLend
/// @notice Over-collateralized money market. Users supply assets to earn interest (receiving ALToken
///         shares), borrow other assets against enabled collateral, and anyone can liquidate an account
///         whose health factor drops below 1.
/// @dev Design notes:
///      - Every state-changing entry point accrues interest on the markets it touches before reading state.
///        Views simulate pending accrual, so cross-market health checks always use up-to-date debt.
///      - Market cash is tracked internally, never via `balanceOf`, so token donations cannot move the
///        share price (first-depositor inflation attack). Share math also uses a virtual share/asset of 1.
///      - Rounding always favors the protocol: shares minted and collateral valued round down; shares
///        burned, debt owed and debt valued round up.
///      - Pausing stops supply, withdraw, borrow and collateral changes. Repay and liquidate always work.
///      - Fee-on-transfer and rebasing tokens are not supported.
contract LendingPool is ILendingPool, Ownable2Step, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using Math for uint256;

    // ---------------------------------------------------------------------
    // Constants
    // ---------------------------------------------------------------------

    uint256 public constant WAD = 1e18;
    uint256 public constant BPS = 10_000;
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    /// @notice Max markets, which bounds the gas of every health-factor loop.
    uint256 public constant MAX_ASSETS = 10;
    /// @notice Share of a borrower's debt in one asset that a single liquidation may repay.
    uint256 public constant CLOSE_FACTOR_BPS = 5000;
    /// @notice Below this health factor the whole debt may be liquidated at once.
    uint256 public constant FULL_LIQUIDATION_HF = 0.95e18;
    uint256 public constant MAX_LIQUIDATION_BONUS_BPS = 2000;
    uint256 public constant MAX_RESERVE_FACTOR_BPS = 5000;

    // ---------------------------------------------------------------------
    // Types and storage
    // ---------------------------------------------------------------------

    /// @param ltv Max borrow power of collateral, in bps (7500 = can borrow $75 per $100).
    /// @param liquidationThreshold Collateral weight in the health factor, in bps. Must be > ltv.
    /// @param liquidationBonus Discount a liquidator gets on seized collateral, in bps.
    /// @param reserveFactor Share of borrow interest kept by the protocol, in bps.
    /// @param supplyCap Max total supplied, in token units. 0 = no cap.
    /// @param borrowCap Max total borrowed, in token units. 0 = no cap.
    struct AssetConfig {
        uint16 ltv;
        uint16 liquidationThreshold;
        uint16 liquidationBonus;
        uint16 reserveFactor;
        bool borrowEnabled;
        uint256 supplyCap;
        uint256 borrowCap;
    }

    struct Market {
        bool listed;
        uint8 decimals;
        uint40 lastAccrual;
        ALToken alToken;
        IInterestRateModel irm;
        AssetConfig config;
        uint256 cash; // underlying held for this market (excludes donations)
        uint256 totalScaledDebt; // sum of users' scaled debt
        uint256 borrowIndex; // 1e18-scaled, grows with interest
        uint256 reserves; // protocol's share of interest, part of `cash + debt`
    }

    struct AccountData {
        uint256 collateralUsd; // 1e18 USD
        uint256 debtUsd; // 1e18 USD
        uint256 borrowLimitUsd; // collateral weighted by LTV
        uint256 liquidationLimitUsd; // collateral weighted by liquidation threshold
        uint256 healthFactor; // 1e18 = 1.0; type(uint256).max with no debt
    }

    struct MarketView {
        address asset;
        address alToken;
        uint8 decimals;
        AssetConfig config;
        uint256 cash;
        uint256 totalDebt;
        uint256 reserves;
        uint256 totalSupplied; // cash + debt - reserves
        uint256 utilization; // 1e18 = 100%
        uint256 borrowRate; // annual, 1e18 = 100%
        uint256 supplyRate; // annual, 1e18 = 100%
        uint256 exchangeRate; // underlying units redeemable for 1e18 shares
        uint256 price; // 1e18 USD per whole token
    }

    IPriceOracle public oracle;
    address[] internal _assets;
    mapping(address asset => Market) internal _markets;
    /// @notice user => asset => scaled debt (debt = scaled * borrowIndex / 1e18).
    mapping(address user => mapping(address asset => uint256)) public scaledDebtOf;
    /// @notice user => asset => whether the supplied asset counts as collateral.
    mapping(address user => mapping(address asset => bool)) public isCollateral;

    // ---------------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------------

    event MarketListed(address indexed asset, address indexed alToken, address irm);
    event AssetConfigUpdated(address indexed asset, AssetConfig config);
    event InterestRateModelUpdated(address indexed asset, address irm);
    event OracleUpdated(address indexed oracle);
    event InterestAccrued(address indexed asset, uint256 interest, uint256 borrowIndex, uint256 reserves);
    event Supply(
        address indexed asset, address indexed caller, address indexed onBehalfOf, uint256 assets, uint256 shares
    );
    event Withdraw(address indexed asset, address indexed user, address indexed to, uint256 assets, uint256 shares);
    event Borrow(address indexed asset, address indexed user, uint256 amount, uint256 scaledAmount);
    event Repay(address indexed asset, address indexed payer, address indexed onBehalfOf, uint256 amount);
    event CollateralToggled(address indexed user, address indexed asset, bool enabled);
    event Liquidation(
        address indexed liquidator,
        address indexed borrower,
        address indexed debtAsset,
        address collateralAsset,
        uint256 debtRepaid,
        uint256 collateralSeized,
        uint256 sharesSeized
    );
    event BadDebtWrittenOff(address indexed borrower, address indexed asset, uint256 amount, uint256 coveredByReserves);
    event ReservesWithdrawn(address indexed asset, address indexed to, uint256 amount);

    // ---------------------------------------------------------------------
    // Errors
    // ---------------------------------------------------------------------

    error ZeroAddress();
    error ZeroAmount();
    error MarketNotListed(address asset);
    error MarketAlreadyListed(address asset);
    error TooManyMarkets();
    error InvalidConfig();
    error SupplyCapExceeded();
    error BorrowCapExceeded();
    error BorrowNotEnabled();
    error InsufficientLiquidity();
    error InsufficientShares();
    error ExceedsBorrowLimit();
    error NotCollateral();
    error NoDebt();
    error HealthyPosition();
    error SelfLiquidation();
    error OnlyALToken();

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(address owner_, address oracle_) Ownable(owner_) {
        if (oracle_ == address(0)) revert ZeroAddress();
        oracle = IPriceOracle(oracle_);
        emit OracleUpdated(oracle_);
    }

    // ---------------------------------------------------------------------
    // User actions
    // ---------------------------------------------------------------------

    /// @notice Supply `amount` of `asset` and mint ALToken shares to `onBehalfOf`.
    /// @dev A user's own first supply of an asset with LTV > 0 enables it as collateral automatically.
    ///      Supplying on behalf of someone else never changes their collateral settings (prevents griefing a
    ///      user by making their health checks depend on an extra price feed).
    function supply(address asset, uint256 amount, address onBehalfOf)
        external
        nonReentrant
        whenNotPaused
        returns (uint256 shares)
    {
        if (amount == 0) revert ZeroAmount();
        if (onBehalfOf == address(0)) revert ZeroAddress();
        Market storage m = _accrue(asset);

        uint256 supplied = _totalSupplied(m);
        if (m.config.supplyCap != 0 && supplied + amount > m.config.supplyCap) revert SupplyCapExceeded();

        shares = _toShares(m, supplied, amount, Math.Rounding.Floor);
        if (shares == 0) revert ZeroAmount();

        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
        m.cash += amount;

        bool firstSupply = m.alToken.balanceOf(onBehalfOf) == 0;
        m.alToken.mint(onBehalfOf, shares);
        if (firstSupply && onBehalfOf == msg.sender && m.config.ltv > 0 && !isCollateral[onBehalfOf][asset]) {
            isCollateral[onBehalfOf][asset] = true;
            emit CollateralToggled(onBehalfOf, asset, true);
        }

        emit Supply(asset, msg.sender, onBehalfOf, amount, shares);
    }

    /// @notice Withdraw `amount` of `asset` to `to`. Pass type(uint256).max to withdraw everything.
    function withdraw(address asset, uint256 amount, address to)
        external
        nonReentrant
        whenNotPaused
        returns (uint256 withdrawn)
    {
        if (amount == 0) revert ZeroAmount();
        if (to == address(0)) revert ZeroAddress();
        Market storage m = _accrue(asset);

        uint256 balance = m.alToken.balanceOf(msg.sender);
        uint256 supplied = _totalSupplied(m);
        uint256 shares;
        if (amount == type(uint256).max) {
            shares = balance;
            withdrawn = _toAssets(m, supplied, shares, Math.Rounding.Floor);
        } else {
            shares = _toShares(m, supplied, amount, Math.Rounding.Ceil);
            withdrawn = amount;
        }
        if (shares == 0 || withdrawn == 0) revert ZeroAmount();
        if (shares > balance) revert InsufficientShares();
        if (withdrawn > m.cash) revert InsufficientLiquidity();

        m.alToken.burn(msg.sender, shares);
        m.cash -= withdrawn;

        _requireWithinBorrowLimit(msg.sender);

        IERC20(asset).safeTransfer(to, withdrawn);
        emit Withdraw(asset, msg.sender, to, withdrawn, shares);
    }

    /// @notice Borrow `amount` of `asset` against the caller's enabled collateral.
    function borrow(address asset, uint256 amount) external nonReentrant whenNotPaused {
        if (amount == 0) revert ZeroAmount();
        Market storage m = _accrue(asset);
        if (!m.config.borrowEnabled) revert BorrowNotEnabled();
        if (amount > m.cash) revert InsufficientLiquidity();

        uint256 scaled = amount.mulDiv(WAD, m.borrowIndex, Math.Rounding.Ceil);
        scaledDebtOf[msg.sender][asset] += scaled;
        m.totalScaledDebt += scaled;
        if (m.config.borrowCap != 0 && _totalDebt(m) > m.config.borrowCap) revert BorrowCapExceeded();
        m.cash -= amount;

        _requireWithinBorrowLimit(msg.sender);

        IERC20(asset).safeTransfer(msg.sender, amount);
        emit Borrow(asset, msg.sender, amount, scaled);
    }

    /// @notice Repay up to `amount` of `onBehalfOf`'s debt in `asset`. Pass type(uint256).max to repay all.
    /// @return paid The amount actually pulled from the caller.
    function repay(address asset, uint256 amount, address onBehalfOf) external nonReentrant returns (uint256 paid) {
        if (amount == 0) revert ZeroAmount();
        Market storage m = _accrue(asset);
        paid = _repay(m, asset, msg.sender, onBehalfOf, amount);
    }

    /// @notice Enable or disable a supplied asset as collateral.
    function setCollateral(address asset, bool enabled) external nonReentrant whenNotPaused {
        Market storage m = _accrue(asset);
        if (enabled && m.config.ltv == 0) revert NotCollateral();
        isCollateral[msg.sender][asset] = enabled;
        if (!enabled) _requireWithinBorrowLimit(msg.sender);
        emit CollateralToggled(msg.sender, asset, enabled);
    }

    /// @notice Repay part of an unhealthy borrower's debt and receive their collateral (as ALToken
    ///         shares) at a discount. Up to 50% of the debt per call, or 100% when HF < 0.95.
    /// @dev If the collateral can't cover the repay plus bonus, the liquidator gets all of it and repays
    ///      proportionally less. If the borrower is left with debt and no supply at all, the remaining debt is
    ///      written off (bad debt), first against protocol reserves, then shared by suppliers.
    /// @return repaid Debt repaid by the liquidator.
    /// @return seized Collateral (in underlying units) transferred to the liquidator as shares.
    function liquidate(address collateralAsset, address debtAsset, address borrower, uint256 repayAmount)
        external
        nonReentrant
        returns (uint256 repaid, uint256 seized)
    {
        if (borrower == msg.sender) revert SelfLiquidation();
        if (repayAmount == 0) revert ZeroAmount();
        Market storage dm = _accrue(debtAsset);
        Market storage cm = _accrue(collateralAsset);
        if (!isCollateral[borrower][collateralAsset]) revert NotCollateral();

        uint256 hf = _accountData(borrower).healthFactor;
        if (hf >= WAD) revert HealthyPosition();

        uint256 debt = _debtOf(dm, scaledDebtOf[borrower][debtAsset]);
        if (debt == 0) revert NoDebt();
        uint256 maxRepay = hf < FULL_LIQUIDATION_HF ? debt : debt * CLOSE_FACTOR_BPS / BPS;
        repaid = repayAmount < maxRepay ? repayAmount : maxRepay;

        uint256 sharesSeized;
        (repaid, seized, sharesSeized) = _computeSeize(dm, cm, debtAsset, collateralAsset, borrower, repaid);
        if (sharesSeized == 0) revert ZeroAmount();

        // repaid can round to 0 only when sweeping dust collateral; the write-off below then clears the debt.
        if (repaid != 0) _repay(dm, debtAsset, msg.sender, borrower, repaid);
        cm.alToken.seize(borrower, msg.sender, sharesSeized);

        emit Liquidation(msg.sender, borrower, debtAsset, collateralAsset, repaid, seized, sharesSeized);

        if (!_hasAnySupply(borrower)) _writeOffBadDebt(borrower);
    }

    // ---------------------------------------------------------------------
    // ALToken hook
    // ---------------------------------------------------------------------

    /// @inheritdoc ILendingPool
    function validateTransfer(address asset, address from) external view {
        if (msg.sender != address(_markets[asset].alToken)) revert OnlyALToken();
        if (isCollateral[from][asset]) _requireWithinBorrowLimit(from);
    }

    // ---------------------------------------------------------------------
    // Admin
    // ---------------------------------------------------------------------

    /// @notice List a new market and deploy its ALToken.
    function listMarket(address asset, address irm, AssetConfig calldata config)
        external
        onlyOwner
        returns (address alToken)
    {
        if (asset == address(0) || irm == address(0)) revert ZeroAddress();
        if (_markets[asset].listed) revert MarketAlreadyListed(asset);
        if (_assets.length >= MAX_ASSETS) revert TooManyMarkets();
        _validateConfig(config);

        uint8 dec = IERC20Metadata(asset).decimals();
        string memory sym = IERC20Metadata(asset).symbol();
        ALToken token = new ALToken(asset, dec, string.concat("AagesLend ", sym), string.concat("al", sym));

        Market storage m = _markets[asset];
        m.listed = true;
        m.decimals = dec;
        m.lastAccrual = uint40(block.timestamp);
        m.alToken = token;
        m.irm = IInterestRateModel(irm);
        m.config = config;
        m.borrowIndex = WAD;
        _assets.push(asset);

        emit MarketListed(asset, address(token), irm);
        emit AssetConfigUpdated(asset, config);
        return address(token);
    }

    function setAssetConfig(address asset, AssetConfig calldata config) external onlyOwner {
        _validateConfig(config);
        Market storage m = _accrue(asset);
        m.config = config;
        emit AssetConfigUpdated(asset, config);
    }

    function setInterestRateModel(address asset, address irm) external onlyOwner {
        if (irm == address(0)) revert ZeroAddress();
        Market storage m = _accrue(asset);
        m.irm = IInterestRateModel(irm);
        emit InterestRateModelUpdated(asset, irm);
    }

    function setOracle(address oracle_) external onlyOwner {
        if (oracle_ == address(0)) revert ZeroAddress();
        oracle = IPriceOracle(oracle_);
        emit OracleUpdated(oracle_);
    }

    /// @notice Send accrued protocol reserves to `to`.
    function withdrawReserves(address asset, uint256 amount, address to) external onlyOwner nonReentrant {
        if (to == address(0)) revert ZeroAddress();
        Market storage m = _accrue(asset);
        if (amount > m.reserves || amount > m.cash) revert InsufficientLiquidity();
        m.reserves -= amount;
        m.cash -= amount;
        IERC20(asset).safeTransfer(to, amount);
        emit ReservesWithdrawn(asset, to, amount);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Accrue interest on a market without doing anything else (keepers, tests).
    function accrueInterest(address asset) external {
        _accrue(asset);
    }

    // ---------------------------------------------------------------------
    // Views
    // ---------------------------------------------------------------------

    function getAssets() external view returns (address[] memory) {
        return _assets;
    }

    function getAssetConfig(address asset) external view returns (AssetConfig memory) {
        return _markets[asset].config;
    }

    function getALToken(address asset) external view returns (address) {
        return address(_markets[asset].alToken);
    }

    /// @notice Sum of all users' scaled debt in a market (for off-chain checks and invariant tests).
    function getTotalScaledDebt(address asset) external view returns (uint256) {
        return _markets[asset].totalScaledDebt;
    }

    /// @notice Account totals in USD (1e18) and health factor, including interest not yet accrued.
    function getUserAccountData(address user) external view returns (AccountData memory) {
        return _accountData(user);
    }

    /// @notice A user's position in one market, including interest not yet accrued.
    function getUserPosition(address user, address asset)
        external
        view
        returns (uint256 supplied, uint256 shares, uint256 debt, bool collateralEnabled)
    {
        Market memory m = _simulate(asset);
        shares = m.alToken.balanceOf(user);
        supplied = _toAssets(m, _totalSupplied(m), shares, Math.Rounding.Floor);
        debt = _debtOf(m, scaledDebtOf[user][asset]);
        collateralEnabled = isCollateral[user][asset];
    }

    /// @notice Current debt of `user` in `asset`, including interest not yet accrued.
    function debtOf(address user, address asset) external view returns (uint256) {
        Market memory m = _simulate(asset);
        return _debtOf(m, scaledDebtOf[user][asset]);
    }

    /// @notice Underlying redeemable for `shares` of the market's ALToken.
    function convertToAssets(address asset, uint256 shares) external view returns (uint256) {
        Market memory m = _simulate(asset);
        return _toAssets(m, _totalSupplied(m), shares, Math.Rounding.Floor);
    }

    /// @notice Everything the frontend needs about one market in one call.
    function getMarket(address asset) public view returns (MarketView memory v) {
        Market memory m = _simulate(asset);
        v.asset = asset;
        v.alToken = address(m.alToken);
        v.decimals = m.decimals;
        v.config = m.config;
        v.cash = m.cash;
        v.totalDebt = _totalDebt(m);
        v.reserves = m.reserves;
        v.totalSupplied = _totalSupplied(m);
        v.utilization = _utilization(m);
        v.borrowRate = m.irm.getBorrowRatePerSecond(v.utilization) * SECONDS_PER_YEAR;
        v.supplyRate = v.borrowRate * v.utilization * (BPS - m.config.reserveFactor) / (WAD * BPS);
        v.exchangeRate = _toAssets(m, v.totalSupplied, WAD, Math.Rounding.Floor);
        try oracle.getPrice(asset) returns (uint256 p) {
            v.price = p;
        } catch {}
    }

    function getAllMarkets() external view returns (MarketView[] memory views) {
        uint256 n = _assets.length;
        views = new MarketView[](n);
        for (uint256 i; i < n; ++i) {
            views[i] = getMarket(_assets[i]);
        }
    }

    // ---------------------------------------------------------------------
    // Internal: interest
    // ---------------------------------------------------------------------

    /// @dev Accrue interest on `asset` and return its storage pointer. Reverts if not listed.
    function _accrue(address asset) internal returns (Market storage m) {
        m = _markets[asset];
        if (!m.listed) revert MarketNotListed(asset);
        if (m.lastAccrual == block.timestamp) return m;

        (uint256 newIndex, uint256 interest) = _pendingInterest(m);
        m.borrowIndex = newIndex;
        m.reserves += interest * m.config.reserveFactor / BPS;
        m.lastAccrual = uint40(block.timestamp);
        emit InterestAccrued(asset, interest, newIndex, m.reserves);
    }

    /// @dev Copy of the market with pending interest applied, for views.
    function _simulate(address asset) internal view returns (Market memory m) {
        m = _markets[asset];
        if (!m.listed) revert MarketNotListed(asset);
        if (m.lastAccrual == block.timestamp) return m;
        (uint256 newIndex, uint256 interest) = _pendingInterest(m);
        m.borrowIndex = newIndex;
        m.reserves += interest * m.config.reserveFactor / BPS;
    }

    /// @dev Linear interest since last accrual: index *= 1 + rate * dt.
    function _pendingInterest(Market memory m) internal view returns (uint256 newIndex, uint256 interest) {
        uint256 dt = block.timestamp - m.lastAccrual;
        uint256 totalDebt = _totalDebt(m);
        if (dt == 0 || totalDebt == 0) return (m.borrowIndex, 0);
        uint256 factor = m.irm.getBorrowRatePerSecond(_utilization(m)) * dt;
        interest = totalDebt.mulDiv(factor, WAD);
        newIndex = m.borrowIndex + m.borrowIndex.mulDiv(factor, WAD);
    }

    function _totalDebt(Market memory m) internal pure returns (uint256) {
        return m.totalScaledDebt.mulDiv(m.borrowIndex, WAD, Math.Rounding.Ceil);
    }

    function _debtOf(Market memory m, uint256 scaled) internal pure returns (uint256) {
        return scaled.mulDiv(m.borrowIndex, WAD, Math.Rounding.Ceil);
    }

    /// @dev What suppliers collectively own: cash + outstanding debt - protocol reserves.
    function _totalSupplied(Market memory m) internal pure returns (uint256) {
        uint256 gross = m.cash + _totalDebt(m);
        return gross > m.reserves ? gross - m.reserves : 0;
    }

    function _utilization(Market memory m) internal pure returns (uint256) {
        uint256 debt = _totalDebt(m);
        uint256 supplied = _totalSupplied(m);
        if (debt == 0 || supplied == 0) return 0;
        uint256 u = debt.mulDiv(WAD, supplied);
        return u > WAD ? WAD : u;
    }

    // ---------------------------------------------------------------------
    // Internal: share math (virtual 1 share / 1 asset offset)
    // ---------------------------------------------------------------------

    function _toShares(Market memory m, uint256 supplied, uint256 assets, Math.Rounding r)
        internal
        view
        returns (uint256)
    {
        return assets.mulDiv(m.alToken.totalSupply() + 1, supplied + 1, r);
    }

    function _toAssets(Market memory m, uint256 supplied, uint256 shares, Math.Rounding r)
        internal
        view
        returns (uint256)
    {
        return shares.mulDiv(supplied + 1, m.alToken.totalSupply() + 1, r);
    }

    // ---------------------------------------------------------------------
    // Internal: accounting
    // ---------------------------------------------------------------------

    function _repay(Market storage m, address asset, address payer, address onBehalfOf, uint256 amount)
        internal
        returns (uint256 paid)
    {
        uint256 scaled = scaledDebtOf[onBehalfOf][asset];
        uint256 debt = _debtOf(m, scaled);
        if (debt == 0) revert NoDebt();

        paid = amount < debt ? amount : debt;
        uint256 scaledBurn = paid == debt ? scaled : paid.mulDiv(WAD, m.borrowIndex, Math.Rounding.Floor);

        scaledDebtOf[onBehalfOf][asset] = scaled - scaledBurn;
        m.totalScaledDebt -= scaledBurn;
        m.cash += paid;

        IERC20(asset).safeTransferFrom(payer, address(this), paid);
        emit Repay(asset, payer, onBehalfOf, paid);
    }

    struct SeizeVars {
        uint256 debtPrice;
        uint256 collPrice;
        uint256 debtUnit;
        uint256 collUnit;
        uint256 bonusBps;
        uint256 balance;
        uint256 supplied;
        uint256 available;
    }

    function _computeSeize(
        Market storage dm,
        Market storage cm,
        address debtAsset,
        address collateralAsset,
        address borrower,
        uint256 repay_
    ) internal view returns (uint256 repaid, uint256 seized, uint256 shares) {
        SeizeVars memory v;
        v.debtPrice = oracle.getPrice(debtAsset);
        v.collPrice = oracle.getPrice(collateralAsset);
        v.debtUnit = 10 ** dm.decimals;
        v.collUnit = 10 ** cm.decimals;
        v.bonusBps = BPS + cm.config.liquidationBonus;

        // USD value of the repay, then collateral worth that value plus the bonus. Round down (protocol side).
        uint256 repayUsd = repay_.mulDiv(v.debtPrice, v.debtUnit);
        seized = repayUsd.mulDiv(v.bonusBps * v.collUnit, BPS * v.collPrice);

        v.balance = cm.alToken.balanceOf(borrower);
        v.supplied = _totalSupplied(cm);
        v.available = _toAssets(cm, v.supplied, v.balance, Math.Rounding.Floor);

        if (seized >= v.available) {
            // Not enough collateral: take all of it and repay only what it is worth (rounded up).
            seized = v.available;
            shares = v.balance;
            uint256 collUsd = v.available.mulDiv(v.collPrice, v.collUnit);
            repaid = collUsd.mulDiv(BPS * v.debtUnit, v.bonusBps * v.debtPrice, Math.Rounding.Ceil);
            if (repaid > repay_) repaid = repay_;
        } else {
            repaid = repay_;
            shares = _toShares(cm, v.supplied, seized, Math.Rounding.Floor);
        }
    }

    /// @dev Any supply counts, collateral or not: debt is only forgiven once the borrower holds nothing in the
    ///      pool. Otherwise someone could keep a non-collateral deposit and have their debt written off.
    function _hasAnySupply(address user) internal view returns (bool) {
        uint256 n = _assets.length;
        for (uint256 i; i < n; ++i) {
            if (_markets[_assets[i]].alToken.balanceOf(user) > 0) return true;
        }
        return false;
    }

    /// @dev Remove all remaining debt of a borrower with no collateral. Reserves absorb it first.
    function _writeOffBadDebt(address user) internal {
        uint256 n = _assets.length;
        for (uint256 i; i < n; ++i) {
            address a = _assets[i];
            uint256 scaled = scaledDebtOf[user][a];
            if (scaled == 0) continue;
            Market storage m = _accrue(a);
            uint256 amount = _debtOf(m, scaled);
            scaledDebtOf[user][a] = 0;
            m.totalScaledDebt -= scaled;
            uint256 covered = amount < m.reserves ? amount : m.reserves;
            m.reserves -= covered;
            emit BadDebtWrittenOff(user, a, amount, covered);
        }
    }

    function _accountData(address user) internal view returns (AccountData memory d) {
        uint256 n = _assets.length;
        for (uint256 i; i < n; ++i) {
            address a = _assets[i];
            bool coll = isCollateral[user][a];
            uint256 shares = coll ? _markets[a].alToken.balanceOf(user) : 0;
            uint256 scaled = scaledDebtOf[user][a];
            if (shares == 0 && scaled == 0) continue;

            Market memory m = _simulate(a);
            uint256 price = oracle.getPrice(a);
            uint256 unit = 10 ** m.decimals;

            if (shares != 0) {
                uint256 assets = _toAssets(m, _totalSupplied(m), shares, Math.Rounding.Floor);
                uint256 usd = assets.mulDiv(price, unit);
                d.collateralUsd += usd;
                d.borrowLimitUsd += usd * m.config.ltv / BPS;
                d.liquidationLimitUsd += usd * m.config.liquidationThreshold / BPS;
            }
            if (scaled != 0) {
                d.debtUsd += _debtOf(m, scaled).mulDiv(price, unit, Math.Rounding.Ceil);
            }
        }
        d.healthFactor = d.debtUsd == 0 ? type(uint256).max : d.liquidationLimitUsd.mulDiv(WAD, d.debtUsd);
    }

    /// @dev Borrow, withdraw, transfer and collateral changes must leave debt within the LTV limit
    ///      (stricter than HF >= 1, so a user can't withdraw straight to the edge of liquidation).
    function _requireWithinBorrowLimit(address user) internal view {
        if (!_hasDebt(user)) return;
        AccountData memory d = _accountData(user);
        if (d.debtUsd > d.borrowLimitUsd) revert ExceedsBorrowLimit();
    }

    function _hasDebt(address user) internal view returns (bool) {
        uint256 n = _assets.length;
        for (uint256 i; i < n; ++i) {
            if (scaledDebtOf[user][_assets[i]] != 0) return true;
        }
        return false;
    }

    function _validateConfig(AssetConfig calldata c) internal pure {
        if (c.liquidationThreshold > BPS || c.ltv > c.liquidationThreshold) revert InvalidConfig();
        if (c.ltv != 0 && c.ltv == c.liquidationThreshold) revert InvalidConfig();
        if (c.liquidationBonus > MAX_LIQUIDATION_BONUS_BPS) revert InvalidConfig();
        if (c.reserveFactor > MAX_RESERVE_FACTOR_BPS) revert InvalidConfig();
        // Seizing threshold * (1 + bonus) must stay under 100%, or liquidations would worsen HF.
        if (uint256(c.liquidationThreshold) * (BPS + c.liquidationBonus) / BPS >= BPS) revert InvalidConfig();
    }
}
