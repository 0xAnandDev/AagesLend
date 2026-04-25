import React, { useState } from 'react';

const AddCollateralModal = ({ isOpen, onClose, loanData }) => {
    const [amount, setAmount] = useState('');
    const [status, setStatus] = useState(null);

    if (!isOpen || !loanData) return null;

    const executeAdd = () => {
        if(!amount || parseFloat(amount) <= 0) return;
        setStatus('pending');
        setTimeout(() => {
            setStatus('confirmed');
            setTimeout(() => {
                setStatus(null);
                onClose();
            }, 2000);
        }, 2000);
    };

    // Simulated projection natively enforcing bounds
    const estNewHealth = loanData.healthFactor + (parseFloat(amount || 0) * 0.15);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-black-light border border-black shadow-2xl rounded-2xl w-full max-w-md p-8 relative">
                <button onClick={onClose} className="absolute right-6 top-6 text-white hover:text-white font-bold transition-colors">✕</button>
                
                <h3 className="text-xl font-bold text-gray-300 mb-6">Reinforce Collateral Tracker</h3>
                
                <div className="bg-black rounded-xl p-5 mb-6 border border-black/50 shadow-inner">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-white uppercase tracking-widest font-bold">Active Collateral</span>
                        <span className="font-bold text-gray-300">{loanData.collateralAmount} {loanData.collateral}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-white uppercase tracking-widest font-bold">Current Health Factor</span>
                        <span className="font-bold text-gray-300">{loanData.healthFactor.toFixed(2)}</span>
                    </div>
                </div>

                <div className="mb-6 relative">
                    <label className="text-xs font-bold text-white uppercase tracking-widest block mb-2">Deposit Amount ({loanData.collateral})</label>
                    <input 
                        type="number" 
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-black border border-black/40 text-gray-300 rounded-xl px-4 py-3 outline-none focus:border-white transition-colors pr-16"
                    />
                </div>

                <div className="flex justify-between items-center mb-8 px-2">
                    <span className="text-sm font-medium text-white">Est. New Health Factor:</span>
                    <span className="font-bold text-[#66BB6A]">{estNewHealth.toFixed(2)}</span>
                </div>

                <button 
                    onClick={executeAdd}
                    disabled={status === 'pending' || !amount}
                    className={`w-full py-4 rounded-xl font-extrabold uppercase tracking-widest transition-all ${
                        status === 'pending' ? 'bg-black text-white cursor-not-allowed border border-black' : 
                        status === 'confirmed' ? 'bg-gray-200 text-black border border-transparent' : 
                        !amount ? 'bg-black text-white/50 border border-black cursor-not-allowed' :
                        'bg-white text-black hover:bg-white shadow-[0_0_15px_rgba(232,232,232,0.15)]'
                    }`}
                >
                    {status === 'pending' ? 'Broadcasting...' : status === 'confirmed' ? 'Collateral Locked!' : 'Add Collateral'}
                </button>
            </div>
        </div>
    );
};

export default AddCollateralModal;
