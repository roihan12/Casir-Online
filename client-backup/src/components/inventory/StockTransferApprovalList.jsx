import React, { useState } from "react";
import {
  Truck,
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  Package,
  Building,
  ArrowRight,
  Clock,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { useStockTransferQueries } from "../../hooks/useStockTransferQueries";
import Spinner from "../common/Spinner";
import Pagination from "../common/Pagination";
import ConfirmationDialog from "../common/ConfirmationDialog";
import { toast } from "react-hot-toast";
import { formatCurrency } from "../../utils/formatters";

const StockTransferApprovalList = ({ cabangId }) => {
  // State for filters and pagination
  const [filters, setFilters] = useState({
    search: "",
    status: "pending", // Default to pending transfers
    sourceCabang: "",
    destinationCabang: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // State for confirmation dialogs
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  
  // Get queries from custom hook
  const {
    usePendingTransfers,
    useApproveTransfer,
    useRejectTransfer,
    useTransferStats
  } = useStockTransferQueries();
  
  // Fetch pending transfers
  const {
    data: transfersData,
    isLoading: isTransfersLoading,
    refetch: refetchTransfers
  } = usePendingTransfers({
    ...filters,
    cabangId: cabangId || "all"
  }, currentPage, pageSize);
  
  // Fetch transfer statistics
  const {
    data: statsData,
    isLoading: isStatsLoading
  } = useTransferStats(cabangId || "all");
  
  // Mutations
  const approveTransferMutation = useApproveTransfer();
  const rejectTransferMutation = useRejectTransfer();
  
  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Apply filters
  const handleApplyFilters = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    refetchTransfers();
  };
  
  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      search: "",
      status: "pending",
      sourceCabang: "",
      destinationCabang: "",
    });
    setCurrentPage(1);
    refetchTransfers();
  };
  
  // Open approve dialog
  const openApproveDialog = (transfer) => {
    setSelectedTransfer(transfer);
    setShowApproveDialog(true);
  };
  
  // Open reject dialog
  const openRejectDialog = (transfer) => {
    setSelectedTransfer(transfer);
    setShowRejectDialog(true);
  };
  
  // Handle approve confirmation
  const handleApproveConfirm = () => {
    if (!selectedTransfer) return;
    
    approveTransferMutation.mutate(selectedTransfer.id, {
      onSuccess: () => {
        setShowApproveDialog(false);
        setSelectedTransfer(null);
        refetchTransfers();
        toast.success("Transfer berhasil disetujui");
      },
      onError: (error) => {
        toast.error(error.message || "Gagal menyetujui transfer");
      }
    });
  };
  
  // Handle reject confirmation
  const handleRejectConfirm = () => {
    if (!selectedTransfer) return;
    
    rejectTransferMutation.mutate(selectedTransfer.id, {
      onSuccess: () => {
        setShowRejectDialog(false);
        setSelectedTransfer(null);
        refetchTransfers();
        toast.success("Transfer berhasil ditolak");
      },
      onError: (error) => {
        toast.error(error.message || "Gagal menolak transfer");
      }
    });
  };
  
  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };
  
  // Get status badge
  const getStatusBadge = (status) => {
    const statuses = {
      pending: {
        label: "Menunggu Persetujuan",
        bgColor: "bg-yellow-100",
        textColor: "text-yellow-800",
        icon: <Clock className="h-4 w-4 text-yellow-500 mr-1" />,
      },
      approved: {
        label: "Disetujui",
        bgColor: "bg-green-100",
        textColor: "text-green-800",
        icon: <CheckCircle className="h-4 w-4 text-green-500 mr-1" />,
      },
      rejected: {
        label: "Ditolak",
        bgColor: "bg-red-100",
        textColor: "text-red-800",
        icon: <XCircle className="h-4 w-4 text-red-500 mr-1" />,
      },
      completed: {
        label: "Selesai",
        bgColor: "bg-blue-100",
        textColor: "text-blue-800",
        icon: <Truck className="h-4 w-4 text-blue-500 mr-1" />,
      },
      default: {
        label: "Status Tidak Diketahui",
        bgColor: "bg-gray-100",
        textColor: "text-gray-800",
        icon: <AlertTriangle className="h-4 w-4 text-gray-500 mr-1" />,
      },
    };
    
    return statuses[status] || statuses.default;
  };
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="bg-indigo-600 text-white px-6 py-4">
        <h2 className="text-lg font-medium flex items-center">
          <Truck className="h-5 w-5 mr-2" />
          Persetujuan Transfer Stok
        </h2>
        <p className="text-indigo-100 text-sm mt-1">
          Kelola dan setujui permintaan transfer stok antar cabang
        </p>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border-b">
        <div className="bg-indigo-50 rounded-lg p-3 flex items-center">
          <div className="bg-indigo-100 p-2 rounded-lg mr-3">
            <Clock className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Menunggu Persetujuan</p>
            <p className="text-lg font-semibold">{statsData?.pendingTransfers || 0}</p>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-3 flex items-center">
          <div className="bg-green-100 p-2 rounded-lg mr-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Disetujui Hari Ini</p>
            <p className="text-lg font-semibold">{statsData?.approvedToday || 0}</p>
          </div>
        </div>
        
        <div className="bg-red-50 rounded-lg p-3 flex items-center">
          <div className="bg-red-100 p-2 rounded-lg mr-3">
            <XCircle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Ditolak Hari Ini</p>
            <p className="text-lg font-semibold">{statsData?.rejectedToday || 0}</p>
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-3 flex items-center">
          <div className="bg-blue-100 p-2 rounded-lg mr-3">
            <Package className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Item Ditransfer</p>
            <p className="text-lg font-semibold">{statsData?.totalItemsTransferred || 0}</p>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="p-4 border-b">
        <div className="flex items-center mb-3">
          <Filter className="h-4 w-4 text-gray-500 mr-2" />
          <h3 className="text-sm font-medium text-gray-700">Filter Transfer</h3>
        </div>
        
        <form onSubmit={handleApplyFilters} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label htmlFor="search" className="block text-xs font-medium text-gray-700 mb-1">
              Pencarian
            </label>
            <div className="relative">
              <input
                type="text"
                id="search"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Cari kode transfer..."
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 pl-8 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
          
          <div>
            <label htmlFor="status" className="block text-xs font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="pending">Menunggu Persetujuan</option>
              <option value="approved">Disetujui</option>
              <option value="rejected">Ditolak</option>
              <option value="completed">Selesai</option>
              <option value="">Semua Status</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="sourceCabang" className="block text-xs font-medium text-gray-700 mb-1">
              Cabang Asal
            </label>
            <select
              id="sourceCabang"
              name="sourceCabang"
              value={filters.sourceCabang}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Semua Cabang</option>
              {/* Cabang options would be populated from API */}
            </select>
          </div>
          
          <div>
            <label htmlFor="destinationCabang" className="block text-xs font-medium text-gray-700 mb-1">
              Cabang Tujuan
            </label>
            <select
              id="destinationCabang"
              name="destinationCabang"
              value={filters.destinationCabang}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Semua Cabang</option>
              {/* Cabang options would be populated from API */}
            </select>
          </div>
          
          <div className="md:col-span-4 flex justify-end space-x-2 mt-2">
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Reset
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center"
            >
              <Filter className="h-3.5 w-3.5 mr-1" />
              Terapkan Filter
            </button>
            <button
              type="button"
              onClick={refetchTransfers}
              className="px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Refresh
            </button>
          </div>
        </form>
      </div>
      
      {/* Transfers List */}
      {isTransfersLoading ? (
        <div className="flex justify-center items-center p-12">
          <Spinner />
        </div>
      ) : transfersData?.data?.length === 0 ? (
        <div className="text-center py-12">
          <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Transfer</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Tidak ada permintaan transfer stok yang ditemukan dengan filter yang dipilih.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kode Transfer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cabang
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jumlah Item
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nilai Total
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transfersData?.data?.map((transfer) => {
                const statusBadge = getStatusBadge(transfer.status);
                
                return (
                  <tr key={transfer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {transfer.transferCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex flex-col">
                        <div className="flex items-center">
                          <Building className="h-3.5 w-3.5 text-gray-400 mr-1" />
                          <span>{transfer.sourceCabang}</span>
                        </div>
                        <div className="flex items-center mt-1">
                          <ArrowRight className="h-3.5 w-3.5 text-indigo-400 mr-1" />
                          <span>{transfer.destinationCabang}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-3.5 w-3.5 text-gray-400 mr-1.5" />
                        {formatDate(transfer.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Package className="h-3.5 w-3.5 text-gray-400 mr-1.5" />
                        {transfer.totalItems} item
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {formatCurrency(transfer.totalValue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.bgColor} ${statusBadge.textColor}`}>
                        {statusBadge.icon}
                        {statusBadge.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => window.open(`/superadmin/inventory/transfer/${transfer.id}`, '_blank')}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Lihat Detail"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {transfer.status === "pending" && (
                          <>
                            <button
                              onClick={() => openApproveDialog(transfer)}
                              className="text-green-600 hover:text-green-900"
                              title="Setujui Transfer"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            
                            <button
                              onClick={() => openRejectDialog(transfer)}
                              className="text-red-600 hover:text-red-900"
                              title="Tolak Transfer"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Pagination */}
      {transfersData?.data?.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200">
          <Pagination
            currentPage={currentPage}
            totalPages={transfersData?.pagination?.totalPages || 1}
            onPageChange={setCurrentPage}
            totalItems={transfersData?.pagination?.totalItems || 0}
            itemsPerPage={pageSize}
            onItemsPerPageChange={setPageSize}
          />
        </div>
      )}
      
      {/* Approve Confirmation Dialog */}
      {showApproveDialog && selectedTransfer && (
        <ConfirmationDialog
          title="Setujui Transfer Stok"
          message={`Apakah Anda yakin ingin menyetujui transfer stok dengan kode ${selectedTransfer.transferCode}? Tindakan ini akan memindahkan stok dari ${selectedTransfer.sourceCabang} ke ${selectedTransfer.destinationCabang}.`}
          confirmLabel="Setujui"
          cancelLabel="Batal"
          isOpen={showApproveDialog}
          isLoading={approveTransferMutation.isPending}
          onConfirm={handleApproveConfirm}
          onCancel={() => setShowApproveDialog(false)}
          type="success"
        />
      )}
      
      {/* Reject Confirmation Dialog */}
      {showRejectDialog && selectedTransfer && (
        <ConfirmationDialog
          title="Tolak Transfer Stok"
          message={`Apakah Anda yakin ingin menolak transfer stok dengan kode ${selectedTransfer.transferCode}? Tindakan ini akan membatalkan permintaan transfer.`}
          confirmLabel="Tolak"
          cancelLabel="Batal"
          isOpen={showRejectDialog}
          isLoading={rejectTransferMutation.isPending}
          onConfirm={handleRejectConfirm}
          onCancel={() => setShowRejectDialog(false)}
          type="danger"
        />
      )}
    </div>
  );
};

export default StockTransferApprovalList;
