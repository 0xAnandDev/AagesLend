import React from 'react';

const PoolStatsCard = ({ totalLiquidity, utilization, avgSupply, avgBorrow, totalReserves }) => {
  return (
    <div className="card-bg card-hover p-6 h-full flex flex-col justify-center">
      <h3 className="text-lg font-heading font-semibold text-white mb-6 uppercase tracking-wider">Pool Metrics Overview</h3>
      
      <div className="space-y-5 flex-1 flex flex-col justify-center">
        <div className="flex justify-between items-center border-b border-subtle pb-3">
            <span className="text-sm text-secondary font-medium">Total Liquidity</span>
            <span className="font-mono font-bold tracking-tight text-white">{totalLiquidity}</span>
        </div>
        <div className="flex justify-between items-center border-b border-subtle pb-3">
            <span className="text-sm text-secondary font-medium">Utilization Rate</span>
            <span className="font-mono font-bold tracking-tight text-[#f59e0b]">{utilization}</span>
        </div>
        <div className="flex justify-between items-center border-b border-subtle pb-3">
            <span className="text-sm text-secondary font-medium">Avg. Supply APY</span>
            <span className="font-mono font-bold tracking-tight text-[#10b981]">{avgSupply}</span>
        </div>
        <div className="flex justify-between items-center border-b border-subtle pb-3">
            <span className="text-sm text-secondary font-medium">Avg. Borrow APY</span>
            <span className="font-mono font-bold tracking-tight text-[#ef4444]">{avgBorrow}</span>
        </div>
         <div className="flex justify-between items-center pt-2">
            <span className="text-sm text-secondary font-medium">Protocol Reserves</span>
            <span className="font-mono font-bold tracking-tight text-white">{totalReserves}</span>
        </div>
      </div>
    </div>
  );
};

export default PoolStatsCard;
