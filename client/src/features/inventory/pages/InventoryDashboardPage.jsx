import React, { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";
import {
  BarChart3,
  Package,
  AlertTriangle,
  Clock,
  DollarSign,
  Truck,
  RefreshCw,
  ChevronRight,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  Layers,
  Activity,
  BarChart2,
  Percent,
  Store,
  Filter,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Box,
  Calendar,
  Tag,
  ChevronDown,
  ChevronUp,
  CheckCircle,
} from "lucide-react";
import Spinner from "../../../features/common/Spinner.jsx";
import { useCabangList } from "../../../features/cabang/hooks/useCabangQueries";
import useInventoryQueries from "../hooks/useInventoryQueries";
import { useAuth } from "../../auth/hooks/useAuth.js";
import useAuthStore from "../../../app/store/useAuthStore";

import { MovementTrends, TopProducts } from "../components/StockMovementVisualizations";

// Toggle between mock and real data
const USE_MOCK_DATA = false;

// Validation schema for filter form
const filterSchema = z.object({
  cabangId: z.string(),
  period: z.number().min(1, "Periode harus lebih dari 0 hari"),
});

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color, isLoading }) => {
  // Map color to Tailwind classes
  const colorClasses = {
    blue: "bg-blue-100",
    red: "bg-red-100",
    yellow: "bg-yellow-100",
    green: "bg-green-100",
    indigo: "bg-indigo-100",
    purple: "bg-purple-100",
    gray: "bg-gray-100",
  };

  const textColorClasses = {
    blue: "text-blue-600",
    red: "text-red-600",
    yellow: "text-yellow-600",
    green: "text-green-600",
    indigo: "text-indigo-600",
    purple: "text-purple-600",
    gray: "text-gray-600",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          {isLoading ? (
            <div className="h-8 bg-gray-200 rounded animate-pulse mt-1 w-24"></div>
          ) : (
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          )}
        </div>
        <div className={`${colorClasses[color] || "bg-gray-100"} p-3 rounded-full`}>
          <Icon className={`h-6 w-6 ${textColorClasses[color] || "text-gray-600"}`} />
        </div>
      </div>
    </div>
  );
};

