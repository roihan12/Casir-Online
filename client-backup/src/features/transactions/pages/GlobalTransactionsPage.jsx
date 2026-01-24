import React, { useState } from "react";
import {
  Search,
  FileText,
  Calendar,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCcw,
  Eye,
  Download,
  Filter,
  ShoppingCart,
  DollarSign,
  Clock,
  Repeat,
  Store,
  TrendingUp,
  PieChart,
  BarChart3,
  ChevronRight,
  CreditCard,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { useCabang } from "@features/cabang/hooks/useCabang";
import toast from "react-hot-toast";
import { useTransactionsList, useTransactionDashboard } from "../hooks/useTransactions";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import formatCurrency from "@common/utils/formatCurrency";



// Component utama
const GlobalTransactions = () => {
  const navigate = useNavigate();
  const { selectedCabang, cabangList = [] } = useCabang();
  const [timeRange, setTimeRange] = useState("30d"); // '7d', '30d', '90d', '1y'

  // Filter state
  const [filters, setFilters] = useState({
    startDate: dayjs().subtract(30, "day"),
    endDate: dayjs(),
    cabangId: "all", // Default to all cabang
    jenisTransaksi: "all",
    statusPembayaran: "all",
    search: "",
  });

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Fetch transactions using React Query
  const {
    data: transactionsData,
    isLoading: isLoadingTransactions,
    error: transactionsError
  } = useTransactionsList(filters, page, rowsPerPage);

  // Fetch dashboard stats using React Query
  const {
    data: dashboardData,
    isLoading: isLoadingDashboard,
    error: dashboardError
  } = useTransactionDashboard(timeRange, {
    startDate: filters.startDate,
    endDate: filters.endDate,
    cabangId: filters.cabangId
  });

  console.log(dashboardData);

  // Extract data from query results
  const transactions = transactionsData || [];
  
  // Extract data from the new API response format
  const summary = dashboardData?.summary || {
    total_transaksi: 0,
    total_penjualan: 0,
    rata_rata_nilai_transaksi: 0,
    metode_pembayaran: {},
    periode: { tanggal_mulai: '', tanggal_akhir: '' },
  };
  const salesTrend = dashboardData?.sales_trend || [];
  const branchDistribution = dashboardData?.branch_distribution || [];
  const topProducts = dashboardData?.top_products || [];
  const paymentStatus = dashboardData?.payment_status || {
    LUNAS: { count: 0, total: 0 },
    BELUM_LUNAS: { count: 0, total: 0 },
    DIBATALKAN: { count: 0, total: 0 },
  };

  const totalPembayaran = Object.values(summary.metode_pembayaran || {}).reduce(
    (acc, val) => acc + val, 0
  );
  const metodePembayaranArray = Object.entries(summary.metode_pembayaran || {}).map(
    ([metode, jumlah]) => ({
      metode,
      jumlah,
      persentase: totalPembayaran ? ((jumlah / totalPembayaran) * 100).toFixed(1) : 0,
    })
  );
  


  // Handle errors
  React.useEffect(() => {
    if (transactionsError) {
      toast.error("Gagal memuat data transaksi");
      console.error("Error fetching transactions:", transactionsError);
    }
    if (dashboardError) {
      toast.error("Gagal memuat data dashboard");
      console.error("Error fetching dashboard stats:", dashboardError);
    }
  }, [transactionsError, dashboardError]);

  // Handle filter changes
  const handleFilterChange = (name, value) => {
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  // Apply filters
  const applyFilters = () => {
    setPage(0); // Reset to first page when applying filters
    // React Query will automatically refetch when dependencies change
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      startDate: dayjs().subtract(30, "day"),
      endDate: dayjs(),
      cabangId: "all",
      jenisTransaksi: "all",
      statusPembayaran: "all",
      search: "",
    });
    setPage(0);
    // React Query will automatically refetch when dependencies change
  };

  // View transaction detail
  const viewTransactionDetail = (transactionId) => {
    navigate(`/transactions/${transactionId}`);
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    let className;

    switch (status) {
      case "LUNAS":
        className = "bg-green-100 text-green-800";
        break;
      case "BELUM_LUNAS":
        className = "bg-yellow-100 text-yellow-800";
        break;
      case "DIBATALKAN":
        className = "bg-red-100 text-red-800";
        break;
      default:
        className = "bg-gray-100 text-gray-800";
    }

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${className}`}
      >
        {status.replace("_", " ")}
      </span>
    );
  };

  // Transaction type badge component
  const TransactionTypeBadge = ({ type }) => {
    let className;
    let icon;

    switch (type) {
      case "PENJUALAN":
        className = "text-blue-600 border-blue-600";
        icon = <ArrowUpCircle size={14} className="mr-1" />;
        break;
      case "PEMBELIAN":
        className = "text-indigo-600 border-indigo-600";
        icon = <ArrowDownCircle size={14} className="mr-1" />;
        break;
      case "RETUR_PENJUALAN":
        className = "text-amber-600 border-amber-600";
        icon = <RefreshCcw size={14} className="mr-1" />;
        break;
      case "RETUR_PEMBELIAN":
        className = "text-red-600 border-red-600";
        icon = <RefreshCcw size={14} className="mr-1" />;
        break;
      default:
        className = "text-gray-600 border-gray-600";
        icon = null;
    }

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${className}`}
      >
        {icon}
        {type.replace("_", " ")}
      </span>
    );
  };

  // Change time range
  const handleChangeTimeRange = (range) => {
    setTimeRange(range);
  };

  // Dummy data untuk demonstrasi
 

  // Time range options component
  const TimeRangeSelector = () => (
    <div className="inline-flex justify-center items-center space-x-2 bg-gradient-to-r from-indigo-100 to-blue-100 p-1 rounded-md text-sm font-medium mb-4 shadow-md">
      <button
        className={`px-3 py-1 rounded ${
          timeRange === "1d" ? "bg-white shadow-md text-blue-600 font-bold" : "hover:bg-blue-200 text-gray-700"
        }`}
        onClick={() => handleChangeTimeRange("1d")}
      >
        1D
      </button>
      <button
        className={`px-3 py-1 rounded ${
          timeRange === "7d" ? "bg-white shadow-md text-blue-600 font-bold" : "hover:bg-blue-200 text-gray-700"
        }`}
        onClick={() => handleChangeTimeRange("7d")}
      >
        7D
      </button>
      <button
        className={`px-3 py-1 rounded ${
          timeRange === "30d" ? "bg-white shadow-md text-blue-600 font-bold" : "hover:bg-blue-200 text-gray-700"
        }`}
        onClick={() => handleChangeTimeRange("30d")}
      >
        30D
      </button>
      <button
        className={`px-3 py-1 rounded ${
          timeRange === "90d" ? "bg-white shadow-md text-blue-600 font-bold" : "hover:bg-blue-200 text-gray-700"
        }`}
        onClick={() => handleChangeTimeRange("90d")}
      >
        90D
      </button>
      <button
        className={`px-3 py-1 rounded ${
          timeRange === "1y" ? "bg-white shadow-md text-blue-600 font-bold" : "hover:bg-blue-200 text-gray-700"
        }`}
        onClick={() => handleChangeTimeRange("1y")}
      >
        1T
      </button>
    </div>
  );

  // Branch stat card component
  const BranchStatCard = ({ branch }) => (
    <div className="bg-gradient-to-br from-white to-purple-50 rounded-lg shadow-md p-4 hover:shadow-lg transition-all duration-300 border-l-4 border-purple-400">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-medium text-gray-900">{branch.namaCabang}</h3>
        <Store className="h-5 w-5 text-gray-400" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-gray-500">Transaksi</p>
          <p className="text-lg font-bold text-gray-800">
            {branch.totalTransaksi}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Pendapatan</p>
          <p className="text-[14px] font-bold text-gray-800">
            {formatCurrency(branch.totalPendapatan)}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center">
        <span
          className={`text-xs font-medium flex items-center ${
            branch.persentasePertumbuhan >= 0
              ? "text-green-500"
              : "text-red-500"
          }`}
        >
          {branch.persentasePertumbuhan >= 0 ? (
            <ArrowUpCircle size={12} className="mr-1" />
          ) : (
            <ArrowDownCircle size={12} className="mr-1" />
          )}
          {Math.abs(branch.persentasePertumbuhan)}%
        </span>
        <span className="text-xs text-gray-500 ml-1">
          dari periode sebelumnya
        </span>
      </div>
    </div>
  );

  return (
    <div className="w-full p-6">
      {/* Dashboard Header */}
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>
          <p className="text-sm text-gray-600">
            Manajemen transaksi global di seluruh cabang
          </p>
        </div>
        <TimeRangeSelector />
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {/* Total Transaksi */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Transaksi
              </p>
              <p className="text-2xl font-bold text-gray-800 mt-2">
                {(summary.total_transaksi ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="p-2 bg-blue-200 rounded-lg shadow-inner">
              <ShoppingCart className="h-6 w-6 text-indigo-500" />
            </div>
          </div>
          
        </div>

        {/* Pendapatan */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Pendapatan</p>
              <p className="text-2xl font-bold text-gray-800 mt-2">
                {formatCurrency(summary.total_penjualan)}
              </p>
            </div>
            <div className="p-2 bg-green-200 rounded-lg shadow-inner">
              <DollarSign className="h-6 w-6 text-green-500" />
            </div>
          </div>
          
        </div>

        {/* Rata-rata Nilai Transaksi */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg shadow-lg p-6 border-l-4 border-amber-500 hover:shadow-xl transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Rata-rata Nilai Transaksi
              </p>
              <p className="text-2xl font-bold text-gray-800 mt-2">
                {formatCurrency(summary.rata_rata_nilai_transaksi || 0)}
              </p>
            </div>
            <div className="p-2 bg-amber-200 rounded-lg shadow-inner">
              <Clock className="h-6 w-6 text-yellow-500" />
            </div>
          </div>
          
        </div>

      </div>

      {/* Dashboard Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Branch Stats - Full Width */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg shadow-lg col-span-1 lg:col-span-3 border-t-4 border-purple-500">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-800 flex items-center">
              <Store className="h-5 w-5 text-gray-500 mr-2" />
              Performa Cabang
            </h2>
            <button
              onClick={() => navigate("/superadmin/cabang")}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
            >
              Lihat Semua
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {branchDistribution.map((branch) => (
              <BranchStatCard key={branch.cabang_id} branch={{
                namaCabang: branch.nama_cabang,
                totalTransaksi: branch.jumlah_transaksi,
                totalPendapatan: branch.total_penjualan,
                persentasePertumbuhan: 0 // Default to 0 as it's not in the new API format
              }} />
            ))}
          </div>
        </div>

        {/* Payment Method Stats */}
        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg shadow-lg col-span-1 border-t-4 border-cyan-500 hover:shadow-xl transition-all duration-300">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-800 flex items-center">
              <CreditCard className="h-5 w-5 text-gray-500 mr-2" />
              Metode Pembayaran
            </h2>
          </div>
          <div className="p-4">
            {metodePembayaranArray.length > 0 ? (
              metodePembayaranArray.map((item) => (
                <div key={item.metode} className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {item.metode.replace("_", " ")}
                    </span>
                    <span className="text-sm text-gray-600">
                      {item.jumlah} transaksi ({item.persentase}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-indigo-500 h-2 rounded-full shadow-inner"
                      style={{ width: `${item.persentase}%` }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-sm text-gray-500 py-3">
                Tidak ada data metode pembayaran
              </div>
            )}
          </div>
        </div>

        {/* Transaction Type Stats */}
        <div className="bg-gradient-to-br from-rose-50 to-orange-50 rounded-lg shadow-lg col-span-1 border-t-4 border-rose-500 hover:shadow-xl transition-all duration-300">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-800 flex items-center">
              <PieChart className="h-5 w-5 text-gray-500 mr-2" />
              Jenis Transaksi
            </h2>
          </div>
          <div className="p-4">
            {Object.entries(paymentStatus).length > 0 ? (
              Object.entries(paymentStatus).map(([status, data]) => {
                const total = Object.values(paymentStatus).reduce((acc, curr) => acc + curr.count, 0);
                const percentage = total > 0 ? ((data.count / total) * 100).toFixed(1) : 0;
                
                return (
                  <div key={status} className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        {status.replace("_", " ")}
                      </span>
                      <span className="text-sm text-gray-600">
                        {data.count} transaksi ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full shadow-inner ${
                          status === "LUNAS"
                            ? "bg-gradient-to-r from-green-500 to-emerald-400"
                            : status === "BELUM_LUNAS"
                            ? "bg-gradient-to-r from-yellow-500 to-amber-400"
                            : "bg-gradient-to-r from-red-500 to-rose-400"
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-sm text-gray-500 py-3">
                Tidak ada data status pembayaran
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Daily Transaction Chart */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-lg mb-6 border-t-4 border-blue-500 hover:shadow-xl transition-all duration-300">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800 flex items-center">
            <TrendingUp className="h-5 w-5 text-gray-500 mr-2" />
            Transaksi Harian
          </h2>
        </div>
        <div className="p-4 h-64">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={salesTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="periode"
                tickFormatter={date => {
                  // Format tanggal ke dd/MM atau sesuai kebutuhan
                  const d = new Date(date);
                  return `${d.getDate()}/${d.getMonth()+1}`;
                }}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tickFormatter={val => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}
                tick={{ fontSize: 12 }}
              />
              <Tooltip formatter={(value) => formatCurrency(value)} labelFormatter={label => `Tanggal: ${label}`} />
              <Line type="monotone" dataKey="total_penjualan" stroke="#6366f1" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} name="Total Penjualan" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg shadow-lg mb-6 border-t-4 border-emerald-500 hover:shadow-xl transition-all duration-300">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800 flex items-center">
            <BarChart3 className="h-5 w-5 text-gray-500 mr-2" />
            Produk Terlaris
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produk
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Terjual
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Penjualan
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topProducts.length > 0 ? (
                topProducts.map((product) => (
                  <tr key={product.nama_produk} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.nama_produk}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.jumlah_terjual} unit
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(product.total_penjualan)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">
                    Tidak ada data produk
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Content */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg shadow-lg mb-6 border-t-4 border-slate-500 hover:shadow-xl transition-all duration-300">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">
            Transaksi Global
          </h2>
        </div>

        {/* Filter Section */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center mb-3">
            <Filter className="h-4 w-4 text-gray-500 mr-2" />
            <h3 className="text-sm font-medium text-gray-700">
              Filter Transaksi
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Dari Tanggal
              </label>
              <input
                type="date"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={filters.startDate.format("YYYY-MM-DD")}
                onChange={(e) =>
                  handleFilterChange("startDate", dayjs(e.target.value))
                }
                max={filters.endDate.format("YYYY-MM-DD")}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Sampai Tanggal
              </label>
              <input
                type="date"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={filters.endDate.format("YYYY-MM-DD")}
                onChange={(e) =>
                  handleFilterChange("endDate", dayjs(e.target.value))
                }
                min={filters.startDate.format("YYYY-MM-DD")}
              />
            </div>

            {/* Cabang Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Cabang
              </label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={filters.cabangId}
                onChange={(e) => handleFilterChange("cabangId", e.target.value)}
              >
                <option value="all">Semua Cabang</option>
                {cabangList &&
                  cabangList.map((cabang) => (
                    <option key={cabang.id} value={cabang.id}>
                      {cabang.namaCabang}
                    </option>
                  ))}
              </select>
            </div>

            {/* Transaction Type Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Jenis Transaksi
              </label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={filters.jenisTransaksi}
                onChange={(e) =>
                  handleFilterChange("jenisTransaksi", e.target.value)
                }
              >
                <option value="all">Semua Jenis</option>
                <option value="PENJUALAN">Penjualan</option>
                <option value="PEMBELIAN">Pembelian</option>
                <option value="RETUR_PENJUALAN">Retur Penjualan</option>
                <option value="RETUR_PEMBELIAN">Retur Pembelian</option>
              </select>
            </div>

            {/* Payment Status Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Status Pembayaran
              </label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={filters.statusPembayaran}
                onChange={(e) =>
                  handleFilterChange("statusPembayaran", e.target.value)
                }
              >
                <option value="all">Semua Status</option>
                <option value="LUNAS">Lunas</option>
                <option value="BELUM_LUNAS">Belum Lunas</option>
                <option value="DIBATALKAN">Dibatalkan</option>
              </select>
            </div>

            {/* Search Field */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Cari (No. Transaksi / Pelanggan / Supplier)
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Cari..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-end sm:col-span-2 space-x-2">
              <button
                onClick={applyFilters}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Terapkan Filter
              </button>
              <button
                onClick={resetFilters}
                className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-2 rounded-md text-sm font-medium"
              >
                Reset
              </button>
              <button
                onClick={() =>
                  toast.success("Fitur ekspor data akan segera tersedia")
                }
                className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 ml-auto px-4 py-2 rounded-md text-sm font-medium"
              >
                <Download className="h-4 w-4 inline mr-1" />
                Ekspor
              </button>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {transactionsError && (
          <div className="p-4 m-4 bg-red-100 border border-red-300 text-red-900 rounded-md">
            Gagal memuat data transaksi. Silakan coba lagi.
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  No. Transaksi
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Tanggal
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Jenis
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Cabang
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Pelanggan/Supplier
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Total
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Kasir
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoadingTransactions ? (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Memuat data transaksi...
                    </p>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center">
                    <FileText className="mx-auto h-10 w-10 text-gray-300" />
                    <p className="mt-2 text-sm text-gray-500">
                      Tidak ada data transaksi
                    </p>
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr
                    key={transaction.transaksi_id}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {transaction.nomor_transaksi}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(
                        new Date(transaction.tanggal),
                        "dd MMM yyyy HH:mm",
                        {
                          locale: id,
                        }
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <TransactionTypeBadge
                        type={transaction.jenis_transaksi}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.cabang?.namaCabang || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.jenis_transaksi.includes("PENJUALAN")
                        ? transaction.pelanggan?.namaPelanggan ||
                          "Pelanggan Umum"
                        : transaction.supplier?.namaSupplier || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                      {formatCurrency(transaction.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <StatusBadge status={transaction.status_pembayaran} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.created_by || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      <button
                        onClick={() =>
                          viewTransactionDetail(transaction.transaksi_id)
                        }
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Lihat Detail"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(old => Math.max(0, old - 1))}
              disabled={page === 0 || isLoadingTransactions}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {page + 1}
            </span>
            <button
              onClick={() => setPage(old => old + 1)}
              disabled={transactions.length < rowsPerPage || isLoadingTransactions}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="text-sm text-gray-500">
            Menampilkan {transactions.length} transaksi
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalTransactions;
