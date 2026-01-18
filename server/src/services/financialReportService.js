const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Service for retrieving financial reports using materialized views
 */
class FinancialReportService {
  /**
   * Get financial summary data filtered by cabang id and date range
   * @param {Object} filters - Filter parameters
   * @param {string} filters.cabangId - Branch ID (optional, 'all' for all branches)
   * @param {string} filters.startDate - Start date in YYYY-MM-DD format
   * @param {string} filters.endDate - End date in YYYY-MM-DD format
   * @returns {Promise<Object>} Financial summary data
   */
  static async getFinancialSummary(filters) {
    const { cabangId = "all", startDate, endDate } = filters;

    // Define query conditions
    let whereClause = "TRUE";
    const params = [];

    if (cabangId !== "all") {
      whereClause += " AND cabang_id = $1";
      params.push(cabangId);
    }

    if (startDate && endDate) {
      whereClause +=
        " AND transaction_date BETWEEN $" +
        (params.length + 1) +
        " AND $" +
        (params.length + 2);
      params.push(startDate, endDate);
    }

    // Query the materialized view
    const summaryData = await prisma.$queryRaw`
      SELECT 
        SUM(total_pendapatan) AS total_pendapatan,
        SUM(total_pengeluaran) AS total_pengeluaran,
        SUM(keuntungan_bersih) AS keuntungan_bersih,
        CASE 
          WHEN SUM(total_pendapatan) > 0 
          THEN ROUND((SUM(keuntungan_bersih) * 100.0 / SUM(total_pendapatan)), 2)
          ELSE 0 
        END AS margin_keuntungan,
        SUM(total_pajak) AS total_pajak,
        SUM(total_biaya_layanan) AS total_biaya_layanan,
        SUM(total_transaksi_penjualan) AS total_transaksi_penjualan,
        SUM(total_transaksi_pembelian) AS total_transaksi_pembelian
      FROM mv_financial_summary
      WHERE ${whereClause}
    `;

    return summaryData[0];
  }

  /**
   * Get financial daily trend data
   * @param {Object} filters - Filter parameters
   * @param {string} filters.cabangId - Branch ID (optional, 'all' for all branches)
   * @param {string} filters.startDate - Start date in YYYY-MM-DD format
   * @param {string} filters.endDate - End date in YYYY-MM-DD format
   * @returns {Promise<Array>} Daily financial trend data
   */
  static async getFinancialDailyTrend(filters) {
    const { cabangId = "all", startDate, endDate } = filters;

    // Define query conditions
    let whereClause = "TRUE";
    const params = [];

    if (cabangId !== "all") {
      whereClause += " AND cabang_id = $1";
      params.push(cabangId);
    }

    if (startDate && endDate) {
      whereClause +=
        " AND transaction_date BETWEEN $" +
        (params.length + 1) +
        " AND $" +
        (params.length + 2);
      params.push(startDate, endDate);
    }

    // Query the materialized view
    const trendData = await prisma.$queryRaw`
      SELECT 
        transaction_date,
        pendapatan,
        pengeluaran,
        keuntungan
      FROM mv_financial_daily_trend
      WHERE ${whereClause}
      ORDER BY transaction_date
    `;

    return trendData;
  }

