import React, { useEffect, useState, useMemo } from 'react';
import { useInsightsData } from '../hooks/useInsightsData';
import { useWeb3 } from '../hooks/useWeb3';
import priceService from '../services/priceService';
import { SkeletonLoader } from '../components/Skeleton';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

const formatUsd = (val) => {
  if (typeof val !== 'number' || isNaN(val)) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(val);
};

const formatToken = (val) => {
  if (typeof val !== 'number' || isNaN(val)) return '-';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4
  }).format(val);
};

// Custom tooltip for BarChart
const CustomBarTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1a1a] border border-[#333] p-3 rounded shadow-lg text-white">
        <p className="font-semibold mb-2">{label}</p>
        <p className="text-sm text-gray-300">
          Deposits: <span className="text-white font-mono">{formatUsd(payload[0].value)}</span>
        </p>
        <p className="text-sm text-gray-300">
          Borrows: <span className="text-white font-mono">{formatUsd(payload[1].value)}</span>
        </p>
      </div>
    );
  }
  return null;
};

// Custom tooltip for LineChart
const CustomLineTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1a1a] border border-[#333] p-3 rounded shadow-lg text-white">
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        <p className="text-sm">
          Price: <span className="font-mono text-white">{formatUsd(payload[0].value)}</span>
        </p>
      </div>
    );
  }
  return null;
};

