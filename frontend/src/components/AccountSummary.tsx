import type { AccountData } from "../lib/math";
import { formatUsd } from "../lib/format";
import { HealthFactor } from "./HealthFactor";

function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="card">
      <p className="label">{label}</p>
      <p className="mt-2 font-mono text-2xl text-white">{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

export function AccountSummary({ account }: { account: AccountData }) {
  const used =
    account.borrowLimitUsd === 0n ? 0 : Number((account.debtUsd * 10_000n) / account.borrowLimitUsd) / 100;
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Stat label="Collateral" value={formatUsd(account.collateralUsd)} hint="Supplied assets enabled as collateral" />
      <Stat label="Borrowed" value={formatUsd(account.debtUsd)} hint="Including accrued interest" />
      <div className="card">
        <p className="label">Borrow limit used</p>
        <p className="mt-2 font-mono text-2xl">{used.toFixed(1)}%</p>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full ${used > 90 ? "bg-red-400" : used > 75 ? "bg-amber-300" : "bg-emerald-400"}`}
            style={{ width: `${Math.min(used, 100)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-gray-500">Limit {formatUsd(account.borrowLimitUsd)}</p>
      </div>
      <Stat
        label="Health factor"
        value={<HealthFactor value={account.healthFactor} />}
        hint="Below 1.00 your collateral can be liquidated"
      />
    </section>
  );
}
