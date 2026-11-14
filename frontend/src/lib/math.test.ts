import { describe, expect, it } from "vitest";
import { parseUnits } from "viem";
import { healthLevel, maxBorrow, maxWithdraw, MAX_UINT, previewAccount, toUsd, WAD, type AccountData } from "./math";
import { formatHealthFactor, formatPct, formatUsd } from "./format";

const weth = { decimals: 18, price: 2000n * WAD, ltv: 7500, liquidationThreshold: 8000 };
const usdc = { decimals: 6, price: WAD, ltv: 8000, liquidationThreshold: 8500 };
const empty: AccountData = {
  collateralUsd: 0n,
  debtUsd: 0n,
  borrowLimitUsd: 0n,
  liquidationLimitUsd: 0n,
  healthFactor: MAX_UINT,
};

describe("previewAccount", () => {
  it("supplying collateral raises limits but keeps HF infinite with no debt", () => {
    const a = previewAccount(empty, "supply", parseUnits("1", 18), weth, true);
    expect(a.collateralUsd).toBe(2000n * WAD);
    expect(a.borrowLimitUsd).toBe(1500n * WAD);
    expect(a.liquidationLimitUsd).toBe(1600n * WAD);
    expect(a.healthFactor).toBe(MAX_UINT);
  });

  it("borrowing computes the same HF as the contract", () => {
    const supplied = previewAccount(empty, "supply", parseUnits("1", 18), weth, true);
    const borrowed = previewAccount(supplied, "borrow", parseUnits("1500", 6), usdc, false);
    // 1600 / 1500 = 1.0666..
    expect(borrowed.healthFactor).toBe((1600n * WAD) / 1500n);
  });

  it("supplying a non-collateral asset doesn't change limits", () => {
    const a = previewAccount(empty, "supply", parseUnits("100", 6), usdc, false);
    expect(a).toEqual(empty);
  });

  it("repaying more than the debt floors at zero", () => {
    const a = previewAccount({ ...empty, debtUsd: 10n * WAD }, "repay", parseUnits("50", 6), usdc, false);
    expect(a.debtUsd).toBe(0n);
    expect(a.healthFactor).toBe(MAX_UINT);
  });
});

describe("limits", () => {
  const account = previewAccount(empty, "supply", parseUnits("1", 18), weth, true); // $1500 limit

  it("maxBorrow leaves a 0.1% buffer and respects market cash", () => {
    expect(maxBorrow(account, usdc, parseUnits("1000000", 6))).toBe(parseUnits("1498.5", 6));
    expect(maxBorrow(account, usdc, parseUnits("100", 6))).toBe(parseUnits("100", 6));
  });

  it("maxWithdraw with debt keeps the position within its LTV", () => {
    const withDebt = { ...account, debtUsd: 750n * WAD };
    const amount = maxWithdraw(withDebt, weth, parseUnits("1", 18), parseUnits("100", 18), true);
    // $750 of limit left / 75% LTV = $1000 of collateral = 0.5 WETH (minus buffer)
    expect(amount).toBeLessThan(parseUnits("0.5", 18));
    expect(amount).toBeGreaterThan(parseUnits("0.499", 18));
    const after = previewAccount(withDebt, "withdraw", amount, weth, true);
    expect(after.debtUsd <= after.borrowLimitUsd).toBe(true);
  });

  it("maxWithdraw without debt is the full balance", () => {
    expect(maxWithdraw(account, weth, parseUnits("1", 18), parseUnits("100", 18), true)).toBe(parseUnits("1", 18));
  });
});

describe("format", () => {
  it("formats values", () => {
    expect(formatUsd(toUsd(parseUnits("1.5", 18), 18, 2000n * WAD))).toBe("$3,000.00");
    expect(formatPct(WAD / 25n)).toBe("4.00%");
    expect(formatHealthFactor(MAX_UINT)).toBe("∞");
    expect(formatHealthFactor((WAD * 3n) / 2n)).toBe("1.50");
  });

  it("classifies health", () => {
    expect(healthLevel(MAX_UINT)).toBe("none");
    expect(healthLevel(WAD * 2n)).toBe("safe");
    expect(healthLevel((WAD * 11n) / 10n)).toBe("warning");
    expect(healthLevel((WAD * 9n) / 10n)).toBe("danger");
  });
});
