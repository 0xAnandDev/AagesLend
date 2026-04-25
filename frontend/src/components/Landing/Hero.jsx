import React from 'react';
import { FiArrowRight } from 'react-icons/fi';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';

const Hero = ({ navigate }) => {
  const [ref, , hasIntersected] = useIntersectionObserver();

  return (
    <section 
      ref={ref} 
      className={`min-h-[90vh] flex flex-col items-center justify-center px-4 pb-20 transition-all duration-1000 transform ${hasIntersected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
    >
      <div className="flex flex-col items-center gap-[40px] max-w-[800px] w-full">
        {/* Badge */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_0_20px_rgba(255,255,255,0.03)]">
          <div className="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981] animate-pulse"></div>
          <span className="text-[13px] font-medium text-gray-200 tracking-wide">Live on Sepolia Testnet</span>
        </div>

        {/* Heading */}
        <h1 className="text-[40px] md:text-[64px] leading-[1.1] font-bold text-center max-w-[700px] font-heading">
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
            Lending Redefined.<br />Liquidity Unleashed.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-[16px] md:text-[18px] leading-relaxed text-white/70 text-center max-w-[700px] font-light">
          AagesLend is a decentralized protocol where users supply assets, earn yield, and borrow against collateral securely on-chain.
        </p>

        {/* CTA Button */}
        <button 
          onClick={() => navigate('/dashboard')}
          className="relative group px-8 py-4 rounded-full bg-white text-black font-semibold text-[16px] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] overflow-hidden mt-4"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent  blur-[2px]"></div>
          <span className="relative z-10 flex items-center gap-2">
            Use AagesLend
            <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
          </span>
        </button>
      </div>
    </section>
  );
};

export default Hero;
