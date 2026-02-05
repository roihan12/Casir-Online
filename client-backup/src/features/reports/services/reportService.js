import api from "@services/api";

/**
 * Report Service - API calls for report data and export
 */
const reportService = {
  /**
   * Get sales report data with pagination
   * @param {Object} params - Query parameters
   * @param {string} params.startDate - Start date (YYYY-MM-DD)
   * @param {string} params.endDate - End date (YYYY-MM-DD)
   * @param {string} params.cabangId - Branch ID (optional)
   * @param {string} params.viewType - View type (daily, weekly, monthly)
   * @param {number} params.page - Page number (optional, default: 1)
   * @param {number} params.limit - Items per page (optional, default: 50)
   */
  getSalesReport: async (params) => {
    const response = await api.get("/reports/sales", {
      params: {
        startDate: params.startDate,
        endDate: params.endDate,
        cabangId: params.cabangId,
        viewType: params.viewType || "daily",
        page: params.page || 1,
        limit: params.limit || 50,
      },
    });
    return response.data;
  },

  /**
   * Get sales summary metrics
   * @param {Object} params - Query parameters
   * @param {string} params.startDate - Start date (YYYY-MM-DD)
   * @param {string} params.endDate - End date (YYYY-MM-DD)
   * @param {string} params.cabangId - Branch ID (optional)
   */
  getSalesSummary: async (params) => {
    const response = await api.get("/reports/sales/summary", {
      params: {
        startDate: params.startDate,
        endDate: params.endDate,
        cabangId: params.cabangId,
      },
    });
    return response.data;
  },

  /**
   * Get top selling products
   * @param {Object} params - Query parameters
   * @param {string} params.startDate - Start date (YYYY-MM-DD)
   * @param {string} params.endDate - End date (YYYY-MM-DD)
   * @param {string} params.cabangId - Branch ID (optional)
   * @param {number} params.limit - Number of products (optional, default: 10)
   */
  getTopProducts: async (params) => {
    const response = await api.get("/reports/sales/products", {
      params: {
        startDate: params.startDate,
        endDate: params.endDate,
        cabangId: params.cabangId,
        limit: params.limit || 10,
      },
    });
    return response.data;
  },

  /**
   * Get sales by category
   * @param {Object} params - Query parameters
   * @param {string} params.startDate - Start date (YYYY-MM-DD)
   * @param {string} params.endDate - End date (YYYY-MM-DD)
   * @param {string} params.cabangId - Branch ID (optional)
   */
  getSalesByCategory: async (params) => {
    const response = await api.get("/reports/sales/categories", {
      params: {
        startDate: params.startDate,
        endDate: params.endDate,
        cabangId: params.cabangId,
      },
    });
    return response.data;
  },

  /**
   * Get financial dashboard data
   * @param {Object} params - Query parameters
   * @param {string} params.startDate - Start date (YYYY-MM-DD)
   * @param {string} params.endDate - End date (YYYY-MM-DD)
   * @param {string} params.cabangId - Branch ID (optional)
   */
  getFinancialDashboard: async (params) => {
    const response = await api.get("/reports/financial/dashboard", {
      params: {
        startDate: params.startDate,
        endDate: params.endDate,
        cabangId: params.cabangId || "all",
      },
    });
    return response.data;
  },

  /**
   * Get financial summary
   * @param {Object} params - Query parameters
   * @param {string} params.startDate - Start date (YYYY-MM-DD)
   * @param {string} params.endDate - End date (YYYY-MM-DD)
   * @param {string} params.cabangId - Branch ID (optional)
   */
  getFinancialSummary: async (params) => {
    const response = await api.get("/reports/financial/summary", {
      params: {
        startDate: params.startDate,
        endDate: params.endDate,
        cabangId: params.cabangId || "all",
      },
    });
    return response.data;
  },

  /**
   * Get financial transactions list
   * @param {Object} params - Query parameters
   * @param {string} params.startDate - Start date (YYYY-MM-DD)
   * @param {string} params.endDate - End date (YYYY-MM-DD)
   * @param {string} params.cabangId - Branch ID (optional)
   * @param {string} params.jenisTransaksi - Transaction type (optional)
   * @param {number} params.page - Page number (optional, default: 1)
   * @param {number} params.limit - Items per page (optional, default: 50)
   */
  getFinancialTransactions: async (params) => {
    const response = await api.get("/reports/financial/transactions", {
      params: {
        startDate: params.startDate,
        endDate: params.endDate,
        cabangId: params.cabangId || "all",
        jenisTransaksi: params.jenisTransaksi,
        page: params.page || 1,
        limit: params.limit || 50,
      },
    });
    return response.data;
  },

  /**
   * Get inventory dashboard data
   * @param {Object} params - Query parameters
   * @param {string} params.cabangId - Branch ID (optional)
   * @param {boolean} params.includeLowStock - Include only low stock items (optional)
   */
  getInventoryDashboard: async (params) => {
    const response = await api.get("/reports/inventory/dashboard", {
      params: {
        cabangId: params.cabangId || "all",
        includeLowStock: params.includeLowStock || false,
      },
    });
    return response.data;
  },

  /**
   * Get inventory movements
   * @param {Object} params - Query parameters
   * @param {string} params.startDate - Start date (YYYY-MM-DD)
   * @param {string} params.endDate - End date (YYYY-MM-DD)
   * @param {string} params.cabangId - Branch ID (required)
   * @param {string} params.produkId - Product ID (optional)
   * @param {string} params.groupBy - Grouping period (day, week, month) (optional)
   */
  getInventoryMovements: async (params) => {
    const response = await api.get("/reports/inventory/movements", {
      params: {
        startDate: params.startDate,
        endDate: params.endDate,
        cabangId: params.cabangId,
        produkId: params.produkId,
        groupBy: params.groupBy || "day",
      },
    });
    return response.data;
  },

  /**
   * Get branch comparison data
   * @param {Object} params - Query parameters
   * @param {string} params.startDate - Start date (YYYY-MM-DD)
   * @param {string} params.endDate - End date (YYYY-MM-DD)
   */
  getBranchReport: async (params) => {
    const response = await api.get("/reports/branch", {
      params: {
        startDate: params.startDate,
        endDate: params.endDate,
      },
    });
    return response.data;
  },

  getLowStockReport: async (params) => {
    const response = await api.get("/reports/inventory/low-stock", {
      params: {
        cabangId: params.cabangId,
        kategoriId: params.kategoriId,
        stokStatus: params.stokStatus,
        page: params.page || 1,
        limit: params.limit || 10,
      },
    });
    return response.data;
  },

  getLowStockByCategory: async (params) => {
    const response = await api.get("/reports/inventory/low-stock/by-category", {
      params: {
        cabangId: params.cabangId,
      },
    });
    return response.data;
  },

  getExpiringProductsReport: async (params) => {
    const response = await api.get("/reports/inventory/expiring", {
      params: {
        cabangId: params.cabangId,
        kategoriId: params.kategoriId,
        daysThreshold: params.daysThreshold || 90,
        statusKadaluarsa: params.statusKadaluarsa,
        page: params.page || 1,
        limit: params.limit || 10,
      },
    });
    return response.data;
  },

  getExpiringByCategory: async (params) => {
    const response = await api.get("/reports/inventory/expiring/by-category", {
      params: {
        cabangId: params.cabangId,
        daysThreshold: params.daysThreshold || 90,
      },
    });
    return response.data;
  },

  getStockTransferReport: async (params) => {
    const response = await api.get("/reports/inventory/stock-transfer", {
      params: {
        cabangId: params.cabangId,
        status: params.status,
        dateRange: params.dateRange,
        page: params.page || 1,
        limit: params.limit || 10,
      },
    });
    return response.data;
  },

  getStockTransferByBranch: async (params) => {
    const response = await api.get("/reports/inventory/stock-transfer/by-branch", {
      params: {
        cabangId: params.cabangId,
        startDate: params.startDate,
        endDate: params.endDate,
      },
    });
    return response.data;
  },

  getInventoryHealthReport: async (params) => {
    const response = await api.get("/reports/inventory/health", {
      params: {
        cabangId: params.cabangId,
        kategoriId: params.kategoriId,
        healthStatus: params.healthStatus,
        page: params.page || 1,
        limit: params.limit || 10,
      },
    });
    return response.data;
  },

  getBranchInventoryHealth: async (params) => {
    const response = await api.get("/reports/inventory/health/branch", {
      params: {
        cabangId: params.cabangId,
      },
    });
    return response.data;
  },

  getHealthScoreDistribution: async (params) => {
    const response = await api.get("/reports/inventory/health/distribution", {
      params: {
        cabangId: params.cabangId,
      },
    });
    return response.data;
  },

  getHealthByDimension: async (params) => {
    const response = await api.get("/reports/inventory/health/dimensions", {
      params: {
        cabangId: params.cabangId,
      },
    });
    return response.data;
  },

  getStockMovementTrends: async (params) => {
    const response = await api.get("/reports/inventory/movement-trends", {
      params: {
        cabangId: params.cabangId,
        produkId: params.produkId,
        kategoriId: params.kategoriId,
        startDate: params.startDate,
        endDate: params.endDate,
        interval: params.interval || "day",
        page: params.page || 1,
        limit: params.limit || 10,
      },
    });
    return response.data;
  },

  getTopMovingProducts: async (params) => {
    const response = await api.get("/reports/inventory/top-moving", {
      params: {
        cabangId: params.cabangId,
        kategoriId: params.kategoriId,
        startDate: params.startDate,
        endDate: params.endDate,
        limit: params.limit || 10,
        sortBy: params.sortBy || "total",
      },
    });
    return response.data;
  },

  getStockMovementByCategory: async (params) => {
    const response = await api.get("/reports/inventory/movement-category", {
      params: {
        cabangId: params.cabangId,
        startDate: params.startDate,
        endDate: params.endDate,
      },
    });
    return response.data;
  },

  getInventoryValueByCategory: async (params) => {
    const response = await api.get("/reports/inventory/value-category", {
      params: {
        cabangId: params.cabangId,
        kategoriId: params.kategoriId,
      },
    });
    return response.data;
  },

  getRecentInventoryActivities: async (params) => {
    const response = await api.get("/reports/inventory/activities", {
      params: {
        cabangId: params.cabangId,
        produkId: params.produkId,
        referenceType: params.referenceType,
        userId: params.userId,
        startDate: params.startDate,
        endDate: params.endDate,
        limit: params.limit || 50,
      },
    });
    return response.data;
  },

  /**
   * Export report to specified format
   * @param {string} reportType - Type of report (sales, financial, inventory, branch)
   * @param {string} format - Export format (excel, pdf, csv)
   * @param {Object} params - Export parameters
   */
  exportReport: async (reportType, format, params) => {
    const response = await api.get(`/reports/export/${reportType}`, {
      params: {
        format,
        startDate: params.startDate,
        endDate: params.endDate,
        cabangId: params.cabangId,
      },
      responseType: "blob",
    });

    // Create download link
    const contentDisposition = response.headers["content-disposition"];
    let filename = `${reportType}_report.${format === "excel" ? "xlsx" : format}`;

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return { success: true, filename };
  },
};

export default reportService;
