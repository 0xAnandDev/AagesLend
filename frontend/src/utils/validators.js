import { ethers } from 'ethers';

/**
 * Validates an Ethereum address
 * @param {string} address - The address to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const validateAddress = (address) => {
  if (!address || typeof address !== 'string') return false;
  try {
    // Check if it's a valid hex address
    // We use isAddress from ethers.js to also support checksum validation
    return ethers.utils.isAddress(address);
  } catch (e) {
    return false;
  }
};

/**
 * Validates a numerical amount
 * @param {string|number} amount - The amount to validate
 * @param {number} decimals - Expected decimal places (default 18)
 * @returns {boolean} True if valid, false otherwise
 */
export const validateAmount = (amount, decimals = 18) => {
  if (!amount || Number.isNaN(Number(amount))) return false;
  
  if (Number(amount) <= 0) return false;

  try {
    // Check if the amount has more decimals than allowed
    const amountString = String(amount);
    if (amountString.includes('.')) {
      const parts = amountString.split('.');
      if (parts[1].length > decimals) return false;
    }
    
    // Attempt parse to ensure it fits in BigNumber constraints without overflow
    ethers.utils.parseUnits(amountString, decimals);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Validates an ERC20 token symbol 
 * Basic validation mostly against XSS / injection attacks
 * @param {string} symbol
 * @returns {boolean}
 */
export const validateTokenSymbol = (symbol) => {
  if (!symbol || typeof symbol !== 'string') return false;
  
  // Standard symbols are uppercase A-Z and sometimes numbers, 1-10 chars.
  // Allow slightly more relaxed but protect against special characters for XSS safety
  const symbolRegex = /^[a-zA-Z0-9]{1,15}$/;
  return symbolRegex.test(symbol);
};

/**
 * Basic XSS sanitizer. In a complex app prefer DOMPurify.
 * @param {string} str 
 * @returns {string} Sanitized string
 */
export const sanitizeInput = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};
