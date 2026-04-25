import React, { useState, useEffect, useMemo } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import { 
  borrowAsset, 
  getUserBorrowedAmount, 
  getUserHealthFactor, 
  getMaxBorrowAmount 
} from '../services/blockchainService';
import { LineChart, Line, ResponsiveContainer, XAxis, Tooltip } from 'recharts';
import './BorrowModal.css';

const getTokenFullName = (symbol) => {
    const names = {
        'WETH': 'Wrapped Ether',
        'USDT': 'Tether USD',
        'ETH': 'Ethereum',
        'WBTC': 'Wrapped BTC',
        'USDC': 'USD Coin',
        'DAI': 'Dai Stablecoin'
    };
    return names[symbol] || `${symbol} Token`;
};

const BorrowModal = ({ asset, onClose, collateral }) => {
  const { account } = useWeb3();
  const [borrowAmount, setBorrowAmount] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState('');
  
  // Real user data
  const [alreadyBorrowed, setAlreadyBorrowed] = useState(0);
  const [maxBorrow, setMaxBorrow] = useState(0);
  const [healthFactor, setHealthFactor] = useState(0);

  useEffect(() => {
    if (!account) return;
    
    const fetchUserData = async () => {
      try {
        const borrowed = await getUserBorrowedAmount(account, asset.address);
        const max = await getMaxBorrowAmount(account, asset.price);
        const hf = await getUserHealthFactor(account);
        
        setAlreadyBorrowed(borrowed);
        setMaxBorrow(max);
        setHealthFactor(hf);
      } catch (err) {
        console.error("Failed to fetch user borrow data", err);
      }
    };
    
    fetchUserData();
  }, [account, asset]);

  // Handle max click
  const handleMaxClick = () => {
    setBorrowAmount(maxBorrow.toFixed(4));
  };

  // Calculations for preview
  const numBorrowAmount = Number(borrowAmount) || 0;
  const borrowValueUsd = numBorrowAmount * asset.price;
  const isOverMax = numBorrowAmount > maxBorrow;
  const isOverPool = numBorrowAmount > asset.availableLiquidity;
  const isValid = numBorrowAmount > 0 && !isOverMax && !isOverPool;

  const estimatedMonthlyInterest = numBorrowAmount * (asset.borrowApy / 100 / 12);
  
  // Calculate predicted health factor: (collateral * 0.8) / (already_borrowed_usd + new_borrow_usd)
  let predictedHF = healthFactor;
  if (borrowValueUsd > 0) {
     const currentTotalBorrowedUsd = collateral * 0.8 / healthFactor; 
     // if healthFactor was 999, it means no borrows
     const actualCurrentBorrowedUsd = healthFactor >= 999 ? 0 : currentTotalBorrowedUsd;
     const newTotalBorrowedUsd = actualCurrentBorrowedUsd + borrowValueUsd;
     predictedHF = (collateral * 0.8) / newTotalBorrowedUsd;
  }

  // Action execution
  const executeBorrow = async () => {
    if (!isValid || !account) return;
    
    setStatus('loading');
    setErrorMessage('');
    
    const result = await borrowAsset(asset.address, borrowAmount.toString());
    
    if (result.success) {
      setStatus('success');
      setTimeout(() => {
        onClose();
      }, 2000);
    } else {
      setStatus('error');
      setErrorMessage(`Borrow failed: ${result.reason}`);
    }
  };

  // Mock chart data (simple deposits vs borrows historical trend)
  const chartData = useMemo(() => {
      const data = [];
      let dep = asset.totalDeposits * 0.8;
      let bor = asset.totalBorrows * 0.7;
      for (let i = 0; i < 7; i++) {
          dep += dep * (Math.random() * 0.1 - 0.03);
          bor += bor * (Math.random() * 0.1 - 0.03);
          data.push({ day: `D${i+1}`, deposits: dep, borrows: bor });
      }
      return data;
  }, [asset]);

  return (
    <div className="borrow-modal-overlay">
      <div className="borrow-modal-card">
        
        <div className="borrow-modal-header">
          <div className="borrow-modal-title">
            <div className="borrow-asset-icon">
              <span>{asset.symbol.charAt(0)}</span>
            </div>
            <h3>Borrow {asset.symbol}</h3>
          </div>
          <button className="borrow-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="borrow-modal-body">
          
          {/* Left Column: Info */}
          <div className="borrow-modal-left">
            <div className="borrow-info-section">
              <h4>Pool Information</h4>
              <div className="borrow-info-row">
                <span>Total Deposits</span>
                <span className="value-white">{asset.totalDeposits.toFixed(2)} {asset.symbol}</span>
              </div>
              <div className="borrow-info-row">
                <span>Total Borrows</span>
                <span className="value-white">{asset.totalBorrows.toFixed(2)} {asset.symbol}</span>
              </div>
              <div className="borrow-info-row">
                <span>Available Liquidity</span>
                <span className="value-white">{asset.availableLiquidity.toFixed(2)} {asset.symbol}</span>
              </div>
              <div className="borrow-info-row">
                <span>Borrow APY</span>
                <span className="value-orange">{asset.borrowApy.toFixed(2)}%</span>
              </div>
            </div>

            <div className="borrow-info-section">
              <h4>Your Account</h4>
              <div className="borrow-info-row">
                <span>Your Collateral (USD)</span>
                <span className="value-white">${collateral.toFixed(2)}</span>
              </div>
              <div className="borrow-info-row">
                <span>Max You Can Borrow</span>
                <span className="value-white">{maxBorrow.toFixed(4)} {asset.symbol}</span>
              </div>
              <div className="borrow-info-row">
                <span>Already Borrowed</span>
                <span className="value-white">{alreadyBorrowed.toFixed(4)} {asset.symbol}</span>
              </div>
              <div className="borrow-info-row">
                <span>Health Factor</span>
                <span className={healthFactor < 1.5 ? 'value-red' : 'value-green'}>
                  {healthFactor > 100 ? 'Safe' : `${healthFactor.toFixed(2)}x`}
                </span>
              </div>
            </div>

            <div className="borrow-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="day" hide />
                  <Line type="monotone" dataKey="deposits" stroke="#fff" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="borrows" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right Column: Input & Action */}
          <div className="borrow-modal-right">
            
            {status === 'success' ? (
               <div className="borrow-success-box">
                  <div className="success-icon">✓</div>
                  <h4>Success!</h4>
                  <p>You borrowed {borrowAmount} {asset.symbol}</p>
               </div>
            ) : (
              <>
                <div className="borrow-input-section">
                  <label>Amount to Borrow</label>
                  <div className="borrow-input-wrapper">
                    <input 
                      type="number" 
                      placeholder="0.00" 
                      value={borrowAmount}
                      onChange={(e) => setBorrowAmount(e.target.value)}
                    />
                    <span className="borrow-input-symbol">{asset.symbol}</span>
                  </div>
                  <div className="borrow-input-footer">
                    <span className="borrow-max-text" onClick={handleMaxClick}>
                      Max available: {maxBorrow.toFixed(4)} {asset.symbol}
                    </span>
                  </div>
                  
                  {isOverMax && (
                    <div className="borrow-error-text">You can only borrow up to {maxBorrow.toFixed(4)} {asset.symbol}</div>
                  )}
                  {isOverPool && !isOverMax && (
                    <div className="borrow-error-text">Pool only has {asset.availableLiquidity.toFixed(2)} {asset.symbol} available</div>
                  )}
                </div>

                <div className="borrow-preview-section">
                  <div className="borrow-preview-row">
                    <span>Amount to borrow</span>
                    <span>{numBorrowAmount.toFixed(4)} {asset.symbol}</span>
                  </div>
                  <div className="borrow-preview-row">
                    <span>Interest rate (APY)</span>
                    <span className="value-orange">{asset.borrowApy.toFixed(2)}%</span>
                  </div>
                  <div className="borrow-preview-row">
                    <span>Est. monthly interest</span>
                    <span>{estimatedMonthlyInterest.toFixed(4)} {asset.symbol}</span>
                  </div>
                  <div className="borrow-preview-row">
                    <span>Health factor after borrow</span>
                    <span className={predictedHF < 1.5 ? 'value-red' : 'value-white'}>
                       {predictedHF > 100 ? 'Safe' : `${predictedHF.toFixed(2)}x`}
                    </span>
                  </div>
                  
                  {predictedHF < 1.5 && predictedHF > 0 && numBorrowAmount > 0 && (
                    <div className="borrow-warning-box">
                      Warning: Your health factor will be low. You're at risk of liquidation.
                    </div>
                  )}
                </div>

                {status === 'error' && (
                  <div className="borrow-status-error">{errorMessage}</div>
                )}

                <div className="borrow-action-buttons">
                  <button className="borrow-btn-cancel" onClick={onClose}>Cancel</button>
                  <button 
                    className={`borrow-btn-submit ${(!isValid || status === 'loading') ? 'disabled' : ''}`}
                    onClick={executeBorrow}
                    disabled={!isValid || status === 'loading'}
                  >
                    {status === 'loading' ? 'Processing...' : `Borrow ${asset.symbol}`}
                  </button>
                </div>
              </>
            )}

          </div>

        </div>
      </div>
    </div>
  );
};

export default BorrowModal;
