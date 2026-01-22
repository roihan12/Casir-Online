/**
 * Widget Registry - Maps dashboard widgets to their required permissions.
 * The DashboardPage uses this registry to dynamically render only
 * the widgets that the current user has permission to see.
 */

// Widget Components (lazy loaded for performance)
import { lazy } from 'react';

// -- Stats Widgets --
const GlobalStatsCard = lazy(() => import('../../../components/superadmin/GlobalStatsCard'));
// -- Chart Widgets --
const SalesTrendChart = lazy(() => import('../../common/SalesTrendChart'));
const PaymentMethodChart = lazy(() => import('../../common/PaymentMethodChart'));
const ChartCategoryDistribution = lazy(() => import('../../common/ChartCategoryDistribution'));
const StockHealthCard = lazy(() => import('../../common/StockHealthCard'));
const BranchPerformanceCard = lazy(() => import('../components/BranchPerformanceCard'));
// -- Table Widgets --
const ProductTable = lazy(() => import('../../common/ProductTable'));
const StaffActivityTable = lazy(() => import('../../common/StaffActivityTable'));
// -- Alert Widgets --
const AlertLowStockProduct = lazy(() => import('../../common/AlertLowStockProduct'));

/**
 * Widget configuration object.
 * @typedef {Object} WidgetConfig
 * @property {string} id - Unique identifier for the widget.
 * @property {string} name - Display name for the widget.
 * @property {React.LazyExoticComponent} component - The React component to render.
 * @property {string|string[]} permission - Required permission(s). If array, user needs ANY of them.
 * @property {'stats'|'chart'|'table'|'alert'} type - Widget type for layout grouping.
 * @property {Object} gridSize - Colspan for responsive grid (out of 12).
 * @property {number} order - Display order within its type group.
 */

export const WIDGET_TYPES = {
  STATS: 'stats',
  CHART: 'chart',
  TABLE: 'table',
  ALERT: 'alert',
};

/**
 * The main registry of all available dashboard widgets.
 * @type {WidgetConfig[]}
 */
