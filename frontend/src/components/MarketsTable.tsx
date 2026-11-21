import type { Market } from "../hooks/useProtocol";
import { formatBps, formatPct, formatToken, formatUsd } from "../lib/format";
import { toUsd } from "../lib/math";
import { TokenIcon } from "./TokenIcon";
import type { Action } from "../lib/math";

type Props = {
  markets: Market[];
  onAction?: (market: Market, action: Action) => void;
  canAct: boolean;
};

export function MarketsTable({ markets, onAction, canAct }: Props) {
  return (
    <section className="card !p-0">
      <div className="flex items-center justify-between px-5 pt-5 md:px-6">
        <h2 className="text-xl">Markets</h2>
        <span className="text-xs text-gray-500">Live from LendingPool.getAllMarkets</span>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-y border-white/10 text-left">
              {["Asset", "Price", "Total supplied", "Total borrowed", "Supply APR", "Borrow APR", "LTV / Liq.", ""].map((h) => (
                <th key={h} className="label px-5 py-3 font-semibold md:px-6">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {markets.map((m) => (
              <tr key={m.token.address} className="border-b border-white/5 last:border-0">
                <td className="px-5 py-4 md:px-6">
                  <div className="flex items-center gap-3">
                    <TokenIcon token={m.token} />
                    <div>
                      <p className="font-medium">{m.token.symbol}</p>
                      <p className="text-xs text-gray-500">{m.token.name}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 font-mono md:px-6">{m.price ? formatUsd(m.price) : <span className="text-red-400">Oracle down</span>}</td>
                <td className="px-5 md:px-6">
                  <p className="font-mono">{formatToken(m.totalSupplied, m.decimals, 2)}</p>
                  <p className="text-xs text-gray-500">{formatUsd(toUsd(m.totalSupplied, m.decimals, m.price), true)}</p>
                </td>
                <td className="px-5 md:px-6">
                  <p className="font-mono">{formatToken(m.totalDebt, m.decimals, 2)}</p>
                  <p className="text-xs text-gray-500">{formatPct(m.utilization, 1)} utilized</p>
                </td>
                <td className="px-5 font-mono text-emerald-400 md:px-6">{formatPct(m.supplyRate)}</td>
                <td className="px-5 font-mono text-amber-300 md:px-6">{formatPct(m.borrowRate)}</td>
                <td className="px-5 font-mono text-gray-300 md:px-6">
                  {formatBps(m.ltv)} / {formatBps(m.liquidationThreshold)}
                </td>
                <td className="px-5 md:px-6">
                  {onAction && (
                    <div className="flex justify-end gap-2">
                      <button className="btn-primary !py-1.5" disabled={!canAct} onClick={() => onAction(m, "supply")}>
                        Supply
                      </button>
                      <button
                        className="btn-secondary !py-1.5"
                        disabled={!canAct || !m.borrowEnabled}
                        onClick={() => onAction(m, "borrow")}
                      >
                        Borrow
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
