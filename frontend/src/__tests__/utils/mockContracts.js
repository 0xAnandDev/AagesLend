export const mockContractInteraction = {
  deposit: jest.fn().mockResolvedValue({
    hash: '0xmockdeposit123',
    wait: jest.fn().mockResolvedValue(true)
  }),
  borrow: jest.fn().mockResolvedValue({
    hash: '0xmockborrow123',
    wait: jest.fn().mockResolvedValue(true)
  }),
  repay: jest.fn().mockResolvedValue({
    hash: '0xmockrepay123',
    wait: jest.fn().mockResolvedValue(true)
  }),
  withdraw: jest.fn().mockResolvedValue({
    hash: '0xmockwithdraw123',
    wait: jest.fn().mockResolvedValue(true)
  }),
  getAccountData: jest.fn().mockResolvedValue({
    totalCollateralETH: '1000000000000000000',
    totalDebtETH: '500000000000000000',
    availableBorrowsETH: '250000000000000000',
    currentLiquidationThreshold: '8000',
    ltv: '7500',
    healthFactor: '1500000000000000000' // 1.5 in 18 decimals
  }),
};

export const createMockProvider = () => {
  return {
    getSigner: jest.fn().mockResolvedValue({
      getAddress: jest.fn().mockResolvedValue('0x123...'),
    }),
    getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
  };
};
