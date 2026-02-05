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
  AlertTriangle,
  BarChart2,
  Layers,
  TrendingUp,
} from "lucide-react";
import { useCabang } from "@features/cabang/hooks/useCabang";
import { useInventoryReport, useInventoryMovements } from "../hooks/useReports";
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

const InventoryReport = () => {
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
      cabangId: cabangFilter,
    };
  }, [cabangFilter]);

  const movementsParams = useMemo(() => {
    const formatDate = (date) => {
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };
    return {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      cabangId: cabangFilter === "all" ? allCabang?.[0]?.id || "" : cabangFilter,
      groupBy: "day",
    };
  }, [startDate, endDate, cabangFilter, allCabang]);

  // Fetch data using real API
  const { data: dashboardData, isLoading: loadingDashboard, refetch: refetchDashboard } = useInventoryReport(apiParams);
  const { data: movementsData } = useInventoryMovements(movementsParams);

  const loading = loadingDashboard;

  // Format dates for export params
  const exportParams = useMemo(() => {
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

  const tabs = [
    { value: 0, label: "Ringkasan Kategori", icon: <Layers size={16} /> },
    { value: 1, label: "Pergerakan Stok", icon: <TrendingUp size={16} /> },
    { value: 2, label: "Stok Menipis", icon: <AlertTriangle size={16} /> },
    { value: 3, label: "Performa Perputaran", icon: <BarChart2 size={16} /> },
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

  // Prepare data
  const summaryMetrics = dashboardData?.data?.summary || {
    totalProducts: 0,
    totalStock: 0,
    totalInventoryValue: 0,
    lowStockCount: 0,
  };

  const categorySummary = dashboardData?.data?.categorySummary || [];
  const recentMovements = dashboardData?.data?.recentMovements || [];

  // For stock movements chart
  const timeSeriesData = movementsData?.data?.timeSeriesData || [];
  const productSummary = movementsData?.data?.productSummary || [];

  // Calculate low stock items
  const lowStockItems = categorySummary
    .filter((cat) => cat.productCount > 0)
    .flatMap((cat) => {
      const items = [];
      for (let i = 0; i < Math.min(3, cat.productCount); i++) {
        items.push({
          name: `${cat.categoryName} - Produk ${i + 1}`,
          currentStock: Math.floor(Math.random() * 10) + 1,
          minStock: 10,
          maxStock: 50,
          value: Math.floor(Math.random() * 1000000) + 100000,
        });
      }
      return items;
    });

  // Stock turnover data
  const turnoverData = categorySummary.map((cat) => ({
    name: cat.categoryName,
    turnover: cat.productCount > 0 ? (Math.random() * 5 + 1).toFixed(2) : "0.00",
    stockValue: cat.totalValue,
  }));

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Laporan Inventori Global</h1>

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
                reportType="inventory"
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
          title="Total Produk"
          value={
            loading ? (
              <LoadingIndicator size="sm" />
            ) : (
              summaryMetrics.totalProducts.toLocaleString()
            )
          }
        />

        <MetricCard
          title="Nilai Inventory"
          value={
            loading ? (
              <LoadingIndicator size="sm" />
            ) : (
              formatCurrency(summaryMetrics.totalInventoryValue)
            )
          }
        />

        <div className="bg-yellow-50 rounded-lg shadow-sm p-5">
          <p className="text-yellow-600 text-sm flex items-center mb-1">
            <AlertTriangle size={16} className="mr-1" /> Stok Menipis
          </p>
          <p className="text-2xl font-semibold text-yellow-600">
            {loading ? (
              <LoadingIndicator size="sm" />
            ) : (
              summaryMetrics.lowStockCount
            )}
          </p>
        </div>

        <MetricCard
          title="Total Unit Stok"
          value={
            loading ? (
              <LoadingIndicator size="sm" />
            ) : (
              summaryMetrics.totalStock.toLocaleString()
            )
          }
        />
      </div>

      {/* Tab Navigation */}
      <ReportTabs tabs={tabs} activeTab={tabValue} onChange={handleChangeTab} />

      {/* Category Summary Tab */}
      {tabValue === 0 && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-medium mb-4">
              Ringkasan Inventori per Kategori
            </h3>
            {loading ? (
              <LoadingIndicator />
            ) : categorySummary.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categorySummary}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="totalValue"
                      >
                        {categorySummary.map((entry, index) => (
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
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kategori
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Jumlah Produk
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Unit Stok
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nilai Inventory
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {categorySummary.map((category, index) => (
                        <tr key={category.name}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div
                                className="w-4 h-4 rounded-full mr-2"
                                style={{
                                  backgroundColor: COLORS[index % COLORS.length],
                                }}
                              ></div>
                              {category.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            {category.productCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            {category.totalStock.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            {formatCurrency(category.totalValue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">Tidak ada data untuk ditampilkan</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stock Movement Chart Tab */}
      {tabValue === 1 && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-medium mb-4">Pergerakan Stok</h3>
            {loading ? (
              <LoadingIndicator />
            ) : timeSeriesData.length > 0 ? (
              <>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={timeSeriesData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="period"
                        tickFormatter={formatDateForChart}
                      />
                      <YAxis />
                      <RechartsTooltip
                        labelFormatter={(label) => formatDateFull(label)}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="inflow"
                        name="Stok Masuk"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="outflow"
                        name="Stok Keluar"
                        stroke="#ff7300"
                        activeDot={{ r: 8 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="netChange"
                        name="Perubahan Bersih"
                        stroke="#28a745"
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <Divider />

                <h3 className="text-lg font-medium my-4">
                  Detail Pergerakan Stok
                </h3>
                <DataTable
                  columns={[
                    {
                      header: "Periode",
                      cell: (row) => formatDateFull(row.period),
                    },
                    {
                      header: "Stok Masuk",
                      accessor: "inflow",
                      cellClassName: "text-right text-green-600",
                    },
                    {
                      header: "Stok Keluar",
                      accessor: "outflow",
                      cellClassName: "text-right text-red-600",
                    },
                    {
                      header: "Perubahan Bersih",
                      cell: (row) => (
                        <span className={row.netChange >= 0 ? "text-green-600" : "text-red-600"}>
                          {row.netChange >= 0 ? "+" : ""}{row.netChange}
                        </span>
                      ),
                      cellClassName: "text-right",
                    },
                  ]}
                  data={timeSeriesData}
                />
              </>
            ) : (
              <p className="text-gray-600 text-center py-8">Tidak ada data untuk ditampilkan</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Low Stock Items Tab */}
      {tabValue === 2 && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-medium mb-4">
              Produk dengan Pergerakan Tertinggi
            </h3>
            {loading ? (
              <LoadingIndicator />
            ) : productSummary.length > 0 ? (
              <DataTable
                columns={[
                  { header: "Nama Produk", accessor: "productName" },
                  {
                    header: "Total Pergerakan",
                    cell: (row) => (row.inflow + row.outflow).toLocaleString(),
                    cellClassName: "text-right",
                  },
                  {
                    header: "Stok Masuk",
                    accessor: "inflow",
                    cellClassName: "text-right text-green-600",
                  },
                  {
                    header: "Stok Keluar",
                    accessor: "outflow",
                    cellClassName: "text-right text-red-600",
                  },
                  {
                    header: "Perubahan Bersih",
                    cell: (row) => (
                      <span className={row.netChange >= 0 ? "text-green-600" : "text-red-600"}>
                        {row.netChange >= 0 ? "+" : ""}{row.netChange}
                      </span>
                    ),
                    cellClassName: "text-right",
                  },
                ]}
                data={productSummary.slice(0, 20)}
              />
            ) : (
              <p className="text-gray-600 text-center py-8">Tidak ada data untuk ditampilkan</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stock Turnover Tab */}
      {tabValue === 3 && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-medium mb-4">
              Nilai Inventory per Kategori
            </h3>
            {loading ? (
              <LoadingIndicator />
            ) : categorySummary.length > 0 ? (
              <>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={categorySummary}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
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
                        dataKey="totalValue"
                        name="Nilai Inventory"
                        fill="#8884d8"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <Divider />

                <h3 className="text-lg font-medium my-4">
                  Detail Nilai Inventory per Kategori
                </h3>
                <DataTable
                  columns={[
                    { header: "Kategori", accessor: "name" },
                    {
                      header: "Jumlah Produk",
                      accessor: "productCount",
                      cellClassName: "text-right",
                    },
                    {
                      header: "Total Stok",
                      accessor: "totalStock",
                      cellClassName: "text-right",
                    },
                    {
                      header: "Nilai Inventory",
                      cell: (row) => formatCurrency(row.totalValue),
                      cellClassName: "text-right",
                    },
                  ]}
                  data={categorySummary}
                />
              </>
            ) : (
              <p className="text-gray-600 text-center py-8">Tidak ada data untuk ditampilkan</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InventoryReport;
