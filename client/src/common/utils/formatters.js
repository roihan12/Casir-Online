/**
 * Format a number as Indonesian Rupiah
 * @param {number} value - The number to format
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (value) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Format a date string to Indonesian format
 * @param {string} dateString - The date string to format
 * @returns {string} - Formatted date string
 */
export const formatDate = (dateString) => {
  if (!dateString) return "-";

  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

/**
 * Format a number with thousands separator
 * @param {number} value - The number to format
 * @returns {string} - Formatted number
 */
export const formatNumber = (value) => {
  return new Intl.NumberFormat("id-ID").format(value);
};
