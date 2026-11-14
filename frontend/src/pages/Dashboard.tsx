import { useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { AccountSummary } from "../components/AccountSummary";
import { ActionModal } from "../components/ActionModal";
import { MarketsTable } from "../components/MarketsTable";
import { PositionsPanel } from "../components/PositionsPanel";
import { useMarkets, useUserData, type Market } from "../hooks/useProtocol";
import { describeError } from "../hooks/useTransactor";
import { healthLevel, type Action } from "../lib/math";

export default function Dashboard() {
  const { isConnected } = useAccount();
  const { markets, deployment, isLoading, error } = useMarkets();
  const user = useUserData();
  const [modal, setModal] = useState<{ market: Market; action: Action } | null>(null);

  if (!deployment) {
    return (
      <div className="card text-center">
        <h2 className="text-2xl">No deployment on this network</h2>
        <p className="mt-2 text-gray-400">Switch to Arbitrum Sepolia, or run a local Anvil chain with `npm run deploy:local`.</p>
      </div>
    );
  }

  const position = modal && user.positions.find((p) => p.token.address === modal.market.token.address);
  const level = user.account ? healthLevel(user.account.healthFactor) : "none";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl">Dashboard</h1>
          <p className="mt-1 text-gray-400">Supply to earn, borrow against your collateral, all from one pool.</p>
        </div>
        {deployment.mockFeeds && (
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-gray-400">
            Testnet · mock price feeds
          </span>
        )}
      </div>

      {level === "danger" && (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
          Your health factor is below 1. Anyone can now liquidate part of your collateral. Repay debt or add collateral.
        </div>
      )}
      {level === "warning" && (
        <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          Your health factor is getting close to 1. A small price move could make your position liquidatable.
        </div>
      )}

      {isConnected && user.account ? (
        <AccountSummary account={user.account} />
      ) : (
        <div className="card flex flex-wrap items-center justify-between gap-4">
          <p className="text-gray-300">Connect a wallet to see your positions and start supplying or borrowing.</p>
          <ConnectButton />
        </div>
      )}

      {error && <div className="card text-sm text-red-300">Couldn't load markets: {describeError(error)}</div>}
      {isLoading ? (
        <div className="card h-48 animate-pulse" />
      ) : (
        <MarketsTable markets={markets} canAct={isConnected && !!user.account} onAction={(market, action) => setModal({ market, action })} />
      )}

      {isConnected && user.account && (
        <PositionsPanel
          pool={deployment.LendingPool}
          markets={markets}
          positions={user.positions}
          onAction={(market, action) => setModal({ market, action })}
        />
      )}

      {modal && position && user.account && (
        <ActionModal
          pool={deployment.LendingPool}
          market={modal.market}
          position={position}
          account={user.account}
          initialAction={modal.action}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
