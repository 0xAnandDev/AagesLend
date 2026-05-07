import React, { useEffect, useState, useMemo } from 'react';
import { getMarketData, depositAsset, approveAsset } from '../services/blockchainService';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { useWeb3 } from '../hooks/useWeb3';

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

// Generate a deterministic but random-looking mock price history based on base price
const generateMockHistory = (basePrice) => {
    const data = [];
    let currentPrice = basePrice || 1;
    for (let i = 0; i < 14; i++) {
        // +/- 2% max variation
        const change = currentPrice * (Math.random() * 0.04 - 0.02);
        currentPrice = currentPrice + change;
        if (currentPrice < 0) currentPrice = 0.01;
        data.push({ 
            day: `Day ${i+1}`, 
            price: Number(currentPrice.toFixed(2)) 
        });
    }
    if (data.length > 0) {
        data[data.length - 1].price = Number((basePrice || 1).toFixed(2));
    }
    return data;
};

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#1a1a1a] border border-[#333] p-2 rounded shadow-lg text-xs">
                <p className="text-[#fff] font-bold">${payload[0].value.toFixed(2)}</p>
            </div>
        );
    }
    return null;
};

const InteractiveChart = ({ price }) => {
    const data = useMemo(() => generateMockHistory(price), [price]);
    
    return (
        <div className="w-full h-16 mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#555', strokeWidth: 1, strokeDasharray: '3 3' }} />
                    <Line 
                        type="monotone" 
                        dataKey="price" 
                        stroke="#ffffff" 
                        strokeWidth={2} 
                        dot={false} 
                        activeDot={{ r: 4, fill: '#fff', stroke: '#000' }} 
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

const DepositAssets = () => {
  const { account } = useWeb3();
  const [markets, setMarkets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal & Notification State
  const [modalAsset, setModalAsset] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositStatus, setDepositStatus] = useState('idle'); // 'idle', 'approving', 'depositing'
  const [notification, setNotification] = useState(null); // { type: 'success' | 'error', message: string }

  useEffect(() => {
     let mounted = true;

     const loadData = async () => {
         try {
             const data = await getMarketData();
             if (mounted) {
                 setMarkets(data);
                 setIsLoading(false);
             }
         } catch (error) {
             console.error("Failed to load market data:", error);
             if (mounted) setIsLoading(false);
         }
     };

     loadData();
     const intervalId = setInterval(loadData, 10000);
     
     return () => {
         mounted = false;
         clearInterval(intervalId);
     };
  }, []);

  const formatCurrency = (value, price = 1) => {
      const num = Number(value) || 0;
      const formatAmount = (n) => {
          if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
          if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K';
          return n.toFixed(2);
      };
      return {
          amount: formatAmount(num),
          usd: '$' + formatAmount(num * price)
      };
  };

  const targetFeatured = ['WETH', 'USDC', 'DAI'];
  const featuredMarkets = targetFeatured.map(symbol => {
      const existing = markets.find(m => m.symbol === symbol);
      if (existing) return existing;
      return {
          symbol,
          address: 'mock',
          apy: 0,
          totalDeposits: 0,
          availableLiquidity: 0,
          utilization: 0,
          price: symbol === 'WETH' ? 3000 : 1,
          placeholder: true
      };
  });

  const handleDepositClick = (asset) => {
      setModalAsset(asset);
      setDepositAmount('');
      setDepositStatus('idle');
      setNotification(null);
  };

  const executeDeposit = async () => {
      if (!depositAmount || Number(depositAmount) <= 0) {
          setNotification({ type: 'error', message: "Please enter a valid amount." });
          return;
      }
      
      setDepositStatus('approving');
      setNotification(null);

      // This call automatically triggers Metamask connection if needed
      const approveResult = await approveAsset(modalAsset.address, depositAmount);
      
      if (!approveResult.success) {
          setNotification({ type: 'error', message: `Approve declined: ${approveResult.reason}` });
          setDepositStatus('idle');
          return;
      }

      setDepositStatus('depositing');
      const result = await depositAsset(modalAsset.address, depositAmount);
      
      if (result.success) {
          setNotification({ type: 'success', message: `Successfully deposited ${depositAmount} ${modalAsset.symbol}.` });
          setDepositStatus('idle');
          setDepositAmount('');
          // Optional: we could auto-close the modal after 2 seconds
          setTimeout(() => {
             setModalAsset(null);
             setNotification(null);
          }, 3000);
      } else {
          setNotification({ type: 'error', message: `Deposit declined: ${result.reason}` });
          setDepositStatus('idle');
      }
  };

  return (
    <div className="w-full max-w-7xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
      
      {/* Featured Section */}
      <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-[#ffffff]">Featured Assets</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[16px]">
              {isLoading ? (
                  [1, 2, 3].map(i => <div key={i} className="bg-[#111111] rounded-[12px] h-[150px] animate-pulse border border-[#222]"></div>)
              ) : (
                  featuredMarkets.map((market, idx) => (
                      <div key={market.symbol + idx} className={`bg-[#111111] rounded-[12px] p-[20px] border border-[#333] flex flex-col justify-between transition-all duration-200 hover:border-[#555] hover:shadow-[0_4px_20px_rgba(255,255,255,0.03)] cursor-pointer`}>
                          <div className="flex justify-between items-start">
                              <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center border border-[#444]">
                                      <span className="text-[#fff] text-xs font-bold">{market.symbol.charAt(0)}</span>
                                  </div>
                                  <div>
                                      <h3 className="font-bold text-[#ffffff] text-[16px]">{getTokenFullName(market.symbol)}</h3>
                                      <p className="text-[12px] text-[#888]">Main Market</p>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <div className="font-bold text-[#ffffff] text-[18px]">{market.apy.toFixed(2)}%</div>
                                  <div className="text-[12px] text-[#888]">APY</div>
                              </div>
                          </div>
                          
                          <InteractiveChart price={market.price} />
                      </div>
                  ))
              )}
          </div>
      </div>

      {/* Assets Table */}
      <div className="bg-[#111111] border border-[#333] rounded-[12px] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                      <tr className="border-b border-[#333] text-[12px] font-semibold text-[#888] uppercase tracking-wider bg-[#0a0a0a]">
                          <th className="p-[16px] pl-[24px] font-medium">Asset</th>
                          <th className="p-[16px] font-medium">APY</th>
                          <th className="p-[16px] font-medium">Total Deposits</th>
                          <th className="p-[16px] font-medium">Available Liquidity</th>
                          <th className="p-[16px] font-medium">Utilization</th>
                          <th className="p-[16px] pr-[24px] font-medium text-right">Action</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222]">
                      {isLoading ? (
                          [1, 2, 3].map(i => (
                              <tr key={i} className="animate-pulse">
                                  <td className="p-[16px] pl-[24px] flex items-center gap-4">
                                      <div className="w-8 h-8 rounded-full bg-[#222]"></div>
                                      <div>
                                          <div className="h-4 w-24 bg-[#222] rounded mb-2"></div>
                                          <div className="h-3 w-12 bg-[#222] rounded"></div>
                                      </div>
                                  </td>
                                  <td className="p-[16px]"><div className="h-5 w-12 bg-[#222] rounded"></div></td>
                                  <td className="p-[16px]">
                                      <div className="h-5 w-24 bg-[#222] rounded mb-2"></div>
                                      <div className="h-3 w-16 bg-[#222] rounded"></div>
                                  </td>
                                  <td className="p-[16px]">
                                      <div className="h-5 w-24 bg-[#222] rounded mb-2"></div>
                                      <div className="h-3 w-16 bg-[#222] rounded"></div>
                                  </td>
                                  <td className="p-[16px]"><div className="h-2 w-20 bg-[#222] rounded-full"></div></td>
                                  <td className="p-[16px] pr-[24px] text-right"><div className="h-8 w-20 bg-[#222] rounded-lg ml-auto"></div></td>
                              </tr>
                          ))
                      ) : (
                          // We now iterate over featuredMarkets so ETH and DAI show up in the table too
                          featuredMarkets.map((market) => {
                              const deposits = formatCurrency(market.totalDeposits, market.price);
                              const liquidity = formatCurrency(market.availableLiquidity, market.price);
                              
                              return (
                                  <tr key={market.symbol} className="hover:bg-[#1a1a1a] transition-colors duration-200">
                                      <td className="p-[16px] pl-[24px]">
                                          <div className="flex items-center gap-3">
                                              <div className="w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center border border-[#444]">
                                                  <span className="text-[#fff] text-xs font-bold">{market.symbol.charAt(0)}</span>
                                              </div>
                                              <div>
                                                  <div className="font-bold text-[#ffffff] text-[16px]">{getTokenFullName(market.symbol)}</div>
                                                  <div className="text-[12px] text-[#888]">{market.symbol}</div>
                                              </div>
                                          </div>
                                      </td>
                                      <td className="p-[16px]">
                                          <div className="font-semibold text-[#ffffff] text-[16px]">{market.apy.toFixed(2)}%</div>
                                      </td>
                                      <td className="p-[16px]">
                                          <div className="font-semibold text-[#ffffff] text-[16px]">{deposits.amount} {market.symbol}</div>
                                          <div className="text-[12px] text-[#888]">{deposits.usd}</div>
                                      </td>
                                      <td className="p-[16px]">
                                          <div className="font-semibold text-[#ffffff] text-[16px]">{liquidity.amount} {market.symbol}</div>
                                          <div className="text-[12px] text-[#888]">{liquidity.usd}</div>
                                      </td>
                                      <td className="p-[16px] w-[150px]">
                                          <div className="flex items-center gap-2">
                                              <div className="w-full h-2 bg-[#222] rounded-full overflow-hidden">
                                                  <div 
                                                      className="h-full bg-[#ffffff] rounded-full" 
                                                      style={{ width: `${Math.min(100, Math.max(0, market.utilization))}%` }}
                                                  ></div>
                                              </div>
                                              <span className="text-[12px] text-[#ffffff] w-[40px] text-right">
                                                  {market.utilization.toFixed(1)}%
                                              </span>
                                          </div>
                                      </td>
                                      <td className="p-[16px] pr-[24px] text-right">
                                          <button 
                                              onClick={() => handleDepositClick(market)}
                                              className="bg-[#ffffff] hover:bg-[#dddddd] text-[#000000] font-bold py-2 px-6 rounded-lg transition-colors duration-200 border border-[#fff]"
                                          >
                                              Deposit
                                          </button>
                                      </td>
                                  </tr>
                              );
                          })
                      )}
                  </tbody>
              </table>
          </div>
      </div>

      {/* Deposit Modal */}
      {modalAsset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg- backdrop-blur-sm px-4">
              <div className="bg-[#111111] border border-[#333] rounded-[16px] p-6 w-full max-w-md shadow-2xl relative">
                  
                  {/* Close Button */}
                  <button 
                      onClick={() => setModalAsset(null)}
                      className="absolute top-4 right-4 text-[#888] hover:text-[#fff] transition-colors"
                  >
                      ✕
                  </button>

                  <h3 className="text-xl font-bold text-[#fff] mb-2">Deposit {modalAsset.symbol}</h3>
                  <p className="text-[#888] text-sm mb-6">Enter the amount of {getTokenFullName(modalAsset.symbol)} you want to deposit into the protocol.</p>

                  {/* Notification Popup */}
                  {notification && (
                      <div className={`p-4 rounded-lg mb-4 text-sm font-medium border ${notification.type === 'success' ? 'bg-[#0f291e] text-[#10b981] border-[#10b981]' : 'bg-[#2a0e0e] text-[#ef4444] border-[#ef4444]'}`}>
                          {notification.message}
                      </div>
                  )}

                  {!account && !notification && (
                      <div className="p-4 rounded-lg mb-4 bg-[#1a1a1a] text-[#aaa] border border-[#333] text-sm text-center">
                          Please ensure your MetaMask is connected before depositing.
                      </div>
                  )}

                  <div className="mb-6">
                      <div className="flex justify-between mb-2">
                          <label className="text-[#888] text-xs font-semibold uppercase tracking-wider">Amount</label>
                      </div>
                      <div className="relative">
                          <input 
                              type="number"
                              value={depositAmount}
                              onChange={(e) => setDepositAmount(e.target.value)}
                              placeholder="0.00"
                              className="w-full bg-[#0a0a0a] border border-[#333] text-[#fff] rounded-lg px-4 py-3 outline-none focus:border-[#fff] transition-colors"
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                              <span className="text-[#888] font-medium">{modalAsset.symbol}</span>
                          </div>
                      </div>
                  </div>

                  <button 
                      onClick={executeDeposit}
                      disabled={depositStatus === 'approving' || depositStatus === 'depositing'}
                      className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-200 ${
                          (depositStatus === 'approving' || depositStatus === 'depositing') 
                          ? 'bg-[#333] text-[#888] cursor-not-allowed' 
                          : 'bg-[#fff] hover:bg-[#ddd] text-[#000]'
                      }`}
                  >
                      {depositStatus === 'approving' ? 'Approving...' : depositStatus === 'depositing' ? 'Depositing...' : `Deposit ${modalAsset.symbol}`}
                  </button>
              </div>
          </div>
      )}

    </div>
  );
};

export default DepositAssets;
