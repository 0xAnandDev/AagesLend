# AagesLend API Setup Guide

Welcome to the AagesLend API Setup Guide! This document explains how external APIs and RPC providers are configured, how to use them safely within the frontend, and what to do if things go wrong.

---

## 1. API Overview

To power the AagesLend frontend, we rely on a few crucial external services:

*   **RPC Providers (Infura / Alchemy)**:
    *   *What it does*: Acts as our gateway to the Ethereum network. It allows our app to read blockchain data (like user balances) and broadcast transactions.
    *   *Why we need it*: Without a node/provider, the frontend cannot talk to the blockchain.
    *   *Status*: Free tiers available (highly recommended to sign up).
*   **Etherscan API**:
    *   *What it does*: Fetches detailed transaction history, gas prices, ERC20 balances, and smart contract ABIs.
    *   *Why we need it*: Reading history natively from an RPC node is slow and complex. Etherscan provides an instant index.
    *   *Status*: Free tier available (up to 5 calls/sec).
*   **CoinGecko API**:
    *   *What it does*: Fetches real-time USD prices for tokens (like ETH, USDC, DAI).
    *   *Why we need it*: To display portfolio values in fiat currency on our dashboard.
    *   *Status*: Free, public API (No API key required!).

---

## 2. Environment Variables

To make sure these APIs work correctly, you must configure your `.env` file in the `frontend` folder. Do not forget the `REACT_APP_` prefix, otherwise React won't load them!

```env
# Etherscan API Key for transaction history and ABIs
REACT_APP_ETHERSCAN_API_KEY=your_etherscan_api_key

# RPC Keys for blockchain connectivity
REACT_APP_INFURA_KEY=your_infura_project_id
REACT_APP_ALCHEMY_KEY=your_alchemy_api_key

# Main RPC URL (used as priority if set)
REACT_APP_RPC_URL=https://sepolia.infura.io/v3/your_infura_project_id

# Chainlink Price Feed Addresses (If integration is added later)
REACT_APP_CHAINLINK_ETH_USD=0x694AA1769357215DE4FAC081bf1f309aDC325306
```

### Explanations:
*   `REACT_APP_ETHERSCAN_API_KEY`: Grab this from Etherscan's developer portal.
*   `REACT_APP_INFURA_KEY` & `REACT_APP_ALCHEMY_KEY`: The services will use whichever key is provided. If both are missing, the app will try to use MetaMask's (`window.ethereum`) connection.
*   `REACT_APP_RPC_URL`: The direct RPC URL to use for all contract read operations.

---

## 3. Using the Services

We have abstracted all API calls into dedicated service files located in `src/services/`.

### Etherscan Service
Use this for checking transaction history, fetching gas prices, or finding contract ABIs.

```javascript
import { getGasPrice, getTransactionHistory } from '../services/etherscanService';

// Example: Fetch Gas Price
const fetchGas = async () => {
  try {
    const gas = await getGasPrice();
    console.log(`Current Gas: ${gas} Gwei`);
  } catch (err) {
    console.error("Failed to fetch gas price", err);
  }
}
```

### Price Service
Use this to get token prices or market data from CoinGecko.

```javascript
import { getPriceFromCoinGecko, getMultiplePrices } from '../services/priceService';

// Example: Fetch ETH and USDC prices
const fetchPrices = async () => {
  const prices = await getMultiplePrices(['ethereum', 'usd-coin']);
  console.log(`ETH is $${prices['ethereum']}`); // Outputs: ETH is $3000
};
```

### Contract Service
Use this to read from and write to our deployed AagesLend smart contracts.

```javascript
import { callReadFunction, sendTransaction } from '../services/contractService';
import { ethers } from 'ethers';

const LENDING_POOL_ADDRESS = "0xYourContractAddress";
const LENDING_POOL_ABI = [ /* Your ABI */ ];

// Example: Calling a Read Function
const checkLiquidity = async () => {
  const liquidity = await callReadFunction(
    LENDING_POOL_ADDRESS, 
    LENDING_POOL_ABI, 
    "totalLiquidity"
  );
  console.log("Liquidity:", ethers.formatEther(liquidity));
};
```

---

## 4. Testing APIs

We have built a diagnostic utility to verify if your keys are correct and networks are reachable.

### Running the Tests
You can import the `testApiConnections` utility anywhere in your app (like an Admin Dashboard or an App initialization effect).

```javascript
import { getFullStatus } from '../utils/testApiConnections';

const checkDiagnostics = async () => {
  const statusString = await getFullStatus();
  console.log("API Status Report:\n", statusString);
  // Example Output:
  // ✅ Etherscan API: 245ms
  // ✅ CoinGecko API: 180ms
  // ❌ Infura RPC: Invalid Project ID
};
```

**What to check:**
*   A `✅` means the connection is solid and latency is acceptable.
*   A `❌` usually implies a missing `.env` key or a network rejection.

---

## 5. Common Issues & Troubleshooting

**❌ "API key invalid" or 401 Unauthorized**
*   **Solution**: Double-check your `.env` file. Ensure there are no trailing spaces or quotation marks around the key. Restart your React development server (`npm start` or `npm run dev`), as `.env` changes are not hot-reloaded!

**❌ "RPC connection failed" or NETWORK_ERROR**
*   **Solution**: Make sure your `REACT_APP_INFURA_KEY` or `REACT_APP_ALCHEMY_KEY` is active. If you are using a VPN, sometimes public RPC nodes block VPN IPs. Try turning off your VPN.

**❌ "Wrong network"**
*   **Solution**: The user's MetaMask might be connected to Ethereum Mainnet while your app relies on Sepolia Testnet. Prompt the user to switch networks in their wallet to Sepolia.

**❌ "Gas too high" or intrinsic gas too low**
*   **Solution**: Ensure the user has enough testnet Sepolia ETH to cover the transaction fee. You can estimate gas using the `estimateGas()` function in the `contractService` before sending the transaction to prevent outright failures.

---

## 6. Security Best Practices

*   🔒 **Never commit your `.env` file**: Ensure `.env` is listed in your `.gitignore` file. Pushing API keys to GitHub is a major security risk.
*   🔄 **Rotate keys periodically**: If you suspect a key (like your Etherscan or Alchemy key) has been leaked, regenerate it immediately on their respective dashboard.
*   🚫 **Frontend Limitations**: Remember, anything prefixed with `REACT_APP_` is bundled into your frontend build and is visible to the user. Do **not** put sensitive backend private keys in these variables! Only use public-facing API keys here.
