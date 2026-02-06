/**
 * Utility functions to handle BigInt serialization
 * file: src/utils/bigintSerializer.js
 */

/**
 * Converts BigInt and Prisma Decimal values to regular numbers or strings in an object or array
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

    if (data instanceof Date) {
      return data; // Return Date as-is, JSON.stringify will handle it
    }
    
    // Handle arrays
    if (Array.isArray(data)) {
      return data.map(item => sanitizeBigInt(item, asString));
    }
    
    // Handle Prisma Decimal objects (they have a specific structure: {s, e, d})
    // Note: Prisma Decimal has toNumber() method, but raw queries return plain objects
    if (typeof data === 'object') {
      // Check if it's a Prisma Decimal-like object
      if (data.constructor && data.constructor.name === 'Decimal') {
        // If it has toNumber method (Prisma Decimal instance)
        return data.toNumber ? data.toNumber() : Number(data.toString());
      }
      
      // Check for Prisma Decimal plain object structure {s, e, d}
      if (data.s !== undefined && data.e !== undefined && data.d !== undefined) {
        // Convert Prisma Decimal plain object to number
        // s = sign (1 or -1), e = exponent, d = significand digits array
        const sign = data.s;
        const exponent = data.e;
        const digits = data.d;
        
        // Reconstruct the number
        let numStr = digits.join('');
        const decimalPos = exponent + 1;
        
        if (decimalPos <= 0) {
          numStr = '0.' + '0'.repeat(-decimalPos) + numStr;
        } else if (decimalPos < numStr.length) {
          numStr = numStr.slice(0, decimalPos) + '.' + numStr.slice(decimalPos);
        } else {
          numStr = numStr + '0'.repeat(decimalPos - numStr.length);
        }
        
        const result = parseFloat(numStr) * sign;
        return asString ? result.toString() : result;
      }
      
      // Regular object - recursively sanitize properties
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