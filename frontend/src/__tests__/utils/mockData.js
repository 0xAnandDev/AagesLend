export const MOCK_USER_ADDRESS = '0x1234567890123456789012345678901234567890';

export const MOCK_POOL_DATA = {
  totalSupplied: '1000.5',
  totalBorrowed: '500.25',
  utilizationRate: '50',
  apy: '5.5',
};

export const MOCK_USER_BALANCES = {
  walletBalance: '10.5',
  suppliedBalance: '5.0',
  borrowedBalance: '2.5',
  healthFactor: '1.5',
};

export const MOCK_TRANSACTIONS = [
  {
    id: '1',
    hash: '0xabc123',
    type: 'deposit',
    amount: '1.5',
    token: 'ETH',
    timestamp: Date.now() - 3600000,
    status: 'completed'
  },
  {
    id: '2',
    hash: '0xdef456',
    type: 'borrow',
    amount: '500',
    token: 'USDT',
    timestamp: Date.now() - 7200000,
    status: 'completed'
  }
];
