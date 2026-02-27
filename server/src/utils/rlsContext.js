/**
 * RLS Context - AsyncLocalStorage untuk menyimpan user context per request
 *
 * Digunakan oleh:
 * - authMiddleware.js → set context setelah autentikasi
 * - db.js → baca context untuk SET session variables di PostgreSQL
 */
const { AsyncLocalStorage } = require("node:async_hooks");

const rlsStorage = new AsyncLocalStorage();

/**
 * Set RLS context untuk request saat ini
 * @param {Object} context
 * @param {string} context.userId - ID user yang sedang login
 * @param {string[]} context.cabangIds - Array cabang_id yang bisa diakses user
 * @param {Function} callback - Function yang dijalankan dalam context
 */
const runWithRlsContext = (context, callback) => {
  return rlsStorage.run(context, callback);
};

/**
 * Ambil RLS context dari request saat ini
 * @returns {{ userId: string, cabangIds: string[] } | undefined}
 */
const getRlsContext = () => {
  return rlsStorage.getStore();
};

module.exports = {
  runWithRlsContext,
  getRlsContext,
};
