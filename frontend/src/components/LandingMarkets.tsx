import { useMarkets } from "../hooks/useProtocol";
import { formatPct, formatUsd } from "../lib/format";
import { toUsd } from "../lib/math";
import { TokenIcon } from "./TokenIcon";

/** Live market stats for the landing page (replaces the old hardcoded numbers). */
export default function LandingMarkets() {
  const { markets, isLoading, error, deployment } = useMarkets();
  const sum = (f: (m: (typeof markets)[number]) => bigint) => markets.reduce((a, m) => a + f(m), 0n);
  const supplied = sum((m) => toUsd(m.totalSupplied, m.decimals, m.price));
  const borrowed = sum((m) => toUsd(m.totalDebt, m.decimals, m.price));
  const available = sum((m) => toUsd(m.cash, m.decimals, m.price));
  const offline = !deployment || !!error;

  const stats = [
    ["Total supplied", supplied],
    ["Total borrowed", borrowed],
    ["Available liquidity", available],
  ] as const;

  return (
    <>
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {stats.map(([label, v]) => (
          <div key={label} className="rounded-2xl border border-white/5 bg-[#121212] p-8">
            <h4 className="mb-2 font-medium text-white">{label}</h4>
            <p className="text-4xl font-bold text-white">{offline ? "–" : isLoading ? "…" : formatUsd(v, true)}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {markets.map((m) => (
          <div key={m.token.address} className="rounded-2xl border border-white/5 bg-[#1a1a1a] p-6">
            <div className="flex items-center gap-3">
              <TokenIcon token={m.token} size={28} />
              <span className="font-medium text-white">{m.token.symbol}</span>
              <span className="ml-auto font-mono text-gray-400">{formatUsd(m.price)}</span>
            </div>
            <div className="mt-4 flex justify-between text-sm">
              <span className="text-gray-400">Supply APR</span>
              <span className="font-mono text-green-400">{formatPct(m.supplyRate)}</span>
            </div>
            <div className="mt-1 flex justify-between text-sm">
              <span className="text-gray-400">Borrow APR</span>
              <span className="font-mono text-orange-400">{formatPct(m.borrowRate)}</span>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-6 text-center text-sm text-gray-500">
        {offline ? "Connect to a network with an AagesLend deployment to see live data." : "Read live from the LendingPool contract."}
      </p>
    </>
  );
}