  /**
   * Get payment method summary data
   * @param {Object} filters - Filter parameters
   * @param {string} filters.cabangId - Branch ID (optional, 'all' for all branches)
   * @param {string} filters.startDate - Start date in YYYY-MM-DD format
   * @param {string} filters.endDate - End date in YYYY-MM-DD format
   * @returns {Promise<Array>} Payment method summary data
   */
  static async getPaymentMethodSummary(filters) {
    const { cabangId = "all", startDate, endDate } = filters;

    // Define query conditions
    let whereClause = "TRUE";
    const params = [];

    if (cabangId !== "all") {
      whereClause += " AND cabang_id = $1";
      params.push(cabangId);
    }

    if (startDate && endDate) {
      whereClause +=
        " AND transaction_date BETWEEN $" +
        (params.length + 1) +
        " AND $" +
        (params.length + 2);
      params.push(startDate, endDate);
    }

    // Query the materialized view for aggregate data per payment method
    const paymentData = await prisma.$queryRaw`
      SELECT 
        metode_pembayaran,
        SUM(total_amount) AS total_amount,
        SUM(transaction_count) AS transaction_count,
        ROUND(SUM(total_amount) * 100.0 / 
          (SELECT SUM(total_amount) FROM mv_payment_method_summary WHERE ${whereClause}), 2) AS percentage
      FROM mv_payment_method_summary
      WHERE ${whereClause}
      GROUP BY metode_pembayaran
      ORDER BY total_amount DESC
    `;

    return paymentData;
  }

  /**
   * Get expense analysis by category
   * @param {Object} filters - Filter parameters
   * @param {string} filters.cabangId - Branch ID (optional, 'all' for all branches)
   * @returns {Promise<Array>} Expense analysis data
   */
  static async getExpenseAnalysis(filters) {
    const { cabangId = "all" } = filters;

    // Define query conditions
    let whereClause = "TRUE";
    const params = [];

    if (cabangId !== "all") {
      whereClause += " AND cabang_id = $1";
      params.push(cabangId);
    }

    // Query the materialized view
    const expenseData = await prisma.$queryRaw`
      SELECT 
        expense_category,
        total_amount,
        percentage
      FROM mv_expense_analysis
      WHERE ${whereClause}
      ORDER BY total_amount DESC
    `;

    return expenseData;
  }

  /**
   * Get tax and fee summary
   * @param {Object} filters - Filter parameters
   * @param {string} filters.cabangId - Branch ID (optional, 'all' for all branches)
   * @returns {Promise<Object>} Tax and fee summary data
   */
  static async getTaxAndFeesSummary(filters) {
    const { cabangId = "all" } = filters;

    // Define query conditions
    let whereClause = "TRUE";
    const params = [];

    if (cabangId !== "all") {
      whereClause += " AND cabang_id = $1";
      params.push(cabangId);
    }

    // Query the materialized view
    const taxData = await prisma.$queryRaw`
      SELECT 
        total_tax,
        total_fees,
        total_sales,
        transaction_count,
        tax_percentage,
        fees_percentage
      FROM mv_tax_and_fees
      WHERE ${whereClause}
    `;

    // Query transaction fees by payment method
    const feesByPayment = await prisma.$queryRaw`
      SELECT 
        metode_pembayaran,
        total_amount,
        transaction_count,
        transaction_fees,
        fee_percentage
      FROM mv_transaction_fees_by_payment
      WHERE ${whereClause}
      ORDER BY total_amount DESC
    `;

    return {
      taxSummary: taxData[0],
      feesByPaymentMethod: feesByPayment,
    };
  }

