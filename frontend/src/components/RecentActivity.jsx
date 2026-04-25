import React, { useState } from 'react';
import { useTransactionHistory } from '../hooks/useTransactionHistory';
import { 
  FiArrowDownCircle, 
  FiArrowUpRight, 
  FiRefreshCcw, 
  FiAlertTriangle, 
  FiArrowUpCircle,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiExternalLink,
  FiActivity
} from 'react-icons/fi';

const RecentActivity = () => {
  const { transactions } = useTransactionHistory();
  const [filter, setFilter] = useState('All');
  const [displayCount, setDisplayCount] = useState(5);

  const filters = ['All', 'Deposit', 'Borrow', 'Repay', 'Liquidate'];

  const filteredTxs = transactions.filter(tx => {
    if (filter === 'All') return true;
    return tx.type.toLowerCase() === filter.toLowerCase();
  });

  const visibleTxs = filteredTxs.slice(0, displayCount);

  const getRelativeTime = (timestamp) => {
    if (!timestamp) return '';
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    if (seconds < 30) return "just now";
    return Math.floor(seconds) + " seconds ago";
  };

  const getTypeStyles = (type) => {
    switch(type?.toLowerCase()) {
      case 'deposit': return { icon: <FiArrowDownCircle />, color: 'text-success', bg: 'bg-[#10b981]/10' };
      case 'borrow': return { icon: <FiArrowUpRight />, color: 'text-[#f59e0b]', bg: 'bg-[#f59e0b]/10' };
      case 'repay': return { icon: <FiRefreshCcw />, color: 'text-accent', bg: 'bg-[#a78bfa]/10' };
      case 'liquidate': return { icon: <FiAlertTriangle />, color: 'text-error', bg: 'bg-[#ef4444]/10' };
      case 'withdraw': return { icon: <FiArrowUpCircle />, color: 'text-[#3b82f6]', bg: 'bg-[#3b82f6]/10' };
      default: return { icon: <FiArrowDownCircle />, color: 'text-primary', bg: 'bg-[#f1f1f1]/10' };
    }
  };

  const getStatusDisplay = (status) => {
    const s = status?.toLowerCase() || 'pending';
    if (s.includes('success') || s.includes('confirmed')) {
      return <div className="flex items-center gap-1.5 text-success"><FiCheckCircle size={14} /><span>Success</span></div>;
    }
    if (s.includes('fail') || s.includes('error')) {
      return <div className="flex items-center gap-1.5 text-error"><FiXCircle size={14} /><span>Failed</span></div>;
    }
    return <div className="flex items-center gap-1.5 text-[#f59e0b]"><FiClock size={14} className="animate-pulse" /><span>Pending</span></div>;
  };

  return (
    <div className="card-bg flex flex-col w-full shadow-sm">
      <div className="p-5 border-b border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-lg font-heading font-semibold text-white">Recent Activity</h2>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => { setFilter(f); setDisplayCount(5); }}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors whitespace-nowrap focus:outline-none ${
                filter === f 
                  ? 'bg-[#1a1f3a] text-primary border border-subtle shadow-inner' 
                  : 'text-secondary hover:text-primary hover:bg-[#1a1f3a]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col">
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-5 gap-4 px-6 py-3 border-b border-subtle text-xs font-semibold text-secondary uppercase tracking-wider">
          <div>Action</div>
          <div>Asset Amount</div>
          <div>Rate</div>
          <div>Time</div>
          <div>Status</div>
        </div>

        {/* Empty State */}
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 rounded-full bg-[#1a1f3a] flex items-center justify-center mb-4 border border-subtle shadow-inner">
              <FiActivity size={24} className="text-secondary" />
            </div>
            <p className="text-primary font-medium mb-1">No transactions yet</p>
            <p className="text-secondary text-sm text-center max-w-sm">
              Your recent deposits, borrows, and repayments will appear here.
            </p>
          </div>
        ) : filteredTxs.length === 0 ? (
           <div className="py-12 text-center text-secondary text-sm">
             No {filter.toLowerCase()} transactions found.
           </div>
        ) : (
          <div className="flex flex-col">
            {visibleTxs.map((tx, i) => {
              const typeStyle = getTypeStyles(tx.type);
              
              return (
                <div 
                  key={tx.id || i} 
                  className="grid grid-cols-2 md:grid-cols-5 gap-4 px-6 py-4 border-b border-subtle last:border-b-0 hover:bg-[#1a1f3a] transition-colors items-center cursor-pointer group"
                  onClick={() => tx.hash && window.open(`https://sepolia.etherscan.io/tx/${tx.hash}`, '_blank')}
                >
                  {/* Action */}
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${typeStyle.bg} ${typeStyle.color}`}>
                      {typeStyle.icon}
                    </div>
                    <span className="font-medium text-primary text-[15px]">{tx.type}</span>
                  </div>

                  {/* Asset */}
                  <div className="flex flex-col">
                    <span className="text-sm md:hidden text-secondary text-xs mb-1">Asset</span>
                    <span className="font-mono text-primary font-medium text-[15px]">
                      {tx.amount || '0'} <span className="text-secondary text-sm ml-1">{tx.token || 'ETH'}</span>
                    </span>
                  </div>

                  {/* Rate */}
                  <div className="hidden md:flex flex-col">
                    <span className="text-[15px] text-primary">Variable</span>
                  </div>

                  {/* Time */}
                  <div className="flex flex-col">
                    <span className="text-sm md:hidden text-secondary text-xs mb-1">Time</span>
                    <span className="text-sm text-secondary">{getRelativeTime(tx.timestamp)}</span>
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm md:hidden text-secondary text-xs mb-1">Status</span>
                      <span className="text-sm">{getStatusDisplay(tx.status)}</span>
                    </div>
                    {tx.hash && (
                      <FiExternalLink size={14} className="text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Load More */}
      {filteredTxs.length > displayCount && (
        <div className="p-4 border-t border-subtle flex justify-center bg-[#1a1f3a]/30">
          <button 
            onClick={() => setDisplayCount(prev => prev + 5)}
            className="text-sm font-medium text-accent hover:text-[#c4b5fd] transition-colors focus:outline-none"
          >
            Load more activity
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentActivity;
