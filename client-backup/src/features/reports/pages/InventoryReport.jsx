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
  ListFilter,
  AlertTriangle,
  BarChart2,
  Package,
  Layers,
  TrendingUp,
} from "lucide-react";
import id from "date-fns/locale/id";
import { useCabang } from "@features/cabang/hooks/useCabang";
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
} from "../../../features/reports/components/ReportComponents";

// Mock data generator functions
const generateMockInventoryData = () => {
  const categories = [
    "Bahan Pokok",
    "Minuman",
    "Makanan Ringan",
    "Produk Kebersihan",
    "Produk Perawatan",
    "Alat Tulis",
    "Elektronik",
    "Lainnya",
  ];

  return categories.map((category) => ({
    name: category,
    totalProducts: Math.floor(Math.random() * 50) + 10,
    totalStock: Math.floor(Math.random() * 1000) + 100,
    stockValue: Math.floor(Math.random() * 50000000) + 5000000,
    lowStockItems: Math.floor(Math.random() * 5),
  }));
};

const generateMockStockMovementData = (days = 30) => {
  const data = [];
  const date = new Date();
  date.setDate(date.getDate() - days);

  for (let i = 0; i < days; i++) {
    date.setDate(date.getDate() + 1);
    data.push({
      date: new Date(date),
      stockIn: Math.floor(Math.random() * 100) + 20,
      stockOut: Math.floor(Math.random() * 80) + 10,
      adjustments: Math.floor(Math.random() * 10) - 5,
    });
  }
  return data;
};

