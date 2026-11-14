/**
 * Pure liquidation planning, separated from I/O so it can be unit tested.
 * Mirrors LendingPool's rules: close factor 50% (100% under HF 0.95), bonus per collateral market.
 */
export const WAD = 10n ** 18n;
export const BPS = 10_000n;
export const FULL_LIQUIDATION_HF = (WAD * 95n) / 100n;

export type MarketInfo = {
  asset: `0x${string}`;
  decimals: number;
  price: bigint; // 1e18 USD per whole token
  liquidationBonus: number; // bps
};

export type BorrowerPosition = {
  asset: `0x${string}`;
  supplied: bigint;
  debt: bigint;
  isCollateral: boolean;
};

export type Plan = {
  debtAsset: `0x${string}`;
  collateralAsset: `0x${string}`;
  repayAmount: bigint;
  repayUsd: bigint;
  expectedBonusUsd: bigint;
};

const usd = (amount: bigint, m: MarketInfo) => (amount * m.price) / 10n ** BigInt(m.decimals);

/**
 * Pick the largest debt and the largest collateral, repay as much as the close factor and our balance allow.
 * Returns null when there is nothing worth doing.
 */
export function planLiquidation(
  healthFactor: bigint,
  positions: BorrowerPosition[],
  markets: MarketInfo[],
  keeperBalances: Map<string, bigint>,
  minBonusUsd = 0n,
): Plan | null {
  if (healthFactor >= WAD) return null;
  const market = (a: string) => markets.find((m) => m.asset.toLowerCase() === a.toLowerCase());

  let debt: { p: BorrowerPosition; m: MarketInfo; usd: bigint } | undefined;
  let coll: { p: BorrowerPosition; m: MarketInfo; usd: bigint } | undefined;
  for (const p of positions) {
    const m = market(p.asset);
    if (!m || m.price === 0n) continue;
    if (p.debt > 0n) {
      const v = usd(p.debt, m);
      if (!debt || v > debt.usd) debt = { p, m, usd: v };
    }
    if (p.isCollateral && p.supplied > 0n) {
      const v = usd(p.supplied, m);
      if (!coll || v > coll.usd) coll = { p, m, usd: v };
    }
  }
  if (!debt || !coll) return null;

  const maxRepay = healthFactor < FULL_LIQUIDATION_HF ? debt.p.debt : debt.p.debt / 2n;
  const balance = keeperBalances.get(debt.p.asset.toLowerCase()) ?? 0n;
  // Don't repay more than the collateral can pay back (plus bonus); the pool would refund the rest anyway.
  const collCapUsd = (coll.usd * BPS) / (BPS + BigInt(coll.m.liquidationBonus));
  const collCap = (collCapUsd * 10n ** BigInt(debt.m.decimals)) / debt.m.price;

  let repayAmount = maxRepay;
  if (balance < repayAmount) repayAmount = balance;
  if (collCap < repayAmount) repayAmount = collCap;
  if (repayAmount === 0n) return null;

  const repayUsd = usd(repayAmount, debt.m);
  const expectedBonusUsd = (repayUsd * BigInt(coll.m.liquidationBonus)) / BPS;
  if (expectedBonusUsd < minBonusUsd) return null;

  return { debtAsset: debt.p.asset, collateralAsset: coll.p.asset, repayAmount, repayUsd, expectedBonusUsd };
}
