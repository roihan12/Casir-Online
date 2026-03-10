const { redisClient } = require("../config/redis");
const { logger } = require("./logger");

/**
 * Menyimpan data ke Redis dengan TTL (Time-to-Live)
 * @param {string} key - Kunci Redis
 * @param {any} data - Data yang akan disimpan (akan dikonversi ke JSON)
 * @param {number} ttlSeconds - Waktu TTL dalam detik, default 1 hari (86400 detik)
 * @returns {Promise<string>} - Status operasi
 */
/**
 * Store data in Redis cache with BigInt support
 * @param {string} key - Redis key
 * @param {any} data - Data to store
 * @param {number} ttlSeconds - Time to live in seconds (default: 24 hours)
 * @returns {Promise<any>} - Redis setex operation result
 */
const cacheSet = async (key, data, ttlSeconds = 86400) => {
  try {
    // Simple replacer function that converts BigInt to tagged string object
    const serializedData = JSON.stringify(data, (key, value) =>
      typeof value === "bigint" ? { __type: "bigint", value: value.toString() } : value
    );
    
    return await redisClient.setex(key, ttlSeconds, serializedData);
  } catch (error) {
    logger.error(`Cache set error for key "${key}":`, error);
    throw error;
  }
};

/**
 * Retrieve data from Redis with BigInt support
 * @param {string} key - Redis key
 * @returns {Promise<any>} - Parsed data or null if not found
 */
const cacheGet = async (key) => {
  try {
    const data = await redisClient.get(key);
    
    if (!data) return null;
    
    // Parse with reviver function to convert tagged BigInt strings back to BigInt
    return JSON.parse(data, (key, value) => {
      if (value !== null && 
          typeof value === 'object' && 
          value.__type === 'bigint') {
        return BigInt(value.value);
      }
      return value;
    });
  } catch (error) {
    logger.error(`Cache get error for key "${key}":`, error);
    throw error;
  }
};
/**
 * Menghapus data dari Redis
 * @param {string} key - Kunci Redis
 * @returns {Promise<number>} - Jumlah key yang dihapus (1 atau 0)
 */
const cacheDelete = async (key) => {
  return await redisClient.del(key);
};

/**
 * Menghapus beberapa data dari Redis berdasarkan pattern
 * @param {string} pattern - Pattern kunci Redis (misal: "user:*")
 * @returns {Promise<number>} - Jumlah key yang dihapus
 * @deprecated - Use cacheDeletePatternScan for non-blocking deletion
 */
const cacheDeletePattern = async (pattern) => {
  const keys = await redisClient.keys(pattern);
  if (keys.length === 0) return 0;

  return await redisClient.del(keys);
};

/**
 * Menghapus beberapa data dari Redis berdasarkan pattern menggunakan SCAN (non-blocking)
 * @param {string} pattern - Pattern kunci Redis (misal: "user:*")
 * @param {number} batchCount - Number of keys to fetch per SCAN iteration (default: 100)
 * @returns {Promise<number>} - Jumlah key yang dihapus
 */
const cacheDeletePatternScan = async (pattern, batchCount = 100) => {
  let cursor = "0";
  let totalDeleted = 0;

  do {
    try {
      const [nextCursor, keys] = await redisClient.scan(
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        batchCount
      );

      if (keys && keys.length > 0) {
        totalDeleted += await redisClient.del(keys);
      }

      cursor = nextCursor;
    } catch (error) {
      logger.error(`Error in cacheDeletePatternScan for pattern "${pattern}":`, error);
      throw error;
    }
  } while (cursor !== "0");

  return totalDeleted;
};

/**
 * Memeriksa apakah kunci ada di Redis
 * @param {string} key - Kunci Redis
 * @returns {Promise<boolean>} - true jika ada, false jika tidak
 */
const cacheExists = async (key) => {
  return (await redisClient.exists(key)) === 1;
};

/**
 * Mendapatkan TTL dari kunci di Redis
 * @param {string} key - Kunci Redis
 * @returns {Promise<number>} - TTL dalam detik, -1 jika kunci ada tapi tidak punya TTL, -2 jika kunci tidak ada
 */
const cacheTtl = async (key) => {
  return await redisClient.ttl(key);
};

/**
 * Menggabungkan nama-nama untuk membuat kunci Redis yang konsisten
 * @param {string} prefix - Prefix kunci (misal: "user", "session")
 * @param {string|number} id - ID atau identifikasi unik
 * @param {string} [suffix] - Suffix opsional
 * @returns {string} - Kunci Redis yang sudah diformat
 */
const createCacheKey = (prefix, id, suffix = "") => {
  return suffix ? `${prefix}:${id}:${suffix}` : `${prefix}:${id}`;
};

/**
 * Mengambil data dari cache jika ada, jika tidak ada ambil dari fungsi yang diberikan dan simpan ke cache
 * @param {string} key - Kunci Redis
 * @param {Function} fetchFunction - Fungsi async untuk mengambil data jika tidak ada di cache
 * @param {number} ttlSeconds - TTL dalam detik, default 1 hari
 * @returns {Promise<any>} - Data dari cache atau hasil fetchFunction
 */
const cacheOrFetch = async (key, fetchFunction, ttlSeconds = 86400) => {
  // Skip caching if Redis is disabled (e.g., in tests)
  if (process.env.REDIS_ENABLED === 'false') {
    return await fetchFunction();
  }

  try {
    // Coba ambil dari cache dulu
    const cachedData = await cacheGet(key);

    if (cachedData) {
      logger.debug(`Cache hit for key: ${key}`);
      return cachedData;
    }

    logger.debug(`Cache miss for key: ${key}, fetching data...`);
    // Jika tidak ada di cache, ambil dengan fetchFunction
    const data = await fetchFunction();

    // Simpan ke cache jika ada data
    if (data) {
      await cacheSet(key, data, ttlSeconds);
      logger.debug(`Data stored in cache with key: ${key}`);
    }

    return data;
  } catch (error) {
    logger.error(`Error in cacheOrFetch for key ${key}:`, error);
    // Fallback to fetching data directly if caching fails
    return await fetchFunction();
  }
};

/**
 * Menghitung TTL berdasarkan waktu kedaluwarsa
 * @param {Date|string} expiresAt - Waktu kedaluwarsa
 * @returns {number} - TTL dalam detik
 */
const calculateTtl = (expiresAt) => {
  const expires = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  const now = new Date();
  const ttlMs = expires.getTime() - now.getTime();

  // Jika sudah kedaluwarsa, kembalikan 0
  return ttlMs > 0 ? Math.floor(ttlMs / 1000) : 0;
};

module.exports = {
  cacheSet,
  cacheGet,
  cacheDelete,
  cacheDeletePattern,
  cacheDeletePatternScan,
  cacheExists,
  cacheTtl,
  createCacheKey,
  cacheOrFetch,
  calculateTtl,
};
