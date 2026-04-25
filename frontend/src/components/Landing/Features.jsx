import React from 'react';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { FiTrendingUp, FiUnlock, FiShield, FiActivity } from 'react-icons/fi';

const Features = () => {
  const [ref, , hasIntersected] = useIntersectionObserver();

  const features = [
    {
      icon: <FiTrendingUp size={24} className="text-blue-400" />,
      title: "Supply & Earn",
      desc: "Earn passive yield by supplying crypto assets"
    },
    {
      icon: <FiUnlock size={24} className="text-green-400" />,
      title: "Borrow Against Collateral",
      desc: "Access liquidity without selling your assets"
    },
    {
      icon: <FiShield size={24} className="text-purple-400" />,
      title: "Decentralized & Secure",
      desc: "Smart contracts ensure transparency and trust"
    },
    {
      icon: <FiActivity size={24} className="text-orange-400" />,
      title: "Real-time Price Feeds",
      desc: "Powered by Chainlink + external APIs"
    }
  ];

  return (
    <section ref={ref} className="py-24 px-5 md:px-[120px] max-w-[1400px] mx-auto w-full">
      <div className={`transition-all duration-1000 transform ${hasIntersected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <h2 className="text-[32px] md:text-[40px] font-bold text-center mb-16 font-heading">Protocol Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => (
            <div 
              key={idx} 
              className="bg-white/[0.03] border border-white/[0.08] p-8 rounded-2xl backdrop-blur-md transition-all duration-300 hover:bg-white/[0.05] hover:scale-105 hover:border-white/[0.2] hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] group"
              style={{ transitionDelay: `${idx * 100}ms` }}
            >
              <div className="w-12 h-12 bg-black/50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-white/5">
                {feature.icon}
              </div>
              <h3 className="text-[20px] font-semibold mb-3 font-heading">{feature.title}</h3>
              <p className="text-[15px] text-white/60 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
