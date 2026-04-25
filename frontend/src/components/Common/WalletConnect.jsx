import React from 'react';
import { useWeb3 } from '../../hooks/useWeb3';

const WalletConnect = () => {
  const { isConnected, account, connectWallet, disconnectWallet, error } = useWeb3();

  const formatAddress = (addr) => {
    if(!addr) return "";
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div className="flex flex-col w-full animate-fade-in z-50">
      {error && (
        <div className="px-3 py-2.5 mb-4 bg-black border border-black shadow-lg text-[11px] font-medium tracking-wide text-gray-300 rounded-xl text-center break-words">
          {error}
        </div>
      )}
      
      {isConnected ? (
        <div 
           className="w-full flex justify-between items-center px-4 py-3.5 bg-black rounded-xl border border-black/50 shadow-inner group cursor-pointer hover:bg-black/60 transition-all duration-300 relative overflow-hidden" 
           onClick={disconnectWallet} 
           title="Disconnect Context"
        >
            <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(232,232,232,0.6)]"></div>
                <span className="text-sm font-semibold tracking-wider text-white">{formatAddress(account)}</span>
            </div>
            
            <div className="absolute right-0 top-0 bottom-0 flex items-center justify-center px-4 bg-black-light translate-x-full group-hover:translate-x-0 transition-transform duration-300">
               <span className="text-xs text-gray-300 font-bold uppercase tracking-widest">Logout</span>
            </div>
        </div>
      ) : (
        <button 
          onClick={connectWallet}
          className="w-full py-4 rounded-xl bg-white text-black font-extrabold uppercase tracking-widest hover:bg-gray-200 transition-all shadow-lg hover:shadow-[0_0_15px_rgba(232,232,232,0.3)] transform hover:-translate-y-0.5 active:translate-y-0"
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
};

export default WalletConnect;
