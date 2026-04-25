import React, { useState } from 'react';
import { FiArrowUpRight, FiArrowDownLeft, FiRefreshCw, FiExternalLink, FiCopy, FiCheck } from 'react-icons/fi';

const ActivityFeed = ({ transactions, limit = 5 }) => {
    const [copiedId, setCopiedId] = useState(null);

    const handleCopy = (hash) => {
        if(!hash) return;
        navigator.clipboard.writeText(hash);
        setCopiedId(hash);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const getIconInfo = (type, status) => {
        if (status === 'Pending') return { icon: <FiRefreshCw className="w-4 h-4 animate-spin text-[#FFC107]" />, bg: 'bg-[#FFC107]/20 border-[#FFC107]/30' };
        if (status === 'Failed') return { icon: <FiX className="w-4 h-4 text-[#EF5350]" />, bg: 'bg-[#EF5350]/20 border-[#EF5350]/30' };

        switch(type) {
            case 'Deposit':
            case 'Repay':
                return { icon: <FiArrowDownLeft className="w-4 h-4 text-[#66BB6A]" />, bg: 'bg-[#66BB6A]/20 border-[#66BB6A]/30' };
            case 'Withdraw':
            case 'Borrow':
                return { icon: <FiArrowUpRight className="w-4 h-4 text-[#2196F3]" />, bg: 'bg-[#2196F3]/20 border-[#2196F3]/30' };
            default:
                return { icon: <FiInformation className="w-4 h-4 text-gray-300" />, bg: 'bg-white/20 border-white/30' };
        }
    };

    if (!transactions || transactions.length === 0) {
        return (
            <div className="bg-black-light border border-black/50 p-6 rounded-2xl flex flex-col items-center justify-center h-48 text-white">
                <span className="mb-2">No Recent Activity</span>
                <span className="text-xs">Your transactions will appear here.</span>
            </div>
        );
    }

    const displayTxs = transactions.slice(0, limit);

    return (
        <div className="bg-black border border-black-light/50 rounded-2xl overflow-hidden shadow-xl">
            <h3 className="px-6 py-4 font-bold tracking-wide text-gray-300 border-b border-black-light/50 bg-black-light/30">Recent Activity Feed</h3>
            
            <div className="flex flex-col relative w-full">
                {/* Vertical Line Connector */}
                <div className="absolute left-9 top-0 bottom-0 w-0.5 bg-black-light/50"></div>
                
                {displayTxs.map((tx) => {
                    const { icon, bg } = getIconInfo(tx.type, tx.status);
                    const formattedDate = new Date(tx.timestamp).toLocaleString(undefined, {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    });
                    
                    return (
                        <div key={tx.id} className="relative flex items-start gap-4 p-5 hover:bg-black-light/20 transition-colors border-b border-black-light/20 last:border-0 group">
                            
                            {/* Icon Wrapper */}
                            <div className={`relative z-10 w-10 h-10 rounded-full border flex items-center justify-center shrink-0 shadow-inner backdrop-blur-sm ${bg}`}>
                                {icon}
                            </div>
                            
                            <div className="flex-1 flex flex-col pt-0.5">
                                <div className="flex justify-between items-start w-full">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="font-bold text-gray-300 capitalize">{tx.type} {tx.token}</span>
                                        <span className="text-xs text-white">{formattedDate}</span>
                                    </div>
                                    <div className="flex flex-col items-end gap-0.5">
                                        <span className="font-bold text-white tracking-wider">{tx.amount} {tx.token}</span>
                                        <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full ${
                                            tx.status === 'Confirmed' ? 'text-[#66BB6A] bg-[#1A261B]' : 
                                            tx.status === 'Pending' ? 'text-[#FFC107] bg-[#2A2416]' : 'text-[#EF5350] bg-[#2B1B1B]'
                                        }`}>
                                            {tx.status}
                                        </span>
                                    </div>
                                </div>

                                {tx.hash && (
                                    <div className="mt-3 flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="bg-black text-[10px] text-white font-mono px-2 py-1 rounded border border-black-light/50 flex items-center gap-2">
                                            {tx.hash.substring(0, 6)}...{tx.hash.substring(tx.hash.length - 4)}
                                            
                                            <button 
                                                onClick={() => handleCopy(tx.hash)}
                                                className="hover:text-white transition-colors p-0.5"
                                            >
                                                {copiedId === tx.hash ? <FiCheck className="text-[#66BB6A]" /> : <FiCopy />}
                                            </button>
                                        </div>
                                        <a 
                                            href={`https://sepolia.etherscan.io/tx/${tx.hash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[10px] bg-black-light/50 hover:bg-white hover:text-black border border-black-light px-2 py-1 flex items-center gap-1 rounded text-gray-300 transition-colors"
                                        >
                                            Etherscan <FiExternalLink />
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ActivityFeed;
