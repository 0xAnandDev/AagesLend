# AagesLend Security Review

Scope: `src/LendingPool.sol`, `src/tokens/ALToken.sol`, `src/oracle/ChainlinkOracle.sol`, `src/InterestRateModel.sol`.
Type: internal self-review plus automated testing. **This is not a professional audit.** Do not deploy with real funds.

## 1. Issues in the previous version (v0.1, `AagesLendCore`)

| ID | Severity | Issue | Status |
|---|---|---|---|
| V1-01 | Critical | `addSupportedToken` had no access control. Anyone could list a worthless token as collateral. | Fixed: `listMarket` is `onlyOwner` (Ownable2Step). Test: `test_onlyOwnerCanListMarkets` |
| V1-02 | Critical | `borrow` valued every token at $1 ("1:1 for demonstration"). | Fixed: all limits use Chainlink USD prices. Test: `test_borrow_usesOraclePrice` |
| V1-03 | Critical | Collateral and deposits shared one balance, and `withdraw` had no health check: borrow, then withdraw collateral, drains the pool. Reproduced with a 4-transaction PoC. | Fixed: every withdraw, transfer and collateral toggle is gated by the LTV limit. Test: `test_borrowThenWithdrawCollateralIsBlocked` |
| V1-04 | High | Liquidation was a stub; `LiquidationEngine.liquidate` took the liquidator's tokens and did nothing with them. | Fixed: real liquidation with close factor, bonus and bad-debt handling |
| V1-05 | High | No interest: lenders earned 0%, debt never grew. | Fixed: kinked rate model with per-market borrow index |
| V1-06 | Medium | Manual owner-set oracle with no staleness check. | Fixed: Chainlink with heartbeat, round completeness, bounds and sequencer checks |

## 2. Findings from reviewing the new code (all fixed before deployment)

| ID | Severity | Finding | Fix |
|---|---|---|---|
| R-01 | Medium | **Debt forgiven while the borrower still had funds in the pool.** Bad debt was written off when the borrower had no *collateral-enabled* supply left, so a borrower who kept a deposit with collateral turned off would keep it and lose their debt. | Write-off now requires zero supply in every market. Test: `test_badDebt_notWrittenOffWhileBorrowerHoldsNonCollateralSupply` |
| R-02 | Low | **Collateral griefing via `supply(onBehalfOf)`.** A third party could supply 1 wei on behalf of a victim and auto-enable it as collateral, making the victim's health checks depend on another price feed (a stale feed would then block their borrows and withdrawals). | Auto-enable only when `onBehalfOf == msg.sender`. Test: `test_supply_onBehalfOf` |
| R-03 | Low | **Dust collateral could block cleanup.** If a borrower's remaining collateral was worth less than 1 unit of the debt token, `repaid` rounded to 0 and the liquidation reverted, leaving the bad debt stuck. | Liquidation now allows `repaid == 0` when sweeping all remaining collateral, after which the debt is written off. |
| R-04 | Medium | **`LendingPool` was over the 24 KB contract size limit (EIP-170)** because it deployed each ALToken itself. Unit tests don't enforce the limit, so this only showed up when deploying to a real node (Anvil). It would have made mainnet-style deployment impossible. | ALTokens are now deployed separately and `listMarket` checks they point at this pool, the right asset and decimals, and have no supply. Pool is now 20.2 KB. CI runs `forge build --sizes`. Test: `test_listMarketRejectsMismatchedALToken` |
| R-05 | Info | Invariant testing initially reported accounts with HF < 1 and no price drop. Root cause: the test's assumption was wrong (interest and *rises* in a debt asset's price also lower HF). The invariant was corrected to "no successful borrow or withdraw leaves a user over their LTV limit". | Test fix only |

## 3. Attack vectors considered

