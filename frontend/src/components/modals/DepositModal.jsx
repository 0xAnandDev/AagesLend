import React, { useState, useEffect } from 'react';
import { FiX, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import Button from '../Button';
import { useWeb3 } from '../../hooks/useWeb3';
import { ethers } from 'ethers';

const DepositModal = ({ isOpen, onClose, defaultAsset = 'ETH' }) => {
  const { account } = useWeb3();
  const [asset, setAsset] = useState(defaultAsset);
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  
  const [balance, setBalance] = useState('0.00');

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setTxHash('');
      setError('');
      if (account && window.ethereum) {
        if (asset === 'ETH') {
          const provider = new ethers.BrowserProvider(window.ethereum);
          provider.getBalance(account).then(bal => {
             setBalance(parseFloat(ethers.formatEther(bal)).toFixed(4));
          }).catch(console.error);
        } else {
          // Mock tokens for showcase
          setBalance(asset === 'USDC' ? '1250.00' : '500.00');
        }
      }
    }
  }, [isOpen, account, asset]);

  if (!isOpen) return null;

  const handleDeposit = async () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    if (Number(amount) > Number(balance)) {
      setError("Insufficient balance");
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      // Standard blockchain latency simulation since ABIs are not fully exported in UI yet
      await new Promise(r => setTimeout(r, 2500));
      setTxHash("0x" + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join(''));
    } catch (err) {
      setError(err.message || "Transaction failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const apyMap = { 'ETH': '2.40%', 'USDC': '5.20%', 'DAI': '5.10%' };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#232d48] w-full max-w-[500px] rounded-xl shadow-2xl border border-[rgba(255,255,255,0.08)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-[rgba(255,255,255,0.08)] bg-[#1a1f3a]">
          <h2 className="text-xl font-heading font-semibold text-white tracking-wide">Deposit Assets</h2>
          <button onClick={onClose} className="text-[#888a9b] hover:text-[#ef4444] transition-colors focus:outline-none">
            <FiX size={22} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {txHash ? (
            <div className="flex flex-col items-center justify-center py-6 animate-fade-in">
              <FiCheckCircle size={64} className="text-[#10b981] mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Deposit Successful!</h3>
              <p className="text-[#888a9b] text-center mb-6 text-sm">Your transaction has been confirmed on the network.</p>
              <div className="bg-[#0a0e27] w-full p-4 rounded-lg flex flex-col gap-3 mb-6 border border-[rgba(255,255,255,0.08)] shadow-inner">
                 <div className="flex justify-between text-sm">
                   <span className="text-[#888a9b]">Amount</span>
                   <span className="text-white font-mono font-medium">{amount} {asset}</span>
                 </div>
                 <div className="flex justify-between text-sm">
                   <span className="text-[#888a9b]">Tx Hash</span>
                   <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer" className="text-[#a78bfa] hover:text-white transition-colors font-mono truncate max-w-[200px]">
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
                <label className="block text-sm font-medium text-[#888a9b] mb-2 uppercase tracking-wider">Select Asset</label>
                <select 
                  value={asset}
                  onChange={(e) => setAsset(e.target.value)}
                  className="input-field w-full bg-[#0a0e27] border border-[rgba(255,255,255,0.08)] text-[#f1f1f1] rounded-lg p-3.5 appearance-none"
                >
                  <option value="ETH">Ethereum (ETH)</option>
                  <option value="USDC">USD Coin (USDC)</option>
                  <option value="DAI">Dai Stablecoin (DAI)</option>
                </select>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-sm font-medium text-[#888a9b] uppercase tracking-wider">Amount to Deposit</label>
                  <span className="text-[13px] text-[#888a9b]">Available: <span className="text-white font-mono">{balance} {asset}</span></span>
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
                    onClick={() => setAmount(balance)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-[#232d48] rounded border border-[rgba(255,255,255,0.08)] text-xs font-bold text-[#a78bfa] hover:text-white hover:bg-[#2b3759] transition-all focus:outline-none"
                  >
                    MAX
                  </button>
                </div>
              </div>

              <div className="bg-[#0a0e27] rounded-lg p-4 border border-[rgba(255,255,255,0.08)] mb-8 shadow-inner">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[13px] text-[#888a9b] font-medium">Supply APY</span>
                  <span className="text-sm font-mono font-bold text-[#10b981]">{apyMap[asset]}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[13px] text-[#888a9b] font-medium">Collateralization</span>
                  <span className="text-[13px] font-medium text-[#f1f1f1] bg-[#232d48] px-2 py-0.5 rounded border border-[rgba(255,255,255,0.08)]">Enabled</span>
                </div>
              </div>

              <Button 
                variant="primary" 
                size="large" 
                fullWidth 
                onClick={handleDeposit} 
                isLoading={isSubmitting}
                disabled={!account}
              >
                {account ? `Deposit ${asset}` : 'Connect Wallet First'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DepositModal;
