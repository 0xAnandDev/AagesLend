import { formatUnits } from "viem";
import { MAX_UINT, WAD } from "./math";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const compactUsd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2,
});

/** 1e18-scaled USD to "$1,234.56". */
export function formatUsd(value: bigint, compact = false): string {
  const n = Number(formatUnits(value, 18));
  return (compact && n >= 100_000 ? compactUsd : usd).format(n);
}

/** Token amount with sensible precision: more decimals for small balances. */
export function formatToken(value: bigint, decimals: number, maxDecimals = 4): string {
  const n = Number(formatUnits(value, decimals));
  if (n === 0) return "0";
  if (n < 10 ** -maxDecimals) return `<${(10 ** -maxDecimals).toFixed(maxDecimals)}`;
  return n.toLocaleString("en-US", { maximumFractionDigits: n >= 1000 ? 2 : maxDecimals });
}

/** 1e18-scaled ratio (1e18 = 100%) to "4.25%". */
export function formatPct(value: bigint, digits = 2): string {
  return `${(Number(formatUnits(value, 18)) * 100).toFixed(digits)}%`;
}

/** Basis points to "75%". */
export function formatBps(bps: number): string {
  return `${(bps / 100).toFixed(bps % 100 === 0 ? 0 : 1)}%`;
}

export function formatHealthFactor(hf: bigint): string {
  if (hf === MAX_UINT || hf > WAD * 1000n) return "∞";
  return Number(formatUnits(hf, 18)).toFixed(2);
}

export function shortAddress(a: string): string {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}
