import React, { createContext, useState, useEffect, useCallback } from 'react';
import priceService from '../services/priceService';

export const PriceContext = createContext();

export const PriceProvider = ({ children }) => {
  const [prices, setPrices] = useState({});
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPrices = useCallback(async () => {
    try {
      const data = await priceService.getPrices();
      setPrices(data || {});
      setLastUpdate(Date.now());
    } catch (err) {
      console.warn("PriceContext: Error refreshing prices", err);
      setPrices((prev) => prev || {});
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
    // Auto-update prices every 10 seconds
    const interval = setInterval(fetchPrices, 10000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  const getPriceForToken = useCallback((address) => {
    // Map token address or symbol to our price object
    // Assuming 'address' matches the keys for simplicity here.
    return prices[address] ?? null;
  }, [prices]);

  const refreshPrices = useCallback(() => {
    return fetchPrices();
  }, [fetchPrices]);

  const getTokenValueInUSD = useCallback((amount, tokenAddress) => {
    const price = getPriceForToken(tokenAddress);
    if (price === null || Number.isNaN(Number(amount))) {
      return null;
    }
    return Number(amount) * price;
  }, [getPriceForToken]);

  const value = React.useMemo(() => ({
    prices,
    lastUpdate,
    isLoading,
    getPriceForToken,
    refreshPrices,
    getTokenValueInUSD
  }), [prices, lastUpdate, isLoading, getPriceForToken, refreshPrices, getTokenValueInUSD]);

  return (
    <PriceContext.Provider value={value}>
      {children}
    </PriceContext.Provider>
  );
};
