/**
 * Native React Vite compatible config injection boundaries mappings globally wrapping
 * the process limits dynamically tracking ENV mapping natively.
 */
export const CONFIG = {
  NETWORK: {
    // Vite uses import.meta.env exclusively 
    ID: parseInt(import.meta.env.REACT_APP_CHAIN_ID || 11155111),
    NAME: import.meta.env.REACT_APP_NETWORK_NAME || 'sepolia',
    RPC_URL: import.meta.env.REACT_APP_INFURA_KEY,
  },
  CONTRACTS: {
    AAGESLEND_CORE: import.meta.env.REACT_APP_AAGESLEND_CORE_ADDRESS,
    LIQUIDITY_POOL: import.meta.env.REACT_APP_LIQUIDITY_POOL_ADDRESS,
    COLLATERAL_MANAGER: import.meta.env.REACT_APP_COLLATERAL_MANAGER_ADDRESS,
    PRICE_ORACLE: import.meta.env.REACT_APP_PRICE_ORACLE_ADDRESS,
    LIQUIDATION_ENGINE: import.meta.env.REACT_APP_LIQUIDATION_ENGINE_ADDRESS
  },
  TOKENS: {
    USDC: import.meta.env.REACT_APP_USDC_ADDRESS,
    DAI: import.meta.env.REACT_APP_DAI_ADDRESS,
    ETH: "0xEeeeeEeeeEeEeeEeEeEeeEEeeeeEeeeeeeeEEeE", // Raw internal mapping limits
  },
  API_URL: import.meta.env.REACT_APP_API_URL,
  LTV_RATIOS: {
    ETH: 0.75,
    USDC: 0.80,
    DAI: 0.75,
  },
  LIQUIDATION_BONUS: 0.05,
};
