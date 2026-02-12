// Utility functions for formatting values

/**
 * Format a number as Indonesian Rupiah
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
export const formatRupiah = (amount) => {
  if (amount === undefined || amount === null) return "Rp0";

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) return "Rp0";

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount);
};

/**
 * Format a date to Indonesian format
 * @param {Date|string} date - The date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return "-";
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return "-";
  
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(dateObj);
};

/**
 * Format a number with thousand separators
 * @param {number} number - The number to format
 * @returns {string} Formatted number string
 */
export const formatNumber = (number) => {
  if (number === undefined || number === null) return "0";
  
  const numValue = parseFloat(number);
  if (isNaN(numValue)) return "0";
  
  return numValue.toLocaleString("id-ID");
};

/**
 * Format a percentage value
 * @param {number} value - The percentage value
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value) => {
  if (value === undefined || value === null) return "0%";
  
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return "0%";
  
  return `${numValue.toLocaleString("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
};

/**
 * Format a phone number
 * @param {string} phone - The phone number
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return "-";
  
  // Basic formatting for Indonesian numbers
  if (phone.startsWith("0")) {
    return phone.replace(/(\d{4})(\d{4,})/, "$1-$2");
  }
  
  if (phone.startsWith("+62")) {
    return phone.replace(/\+62(\d{3,4})(\d{4,})/, "+62 $1-$2");
  }
  
  return phone;
};
