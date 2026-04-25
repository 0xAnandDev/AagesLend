import React, { useMemo } from 'react';
import { useUserPositions } from '../hooks/useUserPositions';
import { useWeb3 } from '../hooks/useWeb3';
import { calculateHealthFactor, getRiskLevel, getRiskColor } from '../utils/liquidationEngine';
import { useNavigate } from 'react-router-dom';

const Liquidations = () => {
    const { account } = useWeb3();
    const { data: userPositionsData } = useUserPositions();
    const navigate = useNavigate();

    const { totalCollateralUSD, totalBorrowUSD, healthFactor, riskLevel, riskColor } = useMemo(() => {
        if (!userPositionsData || !userPositionsData.totals) {
            return { totalCollateralUSD: 0, totalBorrowUSD: 0, healthFactor: Infinity, riskLevel: 'SAFE', riskColor: '#10b981' };
        }
        const col = userPositionsData.totals.totalCollateralUSD;
        const bor = userPositionsData.totals.totalBorrowUSD;
        const hf = calculateHealthFactor(col, bor);
        return {
            totalCollateralUSD: col,
            totalBorrowUSD: bor,
            healthFactor: hf,
            riskLevel: getRiskLevel(hf),
            riskColor: getRiskColor(hf)
        };
    }, [userPositionsData]);

    const activeBorrows = useMemo(() => {
        if (!userPositionsData || !userPositionsData.positions) return [];
        return userPositionsData.positions.filter(p => p.borrowed > 0);
    }, [userPositionsData]);

    const activeCollateral = useMemo(() => {
        if (!userPositionsData || !userPositionsData.positions) return [];
        return userPositionsData.positions.filter(p => p.deposited > 0);
    }, [userPositionsData]);

    const markerPosition = useMemo(() => {
        if (healthFactor === Infinity) return 100;
        if (healthFactor <= 0) return 0;
        if (healthFactor <= 1) return (healthFactor / 1) * 30; // 0-1 maps to 0-30%
        if (healthFactor <= 2) return 30 + ((healthFactor - 1) / 1) * 40; // 1-2 maps to 30-70%
        if (healthFactor <= 3) return 70 + ((healthFactor - 2) / 1) * 30; // 2-3 maps to 70-100%
        return 100;
    }, [healthFactor]);

    if (!account) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <div className="text-[#888] text-lg font-medium mb-4">Please connect your wallet to view your liquidation risk.</div>
            </div>
        );
    }

    return (
        <div className="pb-12 animate-in fade-in duration-300">
            <div className="mb-8 border-b border-[#333] pb-6">
               <h1 className="text-3xl font-bold mb-2 tracking-wide text-white">Liquidation Risk Monitor</h1>
               <p className="text-[#888] font-medium tracking-wider">Monitor your exact account health factor and active debt to prevent liquidations.</p>
            </div>

            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-[#111111] border border-[#333] rounded-xl p-6 relative overflow-hidden">
                    <div className="text-[#888] text-sm font-bold tracking-widest uppercase mb-4">Total Collateral Value</div>
                    <div className="text-3xl font-bold text-white font-mono">${totalCollateralUSD.toFixed(2)}</div>
                    <div className="text-xs text-[#888] mt-2 font-mono">Assets protecting your positions</div>
                </div>
                <div className="bg-[#111111] border border-[#333] rounded-xl p-6 relative overflow-hidden">
                    <div className="text-[#888] text-sm font-bold tracking-widest uppercase mb-4">Total Debt Value</div>
                    <div className="text-3xl font-bold text-white font-mono">${totalBorrowUSD.toFixed(2)}</div>
                    <div className="text-xs text-[#888] mt-2 font-mono">Current borrowed liability</div>
                </div>
                <div className="bg-[#111111] border border-[#333] rounded-xl p-6 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                        <div className="text-[#888] text-sm font-bold tracking-widest uppercase">Health Factor</div>
                        <span className="text-[10px] uppercase font-bold px-2 py-1 rounded" style={{ color: riskColor, backgroundColor: `${riskColor}15`, border: `1px solid ${riskColor}30` }}>
                            {riskLevel}
                        </span>
                    </div>
                    <div className="text-3xl font-bold font-mono" style={{ color: riskColor }}>
                        {healthFactor === Infinity ? '∞' : healthFactor.toFixed(3)}
                    </div>
                    <div className="text-xs text-[#888] mt-2 font-mono">If &lt; 1.0, collateral can be liquidated</div>
                </div>
            </div>

            {/* Visual Risk Bar */}
            <div className="bg-[#111111] border border-[#333] shadow-xl rounded-xl p-8 mb-10">
                 <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-widest text-sm">Account Risk Profile</h2>
                 
                 {totalBorrowUSD === 0 ? (
                     <div className="text-center py-8">
                         <div className="w-16 h-16 rounded-full bg-[#10b981]/10 border border-[#10b981]/30 flex items-center justify-center mx-auto mb-4">
                             <svg className="w-8 h-8 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                             </svg>
                         </div>
                         <div className="text-white font-bold text-lg mb-1">No Active Positions</div>
                         <div className="text-[#888] text-sm mb-6">Deposit collateral and borrow assets to unlock your risk profile.</div>
                         <div className="flex items-center justify-center gap-4">
                             <button onClick={() => navigate('/lend')} className="bg-white text-black font-bold py-2 px-6 rounded-lg hover:bg-gray-200 transition-colors">
                                 Deposit Collateral
                             </button>
                             <button onClick={() => navigate('/borrow')} className="bg-[#1a1a1a] text-white font-bold py-2 px-6 rounded-lg border border-[#333] hover:bg-[#222] transition-colors">
                                 Borrow Assets
                             </button>
                         </div>
                     </div>
                 ) : (
                     <div className="relative pt-6 pb-2">
                         {/* Scale markers */}
                         <div className="flex justify-between text-[#555] text-xs font-mono mb-2 px-1">
                             <span>0.0</span>
                             <span className="absolute left-[30%] -translate-x-1/2">1.0</span>
                             <span className="absolute left-[70%] -translate-x-1/2">2.0</span>
                             <span>3.0+</span>
                         </div>
                         
                         {/* Gradient Bar */}
                         <div className="h-4 w-full rounded-full bg-gradient-to-r from-[#ef4444] via-[#f59e0b] to-[#10b981] relative">
                             {/* Liquidation Threshold Line */}
                             <div className="absolute top-0 bottom-0 left-[30%] w-0.5 bg-white z-10"></div>
                             
                             {/* User Marker */}
                             <div 
                                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-white border-4 border-[#111] rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] z-20 transition-all duration-500 ease-out"
                                style={{ left: `${markerPosition}%` }}
                             ></div>
                         </div>
                         
                         <div className="flex justify-between mt-4 text-xs font-bold tracking-widest uppercase">
                             <span className="text-[#ef4444]">High Risk (Liquidatable)</span>
                             <span className="text-[#10b981]">Safe</span>
                         </div>
                     </div>
                 )}
            </div>

            {/* Asset Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Active Borrows */}
                <div className="bg-[#111111] border border-[#333] shadow-xl rounded-xl overflow-hidden">
                    <div className="p-5 border-b border-[#333] bg-[#0a0a0a]">
                        <h3 className="text-[#888] font-bold tracking-widest uppercase text-sm">Your Debt Positions</h3>
                    </div>
                    {activeBorrows.length === 0 ? (
                        <div className="p-8 text-center flex flex-col items-center justify-center">
                            <div className="text-[#555] text-sm mb-4">You have no active debt positions.</div>
                            <button onClick={() => navigate('/borrow')} className="text-xs font-bold text-white uppercase tracking-widest border border-[#333] px-4 py-2 rounded hover:bg-[#222] transition-colors">
                                Go to Borrow
                            </button>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-[#0f0f0f] border-b border-[#333] text-[10px] tracking-[0.15em] uppercase text-[#888]">
                                <tr>
                                    <th className="p-4">Asset</th>
                                    <th className="p-4">Borrowed</th>
                                    <th className="p-4 text-right">Value (USD)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#222]">
                                {activeBorrows.map(pos => (
                                    <tr key={pos.tokenAddress} className="hover:bg-[#1a1a1a]">
                                        <td className="p-4">
                                            <div className="font-bold text-white">{pos.symbol}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-white font-mono">{pos.borrowed.toFixed(4)}</div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="font-bold text-[#ef4444] font-mono">${pos.borrowedUSD.toFixed(2)}</div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    {activeBorrows.length > 0 && (
                        <div className="p-4 bg-[#0a0a0a] border-t border-[#333] flex justify-end">
                            <button onClick={() => navigate('/loans')} className="text-xs font-bold text-white uppercase tracking-widest border border-[#333] px-4 py-2 rounded hover:bg-[#222] transition-colors">
                                Manage Loans
                            </button>
                        </div>
                    )}
                </div>

                {/* Active Collateral */}
                <div className="bg-[#111111] border border-[#333] shadow-xl rounded-xl overflow-hidden">
                    <div className="p-5 border-b border-[#333] bg-[#0a0a0a]">
                        <h3 className="text-[#888] font-bold tracking-widest uppercase text-sm">Supplied Collateral</h3>
                    </div>
                    {activeCollateral.length === 0 ? (
                        <div className="p-8 text-center flex flex-col items-center justify-center">
                            <div className="text-[#555] text-sm mb-4">No collateral has been supplied yet.</div>
                            <button onClick={() => navigate('/lend')} className="text-xs font-bold text-black bg-white uppercase tracking-widest px-4 py-2 rounded hover:bg-gray-200 transition-colors">
                                Supply Collateral
                            </button>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-[#0f0f0f] border-b border-[#333] text-[10px] tracking-[0.15em] uppercase text-[#888]">
                                <tr>
                                    <th className="p-4">Asset</th>
                                    <th className="p-4">Supplied</th>
                                    <th className="p-4 text-right">Value (USD)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#222]">
                                {activeCollateral.map(pos => (
                                    <tr key={pos.tokenAddress} className="hover:bg-[#1a1a1a]">
                                        <td className="p-4">
                                            <div className="font-bold text-white">{pos.symbol}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-white font-mono">{pos.deposited.toFixed(4)}</div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="font-bold text-[#10b981] font-mono">${pos.depositedUSD.toFixed(2)}</div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Liquidations;
