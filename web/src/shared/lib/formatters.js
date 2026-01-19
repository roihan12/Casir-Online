/**
 * Format number to Indonesian Rupiah
 * @param {number} value - Number to format
 * @returns {string} Formatted currency string
 */
export const formatRupiah = (value) => {
  if (value === null || value === undefined) return 'Rp 0';
  
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Format number with thousand separators
 * @param {number} value - Number to format
 * @returns {string} Formatted number string
 */
export const formatNumber = (value) => {
  if (value === null || value === undefined) return '0';
  
  return new Intl.NumberFormat('id-ID').format(value);
};

/**
 * Format percentage
 * @param {number} value - Percentage value
 * @param {boolean} showSign - Show + sign for positive values
 * @returns {string} Formatted percentage string
 */
export const formatPercent = (value, showSign = true) => {
  if (value === null || value === undefined) return '0%';
  
  const sign = showSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
};

/**
 * Format date to Indonesian format
 * @param {string|Date} date - Date to format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '-';
  
  const defaultOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  };
  
  return new Intl.DateTimeFormat('id-ID', defaultOptions).format(new Date(date));
};

/**
 * Format time
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted time string (HH:MM)
 */
export const formatTime = (date) => {
  if (!date) return '-';
  
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

/**
 * Format datetime
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted datetime string
 */
export const formatDateTime = (date) => {
  if (!date) return '-';
  
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

/**
 * Get relative time (e.g., "2 jam lalu")
 * @param {string|Date} date - Date to compare
 * @returns {string} Relative time string
 */
export const getRelativeTime = (date) => {
  if (!date) return '-';
  
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 60) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;
  
  return formatDate(date);
};
