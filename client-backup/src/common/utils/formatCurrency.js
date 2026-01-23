// Utility function to format currency
const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return "Rp0";

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) return "Rp0";

  return `Rp${numAmount.toLocaleString("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

export default formatCurrency;