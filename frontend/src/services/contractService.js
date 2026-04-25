import { ethers } from 'ethers';

const RPC_URL = import.meta.env.REACT_APP_RPC_URL;
const INFURA_KEY = import.meta.env.REACT_APP_INFURA_KEY;
const ALCHEMY_KEY = import.meta.env.REACT_APP_ALCHEMY_KEY;
const TIMEOUT_MS = 30000; // 30 seconds

/**
 * Wrap promise with a timeout
 * @param {Promise} promise - The promise to wrap
 * @param {string} actionName - Name of the action for error logging
 * @returns {Promise}
 */
const withTimeout = (promise, actionName = "Contract operation") => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${actionName} timed out after 30 seconds`)), TIMEOUT_MS)
    )
  ]);
};

/**
 * Gets the best available provider based on environment variables.
 * Handles both ethers v5 and v6 configurations.
 * @returns {ethers.Provider|ethers.providers.Provider}
 */
const getProvider = () => {
  // Gracefully handle both ethers v6 and v5
  const JsonRpcProvider = ethers.JsonRpcProvider || (ethers.providers && ethers.providers.JsonRpcProvider);

  if (RPC_URL) {
    return new JsonRpcProvider(RPC_URL);
  }

  const network = "sepolia"; // Using Sepolia testnet

  if (INFURA_KEY) {
    const InfuraProvider = ethers.InfuraProvider || (ethers.providers && ethers.providers.InfuraProvider);
    if (InfuraProvider) return new InfuraProvider(network, INFURA_KEY);
    return new JsonRpcProvider(`https://sepolia.infura.io/v3/${INFURA_KEY}`);
  }

  if (ALCHEMY_KEY) {
    const AlchemyProvider = ethers.AlchemyProvider || (ethers.providers && ethers.providers.AlchemyProvider);
    if (AlchemyProvider) return new AlchemyProvider(network, ALCHEMY_KEY);
    return new JsonRpcProvider(`https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`);
  }

  if (typeof window !== 'undefined' && window.ethereum) {
    const BrowserProvider = ethers.BrowserProvider || (ethers.providers && ethers.providers.Web3Provider);
    return new BrowserProvider(window.ethereum);
  }

  throw new Error("No valid RPC provider found. Please configure REACT_APP_RPC_URL, Infura, or Alchemy.");
};

/**
 * Generic error handler for contract interactions, providing user-friendly messages.
 * @param {Error} error - Caught error object
 * @param {string} context - Context string where the error happened
 */
const handleContractError = (error, context) => {
  console.error(`[ContractService] Error in ${context}:`, error);

  let userMessage = error.message;

  if (error.code === 'NETWORK_ERROR') {
    userMessage = 'Network error: Please check your connection to the RPC provider.';
  } else if (error.code === 'CALL_EXCEPTION') {
    userMessage = 'Smart contract call failed. Please verify the parameters and contract state.';
  } else if (error.code === 'ACTION_REJECTED') {
    userMessage = 'Transaction was rejected by the user in MetaMask.';
  } else if (error.message && error.message.includes('timed out')) {
    userMessage = error.message; // From our withTimeout wrapper
  }

  throw new Error(userMessage);
};

/**
 * 1. Create ethers.js contract instance
 * @param {string} contractAddress - Contract address
 * @param {Array} contractABI - Contract ABI
 * @param {ethers.Signer|ethers.Provider} [signerOrProvider] - Optional explicitly passed signer or provider
 * @returns {ethers.Contract} Contract object ready to call
 */
export const getContractInstance = (contractAddress, contractABI, signerOrProvider = null) => {
  try {
    const provider = signerOrProvider || getProvider();
    return new ethers.Contract(contractAddress, contractABI, provider);
  } catch (error) {
    handleContractError(error, 'getContractInstance');
  }
};

/**
 * 2. Call read-only function (no gas cost)
 * @param {string} contractAddress - Contract address
 * @param {Array} contractABI - Contract ABI
 * @param {string} functionName - Function name to call
 * @param {Array} params - Array of parameters
 * @returns {Promise<any>} Result from function
 */
