/**
 * AagesLend liquidation keeper.
 *
 * Loop: fetch the borrower list (Ponder indexer, or contract logs as a fallback), read every borrower's
 * health factor in one multicall, and liquidate anyone under 1.0 with the most profitable debt/collateral
 * pair. Every liquidation is simulated before it is sent, so a race with another keeper costs no gas.
 */
import { readFileSync } from "node:fs";
import {
  createPublicClient,
  createWalletClient,
  erc20Abi,
  formatUnits,
  http,
  maxUint256,
  parseAbiItem,
  type Address,
  type Chain,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia, foundry } from "viem/chains";
import { LendingPoolAbi } from "../abis/LendingPoolAbi.ts";
import { planLiquidation, WAD, type BorrowerPosition, type MarketInfo } from "./plan.ts";

const CHAINS: Record<string, Chain> = { anvil: foundry, arbitrumSepolia };
const chain = CHAINS[process.env.KEEPER_CHAIN ?? "anvil"];
if (!chain) throw new Error(`KEEPER_CHAIN must be one of ${Object.keys(CHAINS).join(", ")}`);

// Anvil account #2 by default: public test key, only meaningful on a local chain.
const ANVIL_KEY_2 = "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a";
const key = (process.env.KEEPER_PRIVATE_KEY ?? (chain.id === foundry.id ? ANVIL_KEY_2 : undefined)) as `0x${string}` | undefined;
if (!key) throw new Error("Set KEEPER_PRIVATE_KEY (a dedicated hot wallet holding only what the keeper needs)");

const rpcUrl = process.env.KEEPER_RPC_URL ?? (chain.id === foundry.id ? "http://127.0.0.1:8545" : undefined);
const indexerUrl = process.env.INDEXER_URL ?? "http://localhost:42069";
const pollMs = Number(process.env.POLL_MS ?? 5_000);
const minBonusUsd = BigInt(Math.round(Number(process.env.MIN_PROFIT_USD ?? 0) * 1e6)) * 10n ** 12n;
const once = process.argv.includes("--once");

const deployment = JSON.parse(readFileSync(new URL(`../../deployments/${chain.id}.json`, import.meta.url), "utf8")) as {
  LendingPool: Address;
  startBlock: number;
};
const pool = deployment.LendingPool;

const account = privateKeyToAccount(key);
const publicClient = createPublicClient({ chain, transport: http(rpcUrl, { batch: true }) });
const walletClient = createWalletClient({ account, chain, transport: http(rpcUrl) });

const log = (msg: string, extra?: Record<string, unknown>) =>
  console.log(`[${new Date().toISOString()}] ${msg}${extra ? " " + JSON.stringify(extra, (_, v) => (typeof v === "bigint" ? v.toString() : v)) : ""}`);

async function borrowersFromIndexer(): Promise<Address[] | null> {
  try {
    const res = await fetch(new URL("/borrowers", indexerUrl), { signal: AbortSignal.timeout(3_000) });
    if (!res.ok) return null;
    return ((await res.json()) as { address: Address }[]).map((b) => b.address);
  } catch {
    return null;
  }
}

/** Fallback when the indexer is down: scan Borrow events directly (chunked to respect RPC limits). */
async function borrowersFromLogs(): Promise<Address[]> {
  const latest = await publicClient.getBlockNumber();
  const event = parseAbiItem("event Borrow(address indexed asset, address indexed user, uint256 amount, uint256 scaledAmount)");
  const users = new Set<Address>();
  const step = 9_000n;
  for (let from = BigInt(deployment.startBlock); from <= latest; from += step + 1n) {
    const to = from + step > latest ? latest : from + step;
    const logs = await publicClient.getLogs({ address: pool, event, fromBlock: from, toBlock: to });
    for (const l of logs) if (l.args.user) users.add(l.args.user);
  }
  return [...users];
}

