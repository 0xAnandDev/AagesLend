import React from 'react';

const YourLoans = ({ loans }) => {
    return (
        <div className="bg-black-light border border-black/50 shadow-xl rounded-2xl overflow-hidden flex flex-col mt-8">
            <h3 className="text-xl font-bold text-gray-300 p-8 pb-6 border-b border-black">Originating Loans</h3>
            
            <div className="flex-1 overflow-x-auto p-2">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-transparent">
                        <tr className="border-b border-black/40 text-[10px] tracking-[0.1em] uppercase font-bold text-white">
                            <th className="p-5">Collateral Pair</th>
                            <th className="p-5 text-right">Owed Debt</th>
                            <th className="p-5 text-center hidden md:table-cell">Col. Amount</th>
                            <th className="p-5 text-right">APY</th>
                            <th className="p-5 text-right hidden sm:table-cell">Accrued</th>
                            <th className="p-5 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-black/20">
                        {loans && loans.length > 0 ? (
                            loans.map((pos, idx) => (
                                <tr key={idx} className="hover:bg-black/30 transition-colors group">
                                    <td className="p-5 flex items-center gap-3">
                                        <div className="flex items-center">
                                            <div className="w-6 h-6 rounded-full bg-white border border-black z-10 flex text-[9px] font-bold text-black items-center justify-center -mr-2">{pos.collateral[0]}</div>
                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-black border border-black shadow">{pos.borrowAsset[0]}</div>
                                        </div>
                                        <span className="font-bold tracking-wide text-gray-300 group-hover:text-white transition-colors">{pos.collateral} / {pos.borrowAsset}</span>
                                    </td>
                                    <td className="p-5 font-medium tracking-wide text-right">{pos.borrowAmount} {pos.borrowAsset}</td>
                                    <td className="p-5 font-medium tracking-wide text-center hidden md:table-cell text-white">{pos.collateralAmount} {pos.collateral}</td>
                                    <td className="p-5 font-medium tracking-wide text-right">{pos.apy}%</td>
                                    <td className="p-5 text-white tracking-wide text-right hidden sm:table-cell">-${pos.interestAccrued}</td>
                                    <td className="p-5 flex gap-2 justify-center">
                                       <button className="text-[10px] font-bold uppercase tracking-widest bg-white hover:bg-white text-black border border-transparent px-3 py-2 rounded-lg transition-all shadow-md">
                                           Repay
                                       </button>
                                       <button className="text-[10px] font-bold uppercase tracking-widest bg-black hover:bg-white hover:text-black text-white border border-black/60 px-3 py-2 rounded-lg transition-all shadow-md">
                                           + Col.
                                       </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="p-12 text-center text-sm font-medium tracking-wide text-white">
                                    No active debt allocations detected.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default YourLoans;
