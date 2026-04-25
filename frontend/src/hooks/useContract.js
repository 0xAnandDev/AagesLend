import { useMemo } from 'react';
import { useWeb3 } from './useWeb3';
import { contractService } from '../../services/contractService';

/**
 * Simple retrieval pipeline connecting current provider wrappers dynamically returning requested module setups natively
 * @param {string} contractName - 'core' | 'pool' logic
 * @returns {ethers.Contract|null} Configured singleton wrapper instance 
 */
export const useContract = (contractName) => {
    const { provider, signer } = useWeb3();

    const contractMap = useMemo(() => {
         try {
            if(provider) contractService.initializeContracts(provider, signer);
            return contractService.getContract(contractName);
         } catch (e) {
             console.warn(`AagesLend | Engine initialization delay -> ${e.message}`);
             return null;
         }
    }, [provider, signer, contractName]);

    return contractMap;
};
