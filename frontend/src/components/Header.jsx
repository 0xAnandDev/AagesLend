import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';
import { Web3Context } from '../contexts/Web3Context';
import { FiCopy, FiCheck, FiMenu } from 'react-icons/fi';

const LogoA = () => (
  <div className="relative mr-1 flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300">
    <div className="absolute inset-0 bg-white blur-[12px] opacity-20 group-hover:opacity-40 transition-opacity duration-300 rounded-full"></div>
    <span 
      className="relative text-[30px] md:text-[34px] font-black tracking-tighter leading-none" 
      style={{ 
        fontFamily: 'Inter, sans-serif',
        background: 'linear-gradient(135deg, #ffffff 20%, #888888 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}
    >
      A
    </span>
  </div>
);

const Header = ({ toggleSidebar }) => {
  const { account, provider, chainId, connectWallet } = useContext(Web3Context);
  const [balance, setBalance] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchBalance = async () => {
      if (account && provider) {
        try {
          const bal = await provider.getBalance(account);
          setBalance(parseFloat(ethers.formatEther(bal)).toFixed(3));
        } catch (error) {
          console.error("Error fetching balance:", error);
          setBalance(null);
        }
      } else {
        setBalance(null);
      }
    };
    fetchBalance();

    const interval = setInterval(fetchBalance, 25000);
    return () => clearInterval(interval);
  }, [account, provider]);

  const copyToClipboard = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const isSepolia = chainId === 11155111n || chainId === 11155111;

  return (
    <header className="w-full h-[80px] bg-black/80 backdrop-blur-md border-b border-[rgba(128,128,128,0.2)] px-4 md:px-8 flex items-center justify-between fixed top-0 z-50">
      {/* Left Side: Logo & Mobile Menu */}
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="md:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <FiMenu size={24} />
        </button>
        <Link to="/" className="flex items-center hover:opacity-100 opacity-90 transition-opacity group">
          <LogoA />
          <span className="text-white font-light text-[20px] md:text-[22px] hidden sm:block tracking-wide group-hover:text-gray-200 transition-colors mt-[2px]" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 300 }}>
            agesLend
          </span>
        </Link>
      </div>

      {/* Center: Empty for now */}
      <div className="hidden md:flex flex-1"></div>

      {/* Right Side: Wallet Info */}
      <div className="flex items-center gap-3 md:gap-4">
        {account ? (
          <div className="flex items-center gap-2 md:gap-3">
            {/* Network Indicator */}
            <div className="hidden md:flex items-center gap-2 bg-black-light px-3 py-1.5 rounded-full border border-[rgba(128,128,128,0.2)]">
              <div className={`w-2 h-2 rounded-full ${isSepolia ? 'bg-[#10b981]' : 'bg-[#ef4444]'} animate-pulse`}></div>
              <span className="text-sm font-medium text-gray-300">
                {isSepolia ? 'Sepolia Testnet' : 'Wrong Network'}
              </span>
            </div>

            {/* Balance & Address Badge */}
            <div className="flex items-center bg-black-light rounded-xl border border-[rgba(128,128,128,0.2)] overflow-hidden h-10">
              <div className="hidden sm:flex px-4 items-center bg-black/20 h-full border-r border-[rgba(128,128,128,0.2)]">
                <span className="text-sm font-medium text-white">{balance ? `${balance} ETH` : '—'}</span>
              </div>
              
              <div className="flex items-center gap-2 px-3 md:px-4 h-full hover:bg-white/5 transition-colors">
                <span className="text-sm font-mono text-gray-300">
                  {formatAddress(account)}
                </span>
                <button 
                  onClick={copyToClipboard}
                  className="text-gray-300 hover:text-white transition-colors p-1 rounded-md"
                  title="Copy Address"
                >
                  {copied ? <FiCheck className="text-[#10b981]" /> : <FiCopy />}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={connectWallet}
            className="btn btn-primary px-6 py-2.5 text-sm md:text-base font-medium"
          >
            Connect Wallet
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
