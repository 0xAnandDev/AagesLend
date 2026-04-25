/**
 * Enhanced Error Handler for AagesLend
 * Categorizes errors and provides user-friendly messages.
 */

export const ErrorType = {
  NETWORK: 'NETWORK',
  CONTRACT: 'CONTRACT',
  USER: 'USER',
  WALLET: 'WALLET',
  UNKNOWN: 'UNKNOWN'
};

export const handleError = (error, context = '') => {
  // Log error to console in development
  if (import.meta.env.MODE !== 'production') {
    console.error(`[Error] ${context}:`, error);
  }

  // TODO: Add production logging service integration here (e.g., Sentry)

  const errorDetail = {
    type: ErrorType.UNKNOWN,
    message: 'An unexpected error occurred. Please try again.',
    originalError: error,
    code: null
  };

  if (!error) return errorDetail;

  const errorString = error.message ? error.message.toLowerCase() : String(error).toLowerCase();

  // 1. Network Errors
  if (
    errorString.includes('network error') ||
    errorString.includes('fetch failed') ||
    errorString.includes('timeout') ||
    !navigator.onLine
  ) {
    errorDetail.type = ErrorType.NETWORK;
    errorDetail.message = 'Network error. Please check your internet connection and try again.';
    return errorDetail;
  }

  // 2. Wallet Errors (e.g., MetaMask rejection)
  if (error.code === 4001 || errorString.includes('user rejected')) {
    errorDetail.type = ErrorType.WALLET;
    errorDetail.message = 'Transaction was rejected in your wallet.';
    errorDetail.code = 4001;
    return errorDetail;
  }
  
  if (errorString.includes('wrong network') || errorString.includes('unsupported chain')) {
    errorDetail.type = ErrorType.WALLET;
    errorDetail.message = 'Please switch to the correct network in your wallet.';
    return errorDetail;
  }

  // 3. Contract / Blockchain Errors
  if (errorString.includes('insufficient funds') || errorString.includes('exceeds balance') || errorString.includes('insufficient balance')) {
    errorDetail.type = ErrorType.USER;
    errorDetail.message = 'Insufficient balance for this transaction.';
    return errorDetail;
  }

  if (errorString.includes('subtraction overflow')) {
    errorDetail.type = ErrorType.USER;
    errorDetail.message = 'Invalid amount entered.';
    return errorDetail;
  }

  if (errorString.includes('revert') || error.code === -32000 || error.code === -32603) {
    errorDetail.type = ErrorType.CONTRACT;
    // Extract revert reason if possible
    const match = errorString.match(/reverted with reason string '([^']+)'/);
    if (match && match[1]) {
      errorDetail.message = `Transaction failed: ${match[1]}`;
    } else {
      errorDetail.message = 'Transaction failed or reverted by the contract.';
    }
    return errorDetail;
  }

  if (errorString.includes('gas required exceeds allowance') || errorString.includes('out of gas')) {
    errorDetail.type = ErrorType.CONTRACT;
    errorDetail.message = 'Transaction failed due to insufficient gas.';
    return errorDetail;
  }

  // Fallback for user related
  if (errorString.includes('invalid address')) {
    errorDetail.type = ErrorType.USER;
    errorDetail.message = 'Invalid address provided.';
    return errorDetail;
  }

  return errorDetail;
};