| Vector | Mitigation | Tests |
|---|---|---|
| Stale state (acting before interest accrues) | Every state-changing function calls `_accrue(asset)` first. Health checks on other markets use `_simulate`, which applies pending interest in memory. | `test_interestMatchesRateModel`, `testFuzz_debtGrowsAndFullRepayClears` |
| Oracle: stale, zero/negative, incomplete round | `ChainlinkOracle.getPrice` reverts | `ChainlinkOracle.t.sol` |
| Oracle: feed clamped at min/max answer during a crash (LUNA) | Per-feed admin `minPrice`/`maxPrice`; out-of-range reverts instead of pricing | `test_revertsOutsideSanityBounds` |
| L2 sequencer downtime | Chainlink sequencer uptime feed with a 1h grace period after restart; price reads revert while down. Chainlink only publishes this feed on mainnets (Arbitrum One: `0xFdB631F5EE196F0ed6FAa767959853A9F217697D`), so the Arbitrum Sepolia deployment uses a mock that `script/SetSequencerStatus.s.sol` can flip for demos | `test_sequencerDownBlocksPrices`, `test_sequencerGracePeriod`, `test_sequencerDownBlocksBorrow` |
| Rounding | Shares minted and collateral valued round down; shares burned, debt and debt value round up | `testFuzz_supplyWithdrawRoundTripNeverProfits`, `invariant_suppliersClaimsAreBacked` |
| First-depositor inflation (donation) attack | Market cash tracked internally (donations ignored) plus a virtual share and asset | `test_inflationAttackDoesNotWork` |
| Bad debt blocking liquidations | If collateral < repay + bonus, liquidator takes all of it and repays less; leftover debt is written off against reserves, then suppliers | `test_badDebt_*` |
| Self-liquidation | `borrower == msg.sender` reverts | `test_cannotSelfLiquidate` |
| Moving collateral out via ALToken transfer | `transfer`/`transferFrom` call `pool.validateTransfer`, which enforces the LTV limit | `test_transferOfCollateralBlockedIfItBreaksLimit`, `test_transferFromAlsoChecked` |
| Reentrancy | `nonReentrant` on every external state-changing function; checks before transfers out | — |
| Admin key | `Ownable2Step`; pause never blocks repay or liquidate; config bounds (bonus ≤ 20%, reserve factor ≤ 50%, threshold × (1 + bonus) < 100%) | `test_configValidation`, `test_repay_worksWhilePaused`, `test_liquidationWorksWhilePaused` |
| Unbounded loops | At most 10 markets | `test_cannotListTwiceOrPastMax` |

## 4. Invariants (stateful fuzzing, 256 runs × 64 calls)

1. The pool's token balance is always ≥ its tracked cash.
2. Users' scaled debt adds up exactly to each market's total scaled debt.
3. Users' claims never exceed `cash + debt − reserves`, and reserves never exceed `cash + debt`.
4. No successful borrow or withdraw leaves a user over their LTV limit.
5. The ALToken share price never decreases unless bad debt was written off.

## 5. Known limitations (accepted for a portfolio protocol)

- Admin is a single EOA. Production would use a multisig plus a timelock.
- Interest is linear between accruals (not compounded per second). The difference is negligible when markets are touched regularly.
- Fee-on-transfer, rebasing and ERC-777 tokens are not supported.
- Liquidators receive ALToken shares, not the underlying, so a liquidation never fails for lack of market cash.
- Prices fall back to reverting, not to a secondary oracle. During an oracle outage, borrow, withdraw (with debt) and liquidate are blocked. Repay still works.
- No isolation mode, e-mode, or flash loans.

## 6. Tooling

- Foundry unit, fuzz (1,000 runs; 5,000 in CI) and invariant tests. 88 tests. Coverage on `src/`: 99.7% lines, 95.5% statements, 72.7% branches, 100% functions.
- `forge lint` is clean. The `block-timestamp` lint is disabled on purpose because timestamps are only used for interest, staleness and the faucet.
- Slither runs in CI (`.github/workflows/main.yml`, fails on medium or higher). Results go in this section once CI has run.
