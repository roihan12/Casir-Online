import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  ChevronDown,
  RefreshCw,
  Filter,
  Trash2,
  Eye,
  BarChart2,
  Package,
  ShoppingBag,
  Truck,
  Check,
  Search,
} from "lucide-react";

import GlobalStatsCard from "../../common/components/GlobalStatsCard";
import Spinner from "../../../features/common/Spinner";
import Pagination from "../../../features/common/Pagination";
import ConfirmationDialog from "../../../features/common/ConfirmationDialog";
import withCabangData from "../../../features/cabang/hoc/withCabangData";
import { useCabang } from "../../../features/cabang/hooks/useCabang";
import { useInventoryNotifications } from "../hooks/useInventoryNotifications";
import { toast } from "react-hot-toast";

const InventoryNotifications = () => {
  const navigate = useNavigate();
  const { selectedCabang, cabangList } = useCabang();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Filter and pagination states
  const [filters, setFilters] = useState({
    type: "",
    status: "",
    priority: "",
    search: "",
    cabangId: selectedCabang?.id  === 'global'? '' : selectedCabang?.id,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // React Query hooks
  const {
    useNotifications,
    useNotificationStats,
    useMarkAsRead,
    useMarkAllAsRead,
    useDeleteNotification,
    useNotificationDetails
  } = useInventoryNotifications();
  
  // Fetch notifications with filters
  const {
    data: notificationsData,
    isLoading: isNotificationsLoading,
    refetch: refetchNotifications
  } = useNotifications(
    filters,
    currentPage,
    pageSize
  );
  
  // Fetch notification statistics
  const {
    data: statsData,
    isLoading: isStatsLoading
  } = useNotificationStats(filters.cabangId);
  
  // Fetch notification details
  const {
    data: notificationDetails,
    isLoading: isDetailsLoading
  } = useNotificationDetails(selectedNotification?.id, {
    enabled: !!selectedNotification && showDetailModal
  });
  
  // Mutations
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();
  const deleteNotificationMutation = useDeleteNotification();

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    
    // If cabang is changed, update stats immediately
    if (name === 'cabangId') {
      refetchNotifications();
    }
  };

  // Apply filters
  const handleApplyFilters = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    refetchNotifications();
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      type: "",
      status: "",
      priority: "",
      search: "",
      cabangId: selectedCabang?.id || "all",
    });
    setCurrentPage(1);
    refetchNotifications();
  };

  // Handle notification marking as read
  const handleMarkAsRead = (notificationId) => {
    markAsReadMutation.mutate(notificationId, {
      onSuccess: () => {
        refetchNotifications();
        toast.success("Notifikasi ditandai sebagai telah dibaca");
      }
    });
  };

  // Handle mark all as read
  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate(selectedCabang?.id || "all", {
      onSuccess: () => {
        refetchNotifications();
        toast.success("Semua notifikasi ditandai sebagai telah dibaca");
      }
    });
  };

  // Handle notification deletion
  const handleDeleteConfirm = () => {
    if (!selectedNotification) return;

    deleteNotificationMutation.mutate(selectedNotification.id, {
      onSuccess: () => {
        setShowDeleteModal(false);
        setSelectedNotification(null);
        refetchNotifications();
      }
    });
  };

  // Open delete confirmation modal
  const openDeleteModal = (notification) => {
    setSelectedNotification(notification);
    setShowDeleteModal(true);
  };

  // Open notification detail modal
  const openDetailModal = (notification) => {
    setSelectedNotification(notification);
    setShowDetailModal(true);
    
    // Mark as read if unread
    if (notification.status === "unread") {
      handleMarkAsRead(notification.id);
    }
  };

  // Handle view product details
  const handleViewProduct = (productId) => {
    navigate(`/superadmin/inventory?product=${productId}`);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get notification type details
  const getNotificationTypeDetails = (type) => {
    const types = {
      LOW_STOCK: {
        label: "LOW_STOCK",
        icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
        bgColor: "bg-yellow-50",
        textColor: "text-yellow-700",
      },
      STOCK_OUT: {
        label: "STOCK_OUT",
        icon: <AlertCircle className="h-4 w-4 text-red-500" />,
        bgColor: "bg-red-50",
        textColor: "text-red-700",
      },
      EXPIRING_STOCK: {
        label: "EXPIRING_STOCK",
        icon: <Calendar className="h-4 w-4 text-orange-500" />,
        bgColor: "bg-orange-50",
        textColor: "text-orange-700",
      },
      TRANSFER_COMPLETE: {
        label: "TRANSFER_COMPLETE",
        icon: <Truck className="h-4 w-4 text-green-500" />,
        bgColor: "bg-green-50",
        textColor: "text-green-700",
      },
      ADJUSTMENT: {
        label: "ADJUSTMENT",
        icon: <Package className="h-4 w-4 text-blue-500" />,
        bgColor: "bg-blue-50",
        textColor: "text-blue-700",
      },
      default: {
        label: "Notifikasi",
        icon: <Bell className="h-4 w-4 text-gray-500" />,
        bgColor: "bg-gray-50",
        textColor: "text-gray-700",
      },
    };



    return types[type] || types.default;
  };

  // Get priority badge
  const getPriorityBadge = (priority) => {
    const priorities = {
      LOW_STOCK: {
        label: "Kritis",
        bgColor: "bg-red-100",
        textColor: "text-red-800",
      },
      EXPIRING_STOCK: {
        label: "Tinggi",
        bgColor: "bg-orange-100",
        textColor: "text-orange-800",
      },
      MEDIUM_STOCK: {
        label: "Sedang",
        bgColor: "bg-yellow-100",
        textColor: "text-yellow-800",
      },
      HIGH_STOCK: {
        label: "Rendah",
        bgColor: "bg-green-100",
        textColor: "text-green-800",
      },
      default: {
        label: "Normal",
        bgColor: "bg-gray-100",
        textColor: "text-gray-800",
      },
    };

    return priorities[priority] || priorities.default;
  };

  return (
    <div className="pb-6">
      {/* Page Header */}
      <div className="flex flex-col items-center justify-center bg-indigo-600 text-white py-8 mb-6">
        <h1 className="text-2xl font-bold mb-2">Notifikasi Inventori</h1>
        <div className="flex items-center">
          <Bell size={24} className="mr-2" />
          <span>Pantau dan kelola notifikasi terkait inventori</span>
        </div>
      </div>

      <div className="mx-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Total Notifikasi</h3>
              <Bell className="h-8 w-8 text-white opacity-80" />
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-bold mb-1">{statsData?.data?.totalNotifications || 0}</span>
              <div className="flex items-center text-purple-100">
                <span className="text-sm">Semua notifikasi sistem</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Belum Dibaca</h3>
              <AlertCircle className="h-8 w-8 text-white opacity-80" />
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-bold mb-1">{statsData?.data?.unreadNotifications || 0}</span>
              <div className="flex items-center text-red-100">
                <span className="text-sm">Tingkat baca: {statsData?.data?.readRate || 0}%</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Stok Rendah</h3>
              <AlertTriangle className="h-8 w-8 text-white opacity-80" />
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-bold mb-1">{statsData?.data?.byType?.LOW_STOCK || 0}</span>
              <div className="flex items-center text-amber-100">
                <span className="text-sm">Produk dengan stok rendah</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Kedaluwarsa Segera</h3>
              <Calendar className="h-8 w-8 text-white opacity-80" />
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-bold mb-1">{statsData?.data?.byType?.EXPIRING_STOCK || 0}</span>
              <div className="flex items-center text-emerald-100">
                <span className="text-sm">Produk mendekati kedaluwarsa</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Branch Distribution Cards */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center mb-4">
            <Truck className="h-5 w-5 text-gray-600 mr-2" />
            <h3 className="font-medium text-gray-800 text-lg">Distribusi Notifikasi per Cabang</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(statsData?.data?.byBranch || {}).map(([branch, count]) => (
              <div key={branch} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                <div className="flex flex-col">
                  <span className="text-sm text-gray-600 mb-1 truncate">{branch}</span>
                  <span className="text-2xl font-semibold text-indigo-700">{count}</span>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full" 
                      style={{ width: `${Math.min(100, (count / (statsData?.data?.totalNotifications || 1)) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center mb-4">
            <Filter className="h-5 w-5 text-gray-500 mr-2" />
            <h3 className="font-medium text-gray-700">Filter Notifikasi</h3>
          </div>

          <form onSubmit={handleApplyFilters} className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <div>
              <label htmlFor="cabangId" className="block text-sm font-medium text-gray-700 mb-1">
                Cabang
              </label>
              <select
                id="cabangId"
                name="cabangId"
                value={filters.cabangId}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">Semua Cabang</option>
                {cabangList?.map((cabang) => (
                  <option key={cabang.id} value={cabang.id}>
                    {cabang.namaCabang}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                Tipe Notifikasi
              </label>
              <select
                id="type"
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Semua Tipe</option>
                <option value="LOW_STOCK">Stok Rendah</option>
                <option value="STOCK_OUT">Stok Habis</option>
                <option value="EXPIRING_STOCK">Kedaluwarsa Segera</option>
                <option value="TRANSFER_COMPLETE">Transfer Selesai</option>
                <option value="ADJUSTMENT">Penyesuaian Stok</option>
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Semua Status</option>
                <option value="unread">Belum Dibaca</option>
                <option value="read">Sudah Dibaca</option>
              </select>
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                Prioritas
              </label>
              <select
                id="priority"
                name="priority"
                value={filters.priority}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Semua Prioritas</option>
                <option value="critical">Kritis</option>
                <option value="high">Tinggi</option>
                <option value="medium">Sedang</option>
                <option value="low">Rendah</option>
              </select>
            </div>

            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Pencarian
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="search"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Cari notifikasi..."
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2 pl-10 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="md:col-span-4 flex justify-end space-x-3 mt-4">
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Reset
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Terapkan Filter
              </button>
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center"
                disabled={markAllAsReadMutation.isPending}
              >
                {markAllAsReadMutation.isPending ? (
                  <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Tandai Semua Dibaca
              </button>
            </div>
          </form>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isNotificationsLoading ? (
            <div className="flex justify-center items-center p-12">
              <Spinner />
            </div>
          ) : notificationsData?.data?.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Notifikasi</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Tidak ada notifikasi yang ditemukan dengan filter yang dipilih.
              </p>
            </div>
          ) : (
            <div>
              <ul className="divide-y divide-gray-200">
                {notificationsData?.data?.map((notification) => {
                  const typeDetails = getNotificationTypeDetails(notification.type);
                  const priorityBadge = getPriorityBadge(notification.type);
                  
                  return (
                    <li 
                      key={notification.id} 
                      className={`p-4 hover:bg-gray-50 ${notification.status === 'unread' ? 'bg-blue-50' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center mb-1">
                            <div className={`p-1 rounded-md ${typeDetails.bgColor} mr-2`}>
                              {typeDetails.icon}
                            </div>
                            <h4 className="text-sm font-medium text-gray-900 truncate flex items-center">
                              {notification.title}
                              {notification.isRead === false && (
                                <span className="ml-2 h-2 w-2 rounded-full bg-blue-600"></span>
                              )}
                            </h4>
                          </div>
                          <p className="text-sm text-gray-500 mb-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDate(notification.createdAt)}
                            <span className="mx-2">•</span>
                            <span className="font-medium">{notification.cabang.namaCabang}</span>
                            <span className="mx-2">•</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${priorityBadge.bgColor} ${priorityBadge.textColor}`}>
                              {priorityBadge.label}
                            </span>
                          </div>
                        </div>
                        <div className="flex-shrink-0 flex space-x-2">
                          <button
                            onClick={() => openDetailModal(notification)}
                            className="text-gray-400 hover:text-gray-500 p-1"
                            title="Lihat Detail"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          {notification.isRead === false && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="text-blue-400 hover:text-blue-500 p-1"
                              title="Tandai Dibaca"
                              disabled={markAsReadMutation.isPending}
                            >
                              <Check className="h-5 w-5" />
                            </button>
                          )}
                          <button
                            onClick={() => openDeleteModal(notification)}
                            className="text-red-400 hover:text-red-500 p-1"
                            title="Hapus Notifikasi"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
              
              {/* Pagination */}
              <div className="px-4 py-3 border-t border-gray-200">
                <Pagination
                  currentPage={currentPage}
                  totalPages={notificationsData?.pagination?.totalPages || 1}
                  onPageChange={setCurrentPage}
                  totalItems={notificationsData?.pagination?.totalItems || 0}
                  itemsPerPage={pageSize}
                  onItemsPerPageChange={setPageSize}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <ConfirmationDialog
          title="Hapus Notifikasi"
          message="Apakah Anda yakin ingin menghapus notifikasi ini? Tindakan ini tidak dapat dibatalkan."
          confirmLabel="Hapus"
          cancelLabel="Batal"
          isOpen={showDeleteModal}
          isLoading={deleteNotificationMutation.isPending}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteModal(false)}
          type="danger"
        />
      )}

      {/* Notification Detail Modal */}
      {showDetailModal && selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="flex justify-between items-center border-b px-6 py-4">
              <h3 className="text-lg font-medium">Detail Notifikasi</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              {isDetailsLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : (
                <div>
                  <div className="mb-6">
                    <h4 className="text-lg font-medium mb-2">{selectedNotification.title}</h4>
                    <div className="flex items-center space-x-3 mb-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${getNotificationTypeDetails(selectedNotification.type).bgColor} ${getNotificationTypeDetails(selectedNotification.type).textColor}`}>
                        {getNotificationTypeDetails(selectedNotification.type).label}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${getPriorityBadge(selectedNotification.priority).bgColor} ${getPriorityBadge(selectedNotification.priority).textColor}`}>
                        {getPriorityBadge(selectedNotification.priority).label}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDate(selectedNotification.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-line">{selectedNotification.message}</p>
                  </div>
                  
                  {selectedNotification.productId && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <h5 className="font-medium mb-2">Informasi Produk</h5>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Nama Produk</p>
                          <p className="font-medium">{selectedNotification.productName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">ID Produk</p>
                          <p className="font-medium">{selectedNotification.productId}</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <button
                          onClick={() => handleViewProduct(selectedNotification.productId)}
                          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Lihat Detail Produk
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      onClick={() => setShowDetailModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Tutup
                    </button>
                    {selectedNotification.status === "unread" && (
                      <button
                        onClick={() => {
                          handleMarkAsRead(selectedNotification.id);
                          setShowDetailModal(false);
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 flex items-center"
                        disabled={markAsReadMutation.isPending}
                      >
                        {markAsReadMutation.isPending ? (
                          <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                        ) : (
                          <Check className="h-4 w-4 mr-2" />
                        )}
                        Tandai Dibaca
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryNotifications;
            
