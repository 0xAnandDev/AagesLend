import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSigner } from '../../services/blockchainService';
import addresses from '../../utils/addresses.json';
import contractsAbi from '../../utils/abi/contracts.json';
import { ethers } from 'ethers';
import ActionModal from '../modals/ActionModal';
const ERC20_ABI = [
  "function decimals() external view returns (uint8)",
  "function approve(address spender, uint256 amount) external returns (bool)"
];

const ActionButton = ({ label, onClick, disabled, disabledReason }) => (
  <div className="relative group inline-block">
    <button 
      onClick={onClick}
      disabled={disabled}
      className="text-xs font-bold uppercase tracking-widest bg-[#222] hover:bg-[#333] text-[#fff] border border-[#444] px-4 py-2 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed group-hover:scale-[1.05]"
    >
      {label}
    </button>
    {disabled && disabledReason && (
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-max max-w-[150px] bg-[#111] border border-[#333] text-[#aaa] text-[10px] p-2 rounded shadow-xl z-10 pointer-events-none">
        {disabledReason}
      </div>
    )}
  </div>
);

const LoansTable = ({ positions, onRefresh }) => {
  const navigate = useNavigate();
  const [loadingAction, setLoadingAction] = useState({ id: null, action: null });
  const [feedback, setFeedback] = useState({ id: null, type: '', message: '' });

  const [modalState, setModalState] = useState({
    isOpen: false,
    position: null,
    actionName: '',
    error: ''
  });

  const showFeedback = (id, type, message) => {
    setFeedback({ id, type, message });
    setTimeout(() => setFeedback({ id: null, type: '', message: '' }), 5000);
  };

  const openModal = (position, actionName) => {
    setModalState({ isOpen: true, position, actionName, error: '' });
  };

  const closeModal = () => {
    if (loadingAction.id) return;
    setModalState({ isOpen: false, position: null, actionName: '', error: '' });
  };

  const handleConfirm = async (amountStr, useAsCollateral) => {
    const { position, actionName } = modalState;
    setLoadingAction({ id: position.tokenAddress, action: actionName });
    setFeedback({ id: null, type: '', message: '' });
    setModalState(prev => ({ ...prev, error: '' }));

    try {
      const signer = await getSigner();
      const account = await signer.getAddress();
      const coreAddress = addresses.AagesLendCore;
      const coreAbi = contractsAbi.AagesLendCore.abi;
      
      const tokenContract = new ethers.Contract(position.tokenAddress, ERC20_ABI, signer);
      const decimals = await tokenContract.decimals().catch(() => 18);
      const parsedAmount = ethers.parseUnits(amountStr, decimals);

      if (actionName === 'Deposit' || actionName === 'Repay') {
        const txApprove = await tokenContract.approve(coreAddress, parsedAmount);
        await txApprove.wait();
      }

      let tx;
      const coreContract = new ethers.Contract(coreAddress, coreAbi, signer);

      if (actionName === 'Deposit') {
        tx = await coreContract.deposit(position.tokenAddress, parsedAmount);
        
        // Save user's preference for using this token as collateral
        if (window.blockchain && window.blockchain.setTokenCollateralStatus) {
            window.blockchain.setTokenCollateralStatus(account, position.tokenAddress, useAsCollateral);
        }
      } else if (actionName === 'Borrow') {
        const colToken = position.deposited > 0 ? position.tokenAddress : positions.find(p => p.deposited > 0)?.tokenAddress;
        if (!colToken) throw new Error("No collateral found to borrow against.");
        
        const colTokenContract = new ethers.Contract(colToken, ERC20_ABI, signer);
        const colDecimals = await colTokenContract.decimals().catch(() => 18);
        const posCol = positions.find(p => p.tokenAddress === colToken);
        const colAmount = ethers.parseUnits(posCol.deposited.toString(), colDecimals);

        tx = await coreContract.borrow(colToken, colAmount, position.tokenAddress, parsedAmount);
      } else if (actionName === 'Repay') {
        tx = await coreContract.repay(position.tokenAddress, parsedAmount, account);
      } else if (actionName === 'Withdraw') {
        tx = await coreContract.withdraw(position.tokenAddress, parsedAmount);
      }

      await tx.wait();
      showFeedback(position.tokenAddress, 'success', `${actionName} successful!`);
      closeModal();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(`${actionName} Error:`, err);
      setModalState(prev => ({ ...prev, error: err.message.split('(')[0].trim() || 'Transaction failed' }));
    } finally {
      setLoadingAction({ id: null, action: null });
    }
  };

  if (positions.length === 0) {
    return (
      <div className="bg-[#111111] border border-[#333] shadow-xl rounded-2xl p-10 flex flex-col items-center justify-center text-center">
        <div className="text-[#888] text-sm tracking-wide mb-4">No active loans</div>
        <button 
          onClick={() => navigate('/lend')}
          className="bg-[#fff] hover:bg-[#ddd] text-[#000] font-bold py-2 px-6 rounded-lg transition-colors"
        >
          Start Lending
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#111111] border border-[#333] shadow-xl rounded-[12px] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b border-[#333] text-sm font-bold text-[#bbbbbb] uppercase tracking-widest bg-[#0a0a0a]">
              <th className="p-[20px] pl-[30px]">Asset</th>
              <th className="p-[20px]">Supplied</th>
              <th className="p-[20px]">Borrowed</th>
              <th className="p-[20px] pr-[30px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#222]">
            {positions.map((pos) => {
              const isLoading = loadingAction.id === pos.tokenAddress;
              const hasFeedback = feedback.id === pos.tokenAddress;

              return (
                <React.Fragment key={pos.tokenAddress}>
                  <tr className="hover:bg-[#1a1a1a] transition-colors duration-200">
                    <td className="p-[20px] pl-[30px]">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center border border-[#444] shadow-inner">
                          <span className="text-[#fff] text-sm font-bold">{pos.symbol.charAt(0)}</span>
                        </div>
                        <div>
                          <div className="font-bold text-[#ffffff] text-base">{pos.symbol}</div>
                          <div className="text-xs text-[#888]">${pos.price.toFixed(2)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-[20px]">
                      <div className="font-semibold text-[#ffffff] text-base">{pos.deposited.toFixed(4)}</div>
                      <div className="text-xs text-[#888]">${pos.depositedUSD.toFixed(2)}</div>
                    </td>
                    <td className="p-[20px]">
                      <div className="font-semibold text-[#ffffff] text-base">{pos.borrowed.toFixed(4)}</div>
                      <div className="text-xs text-[#888]">${pos.borrowedUSD.toFixed(2)}</div>
                    </td>
                    <td className="p-[20px] pr-[30px]">
                      <div className="flex justify-end gap-3">
                        <ActionButton 
                          label="Deposit" 
                          disabled={isLoading} 
                          disabledReason={isLoading ? "Processing..." : null}
                          onClick={() => openModal(pos, 'Deposit')} 
                        />
                        <ActionButton 
                          label="Borrow" 
                          disabled={isLoading} 
                          disabledReason={isLoading ? "Processing..." : null}
                          onClick={() => openModal(pos, 'Borrow')} 
                        />
                        <ActionButton 
                          label="Repay" 
                          disabled={isLoading || pos.borrowed <= 0} 
                          disabledReason={pos.borrowed <= 0 ? "No active borrow to repay" : "Processing..."}
                          onClick={() => openModal(pos, 'Repay')} 
                        />
                        <ActionButton 
                          label="Withdraw" 
                          disabled={isLoading || pos.deposited <= 0} 
                          disabledReason={pos.deposited <= 0 ? "No active deposit to withdraw" : "Processing..."}
                          onClick={() => openModal(pos, 'Withdraw')} 
                        />
                      </div>
                    </td>
                  </tr>
                  {hasFeedback && (
                    <tr>
                      <td colSpan={4} className="p-0">
                        <div className={`px-[30px] py-[10px] text-sm font-semibold text-center ${feedback.type === 'success' ? 'bg-[#0f291e] text-[#10b981]' : 'bg-[#2a0e0e] text-[#ef4444]'}`}>
                          {feedback.message}
                        </div>
                      </td>
                    </tr>
                  )}
                  {isLoading && (
                    <tr>
                      <td colSpan={4} className="p-0">
                        <div className="px-[30px] py-[10px] text-sm font-semibold text-center bg-[#1a1a1a] text-[#888] animate-pulse">
                          Processing {loadingAction.action} for {pos.symbol}... Please confirm in MetaMask.
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <ActionModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onConfirm={handleConfirm}
        title={`${modalState.actionName} Asset`}
        tokenSymbol={modalState.position?.symbol}
        actionName={modalState.actionName}
        error={modalState.error}
        loading={!!loadingAction.id}
        showCollateralToggle={modalState.actionName === 'Deposit'}
      />
    </div>
  );
};

export default LoansTable;
