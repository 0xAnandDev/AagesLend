import React, { useState, useEffect } from 'react';
import { getSigner } from '../../services/blockchainService';
import addresses from '../../utils/addresses.json';
import contractsAbi from '../../utils/abi/contracts.json';
import { ethers } from 'ethers';

const ERC20_ABI = [
  "function decimals() external view returns (uint8)",
  "function approve(address spender, uint256 amount) external returns (bool)"
];

const RepayModal = ({ isOpen, onClose, positions, onRefresh }) => {
  const [selectedToken, setSelectedToken] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState({ loading: false, error: '', success: '' });
  const [confirmState, setConfirmState] = useState(false);
  const [isFullRepay, setIsFullRepay] = useState(false);

  const borrowedPositions = positions.filter(p => p.borrowed > 0);

  useEffect(() => {
    if (isOpen && borrowedPositions.length > 0 && !selectedToken) {
      setSelectedToken(borrowedPositions[0].tokenAddress);
    }
    if (!isOpen) {
      setConfirmState(false);
      setAmount('');
      setStatus({ loading: false, error: '', success: '' });
    }
  }, [isOpen, borrowedPositions, selectedToken]);

  if (!isOpen) return null;

  const currentPosition = borrowedPositions.find(p => p.tokenAddress === selectedToken) || borrowedPositions[0];

  const handlePct = (pct) => {
    if (currentPosition) {
      setAmount(((currentPosition.borrowed * pct) / 100).toString());
    }
  };

  const handleMax = () => {
    if (currentPosition) {
      setAmount(currentPosition.borrowed.toString());
    }
  };

  const initiateRepay = (isFull) => {
    const repayAmount = isFull ? currentPosition.borrowed.toString() : amount;
    if (!repayAmount || isNaN(Number(repayAmount)) || Number(repayAmount) <= 0) {
      setStatus({ loading: false, error: 'Please enter a valid amount greater than 0', success: '' });
      return;
    }
    if (Number(repayAmount) > currentPosition.borrowed) {
      setStatus({ loading: false, error: 'Cannot repay more than borrowed amount', success: '' });
      return;
    }
    setStatus({ loading: false, error: '', success: '' });
    setIsFullRepay(isFull);
    setConfirmState(true);
  };

  const executeRepay = async () => {
    const repayAmount = isFullRepay ? currentPosition.borrowed.toString() : amount;
    setStatus({ loading: true, error: '', success: 'Processing repayment...' });

    try {
      const signer = await getSigner();
      const account = await signer.getAddress();
      const coreAddress = addresses.AagesLendCore;
      const coreAbi = contractsAbi.AagesLendCore.abi;
      
      const tokenContract = new ethers.Contract(currentPosition.tokenAddress, ERC20_ABI, signer);
      const decimals = await tokenContract.decimals().catch(() => 18);
      
      const parsedAmount = ethers.parseUnits(repayAmount, decimals);

      // Approve
      const txApprove = await tokenContract.approve(coreAddress, parsedAmount);
      await txApprove.wait();

      // Repay
      const coreContract = new ethers.Contract(coreAddress, coreAbi, signer);
      const txRepay = await coreContract.repay(currentPosition.tokenAddress, parsedAmount, account);
      await txRepay.wait();

      setStatus({ loading: false, error: '', success: 'Repayment successful!' });
      setAmount('');
      if (onRefresh) onRefresh();
      
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err) {
      console.error('Repay Error:', err);
      setStatus({ loading: false, error: err.message.split('(')[0].trim() || 'Transaction failed', success: '' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000]/60 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-[#1a1a1a] border border-[#333333] rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button 
          onClick={onClose}
          disabled={status.loading}
          className="absolute top-4 right-4 text-[#888888] hover:text-[#ffffff] transition-colors disabled:opacity-50"
        >
          ✕
        </button>
        
        <h2 className="text-2xl font-bold text-[#ffffff] mb-6">{confirmState ? 'Confirm Repayment' : 'Repay Loan'}</h2>
        
        {borrowedPositions.length === 0 ? (
          <div className="text-[#888888] text-center">No active borrows available to repay.</div>
        ) : confirmState ? (
          <div className="flex flex-col gap-4 animate-fade-in">
            <p className="text-[#aaaaaa] text-sm">
              You are about to repay <strong className="text-[#fff]">{isFullRepay ? currentPosition.borrowed.toFixed(4) : Number(amount).toFixed(4)} {currentPosition.symbol}</strong>.
            </p>
            <div className="bg-[#111] border border-[#333] p-4 rounded-lg">
              <div className="text-xs text-[#888] uppercase tracking-wider mb-1">Transaction Flow</div>
              <div className="text-sm text-[#ccc] flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#222] border border-[#444] flex items-center justify-center text-[10px]">1</div>
                  Approve contract to spend your tokens
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#222] border border-[#444] flex items-center justify-center text-[10px]">2</div>
                  Execute repayment transaction
                </div>
              </div>
            </div>
            
            {status.error && <div className="text-[#ef4444] text-sm font-medium">{status.error}</div>}
            {status.success && <div className="text-[#10b981] text-sm font-medium">{status.success}</div>}
            
            <div className="flex gap-3 mt-2">
              <button 
                onClick={() => setConfirmState(false)}
                disabled={status.loading}
                className="flex-1 bg-[#333] hover:bg-[#444] text-[#ffffff] font-bold py-3 px-4 rounded-lg transition-all disabled:opacity-50"
              >
                Back
              </button>
              <button 
                onClick={executeRepay}
                disabled={status.loading}
                className="flex-1 bg-[#ffffff] hover:bg-[#dddddd] text-[#000000] font-bold py-3 px-4 rounded-lg transition-all disabled:opacity-50 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]"
              >
                {status.loading ? 'Processing...' : 'Confirm & Repay'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {borrowedPositions.length > 1 && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#888888]">Select Asset</label>
                <select 
                  className="bg-[#111111] border border-[#333333] rounded-lg p-3 text-[#ffffff] outline-none focus:border-[#555555] transition-colors"
                  value={selectedToken}
                  onChange={(e) => {
                    setSelectedToken(e.target.value);
                    setAmount('');
                    setStatus({ loading: false, error: '', success: '' });
                  }}
                  disabled={status.loading}
                >
                  {borrowedPositions.map(p => (
                    <option key={p.tokenAddress} value={p.tokenAddress}>{p.symbol}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="bg-[#111111] border border-[#333333] rounded-lg p-4 flex justify-between items-center">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-[#888888] mb-1">Borrowed Amount</div>
                <div className="text-lg font-bold text-[#ffffff]">{currentPosition.borrowed.toFixed(4)} {currentPosition.symbol}</div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#888888]">Repay Amount</label>
              <div className="relative">
                <input 
                  type="number"
                  min="0"
                  step="0.0001"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={status.loading}
                  placeholder="0.00"
                  className="w-full bg-[#111111] border border-[#333333] rounded-lg p-3 text-[#ffffff] pr-20 outline-none focus:border-[#555555] transition-colors"
                />
                <button 
                  onClick={handleMax}
                  disabled={status.loading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#333333] hover:bg-[#444444] text-[#ffffff] text-xs font-bold px-3 py-1.5 rounded transition-colors disabled:opacity-50"
                >
                  MAX
                </button>
              </div>
              <div className="flex gap-2 mt-1">
                <button onClick={() => handlePct(25)} disabled={status.loading} className="flex-1 bg-[#222] hover:bg-[#333] border border-[#444] text-[#aaa] hover:text-[#fff] text-[10px] font-bold py-1.5 rounded transition-colors">25%</button>
                <button onClick={() => handlePct(50)} disabled={status.loading} className="flex-1 bg-[#222] hover:bg-[#333] border border-[#444] text-[#aaa] hover:text-[#fff] text-[10px] font-bold py-1.5 rounded transition-colors">50%</button>
                <button onClick={() => handlePct(100)} disabled={status.loading} className="flex-1 bg-[#222] hover:bg-[#333] border border-[#444] text-[#aaa] hover:text-[#fff] text-[10px] font-bold py-1.5 rounded transition-colors">100%</button>
              </div>
            </div>

            {status.error && <div className="text-[#ef4444] text-sm font-medium">{status.error}</div>}

            <div className="flex gap-3 mt-2">
              <button 
                onClick={() => initiateRepay(false)}
                disabled={status.loading || !amount || Number(amount) <= 0}
                className="flex-1 bg-[#cccccc] hover:bg-[#dddddd] text-[#000000] font-bold py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_10px_rgba(255,255,255,0.05)]"
              >
                Repay Partial
              </button>
              <button 
                onClick={() => initiateRepay(true)}
                disabled={status.loading}
                className="flex-1 bg-[#ffffff] hover:bg-[#dddddd] text-[#000000] font-bold py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]"
              >
                Repay Full
              </button>
            </div>
            
            <button 
              onClick={onClose}
              disabled={status.loading}
              className="w-full text-[#888888] hover:text-[#ffffff] text-sm font-bold py-2 transition-colors disabled:opacity-50 mt-2"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RepayModal;
