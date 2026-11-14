import { test } from "node:test";
import assert from "node:assert/strict";
import { planLiquidation, WAD, type MarketInfo } from "./plan.ts";

const USDC = "0x0000000000000000000000000000000000000001" as const;
const WETH = "0x0000000000000000000000000000000000000002" as const;
const markets: MarketInfo[] = [
  { asset: USDC, decimals: 6, price: WAD, liquidationBonus: 500 },
  { asset: WETH, decimals: 18, price: 1800n * WAD, liquidationBonus: 500 },
];
const positions = [
  { asset: WETH, supplied: 10n ** 18n, debt: 0n, isCollateral: true },
  { asset: USDC, supplied: 0n, debt: 1500n * 10n ** 6n, isCollateral: false },
];
const rich = new Map([[USDC.toLowerCase(), 10n ** 12n]]);

test("healthy positions are skipped", () => {
  assert.equal(planLiquidation(WAD, positions, markets, rich), null);
});

test("close factor caps the repay at 50% above HF 0.95", () => {
  const plan = planLiquidation((WAD * 96n) / 100n, positions, markets, rich);
  assert.ok(plan);
  assert.equal(plan.debtAsset, USDC);
  assert.equal(plan.collateralAsset, WETH);
  assert.equal(plan.repayAmount, 750n * 10n ** 6n);
  assert.equal(plan.expectedBonusUsd, (750n * WAD * 5n) / 100n);
});

test("full repay allowed under HF 0.95, but capped by what the collateral covers", () => {
  const plan = planLiquidation((WAD * 90n) / 100n, positions, markets, rich);
  assert.ok(plan);
  // $1800 of collateral / 1.05 = $1714.28 > $1500 debt, so the full debt.
  assert.equal(plan.repayAmount, 1500n * 10n ** 6n);
});

test("keeper balance limits the repay", () => {
  const poor = new Map([[USDC.toLowerCase(), 100n * 10n ** 6n]]);
  assert.equal(planLiquidation((WAD * 90n) / 100n, positions, markets, poor)?.repayAmount, 100n * 10n ** 6n);
});

test("no plan without balance or below minimum profit", () => {
  assert.equal(planLiquidation((WAD * 90n) / 100n, positions, markets, new Map()), null);
  assert.equal(planLiquidation((WAD * 90n) / 100n, positions, markets, rich, 10_000n * WAD), null);
});
