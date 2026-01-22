// Application Configuration

// Base API URL - Change this based on environment
export const API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Default pagination limits
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// Default date format
export const DEFAULT_DATE_FORMAT = "dd/MM/yyyy";
export const DEFAULT_DATETIME_FORMAT = "dd/MM/yyyy HH:mm";

// Default currency format
export const CURRENCY_FORMAT = "IDR";
export const CURRENCY = "Rp";
export const CURRENCY_FORMATTER = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
});

// Timeout for API requests (in milliseconds)
export const API_TIMEOUT = 30000;

// Default theme
export const DEFAULT_THEME = "light";

// Default language
export const DEFAULT_LANGUAGE = "id";

// File upload limits
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
];

// Local storage keys
export const STORAGE_KEYS = {
  THEME: "casir-theme",
  LANGUAGE: "casir-language",
  AUTH_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
  SELECTED_CABANG: "selectedCabang",
};

// System constants
export const SYSTEM = {
  NAME: "CASIR Online",
  VERSION: "1.0.0",
};

// Authentication Configuration
export const AUTH_TOKEN_KEY = 'accessToken';
export const REFRESH_TOKEN_KEY = 'refreshToken';
export const TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000; // 5 minutes in milliseconds

// Feature Flags
export const FEATURES = {
  WHATSAPP_INTEGRATION: true,
  LOYALTY_PROGRAM: true,
  CREDIT_MANAGEMENT: true,
  INVENTORY_MANAGEMENT: true,
  MARKETING_CAMPAIGNS: true,
};

// Role Definitions
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN_CABANG: 'admin_cabang',
  KASIR: 'kasir',
  GUDANG: 'gudang',
  MANAJER: 'manajer',
};

// Permission Definitions
export const PERMISSIONS = {
  // User Management
  VIEW_USERS: 'view_users',
  CREATE_USER: 'create_user',
  EDIT_USER: 'edit_user',
  DELETE_USER: 'delete_user',
  
  // Branch Management
  VIEW_BRANCHES: 'view_branches',
  CREATE_BRANCH: 'create_branch',
  EDIT_BRANCH: 'edit_branch',
  DELETE_BRANCH: 'delete_branch',
  
  // Product Management
  VIEW_PRODUCTS: 'view_products',
  CREATE_PRODUCT: 'create_product',
  EDIT_PRODUCT: 'edit_product',
  DELETE_PRODUCT: 'delete_product',
  
  // Inventory Management
  VIEW_INVENTORY: 'view_inventory',
  ADJUST_INVENTORY: 'adjust_inventory',
  TRANSFER_INVENTORY: 'transfer_inventory',
  
  // Transaction Management
  CREATE_TRANSACTION: 'create_transaction',
  VIEW_TRANSACTIONS: 'view_transactions',
  VOID_TRANSACTION: 'void_transaction',
  PROCESS_RETURN: 'process_return',
  
  // Report Access
  VIEW_SALES_REPORTS: 'view_sales_reports',
  VIEW_INVENTORY_REPORTS: 'view_inventory_reports',
  VIEW_FINANCIAL_REPORTS: 'view_financial_reports',
  
  // Shift Management
  OPEN_SHIFT: 'open_shift',
  CLOSE_SHIFT: 'close_shift',
  VIEW_SHIFT_REPORTS: 'view_shift_reports',
  
  // Customer Management
  VIEW_CUSTOMERS: 'view_customers',
  CREATE_CUSTOMER: 'create_customer',
  EDIT_CUSTOMER: 'edit_customer',
  DELETE_CUSTOMER: 'delete_customer',
  
  // Supplier Management
  VIEW_SUPPLIERS: 'view_suppliers',
  CREATE_SUPPLIER: 'create_supplier',
  EDIT_SUPPLIER: 'edit_supplier',
  DELETE_SUPPLIER: 'delete_supplier',
  
  // Promo & Discount Management
  VIEW_PROMOS: 'view_promos',
  CREATE_PROMO: 'create_promo',
  EDIT_PROMO: 'edit_promo',
  DELETE_PROMO: 'delete_promo',
  
  // Marketing Management
  VIEW_MARKETING: 'view_marketing',
  CREATE_CAMPAIGN: 'create_campaign',
  EDIT_CAMPAIGN: 'edit_campaign',
  DELETE_CAMPAIGN: 'delete_campaign',
  
  // WhatsApp Integration
  VIEW_WHATSAPP: 'view_whatsapp',
  CONFIGURE_WHATSAPP: 'configure_whatsapp',
  SEND_WHATSAPP: 'send_whatsapp',
};

// Theme settings
export const THEME = {
  PRIMARY_COLOR: '#4F46E5',
  SECONDARY_COLOR: '#10B981',
  DANGER_COLOR: '#EF4444',
  WARNING_COLOR: '#F59E0B',
  INFO_COLOR: '#3B82F6',
  SUCCESS_COLOR: '#10B981',
};
