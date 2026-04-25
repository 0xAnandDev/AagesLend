import React, { useContext } from 'react';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { PriceContext } from '../../contexts/PriceContext';

const MarketPreview = () => {
  const [ref, , hasIntersected] = useIntersectionObserver();
  const { prices } = useContext(PriceContext);

  const ethPrice = prices?.ETH?.usd || "3,250.00";
  
  const stats = [
    { label: "ETH Price", value: `$${typeof ethPrice === 'number' ? ethPrice.toLocaleString(undefined, {minimumFractionDigits: 2}) : ethPrice}` },
    { label: "Supply APY", value: "4.52%" },
    { label: "Borrow APY", value: "5.84%" }
  ];

  return (
    <section ref={ref} className="py-24 px-5 max-w-[1200px] mx-auto w-full">
      <div className={`transition-all duration-1000 transform ${hasIntersected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <h2 className="text-[32px] md:text-[40px] font-bold text-center mb-16 font-heading">Market Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-gradient-to-b from-white/[0.05] to-transparent border border-white/[0.05] p-8 rounded-2xl text-center backdrop-blur-sm group hover:border-white/[0.15] transition-all duration-300" style={{ transitionDelay: `${idx * 150}ms` }}>
              <p className="text-[14px] text-white/50 mb-3 uppercase tracking-wider">{stat.label}</p>
              <div className="text-[36px] font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 group-hover:from-white group-hover:to-white transition-all">
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MarketPreview;
