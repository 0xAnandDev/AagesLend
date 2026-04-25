/**
 * testApiConnections.js
 * Utility to test all external API connections and RPC endpoints for AagesLend.
 */

const ETHERSCAN_API_KEY = import.meta.env.REACT_APP_ETHERSCAN_API_KEY || '';
const INFURA_KEY = import.meta.env.REACT_APP_INFURA_KEY || '';
const ALCHEMY_KEY = import.meta.env.REACT_APP_ALCHEMY_KEY || '';
const RPC_URL = import.meta.env.REACT_APP_RPC_URL || '';

/**
 * Helper to measure latency of a promise execution
 * @param {Promise} fetchPromise 
 * @returns {Promise<{success: boolean, data: any, error: string, latency: number}>}
 */
const measureLatency = async (fetchPromise) => {
  const start = performance.now();
  try {
    const result = await fetchPromise;
    const latency = Math.round(performance.now() - start);
    return { success: true, data: result, latency };
  } catch (error) {
    const latency = Math.round(performance.now() - start);
    return { success: false, error: error.message, latency };
  }
};

/**
 * 1. Test Etherscan API connection (Get current gas price)
 * @returns {Promise<{status: 'ok'|'error', message: string, latency: number}>}
 */
export const testEtherscanAPI = async () => {
  const url = `https://api-sepolia.etherscan.io/api?module=proxy&action=eth_gasPrice&apikey=${ETHERSCAN_API_KEY}`;
  
  const { success, data, error, latency } = await measureLatency(
    // Using simple AbortSignal for 10s timeout if supported, else relies on network failure
    fetch(url, { signal: AbortSignal.timeout ? AbortSignal.timeout(10000) : undefined }).then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
  );

  if (success && data && data.result) {
    return { status: 'ok', message: 'Connected', latency };
  }
  return { status: 'error', message: error || 'Invalid Etherscan response', latency };
};

/**
 * 2. Test CoinGecko API connection (Get ETH price)
 * @returns {Promise<{status: 'ok'|'error', price: number|null, latency: number, message: string}>}
 */
export const testCoinGeckoAPI = async () => {
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd`;
  
  const { success, data, error, latency } = await measureLatency(
    fetch(url, { signal: AbortSignal.timeout ? AbortSignal.timeout(10000) : undefined }).then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
  );

  if (success && data && data.ethereum && data.ethereum.usd) {
    return { status: 'ok', price: data.ethereum.usd, message: 'Connected', latency };
  }
  return { status: 'error', price: null, message: error || 'Invalid CoinGecko response', latency };
};

/**
 * Helper to test any JSON-RPC endpoint by fetching chainId
 */
const testRpcEndpoint = async (url) => {
  if (!url) throw new Error('No RPC URL provided');
  
  const body = JSON.stringify({
    jsonrpc: '2.0',
    method: 'eth_chainId',
    params: [],
    id: 1
  });

  const { success, data, error, latency } = await measureLatency(
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: AbortSignal.timeout ? AbortSignal.timeout(10000) : undefined
    }).then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
  );

  if (success && data && data.result) {
    return { status: 'ok', chainId: parseInt(data.result, 16), message: 'Connected', latency };
  }
  return { status: 'error', chainId: null, message: error || 'Invalid RPC response', latency };
};

/**
 * 3. Test Infura RPC connection
 * @returns {Promise<{status: 'ok'|'error', chainId: number|null, latency: number, message: string}>}
 */
export const testInfuraRPC = async () => {
  try {
    if (!INFURA_KEY && !RPC_URL.includes('infura')) {
      return { status: 'error', chainId: null, message: 'Infura key not configured', latency: 0 };
    }
    const url = RPC_URL.includes('infura') ? RPC_URL : `https://sepolia.infura.io/v3/${INFURA_KEY}`;
    return await testRpcEndpoint(url);
  } catch (error) {
    return { status: 'error', chainId: null, message: error.message, latency: 0 };
  }
};

/**
 * 4. Test Alchemy RPC connection
 * @returns {Promise<{status: 'ok'|'error', chainId: number|null, latency: number, message: string}>}
 */
export const testAlchemyRPC = async () => {
  try {
    if (!ALCHEMY_KEY && !RPC_URL.includes('alchemy')) {
      return { status: 'error', chainId: null, message: 'Alchemy key not configured', latency: 0 };
    }
    const url = RPC_URL.includes('alchemy') ? RPC_URL : `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`;
    return await testRpcEndpoint(url);
  } catch (error) {
    return { status: 'error', chainId: null, message: error.message, latency: 0 };
  }
};

/**
 * 5. Run all tests and return a comprehensive summary
 * @returns {Promise<{etherscan: Object, coingecko: Object, infura: Object, alchemy: Object}>}
 */
export const testAllConnections = async () => {
  const [etherscan, coingecko, infura, alchemy] = await Promise.all([
    testEtherscanAPI(),
    testCoinGeckoAPI(),
    testInfuraRPC(),
    testAlchemyRPC()
  ]);

  return {
    etherscan,
    coingecko,
    infura,
    alchemy
  };
};

/**
 * 6. Get a formatted status string showing all APIs
 * @returns {Promise<string>} Multi-line string with visual indicators
 */
export const getFullStatus = async () => {
  const results = await testAllConnections();
  
  const formatResult = (name, res) => {
    const icon = res.status === 'ok' ? '✅' : '❌';
    const detail = res.status === 'ok' ? `${res.latency}ms` : res.message;
    return `${icon} ${name}: ${detail}`;
  };

  const output = [
    formatResult('Etherscan API', results.etherscan),
    formatResult('CoinGecko API', results.coingecko)
  ];
  
  if (INFURA_KEY || RPC_URL.includes('infura')) {
    output.push(formatResult('Infura RPC', results.infura));
  }
  
  if (ALCHEMY_KEY || RPC_URL.includes('alchemy')) {
    output.push(formatResult('Alchemy RPC', results.alchemy));
  }
  
  // Custom RPC catch-all if explicitly not Infura or Alchemy
  if (!INFURA_KEY && !ALCHEMY_KEY && RPC_URL && !RPC_URL.includes('infura') && !RPC_URL.includes('alchemy')) {
    const customRpc = await testRpcEndpoint(RPC_URL);
    output.push(formatResult('Custom RPC', customRpc));
  }

  return output.join('\n');
};
