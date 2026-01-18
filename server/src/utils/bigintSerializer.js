/**
 * Utility functions to handle BigInt serialization
 * file: src/utils/bigintSerializer.js
 */

/**
 * Converts BigInt values to regular numbers or strings in an object or array
 * @param {*} data - The data to sanitize (object, array, or primitive)
 * @param {boolean} [asString=false] - Whether to convert BigInt to strings (true) or numbers (false)
 * @returns {*} The sanitized data
 */
const sanitizeBigInt = (data, asString = false) => {
    // Handle null/undefined
    if (data == null) {
      return data;
    }
    
    // Handle BigInt primitive
    if (typeof data === 'bigint') {
      return asString ? data.toString() : Number(data);
    }
    
    // Handle arrays
    if (Array.isArray(data)) {
      return data.map(item => sanitizeBigInt(item, asString));
    }
    
    // Handle objects
    if (typeof data === 'object') {
      const result = {};
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          result[key] = sanitizeBigInt(data[key], asString);
        }
      }
      return result;
    }
    
    // Return other primitives as is
    return data;
  };
  
  /**
   * Custom JSON replacer function for handling BigInt
   * Can be used with JSON.stringify
   */
  const bigIntReplacer = (key, value) => {
    return typeof value === 'bigint' ? value.toString() : value;
  };
  
  /**
   * Safe stringify for objects containing BigInt values
   * @param {*} data - The data to stringify
   * @returns {string} The JSON string
   */
  const safeJsonStringify = (data) => {
    return JSON.stringify(data, bigIntReplacer);
  };
  
  module.exports = {
    sanitizeBigInt,
    bigIntReplacer,
    safeJsonStringify
  };