const generateLowStockItems = () => {
  const items = [
    "Beras Premium 5kg",
    "Minyak Goreng 2L",
    "Susu UHT 1L",
    "Tepung Terigu 1kg",
    "Sabun Mandi",
    "Deterjen",
    "Tissue",
    "Kopi Instant 200gr",
    "Gula Pasir 1kg",
  ];

  return items.map((item) => ({
    name: item,
    currentStock: Math.floor(Math.random() * 10) + 1,
    minStock: Math.floor(Math.random() * 15) + 10,
    maxStock: Math.floor(Math.random() * 50) + 30,
    value: Math.floor(Math.random() * 1000000) + 100000,
    status: "low_stock", // or "out_of_stock"
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
];

const InventoryReport = () => {
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());
  const [cabangFilter, setCabangFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [inventoryData, setInventoryData] = useState([]);
  const [stockMovementData, setStockMovementData] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [reportMetrics, setReportMetrics] = useState({
    totalProducts: 0,
    totalStockValue: 0,
    totalLowStockItems: 0,
    totalOutOfStockItems: 0,
  });
  const { allCabang } = useCabang();

  // Fetch data effect
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Replace with actual API calls
        setTimeout(() => {
          const mockInventoryData = generateMockInventoryData();
          setInventoryData(mockInventoryData);

          const mockMovementData = generateMockStockMovementData();
          setStockMovementData(mockMovementData);

          const mockLowStockItems = generateLowStockItems();
          setLowStockItems(mockLowStockItems);

          // Calculate summary metrics
          setReportMetrics({
            totalProducts: mockInventoryData.reduce(
              (sum, item) => sum + item.totalProducts,
              0
            ),
            totalStockValue: mockInventoryData.reduce(
              (sum, item) => sum + item.stockValue,
              0
            ),
            totalLowStockItems: mockInventoryData.reduce(
              (sum, item) => sum + item.lowStockItems,
              0
            ),
            totalOutOfStockItems: Math.floor(Math.random() * 10),
          });

          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate, cabangFilter, categoryFilter]);

  const handleChangeTab = (newValue) => {
    setTabValue(newValue);
  };

  const handleExportReport = () => {
    // Implementation for exporting report
    alert("Export functionality will be implemented here");
  };

  const handleRefreshData = () => {
    // Refresh data
    setInventoryData([]);
    setStockMovementData([]);
    setLowStockItems([]);
    setReportMetrics({
      totalProducts: 0,
      totalStockValue: 0,
      totalLowStockItems: 0,
      totalOutOfStockItems: 0,
    });

    // Re-fetch data
    const mockInventoryData = generateMockInventoryData();
    setInventoryData(mockInventoryData);

    const mockMovementData = generateMockStockMovementData();
    setStockMovementData(mockMovementData);

    const mockLowStockItems = generateLowStockItems();
    setLowStockItems(mockLowStockItems);

    // Calculate summary metrics
    setReportMetrics({
      totalProducts: mockInventoryData.reduce(
        (sum, item) => sum + item.totalProducts,
        0
      ),
      totalStockValue: mockInventoryData.reduce(
        (sum, item) => sum + item.stockValue,
        0
      ),
      totalLowStockItems: mockInventoryData.reduce(
        (sum, item) => sum + item.lowStockItems,
        0
      ),
      totalOutOfStockItems: Math.floor(Math.random() * 10),
    });
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

  // Calculate stock level percentage
  const calculateStockPercentage = (current, min, max) => {
    if (current <= 0) return 0;
    if (max <= min) return 100; // avoid division by zero or negative
    const percentage = ((current - min) / (max - min)) * 100;
    return Math.max(0, Math.min(100, percentage)); // clamp between 0 and 100
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

  const categoryOptions = [
    { value: "all", label: "Semua Kategori" },
    ...inventoryData.map((category) => ({
      value: category.name,
      label: category.name,
    })),
  ];

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
              id="cabang"
              label="Cabang"
              value={cabangFilter}
              onChange={(e) => setCabangFilter(e.target.value)}
              options={cabangOptions}
            />

            <FormSelect
              id="category"
              label="Kategori"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={categoryOptions}
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
              reportMetrics.totalProducts.toLocaleString()
            )
          }
        />

        <MetricCard
          title="Nilai Inventory"
          value={
            loading ? (
              <LoadingIndicator size="sm" />
            ) : (
              formatCurrency(reportMetrics.totalStockValue)
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
              reportMetrics.totalLowStockItems
            )}
          </p>
        </div>

        <div className="bg-red-50 rounded-lg shadow-sm p-5">
          <p className="text-red-600 text-sm flex items-center mb-1">
            <AlertTriangle size={16} className="mr-1" /> Stok Habis
          </p>
          <p className="text-2xl font-semibold text-red-600">
            {loading ? (
              <LoadingIndicator size="sm" />
            ) : (
              reportMetrics.totalOutOfStockItems
            )}
          </p>
        </div>
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
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={inventoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="stockValue"
                      >
                        {inventoryData.map((entry, index) => (
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
                      {inventoryData.map((category, index) => (
                        <tr key={category.name}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div
                                className="w-4 h-4 rounded-full mr-2"
                                style={{
                                  backgroundColor:
                                    COLORS[index % COLORS.length],
                                }}
                              ></div>
                              {category.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            {category.totalProducts}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            {category.totalStock.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            {formatCurrency(category.stockValue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
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
            ) : (
              <>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={stockMovementData}
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
                      <YAxis />
                      <RechartsTooltip
                        labelFormatter={(label) => formatDateFull(label)}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="stockIn"
                        name="Stok Masuk"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="stockOut"
                        name="Stok Keluar"
                        stroke="#ff7300"
                        activeDot={{ r: 8 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="adjustments"
                        name="Penyesuaian"
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
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tanggal
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stok Masuk
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stok Keluar
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Penyesuaian
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Perubahan Bersih
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {stockMovementData.map((day) => (
                        <tr key={day.date.toString()}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {formatDateFull(day.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            {day.stockIn}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            {day.stockOut}
                          </td>
                          <td
                            className={`px-6 py-4 whitespace-nowrap text-right ${
                              day.adjustments >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {day.adjustments > 0
                              ? `+${day.adjustments}`
                              : day.adjustments}
                          </td>
                          <td
                            className={`px-6 py-4 whitespace-nowrap text-right ${
                              day.stockIn - day.stockOut + day.adjustments >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {day.stockIn - day.stockOut + day.adjustments}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Low Stock Items Tab */}
      {tabValue === 2 && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-medium mb-4">
              Daftar Produk dengan Stok Menipis
            </h3>
            {loading ? (
              <LoadingIndicator />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nama Produk
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stok Saat Ini
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stok Minimum
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stok Maksimum
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Level Stok
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nilai Inventory
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {lowStockItems.map((item) => {
                      const stockPercentage = calculateStockPercentage(
                        item.currentStock,
                        item.minStock,
                        item.maxStock
                      );
                      let statusColor = "success";
                      let statusText = "Normal";

                      if (item.currentStock === 0) {
                        statusColor = "error";
                        statusText = "Stok Habis";
                      } else if (item.currentStock < item.minStock) {
                        statusColor = "warning";
                        statusText = "Stok Menipis";
                      }

                      return (
                        <tr key={item.name}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {item.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            {item.currentStock}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            {item.minStock}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            {item.maxStock}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="relative w-full h-2 bg-gray-200 rounded mr-2">
                                <div
                                  className={`absolute top-0 left-0 h-2 rounded ${
                                    statusColor === "error"
                                      ? "bg-red-500"
                                      : statusColor === "warning"
                                      ? "bg-yellow-500"
                                      : "bg-green-500"
                                  }`}
                                  style={{ width: `${stockPercentage}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-500 min-w-[35px]">
                                {Math.round(stockPercentage)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            {formatCurrency(item.value)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <StatusChip
                              label={statusText}
                              color={statusColor}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stock Turnover Tab */}
      {tabValue === 3 && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-medium mb-4">
              Performa Perputaran Stok
            </h3>
            {loading ? (
              <LoadingIndicator />
            ) : (
              <>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={inventoryData.map((category) => ({
                        name: category.name,
                        turnover: (Math.random() * 5 + 1).toFixed(2),
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
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Bar
                        dataKey="turnover"
                        name="Perputaran Stok"
                        fill="#8884d8"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <Divider />

                <h3 className="text-lg font-medium my-4">
                  Detail Perputaran Stok per Kategori
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kategori
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nilai Inventory
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Penjualan (30 hari)
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Perputaran Stok
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rata-rata Hari Stok
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {inventoryData.map((category) => {
                        const turnover = parseFloat(
                          (Math.random() * 5 + 1).toFixed(2)
                        );
                        const sales = Math.floor(
                          category.stockValue * turnover
                        );
                        const daysOnHand = Math.floor(30 / turnover);

                        return (
                          <tr key={category.name}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {category.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              {formatCurrency(category.stockValue)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              {formatCurrency(sales)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              {turnover}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              {daysOnHand} hari
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InventoryReport;
