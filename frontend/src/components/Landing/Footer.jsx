import React from 'react';
import { FiTwitter, FiGithub, FiMail } from 'react-icons/fi';
import { FaDiscord } from 'react-icons/fa';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import aageslendLogo from '../../assets/aageslend-logo.png';

const Footer = ({ navigate }) => {
  const [ref, , hasIntersected] = useIntersectionObserver();

  return (
    <footer ref={ref} className={`transition-all duration-1000 transform ${hasIntersected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
      {/* Why AagesLend */}
      <section className="py-24 px-5 border-t border-white/[0.05] bg-[#050505]">
        <div className="max-w-[800px] mx-auto text-center">
          <h2 className="text-[32px] md:text-[40px] font-bold mb-8 font-heading">Why AagesLend?</h2>
          <p className="text-[18px] text-white/70 leading-relaxed mb-12">
            AagesLend combines efficiency, transparency, and composability to create a seamless DeFi lending experience.
          </p>
          <div className="flex flex-wrap justify-center gap-4 md:gap-8">
            {["Non-custodial", "Transparent smart contracts", "Real-time data", "Scalable architecture"].map((point, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                <span className="text-[15px] font-medium text-white/80">{point}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-5 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-900/10 z-0"></div>
        <div className="relative z-10 max-w-[600px] mx-auto flex flex-col items-center">
          <h2 className="text-[40px] md:text-[56px] font-bold mb-10 font-heading">Start Using AagesLend Today</h2>
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-10 py-4 rounded-full bg-white text-black font-semibold text-[18px] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]"
          >
            Launch App
          </button>
        </div>
      </section>

      {/* Footer / Contact */}
      <section className="py-12 px-5 border-t border-white/[0.05] bg-black">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3  hover:opacity-100 transition-opacity cursor-pointer">
            <img src={aageslendLogo} alt="A" className="h-6 object-contain" />
            <span className="text-white font-bold text-[18px] tracking-tight ml-[-2px]" style={{ fontFamily: 'Inter, sans-serif' }}>agesLend</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#" className="text-white/40 hover:text-white hover:scale-110 transition-all hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
              <FaDiscord size={24} />
            </a>
            <a href="#" className="text-white/40 hover:text-white hover:scale-110 transition-all hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
              <FiTwitter size={24} />
            </a>
            <a href="#" className="text-white/40 hover:text-white hover:scale-110 transition-all hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
              <FiGithub size={24} />
            </a>
            <a href="mailto:aageslend@gmail.com" className="text-white/40 hover:text-white hover:scale-110 transition-all hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
              <FiMail size={24} />
            </a>
          </div>
          
          <div className="text-[13px] text-white/30">
            © {new Date().getFullYear()} AagesLend. All rights reserved.
          </div>
        </div>
      </section>
    </footer>
  );
};

export default Footer;
