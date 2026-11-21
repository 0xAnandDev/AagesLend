import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  coinbaseWallet,
  injectedWallet,
  metaMaskWallet,
  rabbyWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http, type CreateConnectorFn } from "wagmi";
import { mock } from "wagmi/connectors";
import { arbitrumSepolia, foundry } from "wagmi/chains";
import type { Chain } from "viem";

const wanted = (import.meta.env.VITE_CHAINS ?? "local,arbitrumSepolia").split(",").map((s) => s.trim());
const chains = [
  ...(wanted.includes("local") ? [foundry] : []),
  ...(wanted.includes("arbitrumSepolia") ? [arbitrumSepolia] : []),
] as unknown as [Chain, ...Chain[]];
if (chains.length === 0) throw new Error("VITE_CHAINS must include 'local' and/or 'arbitrumSepolia'");

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

const walletConnectors = connectorsForWallets(
  [
    {
      groupName: "Wallets",
      wallets: projectId
        ? [metaMaskWallet, rabbyWallet, coinbaseWallet, walletConnectWallet]
        : [injectedWallet, metaMaskWallet, rabbyWallet, coinbaseWallet],
    },
  ],
  // RainbowKit requires a project id string; without a real one only injected wallets are useful.
  { appName: "AagesLend", projectId: projectId || "aageslend-local-dev" },
);

/** Anvil account #1 (account #0 deploys and seeds the pool). Public test key, only funded on a local chain. */
export const ANVIL_DEV_ACCOUNT = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" as const;
export const DEV_WALLET_ENABLED = import.meta.env.VITE_DEV_WALLET === "true" && wanted.includes("local");

// The mock connector forwards eth_sendTransaction to Anvil, which signs for its unlocked accounts.
const devConnectors: CreateConnectorFn[] = DEV_WALLET_ENABLED
  ? [mock({ accounts: [ANVIL_DEV_ACCOUNT], features: { reconnect: true } })]
  : [];

export const config = createConfig({
  chains,
  connectors: [...walletConnectors, ...devConnectors],
  transports: {
    [foundry.id]: http("http://127.0.0.1:8545"),
    [arbitrumSepolia.id]: http(import.meta.env.VITE_ARBITRUM_SEPOLIA_RPC_URL || undefined),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
