export const calculatePositionValues = (deposited, borrowed, price, ltvLimit = 8000) => {
  const depositedUSD = deposited * price;
  const borrowedUSD = borrowed * price;
  // maxBorrowUSD = depositedUSD * (ltv / 10000)
  const maxBorrowUSD = depositedUSD * (ltvLimit / 10000);
  const utilization = maxBorrowUSD > 0 ? (borrowedUSD / maxBorrowUSD) * 100 : 0;

  return {
    depositedUSD,
    borrowedUSD,
    maxBorrowUSD,
    utilization
  };
};

export const calculateTotals = (positions) => {
  let totalCollateralUSD = 0;
  let totalBorrowUSD = 0;
  let totalBorrowLimitUSD = 0;

  positions.forEach(pos => {
    if (pos.isCollateral !== false) {
      totalCollateralUSD += pos.depositedUSD;
      totalBorrowLimitUSD += pos.maxBorrowUSD;
    }
    totalBorrowUSD += pos.borrowedUSD;
  });

  const utilizationPercent = totalBorrowLimitUSD > 0 
    ? (totalBorrowUSD / totalBorrowLimitUSD) * 100 
    : 0;

  return {
    totalCollateralUSD,
    totalBorrowUSD,
    totalBorrowLimitUSD,
    utilizationPercent
  };
};

export const getRiskColor = (utilization) => {
  if (utilization < 60) return '#10b981'; // Green
  if (utilization <= 85) return '#f59e0b'; // Yellow
  return '#ef4444'; // Red
};
