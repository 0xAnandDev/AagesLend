import React, { useState, useEffect } from 'react';
import { FiX, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import Button from '../Button';
import { useWeb3 } from '../../hooks/useWeb3';

const BorrowModal = ({ isOpen, onClose, defaultAsset = 'USDC' }) => {
  const { account } = useWeb3();
  const [asset, setAsset] = useState(defaultAsset);
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  
  // Real-time capacity mock
  const [maxBorrow] = useState('14500.00');

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setTxHash('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBorrow = async () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    if (Number(amount) > Number(maxBorrow)) {
      setError("Exceeds borrowing capacity. Add more collateral.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      // Delay mirroring blockchain
      await new Promise(r => setTimeout(r, 2500));
      setTxHash("0x" + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join(''));
    } catch (err) {
      setError(err.message || "Transaction failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const apyMap = { 'ETH': '4.10%', 'USDC': '6.80%', 'DAI': '6.50%' };

  // Calculate HF shifts
  const currentHF = 2.15;
  const newHF = amount ? Math.max(1.05, currentHF - (Number(amount) / Number(maxBorrow))).toFixed(2) : currentHF;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#232d48] w-full max-w-[500px] rounded-xl shadow-2xl border border-[rgba(255,255,255,0.08)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-[rgba(255,255,255,0.08)] bg-[#1a1f3a]">
          <h2 className="text-xl font-heading font-semibold text-white tracking-wide">Borrow Assets</h2>
          <button onClick={onClose} className="text-[#888a9b] hover:text-[#ef4444] transition-colors focus:outline-none">
            <FiX size={22} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {txHash ? (
            <div className="flex flex-col items-center justify-center py-6 animate-fade-in">
              <FiCheckCircle size={64} className="text-[#10b981] mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Borrow Successful!</h3>
              <p className="text-[#888a9b] text-center mb-6 text-sm">Funds have been transferred to your wallet.</p>
              <div className="bg-[#0a0e27] w-full p-4 rounded-lg flex flex-col gap-3 mb-6 border border-[rgba(255,255,255,0.08)] shadow-inner">
                 <div className="flex justify-between text-sm">
                   <span className="text-[#888a9b]">Amount</span>
                   <span className="text-white font-mono font-medium">{amount} {asset}</span>
                 </div>
                 <div className="flex justify-between text-sm">
                   <span className="text-[#888a9b]">Tx Hash</span>
                   <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer" className="text-[#f59e0b] hover:text-white transition-colors font-mono truncate max-w-[200px]">
                     {txHash}
                   </a>
                 </div>
              </div>
              <Button fullWidth onClick={onClose} variant="primary">Close Modal</Button>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-5 p-3 bg-[#ef4444]/10 border border-[#ef4444]/50 rounded-lg flex items-center gap-2 text-[#ef4444] text-sm animate-fade-in">
                  <FiAlertCircle size={16} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-[#888a9b] mb-2 uppercase tracking-wider">Asset to Borrow</label>
                <select 
                  value={asset}
                  onChange={(e) => setAsset(e.target.value)}
                  className="input-field w-full bg-[#0a0e27] border border-[rgba(255,255,255,0.08)] text-[#f1f1f1] rounded-lg p-3.5 appearance-none"
                >
                  <option value="USDC">USD Coin (USDC)</option>
                  <option value="DAI">Dai Stablecoin (DAI)</option>
                  <option value="ETH">Ethereum (ETH)</option>
                </select>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-sm font-medium text-[#888a9b] uppercase tracking-wider">Amount</label>
                  <span className="text-[13px] text-[#888a9b]">Max: <span className="text-white font-mono">{maxBorrow} {asset}</span></span>
                </div>
                <div className="relative">
                  <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="input-field w-full bg-[#0a0e27] border border-[rgba(255,255,255,0.08)] text-white font-mono text-xl rounded-lg p-3.5 pr-20 shadow-inner"
                  />
                  <button 
                    onClick={() => setAmount(maxBorrow)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-[#232d48] rounded border border-[rgba(255,255,255,0.08)] text-xs font-bold text-[#f59e0b] hover:text-white hover:bg-[#2b3759] transition-all focus:outline-none"
                  >
                    MAX
                  </button>
                </div>
              </div>

              <div className="bg-[#0a0e27] rounded-lg p-4 border border-[rgba(255,255,255,0.08)] mb-8 shadow-inner">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[13px] text-[#888a9b] font-medium">Borrow APY</span>
                  <span className="text-sm font-mono font-bold text-[#f59e0b]">{apyMap[asset]}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[13px] text-[#888a9b] font-medium">Health Factor</span>
                  <div className="flex items-center gap-2">
                     <span className="text-sm font-mono font-medium text-white">{currentHF}</span>
                     <span className="text-[#888a9b] text-xs">→</span>
                     <span className={`text-sm font-mono font-bold ${newHF < 1.5 ? 'text-[#ef4444]' : 'text-white'}`}>{newHF}</span>
                  </div>
                </div>
              </div>

              <Button 
                variant="danger" 
                size="large" 
                fullWidth 
                onClick={handleBorrow} 
                isLoading={isSubmitting}
                disabled={!account}
                className="!bg-[#f59e0b] hover:!bg-[#d97706] shadow-[0_4px_14px_0_rgba(245,158,11,0.2)]"
              >
                {account ? `Borrow ${asset}` : 'Connect Wallet First'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BorrowModal;
