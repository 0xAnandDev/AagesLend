import { useContext } from 'react';
import { Web3Context } from '../contexts/Web3Context';

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 mapped outside Web3Provider layout context limits');
  }
  return context;
};
