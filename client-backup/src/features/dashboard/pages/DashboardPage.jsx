import React, { Suspense, useEffect, useState } from 'react';
import { BarChart2, ShoppingBag, TrendingUp, CreditCard, DollarSign, Box } from 'lucide-react';
import { useDashboardWidgets } from '../hooks/useDashboardWidgets';
import { useCabang } from '../../cabang/hooks/useCabang';
import { useAuth } from '../../auth/hooks/useAuth';
import { getDashboardData } from '../services/dashboardService';
import { WIDGET_TYPES } from '../config/WidgetRegistry';
import LoadingDashboard from '../components/LoadingDashboard';
import ErrorDashboard from '../components/ErrorDashboard';
import CabangIndicator from '../../cabang/components/CabangIndicator';
import formatCurrency from '../../../utils/formatCurrency';

// Icon mapping for dynamic icon rendering
const ICON_MAP = {
  ShoppingBag,
  TrendingUp,
  CreditCard,
  DollarSign,
  Box,
  BarChart2,
};

/**
 * DashboardPage - A dynamic, permission-based dashboard.
 * Renders widgets based on the user's permissions from AuthContext.
 */
const DashboardPage = () => {
  const { groupedWidgets, isLoading: widgetsLoading, totalWidgets } = useDashboardWidgets();
  const { selectedCabang, isGlobalView } = useCabang();
  const { user, getUserRole } = useAuth();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch dashboard data when cabang changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const branchId = isGlobalView ? 'all' : selectedCabang?.id || null;
        const response = await getDashboardData(branchId);
        setDashboardData(response);
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'Gagal memuat data dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isGlobalView, selectedCabang?.id]);

  // Reload function for error state
  const reloadData = () => {
    const branchId = isGlobalView ? 'all' : selectedCabang?.id || null;
    getDashboardData(branchId)
      .then(setDashboardData)
      .catch((err) => setError(err.message));
  };

  // Loading state
  if (widgetsLoading || loading) {
    return <LoadingDashboard />;
  }

  // Error state
  if (error) {
    return <ErrorDashboard error={error} dashboardError={error} reloadData={reloadData} />;
  }

  // No widgets available (no permissions)
  if (totalWidgets === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <Box size={48} className="mb-4" />
        <p>Anda tidak memiliki akses ke widget dashboard.</p>
        <p className="text-sm">Hubungi administrator untuk mendapatkan izin.</p>
      </div>
    );
  }

  // Prepare data for widgets
  const currentBranch = isGlobalView
    ? 'Semua Cabang'
    : selectedCabang?.namaCabang || 'Cabang';
  const userRole = getUserRole();

  // Extract data from API response
  const salesSummary = dashboardData?.salesSummary || {
    daily: { _sum: { total: 0 }, _count: { transaksi_id: 0 }, percentageChange: 0 },
    weekly: { _sum: { total: 0 }, _count: { transaksi_id: 0 }, percentageChange: 0 },
    monthly: { _sum: { total: 0 }, _count: { transaksi_id: 0 }, percentageChange: 0 },
    yearly: { _sum: { total: 0 }, _count: { transaksi_id: 0 }, percentageChange: 0 },
  };
  const averageTransactionValue = dashboardData?.averageTransactionValue || {
    average: 0,
    percentageChange: 0,
    trend: 'up',
  };
  const productPerformance = dashboardData?.productPerformance || [];
  const paymentMethods = dashboardData?.paymentMethods || {};
  const criticalAlerts = dashboardData?.criticalAlerts || { lowStockProducts: { count: 0 } };

  /**
   * Render a single widget with its props.
   */
  const renderWidget = (widget) => {
    const Component = widget.component;
    const IconComponent = widget.props?.icon ? ICON_MAP[widget.props.icon] : null;

    // Build props based on widget type and id
    let widgetProps = {
      isGlobalView,
      cabang: currentBranch,
    };

    // Stats widgets need specific data
    if (widget.type === WIDGET_TYPES.STATS) {
      switch (widget.id) {
        case 'daily_sales':
          widgetProps = {
            title: widget.props.title,
            value: formatCurrency(salesSummary.daily._sum.total),
            percentage: `${salesSummary.daily.percentageChange.toFixed(0)}%`,
            isPositive: salesSummary.daily.percentageChange >= 0,
            icon: IconComponent,
            badge: !isGlobalView ? { text: currentBranch, color: 'indigo' } : null,
          };
          break;
        case 'weekly_sales':
          widgetProps = {
            title: widget.props.title,
            value: formatCurrency(salesSummary.weekly._sum.total),
            percentage: `${salesSummary.weekly.percentageChange.toFixed(0)}%`,
            isPositive: salesSummary.weekly.percentageChange >= 0,
            icon: IconComponent,
            badge: !isGlobalView ? { text: currentBranch, color: 'indigo' } : null,
          };
          break;
        case 'monthly_sales':
          widgetProps = {
            title: widget.props.title,
            value: formatCurrency(salesSummary.monthly._sum.total),
            percentage: `${salesSummary.monthly.percentageChange.toFixed(0)}%`,
            isPositive: salesSummary.monthly.percentageChange >= 0,
            icon: IconComponent,
            badge: !isGlobalView ? { text: currentBranch, color: 'indigo' } : null,
          };
          break;
        case 'yearly_sales':
          widgetProps = {
            title: widget.props.title,
            value: formatCurrency(salesSummary.yearly._sum.total),
            percentage: `${salesSummary.yearly.percentageChange.toFixed(0)}%`,
            isPositive: salesSummary.yearly.percentageChange >= 0,
            icon: IconComponent,
            badge: !isGlobalView ? { text: currentBranch, color: 'indigo' } : null,
          };
          break;
        case 'daily_transactions':
          widgetProps = {
            title: widget.props.title,
            value: salesSummary.daily._count.transaksi_id,
            percentage: `${salesSummary.daily.percentageChange.toFixed(0)}%`,
            isPositive: salesSummary.daily.percentageChange >= 0,
            icon: IconComponent,
            badge: !isGlobalView ? { text: currentBranch, color: 'indigo' } : null,
          };
          break;
        case 'avg_transaction':
          widgetProps = {
            title: widget.props.title,
            value: formatCurrency(averageTransactionValue.average),
            percentage: `${averageTransactionValue.percentageChange}%`,
            isPositive: averageTransactionValue.trend === 'up',
            icon: IconComponent,
            badge: !isGlobalView ? { text: currentBranch, color: 'indigo' } : null,
          };
          break;
        case 'total_transactions':
          widgetProps = {
            title: widget.props.title,
            value: dashboardData?.transactionCounts?.total || 0,
            percentage: `${Math.floor(
              ((dashboardData?.transactionCounts?.today || 0) /
                Math.max(1, dashboardData?.transactionCounts?.total || 1)) *
                100
            )}%`,
            isPositive: true,
            icon: IconComponent,
            badge: !isGlobalView ? { text: currentBranch, color: 'indigo' } : null,
          };
          break;
        case 'stock_health':
          widgetProps = {
            title: widget.props.title,
            value: `${dashboardData?.stockHealth?.healthy?.percentage?.toFixed(0) || 0}%`,
            percentage: `${dashboardData?.stockHealth?.lowStock?.count || 0} produk stok rendah`,
            isPositive: dashboardData?.stockHealth?.healthy?.percentage > 75,
            icon: IconComponent,
            badge: !isGlobalView ? { text: currentBranch, color: 'indigo' } : null,
          };
          break;
        default:
          break;
      }
    }

    // Chart widgets
    if (widget.type === WIDGET_TYPES.CHART) {
      switch (widget.id) {
        case 'category_distribution':
          widgetProps.categoryData = dashboardData?.categoryDistribution || [];
          break;
        case 'payment_methods':
          widgetProps.paymentMethods = paymentMethods;
          break;
        case 'sales_trend':
          widgetProps.revenueTimeSeries = dashboardData?.revenueTimeSeries || [];
          break;
        case 'stock_health_chart':
          widgetProps.stockHealth = dashboardData?.stockHealth;
          break;
        case 'branch_performance':
          widgetProps.branchPerformance = dashboardData?.branchPerformance?.topBranches || [];
          break;
        default:
          break;
      }
    }

    // Table widgets
    if (widget.type === WIDGET_TYPES.TABLE) {
      switch (widget.id) {
        case 'top_products':
          widgetProps.topProducts = productPerformance;
          break;
        case 'staff_activity':
          widgetProps.staffActivity = dashboardData?.staffActivity || [];
          break;
        default:
          break;
      }
    }

    // Alert widgets
    if (widget.type === WIDGET_TYPES.ALERT) {
      widgetProps.criticalAlerts = criticalAlerts;
    }

    return (
      <Suspense
        key={widget.id}
        fallback={
          <div className="bg-white rounded-lg shadow p-4 animate-pulse h-32" />
        }
      >
        <Component {...widgetProps} />
      </Suspense>
    );
  };

  return (
    <>
      {/* Welcome Banner */}
      <div className="mx-6 my-4 bg-indigo-500 rounded-xl p-5 flex justify-between items-center text-white">
        <div>
          <h2 className="text-xl font-semibold">
            Halo, {user?.namaLengkap || userRole}! 👋
          </h2>
          <p className="mt-1 text-indigo-100">
            {isGlobalView
              ? 'Pantau performa real-time seluruh cabang Anda dalam satu dashboard lengkap.'
              : `Dashboard ${currentBranch}`}
          </p>
        </div>
        <div className="h-24 w-24 bg-indigo-200 rounded-full flex items-center justify-center">
          <BarChart2 size={32} className="text-indigo-600" />
        </div>
      </div>

      {/* Branch Indicator */}
      <div className="mx-6 mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold">
            {isGlobalView ? 'Dashboard Semua Cabang' : `Dashboard Cabang: ${currentBranch}`}
          </h2>
          <CabangIndicator size="md" className="ml-3" />
        </div>
      </div>

      {/* Alert Widgets */}
      {groupedWidgets[WIDGET_TYPES.ALERT]?.length > 0 &&
        criticalAlerts.lowStockProducts.count > 0 && (
          <div className="mx-6 mb-4">
            {groupedWidgets[WIDGET_TYPES.ALERT].map(renderWidget)}
          </div>
        )}

      {/* Stats Widgets - Grid */}
      {groupedWidgets[WIDGET_TYPES.STATS]?.length > 0 && (
        <div className="mx-6 grid grid-cols-4 gap-4 mb-6">
          {groupedWidgets[WIDGET_TYPES.STATS].map(renderWidget)}
        </div>
      )}

      {/* Chart Widgets - First Row (2 columns) */}
      {groupedWidgets[WIDGET_TYPES.CHART]?.length > 0 && (
        <>
          <div className="mx-6 grid grid-cols-2 gap-4 mb-6">
            {groupedWidgets[WIDGET_TYPES.CHART]
              .filter((w) => ['category_distribution', 'payment_methods'].includes(w.id))
              .map(renderWidget)}
          </div>

          {/* Sales Trend - Full Width */}
          {groupedWidgets[WIDGET_TYPES.CHART]
            .filter((w) => w.id === 'sales_trend')
            .map(renderWidget)}

          {/* Chart Widgets - Second Row (2 columns) */}
          <div className="mx-6 grid grid-cols-2 gap-4 mb-6">
            {groupedWidgets[WIDGET_TYPES.CHART]
              .filter((w) => ['stock_health_chart', 'branch_performance'].includes(w.id))
              .map(renderWidget)}
          </div>
        </>
      )}

      {/* Table Widgets */}
      {groupedWidgets[WIDGET_TYPES.TABLE]?.length > 0 && (
        <div className="mx-6 mb-6">
          {groupedWidgets[WIDGET_TYPES.TABLE].map(renderWidget)}
        </div>
      )}
    </>
  );
};

export default DashboardPage;