export const WIDGETS = [
  // ===== ALERT WIDGETS =====
  {
    id: 'low_stock_alert',
    name: 'Peringatan Stok Rendah',
    component: AlertLowStockProduct,
    permission: 'stock_notification:read',
    type: WIDGET_TYPES.ALERT,
    gridSize: { mobile: 12, desktop: 12 },
    order: 1,
  },

  // ===== STATS WIDGETS (Row 1) =====
  {
    id: 'daily_sales',
    name: 'Penjualan Hari Ini',
    component: GlobalStatsCard,
    permission: ['dashboard:read', 'transaksi:read'],
    type: WIDGET_TYPES.STATS,
    gridSize: { mobile: 6, desktop: 3 },
    order: 1,
    props: { statsKey: 'daily', icon: 'ShoppingBag', title: 'Penjualan Hari Ini' },
  },
  {
    id: 'weekly_sales',
    name: 'Penjualan Minggu Ini',
    component: GlobalStatsCard,
    permission: ['dashboard:read', 'laporan:read'],
    type: WIDGET_TYPES.STATS,
    gridSize: { mobile: 6, desktop: 3 },
    order: 2,
    props: { statsKey: 'weekly', icon: 'TrendingUp', title: 'Penjualan Minggu Ini' },
  },
  {
    id: 'monthly_sales',
    name: 'Penjualan Bulan Ini',
    component: GlobalStatsCard,
    permission: ['dashboard:read', 'laporan:read'],
    type: WIDGET_TYPES.STATS,
    gridSize: { mobile: 6, desktop: 3 },
    order: 3,
    props: { statsKey: 'monthly', icon: 'TrendingUp', title: 'Penjualan Bulan Ini' },
  },
  {
    id: 'yearly_sales',
    name: 'Penjualan Tahun Ini',
    component: GlobalStatsCard,
    permission: ['dashboard:read', 'laporan:read'],
    type: WIDGET_TYPES.STATS,
    gridSize: { mobile: 6, desktop: 3 },
    order: 4,
    props: { statsKey: 'yearly', icon: 'TrendingUp', title: 'Penjualan Tahun Ini' },
  },

  // ===== STATS WIDGETS (Row 2) =====
  {
    id: 'daily_transactions',
    name: 'Transaksi Hari Ini',
    component: GlobalStatsCard,
    permission: ['dashboard:read', 'transaksi:read'],
    type: WIDGET_TYPES.STATS,
    gridSize: { mobile: 6, desktop: 3 },
    order: 5,
    props: { statsKey: 'transactions', icon: 'CreditCard', title: 'Transaksi Hari Ini' },
  },
  {
    id: 'avg_transaction',
    name: 'Rata-rata Transaksi',
    component: GlobalStatsCard,
    permission: ['dashboard:read', 'laporan:read'],
    type: WIDGET_TYPES.STATS,
    gridSize: { mobile: 6, desktop: 3 },
    order: 6,
    props: { statsKey: 'average', icon: 'DollarSign', title: 'Rata-rata Transaksi' },
  },
  {
    id: 'total_transactions',
    name: 'Total Transaksi',
    component: GlobalStatsCard,
    permission: ['dashboard:read', 'transaksi:read'],
    type: WIDGET_TYPES.STATS,
    gridSize: { mobile: 6, desktop: 3 },
    order: 7,
    props: { statsKey: 'total', icon: 'CreditCard', title: 'Total Transaksi' },
  },
  {
    id: 'stock_health',
    name: 'Ketersediaan Stok',
    component: GlobalStatsCard,
    permission: ['dashboard:read', 'inventory:read'],
    type: WIDGET_TYPES.STATS,
    gridSize: { mobile: 6, desktop: 3 },
    order: 8,
    props: { statsKey: 'stock', icon: 'Box', title: 'Ketersediaan Stok' },
  },

  // ===== CHART WIDGETS =====
  {
    id: 'category_distribution',
    name: 'Distribusi Kategori',
    component: ChartCategoryDistribution,
    permission: ['produk:read', 'laporan:read'],
    type: WIDGET_TYPES.CHART,
    gridSize: { mobile: 12, desktop: 6 },
    order: 1,
  },
  {
    id: 'payment_methods',
    name: 'Metode Pembayaran',
    component: PaymentMethodChart,
    permission: ['pembayaran:read', 'laporan:read'],
    type: WIDGET_TYPES.CHART,
    gridSize: { mobile: 12, desktop: 6 },
    order: 2,
  },
  {
    id: 'sales_trend',
    name: 'Tren Penjualan',
    component: SalesTrendChart,
    permission: ['laporan:read', 'transaksi:read'],
    type: WIDGET_TYPES.CHART,
    gridSize: { mobile: 12, desktop: 12 },
    order: 3,
  },
  {
    id: 'stock_health_chart',
    name: 'Kesehatan Stok',
    component: StockHealthCard,
    permission: ['inventory:read', 'stock_notification:read'],
    type: WIDGET_TYPES.CHART,
    gridSize: { mobile: 12, desktop: 6 },
    order: 4,
  },
  {
    id: 'branch_performance',
    name: 'Performa Cabang',
    component: BranchPerformanceCard,
    permission: 'laporan_cabang:read',
    type: WIDGET_TYPES.CHART,
    gridSize: { mobile: 12, desktop: 6 },
    order: 5,
  },

  // ===== TABLE WIDGETS =====
  {
    id: 'top_products',
    name: 'Produk Terlaris',
    component: ProductTable,
    permission: ['produk:read', 'laporan:read'],
    type: WIDGET_TYPES.TABLE,
    gridSize: { mobile: 12, desktop: 12 },
    order: 1,
  },
  {
    id: 'staff_activity',
    name: 'Aktivitas Staff',
    component: StaffActivityTable,
    permission: 'audit:read',
    type: WIDGET_TYPES.TABLE,
    gridSize: { mobile: 12, desktop: 12 },
    order: 2,
  },
];

/**
 * Helper function to filter widgets by user permissions.
 * @param {string[]} userPermissions - Array of user's permissions.
 * @returns {WidgetConfig[]} - Filtered list of widgets the user can see.
 */
export const getAuthorizedWidgets = (userPermissions) => {
  if (!userPermissions || userPermissions.length === 0) {
    return [];
  }

  return WIDGETS.filter((widget) => {
    const requiredPermissions = Array.isArray(widget.permission)
      ? widget.permission
      : [widget.permission];

    // User needs ANY of the required permissions
    return requiredPermissions.some((perm) => userPermissions.includes(perm));
  });
};

/**
 * Group widgets by type for structured rendering.
 * @param {WidgetConfig[]} widgets - List of widget configurations.
 * @returns {Object} - Widgets grouped by type.
 */
export const groupWidgetsByType = (widgets) => {
  const grouped = {
    [WIDGET_TYPES.ALERT]: [],
    [WIDGET_TYPES.STATS]: [],
    [WIDGET_TYPES.CHART]: [],
    [WIDGET_TYPES.TABLE]: [],
  };

  widgets.forEach((widget) => {
    if (grouped[widget.type]) {
      grouped[widget.type].push(widget);
    }
  });

  // Sort each group by order
  Object.keys(grouped).forEach((type) => {
    grouped[type].sort((a, b) => a.order - b.order);
  });

  return grouped;
};

export default WIDGETS;
