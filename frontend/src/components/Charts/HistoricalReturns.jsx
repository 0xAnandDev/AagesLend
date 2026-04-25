import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const HistoricalReturns = () => {
  const [timeRange, setTimeRange] = useState('30d');
  
  // Create mock returns data based on selected range
  const generateData = () => {
      const data = [];
      const now = new Date();
      const points = timeRange === '7d' ? 7 : (timeRange === '30d' ? 30 : 90);
      let cumulative = 0;
      
      for (let i = points; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          
          const dailyReturn = Math.random() * 5 + 1; // $1 to $6 daily
          cumulative += dailyReturn;
          
          data.push({
              date: d.toLocaleDateString([], { month: 'short', day: 'numeric' }),
              returns: Number(cumulative.toFixed(2))
          });
      }
      return data;
  };
  
  const data = generateData();

  return (
    <div className="bg-black-light p-6 rounded-2xl border border-black shadow-lg w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-gray-300 font-bold text-lg">Historical Returns</h3>
        <div className="flex gap-2 bg-black p-1 rounded-lg border border-black-light">
           {['7d', '30d', 'All'].map(range => (
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
          <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="colorReturns" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#A3A3A3" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#A3A3A3" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#333333" vertical={false} />
            <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis 
                stroke="#888888" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => `$${value}`} 
            />
            <Tooltip 
               contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#333333', borderRadius: '8px' }}
               itemStyle={{ color: '#E0E0E0' }}
            />
            <Area 
               type="monotone" 
               dataKey="returns" 
               stroke="#A3A3A3" 
               fillOpacity={1} 
               fill="url(#colorReturns)" 
               strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default HistoricalReturns;
