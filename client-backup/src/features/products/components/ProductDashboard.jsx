import React, { useState, useEffect } from "react";
import {
  Package,
  AlertTriangle,
  Tag,
  TrendingUp,
  Layers,
  PieChart,
  ChevronDown,
  ChevronUp,
  BarChart2,
  DollarSign,
  Archive,
  ShoppingCart,
  Eye,
  ArrowRight,
  Clock,
  AlertCircle,
  Truck,
  Info,
  FileText,
  Clipboard,
  Database,
  Box,
  Scale,
  Ruler,
  Hash,
  Image,
  Star,
  MoreHorizontal,
  Edit,
  Trash,
  Maximize,
  Plus,
  Filter,
  Search,
  Check,
  Zap,
  ExternalLink,
  Activity,
  Percent,
  Calendar,
  Barcode,
  Bookmark,
  MapPin,
  TrendingDown,
  AlertOctagon,
  ThumbsUp,
  ThumbsDown,
  BarChartHorizontal,
  ArrowUpRight,
} from "lucide-react";
import {
  useProdukMasterList,
  useProdukMasterDashboard,
} from "../hooks/useProdukMasterQueries";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as RechartPieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
} from "recharts";

// Stock status component
const StockStatus = ({ stock, minimumStock = 5 }) => {
  let status, icon, colorClass;

  if (stock <= 0) {
    status = "Habis";
    icon = <AlertTriangle className="h-4 w-4" />;
    colorClass = "bg-red-100 text-red-800";
  } else if (stock < minimumStock) {
    status = "Rendah";
    icon = <AlertCircle className="h-4 w-4" />;
    colorClass = "bg-yellow-100 text-yellow-800";
  } else if (stock < minimumStock * 2) {
    status = "Menipis";
    icon = <Clock className="h-4 w-4" />;
    colorClass = "bg-orange-100 text-orange-800";
  } else {
    status = "Baik";
    icon = <Package className="h-4 w-4" />;
    colorClass = "bg-green-100 text-green-800";
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}
    >
      {icon}
      <span className="ml-1">{status}</span>
      <span className="ml-1 font-bold">{stock}</span>
    </span>
  );
};

