import React from 'react';

const YourLendingPositions = ({ positions }) => {
    return (
        <div className="bg-black-light border border-black/50 shadow-xl rounded-2xl overflow-hidden h-full flex flex-col">
            <h3 className="text-xl font-bold text-gray-300 p-8 pb-6 border-b border-black">Active Lending Positions</h3>
            
            <div className="flex-1 overflow-x-auto p-2">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-transparent">
                        <tr className="border-b border-black/40 text-[10px] tracking-widest uppercase text-white">
                            <th className="p-5 font-bold">Asset</th>
                            <th className="p-5 font-bold text-right">Deposited</th>
                            <th className="p-5 font-bold text-right">APY</th>
                            <th className="p-5 font-bold text-right hidden sm:table-cell">Accrued ($)</th>
                            <th className="p-5 font-bold text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-black/20">
                        {positions && positions.length > 0 ? (
                            positions.map((pos, idx) => (
                                <tr key={idx} className="hover:bg-black/30 transition-colors group">
                                    <td className="p-5 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-black border border-black shadow">{pos.asset[0]}</div>
                                        <span className="font-bold tracking-wide text-gray-300 group-hover:text-white transition-colors">{pos.asset}</span>
                                    </td>
                                    <td className="p-5 font-medium tracking-wide text-right">{pos.amount.toLocaleString()}</td>
                                    <td className="p-5 font-medium tracking-wide text-right">{pos.apy}%</td>
                                    <td className="p-5 text-white tracking-wide text-right hidden sm:table-cell">+${pos.interestEarned}</td>
                                    <td className="p-5 text-center">
                                       <button className="text-xs font-bold uppercase tracking-wider bg-black hover:bg-white hover:text-black text-white border border-black/60 px-4 py-2 rounded-lg transition-all shadow-md">
                                           Withdraw
                                       </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="p-12 text-center text-sm font-medium tracking-wide text-white">
                                    You have no active deposits natively bridging AagesLend.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default YourLendingPositions;
