# AagesLend frontend

React 18 + Vite + TypeScript, with wagmi v2, viem, RainbowKit and TanStack Query.
All numbers on screen come from the chain (`LendingPool.getAllMarkets`, `getUserAccountData`, `getUserPosition`). Nothing is mocked or random.

## Run against a local Anvil chain

From the repo root (needs Foundry):

```bash
anvil                         # terminal 1
npm run deploy:local          # terminal 2: deploys pool, oracle, mock tokens and feeds
npm run export-abis           # writes src/contracts/abis.ts and deployments.ts
cd frontend
cp .env.example .env.local    # then set VITE_CHAINS=local
npm install
npm run dev
```

With `VITE_DEV_WALLET=true` a dev wallet button connects Anvil account #1 without a browser extension. Otherwise import an Anvil key into MetaMask and use RainbowKit.

## Run against Arbitrum Sepolia

Set `VITE_CHAINS=arbitrumSepolia`, `VITE_ARBITRUM_SEPOLIA_RPC_URL` and `VITE_WALLETCONNECT_PROJECT_ID`, then run `npm run export-abis` after deploying so `deployments.ts` has the live addresses.

## Pages

| Route | What it does |
|---|---|
| `/` | Landing page with live market data |
| `/dashboard` | Markets, your supplies and borrows, health factor, supply/withdraw/borrow/repay modal with HF preview before signing |
| `/faucet` | Mint test tokens, move mock prices, simulate an L2 sequencer outage |
| `/activity` | Your history from the Ponder indexer (`VITE_INDEXER_URL`) |

## Tests

```bash
npm run typecheck
npm test        # vitest: health factor / max borrow / max withdraw math
npm run e2e     # Playwright: faucet, supply, borrow, blocked over-borrow, repay MAX (needs a fresh anvil + deploy)
```
