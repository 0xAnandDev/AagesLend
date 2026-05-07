import { useEffect, useMemo, useState } from 'react';
import { ethers } from 'ethers';
import addresses from '../utils/addresses.json';
import contracts from '../utils/abi/contracts.json';

const ERC20_METADATA_ABI = [
  'function decimals() view returns (uint8)',
];

const DEFAULT_COLLATERAL_FACTOR = 0.8;

const TOKEN_ADDRESS_KEYS = ['USDC', 'DAI', 'WETH', 'ETH'];

export const useDashboardMetrics = ({ account, provider }) => {
  const [metrics, setMetrics] = useState({
    totalSupplied: null,
    totalBorrowed: null,
    netBalance: null,
    healthFactor: null,
  });
  const [loading, setLoading] = useState(false);

  const tokenAddresses = useMemo(() => {
    return TOKEN_ADDRESS_KEYS
      .map((key) => addresses[key])
      .filter((value) => typeof value === 'string' && ethers.isAddress(value));
  }, []);

  useEffect(() => {
    let isMounted = true;

    const readMetrics = async () => {
      if (!account || !provider) {
        if (isMounted) {
          setLoading(false);
          setMetrics({
            totalSupplied: null,
            totalBorrowed: null,
            netBalance: null,
            healthFactor: null,
          });
        }
        return;
      }

      const coreAddress = addresses.AagesLendCore;
      const coreAbi = contracts?.AagesLendCore?.abi;

      if (!coreAddress || !ethers.isAddress(coreAddress) || !Array.isArray(coreAbi)) {
        if (isMounted) {
          setLoading(true);
          setMetrics({
            totalSupplied: null,
            totalBorrowed: null,
            netBalance: null,
            healthFactor: null,
          });
        }
        return;
      }

      if (tokenAddresses.length === 0) {
        if (isMounted) {
          setLoading(true);
          setMetrics({
            totalSupplied: null,
            totalBorrowed: null,
            netBalance: null,
            healthFactor: null,
          });
        }
        return;
      }

      try {
        if (isMounted) setLoading(true);

        const coreContract = new ethers.Contract(coreAddress, coreAbi, provider);
        let suppliedUsd = 0;
        let borrowedUsd = 0;

        for (const tokenAddress of tokenAddresses) {
          const [suppliedRaw, borrowedRaw, decimalsRaw] = await Promise.all([
            coreContract.deposits(account, tokenAddress),
            coreContract.borrows(account, tokenAddress),
            new ethers.Contract(tokenAddress, ERC20_METADATA_ABI, provider).decimals().catch(() => 18),
          ]);

          const decimals = Number(decimalsRaw);
          suppliedUsd += Number(ethers.formatUnits(suppliedRaw, decimals));
          borrowedUsd += Number(ethers.formatUnits(borrowedRaw, decimals));
        }

        const hasAnyData = suppliedUsd > 0 || borrowedUsd > 0;
        const netBalance = hasAnyData ? suppliedUsd - borrowedUsd : null;
        const healthFactor = borrowedUsd > 0 ? (suppliedUsd * DEFAULT_COLLATERAL_FACTOR) / borrowedUsd : null;

        if (isMounted) {
          setMetrics({
            totalSupplied: hasAnyData ? suppliedUsd : null,
            totalBorrowed: hasAnyData ? borrowedUsd : null,
            netBalance,
            healthFactor,
          });
        }
      } catch (error) {
        if (isMounted) {
          setMetrics({
            totalSupplied: null,
            totalBorrowed: null,
            netBalance: null,
            healthFactor: null,
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    readMetrics();

    return () => {
      isMounted = false;
    };
  }, [account, provider, tokenAddresses]);

  return { metrics, loading };
};
