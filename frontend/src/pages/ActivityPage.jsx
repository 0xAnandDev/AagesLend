import React, { useState, useEffect } from 'react';
import TransactionHistory from '../components/Activity/TransactionHistory';
import { useTransactionHistory } from '../hooks/useTransactionHistory';
import { useWeb3 } from '../hooks/useWeb3';
import { FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const ActivityPage = () => {
    const { transactions } = useTransactionHistory();
    const { account, connectWallet } = useWeb3();
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="relative min-h-[calc(100vh-120px)] pb-12">
            {/* Main Content (blurred if not connected) */}
            <div className={`transition-all duration-300 ${!account ? 'opacity-20 blur-sm pointer-events-none' : 'animate-fade-in'}`}>
                <div className="border-b border-black-light pb-6 mb-8">
                    <h1 className="text-3xl font-bold mb-1 tracking-wide text-gray-300">Activity History</h1>
                    <p className="text-white font-medium tracking-wider">A comprehensive log of all your protocol interactions, mappings, and transfers.</p>
                </div>
                
                <TransactionHistory transactions={!account ? [] : transactions} isLoading={isLoading} />
            </div>

            {/* Wallet Connect Modal Overlay */}
            {!account && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
                    <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl shadow-2xl w-full max-w-sm animate-fade-in overflow-hidden">
                        <div className="p-5 border-b border-[#2a2a2a] flex items-center justify-between bg-[#1a1a1a]">
                            <h2 className="text-lg font-bold text-white">Connect Wallet</h2>
                            <button 
                                onClick={() => navigate('/lend')}
                                className="text-[#a0a0a0] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-all duration-200 p-1.5 rounded-lg"
                                title="Close and return to Lend"
                            >
                                <FiX size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6">
                            <p className="text-[#a0a0a0] text-sm mb-5 font-medium tracking-wide">
                                Choose a wallet to connect
                            </p>
                            
                            <button 
                                onClick={connectWallet}
                                className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#1e1e1e] border border-[#333] hover:border-[#f6851b]/70 hover:bg-[#252525] hover:shadow-[0_0_20px_rgba(246,133,27,0.15)] transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-[#f6851b]/50 cursor-pointer"
                            >
                                <span className="font-bold text-lg text-white group-hover:text-[#f6851b] transition-colors duration-300">MetaMask</span>
                                <div className="p-1.5 rounded-xl bg-black/20 group-hover:bg-[#f6851b]/10 transition-colors duration-300">
                                    <img 
                                        src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" 
                                        alt="MetaMask" 
                                        className="w-8 h-8 drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
                                    />
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActivityPage;
