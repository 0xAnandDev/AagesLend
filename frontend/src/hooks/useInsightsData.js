import { useState, useEffect, useCallback } from 'react';
import { getMarketData } from '../services/blockchainService';
import priceService from '../services/priceService';

const SYMBOL_TO_COINGECKO = {
  'WETH': 'weth',
  'ETH': 'ethereum',
  'USDC': 'usd-coin',
  'DAI': 'dai',
  'USDT': 'tether'
};

export const useInsightsData = () => {
  const [data, setData] = useState({
    assets: [],
    protocol: {
      totalDepositsUSD: 0,
      totalBorrowsUSD: 0,
      totalAvailableUSD: 0,
      utilization: 0,
      tvl: 0
    },
    loading: true,
    error: null,
    lastUpdated: Date.now()
  });

  const fetchData = useCallback(async () => {
    try {
      // Get blockchain market data (deposits, borrows)
      const markets = await getMarketData();
      
      let totalDepositsUSD = 0;
      let totalBorrowsUSD = 0;
      let totalAvailableUSD = 0;

      const assets = await Promise.all(markets.map(async (market) => {
        let priceChange24h = 0;
        let actualPrice = market.price;
        
        const cgId = SYMBOL_TO_COINGECKO[market.symbol.toUpperCase()];
        if (cgId) {
          try {
            const marketInfo = await priceService.getTokenMarketData(cgId);
            if (marketInfo) {
              priceChange24h = marketInfo.change24h || 0;
              actualPrice = marketInfo.price || market.price;
            }
          } catch (e) {
            console.warn(`Failed to get CoinGecko price for ${market.symbol}`);
          }
        }

        const depositUSD = market.totalDeposits * actualPrice;
        const borrowUSD = market.totalBorrows * actualPrice;
        
        totalDepositsUSD += depositUSD;
        totalBorrowsUSD += borrowUSD;
        totalAvailableUSD += market.availableLiquidity * actualPrice;

        return {
          symbol: market.symbol,
          tokenAddress: market.address,
          price: actualPrice,
          priceChange24h,
          totalDeposits: market.totalDeposits,
          totalBorrows: market.totalBorrows,
          totalDepositsUSD: depositUSD,
          totalBorrowsUSD: borrowUSD,
          utilization: market.utilization,
          availableLiquidity: market.availableLiquidity
        };
      }));

      const protocolUtilization = totalDepositsUSD > 0 
        ? (totalBorrowsUSD / totalDepositsUSD) * 100 
        : 0;

      setData({
        assets,
        protocol: {
          totalDepositsUSD,
          totalBorrowsUSD,
          totalAvailableUSD,
          utilization: protocolUtilization,
          tvl: totalDepositsUSD
        },
        loading: false,
        error: null,
        lastUpdated: Date.now()
      });

    } catch (err) {
      console.error("useInsightsData error:", err);
      setData(prev => ({
        ...prev,
        loading: false,
        error: err.message || "Failed to fetch insights data"
      }));
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { ...data, refetch: fetchData };
};
