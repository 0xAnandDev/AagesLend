import { readFileSync } from "node:fs";
import { createConfig } from "ponder";
import { LendingPoolAbi } from "./abis/LendingPoolAbi";

/**
 * Indexes LendingPool events on one chain, picked by PONDER_CHAIN ("anvil" or "arbitrumSepolia").
 * Addresses and the start block come from ../deployments/<chainId>.json written by the deploy script.
 */
const CHAINS = {
  anvil: { id: 31337, rpc: process.env.PONDER_RPC_URL_31337 ?? "http://127.0.0.1:8545" },
  arbitrumSepolia: {
    id: 421614,
    rpc: process.env.PONDER_RPC_URL_421614 ?? "https://sepolia-rollup.arbitrum.io/rpc",
  },
} as const;

type ChainName = keyof typeof CHAINS;
const chainName = (process.env.PONDER_CHAIN ?? "anvil") as ChainName;
if (!(chainName in CHAINS)) throw new Error(`PONDER_CHAIN must be one of: ${Object.keys(CHAINS).join(", ")}`);
const chain = CHAINS[chainName];

const deployment = JSON.parse(
  readFileSync(new URL(`../deployments/${chain.id}.json`, import.meta.url), "utf8"),
) as { LendingPool: `0x${string}`; startBlock: number };

export default createConfig({
  chains: {
    [chainName]: {
      id: chain.id,
      rpc: chain.rpc,
      // Anvil mines on demand; poll quickly so the UI feels live.
      ...(chain.id === 31337 ? { pollingInterval: 1_000, disableCache: true } : {}),
    },
  } as Record<ChainName, { id: number; rpc: string }>,
  contracts: {
    LendingPool: {
      abi: LendingPoolAbi,
      chain: chainName,
      address: deployment.LendingPool,
      startBlock: deployment.startBlock,
    },
  },
});
