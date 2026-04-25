import { ethers } from 'ethers';
import addresses from '../utils/addresses.json';
import contractsAbi from '../utils/abi/contracts.json';

const ERC20_ABI = [
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)",
  "function balanceOf(address account) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)"
];

const KNOWN_CONTRACTS = [
  'PriceOracle', 'InterestRateModel', 'CollateralManager',
  'AagesLendCore', 'LiquidityPool', 'LiquidationEngine'
];

export const getSupportedTokens = () => {
  const tokens = [];
  for (const [key, address] of Object.entries(addresses)) {
    if (!KNOWN_CONTRACTS.includes(key) && address) {
      tokens.push({ symbol: key, address });
    }
  }
  return tokens;
};

const getProvider = () => {
  if (window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }
  return ethers.getDefaultProvider('sepolia');
};

export const getSigner = async () => {
  if (window.ethereum) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    return await provider.getSigner();
  }
  throw new Error("MetaMask not found. Please install a Web3 wallet.");
};

export const getTokenBalance = async (tokenAddress, accountAddress) => {
  try {
    if (tokenAddress.toLowerCase() === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee") {
      const provider = getProvider();
      const balance = await provider.getBalance(accountAddress);
      return Number(ethers.formatEther(balance));
    }
    const provider = getProvider();
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const balance = await tokenContract.balanceOf(accountAddress);
    const decimals = await tokenContract.decimals();
    return Number(ethers.formatUnits(balance, decimals));
  } catch (error) {
    console.error("Error fetching token balance:", error);
    return 0;
  }
};

export const getUtilization = async () => {
  try {
    const provider = getProvider();
    const poolContract = new ethers.Contract(addresses.LiquidityPool, contractsAbi.LiquidityPool.abi, provider);
    const utilization = await poolContract.getUtilizationRate();
    // Assuming utilization rate is scaled by 1e18 or 10000. Let's return as number.
    // We will pass it to InterestRateModel as is.
    return utilization;
  } catch (error) {
    console.error("Error fetching utilization:", error);
    return 0n;
  }
};

export const getSupplyAPY = async (utilizationRate) => {
  try {
    const provider = getProvider();
    const irModel = new ethers.Contract(addresses.InterestRateModel, contractsAbi.InterestRateModel.abi, provider);
    const rate = await irModel.getSupplyRate(utilizationRate);
    // Rate might be scaled. E.g., 1e18 = 100% or ray. Assume 1e27 (ray) or 1e18. Let's format as 1e18 for now.
    // Usually APY is formatted to a percentage. We'll return the formatted number * 100.
    const rateFormatted = Number(ethers.formatUnits(rate, 18));
    return rateFormatted * 100;
  } catch (error) {
    console.error("Error fetching supply APY:", error);
    return 0;
  }
};

export const getBorrowAPY = async (utilizationRate) => {
  try {
    const provider = getProvider();
    const irModel = new ethers.Contract(addresses.InterestRateModel, contractsAbi.InterestRateModel.abi, provider);
    const rate = await irModel.getBorrowRate(utilizationRate);
    const rateFormatted = Number(ethers.formatUnits(rate, 18));
    return rateFormatted * 100;
  } catch (error) {
    console.error("Error fetching borrow APY:", error);
    return 0;
  }
};

export const getTotalDeposits = async (tokenAddress) => {
  // Total deposits can be estimated by the pool's balance + total borrows
  // Since we don't have total borrows explicitly per token in the pool ABI,
  // we use the LiquidityPool's token balance as available liquidity.
  return await getTokenBalance(tokenAddress, addresses.AagesLendCore);
};

export const getTotalBorrows = async (tokenAddress) => {
  // Cannot fetch total borrows per token directly from provided ABI without utilization math,
  // We'll calculate it if we can, or return a simulated value based on utilization.
  // For now, let's use a dummy fraction of deposits based on a generic utilization if available.
  return 0; // Handled in the market data fetcher
};

export const getTokenPrice = async (tokenAddress) => {
  try {
    if (!addresses.PriceOracle) return 1;
    const provider = getProvider();
    const oracle = new ethers.Contract(addresses.PriceOracle, contractsAbi.PriceOracle.abi, provider);
    const price = await oracle.getPrice(tokenAddress);
    return Number(ethers.formatUnits(price, 8)); // Usually USD prices are 8 decimals
  } catch (error) {
    console.error("Error fetching price:", error);
    return 1;
  }
};

