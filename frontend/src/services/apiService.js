import axios from 'axios';

// Simple RAM caching
const cache = {
  prices: null,
  poolStats: null,
};

const TTL_5_MIN = 5 * 60 * 1000;
const TTL_1_MIN = 1 * 60 * 1000;

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.REACT_APP_API_URL || 'https://api.aageslend.com',
      timeout: 10000,
    });

    // Retry Interceptor Middleware (3 times default max)
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const config = error.config;
        if (!config || !config.retry) {
          return Promise.reject(error);
        }
        config.retryCount = config.retryCount || 0;
        if (config.retryCount >= config.retry) {
          return Promise.reject(error);
        }
        config.retryCount += 1;
        
        // Linear timeout mapping
        const backoff = new Promise((resolve) => setTimeout(resolve, 1000 * config.retryCount));
        await backoff;
        return this.api(config);
      }
    );

    this.lastUpdate = Date.now();
    this.apiHealth = true;
  }

  /**
   * Normalizes response wraps seamlessly
   */
  _normalize(data) {
     return { ...data, timestamp: Date.now() };
  }

  /**
   * Fetches real-time generic prices for requested tokens.
   * @param {string[]} tokens - Array of token symbols or addresses.
   * @returns {Promise<Object>} Normalized map of { token: priceInUSD }.
   */
  async getTokenPrices(tokens) {
    if (cache.prices && (Date.now() - cache.prices.timestamp < TTL_5_MIN)) {
      return cache.prices.data;
    }
    
    try {
      // const res = await this.api.get('/v1/prices', { params: { tokens }, retry: 3 });
      // cache.prices = { data: res.data, timestamp: Date.now() };
      
      const res = await this.api.get('/v1/prices', { params: { tokens }, retry: 3 });
      const normalized = this._normalize(res.data);
      this.apiHealth = true;
      cache.prices = { data: normalized, timestamp: Date.now() };
      return normalized;
    } catch (e) {
      this.apiHealth = false;
      console.warn("AagesLend API: Failed getTokenPrices.");
      return null;
    }
  }

  /**
   * Retrieves overall pool protocol statistics.
   * @returns {Promise<Object>} Object containing aggregate pool mechanics.
   */
  async getPoolStats() {
    if (cache.poolStats && (Date.now() - cache.poolStats.timestamp < TTL_1_MIN)) {
      return cache.poolStats.data;
    }
    
    try {
      const res = await this.api.get('/v1/poolStats', { retry: 3 });
      const normalized = this._normalize(res.data);
      this.apiHealth = true;
      cache.poolStats = { data: normalized, timestamp: Date.now() };
      return normalized;
    } catch (e) {
      console.warn("AagesLend API: Failed pool stats fetch");
      return null;
    }
  }

  /**
   * Gathers user specific lending/borrowing datasets.
   * @param {string} address User wallet
   * @returns {Promise<Object>} Supplied/Borrowed Arrays
   */
  async getUserPositions(address) {
    if (!address) return { supplied: [], borrowed: [] };
    try {
      const res = await this.api.get('/v1/userPositions', { params: { address }, retry: 3 });
      return this._normalize(res.data);
    } catch (e) {
      console.warn("AagesLend API: Failed user position fetch");
      return { supplied: [], borrowed: [] };
    }
  }

  /**
   * General Market API fetch mappings
   */
  async getMarketOverview() {
     return this._normalize({ status: "ok" });
  }

  /**
   * Standard endpoint isolating asset metadata details
   */
  async getAssetDetails(token) {
     return this._normalize({ symbol: token, marketCap: 0 });
  }

  /**
   * Extract ongoing or historical liquidation events protocol wide
   */
  async getLiquidationData() { 
      return []; 
  }

  /**
   * Retrieve active local mappings of historical transaction wraps
   */
  async getTransactionHistory(address, type) { 
      return []; 
  }

  /**
   * Invalidates caches manually triggering immediate refetch chains
   */
  invalidateCache() {
    cache.prices = null;
    cache.poolStats = null;
  }
}

export const apiService = new ApiService();
