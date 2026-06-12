// Moneda local venezolana (Bolívares)
export const formatBs = (amount: number): string => {
  return `Bs. ${amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatUsd = (amount: number): string => {
  return `$${amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const convertUsdToBs = (usdAmount: number, rate: number): number => {
  return usdAmount * rate;
};