export const getMarketData = async () => {
  const tokens = getSupportedTokens();
  const provider = getProvider();
  const coreContract = new ethers.Contract(addresses.AagesLendCore, contractsAbi.AagesLendCore.abi, provider);

  const markets = await Promise.all(tokens.map(async (token) => {
    // 1. Available Liquidity (Balance of AagesLendCore)
    const availableLiquidity = await getTokenBalance(token.address, addresses.AagesLendCore);
    const price = await getTokenPrice(token.address);

    // 2. Global Borrows (Sum Borrow events - Sum Repay events)
    let borrows = 0;
    try {
      const borrowFilter = coreContract.filters.Borrow(null, token.address);
      const borrowEvents = await coreContract.queryFilter(borrowFilter);
      let globalBorrowsRaw = 0n;
      for (const event of borrowEvents) {
        globalBorrowsRaw += event.args[2]; // borrowAmount
      }

      const repayFilter = coreContract.filters.Repay(null, token.address);
      const repayEvents = await coreContract.queryFilter(repayFilter);
      let globalRepaysRaw = 0n;
      for (const event of repayEvents) {
        globalRepaysRaw += event.args[2]; // repayAmount
      }

      let netBorrowsRaw = globalBorrowsRaw - globalRepaysRaw;
      if (netBorrowsRaw < 0n) netBorrowsRaw = 0n;

      const tokenContract = new ethers.Contract(token.address, ERC20_ABI, provider);
      const decimals = await tokenContract.decimals().catch(() => 18);
      borrows = Number(ethers.formatUnits(netBorrowsRaw, decimals));
    } catch (e) {
      console.error(`Error calculating total borrows for ${token.symbol}:`, e);
    }

    // 3. Compute Totals and Utilization
    const deposits = availableLiquidity + borrows;
    let utilPercent = 0;
    if (deposits > 0) {
      utilPercent = (borrows / deposits) * 100;
    }

    // 4. Derive APYs dynamically based on utilization
    // Base APY 2.0%, max Borrow APY 15.0% at 100% util
    const borrowApy = 2.0 + (utilPercent * 0.13);
    // Supply APY is a fraction of borrow APY multiplied by utilization
    const supplyApy = borrowApy * (utilPercent / 100) * 0.8;

    return {
      symbol: token.symbol,
      address: token.address,
      apy: supplyApy,
      borrowApy: borrowApy,
      totalDeposits: deposits,
      totalBorrows: borrows,
      availableLiquidity: availableLiquidity,
      utilization: utilPercent,
      price: price || 1
    };
  }));

  return markets;
};

export const depositAsset = async (tokenAddress, amountStr) => {
  try {
    const signer = await getSigner();

    if (tokenAddress.toLowerCase() === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee") {
      return { success: false, reason: "Native ETH is not directly supported for deposits. Please use WETH." };
    }

    // Defaulting to 18 decimals, ideally we should fetch the decimals first
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    const decimals = await tokenContract.decimals().catch(() => 18);
    const amount = ethers.parseUnits(amountStr, decimals);

    // 1. Approve Core contract
    const txApprove = await tokenContract.approve(addresses.AagesLendCore, amount);
    await txApprove.wait();

    // 2. Deposit into Core
    const coreContract = new ethers.Contract(addresses.AagesLendCore, contractsAbi.AagesLendCore.abi, signer);
    const txDeposit = await coreContract.deposit(tokenAddress, amount);
    await txDeposit.wait();

    return { success: true, hash: txDeposit.hash };
  } catch (err) {
    console.error("Deposit error:", err);
    if (err.code === 'ACTION_REJECTED' || (err.message && err.message.toLowerCase().includes('user rejected'))) {
      return { success: false, reason: "Transaction was rejected by the user." };
    }
    let reason = "Transaction failed.";
    if (err.reason) {
      reason = err.reason;
    } else if (err.info && err.info.error && err.info.error.message) {
      reason = err.info.error.message;
    } else if (err.message) {
      reason = err.message.split('(')[0].trim();
    }
    return { success: false, reason };
  }
};

export const getUserSuppliedAmount = async (userAddress, tokenAddress) => {
  try {
    const provider = getProvider();
    const coreContract = new ethers.Contract(addresses.AagesLendCore, contractsAbi.AagesLendCore.abi, provider);
    const balanceRaw = await coreContract.deposits(userAddress, tokenAddress);
    
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const decimals = await tokenContract.decimals().catch(() => 18);
    
    return Number(ethers.formatUnits(balanceRaw, decimals));
  } catch (err) {
    console.error("Error fetching user supplied amount:", err);
    return 0;
  }
};

