import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { usePriceHistory } from '../../hooks/usePriceData';

const PriceChart = ({ token = 'ETH' }) => {
  const [timeRange, setTimeRange] = useState('24h');
  const { history, isLoading, error } = usePriceHistory(token, timeRange);

  if (isLoading) return <div className="h-64 flex items-center justify-center text-gray-300 text-sm">Loading chart data...</div>;
  if (error) return <div className="h-64 flex items-center justify-center text-red-500 text-sm">Error loading chart</div>;

  const currentPrice = history.length > 0 ? history[history.length - 1].price : 0;
  const initialPrice = history.length > 0 ? history[0].price : 0;
  const change = currentPrice - initialPrice;
  const changePercent = initialPrice ? ((change / initialPrice) * 100).toFixed(2) : 0;
  const isPositive = change >= 0;

  return (
    <div className="bg-black-light p-6 rounded-2xl border border-black shadow-lg w-full">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-gray-300 font-bold text-lg">{token} Price</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {isPositive ? '+' : ''}{changePercent}% (24h)
            </span>
          </div>
        </div>
        <div className="flex gap-2 bg-black p-1 rounded-lg border border-black-light">
           {['24h', '7d', '30d', 'All'].map(range => (
             <button 
                key={range} 
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${timeRange === range ? 'bg-white text-black font-semibold' : 'text-white hover:text-white'}`}
             >
               {range}
             </button>
           ))}
        </div>
      </div>
      
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333333" vertical={false} />
            <XAxis dataKey="time" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis 
                domain={['dataMin - 10', 'dataMax + 10']} 
                stroke="#888888" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => `$${value}`} 
            />
            <Tooltip 
               contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#333333', borderRadius: '8px' }}
               itemStyle={{ color: '#E0E0E0' }}
               labelStyle={{ color: '#888888', marginBottom: '4px' }}
            />
            <Line 
               type="monotone" 
               dataKey="price" 
               stroke={isPositive ? "#A3A3A3" : "#737373"} 
               strokeWidth={2} 
               dot={false}
               activeDot={{ r: 4, fill: '#FFFFFF', stroke: '#000000', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PriceChart;
