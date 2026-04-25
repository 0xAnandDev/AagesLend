import React, { useState } from 'react';

const LiquidateModal = ({ isOpen, onClose, targetData, onSuccess }) => {
    const [amount, setAmount] = useState('');
    const [status, setStatus] = useState(null);

    if (!isOpen || !targetData) return null;

    // Standard Protocol 50% max close factor limit
    const maxClose = targetData.loanAmount * 0.50; 
    
    // Simulate Bonus mechanics mathematically 
    const calculateBonusReturn = () => {
        if(!amount || isNaN(amount)) return "0.00";
        // Simplified mock logic returning bonus estimation
        const seizedValue = parseFloat(amount) * 1.05; // 5% bonus assumption mapping
        return seizedValue.toFixed(4);
    };

    const handleMax = () => setAmount(maxClose.toString());

    const executeLiquidate = () => {
        if(!amount || parseFloat(amount) <= 0 || parseFloat(amount) > maxClose) return;
        setStatus('pending');
        setTimeout(() => {
            setStatus('confirmed');
            setTimeout(() => {
                setStatus(null);
                if (onSuccess) onSuccess(targetData);
                else onClose();
            }, 2000);
        }, 3000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-black-light border border-black shadow-2xl rounded-2xl w-full max-w-md p-8 relative">
                <button onClick={onClose} className="absolute right-6 top-6 text-white hover:text-white font-bold transition-colors">✕</button>
                
                <h3 className="text-xl font-bold text-gray-300 mb-2">Execute Liquidation</h3>
                <p className="text-xs text-[#EF5350] font-bold uppercase tracking-widest mb-6 border border-[#EF5350]/20 bg-[#EF5350]/10 p-2 rounded inline-block">At-Risk Target: {targetData.healthFactor}</p>
                
                <div className="flex flex-col gap-4 mb-6">
                    <div className="bg-black rounded-xl p-4 border border-black/50 flex justify-between items-center">
                        <span className="text-xs text-white uppercase font-bold tracking-widest">Protocol Max Close</span>
                        <span className="font-bold text-gray-300">{maxClose} {targetData.loanToken}</span>
                    </div>

                    <div className="relative mt-2">
                        <label className="text-[10px] font-bold text-white uppercase tracking-widest block mb-2">Debt Repayment Payload ({targetData.loanToken})</label>
                        <input 
                            type="number" 
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-black border border-black/40 text-gray-300 rounded-xl px-4 py-3 outline-none focus:border-white transition-colors pr-16"
                        />
                        <button onClick={handleMax} className="absolute right-3 top-[34px] text-[10px] tracking-widest font-bold uppercase bg-black-light hover:bg-white hover:text-black text-gray-300 border border-black px-2 py-1.5 rounded transition-colors">
                            MAX 50%
                        </button>
                    </div>

                    <div className="bg-black rounded-xl p-4 border border-black/50 shadow-inner flex flex-col gap-2">
                         <div className="flex justify-between items-center text-sm">
                             <span className="text-white font-medium">Estimated Seized</span>
                             <span className="font-bold text-gray-300">{calculateBonusReturn()} {targetData.colToken}</span>
                         </div>
                         <div className="flex justify-between items-center text-sm">
                             <span className="text-white font-medium">Liquidation Bonus</span>
                             <span className="font-bold text-[#66BB6A]">+5.00%</span>
                         </div>
                    </div>
                </div>

                <div className="text-[10px] text-white uppercase tracking-widest mb-4 font-bold text-center">
                    Note: Unfavorable slippage may revert execution.
                </div>

                <button 
                    onClick={executeLiquidate}
                    disabled={status === 'pending' || !amount || parseFloat(amount) > maxClose}
                    className={`w-full py-4 rounded-xl font-extrabold uppercase tracking-widest transition-all ${
                        status === 'pending' ? 'bg-black text-white cursor-not-allowed border border-black' : 
                        status === 'confirmed' ? 'bg-[#66BB6A] text-black border border-transparent' : 
                        !amount || parseFloat(amount) > maxClose ? 'bg-black text-white/50 border border-black cursor-not-allowed' :
                        'bg-white text-black hover:bg-white shadow-[0_0_15px_rgba(232,232,232,0.15)]'
                    }`}
                >
                    {status === 'pending' ? 'Executing Seizure...' : status === 'confirmed' ? 'Successfully Liquidated!' : 'Confirm Liquidation'}
                </button>
            </div>
        </div>
    );
};

export default LiquidateModal;
