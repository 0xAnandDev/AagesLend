/**
 * etherscanService.js
 * Service for interacting with the Etherscan API.
 */

const ETHERSCAN_API_KEY = import.meta.env.REACT_APP_ETHERSCAN_API_KEY || '';
const BASE_URL = import.meta.env.REACT_APP_ETHERSCAN_BASE_URL || 'https://api-sepolia.etherscan.io/api';
const TIMEOUT_MS = 30000; // 30 seconds

// Simple rate limiter: max 5 requests per second
const RATE_LIMIT_MS = 1000 / 5; // 200ms per request minimum spacing
let lastRequestTime = 0;

/**
 * Handles rate limiting for Etherscan API calls
 * @returns {Promise<void>}
 */
const rateLimit = async () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < RATE_LIMIT_MS) {
    const delay = RATE_LIMIT_MS - timeSinceLastRequest;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  lastRequestTime = Date.now();
};

/**
 * Wrapper for fetch with timeout and rate limiting
 * @param {string} url - API URL
 * @returns {Promise<any>} JSON response
 */
const fetchWithTimeout = async (url) => {
  await rateLimit();
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    // Etherscan typically returns status "1" for success and "0" for error
    if (data.status === "0" && data.message !== "No transactions found") {
      throw new Error(data.result || data.message || "Etherscan API error");
    }
    
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`[EtherscanService] Request timed out after ${TIMEOUT_MS / 1000}s for URL: ${url}`);
      throw new Error('Request timed out');
    }
    console.error(`[EtherscanService] Fetch error for URL: ${url}`, error);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Helper to build Etherscan API URL
 * @param {string} module - API module
 * @param {string} action - API action
 * @param {Object} params - Additional query parameters
 * @returns {string} URL string
 */
const buildUrl = (module, action, params = {}) => {
  const url = new URL(BASE_URL);
  url.searchParams.append('module', module);
  url.searchParams.append('action', action);
  url.searchParams.append('apikey', ETHERSCAN_API_KEY);
  
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.append(key, value);
  }
  
  return url.toString();
};

/**
 * Get current gas price in Gwei
 * @returns {Promise<string>} Gas price in Gwei
 */
export const getGasPrice = async () => {
  try {
    const url = buildUrl('proxy', 'eth_gasPrice');
    const data = await fetchWithTimeout(url);
    
    // proxy endpoints return result in hex (Wei)
    const weiHex = data.result;
    const wei = BigInt(weiHex);
    const gwei = Number(wei) / 1e9;
    
    return gwei.toString();
  } catch (error) {
    console.error('[EtherscanService] getGasPrice failed:', error);
    throw error;
  }
};

/**
 * Get transactions for a wallet address
 * @param {string} address - Wallet address
 * @returns {Promise<Array>} Array of transactions (hash, from, to, value, gasUsed, timestamp)
 */
export const getTransactionHistory = async (address) => {
  try {
    const url = buildUrl('account', 'txlist', {
      address,
      startblock: 0,
      endblock: 99999999,
      page: 1,
      offset: 100,
      sort: 'desc'
    });
    const data = await fetchWithTimeout(url);
    
    if (!data.result || !Array.isArray(data.result)) {
      return [];
    }

    return data.result.map(tx => ({
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: tx.value,
      gasUsed: tx.gasUsed,
      timestamp: parseInt(tx.timeStamp, 10) * 1000 // Convert to milliseconds
    }));
  } catch (error) {
    console.error(`[EtherscanService] getTransactionHistory failed for address ${address}:`, error);
    throw error;
  }
};

/**
 * Check if transaction is confirmed
 * @param {string} txHash - Transaction hash
 * @returns {Promise<{status: 'success'|'pending'|'failed', confirmations: number}>}
 */
export const getTransactionStatus = async (txHash) => {
  try {
    // We use eth_getTransactionReceipt to check status and block
    const proxyUrl = buildUrl('proxy', 'eth_getTransactionReceipt', { txhash: txHash });
    const proxyData = await fetchWithTimeout(proxyUrl);
    
    if (!proxyData.result) {
      return { status: 'pending', confirmations: 0 };
    }

    const receipt = proxyData.result;
    const isSuccess = receipt.status === '0x1';
    const status = isSuccess ? 'success' : 'failed';
    
    let confirmations = 0;
    if (receipt.blockNumber) {
      const blockUrl = buildUrl('proxy', 'eth_blockNumber');
      const blockData = await fetchWithTimeout(blockUrl);
      const currentBlock = parseInt(blockData.result, 16);
      const txBlock = parseInt(receipt.blockNumber, 16);
      confirmations = Math.max(0, currentBlock - txBlock);
    }

    return { status, confirmations };
  } catch (error) {
    console.error(`[EtherscanService] getTransactionStatus failed for hash ${txHash}:`, error);
    throw error;
  }
};

/**
 * Fetch ABI from Etherscan for verified contracts
 * @param {string} contractAddress - Verified contract address
 * @returns {Promise<Array>} ABI as JSON array
 */
export const getContractABI = async (contractAddress) => {
  try {
    const url = buildUrl('contract', 'getabi', { address: contractAddress });
    const data = await fetchWithTimeout(url);
    
    return JSON.parse(data.result);
  } catch (error) {
    console.error(`[EtherscanService] getContractABI failed for address ${contractAddress}:`, error);
    throw error;
  }
};

/**
 * Get token balance using tokenbalance endpoint
 * @param {string} contractAddress - ERC20 token address
 * @param {string} walletAddress - Wallet address to check
 * @returns {Promise<string>} Token balance as string (big number)
 */
export const getERC20TokenBalance = async (contractAddress, walletAddress) => {
  try {
    const url = buildUrl('account', 'tokenbalance', {
      contractaddress: contractAddress,
      address: walletAddress,
      tag: 'latest'
    });
    
    const data = await fetchWithTimeout(url);
    return data.result; // returns a string representation of big int
  } catch (error) {
    console.error(`[EtherscanService] getERC20TokenBalance failed for token ${contractAddress} and wallet ${walletAddress}:`, error);
    throw error;
  }
};