// Product List Component
const ProductList = ({ title, products = [], icon: Icon, color, viewAllLink, isLoading }) => {
  // Map color to Tailwind classes
  const colorClasses = {
    blue: "bg-blue-100",
    red: "bg-red-100",
    yellow: "bg-yellow-100",
    green: "bg-green-100",
    indigo: "bg-indigo-100",
    purple: "bg-purple-100",
    gray: "bg-gray-100",
  };

  const textColorClasses = {
    blue: "text-blue-600",
    red: "text-red-600",
    yellow: "text-yellow-600",
    green: "text-green-600",
    indigo: "text-indigo-600",
    purple: "text-purple-600",
    gray: "text-gray-600",
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="animate-pulse flex items-center p-3 border border-gray-100 rounded-lg">
              <div className={`${colorClasses[color] || "bg-gray-100"} p-2 rounded-lg mr-3`}>
                <div className="h-5 w-5 bg-gray-200 rounded"></div>
              </div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="h-6 w-16 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        {viewAllLink && (
          <Link
            to={viewAllLink}
            className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
          >
            Lihat Semua
            <ChevronRight size={16} />
          </Link>
        )}
      </div>
      {products?.length > 0 ? (
        <div className="space-y-3">
          {products.slice(0, 3).map((product, index) => (
            <div key={product.id || index} className="flex items-center p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
              <div className={`${colorClasses[color] || "bg-gray-100"} p-2 rounded-lg mr-3`}>
                <Icon className={`h-5 w-5 ${textColorClasses[color] || "text-gray-600"}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{product.name}</p>
                <p className="text-xs text-gray-500">
                  {product.expiryDate ? (
                    <span>Kadaluarsa: {new Date(product.expiryDate).toLocaleDateString('id-ID')}</span>
                  ) : (
                    <span>Stok: {product.stock} / Min: {product.minStock || 0}</span>
                  )}
                  {product.branch && <span> • {product.branch}</span>}
                </p>
              </div>
              <div className="text-sm font-medium">
                {product.expiryDate ? (
                  <span className="text-yellow-600">{product.daysUntilExpiry} hari tersisa</span>
                ) : (
                  <span className="text-red-600">{product.status}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center">
          <p className="text-gray-500">Tidak ada data</p>
        </div>
      )}
    </div>
  );
};

// Transfer List Component
const TransferList = ({ transfers = [], isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Transfer Antar Cabang</h3>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="animate-pulse flex items-center p-3 border border-gray-100 rounded-lg">
              <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                <div className="h-5 w-5 bg-gray-200 rounded"></div>
              </div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="h-6 w-24 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Transfer Antar Cabang</h3>
        <button className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center">
          Lihat Semua
          <ChevronRight size={16} />
        </button>
      </div>
      {transfers?.length > 0 ? (
        <div className="space-y-4">
          {transfers.slice(0, 3).map((transfer, index) => (
            <div key={transfer.id || transfer.transfer_id || index} className="flex items-start p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
              <div className="bg-indigo-100 p-2 rounded-lg mr-3 mt-1">
                <Truck className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {transfer.title || transfer.nomor_transfer || `Transfer #${transfer.transfer_id || index + 1}`}
                </p>
                <p className="text-xs text-gray-500 mb-1">
                  {transfer.date || (transfer.tanggal_kirim && new Date(transfer.tanggal_kirim).toLocaleDateString('id-ID')) || (transfer.created_at && new Date(transfer.created_at).toLocaleDateString('id-ID'))}
                </p>
                <div className="flex items-center">
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    {transfer.fromBranch || transfer.cabang_asal}
                  </span>
                  <ArrowRight className="h-3 w-3 mx-1 text-gray-400" />
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    {transfer.toBranch || transfer.cabang_tujuan}
                  </span>
                </div>
              </div>
              <div className="text-sm font-medium">
                <span className={`px-2 py-1 rounded text-xs ${transfer.statusClass || transfer.status_style || 'bg-blue-100 text-blue-800'}`}>
                  {transfer.status || transfer.status_text || 'Dalam Proses'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center">
          <p className="text-gray-500">Tidak ada transfer terbaru</p>
        </div>
      )}
    </div>
  );
};

// Inventory Activities Component
const InventoryActivities = ({ activities = [], isLoading }) => {
  // Function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Function to get activity icon and color based on type
  const getActivityIconAndColor = (type, direction) => {
    const isOutgoing = direction === 'Keluar';
    
    switch (type?.toLowerCase()) {
      case 'penjualan':
        return {
          icon: ShoppingCart,
          bgColor: isOutgoing ? 'bg-red-100' : 'bg-green-100',
          textColor: isOutgoing ? 'text-red-600' : 'text-green-600'
        };
      case 'pembelian':
        return {
          icon: ShoppingCart,
          bgColor: isOutgoing ? 'bg-red-100' : 'bg-green-100',
          textColor: isOutgoing ? 'text-red-600' : 'text-green-600'
        };
      case 'transfer':
        return {
          icon: Truck,
          bgColor: 'bg-indigo-100',
          textColor: 'text-indigo-600'
        };
      case 'adjustment':
        return {
          icon: RefreshCw,
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-600'
        };
      default:
        return {
          icon: Package,
          bgColor: isOutgoing ? 'bg-red-100' : 'bg-green-100',
          textColor: isOutgoing ? 'text-red-600' : 'text-green-600'
        };
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Aktivitas Inventori Terbaru</h3>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="animate-pulse flex items-start p-3 border border-gray-100 rounded-lg">
              <div className="bg-gray-100 p-2 rounded-lg mr-3 mt-1">
                <div className="h-5 w-5 bg-gray-200 rounded"></div>
              </div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
              <div className="h-6 w-16 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Aktivitas Inventori Terbaru</h3>
        <Link to="/inventory/activities" className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center">
          Lihat Semua
          <ChevronRight size={16} />
        </Link>
      </div>

      {activities?.length > 0 ? (
        <div className="space-y-4">
          {activities.slice(0, 5).map((activity, index) => {
            const { icon: Icon, bgColor, textColor } = getActivityIconAndColor(activity.tipe_aktivitas, activity.jenis_pergerakan);
            const isOutgoing = activity.jenis_pergerakan === 'Keluar';
            
            return (
              <div key={activity.id || index} className="flex items-start p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                <div className={`${bgColor} p-2 rounded-lg mr-3 mt-1`}>
                  <Icon className={`h-5 w-5 ${textColor}`} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium text-gray-900">{activity.nama_produk}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${isOutgoing ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {isOutgoing ? 'Keluar' : 'Masuk'} {Math.abs(activity.jumlah)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{activity.catatan || activity.tipe_aktivitas}</p>
                  <div className="flex items-center mt-1 text-xs text-gray-500">
                    <span className="mr-2">{formatDate(activity.waktu_aktivitas)}</span>
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded">{activity.nama_cabang}</span>
                    {activity.nama_user && (
                      <span className="ml-2 italic">oleh {activity.nama_user}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-8 text-center">
          <p className="text-gray-500">Tidak ada aktivitas inventori terbaru</p>
        </div>
      )}
    </div>
  );
};

// Chart Placeholder Component
const ChartPlaceholder = ({ title, description, icon: Icon }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6 flex flex-col items-center justify-center text-center h-64">
      <Icon className="h-12 w-12 text-gray-300 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 max-w-md">{description}</p>
    </div>
  );
};


// Inventory Health Score Component
const InventoryHealthScore = ({ score, isLoading }) => {
  // ... (rest of the code remains the same)
  // Determine color and text based on score
  let scoreColor = "gray";
  let scoreText = "Data tidak tersedia";

  if (score >= 80) {
    scoreColor = "green";
    scoreText = "Sangat Baik";
  } else if (score >= 60) {
    scoreColor = "blue";
    scoreText = "Baik";
  } else if (score >= 40) {
    scoreColor = "yellow";
    scoreText = "Cukup";
  } else if (score >= 20) {
    scoreColor = "orange";
    scoreText = "Kurang";
  } else if (score >= 0) {
    scoreColor = "red";
    scoreText = "Buruk";
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Skor Kesehatan Inventori</h3>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-6">
          <div className="relative h-32 w-32 rounded-full flex items-center justify-center border-8 border-gray-200 animate-pulse mb-4"></div>
          <div className="h-5 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-6">
          <div className={`relative h-32 w-32 rounded-full flex items-center justify-center border-8 border-${scoreColor === 'orange' ? 'amber' : scoreColor}-500 mb-4`}>
            <span className="text-3xl font-bold">{score}%</span>
          </div>
          <div className="text-center">
            <p className={`text-lg font-medium text-${scoreColor === 'orange' ? 'amber' : scoreColor}-600 mb-1`}>{scoreText}</p>
            <p className="text-sm text-gray-500">Terakhir diperbarui: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Main Dashboard Component
const InventoryDashboard = () => {
  const { user } = useAuth();
  const [showAllCategories, setShowAllCategories] = useState(false);
  
  const userCabang = useAuthStore((state) => state.getUserCabang());
  const primaryCabang = useAuthStore((state) => state.getPrimaryCabang());
  const hasMultipleBranches = userCabang.length > 1;
  const defaultBranchId = userCabang.length === 1 && primaryCabang ? (primaryCabang.id || primaryCabang.cabangId || primaryCabang.cabang_id) : "all";
  
  // Determine default cabangId based on user role and assigned cabang
  function getDefaultCabangId() {
    if (user?.role === "superadmin" || user?.role === "admin") {
      return "all";
    } else if (userCabang.length === 1 && defaultBranchId !== "all") {
      return defaultBranchId;
    } else if (user?.cabangId) {
      return user.cabangId;
    }
    return "all";
  }
  
  const [filterValues, setFilterValues] = useState({
    cabangId: getDefaultCabangId(),
    period: 30,
  });

  // Setup form with validation
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(filterSchema),
    defaultValues: filterValues,
  });

  // Watch for changes to cabangId
  const selectedCabangId = watch('cabangId');

  // Get cabang list
  const { data: cabangListData, isLoading: isCabangListLoading } =  useCabangList();

  console.log("cabangListData",cabangListData);

  // Setup queries with TanStack Query
  const {
    useDashboardData,
    useLowStockProducts,
    useStockMovementData,
    useBranchTransferData,
    useStockValue,
    useInventoryActivities,
    useExpiringProducts,
    useInventoryHealthScore,
    useHighStockMovementsTrends,
    useInventoryValueByCategory
  } = useInventoryQueries();  

  // Get dashboard data
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useDashboardData(filterValues.cabangId, filterValues.period);

  console.log("dashboardData",dashboardData);

  // Get low stock products data
  const {
    data: lowStockData,
    isLoading: isLowStockLoading,
    error: lowStockError,
    refetch: refetchLowStock,
  } = useLowStockProducts(filterValues.cabangId);


  console.log("lowStockData",lowStockData);

  // Get stock movement data
  const {
    data: stockMovementData,
    isLoading: isStockMovementLoading,
    error: stockMovementError,
    refetch: refetchStockMovement,
  } = useStockMovementData(filterValues.cabangId, filterValues.period);

  // Get branch transfer data
  const {
    data: transferData,
    isLoading: isTransferLoading,
    error: transferError,
    refetch: refetchTransfer,
  } = useBranchTransferData(filterValues.cabangId, filterValues.period);

  // Get stock value data
  const {
    data: stockValueData,
    isLoading: isStockValueLoading,
    error: stockValueError,
    refetch: refetchStockValue,
  } = useStockValue(filterValues.cabangId);

  // Get expiring products data
  const {
    data: expiringProductsData,
    isLoading: isExpiringLoading,
    error: expiringError,
    refetch: refetchExpiring,
  } = useExpiringProducts(filterValues.cabangId, filterValues.period);

  // Get inventory activities data
  const {
    data: activitiesData,
    isLoading: isActivitiesLoading,
    error: activitiesError,
    refetch: refetchActivities,
  } = useInventoryActivities(filterValues.cabangId, 10);

  const {
    data: categoryValueData,
    isLoading: isCategoryValueLoading,
    error: categoryValueError,
    refetch: refetchCategoryValue,
  } = useInventoryValueByCategory(filterValues.cabangId);

  console.log("categoryValueData",categoryValueData);

  const onSubmitFilter = async (data) => {
    try {
      setFilterValues(data);
    } catch (error) {
      console.error('Error applying filters:', error);
      toast.error('Gagal menerapkan filter');
    }
  };

  useEffect(() => {
    if (selectedCabangId && selectedCabangId !== filterValues.cabangId) {
      handleSubmit(onSubmitFilter)();
    }
  }, [selectedCabangId, filterValues.cabangId, handleSubmit, onSubmitFilter]);

  useEffect(() => {
    if (!USE_MOCK_DATA) {
      refetchDashboard?.();
      refetchLowStock?.();
      refetchStockMovement?.();
      refetchStockValue?.();
      refetchTransfer?.();
      refetchExpiring?.();
      refetchCategoryValue?.();
      refetchActivities?.();
    }
  }, [filterValues, refetchDashboard, refetchLowStock, refetchStockMovement, refetchStockValue, refetchTransfer, refetchExpiring, refetchCategoryValue, refetchActivities]);

  // Format currency function
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return "Rp 0";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Get inventory health score
  const { data: healthScoreData, isLoading: isHealthScoreLoading } = useInventoryHealthScore(filterValues.cabangId);

  // Get high stock movements trends data
  const { data: highStockMovementsData, isLoading: isHighStockMovementsLoading } = useHighStockMovementsTrends(filterValues.cabangId, filterValues.period);

  console.log("healthScoreData",healthScoreData);
  
  const healthScore = healthScoreData?.[0]?.avg_overall_health_score;

  console.log("healthScore",healthScore);

  return (
    <div className="pb-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-center sm:justify-between px-4 sm:px-8 py-6 sm:py-8 mb-6 bg-indigo-600 text-white gap-4 text-center sm:text-left rounded-b-xl sm:rounded-none">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">
            Dashboard Inventori {USE_MOCK_DATA ? '(Mock Data)' : ''}
          </h1>
          <div className="flex items-center justify-center sm:justify-start opacity-90">
            <BarChart3 size={18} className="mr-2" />
            <span className="text-sm">Pantau metrik dan statistik inventori</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 sm:mx-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
          <div className="flex flex-wrap items-center mb-6 gap-4">
            <div className="bg-indigo-50 p-3 rounded-xl">
              <Filter className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Filter Dashboard
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">
                Pilih cabang dan periode waktu
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit(onSubmitFilter)}
            className={`grid grid-cols-1 ${hasMultipleBranches ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}
          >
            {/* Branch Selection */}
            {hasMultipleBranches && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cabang
              </label>
              {isCabangListLoading ? (
                <div className="flex items-center py-2">
                  <Spinner size="sm" />
                  <span className="ml-2 text-sm text-gray-500">
                    Memuat data cabang...
                  </span>
                </div>
              ) : (
                <div className="relative">
                  <select
                    id="cabangId"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    {...register("cabangId")}
                    disabled={user?.role === 'admin_cabang'}
                  >
                    {user?.role === 'super_admin' && (
                      <option value="all">Semua Cabang</option>
                    )}
                    {!isCabangListLoading &&
                      cabangListData.data?.map((cabang) => (
                        <option key={cabang.id} value={cabang.id}>
                          {cabang.namaCabang}
                        </option>
                      ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <Store size={16} />
                  </div>
                </div>
              )}
              {errors.cabangId && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.cabangId.message}
                </p>
              )}
            </div>
            )}

            {/* Period Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Periode (hari)
              </label>
              <select
                {...register("period", { valueAsNumber: true })}
                className={`w-full rounded-md border ${errors.period ? "border-red-500" : "border-gray-300"} shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
              >
                <option value="7">7 hari terakhir</option>
                <option value="30">30 hari terakhir</option>
                <option value="90">90 hari terakhir</option>
                <option value="180">6 bulan terakhir</option>
                <option value="365">1 tahun terakhir</option>
              </select>
              {errors.period && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.period.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Spinner size="sm" color="white" className="mr-2" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Terapkan Filter
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="mx-6">
        {isDashboardLoading && !dashboardData ? (
          <div className="flex justify-center py-10">
            <Spinner />
            <span className="ml-2 text-gray-600">Memuat data dashboard...</span>
          </div>
        ) : dashboardError ? (
          <div className="bg-red-50 p-4 rounded-lg text-red-600 text-center">
            <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
            <p>{dashboardError?.message || "Terjadi kesalahan saat memuat data"}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 focus:outline-none"
            >
              Coba Lagi
            </button>
          </div>
        ) : (
          <div>
            {/* Top Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
              <StatCard
                title="Total Produk"
                value={dashboardData?.total_products || dashboardData?.summaryData?.totalProduk || 0}
                icon={Package}
                color="blue"
                isLoading={isDashboardLoading}
              />
              <StatCard
                title="Stok Menipis"
                value={lowStockData?.summary?.totalLowStock || lowStockData?.pagination?.totalItems || dashboardData?.summaryData?.stokRendah || 0}
                icon={AlertTriangle}
                color="red"
                isLoading={isLowStockLoading}
              />
              <StatCard
                title="Segera Kadaluarsa"
                value={expiringProductsData?.summary?.totalExpiring || expiringProductsData?.summary?.expiringSoon || 0}
                icon={Clock}
                color="yellow"
                isLoading={isExpiringLoading}
              />
              <StatCard
                title="Nilai Inventori"
                value={formatCurrency(stockValueData?.totalValue || 0)}
                icon={DollarSign}
                color="green"
                isLoading={isStockValueLoading}
              />
            </div>

            

            {/* Nilai Inventori per Kategori - Moved to top */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Nilai Inventori per Kategori</h3>
                    <p className="text-sm text-gray-500">Distribusi nilai inventori berdasarkan kategori produk</p>
                  </div>

                </div>

                {isCategoryValueLoading ? (
                  <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
                ) : !categoryValueData || categoryValueData.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-gray-500">Tidak ada data nilai inventori per kategori</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-center mb-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-3 bg-white rounded-lg shadow-sm border border-emerald-50">
                          <p className="text-xs text-emerald-600 font-medium mb-1">Total Nilai Inventori (Beli)</p>
                          <p className="text-lg sm:text-xl font-bold text-emerald-700">
                            {formatCurrency(categoryValueData.reduce((sum, category) => sum + (parseFloat(category.nilai_inventori_beli) || 0), 0) || 0)}
                          </p>
                        </div>
                        <div className="p-3 bg-white rounded-lg shadow-sm border border-indigo-50">
                          <p className="text-xs text-indigo-600 font-medium mb-1">Total Nilai Inventori (Jual)</p>
                          <p className="text-lg sm:text-xl font-bold text-indigo-700">
                            {formatCurrency(categoryValueData.reduce((sum, category) => sum + (parseFloat(category.nilai_inventori_jual) || 0), 0) || 0)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-emerald-100 bg-white/50 rounded-b-lg">
                        <p className="text-xs text-purple-600 font-medium mb-1 uppercase tracking-wider">Potensi Keuntungan</p>
                        <p className="text-xl sm:text-2xl font-black text-purple-700">
                          {formatCurrency(categoryValueData.reduce((sum, category) => sum + (parseFloat(category.potensi_keuntungan) || 0), 0) || 0)}
                        </p>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-medium text-gray-700">Berdasarkan Kategori</h4>
                        {categoryValueData.length > 3 && (
                          <button 
                            onClick={() => setShowAllCategories(!showAllCategories)}
                            className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center"
                          >
                            {showAllCategories ? 'Sembunyikan' : `Lihat Semua (${categoryValueData.length})`}
                            {showAllCategories ? <ChevronUp size={14} className="ml-1" /> : <ChevronDown size={14} className="ml-1" />}
                          </button>
                        )}
                      </div>
                      <div className="space-y-3">
                        {categoryValueData
                          .slice(0, showAllCategories ? categoryValueData.length : 3)
                          .map((category, index) => {
                          // Calculate total values for percentages
                          const totalBuyValue = categoryValueData.reduce((sum, cat) => sum + (parseFloat(cat.nilai_inventori_beli) || 0), 0);
                          return (
                            <div key={index} className="bg-gray-50 p-4 rounded-lg">
                              <div className="flex justify-between items-center mb-2">
                                <div>
                                  <span className="text-sm font-medium text-gray-900">{category.nama_kategori}</span>
                                  <span className="ml-2 text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">{category.jumlah_produk} produk</span>
                                </div>
                                <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                                  {category.total_stok.toLocaleString()} stok
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                <div className="p-2 bg-white rounded-lg border border-gray-100">
                                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Nilai Beli</p>
                                  <p className="text-sm font-semibold text-emerald-600">{formatCurrency(parseFloat(category.nilai_inventori_beli) || 0)}</p>
                                </div>
                                <div className="p-2 bg-white rounded-lg border border-gray-100">
                                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Nilai Jual</p>
                                  <p className="text-sm font-semibold text-indigo-600">{formatCurrency(parseFloat(category.nilai_inventori_jual) || 0)}</p>
                                </div>
                              </div>
                              
                              <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>Margin: <span className="font-medium text-purple-600">{category.persentase_margin}%</span></span>
                                <span>Proporsi: <span className="font-medium">{category.persentase_nilai_beli}%</span></span>
                              </div>
                              
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-green-500 h-2 rounded-full" 
                                  style={{ width: `${parseFloat(category.persentase_nilai_beli)}%` }}
                                ></div>
                              </div>
                              <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>Potensi untung: {formatCurrency(parseFloat(category.potensi_keuntungan) || 0)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            

            {/* Pergerakan Stok & Kesehatan Inventory - Side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Pergerakan Stok */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Pergerakan Stok</h3>
                  <Link 
                    to="/inventory/movements" 
                    className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
                  >
                    Lihat Detail
                    <ChevronRight size={16} />
                  </Link>
                </div>
                
                {isHighStockMovementsLoading ? (
                  <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
                ) : !highStockMovementsData?.topProducts?.length ? (
                  <div className="py-8 text-center">
                    <p className="text-gray-500">Tidak ada data pergerakan stok</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {highStockMovementsData.topProducts.slice(0, 3).map((product, index) => (
                      <div key={index} className="flex items-center p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900">{product.nama_produk}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                +{product.total_stok_masuk || 0}
                              </span>
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                                -{product.total_stok_keluar || 0}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                            <span>{product.nama_cabang}</span>
                            <span>Stok: {product.stok_saat_ini}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Kesehatan Inventory */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Kesehatan Inventory</h3>
                  <span className="text-sm text-gray-500">Terakhir diperbarui: {new Date().toLocaleDateString('id-ID')}</span>
                </div>
                
                <div className="flex flex-col items-center justify-center py-6">
                  {isHealthScoreLoading ? (
                    <div className="h-40 flex items-center justify-center">
                      <Spinner />
                    </div>
                  ) : (
                    <>
                      <div className="relative w-40 h-40 mb-4">
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                          <circle
                            className="text-gray-200"
                            strokeWidth="10"
                            stroke="currentColor"
                            fill="transparent"
                            r="40"
                            cx="50"
                            cy="50"
                          />
                          <circle
                            className={`${healthScore >= 70 ? 'text-green-500' : healthScore >= 40 ? 'text-yellow-500' : 'text-red-500'}`}
                            strokeWidth="10"
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            strokeDasharray={`${healthScore * 2.51} 251.2`}
                            r="40"
                            cx="50"
                            cy="50"
                            transform="rotate(-90 50 50)"
                          />
                          <text
                            x="50"
                            y="50"
                            textAnchor="middle"
                            dy=".3em"
                            className="text-2xl font-bold"
                          >
                            {healthScore || 0}
                          </text>
                        </svg>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-medium mb-1">
                          {healthScore >= 70 ? 'Sangat Baik' : healthScore >= 40 ? 'Cukup Baik' : 'Perlu Perhatian'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {healthScore >= 70 
                            ? 'Inventori dalam kondisi sangat baik' 
                            : healthScore >= 40 
                              ? 'Ada beberapa hal yang perlu diperhatikan' 
                              : 'Perlu pengecekan segera'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Rekomendasi</h4>
                  <ul className="space-y-2">
                    {healthScore < 40 && (
                      <li className="flex items-start">
                        <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-600">Periksa stok yang hampir habis</span>
                      </li>
                    )}
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-sm text-gray-600">Pantau produk yang akan kadaluarsa</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-sm text-gray-600">Tinjau laporan stok mingguan</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Charts and Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Pergerakan Stok */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Pergerakan Stok</h3>
                <p className="text-sm text-gray-500 mb-4">Tren pergerakan stok dalam periode yang dipilih</p>
                
                {isStockMovementLoading ? (
                  <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-indigo-50 p-4 rounded-lg">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-sm text-gray-500">Total Masuk</p>
                          <p className="text-xl font-bold text-green-600">{stockMovementData?.summary?.totalIncoming || stockMovementData?.stock_in_30d || 0}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Total Keluar</p>
                          <p className="text-xl font-bold text-red-600">{stockMovementData?.summary?.totalOutgoing || stockMovementData?.stock_out_30d || 0}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Perubahan Bersih</p>
                          <p className="text-xl font-bold text-indigo-600">
                            {stockMovementData?.summary?.netChange || (stockMovementData?.stock_in_30d - stockMovementData?.stock_out_30d) || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Tren Pergerakan Harian</h4>
                      <div className="space-y-2">
                        {(stockMovementData?.daily || stockMovementData?.dailyMovements || []).slice(0, 5).map((day, index) => (
                          <div key={index} className="flex items-center p-2 hover:bg-gray-50 rounded-lg">
                            <div className="w-20 text-sm text-gray-600">
                              {new Date(day.date || day.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-green-600 font-medium">
                                  +{day.incoming || day.masuk || 0} Masuk
                                </span>
                                <span className="text-red-600 font-medium">
                                  -{day.outgoing || day.keluar || 0} Keluar
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                <div 
                                  className="bg-indigo-500 h-1.5 rounded-full" 
                                  style={{ 
                                    width: '100%',
                                    background: `linear-gradient(90deg, 
                                      #10B981 ${((day.incoming || 0) / ((day.incoming || 0) + (day.outgoing || 0) || 1)) * 100}%, 
                                      #EF4444 0%)`
                                  }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {(stockMovementData?.daily || stockMovementData?.dailyMovements || []).length > 5 && (
                          <div className="text-center pt-2">
                            <Link 
                              to="/inventory/movements" 
                              className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                            >
                              Lihat Semua Pergerakan →
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Kesehatan Inventory */}
              <div className="space-y-6">
                <InventoryHealthScore score={healthScore} isLoading={isDashboardLoading} />
                
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Produk dengan Pergerakan Tertinggi</h3>
                  <p className="text-sm text-gray-500 mb-4">Produk dengan pergerakan stok tertinggi</p>
                  
                  {isHighStockMovementsLoading ? (
                    <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
                  ) : !highStockMovementsData?.topProducts?.length ? (
                    <div className="py-8 text-center">
                      <p className="text-gray-500">Tidak ada data pergerakan stok</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {highStockMovementsData.topProducts.slice(0, 5).map((product, index) => (
                        <div key={index} className="flex items-center p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-900">{product.nama_produk}</span>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                  +{product.total_stok_masuk || 0}
                                </span>
                                <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                                  -{product.total_stok_keluar || 0}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                              <span>{product.nama_cabang}</span>
                              <span>Stok: {product.stok_saat_ini}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="text-center pt-2">
                        <Link 
                          to="/inventory/movements" 
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                        >
                          Lihat Semua Produk →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Low Stock & Expiring Products */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8">
              <ProductList
                title="Produk dengan Stok Menipis"
                products={(lowStockData?.data || []).map(product => ({
                  id: product.produk_id,
                  name: product.nama_produk,
                  stock: product.stok,
                  status: product.stok_status,
                  branch: product.nama_cabang || product.namaCabang || product.branch
                }))}
                icon={AlertTriangle}
                color="red"
                viewAllLink="/inventory/low-stock"
                isLoading={isLowStockLoading}
              />
              <ProductList
                title="Produk yang Akan Kadaluarsa"
                products={(expiringProductsData || []).map(product => ({
                  id: product.produk_id,
                  name: product.nama_produk,
                  stock: product.stok,
                  expiryDate: product.tanggal_kedaluwarsa,
                  daysUntilExpiry: product.hari_tersisa,
                  status: product.status_kadaluarsa,
                  branch: product.nama_cabang || product.namaCabang || product.branch
                }))}
                icon={Clock}
                color="yellow"
                viewAllLink="/inventory/expiring"
                isLoading={isExpiringLoading}
              />
            </div>

            {/* Inventory Transfers */}
            <TransferList 
              transfers={transferData || transferData?.recentTransfers || []} 
              isLoading={isTransferLoading} 
            />
            
            {/* Inventory Activities */}
            <InventoryActivities 
              activities={activitiesData || []} 
              isLoading={isActivitiesLoading} 
            />
            
            {/* Movement Trends */}
            <MovementTrends 
              data={highStockMovementsData?.movementTrends || []} 
              isLoading={isHighStockMovementsLoading} 
            />
            
            {/* Top Products */}
            <TopProducts 
              data={highStockMovementsData?.topProducts || []} 
              isLoading={isHighStockMovementsLoading} 
            />
          
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryDashboard;
