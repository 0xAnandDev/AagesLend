import React, { createContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

export const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState('');

  const SEPOLIA_CHAIN_ID = 11155111n;

  const checkNetwork = async (currentProvider) => {
    try {
        const network = await currentProvider.getNetwork();
        if (network.chainId !== SEPOLIA_CHAIN_ID) {
            setError('Warning: Network mistmatch. Switch to Sepolia Testnet.');
            return false;
        }
        setError('');
        return true;
    } catch (e) {
        return false;
    }
  };

  const refreshNetwork = useCallback(async (currentProvider) => {
    if (!currentProvider) return;
    try {
      const network = await currentProvider.getNetwork();
      setChainId(network.chainId);
      setError(network.chainId === SEPOLIA_CHAIN_ID ? '' : 'Warning: Network mistmatch. Switch to Sepolia Testnet.');
    } catch (err) {
      setError('Failed to detect current network.');
    }
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('MetaMask missing. Please install to utilize AagesLend.');
      return;
    }

    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send("eth_requestAccounts", []);
      
      if(accounts.length > 0) {
        const isValidNetwork = await checkNetwork(browserProvider);
        if(!isValidNetwork) {
           await switchNetwork(browserProvider);
        }

        const mSigner = await browserProvider.getSigner();
        setProvider(browserProvider);
        setSigner(mSigner);
        setAccount(accounts[0]);
        setIsConnected(true);
        await refreshNetwork(browserProvider);
      }
    } catch (err) {
      if (err.code === 4001) {
        setError('User declined connection request.');
      } else {
        setError(err.message || 'Error executing connection handshake.');
      }
    }
  };

  const switchNetwork = async () => {
     try {
       await window.ethereum.request({
         method: 'wallet_switchEthereumChain',
         params: [{ chainId: '0xaa36a7' }], // 11155111 config mapped statically 
       });
       if (provider) {
         await refreshNetwork(provider);
       } else {
         await connectWallet();
       }
     } catch (err) {
       setError("Failed chain swap. Open wallet to approve Sepolia.");
     }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setIsConnected(false);
    setError('');
  };

  // Lifecycle observers tracking window constraints
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setAccount(accounts[0]);
          setIsConnected(true);
        }
      };

      const handleChainChanged = async () => {
        if (provider) {
          await refreshNetwork(provider);
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [provider, refreshNetwork]);

  useEffect(() => {
    if (provider && account) {
      refreshNetwork(provider);
    }
  }, [provider, account, refreshNetwork]);

  return (
    <Web3Context.Provider value={{
      account, provider, signer, chainId, isConnected, error, 
      connectWallet, disconnectWallet, switchNetwork
    }}>
      {children}
    </Web3Context.Provider>
  );
};
