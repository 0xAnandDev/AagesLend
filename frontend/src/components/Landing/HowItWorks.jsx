import React from 'react';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';

const HowItWorks = () => {
  const [ref, , hasIntersected] = useIntersectionObserver();

  const steps = [
    { num: "01", title: "Deposit Assets", desc: "Users deposit tokens into liquidity pools" },
    { num: "02", title: "Use as Collateral", desc: "Deposits act as collateral for borrowing" },
    { num: "03", title: "Borrow Instantly", desc: "Borrow assets within safe LTV limits" },
    { num: "04", title: "Repay & Withdraw", desc: "Repay loans and withdraw collateral anytime" }
  ];

  return (
    <section ref={ref} className="py-24 bg-black/40 border-y border-white/[0.05]">
      <div className={`max-w-[1200px] mx-auto px-5 transition-all duration-1000 transform ${hasIntersected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <h2 className="text-[32px] md:text-[40px] font-bold text-center mb-20 font-heading">How It Works</h2>
        
        <div className="relative">
          {/* Connecting Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-y-1/2 z-0"></div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 lg:gap-6 relative z-10">
            {steps.map((step, idx) => (
              <div key={idx} className="flex flex-col items-center text-center group" style={{ transitionDelay: `${idx * 150}ms` }}>
                <div className="w-16 h-16 rounded-full bg-[#121212] border border-white/20 flex items-center justify-center text-[20px] font-bold mb-6 group-hover:border-white/50 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-300 font-heading">
                  {step.num}
                </div>
                <h3 className="text-[18px] font-semibold mb-3 font-heading">{step.title}</h3>
                <p className="text-[14px] text-white/60 max-w-[200px]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
