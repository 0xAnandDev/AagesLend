import type { Market, Position } from "../hooks/useProtocol";
import { useTransactor } from "../hooks/useTransactor";
import { lendingPoolAbi } from "../contracts/abis";
import { formatPct, formatToken, formatUsd } from "../lib/format";
import { toUsd, type Action } from "../lib/math";
import { TokenIcon } from "./TokenIcon";

type Props = {
  pool: `0x${string}`;
  markets: Market[];
  positions: Position[];
  onAction: (market: Market, action: Action) => void;
};

export function PositionsPanel({ pool, markets, positions, onAction }: Props) {
  const { run, pending } = useTransactor();
  const rows = positions
    .map((p) => ({ p, m: markets.find((m) => m.token.address === p.token.address) }))
    .filter((r): r is { p: Position; m: Market } => !!r.m);
  const supplies = rows.filter((r) => r.p.supplied > 0n);
  const borrows = rows.filter((r) => r.p.debt > 0n);

  const toggle = (m: Market, enabled: boolean) =>
    run(`${enabled ? "Enable" : "Disable"} ${m.token.symbol} as collateral`, {
      address: pool,
      abi: lendingPoolAbi,
      functionName: "setCollateral",
      args: [m.token.address, enabled],
    });

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="card">
        <h2 className="text-xl">Your supplies</h2>
        {supplies.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">Nothing supplied yet. Supply an asset to start earning interest.</p>
        ) : (
          <ul className="mt-4 divide-y divide-white/5">
            {supplies.map(({ p, m }) => (
              <li key={m.token.address} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3">
                  <TokenIcon token={m.token} size={28} />
                  <div>
                    <p className="font-mono">
                      {formatToken(p.supplied, m.decimals)} {m.token.symbol}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatUsd(toUsd(p.supplied, m.decimals, m.price))} · earning {formatPct(m.supplyRate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-400">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-white"
                      checked={p.isCollateral}
                      disabled={!!pending || m.ltv === 0}
                      onChange={(e) => toggle(m, e.target.checked)}
                    />
                    Collateral
                  </label>
                  <button className="btn-secondary !py-1.5" onClick={() => onAction(m, "withdraw")}>
                    Withdraw
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="card">
        <h2 className="text-xl">Your borrows</h2>
        {borrows.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">No open loans.</p>
        ) : (
          <ul className="mt-4 divide-y divide-white/5">
            {borrows.map(({ p, m }) => (
              <li key={m.token.address} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3">
                  <TokenIcon token={m.token} size={28} />
                  <div>
                    <p className="font-mono">
                      {formatToken(p.debt, m.decimals)} {m.token.symbol}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatUsd(toUsd(p.debt, m.decimals, m.price))} · paying {formatPct(m.borrowRate)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="btn-secondary !py-1.5" onClick={() => onAction(m, "borrow")}>
                    Borrow more
                  </button>
                  <button className="btn-primary !py-1.5" onClick={() => onAction(m, "repay")}>
                    Repay
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
