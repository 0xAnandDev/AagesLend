import React, { useState, useEffect, useRef } from 'react';
import { formatEther } from 'ethers';
import { FiCopy, FiExternalLink, FiLogOut, FiSettings, FiChevronDown, FiRefreshCw, FiCheck } from 'react-icons/fi';
import { useWeb3 } from '../hooks/useWeb3';

const WalletConnect = () => {
  const { account, provider, chainId, connectWallet, disconnectWallet } = useWeb3();
  const [balance, setBalance] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const dropdownRef = useRef(null);
  
  // BigInt for ethers v6
  const SEPOLIA_CHAIN_ID = 11155111n;

  const fetchBalance = async () => {
    if (!provider || !account) {
      setBalance(null);
      return;
    }
    try {
      setIsRefreshing(true);
      const weiBalance = await provider.getBalance(account);
      const formattedBalance = Number(formatEther(weiBalance));
      setBalance(Number.isFinite(formattedBalance) ? formattedBalance.toFixed(4) : null);
    } catch (err) {
      console.error("Failed to fetch balance", err);
      setBalance(null);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto refresh ETH balance every 25 seconds.
  useEffect(() => {
    if (!account || !provider) {
      setBalance(null);
      return;
    }

    fetchBalance();

    const interval = setInterval(() => {
      fetchBalance();
    }, 25000);

    return () => {
      clearInterval(interval);
    };
  }, [account, provider]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(account);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const getStatusDot = () => {
    if (!account) return "bg-[#f59e0b]"; // Yellow - Disconnected
    if (chainId !== SEPOLIA_CHAIN_ID) return "bg-error"; // Red - Wrong network
    return "bg-success"; // Green - Connected Sepolia
  };

  const getNetworkName = () => {
    if (!account) return "Disconnected";
    if (chainId === SEPOLIA_CHAIN_ID) return "Sepolia";
    return "Wrong Network";
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {!account ? (
        <button
          onClick={connectWallet}
          className="flex items-center gap-2 bg-[#1a1a1a] text-primary px-4 py-2.5 rounded-lg border border-subtle hover:bg-[#121212] transition-colors duration-200 focus:outline-none"
        >
          <span className={`w-2.5 h-2.5 rounded-full ${getStatusDot()}`}></span>
          <span className="text-sm font-medium">Connect Wallet</span>
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 bg-[#1a1a1a] text-primary px-3 py-2 rounded-lg border border-subtle hover:bg-[#121212] transition-colors duration-200 focus:outline-none"
        >
          <div className="flex items-center gap-2 bg-[#0a0a0a] px-2 py-1 rounded border border-subtle hidden sm:flex">
            <span className={`w-2 h-2 rounded-full ${getStatusDot()}`}></span>
            <span className="text-xs font-medium text-secondary">{getNetworkName()}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono tracking-tight hidden md:inline">{balance ? `${balance} ETH` : '—'}</span>
            <span className="text-secondary hidden md:inline">|</span>
            <span className="text-sm font-mono tracking-tight">{formatAddress(account)}</span>
          </div>
          
          <FiChevronDown className={`text-secondary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} size={16} />
        </button>
      )}

      {isOpen && account && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-[#121212] border border-subtle rounded-xl shadow-2xl z-[100] animate-fade-in overflow-hidden flex flex-col p-2">
          
          {/* Header section in dropdown */}
          <div className="flex items-center justify-between px-3 py-3 border-b border-subtle mb-2">
            <div className="flex items-center gap-2">
               <div className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-subtle flex items-center justify-center shadow-inner">
                 <span className="text-white font-bold font-heading text-sm">A</span>
               </div>
               <div className="flex flex-col">
                 <span className="text-xs text-secondary font-medium uppercase tracking-wider">Connected Wallet</span>
                 <span className="text-sm font-mono text-primary font-semibold truncate w-24" title={account}>{formatAddress(account)}</span>
               </div>
            </div>
            <button onClick={handleCopy} className="p-2 text-secondary hover:text-primary hover:bg-[#1a1a1a] rounded-md transition-colors focus:outline-none">
              {copied ? <FiCheck size={16} className="text-success" /> : <FiCopy size={16} />}
            </button>
          </div>

          {/* Balance section */}
          <div className="px-4 py-3 bg-[#0a0a0a] rounded-lg border border-subtle mb-2 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-secondary mb-1">ETH Balance</span>
              <span className="text-lg font-mono font-bold text-primary">{balance ? balance : "—"} <span className="text-sm text-secondary">ETH</span></span>
            </div>
            <button onClick={(e) => { e.stopPropagation(); fetchBalance(); }} className={`p-2 text-secondary hover:text-primary bg-[#1a1a1a] rounded-md transition-colors focus:outline-none ${isRefreshing ? 'animate-spin' : ''}`}>
               <FiRefreshCw size={14} />
            </button>
          </div>

          {/* Action List */}
          <ul className="flex flex-col gap-1">
            <li>
              <a 
                href={`https://sepolia.etherscan.io/address/${account}`} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-primary hover:bg-[#1a1a1a] transition-colors cursor-pointer"
              >
                <FiExternalLink size={16} className="text-secondary" />
                View on Etherscan
              </a>
            </li>
            <li>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-primary hover:bg-[#1a1a1a] transition-colors focus:outline-none">
                <FiSettings size={16} className="text-secondary" />
                Settings
              </button>
            </li>
            <li className="h-px bg-white/5 my-1" />
            <li>
              <button 
                onClick={() => {
                  disconnectWallet();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-error hover:bg-[#ef4444]/10 transition-colors focus:outline-none"
              >
                <FiLogOut size={16} />
                Disconnect
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default WalletConnect;
