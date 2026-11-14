/**
 * Pure position math mirroring LendingPool so the UI can preview a transaction before it is signed.
 * All USD values are 1e18-scaled, like the contract's getUserAccountData.
 */
export const WAD = 10n ** 18n;
export const BPS = 10_000n;
export const MAX_UINT = 2n ** 256n - 1n;

export type AccountData = {
  collateralUsd: bigint;
  debtUsd: bigint;
  borrowLimitUsd: bigint;
  liquidationLimitUsd: bigint;
  healthFactor: bigint;
};

export type Action = "supply" | "withdraw" | "borrow" | "repay";

export type MarketParams = {
  decimals: number;
  price: bigint; // 1e18 USD per whole token
  ltv: number; // bps
  liquidationThreshold: number; // bps
};

export function toUsd(amount: bigint, decimals: number, price: bigint): bigint {
  return (amount * price) / 10n ** BigInt(decimals);
}

export function fromUsd(usd: bigint, decimals: number, price: bigint): bigint {
  if (price === 0n) return 0n;
  return (usd * 10n ** BigInt(decimals)) / price;
}

export function healthFactor(liquidationLimitUsd: bigint, debtUsd: bigint): bigint {
  return debtUsd === 0n ? MAX_UINT : (liquidationLimitUsd * WAD) / debtUsd;
}

const sub = (a: bigint, b: bigint) => (a > b ? a - b : 0n);

/** Account totals after `action` of `amount` in a market. `countsAsCollateral` = asset enabled as collateral. */
export function previewAccount(
  account: AccountData,
  action: Action,
  amount: bigint,
  market: MarketParams,
  countsAsCollateral: boolean,
): AccountData {
  const usd = toUsd(amount, market.decimals, market.price);
  const next = { ...account };
  if ((action === "supply" || action === "withdraw") && countsAsCollateral) {
    const ltvPart = (usd * BigInt(market.ltv)) / BPS;
    const ltPart = (usd * BigInt(market.liquidationThreshold)) / BPS;
    if (action === "supply") {
      next.collateralUsd += usd;
      next.borrowLimitUsd += ltvPart;
      next.liquidationLimitUsd += ltPart;
    } else {
      next.collateralUsd = sub(next.collateralUsd, usd);
      next.borrowLimitUsd = sub(next.borrowLimitUsd, ltvPart);
      next.liquidationLimitUsd = sub(next.liquidationLimitUsd, ltPart);
    }
  }
  if (action === "borrow") next.debtUsd += usd;
  if (action === "repay") next.debtUsd = sub(next.debtUsd, usd);
  next.healthFactor = healthFactor(next.liquidationLimitUsd, next.debtUsd);
  return next;
}

/** Keep a small buffer below hard limits so interest accrued between read and execution can't revert the tx. */
const SAFETY_BPS = 9_990n;

/** Max amount of a token the account can borrow, limited by its borrow limit and the market's cash. */
export function maxBorrow(account: AccountData, market: MarketParams, cash: bigint): bigint {
  const roomUsd = (sub(account.borrowLimitUsd, account.debtUsd) * SAFETY_BPS) / BPS;
  const amount = fromUsd(roomUsd, market.decimals, market.price);
  return amount < cash ? amount : cash;
}

/** Max amount the account can withdraw from a market without breaking its borrow limit. */
export function maxWithdraw(
  account: AccountData,
  market: MarketParams,
  supplied: bigint,
  cash: bigint,
  countsAsCollateral: boolean,
): bigint {
  let cap = supplied < cash ? supplied : cash;
  if (account.debtUsd === 0n || !countsAsCollateral || market.ltv === 0) return cap;
  const excessLimitUsd = sub(account.borrowLimitUsd, account.debtUsd);
  const excessCollateralUsd = (excessLimitUsd * BPS * SAFETY_BPS) / (BigInt(market.ltv) * BPS);
  const byLimit = fromUsd(excessCollateralUsd, market.decimals, market.price);
  if (byLimit < cap) cap = byLimit;
  return cap;
}

export type HealthLevel = "none" | "safe" | "warning" | "danger";

export function healthLevel(hf: bigint): HealthLevel {
  if (hf === MAX_UINT) return "none";
  if (hf < WAD) return "danger";
  if (hf < (WAD * 13n) / 10n) return "warning";
  return "safe";
}
