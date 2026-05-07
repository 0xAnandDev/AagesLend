import React, { useState, useMemo } from 'react';
import { usePriceData } from '../hooks/usePriceData';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

// Generate smooth curved mock data for charts
const generateChartData = (basePrice, timeframe, volatility) => {
  if (!basePrice) return [];
  const dataPoints = timeframe === '24h' ? 24 : timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 50;
  let currentPrice = basePrice * (1 - (Math.random() * volatility));
  const data = [];
  
  for (let i = 0; i < dataPoints; i++) {
    currentPrice = currentPrice + (currentPrice * (Math.random() - 0.5) * volatility);
    data.push({ value: currentPrice });
  }
  // Ensure the last point matches current price
  data.push({ value: basePrice });
  return data;
};

const AssetCard = ({ symbol, name, iconColor, defaultSupplyApy, defaultBorrowApy }) => {
  const [timeRange, setTimeRange] = useState('24h');
  
  const { prices } = usePriceData();
  const currentPrice = prices?.[symbol] ?? null;
  
  const chartData = useMemo(() => {
     const volatility = symbol === 'USDC' || symbol === 'DAI' ? 0.002 : 0.05;
     return generateChartData(currentPrice || (symbol === 'ETH' ? 3000 : 1), timeRange, volatility);
  }, [currentPrice, timeRange, symbol]);

  const priceDiff = chartData.length > 1 
    ? ((chartData[chartData.length - 1].value - chartData[0].value) / chartData[0].value) * 100 
    : 0;

  return (
    <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[rgba(255,255,255,0.08)] hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(255,255,255,0.05)] hover:border-white/20 transition-all duration-300 flex flex-col h-full group cursor-default">
      
      {/* Header */}
      <div className="flex justify-between items-start mb-5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-inner ${iconColor}`}>
             {symbol.charAt(0)}
          </div>
          <div className="flex flex-col">
             <span className="text-[#f1f1f1] font-bold tracking-tight">{symbol}</span>
             <span className="text-[#9ca3af] text-xs font-medium">{name}</span>
          </div>
        </div>
        <button className="text-xs bg-[#222222] hover:bg-[#333333] text-white px-3 py-1.5 rounded-full transition-colors border border-white/5 font-medium">
          Details
        </button>
      </div>

      {/* Price */}
      <div className="mb-5">
        <div className="text-[32px] font-mono font-bold text-white tracking-tight leading-none mb-1">
           {typeof currentPrice === 'number'
             ? `$${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
             : "Loading..."}
        </div>
        <div className={`text-sm font-semibold flex items-center gap-1 ${priceDiff >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
           {priceDiff >= 0 ? '↗' : '↘'} {Math.abs(priceDiff).toFixed(2)}%
        </div>
      </div>

      {/* Time Controls */}
      <div className="flex items-center gap-1 mb-5 bg-[#121212] p-1 rounded-lg border border-[rgba(255,255,255,0.08)] w-max">
        {['24h', '7d', '30d', 'All'].map(range => (
           <button 
             key={range}
             onClick={() => setTimeRange(range)}
             className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 focus:outline-none ${
               timeRange === range 
                 ? 'bg-[#2a2a2a] text-white shadow-sm border border-white/10'
                 : 'text-[#9ca3af] hover:text-white hover:bg-white/5'
             }`}
           >
             {range}
           </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-28 w-full mb-6 relative">
        {chartData && chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={112}>
            <AreaChart data={chartData}>
               <defs>
                 <linearGradient id={`color-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                   <stop offset="5%" stopColor={priceDiff >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0.3}/>
                   <stop offset="95%" stopColor={priceDiff >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0}/>
                 </linearGradient>
               </defs>
               <Area 
                 type="monotone" 
                 dataKey="value" 
                 stroke={priceDiff >= 0 ? "#10b981" : "#ef4444"} 
                 strokeWidth={2}
                 fillOpacity={1} 
                 fill={`url(#color-${symbol})`} 
               />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* APY Stats */}
      <div className="mt-auto grid grid-cols-2 gap-4 pt-5 border-t border-[rgba(255,255,255,0.08)]">
        <div className="flex flex-col">
           <span className="text-[13px] text-[#9ca3af] font-medium mb-1 uppercase tracking-wider">Supply APY</span>
           <span className="text-lg font-mono font-bold text-[#10b981]">{defaultSupplyApy.toFixed(2)}%</span>
        </div>
        <div className="flex flex-col">
           <span className="text-[13px] text-[#9ca3af] font-medium mb-1 uppercase tracking-wider">Borrow APY</span>
           <span className="text-lg font-mono font-bold text-[#f59e0b]">{defaultBorrowApy.toFixed(2)}%</span>
        </div>
      </div>

    </div>
  );
};

const MarketOverview = () => {
  const assets = [
    { symbol: 'ETH', name: 'Ethereum', iconColor: 'bg-[#374151]', defaultSupplyApy: 3.45, defaultBorrowApy: 4.12 },
    { symbol: 'USDC', name: 'USD Coin', iconColor: 'bg-[#2563eb]', defaultSupplyApy: 8.21, defaultBorrowApy: 10.05 },
    { symbol: 'DAI', name: 'Dai Stablecoin', iconColor: 'bg-[#f59e0b]', defaultSupplyApy: 7.50, defaultBorrowApy: 9.20 },
  ];

  return (
    <div className="w-full pt-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-heading font-semibold text-white uppercase tracking-wider">Market Overview</h2>
        <span className="text-xs font-medium bg-[#111] border border-[#333] px-3 py-1 rounded-full text-green-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Live Feeds
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {assets.map(asset => (
          <AssetCard key={asset.symbol} {...asset} />
        ))}
      </div>
    </div>
  );
};

export default MarketOverview;
