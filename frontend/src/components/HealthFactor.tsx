import { formatHealthFactor } from "../lib/format";
import { healthLevel } from "../lib/math";

const COLORS = {
  none: "text-gray-400",
  safe: "text-emerald-400",
  warning: "text-amber-300",
  danger: "text-red-400",
} as const;

export function HealthFactor({ value, className = "" }: { value: bigint; className?: string }) {
  const level = healthLevel(value);
  return (
    <span className={`font-mono ${COLORS[level]} ${className}`} title="Liquidation happens below 1.00">
      {formatHealthFactor(value)}
    </span>
  );
}

/** "1.42 → 1.10" preview shown before signing. */
export function HealthFactorChange({ from, to }: { from: bigint; to: bigint }) {
  return (
    <span className="inline-flex items-center gap-2">
      <HealthFactor value={from} />
      <span className="text-gray-500">→</span>
      <HealthFactor value={to} />
    </span>
  );
}
