import React, { useState } from 'react';
import { FiDownload, FiSearch, FiFilter } from 'react-icons/fi';
import { SkeletonTable } from '../Skeleton';

const TransactionHistory = ({ transactions, isLoading }) => {
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');

    const displayTxs = transactions.filter(tx => {
        const matchesFilter = filter === 'All' || tx.type === filter;
        const matchesSearch = search === '' || 
                              tx.hash.toLowerCase().includes(search.toLowerCase()) || 
                              tx.token.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const exportCSV = () => {
        if (displayTxs.length === 0) return;
        const headers = ["ID", "Type", "Token", "Amount", "Status", "Date", "Hash"];
        const csvContent = [
            headers.join(","),
            ...displayTxs.map(tx => [
                tx.id, tx.type, tx.token, tx.amount, tx.status, new Date(tx.timestamp).toISOString(), tx.hash
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", "AagesLend_History.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-black-light border border-black/50 rounded-2xl overflow-hidden flex flex-col shadow-xl">
            {/* Toolbar */}
            <div className="p-6 border-b border-black/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h3 className="font-bold text-xl text-gray-300 tracking-wide">Ledger History</h3>
                
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white w-4 h-4" />
                        <input 
                            type="text" 
                            placeholder="Search Hash or Token..." 
                            className="bg-black border border-black-light/50 rounded-lg pl-9 pr-4 py-2 text-sm w-full outline-none focus:border-white transition-colors text-gray-300"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    
                    <select 
                        className="bg-black border border-black-light/50 rounded-lg px-4 py-2 text-sm outline-none focus:border-white text-white capitalize transition-colors"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="All">All Types</option>
                        <option value="Deposit">Deposit</option>
                        <option value="Withdraw">Withdraw</option>
                        <option value="Borrow">Borrow</option>
                        <option value="Repay">Repay</option>
                    </select>

                    <button 
                        onClick={exportCSV}
                        className="bg-black-light hover:bg-white hover:text-black border border-black-light/50 p-2.5 rounded-lg text-white transition-colors"
                        title="Export CSV"
                    >
                        <FiDownload className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 w-full overflow-x-auto p-6 md:p-0">
                {isLoading ? (
                    <div className="p-6">
                        <SkeletonTable rows={5} />
                    </div>
                ) : displayTxs.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-white flex-col">
                         <span className="font-medium text-lg text-gray-300 mb-1">No Records Found</span>
                         <span className="text-sm">We couldn't find any transactions matching these filters.</span>
                    </div>
                ) : (
                    <table className="w-full text-left min-w-[700px]">
                        <thead>
                            <tr className="bg-black text-[11px] uppercase tracking-widest text-white border-b border-black">
                                <th className="px-6 py-4 font-semibold">Type</th>
                                <th className="px-6 py-4 font-semibold">Asset</th>
                                <th className="px-6 py-4 font-semibold right-align">Amount</th>
                                <th className="px-6 py-4 font-semibold">Time</th>
                                <th className="px-6 py-4 font-semibold text-center">Status</th>
                                <th className="px-6 py-4 font-semibold text-right">Route</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-gray-300 divide-y divide-black/30">
                            {displayTxs.map(tx => (
                                <tr key={tx.id} className="hover:bg-black/30 transition-colors">
                                    <td className="px-6 py-4 font-bold">{tx.type}</td>
                                    <td className="px-6 py-4 font-medium">{tx.token}</td>
                                    <td className="px-6 py-4 font-bold font-mono text-white">{tx.amount}</td>
                                    <td className="px-6 py-4 text-xs text-white">
                                        {new Date(tx.timestamp).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`mx-auto w-fit text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded flex items-center justify-center
                                            ${tx.status === 'Confirmed' ? 'text-[#66BB6A] bg-[#1A261B]' : 
                                            tx.status === 'Pending' ? 'text-[#FFC107] bg-[#2A2416]' : 'text-[#EF5350] bg-[#2B1B1B]'}`
                                        }>
                                            {tx.status}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {tx.hash ? (
                                            <a href={`https://sepolia.etherscan.io/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-300 hover:text-white underline decoration-black/50 hover:decoration-white transition-all">
                                                {tx.hash.substring(0, 6)}...{tx.hash.substring(tx.hash.length - 4)}
                                            </a>
                                        ) : (
                                            <span className="text-xs text-black/50">N/A</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            
            {/* Footer Pagination Mock */}
            {displayTxs.length > 0 && !isLoading && (
                <div className="bg-black px-6 py-4 flex items-center justify-between border-t border-black/50 text-xs font-semibold text-white">
                    <span>Showing 1 to {displayTxs.length} of {displayTxs.length} entries</span>
                    <div className="flex items-center gap-2">
                        <button className="px-3 py-1 rounded bg-black-light  cursor-not-allowed">Previous</button>
                        <button className="px-3 py-1 rounded bg-white text-black">1</button>
                        <button className="px-3 py-1 rounded bg-black-light hover:bg-white hover:text-black transition-colors">Next</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TransactionHistory;
