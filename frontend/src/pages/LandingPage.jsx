import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiGithub, FiTwitter, FiMail } from 'react-icons/fi';
import { FaDiscord } from 'react-icons/fa';
import Galaxy from '../components/Galaxy/Galaxy';
import SpecularButton from '../components/SpecularButton/SpecularButton';
import LandingMarkets from '../components/LandingMarkets';

const LogoA = () => (
  <svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1">
    <path d="M20 4L4 36H11L20 18L29 36H36L20 4Z" fill="white" />
    <path d="M14 28L20 16L26 28H14Z" fill="white" opacity="0.8"/>
  </svg>
);

const navLinks = [
  { id: 'protocol', label: 'Protocol' },
  { id: 'flow', label: 'Flow' },
  { id: 'edge', label: 'Edge' },
  { id: 'security', label: 'Security' },
  { id: 'markets', label: 'Markets' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'users', label: 'Users' },
  { id: 'connect', label: 'Connect' },
];


const LandingPage = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      const sections = navLinks.map(link => document.getElementById(link.id));
      const scrollPosition = window.scrollY + 250;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(navLinks[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-white/10 relative overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0">
        <Galaxy
          mouseInteraction={true}
          mouseRepulsion={true}
          density={1}
          glowIntensity={0.2}
          saturation={0}
          hueShift={140}
          twinkleIntensity={0.25}
          rotationSpeed={0.1}
          repulsionStrength={2}
          autoCenterRepulsion={0}
          starSpeed={0.5}
          speed={1}
        />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full px-5 md:px-8 lg:px-[80px] xl:px-[120px] py-[20px] flex items-center justify-between z-50 transition-all duration-300 backdrop-blur-md border-b border-white/10 bg-[#0a0a0a]/80">
        <div className="flex items-center gap-8 xl:gap-12">
          <div 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
            className="flex items-center hover:opacity-80 transition-opacity cursor-pointer group"
          >
            <LogoA />
            <span className="text-white font-light text-[22px] tracking-wide group-hover:text-gray-300 transition-colors" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 300 }}>
              agesLend
            </span>
          </div>
          
          <div className="hidden lg:flex items-center gap-6 xl:gap-8">
            {navLinks.map((item) => (
              <button 
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`text-[15px] transition-all duration-300 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] ${activeSection === item.id ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] font-medium' : 'text-gray-400 font-light'}`}
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <SpecularButton
            onClick={() => navigate('/dashboard')}
            size="sm"
            radius={999}
            tint="#000000"
            tintOpacity={1}
            textColor="#ffffff"
            lineColor="#ffffff"
            baseColor="#a3a3a3"
            intensity={0.9}
            shineSize={12}
            shineFade={45}
            thickness={1.2}
            speed={0.3}
            followMouse
            proximity={220}
            className="hidden md:inline-flex whitespace-nowrap"
          >
            Use AagesLend
          </SpecularButton>
          
          <button 
            className="lg:hidden text-white p-2 hover:bg-white/5 rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-[76px] bg-[#0a0a0a] z-40 flex flex-col p-6 border-t border-white/10 lg:hidden overflow-y-auto">
          <div className="flex flex-col gap-2">
            {navLinks.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`text-left text-[18px] py-4 px-4 rounded-xl font-medium transition-all ${activeSection === item.id ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'text-gray-400 hover:bg-white/5'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <SpecularButton
            onClick={() => navigate('/dashboard')}
            size="lg"
            radius={16}
            tint="#ffffff"
            tintOpacity={1}
            textColor="#000000"
            lineColor="#3b82f6"
            baseColor="#d4d4d4"
            intensity={1}
            shineSize={14}
            shineFade={50}
            thickness={1.4}
            speed={0.3}
            followMouse
            autoAnimate
            proximity={260}
            className="mt-8 w-full whitespace-nowrap"
          >
            Use AagesLend
          </SpecularButton>
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 flex flex-col w-full pt-[80px]">
        
        {/* Hero Section */}
        <section id="hero" className="w-full pt-[120px] pb-[80px] flex flex-col items-center justify-center min-h-[75vh] relative z-10">
          <div className="max-w-[1000px] mx-auto px-5 md:px-8 text-center flex flex-col items-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-[#121212] mb-8">
              <div className="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981]"></div>
              <span className="text-sm font-medium text-gray-300">Live on Arbitrum Sepolia</span>
            </div>
            
            {/* Headline */}
            <h1 className="text-[56px] md:text-[72px] lg:text-[84px] font-bold leading-[1.1] tracking-tight mb-8 text-[#e5e5e5]">
              Lending Redefined.<br />
              Liquidity Unleashed.
            </h1>
            
            {/* Subheadline */}
            <p className="text-[18px] md:text-[20px] text-gray-400 max-w-[850px] leading-relaxed mb-12">
              AagesLend is a decentralized lending protocol where users can supply assets, earn yield, and borrow against collateral with full transparency and on-chain security.
            </p>
            
            {/* CTA Button */}
            <SpecularButton
              onClick={() => navigate('/dashboard')}
              size="lg"
              radius={999}
              tint="#ffffff"
              tintOpacity={1}
              textColor="#000000"
              lineColor="#3b82f6"
              baseColor="#d4d4d4"
              intensity={1}
              shineSize={12}
              shineFade={45}
              thickness={1.3}
              speed={0.32}
              followMouse
              proximity={260}
              className="gap-2 whitespace-nowrap"
            >
              Use AagesLend
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 inline align-middle">
                <path d="M5 12h14"></path>
                <path d="M12 5l7 7-7 7"></path>
              </svg>
            </SpecularButton>
          </div>
        </section>

        {/* Protocol Section */}
        <section id="protocol" className="w-full py-[120px] scroll-mt-[80px]">
          <div className="max-w-[1200px] mx-auto px-5 md:px-8">
            <h2 className="text-[32px] md:text-[48px] font-bold mb-6 text-center tracking-tight">Powerful Defi Lending Features</h2>
            <p className="text-gray-400 text-center max-w-3xl mx-auto mb-16 text-[18px] leading-relaxed">
              AagesLend enables users to interact with decentralized financial markets in a simple and efficient way. Whether you want to earn passive income or access liquidity, the protocol provides a seamless experience powered by smart contracts.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: 'Supply & Earn', desc: 'Deposit your assets into liquidity pools and earn yield over time.' },
                { title: 'Borrow Against Collateral', desc: 'Access funds instantly without selling your crypto holdings.' },
                { title: 'Non-Custodial Control', desc: 'You retain full ownership of your assets at all times.' },
                { title: 'Real-Time Price Feeds', desc: 'Accurate pricing powered by oracle integrations ensures fair borrowing limits.' },
              ].map((block, idx) => (
                <div key={idx} className="bg-[#121212] p-8 rounded-2xl border border-white/5 transition-all duration-300 hover:border-white/20 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] hover:-translate-y-1 group">
                  <h3 className="text-xl font-semibold mb-3 text-white group-hover:text-blue-400 transition-colors">{block.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{block.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Flow Section */}
        <section id="flow" className="w-full py-[120px] scroll-mt-[80px]">
          <div className="max-w-[1200px] mx-auto px-5 md:px-8">
            <h2 className="text-[32px] md:text-[48px] font-bold mb-6 text-center tracking-tight">How AagesLend Works</h2>
            <p className="text-gray-400 text-center max-w-3xl mx-auto mb-16 text-[18px] leading-relaxed">
              AagesLend follows a simple and transparent flow that allows users to safely lend and borrow assets.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'Deposit Assets', desc: 'Supply supported tokens into the protocol.' },
                { title: 'Use as Collateral', desc: 'Your deposits act as security for borrowing.' },
                { title: 'Borrow Instantly', desc: 'Borrow assets within safe loan-to-value limits.' },
                { title: 'Repay & Withdraw', desc: 'Repay your loan anytime and withdraw your collateral.' },
              ].map((block, idx) => (
                <div key={idx} className="bg-[#121212] p-8 rounded-2xl border border-white/5 transition-all duration-300 hover:border-white/20 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] hover:-translate-y-1 relative overflow-hidden group">
                  <div className="absolute -top-4 -right-4 text-[100px] font-bold text-white/5 leading-none group-hover:text-white/10 transition-colors select-none">{idx + 1}</div>
                  <h3 className="text-xl font-semibold mb-3 relative z-10 text-white">{block.title}</h3>
                  <p className="text-gray-400 relative z-10 leading-relaxed">{block.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Edge Section */}
        <section id="edge" className="w-full py-[120px] scroll-mt-[80px]">
          <div className="max-w-[1200px] mx-auto px-5 md:px-8">
            <h2 className="text-[32px] md:text-[48px] font-bold mb-6 text-center tracking-tight">Why Choose DeFi Over Traditional Banking</h2>
            <p className="text-gray-400 text-center max-w-3xl mx-auto mb-16 text-[18px] leading-relaxed">
              Traditional financial systems rely on intermediaries, approvals, and delays. AagesLend removes these barriers by leveraging blockchain technology.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: 'No paperwork or approvals', desc: 'Skip the bureaucracy and access financial tools instantly.' },
                { title: 'Instant access to liquidity', desc: 'Borrow and withdraw funds on-demand 24/7.' },
                { title: 'Transparent and verifiable transactions', desc: 'Every transaction is recorded on the public ledger.' },
                { title: 'Global accessibility without restrictions', desc: 'Participate from anywhere in the world.' },
              ].map((block, idx) => (
                <div key={idx} className="bg-[#121212] p-8 rounded-2xl border border-white/5 transition-all duration-300 hover:border-white/20 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] hover:-translate-y-1">
                  <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
                    <span className="text-white/80 font-bold">{idx + 1}</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-white">{block.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{block.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section id="security" className="w-full py-[120px] scroll-mt-[80px]">
          <div className="max-w-[1200px] mx-auto px-5 md:px-8">
            <h2 className="text-[32px] md:text-[48px] font-bold mb-6 text-center tracking-tight">Security & Risk Management</h2>
            <p className="text-gray-400 text-center max-w-3xl mx-auto mb-16 text-[18px] leading-relaxed">
              AagesLend is designed with safety mechanisms to protect both lenders and borrowers.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: 'Overcollateralization', desc: 'Loans require collateral greater than the borrowed value.' },
                { title: 'Liquidation System', desc: 'Positions are automatically adjusted if risk thresholds are exceeded.' },
                { title: 'Smart Contract Execution', desc: 'All operations are governed by on-chain logic.' },
                { title: 'Oracle Safety', desc: 'Chainlink prices with staleness, bounds and L2 sequencer uptime checks. Deployed on Arbitrum Sepolia.' },
              ].map((block, idx) => (
                <div key={idx} className="bg-[#121212] p-8 rounded-2xl border border-white/5 transition-all duration-300 hover:border-white/20 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] hover:-translate-y-1 group">
                  <h3 className="text-xl font-semibold mb-3 text-green-400 group-hover:text-green-300 transition-colors">{block.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{block.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Markets Section */}
        <section id="markets" className="w-full py-[120px] scroll-mt-[80px]">
          <div className="max-w-[1200px] mx-auto px-5 md:px-8">
            <h2 className="text-[32px] md:text-[48px] font-bold mb-6 text-center tracking-tight">Market Overview</h2>
            <p className="text-gray-400 text-center max-w-3xl mx-auto mb-16 text-[18px] leading-relaxed">
              Live protocol metrics, read straight from the contracts.
            </p>
            <LandingMarkets />
          </div>
        </section>

        {/* Architecture Section */}
        <section id="architecture" className="w-full py-[120px] scroll-mt-[80px]">
          <div className="max-w-[1200px] mx-auto px-5 md:px-8">
            <h2 className="text-[32px] md:text-[48px] font-bold mb-6 text-center tracking-tight">Built with Modern Web3 Stack</h2>
            <p className="text-gray-400 text-center max-w-3xl mx-auto mb-16 text-[18px] leading-relaxed">
              AagesLend is built using a robust and scalable technology stack.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {[
                { title: 'Solidity + Foundry', desc: 'Contracts, fuzz and invariant tests' },
                { title: 'Chainlink', desc: 'Price and sequencer feeds' },
                { title: 'wagmi + viem', desc: 'Typed chain access' },
                { title: 'RainbowKit', desc: 'Wallet connection' },
                { title: 'Ponder', desc: 'Event indexer' },
              ].map((block, idx) => (
                <div key={idx} className="bg-[#121212] p-8 rounded-2xl border border-white/5 text-center transition-all duration-300 hover:border-white/20 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] hover:-translate-y-1">
                  <h3 className="text-lg font-semibold mb-3 text-white">{block.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{block.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Users Section */}
        <section id="users" className="w-full pt-[120px] pb-[150px] scroll-mt-[80px]">
          <div className="max-w-[1200px] mx-auto px-5 md:px-8">
            <h2 className="text-[32px] md:text-[48px] font-bold mb-6 text-center tracking-tight">Who Is AagesLend For</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
              {[
                { title: 'Lenders', desc: 'Earn passive income by supplying assets.' },
                { title: 'Borrowers', desc: 'Access liquidity without selling holdings.' },
                { title: 'Developers', desc: 'Explore and build on DeFi systems.' },
              ].map((block, idx) => (
                <div key={idx} className="bg-[#121212] p-8 md:p-10 rounded-3xl border border-white/5 text-center transition-all duration-300 hover:border-white/20 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] hover:-translate-y-1 group">
                  <h3 className="text-2xl font-semibold mb-4 text-white group-hover:text-blue-400 transition-colors">{block.title}</h3>
                  <p className="text-gray-400 text-lg leading-relaxed">{block.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Connect (Footer) Section */}
      <footer id="connect" className="w-full bg-[#050505] border-t border-white/10 py-[100px] scroll-mt-[80px] relative">
        <div className="max-w-[1200px] mx-auto px-5 md:px-8 text-center relative z-10">
          <h2 className="text-[32px] md:text-[40px] font-bold mb-12 tracking-tight">Connect with AagesLend</h2>
          <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-12 mb-16">
            <a href="https://x.com/AnandBlockchain" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-400 hover:text-white transition-all duration-300 group">
              <div className="p-4 rounded-full bg-white/5 group-hover:bg-blue-500/20 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] transition-all border border-white/5 group-hover:border-blue-500/30">
                <FiTwitter size={24} />
              </div>
              <span className="font-medium group-hover:text-shadow-[0_0_10px_rgba(59,130,246,0.8)] group-hover:text-blue-400 transition-colors">Twitter</span>
            </a>
            <a href="https://github.com/0xAnandDev/AagesLend" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-400 hover:text-white transition-all duration-300 group">
              <div className="p-4 rounded-full bg-white/5 group-hover:bg-white/20 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.6)] transition-all border border-white/5 group-hover:border-white/30">
                <FiGithub size={24} />
              </div>
              <span className="font-medium group-hover:text-shadow-[0_0_10px_rgba(255,255,255,0.8)] group-hover:text-white transition-colors">GitHub</span>
            </a>
            <a href="#" className="flex items-center gap-3 text-gray-400 hover:text-white transition-all duration-300 group">
              <div className="p-4 rounded-full bg-white/5 group-hover:bg-indigo-500/20 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.6)] transition-all border border-white/5 group-hover:border-indigo-500/30">
                <FaDiscord size={24} />
              </div>
              <span className="font-medium group-hover:text-shadow-[0_0_10px_rgba(99,102,241,0.8)] group-hover:text-indigo-400 transition-colors">0xananddev</span>
            </a>
            <a href="mailto:anand.doddi.dev@gmail.com" className="flex items-center gap-3 text-gray-400 hover:text-white transition-all duration-300 group">
              <div className="p-4 rounded-full bg-white/5 group-hover:bg-red-500/20 group-hover:shadow-[0_0_20px_rgba(239,68,68,0.6)] transition-all border border-white/5 group-hover:border-red-500/30">
                <FiMail size={24} />
              </div>
              <span className="font-medium group-hover:text-shadow-[0_0_10px_rgba(239,68,68,0.8)] group-hover:text-red-400 transition-colors">Email</span>
            </a>
          </div>
          
          <div className="flex items-center justify-center text-gray-500 pt-8 border-t border-white/5">
            <LogoA />
            <span className="font-light text-lg" style={{ fontFamily: 'Inter, sans-serif' }}>agesLend <span className="ml-2">© 2026</span></span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
