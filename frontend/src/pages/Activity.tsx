import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAccount } from "wagmi";
import { FiExternalLink } from "react-icons/fi";
import { useDeployment } from "../hooks/useProtocol";
import { explorerTx } from "../lib/protocol";
import { formatToken, shortAddress } from "../lib/format";

const INDEXER = import.meta.env.VITE_INDEXER_URL ?? "http://localhost:42069";

type Item = {
  id: string;
  kind: "supply" | "withdraw" | "borrow" | "repay" | "liquidation" | "collateral" | "badDebt";
  user: string;
  asset: string;
  amount: string;
  txHash: string;
  blockNumber: string;
  timestamp: string;
};

const KIND_STYLE: Record<Item["kind"], string> = {
  supply: "text-emerald-400",
  withdraw: "text-gray-300",
  borrow: "text-amber-300",
  repay: "text-sky-300",
  liquidation: "text-red-400",
  collateral: "text-gray-400",
  badDebt: "text-red-500",
};

export default function Activity() {
  const { address } = useAccount();
  const { chainId, tokens } = useDeployment();
  const [mine, setMine] = useState(false);
  const user = mine && address ? address : undefined;

  const { data, error, isLoading } = useQuery({
    queryKey: ["activity", chainId, user],
    queryFn: async () => {
      const url = new URL("/activity", INDEXER);
      url.searchParams.set("chainId", String(chainId));
      if (user) url.searchParams.set("user", user);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Indexer returned ${res.status}`);
      return (await res.json()) as Item[];
    },
    refetchInterval: 5_000,
    retry: 1,
  });

  const token = (a: string) => tokens.find((t) => t.address.toLowerCase() === a.toLowerCase());

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl">Activity</h1>
          <p className="mt-1 text-gray-400">Every pool event, indexed by Ponder.</p>
        </div>
        <div className="flex gap-1 rounded-full bg-white/5 p-1 text-sm">
          <button className={`rounded-full px-3 py-1 ${!mine ? "bg-white text-black" : "text-gray-400"}`} onClick={() => setMine(false)}>
            All
          </button>
          <button
            className={`rounded-full px-3 py-1 ${mine ? "bg-white text-black" : "text-gray-400"}`}
            disabled={!address}
            onClick={() => setMine(true)}
          >
            Mine
          </button>
        </div>
      </div>

      {error ? (
        <div className="card text-sm text-gray-300">
          The indexer isn't reachable at <code>{INDEXER}</code>. Start it with <code>cd indexer && npm run dev</code>.
        </div>
      ) : isLoading ? (
        <div className="card h-40 animate-pulse" />
      ) : !data?.length ? (
        <div className="card text-sm text-gray-400">No activity yet.</div>
      ) : (
        <div className="card !p-0 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left">
                {["Event", "Account", "Amount", "Time", "Tx"].map((h) => (
                  <th key={h} className="label px-5 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((i) => {
                const t = token(i.asset);
                const link = explorerTx(chainId, i.txHash);
                return (
                  <tr key={i.id} className="border-b border-white/5 last:border-0">
                    <td className={`px-5 py-3 capitalize ${KIND_STYLE[i.kind]}`}>{i.kind === "badDebt" ? "Bad debt written off" : i.kind}</td>
                    <td className="px-5 font-mono text-gray-300">{shortAddress(i.user)}</td>
                    <td className="px-5 font-mono">
                      {t && i.kind !== "collateral" ? `${formatToken(BigInt(i.amount), tokenDecimals(t.symbol))} ${t.symbol}` : t?.symbol}
                    </td>
                    <td className="px-5 text-gray-400">{new Date(Number(i.timestamp) * 1000).toLocaleString()}</td>
                    <td className="px-5 font-mono text-gray-400">
                      {link ? (
                        <a href={link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-white">
                          {shortAddress(i.txHash)} <FiExternalLink />
                        </a>
                      ) : (
                        shortAddress(i.txHash)
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function tokenDecimals(symbol: string): number {
  return symbol === "USDC" ? 6 : symbol === "WBTC" ? 8 : 18;
}
