export const LIQUIDATION_THRESHOLD = 0.8;

export const calculateHealthFactor = (collateralUSD, borrowUSD) => {
  if (borrowUSD === 0) return Infinity; // Safe if no borrow
  return (collateralUSD * LIQUIDATION_THRESHOLD) / borrowUSD;
};

export const getRiskLevel = (healthFactor) => {
  if (healthFactor > 1.5) return 'SAFE';
  if (healthFactor >= 1.1 && healthFactor <= 1.5) return 'WARNING';
  if (healthFactor >= 1.0 && healthFactor < 1.1) return 'AT RISK';
  return 'LIQUIDATABLE';
};

export const getRiskColor = (riskLevel) => {
  switch (riskLevel) {
    case 'SAFE':
      return '#10b981'; // Green
    case 'WARNING':
      return '#eab308'; // Yellow
    case 'AT RISK':
      return '#f97316'; // Orange
    case 'LIQUIDATABLE':
      return '#ef4444'; // Red
    default:
      return '#9ca3af'; // Grey
  }
};
