import { useMemo } from "react";
import { erc20Abi, type Address } from "viem";
import { useAccount, useChainId, useReadContract, useReadContracts } from "wagmi";
import { lendingPoolAbi } from "../contracts/abis";
import { getDeployment, tokensFor, type TokenInfo } from "../lib/protocol";
import type { AccountData, MarketParams } from "../lib/math";

const REFRESH_MS = 8_000;

/** Deployment for the connected chain (or the default chain when disconnected). */
export function useDeployment() {
  const { chainId: walletChainId, isConnected } = useAccount();
  const defaultChainId = useChainId();
  const chainId = isConnected ? walletChainId : defaultChainId;
  const deployment = getDeployment(chainId);
  return { chainId: chainId ?? defaultChainId, deployment, tokens: deployment ? tokensFor(deployment) : [] };
}

export type Market = {
  token: TokenInfo;
  alToken: Address;
  decimals: number;
  ltv: number;
  liquidationThreshold: number;
  liquidationBonus: number;
  reserveFactor: number;
  borrowEnabled: boolean;
  supplyCap: bigint;
  borrowCap: bigint;
  cash: bigint;
  totalDebt: bigint;
  reserves: bigint;
  totalSupplied: bigint;
  utilization: bigint;
  borrowRate: bigint;
  supplyRate: bigint;
  exchangeRate: bigint;
  price: bigint;
  params: MarketParams;
};

/** All markets from LendingPool.getAllMarkets, joined with token metadata. */
export function useMarkets() {
  const { chainId, deployment, tokens } = useDeployment();
  const query = useReadContract({
    chainId,
    address: deployment?.LendingPool,
    abi: lendingPoolAbi,
    functionName: "getAllMarkets",
    query: { enabled: !!deployment, refetchInterval: REFRESH_MS },
  });

  const markets = useMemo<Market[]>(() => {
    if (!query.data) return [];
    return query.data.flatMap((m) => {
      const token = tokens.find((t) => t.address.toLowerCase() === m.asset.toLowerCase());
      if (!token) return [];
      return [
        {
          token,
          alToken: m.alToken,
          decimals: m.decimals,
          ltv: m.config.ltv,
          liquidationThreshold: m.config.liquidationThreshold,
          liquidationBonus: m.config.liquidationBonus,
          reserveFactor: m.config.reserveFactor,
          borrowEnabled: m.config.borrowEnabled,
          supplyCap: m.config.supplyCap,
          borrowCap: m.config.borrowCap,
          cash: m.cash,
          totalDebt: m.totalDebt,
          reserves: m.reserves,
          totalSupplied: m.totalSupplied,
          utilization: m.utilization,
          borrowRate: m.borrowRate,
          supplyRate: m.supplyRate,
          exchangeRate: m.exchangeRate,
          price: m.price,
          params: {
            decimals: m.decimals,
            price: m.price,
            ltv: m.config.ltv,
            liquidationThreshold: m.config.liquidationThreshold,
          },
        },
      ];
    });
  }, [query.data, tokens]);

  return { ...query, markets, deployment, chainId };
}

export type Position = {
  token: TokenInfo;
  supplied: bigint;
  shares: bigint;
  debt: bigint;
  isCollateral: boolean;
  walletBalance: bigint;
  allowance: bigint;
};

/** The connected user's account totals and per-market positions, wallet balances and allowances. */
export function useUserData() {
  const { address } = useAccount();
  const { chainId, deployment, tokens } = useDeployment();
  const enabled = !!address && !!deployment;
  const pool = deployment?.LendingPool;

  const account = useReadContract({
    chainId,
    address: pool,
    abi: lendingPoolAbi,
    functionName: "getUserAccountData",
    args: address ? [address] : undefined,
    query: { enabled, refetchInterval: REFRESH_MS },
  });

  const contracts = useMemo(
    () =>
      address && pool
        ? tokens.flatMap((t) => [
            {
              chainId,
              address: pool,
              abi: lendingPoolAbi,
              functionName: "getUserPosition",
              args: [address, t.address],
            } as const,
            { chainId, address: t.address, abi: erc20Abi, functionName: "balanceOf", args: [address] } as const,
            { chainId, address: t.address, abi: erc20Abi, functionName: "allowance", args: [address, pool] } as const,
          ])
        : [],
    [address, pool, tokens, chainId],
  );

  const reads = useReadContracts({ contracts, query: { enabled, refetchInterval: REFRESH_MS } });

  const positions = useMemo<Position[]>(() => {
    if (!reads.data) return [];
    return tokens.map((token, i) => {
      const pos = reads.data[i * 3]?.result as readonly [bigint, bigint, bigint, boolean] | undefined;
      const bal = reads.data[i * 3 + 1]?.result as bigint | undefined;
      const allow = reads.data[i * 3 + 2]?.result as bigint | undefined;
      return {
        token,
        supplied: pos?.[0] ?? 0n,
        shares: pos?.[1] ?? 0n,
        debt: pos?.[2] ?? 0n,
        isCollateral: pos?.[3] ?? false,
        walletBalance: bal ?? 0n,
        allowance: allow ?? 0n,
      };
    });
  }, [reads.data, tokens]);

  const accountData: AccountData | undefined = account.data
    ? {
        collateralUsd: account.data.collateralUsd,
        debtUsd: account.data.debtUsd,
        borrowLimitUsd: account.data.borrowLimitUsd,
        liquidationLimitUsd: account.data.liquidationLimitUsd,
        healthFactor: account.data.healthFactor,
      }
    : undefined;

  return {
    address,
    account: accountData,
    positions,
    isLoading: account.isLoading || reads.isLoading,
    error: account.error ?? reads.error,
    refetch: () => Promise.all([account.refetch(), reads.refetch()]),
  };
}
