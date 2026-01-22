/**
 * Format nilai ke dalam bentuk mata uang Rupiah
 * @param {number} amount - Nilai yang akan diformat
 * @return {string} Nilai dalam format mata uang Rupiah (contoh: Rp 100.000)
 */
export const formatCurrency = (amount) => {
  // Parse amount to number if it's a string
  const numericAmount =
    typeof amount === "string" ? parseFloat(amount) : amount;

  // If not a valid number, return default
  if (isNaN(numericAmount)) {
    return "Rp 0";
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numericAmount);
};

/**
 * Format tanggal ke dalam format yang sesuai dengan locale Indonesia
 * @param {string|Date} date - Tanggal yang akan diformat
 * @param {Object} options - Opsi formatting tambahan
 * @return {string} Tanggal yang telah diformat (contoh: 01 Jan 2023)
 */
export const formatDate = (date, options = {}) => {
  if (!date) return "-";

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return "-";
    }

    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      ...options,
    }).format(dateObj);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "-";
  }
};

/**
 * Format tanggal dan waktu
 * @param {string|Date} datetime - Tanggal dan waktu yang akan diformat
 * @return {string} Tanggal dan waktu yang telah diformat (contoh: 01 Jan 2023, 13:45)
 */
export const formatDateTime = (datetime) => {
  if (!datetime) return "-";

  try {
    const dateObj =
      typeof datetime === "string" ? new Date(datetime) : datetime;

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return "-";
    }

    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(dateObj);
  } catch (error) {
    console.error("Error formatting datetime:", error);
    return "-";
  }
};

/**
 * Format angka dengan pemisah ribuan
 * @param {number} number - Angka yang akan diformat
 * @param {number} decimals - Jumlah angka di belakang koma
 * @return {string} Angka yang telah diformat (contoh: 1.000,50)
 */
export const formatNumber = (number, decimals = 0) => {
  if (number === undefined || number === null) return "0";

  const numericValue = typeof number === "string" ? parseFloat(number) : number;

  if (isNaN(numericValue)) {
    return "0";
  }

  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numericValue);
};
