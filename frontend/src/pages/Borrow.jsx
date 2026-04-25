import React from 'react';
import BorrowAssets from '../components/BorrowAssets';

const Borrow = () => {
  return (
    <div className="animate-fade-in pb-12 w-full max-w-7xl mx-auto">
      <div className="mb-8 border-b border-[rgba(255,255,255,0.1)] pb-6">
        <h1 className="text-3xl font-bold mb-2 text-[#ffffff]">Borrow Assets</h1>
        <p className="text-[#888] font-medium tracking-wide">
          Access deep liquidity pools securely backed by your collateral positions.
        </p>
      </div>

      <BorrowAssets />
    </div>
  );
};

export default Borrow;
