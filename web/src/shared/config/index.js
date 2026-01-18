// App Configuration
export const APP_CONFIG = {
  name: 'Casir Online',
  version: '2.0.0',
  description: 'Sistem Kasir Online',
  language: 'id', // Indonesia
};

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/me',
  },
  USERS: '/users',
  PRODUCTS: '/produk',
  TRANSACTIONS: '/transaksi',
  INVENTORY: '/inventory',
  CUSTOMERS: '/pelanggan',
  SUPPLIERS: '/supplier',
  BRANCHES: '/cabang',
  CATEGORIES: '/kategori',
  REPORTS: {
    SALES: '/transaksi/reports/sales',
    INVENTORY: '/inventory-report',
    FINANCIAL: '/financial-report',
  },
};

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
};

// Toast duration
export const TOAST_DURATION = 3000;