const ProductDashboard = ({
  onViewProduct,
  className = "",
  dashboardData: initialDashboardData = null,
  fetchOwnData = false,
}) => {
  const [showDistribution, setShowDistribution] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState("category");
  const [showAllCriticalStock, setShowAllCriticalStock] = useState(false);
  const [showProductMasterDetails, setShowProductMasterDetails] =
    useState(false);
  const [showSpecifications, setShowSpecifications] = useState(false);
  const [showImages, setShowImages] = useState(false);
  const [showRecentProducts, setShowRecentProducts] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showNewBranchProducts, setShowNewBranchProducts] = useState(true);
  const [showBusinessInsights, setShowBusinessInsights] = useState(true);
  const [showProfitability, setShowProfitability] = useState(true);
  const [showStockTurnover, setShowStockTurnover] = useState(true);
  const [showCategoryPerformance, setShowCategoryPerformance] = useState(true);
  const [showSalesTrend, setShowSalesTrend] = useState(true);
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [showBranchBreakdown, setShowBranchBreakdown] = useState(false);
  const [activeTab, setActiveTab] = useState("insights"); // New state for tabs: insights, products, distribution

  const { data: fetchedDashboardData, isLoading: isLoadingDashboard } =
    useProdukMasterDashboard({
      enabled: fetchOwnData && !initialDashboardData,
    });

  const effectiveDashboardData =
    initialDashboardData || fetchedDashboardData?.data || {};
  const isLoading = fetchOwnData ? isLoadingDashboard : false;
  const useDashboardData = true;

  const summaryData = effectiveDashboardData?.summaryData || {};
  const attributeData = effectiveDashboardData?.attributeData || {};
  const imageData = effectiveDashboardData?.imageData || {};
  const statusData = effectiveDashboardData?.statusData || {};
  const topProductsData = effectiveDashboardData?.topProducts || [];
  const newProductsData = effectiveDashboardData?.newProducts || {
    master: [],
    branch: [],
  };
  const productDistributionData =
    effectiveDashboardData?.productDistribution || [];
  const productApiData = effectiveDashboardData?.productData || {};
  const stockOutProductsData = productApiData?.stockOut || [];
  const inventoryValue = summaryData.inventoryValue || {
    totalValue: 0,
    perCabang: [],
  };

  const totalProducts = useDashboardData
    ? summaryData.totalProduct?.total || 0
    : 0;

  const stockLow = effectiveDashboardData?.summaryData?.stockLow?.count || 0;
  const stockOut = effectiveDashboardData?.summaryData?.stockOut?.count || 0;

  const activeProducts = useDashboardData ? statusData.active?.count || 0 : 0;

  const inactiveProducts = useDashboardData
    ? statusData.inactive?.count || 0
    : 0;

  const outOfStockProducts = useDashboardData ? stockOut || 0 : 0;

  const lowStockProducts = useDashboardData ? stockLow || 0 : 0;

  const categoryCount = useDashboardData
    ? summaryData.categories?.count || 0
    : 0;

  const avgProductsPerCategory = useDashboardData
    ? summaryData.categories?.avgProductsPerCategory || 0
    : 0;

  const filteredRecentMasterProducts = (newProductsData.master || [])
    .filter((product) => {
      if (statusFilter !== "all" && product.status !== statusFilter) {
        return false;
      }

      if (categoryFilter !== "all" && product.kategori?.id !== categoryFilter) {
        return false;
      }

      return true;
    })
    .slice(0, 6);

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const topPriceProducts = (topProductsData || []).slice(0, 5);

  const maxCriticalItems = showAllCriticalStock ? 10 : 5;
  const criticalStockProducts = (stockOutProductsData || []).slice(
    0,
    maxCriticalItems
  );

  const businessInsightsData = effectiveDashboardData?.businessInsights || {};
  const profitabilityData = businessInsightsData.profitability || [];
  const stockTurnoverData = businessInsightsData.stockTurnover || [];
  const categoryPerformanceData =
    businessInsightsData.categoryPerformance || [];

  console.log("categoryPerformanceData", categoryPerformanceData);
  const salesTrendData = businessInsightsData.salesTrend || {
    labels: [],
    datasets: [],
  };
  const recommendationsData = businessInsightsData.productRecommendations || {};
  const needsRestockData = recommendationsData.needsRestock || [];
  const highGrowthData = recommendationsData.highGrowth || [];
  const highMarginData = recommendationsData.highMargin || [];
  const poorPerformersData = recommendationsData.poorPerformers || [];
  const overstockedData = recommendationsData.overstocked || [];

  const hasData = highGrowthData.length > 0 || highMarginData.length > 0 || 
  poorPerformersData.length > 0 || overstockedData.length > 0;

  
  const uniqueCategories = useDashboardData
    ? (productDistributionData || []).map((category) => ({
        id: category.id,
        name: category.namaKategori,
      }))
    : [];

  const getDistributionData = () => {
    switch (selectedMetric) {
      case "category":
        if (useDashboardData) {
          return (productDistributionData || [])
            .sort((a, b) => b.jumlahProduk - a.jumlahProduk)
            .slice(0, 5);
        }
        return [];
      case "status":
        return [
          { name: "Aktif", count: activeProducts, color: "bg-green-500" },
          { name: "Nonaktif", count: inactiveProducts, color: "bg-red-500" },
        ];
      case "stock":
        return [
          {
            name: "Stok Tersedia",
            count: totalProducts - outOfStockProducts - lowStockProducts,
            color: "bg-green-500",
          },
          {
            name: "Stok Rendah",
            count: lowStockProducts,
            color: "bg-yellow-500",
          },
          {
            name: "Stok Habis",
            count: outOfStockProducts,
            color: "bg-red-500",
          },
        ];
      default:
        return [];
    }
  };

  const distributionData = getDistributionData();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading && fetchOwnData) {
    return (
      <div className={`${className} p-8 text-center`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Memuat data produk...</p>
      </div>
    );
  }


  const performanceComparisonData = [
    { name: 'High Growth', value: highGrowthData.length, color: '#10B981' },
    { name: 'High Margin', value: highMarginData.length, color: '#F59E0B' },
    { name: 'Poor Performers', value: poorPerformersData.length, color: '#EF4444' },
    { name: 'Overstocked', value: overstockedData.length, color: '#6366F1' }
  ];

  return (
    <div className={`${className}`}>
      {/* KPI Section - Keep as is */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-indigo-500 hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute right-0 top-0 h-16 w-16 opacity-10">
            <Package className="h-full w-full text-indigo-500" />
          </div>
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Produk</p>
              <p className="text-2xl font-bold text-indigo-700">
                {totalProducts}
              </p>
            </div>
            <div className="bg-indigo-100 p-3 rounded-lg">
              <Package className="h-6 w-6 text-indigo-500" />
            </div>
          </div>
          {totalProducts > 0 && (
            <>
              <div className="mt-4 text-xs text-gray-500">
                <span className="font-medium text-indigo-600">
                  {Math.round((activeProducts / totalProducts) * 100)}%
                </span>{" "}
                produk aktif
              </div>

              {summaryData.totalProduct?.branches &&
                summaryData.totalProduct.branches.length > 0 && (
                  <div className="mt-3 border-t pt-2">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <p className="text-xs font-medium text-gray-600">
                          Breakdown per Cabang
                        </p>
                        <span className="ml-2 bg-indigo-100 text-indigo-800 text-xs px-1.5 py-0.5 rounded-full">
                          {summaryData.totalProduct.branches.length}
                        </span>
                      </div>
                      <button
                        className="text-xs text-indigo-600 hover:text-indigo-800 focus:outline-none"
                        onClick={() =>
                          setShowBranchBreakdown(!showBranchBreakdown)
                        }
                      >
                        {showBranchBreakdown
                          ? "Sembunyikan Detail"
                          : "Tampilkan Detail"}
                      </button>
                    </div>

                    <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                      {!showBranchBreakdown && (
                        <div className="text-xs text-gray-500 py-1 flex justify-between items-center">
                          <span>
                            Data tersedia untuk{" "}
                            {summaryData.totalProduct.branches.length} cabang
                          </span>
                          <button
                            className="text-indigo-600 hover:text-indigo-800 focus:outline-none"
                            onClick={() => setShowBranchBreakdown(true)}
                          >
                            Lihat Detail
                          </button>
                        </div>
                      )}

                      {showBranchBreakdown &&
                        summaryData.totalProduct.branches.map(
                          (branch, index) => (
                            <div
                              key={branch.cabangId || index}
                              className="border border-gray-100 rounded-md p-2 bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex justify-between items-center">
                                <p className="text-xs font-medium text-gray-800">
                                  {branch.namaCabang}
                                </p>
                                <p className="text-xs font-medium text-indigo-600">
                                  {branch.total} produk
                                </p>
                              </div>
                              <div className="flex justify-between items-center mt-1">
                                <div className="flex space-x-2 text-xs">
                                  <span className="text-green-600">
                                    {branch.active} aktif
                                  </span>
                                  <span className="text-red-600">
                                    {branch.inactive} nonaktif
                                  </span>
                                </div>
                                <span className="text-xs font-medium bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded-full">
                                  {branch.percentage}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                <div
                                  className="bg-indigo-600 h-1.5 rounded-full"
                                  style={{ width: `${branch.percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          )
                        )}
                    </div>
                  </div>
                )}
            </>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500 hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute right-0 top-0 h-16 w-16 opacity-10">
            <AlertTriangle className="h-full w-full text-red-500" />
          </div>
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Stok Habis</p>
              <p className="text-2xl font-bold text-red-600">
                {outOfStockProducts}
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
          </div>
          {totalProducts > 0 && outOfStockProducts > 0 && (
            <div className="mt-4 text-xs text-gray-500">
              <span className="font-medium text-red-500">
                {Math.round((outOfStockProducts / totalProducts) * 100)}%
              </span>{" "}
              dari total produk
              {outOfStockProducts > 0 && (
                <button
                  className="ml-2 text-blue-600 hover:text-blue-800"
                  onClick={() => setSelectedMetric("stock")}
                >
                  Lihat Detail
                </button>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500 hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute right-0 top-0 h-16 w-16 opacity-10">
            <AlertCircle className="h-full w-full text-yellow-500" />
          </div>
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Stok Rendah</p>
              <p className="text-2xl font-bold text-yellow-600">
                {lowStockProducts}
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
            </div>
          </div>
          {totalProducts > 0 && lowStockProducts > 0 && (
            <div className="mt-4 text-xs text-gray-500">
              <span className="font-medium text-yellow-500">
                {Math.round((lowStockProducts / totalProducts) * 100)}%
              </span>{" "}
              dari total produk
              {lowStockProducts > 0 && (
                <button
                  className="ml-2 text-blue-600 hover:text-blue-800"
                  onClick={() => setSelectedMetric("stock")}
                >
                  Lihat Detail
                </button>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500 hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute right-0 top-0 h-16 w-16 opacity-10">
            <Tag className="h-full w-full text-blue-500" />
          </div>
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Kategori</p>
              <p className="text-2xl font-bold text-blue-600">
                {categoryCount}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Tag className="h-6 w-6 text-blue-500" />
            </div>
          </div>
          {categoryCount > 0 && (
            <div className="mt-4 text-xs text-gray-500">
              <span className="font-medium text-blue-600">
                {avgProductsPerCategory}
              </span>{" "}
              produk per kategori rata-rata
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 border-b mb-6">
        <button
          className={`px-4 py-2 font-medium text-sm focus:outline-none ${
            activeTab === "insights"
              ? "text-indigo-600 border-b-2 border-indigo-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("insights")}
        >
          <TrendingUp className="h-4 w-4 inline mr-1" />
          Wawasan Bisnis
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm focus:outline-none ${
            activeTab === "products"
              ? "text-indigo-600 border-b-2 border-indigo-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("products")}
        >
          <Package className="h-4 w-4 inline mr-1" />
          Produk Terbaru
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm focus:outline-none ${
            activeTab === "distribution"
              ? "text-indigo-600 border-b-2 border-indigo-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("distribution")}
        >
          <PieChart className="h-4 w-4 inline mr-1" />
          Distribusi Produk
        </button>
      </div>

      {/* Tab Content: Wawasan Bisnis Section */}
      {activeTab === "insights" && (
        <div className="mb-6 bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-indigo-800 mb-4 flex items-center">
            <TrendingUp className="h-6 w-6 text-indigo-600 mr-2" />
            Wawasan Bisnis
            <button
              className="ml-auto p-2 bg-indigo-100 hover:bg-indigo-200 rounded-full focus:outline-none"
              onClick={() => setShowBusinessInsights(!showBusinessInsights)}
            >
              {showBusinessInsights ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </button>
          </h2>

          {/* Existing Wawasan Bisnis content - Keep all charts */}
          <div className="bg-white rounded-lg shadow border hover:shadow-lg transition-shadow">
            {showBusinessInsights && (
              <div className="p-0 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg overflow-hidden m-4 bg-gradient-to-r from-green-50 to-white shadow-sm hover:shadow-md transition-shadow">
                  <div
                    className="px-4 py-2 bg-gray-50 border-b flex justify-between items-center cursor-pointer"
                    onClick={() => setShowProfitability(!showProfitability)}
                  >
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                      <h4 className="text-sm font-medium text-gray-600">
                        Produk Paling Menguntungkan
                      </h4>
                    </div>
                    <button className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none">
                      {showProfitability ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      )}
                    </button>
                  </div>
                  {showProfitability && (
                    <div className="p-4 space-y-3 relative">
                      <div className="absolute right-2 top-2 text-green-200 opacity-20">
                        <DollarSign className="h-20 w-20" />
                      </div>

                      {/* Horizontal Bar Chart for Profitability */}
                      <div className="h-64 w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            layout="vertical"
                            data={profitabilityData.slice(0, 5)}
                            margin={{
                              top: 5,
                              right: 30,
                              left: 20,
                              bottom: 5,
                            }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              horizontal={false}
                            />
                            <XAxis type="number" domain={[0, 100]} />
                            <YAxis
                              dataKey="namaProduk"
                              type="category"
                              width={100}
                              tick={{ fontSize: 11 }}
                              tickFormatter={(value) =>
                                value.length > 15
                                  ? `${value.substring(0, 15)}...`
                                  : value
                              }
                            />
                            <Tooltip
                              formatter={(value, name) => {
                                if (name === "marginPercentage")
                                  return [`${value.toFixed(1)}%`, "Margin"];
                                return [value, name];
                              }}
                              labelFormatter={(label) => `Produk: ${label}`}
                            />
                            <Legend />
                            <Bar
                              dataKey="marginPercentage"
                              name="Margin %"
                              fill="#22c55e"
                              barSize={20}
                            />
                            <Bar
                              dataKey="roi"
                              name="ROI %"
                              fill="#3b82f6"
                              barSize={20}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="pt-3 border-t mt-3">
                        <h5 className="text-xs font-medium text-gray-600 mb-2">
                          Detail Produk Teratas
                        </h5>
                        {profitabilityData.slice(0, 3).map((prod, idx) => (
                          <div
                            key={idx}
                            className="text-xs flex justify-between items-center p-2 hover:bg-green-50 rounded-lg"
                          >
                            <div>
                              <p className="font-medium text-gray-800">
                                {prod.namaProduk}
                              </p>
                              <p className="text-gray-500">
                                {prod.cabang} - SKU: {prod.sku}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-green-700 text-sm">
                                {formatCurrency(prod.margin)} (
                                {parseFloat(prod.marginPercentage).toFixed(1)}%)
                              </p>
                              <div className="flex items-center justify-end text-gray-500">
                                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                                {prod.totalSold} terjual
                                <span className="ml-1 text-xs font-medium text-green-600">
                                  (ROI: {parseFloat(prod.roi).toFixed(1)}%)
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="border rounded-lg overflow-hidden m-4 bg-gradient-to-r from-blue-50 to-white shadow-sm hover:shadow-md transition-shadow">
                  <div
                    className="px-4 py-2 bg-gray-50 border-b flex justify-between items-center cursor-pointer"
                    onClick={() => setShowStockTurnover(!showStockTurnover)}
                  >
                    <div className="flex items-center">
                      <Activity className="h-5 w-5 text-blue-600 mr-2" />
                      <h4 className="text-sm font-medium text-gray-600">
                        Perputaran Stok
                      </h4>
                    </div>
                    <button className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none">
                      {showStockTurnover ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      )}
                    </button>
                  </div>
                  {showStockTurnover && (
                    <div className="p-4 space-y-3 relative">
                      <div className="absolute right-2 top-2 text-blue-200 opacity-20">
                        <Activity className="h-20 w-20" />
                      </div>

                      {/* Gauge Chart for Stock Turnover */}
                      <div className="h-48 w-full mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadialBarChart
                            cx="50%"
                            cy="50%"
                            innerRadius="20%"
                            outerRadius="90%"
                            data={stockTurnoverData.slice(0, 3).map((item) => ({
                              name: item.nama_produk,
                              value: item.turnover_rate,
                              fill:
                                item.days_of_supply < 14
                                  ? "#ef4444"
                                  : item.days_of_supply < 30
                                  ? "#f59e0b"
                                  : "#3b82f6",
                            }))}
                            startAngle={180}
                            endAngle={0}
                          >
                            <RadialBar
                              background
                              dataKey="value"
                              angleAxisId={0}
                              label={{
                                position: "insideStart",
                                fill: "#666",
                                fontSize: 12,
                              }}
                            />
                            <Legend
                              iconSize={10}
                              layout="vertical"
                              verticalAlign="middle"
                              align="right"
                              wrapperStyle={{ fontSize: "11px" }}
                            />
                            <Tooltip
                              formatter={(value) => [
                                `${parseFloat(value).toFixed(1)}x`,
                                "Turnover Rate",
                              ]}
                              labelFormatter={(label) => `Product: ${label}`}
                            />
                          </RadialBarChart>
                        </ResponsiveContainer>
                      </div>

                      {stockTurnoverData.slice(0, 3).map((prod, idx) => (
                        <div
                          key={idx}
                          className="text-xs flex justify-between items-center p-2 hover:bg-blue-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-gray-800">
                              {prod.nama_produk}
                            </p>
                            <p className="text-gray-500">
                              {prod.nama_cabang} - SKU: {prod.sku}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center mb-1">
                              <span className="text-gray-600 mr-2">
                                Stok: {prod.total_stok}
                              </span>
                              <div className="w-24 bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-blue-600 h-1.5 rounded-full"
                                  style={{
                                    width: `${Math.min(
                                      (prod.total_stok / (prod.avg_daily_sales * 30)) *
                                        100,
                                      100
                                    )}%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                            <p
                              className={`font-semibold ${
                                prod.days_of_supply < 14
                                  ? "text-red-600"
                                  : prod.days_of_supply < 30
                                  ? "text-yellow-600"
                                  : "text-gray-700"
                              }`}
                            >
                              {prod.days_of_supply} hari stok (
                              {parseFloat(prod.turnover_rate).toFixed(1)}x turnover)
                            </p>
                            {prod.needsRestock && (
                              <span className="text-red-600 font-bold flex items-center justify-end">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Perlu Restock!
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border rounded-lg overflow-hidden m-4 bg-gradient-to-r from-indigo-50 to-white shadow-sm hover:shadow-md transition-shadow">
      <div
        className="px-4 py-2 bg-gray-50 border-b flex justify-between items-center cursor-pointer"
        onClick={() => setShowCategoryPerformance(!showCategoryPerformance)}
      >
        <div className="flex items-center">
          <BarChartHorizontal className="h-5 w-5 text-indigo-600 mr-2" />
          <h4 className="text-sm font-medium text-gray-600">
            Performa Kategori
          </h4>
        </div>
        <button className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none">
          {showCategoryPerformance ? (
            <ChevronUp size={14} />
          ) : (
            <ChevronDown size={14} />
          )}
        </button>
      </div>
      
      {showCategoryPerformance && (
        <div className="p-4 space-y-3 relative">
          <div className="absolute right-2 top-2 text-indigo-200 opacity-20">
            <BarChartHorizontal className="h-20 w-20" />
          </div>

          {/* Bar Chart for Category Performance */}
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryPerformanceData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="nama_kategori"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) =>
                    value.length > 10
                      ? `${value.substring(0, 10)}...`
                      : value
                  }
                />
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  tickFormatter={(value) => {
                    if (value >= 1000000)
                      return `${(value / 1000000).toFixed(0)}M`;
                    if (value >= 1000)
                      return `${(value / 1000).toFixed(0)}K`;
                    return value;
                  }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === "total_revenue")
                      return [formatCurrency(value), "Revenue"];
                    if (name === "total_sold")
                      return [value, "Terjual"];
                    return [value, name];
                  }}
                />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="total_revenue"
                  name="Revenue"
                  fill="#6366f1"
                />
                <Bar
                  yAxisId="right"
                  dataKey="total_sold"
                  name="Terjual"
                  fill="#8b5cf6"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t mt-3">
            <h5 className="text-xs font-medium text-gray-600 mb-2">
              Rasio Stok/Penjualan
            </h5>
            <div className="grid grid-cols-4 gap-2">
              {categoryPerformanceData.map((cat, idx) => (
                <div
                  key={idx}
                  className="text-center p-2 bg-indigo-50 rounded-lg"
                >
                  <p
                    className="text-xs font-medium text-indigo-800 truncate"
                    title={cat.nama_kategori}
                  >
                    {cat.nama_kategori}
                  </p>
                  <p className="text-lg font-bold text-indigo-600">
                    {parseFloat(cat.stocktosalesratio).toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-500">rasio</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>

                <div className="border rounded-lg overflow-hidden m-4 bg-gradient-to-r from-orange-50 to-white shadow-sm hover:shadow-md transition-shadow">
                  <div
                    className="px-4 py-2 bg-gray-50 border-b flex justify-between items-center cursor-pointer"
                    onClick={() => setShowSalesTrend(!showSalesTrend)}
                  >
                    <div className="flex items-center">
                      <BarChart2 className="h-5 w-5 text-orange-600 mr-2" />
                      <h4 className="text-sm font-medium text-gray-600">
                        Ringkasan Tren Penjualan
                      </h4>
                    </div>
                    <button className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none">
                      {showSalesTrend ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      )}
                    </button>
                  </div>
                  {showSalesTrend && (
                    <div className="p-4 space-y-3 relative">
                      <div className="absolute right-2 top-2 text-orange-200 opacity-20">
                        <BarChart2 className="h-20 w-20" />
                      </div>

                      {/* Area Chart for Sales Trend */}
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={salesTrendData.labels.map((month, index) => {
                              const dataPoint = { month };
                              salesTrendData.datasets.forEach((dataset, i) => {
                                if (i < 3) {
                                  // Limiting to top 3 products
                                  const shortName =
                                    dataset.namaProduk.length > 15
                                      ? dataset.namaProduk.substring(0, 15) +
                                        "..."
                                      : dataset.namaProduk;
                                  dataPoint[shortName] =
                                    dataset.salesData[index] || 0;
                                }
                              });
                              return dataPoint;
                            })}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            {salesTrendData.datasets
                              .slice(0, 3)
                              .map((dataset, index) => {
                                const colors = [
                                  "#f97316",
                                  "#0ea5e9",
                                  "#84cc16",
                                ];
                                const shortName =
                                  dataset.namaProduk.length > 15
                                    ? dataset.namaProduk.substring(0, 15) +
                                      "..."
                                    : dataset.namaProduk;
                                return (
                                  <Area
                                    key={index}
                                    type="monotone"
                                    dataKey={shortName}
                                    stackId="1"
                                    stroke={colors[index % colors.length]}
                                    fill={colors[index % colors.length]}
                                    fillOpacity={0.3}
                                  />
                                );
                              })}
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="pt-3 border-t mt-3">
                        <h5 className="text-xs font-medium text-gray-600 mb-2">
                          Total Penjualan per Produk
                        </h5>
                        {salesTrendData.datasets
                          .slice(0, 3)
                          .map((trend, idx) => (
                            <div
                              key={idx}
                              className="text-xs flex justify-between items-center p-2 hover:bg-orange-50 rounded-lg"
                            >
                              <p
                                className="font-medium text-gray-800 truncate max-w-[150px]"
                                title={trend.namaProduk}
                              >
                                {trend.namaProduk}
                              </p>
                              <div className="flex items-center">
                                <span className="text-orange-600 font-medium mr-2">
                                  {trend.totalSold} terjual
                                </span>
                                <span className="text-sm font-medium text-green-600">
                                  {formatCurrency(trend.totalRevenue)}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="border rounded-lg overflow-hidden m-4 md:col-span-2 bg-gradient-to-r from-yellow-50 to-white shadow-sm hover:shadow-md transition-shadow">
      <div
        className="px-4 py-3 bg-gray-50 border-b flex justify-between items-center cursor-pointer"
        onClick={() => setShowRecommendations(!showRecommendations)}
      >
        <div className="flex items-center">
          <Zap className="h-5 w-5 text-yellow-600 mr-2" />
          <h4 className="text-sm font-medium text-gray-700">
            Rekomendasi Produk
          </h4>
        </div>
        <button className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none">
          {showRecommendations ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>
      
      {showRecommendations && (
        <div className="p-4">
          {!hasData ? (
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">Tidak ada data rekomendasi produk yang tersedia</p>
            </div>
          ) : (
            <>
              {/* Performance Overview Chart */}
              <div className="mb-6 bg-white p-4 rounded-lg border shadow-sm">
                <h5 className="font-semibold mb-4 text-gray-700 text-sm">Ringkasan Kategori Produk</h5>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={performanceComparisonData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <XAxis dataKey="name" scale="point" fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]}>
                      {performanceComparisonData.map((entry, index) => (
                        <rect key={`rect-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {/* Product Categories */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* High Growth Products */}
                <div className="bg-green-50 p-4 rounded-lg border border-green-100 hover:shadow-md transition-shadow">
                  <h5 className="font-semibold mb-3 flex items-center text-green-700 border-b border-green-100 pb-2">
                    <TrendingUp size={16} className="mr-2" /> Produk Pertumbuhan Tinggi
                  </h5>
                  <div className="space-y-3 mt-2">
                    {highGrowthData.slice(0, 3).map((product, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-md border border-green-100 hover:bg-green-50">
                        <div className="flex justify-between">
                          <p className="font-medium text-gray-800 text-sm">{product.nama_produk}</p>
                          <span className="font-medium text-green-600 text-xs bg-green-100 px-2 py-0.5 rounded-full">
                            +{parseFloat(product.sales_growth).toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex justify-between text-xs mt-2 text-gray-500">
                          <span>{product.nama_cabang}</span>
                          <span>Stok: {product.stok}</span>
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span className="text-gray-500">Terjual 30 hari: {product.sales_30_days}</span>
                          <span className="text-gray-500">Margin: {parseFloat(product.margin_percentage).toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {highGrowthData.length > 3 && (
                    <div className="mt-3 text-right">
                      <button className="text-green-600 text-xs hover:underline">
                        Lihat {highGrowthData.length - 3} produk lainnya
                      </button>
                    </div>
                  )}
                </div>

                {/* High Margin Products */}
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 hover:shadow-md transition-shadow">
                  <h5 className="font-semibold mb-3 flex items-center text-yellow-700 border-b border-yellow-100 pb-2">
                    <Zap size={16} className="mr-2" /> Produk Margin Tinggi
                  </h5>
                  <div className="space-y-3 mt-2">
                    {highMarginData.slice(0, 3).map((product, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-md border border-yellow-100 hover:bg-yellow-50">
                        <div className="flex justify-between">
                          <p className="font-medium text-gray-800 text-sm">{product.nama_produk}</p>
                          <span className="font-medium text-yellow-600 text-xs bg-yellow-100 px-2 py-0.5 rounded-full">
                            {parseFloat(product.margin_percentage).toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex justify-between text-xs mt-2 text-gray-500">
                          <span>{product.nama_cabang}</span>
                          <span>Stok: {product.stok}</span>
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span className="text-gray-500">Terjual 30 hari: {product.sales_30_days}</span>
                          <span className="text-gray-500">Margin: Rp {parseInt(product.margin).toLocaleString('id')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {highMarginData.length > 3 && (
                    <div className="mt-3 text-right">
                      <button className="text-yellow-600 text-xs hover:underline">
                        Lihat {highMarginData.length - 3} produk lainnya
                      </button>
                    </div>
                  )}
                </div>

                {/* Poor Performing Products */}
                <div className="bg-red-50 p-4 rounded-lg border border-red-100 hover:shadow-md transition-shadow">
                  <h5 className="font-semibold mb-3 flex items-center text-red-700 border-b border-red-100 pb-2">
                    <TrendingDown size={16} className="mr-2" /> Produk Kinerja Rendah
                  </h5>
                  <div className="space-y-3 mt-2">
                    {poorPerformersData.slice(0, 3).map((product, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-md border border-red-100 hover:bg-red-50">
                        <div className="flex justify-between">
                          <p className="font-medium text-gray-800 text-sm">{product.nama_produk}</p>
                          <span className="font-medium text-red-600 text-xs bg-red-100 px-2 py-0.5 rounded-full">
                            0 Penjualan
                          </span>
                        </div>
                        <div className="flex justify-between text-xs mt-2 text-gray-500">
                          <span>{product.nama_cabang}</span>
                          <span>Stok: {product.stok}</span>
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span className="text-gray-500">30 hari terakhir: {product.sales_30_days}</span>
                          <span className="text-gray-500">Margin: {parseFloat(product.margin_percentage).toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {poorPerformersData.length > 3 && (
                    <div className="mt-3 text-right">
                      <button className="text-red-600 text-xs hover:underline">
                        Lihat {poorPerformersData.length - 3} produk lainnya
                      </button>
                    </div>
                  )}
                </div>

                {/* Overstocked Products */}
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 hover:shadow-md transition-shadow">
                  <h5 className="font-semibold mb-3 flex items-center text-indigo-700 border-b border-indigo-100 pb-2">
                    <Package size={16} className="mr-2" /> Produk Kelebihan Stok
                  </h5>
                  <div className="space-y-3 mt-2">
                    {overstockedData.slice(0, 3).map((product, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-md border border-indigo-100 hover:bg-indigo-50">
                        <div className="flex justify-between">
                          <p className="font-medium text-gray-800 text-sm">{product.nama_produk}</p>
                          <span className="font-medium text-indigo-600 text-xs bg-indigo-100 px-2 py-0.5 rounded-full">
                            {product.days_until_stock_out} hari
                          </span>
                        </div>
                        <div className="flex justify-between text-xs mt-2 text-gray-500">
                          <span>{product.nama_cabang}</span>
                          <span>Stok: {product.stok}</span>
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span className="text-gray-500">Terjual 30 hari: {product.sales_30_days}</span>
                          <div className="flex items-center text-indigo-500">
                            <Clock size={12} className="mr-1" />
                            <span>Estimasi habis: {parseInt(product.days_until_stock_out) > 999 ? '999+' : product.days_until_stock_out} hari</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {overstockedData.length > 3 && (
                    <div className="mt-3 text-right">
                      <button className="text-indigo-600 text-xs hover:underline">
                        Lihat {overstockedData.length - 3} produk lainnya
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
              </div>
            )}
          </div>

          {/* Quick Action Buttons - Simplified */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <button
              onClick={() => onViewProduct && onViewProduct()}
              className="flex items-center justify-center p-2 border border-indigo-200 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-sm"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              <span>Produk Terlaris</span>
            </button>

            <button
              onClick={() => {}}
              className="flex items-center justify-center p-2 border border-green-200 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 text-sm"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              <span>Produk Baru</span>
            </button>

            <button
              onClick={() => {}}
              className="flex items-center justify-center p-2 border border-blue-200 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-sm"
            >
              <Layers className="h-4 w-4 mr-2" />
              <span>Tambah Kategori</span>
            </button>

            <button
              onClick={() => {}}
              className="flex items-center justify-center p-2 border border-yellow-200 rounded-lg bg-yellow-50 text-yellow-700 hover:bg-yellow-100 text-sm"
            >
              <Archive className="h-4 w-4 mr-2" />
              <span>Restock Produk</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab Content: Produk Terbaru Section */}
      {activeTab === "products" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Produk Terlaris */}
          <div className="bg-white rounded-lg shadow border hover:shadow-lg transition-shadow">
            <div className="px-4 py-3 border-b bg-gradient-to-r from-green-50 to-white flex justify-between items-center">
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
                <h3 className="font-medium text-gray-700">Produk Terlaris</h3>
              </div>
              <div className="flex items-center">
                <button
                  className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                  onClick={() => setShowRecentProducts(!showRecentProducts)}
                >
                  {showRecentProducts ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </button>
              </div>
            </div>

            {showRecentProducts && (
              <div className="p-4">
                {topProductsData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Peringkat
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Produk
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Kategori
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Terjual
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Stok
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {topProductsData.slice(0, 5).map((product, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-3 py-3 whitespace-nowrap">
                              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-100 text-green-800 font-medium">
                                {index + 1}
                              </div>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-10 h-10 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                                  {product.gambar ? (
                                    <img
                                      src={product.gambar}
                                      alt={product.namaProduk}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <Package className="h-5 w-5 m-2.5 text-gray-400" />
                                  )}
                                </div>
                                <div className="ml-3">
                                  <p className="text-sm font-medium text-gray-900">
                                    {product.namaProduk}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    SKU: {product.sku}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              {product.kategori ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  <Tag className="h-3 w-3 mr-1" />
                                  {product.kategori.namaKategori}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className="font-medium text-green-600">
                                  {product.totalTerjual}
                                </span>
                                <ArrowUpRight className="h-4 w-4 ml-1 text-green-500" />
                                <span className="ml-1 text-xs text-gray-500">
                                  ({product.terjual30Hari} 30 hari)
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              <StockStatus stock={product.stok} />
                              <p className="text-xs text-gray-500 mt-1">
                                {product.stok} {product.satuan || "pcs"}
                              </p>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-center">
                              <div className="flex justify-center space-x-1">
                                <button
                                  className="text-indigo-600 hover:text-indigo-900 p-1 hover:bg-indigo-50 rounded"
                                  onClick={() =>
                                    onViewProduct && onViewProduct(product)
                                  }
                                  title="Lihat Detail"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button
                                  className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                                  onClick={() => {}}
                                  title="Edit"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <p>Belum ada data penjualan produk</p>
                  </div>
                )}

                <div className="mt-4 flex justify-end">
                  <button
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
                    onClick={() => onViewProduct && onViewProduct()}
                  >
                    Lihat Semua Produk Terlaris{" "}
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Produk Cabang Terbaru - Keep as is */}
          {useDashboardData &&
            newProductsData.branch &&
            newProductsData.branch.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="px-4 py-3 border-b flex justify-between items-center">
                  <h3 className="font-medium text-gray-700">
                    Produk Cabang Terbaru
                  </h3>
                  <button
                    className="text-sm text-gray-500 hover:text-gray-700"
                    onClick={() =>
                      setShowNewBranchProducts(!showNewBranchProducts)
                    }
                  >
                    {showNewBranchProducts ? "Sembunyikan" : "Tampilkan"}
                  </button>
                </div>

                {showNewBranchProducts && (
                  <div className="p-4">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th
                              scope="col"
                              className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Produk
                            </th>
                            <th
                              scope="col"
                              className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Cabang
                            </th>
                            <th
                              scope="col"
                              className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Kategori
                            </th>
                            <th
                              scope="col"
                              className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Harga
                            </th>
                            <th
                              scope="col"
                              className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Stok
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {newProductsData.branch.map((product, index) => (
                            <tr
                              key={index}
                              className="hover:bg-gray-50 cursor-pointer"
                              onClick={() =>
                                onViewProduct && onViewProduct(product)
                              }
                            >
                              <td className="px-3 py-3 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="w-8 h-8 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                                    {product.gambar ? (
                                      <img
                                        src={product.gambar}
                                        alt={product.namaProduk}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <Package className="h-4 w-4 m-2 text-gray-400" />
                                    )}
                                  </div>
                                  <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                                      {product.namaProduk}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      SKU: {product.sku}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  {product.cabang?.namaCabang || ""}
                                </span>
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap">
                                {product.kategori && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    <Tag className="h-3 w-3 mr-1" />
                                    {product.kategori.namaKategori}
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap">
                                <span className="text-sm font-medium text-gray-900">
                                  {formatCurrency(product.hargaJual)}
                                </span>
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap">
                                <StockStatus stock={product.stok || 0} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

          {/* Stok Perlu Perhatian */}
          <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="px-4 py-3 border-b flex justify-between items-center">
              <h3 className="font-medium text-gray-700">
                Stok Perlu Perhatian
              </h3>
              {criticalStockProducts.length > 5 && (
                <button
                  onClick={() => setShowAllCriticalStock(!showAllCriticalStock)}
                  className="text-xs text-indigo-600 hover:text-indigo-800"
                >
                  {showAllCriticalStock
                    ? "Tampilkan Lebih Sedikit"
                    : "Tampilkan Semua"}
                </button>
              )}
            </div>
            {criticalStockProducts.length > 0 ? (
              <div className="divide-y">
                {criticalStockProducts.map((product, index) => (
                  <div
                    key={index}
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => onViewProduct && onViewProduct(product)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-8 h-8 flex-shrink-0 bg-gray-100 rounded flex items-center justify-center">
                          <Package className="h-4 w-4 text-gray-400" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                            {product.namaProduk}
                          </p>
                          {useDashboardData && product.cabangNama && (
                            <p className="text-xs text-gray-500">
                              Cabang: {product.cabangNama}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <StockStatus stock={product.stok || 0} />
                        <button
                          className="block mt-1 text-xs text-indigo-600 hover:text-indigo-800"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          Restock
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                Semua produk memiliki stok yang cukup
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content: Distribusi Produk Section */}
      {activeTab === "distribution" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Distribusi Produk - Enhance with chart */}
          <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow lg:col-span-2">
            <div className="px-4 py-3 border-b flex justify-between items-center">
              <h3 className="font-medium text-gray-700">Distribusi Produk</h3>
              <div className="flex items-center">
                <button
                  className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                  onClick={() => setShowDistribution(!showDistribution)}
                >
                  {showDistribution ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </button>
              </div>
            </div>

            {showDistribution && (
              <div className="p-4">
                <div className="mb-4">
                  <label
                    htmlFor="metric-select"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Tampilkan berdasarkan
                  </label>
                  <select
                    id="metric-select"
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={selectedMetric}
                    onChange={(e) => setSelectedMetric(e.target.value)}
                  >
                    <option value="category">Kategori</option>
                    <option value="status">Status</option>
                    <option value="stock">Stok</option>
                  </select>
                </div>

                {/* Enhanced visualization with PieChart */}
                <div className="h-64 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartPieChart>
                      <Pie
                        data={distributionData.map((item, index) => ({
                          name: item.namaKategori || item.name,
                          value: item.jumlahProduk || item.count,
                          fill: `hsl(${index * 30 + 120}, 70%, 60%)`,
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {distributionData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={`hsl(${index * 30 + 120}, 70%, 60%)`}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, "Jumlah"]} />
                      <Legend />
                    </RechartPieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                  {selectedMetric === "category"
                    ? distributionData.map((category, index) => (
                        <div key={index}>
                          <div className="flex justify-between items-center mb-1">
                            <span
                              className="text-sm text-gray-600 truncate max-w-[200px]"
                              title={category.namaKategori || category.name}
                            >
                              {category.namaKategori || category.name}
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                              {category.jumlahProduk ||
                                category.products?.length ||
                                0}{" "}
                              produk
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`bg-blue-${
                                (index + 3) * 100
                              } h-2 rounded-full`}
                              style={{
                                width: `${
                                  ((category.jumlahProduk ||
                                    category.products?.length ||
                                    0) /
                                    totalProducts) *
                                  100
                                }%`,
                                backgroundColor: `hsl(${
                                  index * 30 + 120
                                }, 70%, 60%)`,
                              }}
                            ></div>
                          </div>
                        </div>
                      ))
                    : distributionData.map((item, index) => (
                        <div key={index}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-gray-600">
                              {item.name}
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                              {item.count} (
                              {Math.round((item.count / totalProducts) * 100)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`${item.color} h-2 rounded-full`}
                              style={{
                                width: `${(item.count / totalProducts) * 100}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      ))}
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      {selectedMetric === "category" ? (
                        <PieChart className="h-4 w-4 text-gray-500 mr-1" />
                      ) : (
                        <BarChart2 className="h-4 w-4 text-gray-500 mr-1" />
                      )}
                      <span className="text-xs text-gray-500">
                        {totalProducts} total produk
                      </span>
                    </div>
                    <button
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                      onClick={() => onViewProduct && onViewProduct()}
                    >
                      Lihat Semua
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Nilai Inventori */}
          <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="px-4 py-3 border-b">
              <h3 className="font-medium text-gray-700">Nilai Inventori</h3>
            </div>
            <div className="p-4">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">
                    {useDashboardData
                      ? formatCurrency(inventoryValue)
                      : formatCurrency(0)}
                  </p>
                  <p className="text-sm text-gray-500">Total nilai inventori</p>
                </div>
              </div>

              {useDashboardData &&
              inventoryValue.perCabang &&
              inventoryValue.perCabang.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">
                    Nilai per Cabang
                  </h4>
                  {inventoryValue.perCabang.slice(0, 3).map((cabang, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center"
                    >
                      <span className="text-sm text-gray-600">
                        {cabang.cabangName}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(cabang.value)}
                      </span>
                    </div>
                  ))}
                  {inventoryValue.perCabang.length > 3 && (
                    <button className="text-xs text-indigo-600 hover:text-indigo-800 font-medium w-full text-center">
                      Lihat Semua Cabang
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center">
                  Data nilai per cabang tidak tersedia.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDashboard;
