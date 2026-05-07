import { useState, useEffect } from 'react';
import { useWeb3 } from './useWeb3';
import { getSupportedTokens, getUserSuppliedAmount, getTokenCollateralStatus } from '../services/blockchainService';
import priceService from '../services/priceService';
import { ethers } from 'ethers';
import addresses from '../utils/addresses.json';
import contractsAbi from '../utils/abi/contracts.json';
import { calculatePositionValues, calculateTotals } from '../utils/loanCalculations';

const ERC20_ABI = [
  "function decimals() external view returns (uint8)"
];

export const useUserPositions = () => {
  const { account } = useWeb3();
  const [data, setData] = useState({
    positions: [],
    totals: {
      totalCollateralUSD: 0,
      totalBorrowUSD: 0,
      totalBorrowLimitUSD: 0,
      utilizationPercent: 0
    },
    loading: true,
    error: null
  });

  useEffect(() => {
    if (!account) {
      setData({ positions: [], totals: calculateTotals([]), loading: false, error: null });
      return;
    }

    let isMounted = true;

    const fetchPositions = async () => {
      try {
        const provider = window.ethereum ? new ethers.BrowserProvider(window.ethereum) : ethers.getDefaultProvider('sepolia');
        const coreContract = new ethers.Contract(addresses.AagesLendCore, contractsAbi.AagesLendCore.abi, provider);
        const tokens = getSupportedTokens();
        
        // Fetch prices using existing priceService
        const prices = await priceService.getPrices(); // { ETH: ..., USDC: ..., DAI: ... }

        const positions = [];

        for (const token of tokens) {
          const depositAmountRaw = await coreContract.deposits(account, token.address).catch(() => 0n);
          const borrowAmountRaw = await coreContract.borrows(account, token.address).catch(() => 0n);

          if (depositAmountRaw > 0n || borrowAmountRaw > 0n) {
            const tokenContract = new ethers.Contract(token.address, ERC20_ABI, provider);
            const decimals = await tokenContract.decimals().catch(() => 18);
            
            const deposited = await getUserSuppliedAmount(account, token.address);
            const borrowed = Number(ethers.formatUnits(borrowAmountRaw, decimals));
            const price = prices[token.symbol] || 1; // Default to 1 if price not found

            const ltv = 8000; // default 80%

            const calculated = calculatePositionValues(deposited, borrowed, price, ltv);
            const isCollateral = getTokenCollateralStatus(account, token.address);

            positions.push({
              tokenAddress: token.address,
              symbol: token.symbol,
              deposited,
              borrowed,
              price,
              ...calculated,
              ltv,
              isCollateral
            });
          }
        }

        const totals = calculateTotals(positions);

        if (isMounted) {
          setData({
            positions,
            totals,
            loading: false,
            error: null
          });
        }
      } catch (err) {
        console.error("Error fetching user positions:", err);
        if (isMounted) {
          setData(prev => ({ ...prev, loading: false, error: err.message }));
        }
      }
    };

    fetchPositions();

    return () => {
      isMounted = false;
    };
  }, [account]);

  return data;
};
