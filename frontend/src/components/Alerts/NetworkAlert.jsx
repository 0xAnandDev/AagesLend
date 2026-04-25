import React, { useState } from 'react';
import { FiWifiOff, FiX } from 'react-icons/fi';
import { useWeb3 } from '../../hooks/useWeb3';

const NetworkAlert = () => {
    const { isConnected, chainId, switchNetwork } = useWeb3();
    const [dismissed, setDismissed] = useState(false);

    // Assuming 11155111 is Sepolia chainId
    const isWrongNetwork = isConnected && chainId !== 11155111;

    if (!isWrongNetwork || dismissed) return null;

    return (
        <div className="mb-6 rounded-xl border border-[#EF5350]/50 bg-[#2B1B1B] p-4 shadow-lg flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex items-start md:items-center gap-3">
                <div className="mt-0.5 md:mt-0 p-2 rounded-full bg-[#EF5350]/20">
                    <FiWifiOff className="w-5 h-5 text-[#EF5350]" />
                </div>
                <div>
                    <h4 className="font-bold tracking-wide text-[#EF5350]">
                        Wrong Network Detected
                    </h4>
                    <p className="text-sm text-white mt-1">
                        AagesLend currently operates exclusively on the Sepolia Testnet. Please switch networks.
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
                <button 
                  onClick={() => switchNetwork(11155111)}
                  className="flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-colors bg-[#EF5350] hover:bg-[#EF5350]/80 text-white"
                >
                    Switch to Sepolia
                </button>
                <button 
                   onClick={() => setDismissed(true)}
                   className="p-2 text-white hover:text-white transition-colors"
                >
                    <FiX size={20} />
                </button>
            </div>
        </div>
    );
};

export default NetworkAlert;
