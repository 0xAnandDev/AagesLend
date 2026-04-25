import React, { useState } from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import AccountMetrics from '../components/AccountMetrics';
import MarketOverview from '../components/MarketOverview';
import HealthFactorAlert from '../components/Alerts/HealthFactorAlert';
import { usePriceData } from '../hooks/usePriceData';
import { useWeb3 } from '../hooks/useWeb3';
import { useUserPositions } from '../hooks/useUserPositions';

const Dashboard = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { refreshPrices } = usePriceData();
  const { account, isConnected, chainId, switchNetwork } = useWeb3();
  const { totals, loading: metricsLoading } = useUserPositions();

  const totalSupplied = totals?.totalCollateralUSD || 0;
  const totalBorrowed = totals?.totalBorrowUSD || 0;
  const netBalance = totalSupplied - totalBorrowed;
  const healthFactor = totalBorrowed > 0 ? (totalSupplied * 0.8) / totalBorrowed : null;

  const isSepolia = chainId === 11155111n || chainId === 11155111;
  const isWrongNetwork = isConnected && !isSepolia;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshPrices();
    // In a real app we might also refresh user positions here
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-primary pb-10">
      <div className="max-w-[1600px] mx-auto px-6 mt-6 space-y-6">
          
          {/* Network Alert */}
          {isWrongNetwork && (
            <div className="bg-[#ef4444]/10 border border-error rounded-md p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="text-error font-semibold text-sm">Wrong Network Detected</span>
                <span className="text-sm text-secondary mt-1">Please switch to the Sepolia Testnet to use the application.</span>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={switchNetwork} className="bg-[#1a1a1a] border border-subtle text-white text-sm font-medium px-4 py-2 rounded hover:bg-[#121212] hover-effect">
                  Switch to Sepolia
                </button>
              </div>
            </div>
          )}

          <HealthFactorAlert healthFactor={healthFactor} />
          
          <div className="flex justify-between items-center pt-2">
            <h2 className="text-lg font-heading font-semibold text-white">Your Account</h2>
            <button onClick={handleRefresh} className={`text-secondary hover:text-primary transition-colors ${isRefreshing ? 'animate-spin' : ''}`}>
              <FiRefreshCw size={16}/>
            </button>
          </div>
          
          {isConnected ? (
             <AccountMetrics 
               netBalance={netBalance}
               totalSupplied={totalSupplied}
               totalBorrowed={totalBorrowed}
               healthFactor={healthFactor} 
               loading={metricsLoading}
             />
          ) : (
             <div className="h-32 w-full border border-subtle border-dashed rounded-md flex items-center justify-center text-secondary bg-[#121212]">
                Please connect your wallet to view positions.
             </div>
          )}

          <MarketOverview />
      </div>

    </div>
  );
};

export default Dashboard;
