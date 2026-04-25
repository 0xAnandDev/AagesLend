import React from 'react';

import AnimatedNumber from './AnimatedNumber';
import { SkeletonLoader } from './Skeleton';

const AccountCard = ({ title, value, subtitle, valueColor = "text-white", isCurrency = true, loading = false }) => {
  const hasValue = typeof value === 'number' && Number.isFinite(value);

  return (
    <div className="card-bg card-hover p-6 flex flex-col justify-center">
      <span className="text-[14px] text-secondary font-heading font-medium tracking-wide uppercase mb-1">
        {title}
      </span>
      <span className={`text-[32px] font-mono font-bold tracking-tight ${valueColor}`}>
        {loading ? (
          <SkeletonLoader className="h-9 w-32" />
        ) : hasValue ? (
          <>
            {isCurrency && "$"}
            <AnimatedNumber
              value={value}
              format={(v) => v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            />
          </>
        ) : (
          "—"
        )}
      </span>
      {subtitle && (
        <span className="text-[12px] text-secondary mt-1">
          {subtitle}
        </span>
      )}
    </div>
  );
};

const AccountMetrics = ({ netBalance, totalSupplied, totalBorrowed, healthFactor, supplyApy, borrowApy, loading = false }) => {
  
  const getHealthColor = (hf) => {
    if (hf >= 3.0) return "text-[#10b981]"; // Green
    if (hf >= 1.5) return "text-[#f59e0b]"; // Yellow
    return "text-[#ef4444]"; // Red
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      <AccountCard 
        title="Net Balance" 
        value={netBalance} 
        subtitle={null}
        loading={loading}
      />
      
      <AccountCard 
        title="Total Supplied" 
        value={totalSupplied} 
        subtitle={typeof supplyApy === 'number' ? `Earning: ${supplyApy.toFixed(2)}% APY` : null}
        loading={loading}
      />
      
      <AccountCard 
        title="Total Borrowed" 
        value={totalBorrowed} 
        subtitle={typeof borrowApy === 'number' ? `Paying: ${borrowApy.toFixed(2)}% APY` : null}
        loading={loading}
      />
      
      <AccountCard 
        title="Health Factor" 
        value={healthFactor} 
        isCurrency={false}
        valueColor={typeof healthFactor === 'number' ? getHealthColor(healthFactor) : "text-white"}
        subtitle={typeof healthFactor === 'number' ? (healthFactor < 1.5 ? "Liquidatable Risk!" : "Safe Limits") : null}
        loading={loading}
      />
    </div>
  );
};

export default AccountMetrics;
