import React, { useState } from 'react';
import { useWeb3 } from '../../hooks/useWeb3';
import { usePriceData } from '../../hooks/usePriceData';
import { useNotification } from '../../hooks/useNotification';
import { useTransactionHistory } from '../../hooks/useTransactionHistory';
import Spinner from '../Loading/Spinner';

const BorrowForm = ({ maxLTV = 80, currentApy, availableBorrow = null }) => {
    const { isConnected } = useWeb3();
    const [borrowToken, setBorrowToken] = useState('ETH');
    const [amount, setAmount] = useState('');
    const [status, setStatus] = useState(null); 
    const { getTokenValueInUSD } = usePriceData();
    const { success, error, info } = useNotification();
    const { addTransaction, updateTransactionStatus } = useTransactionHistory();

    const handleMax = () => {
        if (typeof availableBorrow === 'number' && availableBorrow > 0) {
            const tokenPrice = getTokenValueInUSD(1, borrowToken);
            if (typeof tokenPrice === 'number' && tokenPrice > 0) {
                setAmount((availableBorrow / tokenPrice).toFixed(6));
            }
        }
    };

    const projectedMonthly = amount && typeof currentApy === 'number'
        ? (parseFloat(amount) * (currentApy / 100) / 12).toFixed(4)
        : null;
    const amountUSDValue = amount ? getTokenValueInUSD(amount, borrowToken) : null;
    const amountUSD = typeof amountUSDValue === 'number' ? amountUSDValue.toFixed(2) : null;

    const handleBorrow = () => {
        if(!isConnected || !amount || parseFloat(amount) <= 0) return;
        
        setStatus('pending');
        info(`Initiating ${borrowToken} borrow request...`);
        
        const txRecord = addTransaction({
            type: 'Borrow',
            token: borrowToken,
            amount: amount,
            status: 'Pending'
        });

        setTimeout(() => {
            const mockHash = "0x" + Math.random().toString(16).substring(2, 10).padStart(8, '0') + Math.random().toString(16).substring(2, 10);
            
            setStatus('confirmed');
            success(`${amount} ${borrowToken} borrowed successfully.`, mockHash);
            
            if (txRecord) updateTransactionStatus(txRecord.id, 'Confirmed', { hash: mockHash });

            setTimeout(() => setStatus(null), 3000);
            setAmount('');
        }, 3000);
    };

    return (
        <div className="bg-black-light border border-black/50 shadow-xl rounded-2xl p-8 relative overflow-hidden h-full">
            <h3 className="text-xl font-bold text-gray-300 mb-6 tracking-wide">Execute Borrow</h3>
            
            <div className="flex flex-col gap-6">
                
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-white">Step 1: Outbound Asset</label>
                    <select 
                        className="w-full bg-black border border-black/40 text-gray-300 rounded-xl px-4 py-3 outline-none focus:border-white transition-colors"
                        value={borrowToken}
                        onChange={(e) => setBorrowToken(e.target.value)}
                    >
                        <option value="ETH">WETH (Wrapped Ethereum)</option>
                        <option value="USDC">USDC (USD Coin)</option>
                        <option value="DAI">DAI (Dai Stablecoin)</option>
                    </select>
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-end">
                       <label className="text-xs font-bold uppercase tracking-widest text-white">Step 2: Request Size</label>
                    </div>
                    
                    <div className="relative">
                        <input 
                            type="number" 
                            className="w-full bg-black border border-black/40 text-gray-300 rounded-xl px-4 py-3 outline-none focus:border-white transition-colors pr-16"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                        <button onClick={handleMax} className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] tracking-widest font-bold uppercase bg-black-light hover:bg-white hover:text-black text-gray-300 border border-black px-2 py-1.5 rounded transition-colors">
                            MAX
                        </button>
                    </div>
                    {amount && <span className="text-xs text-white mt-1">{amountUSD ? `≈ $${amountUSD} USD` : "≈ — USD"}</span>}
                </div>

                <div className="bg-black border border-black/40 rounded-xl p-5 flex flex-col gap-3 shadow-inner">
                    <div className="flex justify-between items-center text-sm font-medium tracking-wide">
                        <span className="text-white">Borrow APY</span>
                        <span className="font-bold text-gray-300">{typeof currentApy === 'number' ? `${currentApy.toFixed(2)}%` : "—"}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-medium tracking-wide">
                        <span className="text-white">Projected Interest/Mo</span>
                        <span className="font-bold text-gray-300">{projectedMonthly ? `${projectedMonthly} ${borrowToken}` : "—"}</span>
                    </div>
                </div>

                {isConnected ? (
                    <button 
                        onClick={handleBorrow}
                        disabled={status === 'pending'}
                        className={`w-full py-4 mt-1 rounded-xl flex items-center justify-center font-extrabold uppercase tracking-widest transition-all shadow-lg ${
                            status === 'pending' ? 'bg-[#1A1A1A] cursor-not-allowed border border-black' : 
                            status === 'confirmed' ? 'bg-[#66BB6A] text-black border border-transparent' : 
                            'bg-white text-black hover:bg-white hover:shadow-white/20 shadow-[0_0_15px_rgba(232,232,232,0.15)]'
                        }`}
                    >
                        {status === 'pending' ? <Spinner text="" /> : status === 'confirmed' ? 'Successfully Borrowed!' : 'Confirm Borrow'}
                    </button>
                ) : (
                    <button disabled className="w-full py-4 mt-1 rounded-xl bg-black border border-black/50 text-white font-bold uppercase tracking-widest cursor-not-allowed">
                        Wallet Locked
                    </button>
                )}
            </div>
        </div>
    );
};

export default BorrowForm;