const Insights = () => {
  const { account } = useWeb3();
  const { assets, protocol, loading, error, refetch, lastUpdated } = useInsightsData();
  const [timeAgo, setTimeAgo] = useState(0);
  const [priceHistory, setPriceHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Update "X sec ago" timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeAgo(Math.floor((Date.now() - lastUpdated) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  // Fetch line chart data (ETH 30 days)
  useEffect(() => {
    let mounted = true;
    const loadHistory = async () => {
      setHistoryLoading(true);
      try {
        const history = await priceService.getPriceHistory('ethereum', 30);
        if (mounted && history.length > 0) {
          // Downsample or take daily snaps to avoid overwhelming chart
          const formatted = history.map(point => {
            const date = new Date(point[0]);
            return {
              time: `${date.getMonth() + 1}/${date.getDate()}`,
              price: point[1]
            };
          }).filter((_, i) => i % 24 === 0); // Roughly daily if data is hourly

          setPriceHistory(formatted);
        }
      } catch (err) {
        console.warn("Failed to load price history for chart");
      } finally {
        if (mounted) setHistoryLoading(false);
      }
    };
    loadHistory();
    return () => { mounted = false; };
  }, []);

  const barChartData = useMemo(() => {
    return assets.map(a => ({
      name: a.symbol,
      Deposits: a.totalDepositsUSD,
      Borrows: a.totalBorrowsUSD
    }));
  }, [assets]);

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-8 max-w-md w-full">
          <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h2 className="text-xl font-bold text-white mb-2">Connect Wallet</h2>
          <p className="text-gray-400">Please connect your wallet to view real-time protocol insights and market analytics.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-8 max-w-md w-full">
          <div className="text-red-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Failed to load data</h2>
          <p className="text-sm text-gray-400 mb-6">{error}</p>
          <button 
            onClick={refetch}
            className="px-6 py-2 bg-white text-black font-semibold rounded hover:bg-gray-200 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const getUtilColor = (val) => {
    if (val < 60) return 'text-green-400';
    if (val < 80) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="animate-fade-in pb-12 max-w-7xl mx-auto">
      {/* SECTION 1: HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 tracking-wide text-white">Protocol Insights</h1>
          <p className="text-gray-400 font-medium">Real-time analytics of AagesLend markets and liquidity.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            Last updated {timeAgo} sec ago
          </div>
          <button 
            onClick={refetch}
            disabled={loading}
            className="px-4 py-2 border border-[#333] bg-[#1a1a1a] hover:bg-[#252525] text-white rounded text-sm transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* SECTION 2: METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard 
          title="Total Value Locked" 
          value={formatUsd(protocol.tvl)}
          subtext="Total deposited liquidity"
          loading={loading}
          tooltip="The total USD value of all assets deposited in the protocol."
        />
        <MetricCard 
          title="Total Borrowed" 
          value={formatUsd(protocol.totalBorrowsUSD)}
          subtext="Active borrowed funds"
          loading={loading}
        />
        <MetricCard 
          title="Available Liquidity" 
          value={formatUsd(protocol.totalAvailableUSD)}
          subtext="Remaining liquidity in pools"
          loading={loading}
        />
        <div className="group relative bg-[#1a1a1a] border border-[#333] rounded-xl p-5 hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] transition-all duration-300">
          <div className="text-sm text-gray-400 mb-1 flex items-center gap-2">
            Utilization Rate
            <div className="group-hover:opacity-100 opacity-0 transition-opacity absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-xs px-2 py-1 border border-[#333] rounded whitespace-nowrap z-10 pointer-events-none">
              Ratio of borrowed vs deposited funds. High = riskier.
            </div>
          </div>
          {loading ? (
            <SkeletonLoader className="h-8 w-24 mt-2" />
          ) : (
            <div className={`text-2xl font-mono font-bold mt-1 ${getUtilColor(protocol.utilization)}`}>
              {protocol.utilization.toFixed(2)}%
            </div>
          )}
          <div className="text-xs text-gray-500 mt-2">Overall protocol efficiency</div>
        </div>
      </div>

      {/* SECTION 3: ASSETS TABLE */}
      <div className="bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-[#333]">
          <h3 className="text-lg font-semibold text-white">Market Overview</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#121212] text-xs uppercase text-gray-400 border-b border-[#333]">
              <tr>
                <th className="px-6 py-4 font-medium">Asset</th>
                <th className="px-6 py-4 font-medium text-right">Price</th>
                <th className="px-6 py-4 font-medium text-right">24h Change</th>
                <th className="px-6 py-4 font-medium text-right">Total Deposits</th>
                <th className="px-6 py-4 font-medium text-right">Total Borrows</th>
                <th className="px-6 py-4 font-medium text-right">Utilization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#333]">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><SkeletonLoader className="h-6 w-24" /></td>
                    <td className="px-6 py-4"><SkeletonLoader className="h-6 w-20 ml-auto" /></td>
                    <td className="px-6 py-4"><SkeletonLoader className="h-6 w-16 ml-auto" /></td>
                    <td className="px-6 py-4"><SkeletonLoader className="h-6 w-32 ml-auto" /></td>
                    <td className="px-6 py-4"><SkeletonLoader className="h-6 w-32 ml-auto" /></td>
                    <td className="px-6 py-4"><SkeletonLoader className="h-6 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No market data available
                  </td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <tr key={asset.symbol} className="hover:bg-[#222] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#333] flex items-center justify-center text-xs font-bold text-white">
                          {asset.symbol.substring(0, 1)}
                        </div>
                        <span className="font-semibold text-white">{asset.symbol}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-white">
                      {formatUsd(asset.price)}
                    </td>
                    <td className={`px-6 py-4 text-right font-mono ${asset.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {asset.priceChange24h > 0 ? '+' : ''}{asset.priceChange24h.toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-mono text-white">{formatToken(asset.totalDeposits)} {asset.symbol}</div>
                      <div className="text-xs text-gray-500 font-mono mt-1">{formatUsd(asset.totalDepositsUSD)}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-mono text-white">{formatToken(asset.totalBorrows)} {asset.symbol}</div>
                      <div className="text-xs text-gray-500 font-mono mt-1">{formatUsd(asset.totalBorrowsUSD)}</div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono">
                      <span className={getUtilColor(asset.utilization)}>
                        {asset.utilization.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 4: CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Market Liquidity (USD)</h3>
          <div className="h-[300px] w-full">
            {loading ? (
              <div className="w-full h-full flex items-center justify-center">
                <SkeletonLoader className="h-full w-full rounded" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 5, right: 10, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="name" stroke="#666" tick={{ fill: '#999', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#666" tick={{ fill: '#999', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                  <RechartsTooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Bar dataKey="Deposits" fill="#555" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="Borrows" fill="#fff" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span className="w-3 h-3 rounded-full bg-[#555]"></span> Deposits
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span className="w-3 h-3 rounded-full bg-white"></span> Borrows
            </div>
          </div>
        </div>

        {/* Line Chart */}
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">ETH Price Trend (30D)</h3>
          <div className="h-[300px] w-full">
            {historyLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <SkeletonLoader className="h-full w-full rounded" />
              </div>
            ) : priceHistory.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                Price history unavailable
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceHistory} margin={{ top: 5, right: 10, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="time" stroke="#666" tick={{ fill: '#999', fontSize: 12 }} axisLine={false} tickLine={false} minTickGap={30} />
                  <YAxis domain={['auto', 'auto']} stroke="#666" tick={{ fill: '#999', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}`} />
                  <RechartsTooltip content={<CustomLineTooltip />} />
                  <Line type="monotone" dataKey="price" stroke="#fff" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#fff' }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable Metric Card component
const MetricCard = ({ title, value, subtext, loading, tooltip }) => (
  <div className="group relative bg-[#1a1a1a] border border-[#333] rounded-xl p-5 hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] transition-all duration-300">
    <div className="text-sm text-gray-400 mb-1 flex items-center gap-2">
      {title}
      {tooltip && (
        <div className="group-hover:opacity-100 opacity-0 transition-opacity absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-xs px-2 py-1 border border-[#333] rounded whitespace-nowrap z-10 pointer-events-none">
          {tooltip}
        </div>
      )}
    </div>
    {loading ? (
      <SkeletonLoader className="h-8 w-32 mt-2" />
    ) : (
      <div className="text-2xl font-mono font-bold text-white mt-1">{value}</div>
    )}
    <div className="text-xs text-gray-500 mt-2">{subtext}</div>
  </div>
);

export default Insights;
