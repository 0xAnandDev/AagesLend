import React from 'react';

const StatCard = ({ title, value, subtitle, valueColorClass = "text-gray-300" }) => {
  return (
    <div className="p-6 bg-black-light rounded-2xl border border-white/5 shadow-xl flex flex-col justify-center gap-2 transition-all duration-300 hover:-translate-y-1 hover:border-white/10">
      <span className="text-gray-400 text-xs font-heading font-semibold uppercase tracking-wider">{title}</span>
      <span className={`font-mono text-3xl font-semibold tracking-tighter text-white ${valueColorClass}`}>{value}</span>
      {subtitle && <span className="text-gray-500 text-sm font-normal">{subtitle}</span>}
    </div>
  );
};

export default StatCard;
