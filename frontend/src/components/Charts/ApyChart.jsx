import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const ApyChart = () => {
  const data = [
    { name: 'ETH', supplyApy: 2.4, borrowApy: 4.1 },
    { name: 'USDC', supplyApy: 5.2, borrowApy: 6.8 },
    { name: 'DAI', supplyApy: 5.1, borrowApy: 6.5 },
    { name: 'WBTC', supplyApy: 1.8, borrowApy: 3.5 },
  ];

  return (
    <div className="bg-black-light p-6 rounded-2xl border border-black shadow-lg w-full">
      <h3 className="text-gray-300 font-bold text-lg mb-4">APY Comparison</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333333" vertical={false} />
            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
            <Tooltip 
               contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#333333', borderRadius: '8px' }}
               itemStyle={{ color: '#E0E0E0' }}
               cursor={{ fill: '#262626' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Bar dataKey="supplyApy" name="Supply APY" fill="#A3A3A3" radius={[4, 4, 0, 0]} />
            <Bar dataKey="borrowApy" name="Borrow APY" fill="#525252" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ApyChart;
