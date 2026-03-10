const { logger } = require("./logger");

async function generateTransferNumber({
  cabangAsalId,
  cabangTujuanId,
  tanggalKirim = new Date(),
  sequence = 1,
}) {

  logger.info(cabangAsalId, cabangTujuanId, tanggalKirim, sequence);

  // Validate input parameters
  if (!cabangAsalId || !cabangTujuanId) {
    throw new Error("Origin and destination branch IDs are required");
  }

  // Extract branch code (assuming first 3 characters of branch ID)
  const cabangAsalCode = cabangAsalId.substring(0, 3).toUpperCase();
  const cabangTujuanCode = cabangTujuanId.substring(0, 3).toUpperCase();

  // Format date components
  const year = tanggalKirim.getFullYear().toString().slice(-2);
  const month = String(tanggalKirim.getMonth() + 1).padStart(2, "0");
  const day = String(tanggalKirim.getDate()).padStart(2, "0");

  // Pad sequence number to 4 digits
  const paddedSequence = String(sequence).padStart(4, "0");

  // Construct transfer number
  // Format: TR-[ASAL]-[TUJUAN]-[YYMMDD]-[SEQUENCE]
  const transferNumber = `TR-${cabangAsalCode}-${cabangTujuanCode}-${year}${month}${day}-${paddedSequence}`;

  return transferNumber;
}

/**
 * Create a transfer number generator with a counter to ensure uniqueness
 * @returns {Object} Transfer number generator with methods
 */
function createTransferNumberGenerator() {
  const sequenceCounter = new Map();

  return {
    /**
     * Generate a unique transfer number
     * @param {Object} params - Parameters for generating transfer number
     * @param {string} params.cabangAsalId - ID of the origin branch
     * @param {string} params.cabangTujuanId - ID of the destination branch
     * @param {Date} [params.tanggalKirim] - Date of transfer
     * @returns {string} Unique transfer number
     */
    generate: function (params) {
      const key = `${params.cabangAsalId}-${params.cabangTujuanId}-${
        params.tanggalKirim?.toISOString().split("T")[0] || "default"
      }`;

      // Increment sequence for this specific combination
      const currentSequence = (sequenceCounter.get(key) || 0) + 1;
      sequenceCounter.set(key, currentSequence);

      return generateTransferNumber({
        ...params,
        sequence: currentSequence,
      });
    },

    /**
     * Reset the sequence counter (useful for testing or new day)
     */
    reset: function () {
      sequenceCounter.clear();
    },
  };
}

module.exports = {
  generateTransferNumber,
  createTransferNumberGenerator,
};
