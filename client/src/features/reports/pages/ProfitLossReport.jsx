import React, { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  RefreshCcw,
  ListFilter,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  PieChart as PieChartIcon,
} from "lucide-react";
import { useUserBranches } from "../hooks/useUserBranches";
import { useProfitLossReport, useProfitLossSummary } from "../hooks/useReports";
import formatCurrency from "@common/utils/formatCurrency";
import {
  Card,
  CardContent,
  ReportTabs,
  DataTable,
  StatusChip,
  LoadingIndicator,
  MetricCard,
  FormSelect,
  Button,
  Divider,
} from "../components/ReportComponents";
import BranchMultiSelect from "../components/BranchMultiSelect";
import ExportDropdown from "../components/ExportDropdown";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#8dd1e1",
];

const ProfitLossReport = () => {
  const [tabValue, setTabValue] = useState(0);
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear.toString());
  const [month, setMonth] = useState("");
  const [periodType, setPeriodType] = useState("month");
  
  // Multi-branch support
  const {
    availableBranches,
    selectedBranches,
    setSelectedBranches,
    cabangFilterParam,
    hasSingleBranch,
    isDisabled,
  } = useUserBranches("profit-loss");

  // API params for detail report
  const reportParams = useMemo(
    () => ({
      cabangId: cabangFilterParam,
      year,
      month: month || undefined,
    }),
    [cabangFilterParam, year, month]
  );

  // API params for summary comparison
  const summaryParams = useMemo(
    () => ({
      cabangId: cabangFilterParam,
      period: periodType,
    }),
    [cabangFilterParam, periodType]
  );

  // Fetch data
  const {
    data: reportData,
    isLoading: loadingReport,
    refetch: refetchReport,
  } = useProfitLossReport(reportParams);

  const {
    data: summaryData,
    isLoading: loadingSummary,
  } = useProfitLossSummary(summaryParams);

  const loading = loadingReport || loadingSummary;

  // Tab configuration
  const tabs = [
    { value: 0, label: "Trend Laba Rugi", icon: <TrendingUp size={16} /> },
    { value: 1, label: "Perbandingan Period", icon: <ArrowUpRight size={16} /> },
    { value: 2, label: "Breakdown Pengeluaran", icon: <PieChartIcon size={16} /> },
  ];

  // Year options (last 5 years)
  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const y = currentYear - i;
    return { value: y.toString(), label: y.toString() };
  });

  // Month options
  const monthOptions = [
    { value: "", label: "Semua Bulan" },
    { value: "01", label: "Januari" },
    { value: "02", label: "Februari" },
    { value: "03", label: "Maret" },
    { value: "04", label: "April" },
    { value: "05", label: "Mei" },
    { value: "06", label: "Juni" },
    { value: "07", label: "Juli" },
    { value: "08", label: "Agustus" },
    { value: "09", label: "September" },
    { value: "10", label: "Oktober" },
    { value: "11", label: "November" },
    { value: "12", label: "Desember" },
  ];

  // Period type options
  const periodOptions = [
    { value: "month", label: "Bulan ke Bulan" },
    { value: "quarter", label: "Quarter ke Quarter" },
    { value: "year", label: "Tahun ke Tahun" },
  ];

  // Prepare chart data
  const trendData =
    reportData?.data?.map((item) => ({
      period: new Date(item.period_month).toLocaleDateString("id-ID", {
        month: "short",
        year: "numeric",
      }),
      revenue: Number(item.total_revenue) || 0,
      cogs: Number(item.total_cogs) || 0,
      grossProfit: Number(item.gross_profit) || 0,
      expenses: Number(item.total_operating_expenses) || 0,
      netProfit: Number(item.net_profit) || 0,
      grossMargin: Number(item.gross_profit_margin) || 0,
      netMargin: Number(item.net_profit_margin) || 0,
    })) || [];

  // Get latest period metrics
  const latestPeriod = trendData.length > 0 ? trendData[trendData.length - 1] : null;

  // Prepare expense breakdown for the latest period
  const latestReportItem = reportData?.data?.[reportData.data.length - 1];
  const expenseBreakdown =
    latestReportItem?.expenses_breakdown?.map((exp) => ({
      category: exp.category,
      amount: Number(exp.amount) || 0,
      percentage: Number(exp.percentage) || 0,
    })) || [];

  // Summary comparison metrics
  const currentPeriod = summaryData?.data?.current_period || {};
  const previousPeriod = summaryData?.data?.previous_period || {};
  const changes = summaryData?.data?.changes || {};

  // Helper to render change indicator
  const renderChange = (change, inverted = false) => {
    const isPositive = inverted ? change < 0 : change > 0;
    const Icon = isPositive ? ArrowUpRight : ArrowDownRight;
    const colorClass = isPositive ? "text-green-600" : "text-red-600";

    return (
      <div className={`flex items-center gap-1 ${colorClass} text-sm font-medium`}>
        <Icon size={16} />
        <span>{Math.abs(change).toFixed(2)}%</span>
      </div>
    );
  };

  // Format period label
  const formatPeriodLabel = (period) => {
    if (!period.start_date || !period.end_date) return "";
    const start = new Date(period.start_date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const end = new Date(period.end_date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    return `${start} - ${end}`;
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Laporan Laba Rugi (Profit & Loss)</h1>

      {/* Filter Section */}
      <Card className="mb-6">
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium flex items-center">
              <ListFilter className="mr-2" size={20} />
              Filter Laporan
            </h2>
            <div className="flex space-x-2">
              <Button onClick={refetchReport} icon={<RefreshCcw size={16} />}>
                Refresh
              </Button>
              <ExportDropdown
                reportType="profit-loss"
                params={reportParams}
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <FormSelect
              id="year"
              label="Tahun"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              options={yearOptions}
            />

            <FormSelect
              id="month"
              label="Bulan"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              options={monthOptions}
            />

            <BranchMultiSelect
              availableBranches={availableBranches}
              selectedBranches={selectedBranches}
              onChange={setSelectedBranches}
              isDisabled={isDisabled}
            />

            <FormSelect
              id="period-type"
              label="Periode Perbandingan"
              value={periodType}
              onChange={(e) => setPeriodType(e.target.value)}
              options={periodOptions}
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {latestPeriod && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <MetricCard
            title="Revenue (Pendapatan)"
            value={loading ? <LoadingIndicator size="sm" /> : formatCurrency(latestPeriod.revenue)}
            icon={<DollarSign className="text-blue-500" size={24} />}
          />

          <MetricCard
            title="Gross Profit (Laba Kotor)"
            value={loading ? <LoadingIndicator size="sm" /> : formatCurrency(latestPeriod.grossProfit)}
            subtitle={`Margin: ${latestPeriod.grossMargin.toFixed(2)}%`}
            trend={
              latestPeriod.grossProfit >= 0
                ? { positive: true, value: "" }
                : { positive: false, value: "" }
            }
          />

          <MetricCard
            title="Operating Expenses"
            value={loading ? <LoadingIndicator size="sm" /> : formatCurrency(latestPeriod.expenses)}
          />

          <MetricCard
            title="Net Profit (Laba Bersih)"
            value={loading ? <LoadingIndicator size="sm" /> : formatCurrency(latestPeriod.netProfit)}
            subtitle={`Margin: ${latestPeriod.netMargin.toFixed(2)}%`}
            trend={
              latestPeriod.netProfit >= 0
                ? { positive: true, value: "" }
                : { positive: false, value: "" }
            }
          />
        </div>
      )}

      {/* Tab Navigation */}
      <ReportTabs tabs={tabs} activeTab={tabValue} onChange={setTabValue} />

      {/* Tab Content: Profit Loss Trend */}
      {tabValue === 0 && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-medium mb-4">Trend Laba Rugi Bulanan</h3>
            {loading ? (
              <LoadingIndicator />
            ) : trendData.length > 0 ? (
              <>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}jt`} />
                      <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#8884d8" />
                      <Line type="monotone" dataKey="grossProfit" name="Gross Profit" stroke="#00C49F" />
                      <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#FF8042" />
                      <Line type="monotone" dataKey="netProfit" name="Net Profit" stroke="#28a745" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <Divider />

                <h3 className="text-lg font-medium mb-4">Detail Per Period</h3>
                <DataTable
                  columns={[
                    { header: "Period", cell: (row) => row.period },
                    { header: "Revenue", cell: (row) => formatCurrency(row.revenue), cellClassName: "text-right" },
                    { header: "COGS", cell: (row) => formatCurrency(row.cogs), cellClassName: "text-right" },
                    { header: "Gross Profit", cell: (row) => formatCurrency(row.grossProfit), cellClassName: "text-right" },
                    { header: "Gross Margin", cell: (row) => `${row.grossMargin.toFixed(2)}%`, cellClassName: "text-right" },
                    { header: "Expenses", cell: (row) => formatCurrency(row.expenses), cellClassName: "text-right" },
                    {
                      header: "Net Profit",
                      cell: (row) => (
                        <span className={row.netProfit >= 0 ? "text-green-600" : "text-red-600"}>
                          {formatCurrency(row.netProfit)}
                        </span>
                      ),
                      cellClassName: "text-right",
                    },
                    { header: "Net Margin", cell: (row) => `${row.netMargin.toFixed(2)}%`, cellClassName: "text-right" },
                  ]}
                  data={trendData}
                />
              </>
            ) : (
              <p className="text-gray-600 text-center py-8">Tidak ada data untuk ditampilkan</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab Content: Period Comparison */}
      {tabValue === 1 && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-medium mb-4">Perbandingan Period</h3>
            {loadingSummary ? (
              <LoadingIndicator />
            ) : summaryData?.data ? (
              <div className="space-y-6">
                {/* Period Labels */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-1">Current Period</h4>
                    <p className="text-sm text-blue-700">{formatPeriodLabel(currentPeriod)}</p>
                  </div>
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-1">Previous Period</h4>
                    <p className="text-sm text-gray-700">{formatPeriodLabel(previousPeriod)}</p>
                  </div>
                </div>

                {/* Comparison Table */}
                <DataTable
                  columns={[
                    { header: "Metric", cell: (row) => row.metric },
                    {
                      header: "Current",
                      cell: (row) => formatCurrency(row.current),
                      cellClassName: "text-right font-semibold",
                    },
                    {
                      header: "Previous",
                      cell: (row) => formatCurrency(row.previous),
                      cellClassName: "text-right",
                    },
                    {
                      header: "Change",
                      cell: (row) => renderChange(row.change, row.inverted),
                      cellClassName: "text-right",
                    },
                  ]}
                  data={[
                    {
                      metric: "Revenue",
                      current: currentPeriod.total_revenue || 0,
                      previous: previousPeriod.total_revenue || 0,
                      change: changes.revenue_change || 0,
                      inverted: false,
                    },
                    {
                      metric: "COGS",
                      current: currentPeriod.total_cogs || 0,
                      previous: previousPeriod.total_cogs || 0,
                      change: changes.cogs_change || 0,
                      inverted: true,
                    },
                    {
                      metric: "Gross Profit",
                      current: currentPeriod.gross_profit || 0,
                      previous: previousPeriod.gross_profit || 0,
                      change: changes.gross_profit_change || 0,
                      inverted: false,
                    },
                    {
                      metric: "Gross Margin (%)",
                      current: currentPeriod.gross_profit_margin || 0,
                      previous: previousPeriod.gross_profit_margin || 0,
                      change: changes.gross_margin_change || 0,
                      inverted: false,
                    },
                    {
                      metric: "Operating Expenses",
                      current: currentPeriod.total_expenses || 0,
                      previous: previousPeriod.total_expenses || 0,
                      change: changes.expenses_change || 0,
                      inverted: true,
                    },
                    {
                      metric: "Net Profit",
                      current: currentPeriod.net_profit || 0,
                      previous: previousPeriod.net_profit || 0,
                      change: changes.net_profit_change || 0,
                      inverted: false,
                    },
                    {
                      metric: "Net Margin (%)",
                      current: currentPeriod.net_profit_margin || 0,
                      previous: previousPeriod.net_profit_margin || 0,
                      change: changes.net_margin_change || 0,
                      inverted: false,
                    },
                  ]}
                />
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">Tidak ada data untuk ditampilkan</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab Content: Expense Breakdown */}
      {tabValue === 2 && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-medium mb-4">Breakdown Pengeluaran Operasional</h3>
            {loading ? (
              <LoadingIndicator />
            ) : expenseBreakdown.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ category, percentage }) => `${category}: ${percentage.toFixed(1)}%`}
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="amount"
                      >
                        {expenseBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <DataTable
                    columns={[
                      {
                        header: "Kategori",
                        cell: (row, index) => (
                          <div className="flex items-center">
                            <div
                              className="w-4 h-4 rounded-full mr-2"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            ></div>
                            {row.category}
                          </div>
                        ),
                      },
                      {
                        header: "Jumlah",
                        cell: (row) => formatCurrency(row.amount),
                        cellClassName: "text-right",
                      },
                      {
                        header: "Persentase",
                        cell: (row) => `${row.percentage.toFixed(2)}%`,
                        cellClassName: "text-right",
                      },
                    ]}
                    data={expenseBreakdown}
                  />
                </div>
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">Tidak ada data pengeluaran untuk ditampilkan</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProfitLossReport;
