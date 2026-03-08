/**
 * Format a Prisma Decimal or number value to a string with 2 decimal places
 * @param {number|object} value - The value to format (Decimal or number)
 * @returns {string} - The formatted value with 2 decimal places
 */
const formatDecimal = (value) => {
  if (value === null || value === undefined) {
    return '0.00';
  }

  // Convert Decimal to number
  const numValue = typeof value === 'object' && value.toNumber
    ? value.toNumber()
    : Number(value);

  return numValue.toFixed(2);
};

/**
 * Format all Decimal fields in an object to strings with 2 decimal places
 * @param {object} obj - The object containing Decimal fields
 * @param {string[]} fields - Array of field names to format
 * @returns {object} - A new object with formatted decimal fields
 */
const formatObjectDecimals = (obj, fields) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const result = { ...obj };

  for (const field of fields) {
    if (result[field] !== undefined) {
      result[field] = formatDecimal(result[field]);
    }
  }

  return result;
};

module.exports = {
  formatDecimal,
  formatObjectDecimals,
};
