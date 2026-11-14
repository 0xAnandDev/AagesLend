import { useState } from "react";
import { NavLink, Outlet, Link } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useConnect, useSwitchChain } from "wagmi";
import { FiActivity, FiDroplet, FiGrid, FiMenu, FiX } from "react-icons/fi";
import { DEV_WALLET_ENABLED } from "../wagmi";
import { useDeployment } from "../hooks/useProtocol";
import { Toasts } from "./Toasts";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: FiGrid },
  { to: "/faucet", label: "Faucet & demo", icon: FiDroplet },
  { to: "/activity", label: "Activity", icon: FiActivity },
];

function DevWalletButton() {
  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const dev = connectors.find((c) => c.id === "mock");
  if (!DEV_WALLET_ENABLED || isConnected || !dev) return null;
  return (
    <button className="btn-secondary hidden sm:inline-flex" onClick={() => connect({ connector: dev })}>
      Use Anvil dev account
    </button>
  );
}

function NetworkBanner() {
  const { isConnected, chain } = useAccount();
  const { deployment } = useDeployment();
  const { chains, switchChain } = useSwitchChain();
  if (!isConnected || deployment) return null;
  return (
    <div className="border-b border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-3">
        <span>AagesLend isn't deployed on {chain?.name ?? "this network"}.</span>
        {chains.map((c) => (
          <button key={c.id} className="btn-secondary !py-1" onClick={() => switchChain({ chainId: c.id })}>
            Switch to {c.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export function AppLayout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-1 text-[20px] font-light tracking-wide">
              <span className="font-heading text-2xl font-semibold">A</span>agesLend
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              {NAV.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `rounded-full px-3 py-1.5 text-sm transition ${isActive ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"}`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <DevWalletButton />
            <ConnectButton chainStatus="icon" showBalance={false} accountStatus={{ smallScreen: "avatar", largeScreen: "full" }} />
            <button className="p-2 text-gray-300 md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
              {open ? <FiX /> : <FiMenu />}
            </button>
          </div>
        </div>
        {open && (
          <nav className="border-t border-white/10 px-4 py-2 md:hidden">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} onClick={() => setOpen(false)} className="flex items-center gap-3 py-2 text-gray-300">
                <Icon /> {label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>
      <NetworkBanner />
      <main className="mx-auto max-w-[1200px] px-4 py-6 md:py-10">
        <Outlet />
      </main>
      <Toasts />
    </div>
  );
}
