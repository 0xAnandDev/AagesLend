import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import { useUserPositions } from '../hooks/useUserPositions';
import addresses from '../utils/addresses.json';

const Settings = () => {
    const { account, disconnectWallet } = useWeb3();
    const { totals } = useUserPositions();

    const [prefs, setPrefs] = useState(() => {
        const local = localStorage.getItem('aageslend_prefs');
        if (local) return JSON.parse(local);
        return {
            slippage: '0.5%',
            gasPreference: 'Standard',
            confirmations: true
        };
    });


    useEffect(() => {
        localStorage.setItem('aageslend_prefs', JSON.stringify(prefs));
    }, [prefs]);


    const [copiedId, setCopiedId] = useState(null);

    const handleCopy = (text, id) => {
        if(text) {
            navigator.clipboard.writeText(text);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        }
    };

    const resetSettings = () => {
        localStorage.removeItem('aageslend_prefs');
        setPrefs({
            slippage: '0.5%',
            gasPreference: 'Standard',
            confirmations: true
        });
    };

    const updatePref = (key, value) => {
        setPrefs(prev => ({ ...prev, [key]: value }));
    };

    const formatAddress = (addr) => {
        if (!addr) return '';
        return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
    };

    if (!account) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center p-8 bg-black-light border border-[#333333] shadow-xl rounded-2xl max-w-md w-full">
                    <h2 className="text-xl font-bold text-white mb-4">Settings Locked</h2>
                    <p className="text-gray-300 mb-6">Connect wallet to access settings and manage your preferences.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in pb-12 max-w-6xl mx-auto">
            <div className="mb-8 border-b border-[#333333] pb-6">
                <h1 className="text-3xl font-bold mb-2 tracking-wide text-white">Settings</h1>
                <p className="text-gray-300 font-medium tracking-wider">Manage your account, preferences, and view protocol connections.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Left Column */}
                <div className="space-y-6">
                    {/* SECTION 1: WALLET & ACCOUNT */}
                    <section className="bg-black-light border border-[#333333] shadow-xl rounded-[16px] p-[24px] hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] transition-shadow">
                        <h2 className="text-xs font-extrabold text-white uppercase tracking-widest mb-6">Wallet & Account</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-300 uppercase tracking-wider block mb-2">Connected Address</label>
                                <div className="flex items-center justify-between bg-[#000000] p-4 rounded-xl border border-[#333333]">
                                    <span className="font-mono text-[#ffffff] text-sm">{formatAddress(account)}</span>
                                    <button 
                                        onClick={() => handleCopy(account, 'account')} 
                                        className={`text-[10px] font-bold uppercase tracking-widest transition flex items-center gap-1 ${copiedId === 'account' ? 'text-green-400' : 'text-gray-300 hover:text-white'}`}
                                    >
                                        {copiedId === 'account' ? (
                                            <>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                Copied
                                            </>
                                        ) : 'Copy'}
                                    </button>
                                </div>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-sm text-gray-300">Network</span>
                                <span className="text-sm text-white font-medium">Sepolia</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-sm text-gray-300">Status</span>
                                <span className="text-sm text-green-500 font-medium flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                    Connected
                                </span>
                            </div>
                            <div className="pt-2">
                                <a href={`https://sepolia.etherscan.io/address/${account}`} target="_blank" rel="noreferrer" className="block text-center py-3 bg-[#333333]/30 hover:bg-[#333333]/60 text-white border border-[#333333] rounded-xl text-xs font-bold uppercase tracking-widest transition">
                                    View on Etherscan
                                </a>
                            </div>
                        </div>
                    </section>

                    {/* SECTION 2: TRANSACTION SETTINGS */}
                    <section className="bg-black-light border border-[#333333] shadow-xl rounded-[16px] p-[24px] hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] transition-shadow">
                        <h2 className="text-xs font-extrabold text-white uppercase tracking-widest mb-6">Transaction Settings</h2>
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between mb-3">
                                    <label className="text-sm text-gray-300">Slippage Tolerance</label>
                                    <span className="text-sm text-white font-medium">{prefs.slippage}</span>
                                </div>
                                <div className="flex gap-3">
                                    {['0.1%', '0.5%', '1%'].map(val => (
                                        <button 
                                            key={val}
                                            onClick={() => updatePref('slippage', val)}
                                            className={`flex-1 py-2.5 rounded-xl text-sm transition font-medium border ${prefs.slippage === val ? 'bg-[#333333] text-white border-[#cccccc]' : 'bg-[#000000] text-gray-300 border-[#333333] hover:border-[#cccccc]'}`}
                                        >
                                            {val}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between mb-3">
                                    <label className="text-sm text-gray-300">Gas Preference</label>
                                    <span className="text-sm text-white font-medium">{prefs.gasPreference}</span>
                                </div>
                                <div className="flex gap-3">
                                    {['Low', 'Standard', 'High'].map(val => (
                                        <button 
                                            key={val}
                                            onClick={() => updatePref('gasPreference', val)}
                                            className={`flex-1 py-2.5 rounded-xl text-sm transition font-medium border ${prefs.gasPreference === val ? 'bg-[#333333] text-white border-[#cccccc]' : 'bg-[#000000] text-gray-300 border-[#333333] hover:border-[#cccccc]'}`}
                                        >
                                            {val}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-3 border-t border-[#333333]">
                                <span className="text-sm text-gray-300">Confirm transactions</span>
                                <button 
                                    onClick={() => updatePref('confirmations', !prefs.confirmations)}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${prefs.confirmations ? 'bg-green-500' : 'bg-[#333333]'}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${prefs.confirmations ? 'translate-x-7' : 'translate-x-1'}`}></div>
                                </button>
                            </div>
                        </div>
                    </section>


                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* SECTION 3: SECURITY PANEL */}
                    <section className="bg-black-light border border-[#333333] shadow-xl rounded-[16px] p-[24px] hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] transition-shadow">
                        <h2 className="text-xs font-extrabold text-white uppercase tracking-widest mb-6">Security Panel</h2>
                        <div className="space-y-5">
                            <p className="text-sm text-green-400 bg-[#000000] p-4 rounded-xl border border-green-500/20">
                                Your funds are secured by smart contracts.
                            </p>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-[#000000] p-4 rounded-xl border border-[#333333]">
                                    <span className="text-[10px] text-gray-300 uppercase tracking-widest block mb-2">Total Deposits</span>
                                    <span className="text-xl font-bold text-white">${totals?.totalCollateralUSD?.toFixed(2) || '0.00'}</span>
                                </div>
                                <div className="bg-[#000000] p-4 rounded-xl border border-[#333333]">
                                    <span className="text-[10px] text-gray-300 uppercase tracking-widest block mb-2">Total Borrowed</span>
                                    <span className="text-xl font-bold text-white">${totals?.totalBorrowUSD?.toFixed(2) || '0.00'}</span>
                                </div>
                            </div>

                            <div className="bg-[#1a1a1a] p-4 rounded-xl border border-[#333333]">
                                <h3 className="text-sm font-bold text-[#cccccc] mb-2">Health Factor Alert</h3>
                                <p className="text-xs text-gray-300 leading-relaxed">If your Health Factor drops too low, your position may be liquidated.</p>
                            </div>
                        </div>
                    </section>

                    {/* SECTION 4: PROTOCOL SETTINGS */}
                    <section className="bg-black-light border border-[#333333] shadow-xl rounded-[16px] p-[24px] hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] transition-shadow">
                        <h2 className="text-xs font-extrabold text-white uppercase tracking-widest mb-6">Protocol Settings</h2>
                        <div className="space-y-5">
                            <div className="flex justify-between items-center py-2 border-b border-[#333333]">
                                <span className="text-sm text-gray-300">Supported Network</span>
                                <span className="text-sm text-white font-medium">Sepolia</span>
                            </div>
                            
                            <div>
                                <span className="text-[10px] text-gray-300 uppercase tracking-widest block mb-3">Contracts Connected</span>
                                <div className="space-y-3">
                                    {[
                                        { name: 'AagesLendCore', address: addresses.AagesLendCore },
                                        { name: 'LiquidityPool', address: addresses.LiquidityPool },
                                        { name: 'CollateralManager', address: addresses.CollateralManager }
                                    ].map(c => (
                                        <div key={c.name} className="flex items-center justify-between bg-[#000000] p-3.5 rounded-xl border border-[#333333]">
                                            <span className="text-sm text-gray-300 font-medium">{c.name}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono text-xs text-[#cccccc]">{formatAddress(c.address)}</span>
                                                <button 
                                                    onClick={() => handleCopy(c.address, c.name)} 
                                                    className={`text-[10px] uppercase font-bold tracking-wider transition flex items-center gap-1 ${copiedId === c.name ? 'text-green-400' : 'text-gray-300 hover:text-white'}`}
                                                >
                                                    {copiedId === c.name ? (
                                                        <>
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                            Copied
                                                        </>
                                                    ) : 'Copy'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* SECTION 6: ABOUT AAGESLEND */}
                    <section className="bg-black-light border border-[#333333] shadow-xl rounded-[16px] p-[24px] hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] transition-shadow">
                        <h2 className="text-xs font-extrabold text-white uppercase tracking-widest mb-4">About AagesLend</h2>
                        <p className="text-sm text-gray-300 leading-relaxed mb-6">
                            Decentralized lending protocol enabling users to supply assets, borrow liquidity, and manage risk without intermediaries.
                        </p>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center py-2 border-t border-[#333333] pt-4">
                                <span className="text-sm text-gray-300">Version</span>
                                <span className="text-sm text-white font-medium">v1.0</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-sm text-gray-300">Developer</span>
                                <div className="flex gap-4">
                                    <a href="https://github.com/0xAnandDev/AagesLend" target="_blank" rel="noreferrer" className="text-sm text-white hover:text-[#cccccc] transition">GitHub</a>
                                    <span className="text-gray-300">|</span>
                                    <a href="https://x.com/AnandBlockchain" target="_blank" rel="noreferrer" className="text-sm text-white hover:text-[#cccccc] transition">Twitter</a>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* SECTION 7: LOGOUT / RESET */}
                    <section className="bg-black-light border border-[#333333] shadow-xl rounded-[16px] p-[24px] hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] transition-shadow">
                        <div className="flex flex-col gap-4">
                            <button onClick={disconnectWallet} className="w-full text-center py-3.5 bg-[#EF5350]/10 hover:bg-[#EF5350]/20 text-[#EF5350] border border-[#EF5350]/30 rounded-xl text-xs font-bold uppercase tracking-widest transition">
                                Disconnect Wallet
                            </button>
                            <button onClick={resetSettings} className="w-full text-center py-3.5 bg-transparent hover:bg-[#333333]/50 text-gray-300 border border-[#333333] rounded-xl text-xs font-bold uppercase tracking-widest transition">
                                Reset UI Settings
                            </button>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Settings;
