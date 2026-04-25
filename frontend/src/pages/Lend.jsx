import React from 'react';
import DepositAssets from '../components/DepositAssets';

const Lend = () => {
  return (
    <div className="animate-fade-in pb-12 w-full max-w-7xl mx-auto">
      <div className="mb-8 border-b border-[rgba(255,255,255,0.08)] pb-6">
         <h1 className="text-3xl font-bold mb-2 tracking-wide text-[#f1f1f1]">Deposit</h1>
         <p className="text-[#888a9b] font-medium text-sm">Deposit assets to earn yield and enable borrowing from protocol markets.</p>
      </div>

      <DepositAssets />
    </div>
  );
};

export default Lend;
