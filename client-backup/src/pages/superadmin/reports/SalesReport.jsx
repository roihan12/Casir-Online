import React, { useState, useEffect } from "react";
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
  Download,
  RefreshCcw,
  BarChart2,
  PieChart as PieChartIcon,
  TrendingUp,
  Map,
  ListFilter,
} from "lucide-react";
import id from "date-fns/locale/id";
import { useCabang } from "../../../features/cabang/hooks/useCabang";
import formatCurrency from "../../../utils/formatCurrency";
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
} from "../../../components/reports/ReportComponents";

// Mock data - replace with actual API calls
const generateMockSalesData = (days = 30) => {
  const data = [];
  const date = new Date();
  date.setDate(date.getDate() - days);

  for (let i = 0; i < days; i++) {
    date.setDate(date.getDate() + 1);
    data.push({
      date: new Date(date),
      sales: Math.floor(Math.random() * 10000000) + 1000000,
      transactions: Math.floor(Math.random() * 100) + 10,
    });
  }
  return data;
};

const generateMockProductData = () => {
  const products = [
    "Beras Premium 5kg",
    "Minyak Goreng 2L",
    "Gula Pasir 1kg",
    "Telur Ayam 1kg",
    "Tepung Terigu 1kg",
    "Kopi Instant 200gr",
    "Susu UHT 1L",
    "Mie Instant",
    "Sabun Mandi",
    "Deterjen",
  ];

  return products.map((product) => ({
    name: product,
    sales: Math.floor(Math.random() * 5000000) + 500000,
    quantity: Math.floor(Math.random() * 500) + 50,
  }));
};

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
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());
  const [viewType, setViewType] = useState("daily");
  const [cabangFilter, setCabangFilter] = useState("all");
  const [salesData, setSalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  const [reportMetrics, setReportMetrics] = useState({
    totalSales: 0,
    totalTransactions: 0,
    averageTransaction: 0,
    salesGrowth: 0,
  });
  const { allCabang } = useCabang();

  // Fetch data effect
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Replace with actual API calls
        setTimeout(() => {
          const mockSalesData = generateMockSalesData(30);
          setSalesData(mockSalesData);
          setTopProducts(generateMockProductData());

          // Calculate summary metrics
          const totalSales = mockSalesData.reduce(
            (sum, item) => sum + item.sales,
            0
          );
          const totalTransactions = mockSalesData.reduce(
            (sum, item) => sum + item.transactions,
            0
          );

          setReportMetrics({
            totalSales,
            totalTransactions,
            averageTransaction: totalSales / totalTransactions,
            salesGrowth: 7.5, // Mock growth percentage
          });

          // Mock category data
          setTopCategories([
            { name: "Bahan Pokok", value: 3500000 },
            { name: "Minuman", value: 2500000 },
            { name: "Makanan Ringan", value: 1800000 },
            { name: "Produk Kebersihan", value: 1200000 },
            { name: "Produk Perawatan", value: 800000 },
          ]);

          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate, viewType, cabangFilter]);

  const handleChangeTab = (newValue) => {
    setTabValue(newValue);
  };

  const handleExportReport = () => {
    // Implementation for exporting report
    alert("Export functionality will be implemented here");
  };

  const handleRefreshData = () => {
    // Refresh data
    setSalesData([]);
    setTopProducts([]);
    setTopCategories([]);
    setReportMetrics({
      totalSales: 0,
      totalTransactions: 0,
      averageTransaction: 0,
      salesGrowth: 0,
    });

    // Re-fetch data
    const mockSalesData = generateMockSalesData(30);
    setSalesData(mockSalesData);
    setTopProducts(generateMockProductData());

    // Calculate summary metrics
    const totalSales = mockSalesData.reduce((sum, item) => sum + item.sales, 0);
    const totalTransactions = mockSalesData.reduce(
      (sum, item) => sum + item.transactions,
      0
    );

    setReportMetrics({
      totalSales,
      totalTransactions,
      averageTransaction: totalSales / totalTransactions,
      salesGrowth: Math.random() * 10, // Random growth percentage
    });

    // Mock category data
    setTopCategories([
      {
        name: "Bahan Pokok",
        value: Math.floor(Math.random() * 4000000) + 1000000,
      },
      { name: "Minuman", value: Math.floor(Math.random() * 3000000) + 1000000 },
      {
        name: "Makanan Ringan",
        value: Math.floor(Math.random() * 2000000) + 1000000,
      },
      {
        name: "Produk Kebersihan",
        value: Math.floor(Math.random() * 1500000) + 500000,
      },
      {
        name: "Produk Perawatan",
        value: Math.floor(Math.random() * 1000000) + 500000,
      },
    ]);
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

  const cabangOptions = [
    { value: "all", label: "Semua Cabang" },
    ...(allCabang
      ? allCabang.map((cabang) => ({
          value: cabang.id,
          label: cabang.namaCabang,
        }))
      : []),
  ];

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
              <Button
                onClick={handleExportReport}
                variant="primary"
                icon={<Download size={16} />}
              >
                Export
              </Button>
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
          title="Total Penjualan"
          value={
            loading ? (
              <LoadingIndicator size="sm" />
            ) : (
              formatCurrency(reportMetrics.totalSales)
            )
          }
          trend={
            reportMetrics.salesGrowth >= 0
              ? {
                  positive: true,
                  value: `${reportMetrics.salesGrowth.toFixed(
                    2
                  )}% dari periode sebelumnya`,
                }
              : {
                  positive: false,
                  value: `${reportMetrics.salesGrowth.toFixed(
                    2
                  )}% dari periode sebelumnya`,
                }
          }
        />

        <MetricCard
          title="Total Transaksi"
          value={
            loading ? (
              <LoadingIndicator size="sm" />
            ) : (
              reportMetrics.totalTransactions.toLocaleString()
            )
          }
        />

        <MetricCard
          title="Rata-rata Nilai Transaksi"
          value={
            loading ? (
              <LoadingIndicator size="sm" />
            ) : (
              formatCurrency(reportMetrics.averageTransaction)
            )
          }
        />

        <MetricCard
          title="Jumlah Produk Terjual"
          value={
            loading ? (
              <LoadingIndicator size="sm" />
            ) : (
              topProducts
                .reduce((sum, item) => sum + item.quantity, 0)
                .toLocaleString()
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
            ) : (
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={salesData}
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
            ) : (
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
                          (row.sales / reportMetrics.totalSales) *
                          100
                        ).toFixed(2)}%`,
                      cellClassName: "text-right",
                    },
                  ]}
                  data={topProducts}
                />
              </>
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
            ) : (
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
                        cell: (row) => {
                          const totalValue = topCategories.reduce(
                            (sum, cat) => sum + cat.value,
                            0
                          );
                          return `${((row.value / totalValue) * 100).toFixed(
                            2
                          )}%`;
                        },
                        cellClassName: "text-right",
                      },
                    ]}
                    data={topCategories}
                  />
                </div>
              </div>
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
            ) : (
              <>
                {allCabang && allCabang.length > 0 ? (
                  <>
                    <div className="h-[400px] mb-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={allCabang.map((c) => ({
                            name: c.namaCabang,
                            sales:
                              Math.floor(Math.random() * 10000000) + 1000000,
                            transactions: Math.floor(Math.random() * 500) + 50,
                          }))}
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
                            dataKey="sales"
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
                          cell: (cabang) => {
                            const sales =
                              Math.floor(Math.random() * 10000000) + 1000000;
                            return formatCurrency(sales);
                          },
                          cellClassName: "text-right",
                        },
                        {
                          header: "Jumlah Transaksi",
                          cell: () => {
                            const transactions =
                              Math.floor(Math.random() * 500) + 50;
                            return transactions;
                          },
                          cellClassName: "text-right",
                        },
                        {
                          header: "Rata-rata Transaksi",
                          cell: () => {
                            const sales =
                              Math.floor(Math.random() * 10000000) + 1000000;
                            const transactions =
                              Math.floor(Math.random() * 500) + 50;
                            return formatCurrency(sales / transactions);
                          },
                          cellClassName: "text-right",
                        },
                        {
                          header: "Kontribusi (%)",
                          cell: () => {
                            const sales =
                              Math.floor(Math.random() * 10000000) + 1000000;
                            return `${(
                              (sales / reportMetrics.totalSales) *
                              100
                            ).toFixed(2)}%`;
                          },
                          cellClassName: "text-right",
                        },
                      ]}
                      data={allCabang}
                    />
                  </>
                ) : (
                  <p className="text-gray-600">
                    Tidak ada data cabang tersedia
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SalesReport;
