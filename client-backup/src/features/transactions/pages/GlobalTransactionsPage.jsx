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
  Plus,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { useCabang } from "@features/cabang/hooks/useCabang";
import toast from "react-hot-toast";
import { useAuth } from "@features/auth/hooks/useAuth";
import { useTransactionsList, useTransactionDashboard, useCancelTransaction } from "../hooks/useTransactions";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import formatCurrency from "@common/utils/formatCurrency";



// Component utama
const GlobalTransactions = () => {
  const navigate = useNavigate();
  const { selectedCabang, cabangList = [] } = useCabang();
  const { hasPermission, isSuperAdmin, user } = useAuth();
  const [timeRange, setTimeRange] = useState("30d"); // '7d', '30d', '90d', '1y'

  // Permissions
  const showDashboardStats = hasPermission("transaksi:manage");
  const canCreate = hasPermission("transaksi:create");
  const canRead = hasPermission("transaksi:read");
  const canDelete = hasPermission("transaksi:delete");
  const isSuperAdminUser = isSuperAdmin();

  // Filter state
  const [filters, setFilters] = useState({
    startDate: dayjs().subtract(30, "day"),
    endDate: dayjs(),
    cabangId: isSuperAdminUser ? "all" : (selectedCabang?.id || "all"), // Default logic updated below
    jenisTransaksi: "all",
    statusPembayaran: "all",
    search: "",
  });

  // Update default cabangId when not super admin
  React.useEffect(() => {
    if (!isSuperAdminUser && cabangList.length > 0 && filters.cabangId === "all") {
       // Find first valid branch if "all" is set but not allowed
       const defaultBranch = selectedCabang?.id || cabangList[0]?.id;
       if (defaultBranch) {
         setFilters(prev => ({ ...prev, cabangId: defaultBranch }));
       }
    }
  }, [isSuperAdminUser, cabangList, selectedCabang]);

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Fetch transactions using React Query
  const {
    data: transactionsData,
    isLoading: isLoadingTransactions,
    error: transactionsError,
    refetch: refetchTransactions
  } = useTransactionsList(filters, page, rowsPerPage);

  const cancelTransactionMutation = useCancelTransaction();

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

  const handleCancelTransaction = async (id, status) => {
    if (status === "DIBATALKAN" || status === "LUNAS") return;
    
    if (window.confirm("Apakah Anda yakin ingin membatalkan transaksi ini?")) {
      try {
        await cancelTransactionMutation.mutateAsync(id);
        toast.success("Transaksi berhasil dibatalkan");
        refetchTransactions();
      } catch (error) {
        console.error("Gagal membatalkan transaksi:", error);
        toast.error("Gagal membatalkan transaksi");
      }
    }
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

  // Change time range and update filters automatically
  const handleChangeTimeRange = (range) => {
    setTimeRange(range);
    
    // Calculate new date range based on selection
    const end = dayjs();
    let start = dayjs();
    
    switch(range) {
      case "1d":
        start = dayjs().startOf('day');
        break;
      case "7d":
        start = dayjs().subtract(7, 'day');
        break;
      case "30d":
        start = dayjs().subtract(30, 'day');
        break;
      case "90d":
        start = dayjs().subtract(90, 'day');
        break;
      case "1y":
        start = dayjs().subtract(1, 'year');
        break;
      default:
        start = dayjs().subtract(30, 'day');
    }
    
    setFilters(prev => ({
      ...prev,
      startDate: start,
      endDate: end
    }));
  };

  // Dummy data untuk demonstrasi
 

  // Time range options component - Modern Clean Design
  const TimeRangeSelector = () => (
    <div className="inline-flex bg-gray-100 p-1 rounded-lg">
      {[
        { id: "1d", label: "Hari Ini" },
        { id: "7d", label: "7 Hari" },
        { id: "30d", label: "30 Hari" },
        { id: "90d", label: "90 Hari" },
        { id: "1y", label: "1 Tahun" }
      ].map((option) => (
        <button
          key={option.id}
          className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
            timeRange === option.id 
              ? "bg-white text-gray-900 shadow-sm ring-1 ring-black/5" 
              : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"
          }`}
          onClick={() => handleChangeTimeRange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );

  // Branch stat card component - Modern Clean Design
  const BranchStatCard = ({ branch }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-4 transition-all duration-200 hover:shadow-md hover:border-gray-300">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-50 rounded-lg">
            <Store className="h-5 w-5 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-900 line-clamp-1" title={branch.namaCabang}>{branch.namaCabang}</h3>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Transaksi</p>
          <p className="text-xl font-bold text-gray-900">
            {branch.totalTransaksi.toLocaleString()}
          </p>
        </div>
        <div className="border-l border-gray-100 pl-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Pendapatan</p>
          <p className="text-base font-bold text-gray-900 truncate">
            {formatCurrency(branch.totalPendapatan)}
          </p>
        </div>
      </div>
      
      {branch.persentasePertumbuhan !== 0 && (
        <div className="mt-4 pt-3 border-t border-gray-50 flex items-center">
          <span
            className={`text-xs font-medium flex items-center px-2 py-0.5 rounded-full ${
              branch.persentasePertumbuhan >= 0
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {branch.persentasePertumbuhan >= 0 ? (
              <ArrowUpCircle size={12} className="mr-1.5" />
            ) : (
              <ArrowDownCircle size={12} className="mr-1.5" />
            )}
            {Math.abs(branch.persentasePertumbuhan)}%
          </span>
          <span className="text-xs text-gray-400 ml-2">
            vs periode lalu
          </span>
        </div>
      )}
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
      {showDashboardStats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Total Transaksi */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all duration-200 hover:shadow-md hover:border-gray-300">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 tracking-wide">
                    Total Transaksi
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {(summary.total_transaksi ?? 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">periode terpilih</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl">
                  <ShoppingCart className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
    
            {/* Pendapatan */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all duration-200 hover:shadow-md hover:border-gray-300">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 tracking-wide">Total Pendapatan</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {formatCurrency(summary.total_penjualan)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">periode terpilih</p>
                </div>
                <div className="p-3 bg-green-50 rounded-xl">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
    
            {/* Rata-rata Nilai Transaksi */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all duration-200 hover:shadow-md hover:border-gray-300">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 tracking-wide">
                    Rata-rata Transaksi
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {formatCurrency(summary.rata_rata_nilai_transaksi || 0)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">per transaksi</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </div>
          </div>
    
          {/* Dashboard Detailed Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Branch Stats - Full Width */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 col-span-1 lg:col-span-3">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Store className="h-5 w-5 text-purple-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Performa Cabang
                  </h2>
                </div>
                <button
                  onClick={() => navigate("/superadmin/cabang")}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center transition-colors"
                >
                  Lihat Semua
                  <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {branchDistribution.map((branch) => (
                  <BranchStatCard key={branch.cabang_id} branch={{
                    namaCabang: branch.nama_cabang,
                    totalTransaksi: branch.jumlah_transaksi,
                    totalPendapatan: branch.total_penjualan,
                    persentasePertumbuhan: 0 
                  }} />
                ))}
              </div>
            </div>
    
            {/* Payment Method Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 col-span-1">
              <div className="p-6 border-b border-gray-100 flex items-center space-x-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Metode Pembayaran
                </h2>
              </div>
              <div className="p-6">
                {metodePembayaranArray.length > 0 ? (
                  metodePembayaranArray.map((item) => (
                    <div key={item.metode} className="mb-4 last:mb-0">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-agreed text-gray-700 capitalize">
                          {item.metode.replace("_", " ").toLowerCase()}
                        </span>
                        <span className="text-sm text-gray-600">
                          {item.jumlah} ({item.persentase}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${item.persentase}%` }}
                        ></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-sm text-gray-500 py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    Tidak ada data metode pembayaran
                  </div>
                )}
              </div>
            </div>
    
            {/* Transaction Type Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 col-span-1">
              <div className="p-6 border-b border-gray-100 flex items-center space-x-3">
                <div className="p-2 bg-amber-50 rounded-lg">
                   <PieChart className="h-5 w-5 text-amber-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Status Pembayaran
                </h2>
              </div>
              <div className="p-6">
                {Object.entries(paymentStatus).length > 0 ? (
                  Object.entries(paymentStatus).map(([status, data]) => {
                    const total = Object.values(paymentStatus).reduce((acc, curr) => acc + curr.count, 0);
                    const percentage = total > 0 ? ((data.count / total) * 100).toFixed(1) : 0;
                    
                    return (
                      <div key={status} className="mb-4 last:mb-0">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            {status.replace("_", " ").toLowerCase()}
                          </span>
                          <span className="text-sm text-gray-600">
                            {data.count} ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              status === "LUNAS"
                                ? "bg-emerald-500"
                                : status === "BELUM_LUNAS"
                                ? "bg-amber-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-sm text-gray-500 py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    Tidak ada data status pembayaran
                  </div>
                )}
              </div>
            </div>
          </div>
    
          {/* Daily Transaction Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
            <div className="p-6 border-b border-gray-100 flex items-center space-x-3">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                Transaksi Harian
              </h2>
            </div>
            <div className="p-6 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="periode"
                    tickFormatter={date => {
                      const d = new Date(date);
                      return `${d.getDate()}/${d.getMonth()+1}`;
                    }}
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis 
                    tickFormatter={val => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    axisLine={false}
                    tickLine={false}
                    dx={-10}
                  />
                  <Tooltip 
                    cursor={{ stroke: '#6366F1', strokeWidth: 1, strokeDasharray: '4 4' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    formatter={(value) => [formatCurrency(value), 'Total Penjualan']}
                    labelFormatter={label => `Tanggal: ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="total_penjualan" 
                    stroke="#4F46E5" 
                    strokeWidth={3} 
                    dot={{ r: 4, stroke: '#4F46E5', strokeWidth: 2, fill: '#ffffff' }} 
                    activeDot={{ r: 6, stroke: '#4F46E5', strokeWidth: 2, fill: '#4F46E5' }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
    
          {/* Top Products */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
            <div className="p-6 border-b border-gray-100 flex items-center space-x-3">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <BarChart3 className="h-5 w-5 text-emerald-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                Produk Terlaris
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Produk
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Terjual
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Total Penjualan
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {topProducts.length > 0 ? (
                    topProducts.map((product) => (
                      <tr key={product.nama_produk} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product.nama_produk}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                             {product.jumlah_terjual} unit
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {formatCurrency(product.total_penjualan)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="px-6 py-12 text-center text-sm text-gray-500">
                        <div className="flex flex-col items-center justify-center">
                          <div className="p-3 bg-gray-100 rounded-full mb-3">
                            <BarChart3 className="h-6 w-6 text-gray-400" />
                          </div>
                          <p>Tidak ada data produk</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">
            Daftar Transaksi
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
                {isSuperAdminUser && <option value="all">Pilih Cabang</option>}
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
              {canCreate && (
                <button
                  onClick={() => navigate("/kasir/pos")}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Tambah Transaksi
                </button>
              )}
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
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm space-x-2">
                       {canRead && (
                        <button
                          onClick={() =>
                            viewTransactionDetail(transaction.transaksi_id)
                          }
                          className="text-indigo-600 hover:text-indigo-900 inline-block"
                          title="Lihat Detail"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                      )}
                      
                      {canDelete && 
                       transaction.status_pembayaran !== "DIBATALKAN" && 
                       transaction.status_pembayaran !== "LUNAS" && (
                        <button
                          onClick={() =>
                            handleCancelTransaction(transaction.transaksi_id, transaction.status_pembayaran)
                          }
                          className="text-red-600 hover:text-red-900 inline-block"
                          title="Batalkan Transaksi"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
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
