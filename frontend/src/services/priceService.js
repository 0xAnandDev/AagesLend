/**
 * priceService.js
 * Service for fetching token prices from CoinGecko API.
 * Allows easy integration with Chainlink price feeds in the future.
 */

const BASE_URL = 'https://api.coingecko.com/api/v3';
const TIMEOUT_MS = 10000; // 10 seconds for price fetches
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

// In-memory cache
const cache = new Map();

/**
 * Checks cache for valid data
 * @param {string} key - Cache key
 * @returns {any|null} Cached data or null
 */
const getCachedData = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }
  return null;
};

/**
 * Saves data to cache
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 */
const setCachedData = (key, data) => {
  cache.set(key, { timestamp: Date.now(), data });
};

/**
 * Wrapper for fetch with timeout
 * @param {string} url - API URL
 * @returns {Promise<any>} JSON response
 */
const fetchWithTimeout = async (url) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${TIMEOUT_MS}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Get token price in USD from CoinGecko
 * @param {string} tokenId - CoinGecko token ID (e.g., 'ethereum', 'usd-coin')
 * @returns {Promise<{price: number, marketCap: number, volume24h: number, change24h: number}>}
 */
export const getPriceFromCoinGecko = async (tokenId) => {
  const cacheKey = `price_${tokenId}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const url = `${BASE_URL}/simple/price?ids=${tokenId}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`;
    const data = await fetchWithTimeout(url);
    
    if (!data[tokenId]) {
      throw new Error(`Token ${tokenId} not found in response`);
    }

    const result = {
      price: data[tokenId].usd,
      marketCap: data[tokenId].usd_market_cap,
      volume24h: data[tokenId].usd_24h_vol,
      change24h: data[tokenId].usd_24h_change
    };

    setCachedData(cacheKey, result);
    return result;
  } catch (error) {
    console.warn(`[PriceService] Failed to fetch price for ${tokenId}. Error: ${error.message}`);
    throw error;
  }
};

/**
 * Get prices for multiple tokens at once
 * @param {Array<string>} tokenIds - Array of token IDs (e.g., ['ethereum', 'usd-coin'])
 * @returns {Promise<Object>} Object with { tokenId: price }
 */
export const getMultiplePrices = async (tokenIds) => {
  const cacheKey = `prices_multiple_${[...tokenIds].sort().join(',')}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const idsString = tokenIds.join(',');
    const url = `${BASE_URL}/simple/price?ids=${idsString}&vs_currencies=usd`;
    const data = await fetchWithTimeout(url);

    const result = {};
    for (const id of tokenIds) {
      if (data[id] && data[id].usd !== undefined) {
        result[id] = data[id].usd;
      } else {
        result[id] = null;
        console.warn(`[PriceService] Token ${id} missing in multi-price response.`);
      }
    }

    setCachedData(cacheKey, result);
    return result;
  } catch (error) {
    console.warn(`[PriceService] getMultiplePrices failed. Error: ${error.message}`);
    const result = {};
    for (const id of tokenIds) {
      result[id] = null;
    }
    return result;
  }
};

/**
 * Get historical price data for charts
 * @param {string} tokenId - Token ID
 * @param {number|string} days - Number of days (1, 7, 30, 365)
 * @returns {Promise<Array<Array<number>>>} Array of [timestamp, price] pairs
 */
export const getPriceHistory = async (tokenId, days) => {
  const cacheKey = `history_${tokenId}_${days}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const url = `${BASE_URL}/coins/${tokenId}/market_chart?vs_currency=usd&days=${days}`;
    const data = await fetchWithTimeout(url);
    
    if (!data.prices) {
      throw new Error('Invalid history data returned');
    }

    const result = data.prices;
    setCachedData(cacheKey, result);
    return result;
  } catch (error) {
    console.warn(`[PriceService] Failed to fetch history for ${tokenId}. Returning empty array. Error: ${error.message}`);
    return [];
  }
};

/**
 * Get complete market data for a token
 * @param {string} tokenId - Token ID
 * @returns {Promise<{price: number, marketCap: number, volume: number, change24h: number, change7d: number, change30d: number}>}
 */
export const getTokenMarketData = async (tokenId) => {
  const cacheKey = `marketdata_${tokenId}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const url = `${BASE_URL}/coins/${tokenId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;
    const data = await fetchWithTimeout(url);
    
    if (!data.market_data) {
      throw new Error('Invalid market data returned');
    }

    const result = {
      price: data.market_data.current_price.usd,
      marketCap: data.market_data.market_cap.usd,
      volume: data.market_data.total_volume.usd,
      change24h: data.market_data.price_change_percentage_24h,
      change7d: data.market_data.price_change_percentage_7d,
      change30d: data.market_data.price_change_percentage_30d
    };

    setCachedData(cacheKey, result);
    return result;
  } catch (error) {
    console.warn(`[PriceService] Failed to fetch full market data for ${tokenId}. Error: ${error.message}`);
    throw error;
  }
};

const priceService = {
  getPrices: async () => {
    try {
      const ids = ['ethereum', 'usd-coin', 'dai', 'tether', 'weth'];
      const data = await getMultiplePrices(ids);
      return {
        ETH: data['ethereum'] ?? null,
        USDC: data['usd-coin'] ?? null,
        DAI: data['dai'] ?? null,
        USDT: data['tether'] ?? null,
        WETH: data['weth'] ?? null
      };
    } catch (error) {
      console.warn("priceService.getPrices failed:", error);
      return {};
    }
  },
  getPriceFromCoinGecko,
  getMultiplePrices,
  getPriceHistory,
  getTokenMarketData
};

export default priceService;
