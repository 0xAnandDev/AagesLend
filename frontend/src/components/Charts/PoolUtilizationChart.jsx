import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const PoolUtilizationChart = ({ liquidity, borrowed }) => {
  const data = [
    { name: 'Available Liquidity', value: liquidity },
    { name: 'Borrowed', value: borrowed }
  ];

  const COLORS = ['#A3A3A3', '#404040'];

  return (
    <div className="bg-black-light p-6 rounded-2xl border border-black shadow-lg w-full h-full flex flex-col">
      <h3 className="text-gray-300 font-bold text-lg mb-2">Pool Utilization</h3>
      <div className="flex-1 w-full min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
               contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#333333', borderRadius: '8px', color: '#E0E0E0' }}
               formatter={(value) => `$${value.toLocaleString()}`}
            />
            <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', color: '#888888' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PoolUtilizationChart;
