import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const UserPositionChart = () => {
  // Mock data mapping
  const data = [
    { name: 'Supplied', value: 25000 },
    { name: 'Borrowed', value: 10480 },
    { name: 'Collateral', value: 14000 }
  ];

  const COLORS = ['#D4D4D4', '#525252', '#8B8B8B'];

  return (
    <div className="bg-black-light p-6 rounded-2xl border border-black shadow-lg w-full h-full flex flex-col">
      <h3 className="text-gray-300 font-bold text-lg mb-2">Your Positions</h3>
      <div className="flex-1 w-full min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="value"
              stroke="#000000"
              strokeWidth={2}
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

export default UserPositionChart;