async function markets(): Promise<MarketInfo[]> {
  const ms = await publicClient.readContract({ address: pool, abi: LendingPoolAbi, functionName: "getAllMarkets" });
  return ms.map((m) => ({ asset: m.asset, decimals: m.decimals, price: m.price, liquidationBonus: m.config.liquidationBonus }));
}

const approved = new Set<string>();
async function ensureAllowance(token: Address, amount: bigint) {
  if (approved.has(token)) return;
  const allowance = await publicClient.readContract({ address: token, abi: erc20Abi, functionName: "allowance", args: [account.address, pool] });
  if (allowance < amount) {
    const hash = await walletClient.writeContract({ address: token, abi: erc20Abi, functionName: "approve", args: [pool, maxUint256] });
    await publicClient.waitForTransactionReceipt({ hash });
    log("approved pool", { token });
  }
  approved.add(token);
}

async function tick() {
  const fromIndexer = await borrowersFromIndexer();
  const borrowers = fromIndexer ?? (await borrowersFromLogs());
  if (borrowers.length === 0) return;

  // JSON-RPC batching (see transport) sends these as one request; works on chains without Multicall3, like Anvil.
  const health = await Promise.all(
    borrowers.map((b) =>
      publicClient
        .readContract({ address: pool, abi: LendingPoolAbi, functionName: "getUserAccountData", args: [b] })
        .then((r) => r.healthFactor)
        .catch(() => null),
    ),
  );
  const underwater = borrowers.filter((_, i) => {
    const hf = health[i];
    return hf !== null && hf !== undefined && hf < WAD;
  });
  log(`checked ${borrowers.length} borrower(s)`, { source: fromIndexer ? "indexer" : "logs", underwater: underwater.length });
  if (underwater.length === 0) return;

  const ms = await markets();
  const balances = new Map<string, bigint>();
  for (const m of ms) {
    balances.set(
      m.asset.toLowerCase(),
      await publicClient.readContract({ address: m.asset, abi: erc20Abi, functionName: "balanceOf", args: [account.address] }),
    );
  }

  for (const borrower of underwater) {
    const hf = health[borrowers.indexOf(borrower)] as bigint;
    const positions: BorrowerPosition[] = [];
    for (const m of ms) {
      const [supplied, , debt, isCollateral] = await publicClient.readContract({
        address: pool,
        abi: LendingPoolAbi,
        functionName: "getUserPosition",
        args: [borrower, m.asset],
      });
      positions.push({ asset: m.asset, supplied, debt, isCollateral });
    }

    const plan = planLiquidation(hf, positions, ms, balances, minBonusUsd);
    if (!plan) {
      log("underwater but no profitable plan (check keeper balances)", { borrower, hf: formatUnits(hf, 18) });
      continue;
    }

    try {
      await ensureAllowance(plan.debtAsset, plan.repayAmount);
      const { request } = await publicClient.simulateContract({
        account,
        address: pool,
        abi: LendingPoolAbi,
        functionName: "liquidate",
        args: [plan.collateralAsset, plan.debtAsset, borrower, plan.repayAmount],
      });
      const hash = await walletClient.writeContract(request);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      log("liquidated", {
        borrower,
        hf: formatUnits(hf, 18),
        repayUsd: formatUnits(plan.repayUsd, 18),
        expectedBonusUsd: formatUnits(plan.expectedBonusUsd, 18),
        tx: hash,
        status: receipt.status,
      });
      balances.set(plan.debtAsset.toLowerCase(), (balances.get(plan.debtAsset.toLowerCase()) ?? 0n) - plan.repayAmount);
    } catch (err) {
      log("liquidation skipped", { borrower, reason: err instanceof Error ? err.message.split("\n")[0] : String(err) });
    }
  }
}

async function main() {
  log("keeper started", { chain: chain!.name, pool, keeper: account.address, indexer: indexerUrl });
  do {
    try {
      await tick();
    } catch (err) {
      log("tick failed", { error: err instanceof Error ? err.message.split("\n")[0] : String(err) });
    }
    if (!once) await new Promise((r) => setTimeout(r, pollMs));
  } while (!once);
}

main();