  /**
   * Get detailed financial transactions
   * @param {Object} filters - Filter parameters
   * @param {string} filters.cabangId - Branch ID (optional, 'all' for all branches)
   * @param {string} filters.startDate - Start date in YYYY-MM-DD format
   * @param {string} filters.endDate - End date in YYYY-MM-DD format
   * @param {string} filters.jenisTransaksi - Transaction type (optional)
   * @param {number} filters.page - Page number (optional)
   * @param {number} filters.limit - Number of items per page (optional)
   * @returns {Promise<Object>} Detailed transaction data with pagination
   */
  static async getDetailedTransactions(filters) {
    const {
      cabangId = "all",
      startDate,
      endDate,
      jenisTransaksi,
      page = 1,
      limit = 20,
    } = filters;

    // Define query conditions
    let whereClause = "TRUE";
    const params = [];

    if (cabangId !== "all") {
      whereClause += " AND cabang_id = $1";
      params.push(cabangId);
    }

    if (startDate && endDate) {
      whereClause +=
        " AND transaction_date BETWEEN $" +
        (params.length + 1) +
        " AND $" +
        (params.length + 2);
      params.push(startDate, endDate);
    }

    if (jenisTransaksi) {
      whereClause += " AND jenis_transaksi = $" + (params.length + 1);
      params.push(jenisTransaksi);
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Query the materialized view for transactions with pagination
    const transactions = await prisma.$queryRaw`
      SELECT 
        transaksi_id,
        cabang_id,
        jenis_transaksi,
        nomor_transaksi,
        transaction_date,
        status_pembayaran,
        total,
        subtotal,
        diskon,
        pajak,
        biaya_tambahan,
        pendapatan,
        pengeluaran,
        keuntungan,
        margin_persen,
        nama_pelanggan,
        nama_supplier
      FROM mv_financial_detail
      WHERE ${whereClause}
      ORDER BY transaction_date DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Count total records for pagination
    const countResult = await prisma.$queryRaw`
      SELECT COUNT(*) AS total
      FROM mv_financial_detail
      WHERE ${whereClause}
    `;

    const totalCount = parseInt(countResult[0].total);
    const totalPages = Math.ceil(totalCount / limit);

    return {
      data: transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalItems: totalCount,
        totalPages,
      },
    };
  }

  /**
   * Get profit and loss report
   * @param {Object} filters - Filter parameters
   * @param {string} filters.cabangId - Branch ID (optional, 'all' for all branches)
   * @param {string} filters.year - Year to filter (YYYY format)
   * @param {string} filters.month - Month to filter (MM format, optional)
   * @returns {Promise<Object>} Profit and loss report data
   */
  static async getProfitLossReport(filters) {
    const { cabangId = "all", year, month } = filters;

    // Define query conditions
    let whereClause = "TRUE";
    const params = [];

    if (cabangId !== "all") {
      whereClause += " AND cabang_id = $1";
      params.push(cabangId);
    }

    if (year) {
      if (month) {
        // Filter for specific month of specific year
        whereClause += ` AND EXTRACT(YEAR FROM period_month) = ${year} AND EXTRACT(MONTH FROM period_month) = ${month}`;
      } else {
        // Filter for all months of specific year
        whereClause += ` AND EXTRACT(YEAR FROM period_month) = ${year}`;
      }
    }

    // Query the profit loss main view
    const profitLossData = await prisma.$queryRaw`
      SELECT 
        period_month,
        total_revenue,
        subtotal_revenue,
        total_discount,
        total_tax,
        total_additional_fees,
        sales_transaction_count,
        total_cogs,
        gross_profit,
        gross_profit_margin,
        total_operating_expenses,
        net_profit,
        net_profit_margin
      FROM mv_profit_loss_report
      WHERE ${whereClause}
      ORDER BY period_month
    `;

    // Query the expense breakdown by category
    const expenseBreakdown = await prisma.$queryRaw`
      SELECT 
        period_month,
        expense_category,
        category_expense,
        expense_percentage
      FROM mv_profit_loss_expense_detail
      WHERE ${whereClause}
      ORDER BY period_month, category_expense DESC
    `;

    // Organize expense breakdown by period
    const expensesByPeriod = {};
    expenseBreakdown.forEach((expense) => {
      const periodKey = expense.period_month.toISOString();
      if (!expensesByPeriod[periodKey]) {
        expensesByPeriod[periodKey] = [];
      }
      expensesByPeriod[periodKey].push({
        category: expense.expense_category,
        amount: expense.category_expense,
        percentage: expense.expense_percentage,
      });
    });

    // Combine main data with expense breakdown
    const result = profitLossData.map((item) => {
      const periodKey = item.period_month.toISOString();
      return {
        ...item,
        expenses_breakdown: expensesByPeriod[periodKey] || [],
      };
    });

    return result;
  }

  /**
   * Get profit and loss summary with comparisons to previous periods
   * @param {Object} filters - Filter parameters
   * @param {string} filters.cabangId - Branch ID (optional, 'all' for all branches)
   * @param {string} filters.period - Period type ('month', 'quarter', 'year')
   * @returns {Promise<Object>} Profit and loss summary data with period comparisons
   */
  static async getProfitLossSummary(filters) {
    const { cabangId = "all", period = "month" } = filters;

    // Define the current period and previous period based on the period type
    const now = new Date();
    let currentPeriodStart,
      currentPeriodEnd,
      previousPeriodStart,
      previousPeriodEnd;

    if (period === "month") {
      // Current month
      currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      currentPeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Previous month
      previousPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      previousPeriodEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (period === "quarter") {
      // Current quarter
      const currentQuarter = Math.floor(now.getMonth() / 3);
      currentPeriodStart = new Date(now.getFullYear(), currentQuarter * 3, 1);
      currentPeriodEnd = new Date(
        now.getFullYear(),
        (currentQuarter + 1) * 3,
        0
      );

      // Previous quarter
      previousPeriodStart = new Date(
        now.getFullYear(),
        (currentQuarter - 1) * 3,
        1
      );
      previousPeriodEnd = new Date(now.getFullYear(), currentQuarter * 3, 0);
    } else {
      // year
      // Current year
      currentPeriodStart = new Date(now.getFullYear(), 0, 1);
      currentPeriodEnd = new Date(now.getFullYear(), 11, 31);

      // Previous year
      previousPeriodStart = new Date(now.getFullYear() - 1, 0, 1);
      previousPeriodEnd = new Date(now.getFullYear() - 1, 11, 31);
    }

    // Format dates for SQL
    const formatDate = (date) => date.toISOString().split("T")[0];

    // Define query conditions
    let whereClause = "cabang_id = $1";
    const params = [cabangId];

    // Query current period data
    const currentPeriodData = await prisma.$queryRaw`
      SELECT 
        SUM(total_revenue) AS total_revenue,
        SUM(total_cogs) AS total_cogs,
        SUM(gross_profit) AS gross_profit,
        CASE 
          WHEN SUM(total_revenue) > 0 
          THEN ROUND(SUM(gross_profit) * 100.0 / SUM(total_revenue), 2)
          ELSE 0 
        END AS gross_profit_margin,
        SUM(total_operating_expenses) AS total_expenses,
        SUM(net_profit) AS net_profit,
        CASE 
          WHEN SUM(total_revenue) > 0 
          THEN ROUND(SUM(net_profit) * 100.0 / SUM(total_revenue), 2)
          ELSE 0 
        END AS net_profit_margin
      FROM mv_profit_loss_report
      WHERE ${whereClause}
      AND period_month BETWEEN ${formatDate(
        currentPeriodStart
      )}::date AND ${formatDate(currentPeriodEnd)}::date
    `;

    // Query previous period data
    const previousPeriodData = await prisma.$queryRaw`
      SELECT 
        SUM(total_revenue) AS total_revenue,
        SUM(total_cogs) AS total_cogs,
        SUM(gross_profit) AS gross_profit,
        CASE 
          WHEN SUM(total_revenue) > 0 
          THEN ROUND(SUM(gross_profit) * 100.0 / SUM(total_revenue), 2)
          ELSE 0 
        END AS gross_profit_margin,
        SUM(total_operating_expenses) AS total_expenses,
        SUM(net_profit) AS net_profit,
        CASE 
          WHEN SUM(total_revenue) > 0 
          THEN ROUND(SUM(net_profit) * 100.0 / SUM(total_revenue), 2)
          ELSE 0 
        END AS net_profit_margin
      FROM mv_profit_loss_report
      WHERE ${whereClause}
      AND period_month BETWEEN ${formatDate(
        previousPeriodStart
      )}::date AND ${formatDate(previousPeriodEnd)}::date
    `;

    // Calculate percentage changes
    const calculateChange = (current, previous) => {
      if (!previous || previous === 0) {
        return current > 0 ? 100 : 0;
      }
      return parseFloat((((current - previous) / previous) * 100).toFixed(2));
    };

    const current = currentPeriodData[0] || {};
    const previous = previousPeriodData[0] || {};

    return {
      current_period: {
        start_date: formatDate(currentPeriodStart),
        end_date: formatDate(currentPeriodEnd),
        period_type: period,
        total_revenue: current.total_revenue || 0,
        total_cogs: current.total_cogs || 0,
        gross_profit: current.gross_profit || 0,
        gross_profit_margin: current.gross_profit_margin || 0,
        total_expenses: current.total_expenses || 0,
        net_profit: current.net_profit || 0,
        net_profit_margin: current.net_profit_margin || 0,
      },
      previous_period: {
        start_date: formatDate(previousPeriodStart),
        end_date: formatDate(previousPeriodEnd),
        period_type: period,
        total_revenue: previous.total_revenue || 0,
        total_cogs: previous.total_cogs || 0,
        gross_profit: previous.gross_profit || 0,
        gross_profit_margin: previous.gross_profit_margin || 0,
        total_expenses: previous.total_expenses || 0,
        net_profit: previous.net_profit || 0,
        net_profit_margin: previous.net_profit_margin || 0,
      },
      changes: {
        revenue_change: calculateChange(
          current.total_revenue || 0,
          previous.total_revenue || 0
        ),
        cogs_change: calculateChange(
          current.total_cogs || 0,
          previous.total_cogs || 0
        ),
        gross_profit_change: calculateChange(
          current.gross_profit || 0,
          previous.gross_profit || 0
        ),
        gross_margin_change: calculateChange(
          current.gross_profit_margin || 0,
          previous.gross_profit_margin || 0
        ),
        expenses_change: calculateChange(
          current.total_expenses || 0,
          previous.total_expenses || 0
        ),
        net_profit_change: calculateChange(
          current.net_profit || 0,
          previous.net_profit || 0
        ),
        net_margin_change: calculateChange(
          current.net_profit_margin || 0,
          previous.net_profit_margin || 0
        ),
      },
    };
  }

  /**
   * Get complete financial dashboard data
   * @param {Object} filters - Filter parameters
   * @param {string} filters.cabangId - Branch ID (optional, 'all' for all branches)
   * @param {string} filters.startDate - Start date in YYYY-MM-DD format
   * @param {string} filters.endDate - End date in YYYY-MM-DD format
   * @returns {Promise<Object>} Complete financial dashboard data
   */
  static async getFinancialDashboard(filters) {
    // Execute all queries in parallel for better performance
    const [summary, trend, paymentMethods, expenseAnalysis, taxAndFees] =
      await Promise.all([
        this.getFinancialSummary(filters),
        this.getFinancialDailyTrend(filters),
        this.getPaymentMethodSummary(filters),
        this.getExpenseAnalysis(filters),
        this.getTaxAndFeesSummary(filters),
      ]);

    // Return consolidated data
    return {
      summary,
      trend,
      paymentMethods,
      expenseAnalysis,
      taxAndFees,
    };
  }

  /**
   * Refresh all financial materialized views
   * @param {String} viewType - Type of views to refresh: 'selective', 'full', or 'all' (default)
   * @returns {Promise<Object>} Success/failure message
   */
  static async refreshMaterializedViews(viewType = "all") {
    try {
      if (viewType === "selective" || viewType === "all") {
        await prisma.$executeRaw`SELECT perform_selective_view_refresh()`;
      }

      if (viewType === "full" || viewType === "all") {
        await prisma.$executeRaw`SELECT perform_full_materialized_view_refresh()`;
      }

      return {
        success: true,
        message: `Financial materialized views (${viewType}) refreshed successfully`,
      };
    } catch (error) {
      console.error("Error refreshing financial materialized views:", error);
      return {
        success: false,
        message: "Failed to refresh financial materialized views",
        error,
      };
    }
  }
}

module.exports = FinancialReportService;
