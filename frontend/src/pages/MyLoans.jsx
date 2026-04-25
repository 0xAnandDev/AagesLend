import React, { useState, useRef, useEffect } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import { useUserPositions } from '../hooks/useUserPositions';
import LoansSummary from '../components/Loans/LoansSummary';
import LoansTable from '../components/Loans/LoansTable';
import RepayModal from '../components/Loans/RepayModal';

const MyLoans = () => {
    const { account } = useWeb3();
    const { positions, totals, loading, error } = useUserPositions();
    const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);
    const [showLockedPopup, setShowLockedPopup] = useState(false);
    const popupTimeoutRef = useRef(null);

    // Clear timeout on unmount
    useEffect(() => {
        return () => {
            if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
        };
    }, []);

    const handleRefresh = () => {
        // useUserPositions auto-refreshes every 15s, 
        // but we can pass a dummy trigger or rely on intervals.
        // For now, it will auto-update or the user can refresh the page.
    };

    const hasDeposits = totals?.totalCollateralUSD > 0;
    const hasBorrows = totals?.totalBorrowUSD > 0;
    const isRepayEligible = hasDeposits && hasBorrows;

    const handleLockedClick = () => {
        if (!isRepayEligible) {
            setShowLockedPopup(true);
            if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
            popupTimeoutRef.current = setTimeout(() => setShowLockedPopup(false), 3500);
        }
    };

    return (
        <div className="animate-fade-in pb-12 w-full max-w-7xl mx-auto">
            <div className="border-b border-[#222] pb-6 mb-8 flex justify-between items-end">
                <div>
                   <h1 className="text-3xl font-bold mb-2 text-[#ffffff]">My Loans</h1>
                   <p className="text-[#888] font-medium tracking-wide">Monitor your active positions, manage collateral, and execute operations securely.</p>
                </div>
            </div>

            {!account ? (
                <div className="bg-[#111111] border border-[#333] shadow-xl rounded-2xl p-10 flex flex-col items-center justify-center text-center">
                    <div className="text-[#888] text-sm tracking-wide mb-4">Connect wallet to view positions</div>
                </div>
            ) : loading ? (
                <div className="flex flex-col gap-8 animate-pulse">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-[#111111] rounded-[12px] h-[100px] border border-[#222]"></div>
                        ))}
                    </div>
                    <div className="bg-[#111111] rounded-[12px] h-[300px] border border-[#222]"></div>
                </div>
            ) : error ? (
                <div className="bg-[#2a0e0e] border border-[#ef4444] rounded-2xl p-6 text-center text-[#ef4444]">
                    Error loading positions: {error}
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-4">
                        <LoansSummary totals={totals} />
                        <LoansTable positions={positions} onRefresh={handleRefresh} />
                    </div>

                    {/* Repay Loan Section */}
                    <div className="mt-4 relative">
                        {!isRepayEligible ? (
                            <div 
                                onClick={handleLockedClick}
                                className="bg-[#1a1a1a] border border-[#333333] rounded-2xl p-6 transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,255,255,0.02)] cursor-pointer opacity-50 transform scale-[0.98]"
                            >
                                <div className="pointer-events-none flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-[#ffffff] mb-1">Repay Loan</h3>
                                        <p className="text-[#888888] text-sm">Unlock by borrowing against collateral</p>
                                    </div>
                                    <button 
                                        disabled
                                        className="bg-[#333333] text-[#ffffff] font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 border border-[#444444]"
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#888888]">
                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                        </svg>
                                        Locked
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-[#1a1a1a] border border-[#333333] rounded-2xl p-6 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4 opacity-100 transform translate-y-0">
                                <div>
                                    <h3 className="text-xl font-bold text-[#ffffff] mb-1">Repay Loan</h3>
                                    <p className="text-[#888888] text-sm">Manage and repay your borrowed assets</p>
                                </div>
                                <button 
                                    onClick={() => setIsRepayModalOpen(true)}
                                    className="bg-[#ffffff] hover:bg-[#dddddd] text-[#000000] font-bold py-3 px-8 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                                >
                                    Repay Now
                                </button>
                            </div>
                        )}

                        {/* Professional Pop-in */}
                        {showLockedPopup && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mt-[-10px] bg-[#111111] border border-[#444444] shadow-[0_10px_30px_rgba(0,0,0,0.5)] px-6 py-4 rounded-xl z-10 flex items-center gap-3 animate-fade-in pointer-events-none">
                                <svg className="w-5 h-5 text-[#888888]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-[#ffffff] text-sm font-medium tracking-wide">
                                    To repay a loan, you must first deposit collateral and borrow assets.
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <RepayModal 
                isOpen={isRepayModalOpen} 
                onClose={() => setIsRepayModalOpen(false)} 
                positions={positions || []} 
                onRefresh={handleRefresh}
            />
        </div>
    );
};

export default MyLoans;

