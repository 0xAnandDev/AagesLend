import React, { useState, useEffect } from 'react';

const ActionModal = ({ isOpen, onClose, onConfirm, title, tokenSymbol, actionName, error, loading, showCollateralToggle }) => {
  const [amount, setAmount] = useState('');
  const [useAsCollateral, setUseAsCollateral] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setUseAsCollateral(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;
    onConfirm(amount, useAsCollateral);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" 
      onClick={!loading ? onClose : undefined}
      style={{ animation: 'modalBackdropFade 0.2s ease-out forwards' }}
    >
      <style>
        {`
          @keyframes modalFadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes modalBackdropFade {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .modal-content-animation {
            animation: modalFadeIn 0.2s ease-out forwards;
          }
        `}
      </style>
      <div 
        className="bg-[#111111] border border-[#333] rounded-xl shadow-2xl p-6 w-full max-w-md m-4 relative modal-content-animation"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button 
            onClick={onClose}
            disabled={loading}
            className="text-[#888] hover:text-white transition-colors disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-[#888] mb-2">
            Amount ({tokenSymbol})
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="0.00"
              disabled={loading}
              className="w-full bg-[#1a1a1a] border border-[#333] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#555] transition-colors disabled:opacity-50"
              autoFocus
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-[#2a0e0e] border border-[#ef4444]/20 rounded-lg text-[#ef4444] text-sm">
            {error}
          </div>
        )}

        {showCollateralToggle && (
          <div 
             className="mb-6 bg-[#1a1a1a] border border-[#333] p-4 rounded-lg flex items-center justify-between cursor-pointer hover:border-[#555] transition-colors" 
             onClick={() => !loading && setUseAsCollateral(!useAsCollateral)}
          >
            <div className="pr-4">
               <div className="text-white font-bold text-sm">Add to Collateral</div>
               <div className="text-[#888] text-[11px] mt-1 leading-snug">Enable to increase your borrowing power and Health Factor. Disable for normal balance.</div>
            </div>
            <div className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${useAsCollateral ? 'bg-[#10b981]' : 'bg-[#333]'}`}>
               <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${useAsCollateral ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </div>
          </div>
        )}

        <div className="flex gap-4 mt-8">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 px-4 rounded-lg font-bold text-[#888] bg-[#1a1a1a] hover:bg-[#222] border border-[#333] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !amount || Number(amount) <= 0}
            className="flex-1 py-3 px-4 rounded-lg font-bold text-black bg-white hover:bg-gray-200 transition-colors disabled:opacity-50 flex justify-center items-center"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            ) : (
              `Confirm ${actionName}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActionModal;
