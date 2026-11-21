import type { Address } from "viem";
import { deployments } from "../contracts/deployments";

export type Deployment = {
  chainId: number;
  LendingPool: Address;
  ChainlinkOracle: Address;
  USDC: Address;
  WETH: Address;
  WBTC: Address;
  alUSDC: Address;
  alWETH: Address;
  alWBTC: Address;
  USDC_USD_FEED: Address;
  ETH_USD_FEED: Address;
  BTC_USD_FEED: Address;
  SEQUENCER_UPTIME_FEED: Address;
  mockFeeds: boolean;
  startBlock: number;
};

export type TokenInfo = {
  symbol: "USDC" | "WETH" | "WBTC";
  name: string;
  address: Address;
  feed: Address;
  color: string;
};

export function getDeployment(chainId: number | undefined): Deployment | undefined {
  if (chainId === undefined) return undefined;
  return (deployments as unknown as Record<string, Deployment>)[String(chainId)];
}

export function tokensFor(d: Deployment): TokenInfo[] {
  return [
    { symbol: "USDC", name: "USD Coin", address: d.USDC, feed: d.USDC_USD_FEED, color: "#2775CA" },
    { symbol: "WETH", name: "Wrapped Ether", address: d.WETH, feed: d.ETH_USD_FEED, color: "#8C8CF7" },
    { symbol: "WBTC", name: "Wrapped Bitcoin", address: d.WBTC, feed: d.BTC_USD_FEED, color: "#F7931A" },
  ];
}

export function explorerTx(chainId: number, hash: string): string | undefined {
  if (chainId === 421614) return `https://sepolia.arbiscan.io/tx/${hash}`;
  return undefined;
}

export function explorerAddress(chainId: number, address: string): string | undefined {
  if (chainId === 421614) return `https://sepolia.arbiscan.io/address/${address}`;
  return undefined;
}

/** Friendly text for the pool's custom errors. */
export const ERROR_MESSAGES: Record<string, string> = {
  ExceedsBorrowLimit: "This would put you over your borrow limit.",
  InsufficientLiquidity: "Not enough liquidity in this market right now.",
  InsufficientShares: "You don't have that much supplied.",
  SupplyCapExceeded: "This market's supply cap has been reached.",
  BorrowCapExceeded: "This market's borrow cap has been reached.",
  BorrowNotEnabled: "Borrowing is disabled for this asset.",
  HealthyPosition: "This position is healthy and can't be liquidated.",
  SelfLiquidation: "You can't liquidate your own position.",
  NoDebt: "There is no debt to repay.",
  NotCollateral: "This asset isn't enabled as collateral.",
  ZeroAmount: "Enter an amount greater than zero.",
  EnforcedPause: "The protocol is paused.",
  StalePrice: "The price feed is stale. Try again after it updates.",
  SequencerDown: "The Arbitrum sequencer is down, so prices can't be trusted right now.",
  SequencerGracePeriodNotOver: "The sequencer just came back up. Prices unlock after a 1-hour grace period.",
  PriceOutOfBounds: "The oracle price is outside its safety bounds.",
  FaucetCooldown: "You can use the faucet once per day per token.",
};
