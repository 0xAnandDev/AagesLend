import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../../hooks/useWeb3';
import { usePriceData } from '../../hooks/usePriceData';
import { useNotification } from '../../hooks/useNotification';
import { useTransactionHistory } from '../../hooks/useTransactionHistory';
import { usePoolData } from '../../hooks/usePoolData';
import Spinner from '../Loading/Spinner';

const DepositForm = () => {
    const { isConnected, account, provider } = useWeb3();
    const [token, setToken] = useState('USDC');
    const [amount, setAmount] = useState('');
    const [status, setStatus] = useState(null); // 'pending', 'confirmed', 'error'
    const [walletBalance, setWalletBalance] = useState(null);
    const { getTokenValueInUSD } = usePriceData();
    const { success, error, info } = useNotification();
    const { addTransaction, updateTransactionStatus } = useTransactionHistory();
    const { poolStats } = usePoolData();

    useEffect(() => {
        const fetchWalletBalance = async () => {
            if (!provider || !account) {
                setWalletBalance(null);
                return;
            }
            try {
                const balance = await provider.getBalance(account);
                setWalletBalance(Number(ethers.formatEther(balance)));
            } catch (fetchError) {
                setWalletBalance(null);
            }
        };
        fetchWalletBalance();
    }, [provider, account]);

    const supplyApy = typeof poolStats?.avgSupply === 'number' ? poolStats.avgSupply : null;

    const estInterestMonth = amount && typeof supplyApy === 'number' ? (parseFloat(amount) * (supplyApy / 100) / 12).toFixed(2) : null;
    const amountUSDValue = amount ? getTokenValueInUSD(amount, token) : null;
    const amountUSD = typeof amountUSDValue === 'number' ? amountUSDValue.toFixed(2) : null;

    const handleMax = () => {
        if (typeof walletBalance === 'number' && walletBalance > 0) {
            setAmount(walletBalance.toString());
        }
    };

    const handleDeposit = async () => {
        if(!isConnected) return;
        if(!amount || isNaN(amount) || parseFloat(amount) <= 0) return;
        
        setStatus('pending');
        info(`Initiating ${token} deposit...`);
        
        // Track locally
        const txRecord = addTransaction({
            type: 'Deposit',
            token: token,
            amount: amount,
            status: 'Pending'
        });

        // Transaction broadcast should be replaced by the contract call integration.
        setTimeout(() => {
            setStatus('confirmed');
            success(`${amount} ${token} deposited successfully.`);
            
            if (txRecord) {
                updateTransactionStatus(txRecord.id, 'Confirmed');
            }

            setTimeout(() => setStatus(null), 3000);
            setAmount('');
        }, 3000);
    };

    return (
        <div className="bg-black-light border border-black/50 shadow-xl rounded-2xl p-8 relative overflow-hidden">
            <h3 className="text-xl font-bold text-gray-300 mb-6">Deposit Asset</h3>
            
            <div className="flex flex-col gap-5">
                {/* Token Select & Amounts wrapper */}
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold tracking-wide text-white">Select Asset</label>
                    <select 
                        className="w-full bg-black border border-black/40 text-gray-300 rounded-xl px-4 py-3 outline-none focus:border-white transition-colors"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                    >
                        <option value="USDC">USDC (USD Coin)</option>
                        <option value="ETH">WETH (Wrapped Ethereum)</option>
                        <option value="DAI">DAI (Dai Stablecoin)</option>
                    </select>
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-end">
                       <label className="text-sm font-semibold tracking-wide text-white">Amount</label>
                       <span className="text-xs text-white">
                           Balance: {typeof walletBalance === 'number' ? `${walletBalance.toLocaleString(undefined, { maximumFractionDigits: 6 })} ETH` : "—"}
                       </span>
                    </div>
                    
                    <div className="relative">
                        <input 
                            type="number" 
                            className="w-full bg-black border border-black/40 text-gray-300 rounded-xl px-4 py-3 outline-none focus:border-white transition-colors pr-16"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                        <button onClick={handleMax} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold bg-black-light hover:bg-white hover:text-black text-gray-300 border border-black px-2 py-1 rounded transition-colors">
                            MAX
                        </button>
                    </div>
                    {amount && <span className="text-xs text-white mt-1">{amountUSD ? `≈ $${amountUSD} USD` : "≈ — USD"}</span>}
                </div>

                {/* Projection Data */}
                <div className="bg-black border border-black/40 rounded-xl p-4 flex flex-col gap-2 mt-2 shadow-inner">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-white">Supply APY</span>
                        <span className="font-bold text-gray-300">{typeof supplyApy === 'number' ? `${supplyApy.toFixed(2)}%` : "—"}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-white">Est. Interest (Monthly)</span>
                        <span className="font-bold text-gray-300">{estInterestMonth ? `+$${estInterestMonth}` : "—"}</span>
                    </div>
                </div>

                {/* Action Frame */}
                {isConnected ? (
                    <button 
                        onClick={handleDeposit}
                        disabled={status === 'pending'}
                        className={`w-full py-4 mt-2 rounded-xl flex items-center justify-center font-bold uppercase tracking-widest transition-all ${
                            status === 'pending' ? 'bg-[#1A1A1A] cursor-not-allowed border border-black shadow-inner' : 
                            status === 'confirmed' ? 'bg-[#66BB6A] text-black border border-transparent' : 
                            'bg-white text-black hover:bg-white shadow-[0_0_15px_rgba(232,232,232,0.15)]'
                        }`}
                    >
                        {status === 'pending' ? <Spinner text="" /> : status === 'confirmed' ? 'Deposit Confirmed!' : 'Deposit Assets'}
                    </button>
                ) : (
                    <button disabled className="w-full py-4 mt-2 rounded-xl bg-black border border-black/50 text-white font-bold uppercase tracking-widest cursor-not-allowed">
                        Wallet Disconnected
                    </button>
                )}
            </div>
        </div>
    );
};

export default DepositForm;
