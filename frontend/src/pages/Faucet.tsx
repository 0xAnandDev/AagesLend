import { useState } from "react";
import { parseUnits } from "viem";
import { useAccount, useReadContract } from "wagmi";
import { mockERC20Abi, mockV3AggregatorAbi } from "../contracts/abis";
import { TokenIcon } from "../components/TokenIcon";
import { useDeployment, useMarkets } from "../hooks/useProtocol";
import { useTransactor } from "../hooks/useTransactor";
import { formatUsd } from "../lib/format";
import type { TokenInfo } from "../lib/protocol";

function FaucetRow({ token }: { token: TokenInfo }) {
  const { chainId } = useDeployment();
  const { address } = useAccount();
  const { run, pending } = useTransactor();
  const { data: amount } = useReadContract({ chainId, address: token.address, abi: mockERC20Abi, functionName: "faucetAmount" });
  const { data: decimals } = useReadContract({ chainId, address: token.address, abi: mockERC20Abi, functionName: "decimals" });
  const whole = amount !== undefined && decimals !== undefined ? Number(amount / 10n ** BigInt(decimals)) : undefined;
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="flex items-center gap-3">
        <TokenIcon token={token} />
        <div>
          <p className="font-medium">{token.symbol}</p>
          <p className="text-xs text-gray-500">{whole !== undefined ? `${whole.toLocaleString()} per day` : "…"}</p>
        </div>
      </div>
      <button
        className="btn-primary"
        disabled={!address || !!pending}
        onClick={() => run(`Get test ${token.symbol}`, { address: token.address, abi: mockERC20Abi, functionName: "faucet" })}
      >
        Get {token.symbol}
      </button>
    </li>
  );
}

function PriceControl({ token, price }: { token: TokenInfo; price: bigint }) {
  const { run, pending } = useTransactor();
  const [value, setValue] = useState("");
  const current = Number(price / 10n ** 16n) / 100;
  const set = (usd: number) =>
    run(`Set ${token.symbol} price to $${usd.toLocaleString()}`, {
      address: token.feed,
      abi: mockV3AggregatorAbi,
      functionName: "updateAnswer",
      args: [parseUnits(usd.toFixed(8), 8)],
    });
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="flex items-center gap-3">
        <TokenIcon token={token} size={28} />
        <span className="font-mono">{formatUsd(price)}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button className="btn-secondary !py-1.5" disabled={!!pending} onClick={() => set(current * 0.8)}>
          −20%
        </button>
        <button className="btn-secondary !py-1.5" disabled={!!pending} onClick={() => set(current * 1.2)}>
          +20%
        </button>
        <input className="input !w-28 !py-1.5 !text-sm" placeholder="USD" value={value} onChange={(e) => setValue(e.target.value)} />
        <button className="btn-secondary !py-1.5" disabled={!!pending || !Number(value)} onClick={() => set(Number(value))}>
          Set
        </button>
      </div>
    </li>
  );
}

function SequencerControl({ feed }: { feed: `0x${string}` }) {
  const { chainId } = useDeployment();
  const { run, pending } = useTransactor();
  const { data } = useReadContract({ chainId, address: feed, abi: mockV3AggregatorAbi, functionName: "answer", query: { refetchInterval: 8000 } });
  const down = data === 1n;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm">
        Mock L2 sequencer is <span className={down ? "text-red-400" : "text-emerald-400"}>{down ? "down" : "up"}</span>. While it's down,
        or for 1 hour after it comes back, the oracle refuses prices, so borrows, withdrawals and liquidations pause.
      </p>
      <button
        className={down ? "btn-primary" : "btn-danger"}
        disabled={!!pending}
        onClick={() =>
          run(down ? "Bring sequencer back up" : "Take sequencer down", {
            address: feed,
            abi: mockV3AggregatorAbi,
            functionName: "updateAnswer",
            args: [down ? 0n : 1n],
          })
        }
      >
        {down ? "Bring it back up" : "Simulate outage"}
      </button>
    </div>
  );
}

export default function Faucet() {
  const { deployment, tokens } = useDeployment();
  const { markets } = useMarkets();
  if (!deployment) return <div className="card">No deployment on this network.</div>;
  const hasSequencer = deployment.SEQUENCER_UPTIME_FEED !== "0x0000000000000000000000000000000000000000";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl">Faucet & demo controls</h1>
        <p className="mt-1 text-gray-400">Test tokens for this deployment. They have no value.</p>
      </div>
      <section className="card">
        <h2 className="text-xl">Test tokens</h2>
        <ul className="mt-2 divide-y divide-white/5">
          {tokens.map((t) => (
            <FaucetRow key={t.address} token={t} />
          ))}
        </ul>
      </section>

      {deployment.mockFeeds && (
        <section className="card">
          <h2 className="text-xl">Move mock prices</h2>
          <p className="mt-1 text-sm text-gray-400">
            These feeds are mocks, so anyone can move them. Borrow close to your limit, drop the collateral price, and watch the
            keeper bot liquidate you.
          </p>
          <ul className="mt-2 divide-y divide-white/5">
            {markets.map((m) => (
              <PriceControl key={m.token.address} token={m.token} price={m.price} />
            ))}
          </ul>
        </section>
      )}

      {hasSequencer && (
        <section className="card">
          <h2 className="text-xl">L2 sequencer uptime</h2>
          <div className="mt-3">
            <SequencerControl feed={deployment.SEQUENCER_UPTIME_FEED} />
          </div>
        </section>
      )}
    </div>
  );
}