export const callReadFunction = async (contractAddress, contractABI, functionName, params = []) => {
  try {
    const contract = getContractInstance(contractAddress, contractABI);
    if (!contract[functionName]) throw new Error(`Function ${functionName} not found in ABI`);

    const result = await withTimeout(contract[functionName](...params), `Read function ${functionName}`);
    return result;
  } catch (error) {
    handleContractError(error, `callReadFunction (${functionName})`);
  }
};

/**
 * 3. Send write transaction (costs gas, needs signature)
 * @param {string} contractAddress - Contract address
 * @param {Array} contractABI - Contract ABI
 * @param {string} functionName - Function name to call
 * @param {Array} params - Array of parameters
 * @param {ethers.Signer} signer - Signer from MetaMask (window.ethereum)
 * @returns {Promise<ethers.TransactionReceipt>} Transaction receipt
 */
export const sendTransaction = async (contractAddress, contractABI, functionName, params = [], signer) => {
  try {
    if (!signer) {
      throw new Error('A valid signer is required for write transactions (e.g., connected MetaMask).');
    }
    const contract = new ethers.Contract(contractAddress, contractABI, signer);
    if (!contract[functionName]) throw new Error(`Function ${functionName} not found in ABI`);

    // Execute transaction
    const tx = await withTimeout(contract[functionName](...params), `Transaction submission ${functionName}`);

    // Wait for receipt confirmation
    const receipt = await withTimeout(tx.wait(), `Transaction confirmation ${functionName}`);
    return receipt;
  } catch (error) {
    handleContractError(error, `sendTransaction (${functionName})`);
  }
};

/**
 * 4. Get user's token balance
 * @param {string} tokenAddress - ERC20 token address
 * @param {string} userAddress - User's wallet address
 * @returns {Promise<string>} Balance as string (big number format)
 */
export const getUserBalance = async (tokenAddress, userAddress) => {
  try {
    // Minimal ABI for ERC20 balance
    const ERC20_ABI = [
      "function balanceOf(address owner) view returns (uint256)"
    ];
    const contract = getContractInstance(tokenAddress, ERC20_ABI);
    const balance = await withTimeout(contract.balanceOf(userAddress), 'getUserBalance');

    return balance.toString();
  } catch (error) {
    handleContractError(error, `getUserBalance`);
  }
};

/**
 * 5. Estimate gas cost before transaction
 * @param {string} contractAddress - Contract address
 * @param {Array} contractABI - Contract ABI
 * @param {string} functionName - Function name to call
 * @param {Array} params - Array of parameters
 * @returns {Promise<string>} Gas estimate in wei as string
 */
export const estimateGas = async (contractAddress, contractABI, functionName, params = []) => {
  try {
    const contract = getContractInstance(contractAddress, contractABI);

    // Support both ethers v5 (contract.estimateGas.funcName) and v6 (contract.getFunction().estimateGas)
    let estimateFunc;
    if (contract.estimateGas && contract.estimateGas[functionName]) {
      estimateFunc = contract.estimateGas[functionName].bind(contract.estimateGas);
    } else if (contract.getFunction) {
      estimateFunc = contract.getFunction(functionName).estimateGas.bind(contract.getFunction(functionName));
    } else if (contract[functionName] && contract[functionName].estimateGas) {
      estimateFunc = contract[functionName].estimateGas.bind(contract[functionName]);
    }

    if (!estimateFunc) throw new Error(`Could not resolve gas estimation function for ${functionName}`);

    const estimate = await withTimeout(estimateFunc(...params), `Gas estimation for ${functionName}`);
    return estimate.toString();
  } catch (error) {
    handleContractError(error, `estimateGas (${functionName})`);
  }
};

/**
 * 6. Listen to real-time contract events
 * @param {string} contractAddress - Contract address
 * @param {Array} contractABI - Contract ABI
 * @param {string} eventName - Event name to listen to
 * @param {Function} callback - Callback function(args...)
 * @returns {ethers.Contract} Contract instance so listener can be removed later via contract.off()
 */
export const listenToContractEvent = (contractAddress, contractABI, eventName, callback) => {
  try {
    const contract = getContractInstance(contractAddress, contractABI);

    contract.on(eventName, (...args) => {
      callback(...args);
    });

    return contract;
  } catch (error) {
    handleContractError(error, `listenToContractEvent (${eventName})`);
  }
};
