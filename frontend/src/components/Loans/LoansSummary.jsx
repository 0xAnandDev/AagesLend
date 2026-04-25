import React from 'react';

const LoansSummary = ({ totals }) => {
  const formatUSD = (val) => {
    if (!val && val !== 0) return '—';
    return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercent = (val) => {
    if (!val && val !== 0) return '—';
    return `${val.toFixed(2)}%`;
  };

  const util = totals?.utilizationPercent || 0;
  let healthStatus = 'Safe';
  let healthColor = '#10b981'; // green
  if (util >= 50 && util <= 75) {
    healthStatus = 'Medium';
    healthColor = '#f59e0b'; // yellow
  } else if (util > 75) {
    healthStatus = 'Risk';
    healthColor = '#ef4444'; // red
  }

  const Card = ({ title, value, icon, desc, tooltip }) => (
    <div className="bg-[#111111] rounded-[12px] p-[20px] border border-[#333] transition-all duration-300 hover:border-[#555] hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] flex flex-col justify-between relative group">
      <div className="flex items-center gap-2">
        {icon}
        <span className={`text-[10px] text-[#888] uppercase tracking-widest font-bold ${tooltip ? 'border-b border-dotted border-[#888] pb-[1px] cursor-help' : ''}`}>
          {title}
        </span>
        {tooltip && (
          <svg className="w-3 h-3 text-[#888] cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </div>
      {tooltip && (
        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-[220px] bg-[#222] border border-[#444] text-[#ccc] text-xs p-3 rounded-lg shadow-xl z-10 animate-fade-in pointer-events-none">
          {tooltip}
        </div>
      )}
      <div className="text-2xl font-bold text-[#ffffff] mt-3">
        {value}
      </div>
      {desc && <div className="text-[11px] text-[#666] mt-1">{desc}</div>}
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card 
          title="Total Supplied" 
          value={formatUSD(totals?.totalCollateralUSD)} 
          desc="Your active deposits"
          tooltip="Only includes assets you deposited. Borrow collateral is excluded for clarity."
          icon={<svg className="w-4 h-4 text-[#888]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>}
        />
        <Card 
          title="Total Borrowed" 
          value={formatUSD(totals?.totalBorrowUSD)} 
          desc="Your active debt"
          icon={<svg className="w-4 h-4 text-[#888]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <Card 
          title="Borrow Limit" 
          value={formatUSD(totals?.totalBorrowLimitUSD)} 
          desc="Max available credit"
          tooltip="Determined by the collateral factors of your supplied assets."
          icon={<svg className="w-4 h-4 text-[#888]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <Card 
          title="Utilization" 
          value={formatPercent(totals?.utilizationPercent)} 
          desc="Credit used"
          tooltip="Percentage of your borrow limit currently utilized."
          icon={<svg className="w-4 h-4 text-[#888]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>}
        />
        <div className="bg-[#111111] rounded-[12px] p-[20px] border border-[#333] transition-all duration-300 hover:border-[#555] hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[#888]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            <span className="text-[10px] text-[#888] uppercase tracking-widest font-bold">Health Status</span>
          </div>
          <div className="mt-3 flex items-center gap-2">
             <div className="w-3 h-3 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: healthColor, color: healthColor }}></div>
             <span className="text-2xl font-bold text-[#ffffff]">{healthStatus}</span>
          </div>
          <div className="text-[11px] text-[#666] mt-1">Based on utilization</div>
        </div>
      </div>
      <div className="w-full mb-8 flex justify-center px-4">
        <p className="text-[#cccccc] text-lg md:text-xl font-medium tracking-wide text-center">
          <span className="text-white font-bold">Collateral</span> includes assets supplied to the protocol. <span className="text-white font-bold">Borrow limits</span> are determined by LTV ratios.
        </p>
      </div>
    </div>
  );
};

export default LoansSummary;
