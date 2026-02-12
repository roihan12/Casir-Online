import React, { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  RefreshCcw,
  ListFilter,
  CreditCard,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart2,
} from "lucide-react";
import { useCabang } from "@features/cabang/hooks/useCabang";
import { useFinancialReport, useFinancialSummary, useFinancialTransactions } from "../hooks/useReports";
import formatCurrency from "@common/utils/formatCurrency";
import {
  Card,
  CardContent,
  ReportTabs,
  DataTable,
  StatusChip,
  LoadingIndicator,
  MetricCard,
  DateInput,
  FormSelect,
  Button,
  Divider,
} from "../components/ReportComponents";
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

const FinanceReport = () => {
  const [tabValue, setTabValue] = useState(0);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());
  const [cabangFilter, setCabangFilter] = useState("all");
  const { allCabang } = useCabang();

  // Format dates for API
  const apiParams = useMemo(() => {
    const formatDate = (date) => {
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };
    return {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      cabangId: cabangFilter,
    };
  }, [startDate, endDate, cabangFilter]);

  // Fetch data using real API
  const { data: dashboardData, isLoading: loadingDashboard, refetch: refetchDashboard } = useFinancialReport(apiParams);
  const { data: summaryData, isLoading: loadingSummary } = useFinancialSummary(apiParams);
  const { data: transactionsData } = useFinancialTransactions({ ...apiParams, limit: 100 });

  const loading = loadingDashboard || loadingSummary;

  // Format dates for export params
  const exportParams = apiParams;

  const handleChangeTab = (newValue) => {
    setTabValue(newValue);
  };

  const handleRefreshData = () => {
    refetchDashboard();
  };

  // Format date for display in charts
  const formatDateForChart = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
  };

  // Format date full
  const formatDateFull = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // Format payment method name
  const formatPaymentMethod = (method) => {
    const methodMap = {
      "TUNAI": "Tunai",
      "KARTU_DEBIT": "Kartu Debit",
      "KARTU_KREDIT": "Kartu Kredit",
      "TRANSFER": "Transfer Bank",
      "QRIS": "QRIS",
      "E_WALLET": "E-Wallet",
    };
    return methodMap[method] || method;
  };

  const tabs = [
    {
      value: 0,
      label: "Trend Pendapatan & Pengeluaran",
      icon: <TrendingUp size={16} />,
    },
    { value: 1, label: "Metode Pembayaran", icon: <CreditCard size={16} /> },
    { value: 2, label: "Analisis Pengeluaran", icon: <BarChart2 size={16} /> },
    { value: 3, label: "Pajak & Biaya", icon: <PieChartIcon size={16} /> },
  ];

  const cabangOptions = [
    { value: "all", label: "Semua Cabang" },
    ...(allCabang
      ? allCabang.map((cabang) => ({
          value: cabang.id,
          label: cabang.namaCabang,
        }))
      : []),
  ];

  // Prepare chart data
  const trendData = dashboardData?.data?.trend?.map((t) => ({
    date: new Date(t.transaction_date),
    revenue: Number(t.pendapatan) || 0,
    expenses: Number(t.pengeluaran) || 0,
    profit: Number(t.keuntungan) || 0,
  })) || [];

  const summaryMetrics = summaryData?.data || {
    total_pendapatan: 0,
    total_pengeluaran: 0,
    keuntungan_bersih: 0,
    margin_keuntungan: 0,
  };

  const paymentMethods = dashboardData?.data?.paymentMethods?.map((p) => ({
    name: p.metode_pembayaran,
    value: Number(p.total_amount) || 0,
  })) || [];

  const expenseAnalysis = dashboardData?.data?.expenseAnalysis?.map((e) => ({
    name: e.expense_category,
    value: Number(e.total_amount) || 0,
  })) || [];

  const taxAndFees = dashboardData?.data?.taxAndFees;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Laporan Keuangan Global</h1>

      {/* Filter Section */}
      <Card className="mb-6">
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium flex items-center">
              <ListFilter className="mr-2" size={20} />
              Filter Laporan
            </h2>
            <div className="flex space-x-2">
              <Button onClick={handleRefreshData} icon={<RefreshCcw size={16} />}>
                Refresh
              </Button>
              <ExportDropdown
                reportType="financial"
                params={exportParams}
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DateInput
              id="start-date"
              label="Tanggal Mulai"
              value={startDate}
              onChange={(e) => setStartDate(new Date(e.target.value))}
            />

            <DateInput
              id="end-date"
              label="Tanggal Akhir"
              value={endDate}
              onChange={(e) => setEndDate(new Date(e.target.value))}
            />

            <FormSelect
              id="cabang"
              label="Cabang"
              value={cabangFilter}
              onChange={(e) => setCabangFilter(e.target.value)}
              options={cabangOptions}
            />
          </div>
        </CardContent>
      </Card>

      {/* Report Time Range Information */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-gray-600">
          Periode: {formatDateFull(startDate)} - {formatDateFull(endDate)}
        </p>
        <StatusChip
          label={
            cabangFilter === "all" ? "Tampilan Global" : "Tampilan Per Cabang"
          }
          color={cabangFilter === "all" ? "primary" : "secondary"}
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <MetricCard
          title="Total Pendapatan"
          value={
            loading ? (
              <LoadingIndicator size="sm" />
            ) : (
              formatCurrency(summaryMetrics.total_pendapatan || 0)
            )
          }
        />

        <MetricCard
          title="Total Pengeluaran"
          value={
            loading ? (
              <LoadingIndicator size="sm" />
            ) : (
              formatCurrency(summaryMetrics.total_pengeluaran || 0)
            )
          }
        />

        <MetricCard
          title="Keuntungan Bersih"
          value={
            loading ? (
              <LoadingIndicator size="sm" />
            ) : (
              formatCurrency(summaryMetrics.keuntungan_bersih || 0)
            )
          }
          trend={
            (summaryMetrics.keuntungan_bersih || 0) >= 0
              ? { positive: true, value: "" }
              : { positive: false, value: "" }
          }
        />

        <MetricCard
          title="Margin Keuntungan"
          value={
            loading ? (
              <LoadingIndicator size="sm" />
            ) : (
              `${(summaryMetrics.margin_keuntungan || 0)}%`
            )
          }
          trend={
            (summaryMetrics.margin_keuntungan || 0) >= 0
              ? { positive: true, value: "" }
              : { positive: false, value: "" }
          }
        />
      </div>

      {/* Tab Navigation */}
      <ReportTabs tabs={tabs} activeTab={tabValue} onChange={handleChangeTab} />

      {/* Revenue & Expense Trend Chart */}
      {tabValue === 0 && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-medium mb-4">
              Trend Pendapatan & Pengeluaran
            </h3>
            {loading ? (
              <LoadingIndicator />
            ) : trendData.length > 0 ? (
              <>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={trendData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatDateForChart}
                      />
                      <YAxis
                        tickFormatter={(value) =>
                          `${(value / 1000000).toFixed(0)}jt`
                        }
                      />
                      <RechartsTooltip
                        formatter={(value) => formatCurrency(value)}
                        labelFormatter={(label) => formatDateFull(label)}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        name="Pendapatan"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="expenses"
                        name="Pengeluaran"
                        stroke="#ff7300"
                        activeDot={{ r: 8 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="profit"
                        name="Keuntungan"
                        stroke="#28a745"
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <Divider />

                <h3 className="text-lg font-medium mb-4">
                  Detail Pendapatan & Pengeluaran
                </h3>
                <DataTable
                  columns={[
                    {
                      header: "Tanggal",
                      cell: (row) => formatDateFull(row.date),
                    },
                    {
                      header: "Pendapatan",
                      cell: (row) => formatCurrency(row.revenue),
                      cellClassName: "text-right",
                    },
                    {
                      header: "Pengeluaran",
                      cell: (row) => formatCurrency(row.expenses),
                      cellClassName: "text-right",
                    },
                    {
                      header: "Keuntungan",
                      cell: (row) => (
                        <span
                          className={
                            row.profit >= 0 ? "text-green-600" : "text-red-600"
                          }
                        >
                          {formatCurrency(row.profit)}
                        </span>
                      ),
                      cellClassName: "text-right",
                    },
                    {
                      header: "Margin (%)",
                      cell: (row) => {
                        const margin = row.revenue > 0 ? (row.profit / row.revenue) * 100 : 0;
                        return (
                          <span
                            className={margin >= 0 ? "text-green-600" : "text-red-600"}
                          >
                            {margin.toFixed(2)}%
                          </span>
                        );
                      },
                      cellClassName: "text-right",
                    },
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

      {/* Payment Methods Chart */}
      {tabValue === 1 && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-medium mb-4">Metode Pembayaran</h3>
            {loading ? (
              <LoadingIndicator />
            ) : paymentMethods.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentMethods}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${formatPaymentMethod(name)}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {paymentMethods.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(value) => formatCurrency(value)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <DataTable
                    columns={[
                      {
                        header: "Metode Pembayaran",
                        cell: (row, index) => (
                          <div className="flex items-center">
                            <div
                              className="w-4 h-4 rounded-full mr-2"
                              style={{
                                backgroundColor: COLORS[index % COLORS.length],
                              }}
                            ></div>
                            {formatPaymentMethod(row.name)}
                          </div>
                        ),
                      },
                      {
                        header: "Total",
                        cell: (row) => formatCurrency(row.value),
                        cellClassName: "text-right",
                      },
                      {
                        header: "Persentase",
                        cell: (row) => {
                          const totalValue = paymentMethods.reduce(
                            (sum, method) => sum + method.value,
                            0
                          );
                          return `${((row.value / totalValue) * 100).toFixed(2)}%`;
                        },
                        cellClassName: "text-right",
                      },
                    ]}
                    data={paymentMethods}
                  />
                </div>
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">Tidak ada data untuk ditampilkan</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Expense Analysis */}
      {tabValue === 2 && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-medium mb-4">Analisis Pengeluaran</h3>
            {loading ? (
              <LoadingIndicator />
            ) : expenseAnalysis.length > 0 ? (
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={expenseAnalysis}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      tickFormatter={(value) =>
                        `${(value / 1000000).toFixed(1)}jt`
                      }
                    />
                    <YAxis type="category" dataKey="name" />
                    <RechartsTooltip
                      formatter={(value) => formatCurrency(value)}
                    />
                    <Legend />
                    <Bar dataKey="value" name="Pengeluaran" fill="#ff7300" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">Tidak ada data untuk ditampilkan</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tax & Fees Chart */}
      {tabValue === 3 && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-medium mb-4">Pajak & Biaya Tambahan</h3>
            {loading ? (
              <LoadingIndicator />
            ) : taxAndFees ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h4 className="text-base font-medium mb-2">Total Pajak</h4>
                  <p className="text-2xl font-bold mb-1">
                    {formatCurrency(taxAndFees.taxSummary?.total_tax || 0)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {taxAndFees.taxSummary?.tax_percentage}% dari total pendapatan
                  </p>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h4 className="text-base font-medium mb-2">Biaya Layanan</h4>
                  <p className="text-2xl font-bold mb-1">
                    {formatCurrency(taxAndFees.taxSummary?.total_fees || 0)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {taxAndFees.taxSummary?.fees_percentage}% dari total pendapatan
                  </p>
                </div>

                {taxAndFees.feesByPaymentMethod && taxAndFees.feesByPaymentMethod.length > 0 && (
                  <div className="col-span-1 md:col-span-2 mt-4">
                    <h4 className="text-base font-medium mb-4">
                      Biaya Transaksi per Metode Pembayaran
                    </h4>
                    <DataTable
                      columns={[
                        {
                          header: "Metode Pembayaran",
                          cell: (row) => formatPaymentMethod(row.metode_pembayaran),
                        },
                        {
                          header: "Total Transaksi",
                          cell: (row) => formatCurrency(row.total_amount),
                          cellClassName: "text-right",
                        },
                        {
                          header: "Biaya Layanan",
                          cell: (row) => formatCurrency(row.transaction_fees),
                          cellClassName: "text-right",
                        },
                        {
                          header: "Persentase Biaya",
                          cell: (row) => `${row.fee_percentage}%`,
                          cellClassName: "text-right",
                        },
                      ]}
                      data={taxAndFees.feesByPaymentMethod}
                    />
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">Tidak ada data untuk ditampilkan</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FinanceReport;
