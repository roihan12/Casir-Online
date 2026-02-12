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
  BarChart2,
  PieChart as PieChartIcon,
  TrendingUp,
  Map,
  ListFilter,
} from "lucide-react";
import { useCabang } from "@features/cabang/hooks/useCabang";
import { useSalesReport, useSalesSummary, useTopProducts, useSalesByCategory, useBranchReport } from "../hooks/useReports";
import { useUserBranches } from "../hooks/useUserBranches";
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
import BranchMultiSelect from "../components/BranchMultiSelect";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#8dd1e1",
  "#a4de6c",
  "#d0ed57",
];

const SalesReport = () => {
  const [tabValue, setTabValue] = useState(0);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());
  const [viewType, setViewType] = useState("daily");
  
  // Multi-branch selection with localStorage preference
  const {
    availableBranches,
    selectedBranches,
    setSelectedBranches,
    cabangFilterParam,
    isDisabled,
  } = useUserBranches('sales');

  console.log("availableBranches", availableBranches);

  // Format dates for API
  const apiParams = useMemo(() => {
    const formatDate = (date) => {
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };
    return {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      cabangId: cabangFilterParam,
    };
  }, [startDate, endDate, cabangFilterParam]);

  const salesParams = { ...apiParams, viewType };

  // Fetch data using real API
  const { data: salesReportData, isLoading: loadingSales, refetch: refetchSales } = useSalesReport(salesParams);
  const { data: summaryData, isLoading: loadingSummary } = useSalesSummary(apiParams);
  const { data: topProductsData, isLoading: loadingProducts } = useTopProducts(apiParams);
  const { data: categoriesData, isLoading: loadingCategories } = useSalesByCategory(apiParams);
  const { data: branchData, isLoading: loadingBranch } = useBranchReport(apiParams);

  const loading = loadingSales || loadingSummary || loadingProducts || loadingCategories || loadingBranch;

  // Format dates for export params
  const exportParams = apiParams;

  const handleChangeTab = (newValue) => {
    setTabValue(newValue);
  };

  const handleRefreshData = () => {
    refetchSales();
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

  const tabs = [
    { value: 0, label: "Trend Penjualan", icon: <TrendingUp size={16} /> },
    { value: 1, label: "Produk Terlaris", icon: <BarChart2 size={16} /> },
    { value: 2, label: "Kategori", icon: <PieChartIcon size={16} /> },
    { value: 3, label: "Perbandingan Cabang", icon: <Map size={16} /> },
  ];

  const viewTypeOptions = [
    { value: "daily", label: "Harian" },
    { value: "weekly", label: "Mingguan" },
    { value: "monthly", label: "Bulanan" },
  ];

  // Prepare chart data
  const salesTrendData = salesReportData?.data?.trend?.map((t) => ({
    date: new Date(t.date),
    sales: Number(t.total) || 0,
    transactions: t.transactions || 0,
  })) || [];

  const summaryMetrics = summaryData?.data || {
    totalSales: 0,
    totalTransactions: 0,
    averageTransaction: 0,
    salesGrowth: 0,
  };

  const topProducts = topProductsData?.data || [];

  const topCategories = categoriesData?.data || [];

  const branchComparison = branchData?.data?.branches || [];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Laporan Penjualan Global</h1>

      {/* Filter Section */}
      <Card className="mb-6">
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium flex items-center">
              <ListFilter className="mr-2" size={20} />
              Filter Laporan
            </h2>
            <div className="flex space-x-2">
              <Button
                onClick={handleRefreshData}
                icon={<RefreshCcw size={16} />}
              >
                Refresh
              </Button>
              <ExportDropdown
                reportType="sales"
                params={exportParams}
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              id="view-type"
              label="Tampilan"
              value={viewType}
              onChange={(e) => setViewType(e.target.value)}
              options={viewTypeOptions}
            />

            <BranchMultiSelect
              availableBranches={availableBranches}
              selectedBranches={selectedBranches}
              onChange={setSelectedBranches}
              isDisabled={isDisabled}
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
            selectedBranches.length === availableBranches.length && !isDisabled
              ? "Semua Cabang" 
              : selectedBranches.length === 1
                ? `1 Cabang`
                : `${selectedBranches.length} Cabang`
          }
          color={selectedBranches.length === availableBranches.length ? "primary" : "secondary"}
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <MetricCard
          title="Total Penjualan"
          value={
            loadingSummary ? (
              <LoadingIndicator size="sm" />
            ) : (
              formatCurrency(summaryMetrics.totalSales)
            )
          }
          trend={
            summaryMetrics.salesGrowth >= 0
              ? {
                  positive: true,
                  value: `${summaryMetrics.salesGrowth.toFixed(2)}% dari periode sebelumnya`,
                }
              : {
                  positive: false,
                  value: `${summaryMetrics.salesGrowth.toFixed(2)}% dari periode sebelumnya`,
                }
          }
        />

        <MetricCard
          title="Total Transaksi"
          value={
            loadingSummary ? (
              <LoadingIndicator size="sm" />
            ) : (
              summaryMetrics.totalTransactions.toLocaleString()
            )
          }
        />

        <MetricCard
          title="Rata-rata Nilai Transaksi"
          value={
            loadingSummary ? (
              <LoadingIndicator size="sm" />
            ) : (
              formatCurrency(summaryMetrics.averageTransaction)
            )
          }
        />

        <MetricCard
          title="Jumlah Produk Terjual"
          value={
            loadingProducts ? (
              <LoadingIndicator size="sm" />
            ) : (
              topProducts.reduce((sum, item) => sum + item.quantity, 0).toLocaleString()
            )
          }
        />
      </div>

      {/* Tab Navigation */}
      <ReportTabs tabs={tabs} activeTab={tabValue} onChange={handleChangeTab} />

      {/* Sales Trend Chart */}
      {tabValue === 0 && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-medium mb-4">Trend Penjualan</h3>
            {loading ? (
              <LoadingIndicator />
            ) : salesTrendData.length > 0 ? (
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={salesTrendData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={formatDateForChart} />
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
                      dataKey="sales"
                      name="Penjualan"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">Tidak ada data untuk ditampilkan</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Top Products */}
      {tabValue === 1 && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-medium mb-4">Produk Terlaris</h3>
            {loading ? (
              <LoadingIndicator />
            ) : topProducts.length > 0 ? (
              <>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topProducts}
                      layout="vertical"
                      margin={{
                        top: 5,
                        right: 30,
                        left: 100,
                        bottom: 5,
                      }}
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
                      <Bar dataKey="sales" name="Penjualan" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <Divider />

                <h3 className="text-lg font-medium mb-4">
                  Detail Produk Terlaris
                </h3>
                <DataTable
                  columns={[
                    { header: "Nama Produk", accessor: "name" },
                    {
                      header: "Jumlah Terjual",
                      accessor: "quantity",
                      cell: (row) => row.quantity.toLocaleString(),
                      cellClassName: "text-right",
                    },
                    {
                      header: "Total Penjualan",
                      cell: (row) => formatCurrency(row.sales),
                      cellClassName: "text-right",
                    },
                    {
                      header: "Kontribusi (%)",
                      cell: (row) =>
                        `${(
                          (row.sales / summaryMetrics.totalSales) *
                          100
                        ).toFixed(2)}%`,
                      cellClassName: "text-right",
                    },
                  ]}
                  data={topProducts}
                />
              </>
            ) : (
              <p className="text-gray-600 text-center py-8">Tidak ada data untuk ditampilkan</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Categories Chart */}
      {tabValue === 2 && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-medium mb-4">Penjualan per Kategori</h3>
            {loading ? (
              <LoadingIndicator />
            ) : topCategories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={topCategories}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {topCategories.map((entry, index) => (
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
                        header: "Kategori",
                        cell: (row, index) => (
                          <div className="flex items-center">
                            <div
                              className="w-4 h-4 rounded-full mr-2"
                              style={{
                                backgroundColor: COLORS[index % COLORS.length],
                              }}
                            ></div>
                            {row.name}
                          </div>
                        ),
                      },
                      {
                        header: "Total Penjualan",
                        cell: (row) => formatCurrency(row.value),
                        cellClassName: "text-right",
                      },
                      {
                        header: "Persentase",
                        cell: (row) => `${row.percentage.toFixed(2)}%`,
                        cellClassName: "text-right",
                      },
                    ]}
                    data={topCategories}
                  />
                </div>
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">Tidak ada data untuk ditampilkan</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Branch Comparison */}
      {tabValue === 3 && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-medium mb-4">
              Perbandingan Penjualan antar Cabang
            </h3>
            {loading ? (
              <LoadingIndicator />
            ) : branchComparison.length > 0 ? (
              <>
                <div className="h-[400px] mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={branchComparison}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="namaCabang" />
                      <YAxis
                        tickFormatter={(value) =>
                          `${(value / 1000000).toFixed(0)}jt`
                        }
                      />
                      <RechartsTooltip
                        formatter={(value) => formatCurrency(value)}
                      />
                      <Legend />
                      <Bar
                        dataKey="totalPenjualan"
                        name="Penjualan"
                        fill="#8884d8"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <Divider />

                <h3 className="text-lg font-medium mb-4">
                  Detail Penjualan per Cabang
                </h3>
                <DataTable
                  columns={[
                    { header: "Cabang", accessor: "namaCabang" },
                    {
                      header: "Total Penjualan",
                      cell: (cabang) => formatCurrency(cabang.totalPenjualan),
                      cellClassName: "text-right",
                    },
                    {
                      header: "Jumlah Transaksi",
                      accessor: "totalTransaksi",
                      cell: (val) => val?.totalTransaksi || "0",
                      cellClassName: "text-right",
                    },
                    {
                      header: "Rata-rata Transaksi",
                      cell: (cabang) => formatCurrency(cabang.rataRata),
                      cellClassName: "text-right",
                    },
                    {
                      header: "Kontribusi (%)",
                      cell: (cabang) => `${cabang.kontribusi.toFixed(2)}%`,
                      cellClassName: "text-right",
                    },
                  ]}
                  data={branchComparison}
                />
              </>
            ) : (
              <p className="text-gray-600 text-center py-8">Tidak ada data cabang tersedia</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SalesReport;