export const getUserCollateral = async (userAddress) => {
  try {
    const provider = getProvider();
    const coreContract = new ethers.Contract(addresses.AagesLendCore, contractsAbi.AagesLendCore.abi, provider);
    const tokens = getSupportedTokens();
    let totalUsd = 0;

    for (const token of tokens) {
      const depositAmount = await coreContract.deposits(userAddress, token.address);
      if (depositAmount > 0n) {
        const tokenContract = new ethers.Contract(token.address, ERC20_ABI, provider);
        const decimals = await tokenContract.decimals().catch(() => 18);
        const formatted = Number(ethers.formatUnits(depositAmount, decimals));
        const price = await getTokenPrice(token.address);
        totalUsd += formatted * price;
      }
    }
    return totalUsd;
  } catch (err) {
    console.error("Error fetching user collateral:", err);
    return 0;
  }
};

export const getUserBorrowedAmount = async (userAddress, tokenAddress) => {
  try {
    const provider = getProvider();
    const coreContract = new ethers.Contract(addresses.AagesLendCore, contractsAbi.AagesLendCore.abi, provider);
    const borrowAmount = await coreContract.borrows(userAddress, tokenAddress);
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const decimals = await tokenContract.decimals().catch(() => 18);
    return Number(ethers.formatUnits(borrowAmount, decimals));
  } catch (err) {
    console.error("Error fetching borrowed amount:", err);
    return 0;
  }
};

export const getUserTotalBorrowedUsd = async (userAddress) => {
  const tokens = getSupportedTokens();
  let totalUsd = 0;
  for (const token of tokens) {
    const amount = await getUserBorrowedAmount(userAddress, token.address);
    if (amount > 0) {
      const price = await getTokenPrice(token.address);
      totalUsd += amount * price;
    }
  }
  return totalUsd;
};

export const getUserHealthFactor = async (userAddress) => {
  try {
    const collateralUsd = await getUserCollateral(userAddress);
    const borrowedUsd = await getUserTotalBorrowedUsd(userAddress);
    if (borrowedUsd === 0) return 999;
    return (collateralUsd * 0.8) / borrowedUsd;
  } catch (err) {
    console.error("Error fetching health factor:", err);
    return 0;
  }
};

export const getMaxBorrowAmount = async (userAddress, borrowTokenPrice = 1) => {
  const collateralUsd = await getUserCollateral(userAddress);
  const borrowedUsd = await getUserTotalBorrowedUsd(userAddress);
  const maxBorrowUsd = (collateralUsd * 0.75) - borrowedUsd;
  return Math.max(0, maxBorrowUsd / borrowTokenPrice);
};

export const borrowAsset = async (tokenAddress, amountStr) => {
  try {
    const signer = await getSigner();
    const userAddress = await signer.getAddress();

    const provider = getProvider();
    const coreContract = new ethers.Contract(addresses.AagesLendCore, contractsAbi.AagesLendCore.abi, signer);
    const tokens = getSupportedTokens();

    let collateralToken = null;
    let colAmount = 0n;

    for (const token of tokens) {
      const depositAmount = await coreContract.deposits(userAddress, token.address);
      if (depositAmount > 0n) {
        collateralToken = token.address;
        colAmount = depositAmount;
        break;
      }
    }

    if (!collateralToken) {
      return { success: false, reason: "No collateral found to borrow against." };
    }

    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    const decimals = await tokenContract.decimals().catch(() => 18);
    const amount = ethers.parseUnits(amountStr, decimals);

    const txBorrow = await coreContract.borrow(collateralToken, colAmount, tokenAddress, amount);
    await txBorrow.wait();

    return { success: true, hash: txBorrow.hash };
  } catch (err) {
    console.error("Borrow error:", err);
    if (err.code === 'ACTION_REJECTED' || (err.message && err.message.toLowerCase().includes('user rejected'))) {
      return { success: false, reason: "Transaction was rejected by the user." };
    }
    let reason = "Transaction failed.";
    if (err.reason) {
      reason = err.reason;
    } else if (err.info && err.info.error && err.info.error.message) {
      reason = err.info.error.message;
    } else if (err.message) {
      reason = err.message.split('(')[0].trim();
    }

    if (reason.includes("Unregistered Price Feed")) {
      reason = "Price feed not configured for this asset.";
    }

    return { success: false, reason };
  }
};
export const setTokenCollateralStatus = (userAddress, tokenAddress, status) => {
  localStorage.setItem(`isCollateral_${userAddress}_${tokenAddress}`, status ? "true" : "false");
};

export const getTokenCollateralStatus = (userAddress, tokenAddress) => {
  const val = localStorage.getItem(`isCollateral_${userAddress}_${tokenAddress}`);
  return val !== "false"; // Defaults to true if never set
};

if (typeof window !== "undefined") {
  window.blockchain = {
    getTokenBalance,
    getTokenPrice,
    depositAsset,
    borrowAsset,
    getSupportedTokens,
    getSigner,
    setTokenCollateralStatus,
    getTokenCollateralStatus
  };
}