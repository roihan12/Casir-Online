import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  X,
  Eye,
  Clock,
  AlertTriangle,
  FileText,
  ChevronDown,
  Filter,
  RefreshCw,
  Calendar,
  Search,
  Building,
  ArrowUpDown,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useStockTransferQueries } from "../hooks/useStockTransferQueries";
import Spinner from "../../common/Spinner";
import Pagination from "../../common/Pagination";
import ConfirmationDialog from "../../common/ConfirmationDialog";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import { useCabangList } from "../../cabang/hooks/useCabangQueries";

const StockTransferApprovalList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [transfers, setTransfers] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });
  const [filters, setFilters] = useState({
    nomorTransfer: "",
    cabangId: "",
    status: "pending_approval",
    startDate: null,
    endDate: null,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [bulkAction, setBulkAction] = useState("");
  const [selectedTransfers, setSelectedTransfers] = useState([]);
  const [showBulkApproveDialog, setShowBulkApproveDialog] = useState(false);
  const [showBulkRejectDialog, setShowBulkRejectDialog] = useState(false);
  const [bulkRejectReason, setBulkRejectReason] = useState("");
  
  // Menggunakan React Query hooks
  const { 
    usePendingTransfers, 
    useApproveTransfer, 
    useRejectTransfer 
  } = useStockTransferQueries();

  // Query untuk mendapatkan daftar transfer dengan filter status
  const {
    data: transfersData,
    isLoading: isLoadingTransfers,
    refetch: refetchTransfers
  } = usePendingTransfers(
    {
      nomorTransfer: filters.nomorTransfer,
      cabangAsalId: filters.cabangId,
      status: filters.status,
      startDate: filters.startDate ? format(filters.startDate, 'yyyy-MM-dd') : undefined,
      endDate: filters.endDate ? format(filters.endDate, 'yyyy-MM-dd') : undefined,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder
    },
    pagination.currentPage,
    pagination.itemsPerPage
  );

  // Mutation untuk menyetujui transfer
  const { mutate: approveTransfer } = useApproveTransfer();
  
  // Mutation untuk menolak transfer
  const { mutate: rejectTransfer } = useRejectTransfer();

  // Update data transfers ketika data query berubah
  useEffect(() => {
    if (transfersData) {
      setTransfers(transfersData.data || []);
      setPagination(transfersData.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10,
      });
      setSelectedTransfers([]);
      setLoading(false);
    }
  }, [transfersData]);

  const { data: branchesData } = useCabangList();
  
  // Fungsi untuk memperbarui data transfer
  const fetchTransfers = () => {
    refetchTransfers();
  };

  const handlePageChange = (page) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const handleFilterChange = (e) => {
    const newFilters = { ...filters, [e.target.name]: e.target.value };
    setFilters(newFilters);
    
    // Jika status berubah, langsung terapkan filter
    if (e.target.name === 'status') {
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
      setLoading(true); // Set loading state
      setTimeout(() => fetchTransfers(), 0);
    }
  };

  const handleDateFilterChange = (field, date) => {
    setFilters({ ...filters, [field]: date });
  };

  const handleSortChange = (field) => {
    setFilters(prev => {
      if (prev.sortBy === field) {
        // Mengubah urutan sortir jika mengklik field yang sama
        return { ...prev, sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' };
      }
      // Mengatur field sortir baru dengan urutan desc default
      return { ...prev, sortBy: field, sortOrder: 'desc' };
    });
  };

  const handleApplyFilters = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    setLoading(true); // Set loading state
    fetchTransfers();
  };

  const handleResetFilters = () => {
    setFilters({
      nomorTransfer: "",
      cabangId: "",
      status: "pending_approval",
      startDate: null,
      endDate: null,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    fetchTransfers();
  };

  const openTransferDetail = (id) => {
    navigate(`/admin/stock-transfers/${id}`);
  };

  const openApproveDialog = (transfer) => {
    setSelectedTransfer(transfer);
    setShowApproveDialog(true);
  };

  const openRejectDialog = (transfer) => {
    setSelectedTransfer(transfer);
    setShowRejectDialog(true);
  };

  const handleApproveTransfer = () => {
    approveTransfer(
      { id: selectedTransfer.id, data: {} },
      {
        onSuccess: () => {
          setShowApproveDialog(false);
          toast.success(
            `Transfer ${selectedTransfer.nomorTransfer} berhasil disetujui`
          );
        }
      }
    );
  };

  const handleRejectTransfer = () => {
    if (!rejectReason.trim()) {
      toast.error("Alasan penolakan wajib diisi");
      return;
    }

    rejectTransfer(
      { 
        id: selectedTransfer.id, 
        data: { alasanReject: rejectReason } 
      },
      {
        onSuccess: () => {
          setShowRejectDialog(false);
          setRejectReason("");
          toast.success(`Transfer ${selectedTransfer.nomorTransfer} berhasil ditolak`);
        }
      }
    );
  };

  const handleSelectTransfer = (transferId) => {
    setSelectedTransfers(prev => {
      if (prev.includes(transferId)) {
        return prev.filter(id => id !== transferId);
      } else {
        return [...prev, transferId];
      }
    });
  };

  const handleSelectAllTransfers = () => {
    if (selectedTransfers.length === transfers.length) {
      // Batalkan semua pilihan jika semua sudah dipilih
      setSelectedTransfers([]);
    } else {
      // Pilih semua
      setSelectedTransfers(transfers.map(transfer => transfer.id));
    }
  };

  const openBulkApproveDialog = () => {
    if (selectedTransfers.length === 0) {
      toast.error("Pilih minimal satu transfer untuk disetujui");
      return;
    }
    setShowBulkApproveDialog(true);
  };

  const openBulkRejectDialog = () => {
    if (selectedTransfers.length === 0) {
      toast.error("Pilih minimal satu transfer untuk ditolak");
      return;
    }
    setShowBulkRejectDialog(true);
  };

  const handleBulkApproveTransfers = () => {
    // Membuat array promises untuk setiap persetujuan
    const processApprovals = async () => {
      try {
        const approvalPromises = selectedTransfers.map(transferId => 
          approveTransfer({ id: transferId, data: {} }, { throwOnError: true })
        );
        
        // Menjalankan semua persetujuan secara paralel
        await Promise.all(approvalPromises);
        
        setShowBulkApproveDialog(false);
        toast.success(`${selectedTransfers.length} transfer berhasil disetujui`);
        fetchTransfers();
      } catch (error) {
        toast.error(error.message || "Gagal menyetujui transfer");
      }
    };
    
    processApprovals();
  };

  const handleBulkRejectTransfers = () => {
    if (!bulkRejectReason.trim()) {
      toast.error("Alasan penolakan wajib diisi");
      return;
    }

    // Membuat array promises untuk setiap penolakan
    const processRejections = async () => {
      try {
        const rejectionPromises = selectedTransfers.map(transferId => 
          rejectTransfer(
            { 
              id: transferId, 
              data: { alasanReject: bulkRejectReason } 
            }, 
            { throwOnError: true }
          )
        );
        
        // Menjalankan semua penolakan secara paralel
        await Promise.all(rejectionPromises);
        
        setShowBulkRejectDialog(false);
        setBulkRejectReason("");
        toast.success(`${selectedTransfers.length} transfer berhasil ditolak`);
        fetchTransfers();
      } catch (error) {
        toast.error(error.message || "Gagal menolak transfer");
      }
    };
    
    processRejections();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };
  
  // Fungsi untuk menampilkan status dengan badge berwarna
  const renderStatusBadge = (status) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      pending_approval: { color: 'bg-yellow-100 text-yellow-800', label: 'Menunggu Persetujuan' },
      approved: { color: 'bg-green-100 text-green-800', label: 'Disetujui' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Ditolak' },
      dikirim: { color: 'bg-blue-100 text-blue-800', label: 'Dikirim' },
      diterima: { color: 'bg-indigo-100 text-indigo-800', label: 'Diterima' },
      dibatalkan: { color: 'bg-gray-100 text-gray-800', label: 'Dibatalkan' }
    };
    
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    
    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  // if ((loading || isLoadingTransfers) && transfers.length === 0) {
  //   return <Spinner />;
  // }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          Transfer Stok yang Memerlukan Persetujuan
        </h2>
        <p className="text-gray-600">
          Tinjau dan kelola permintaan transfer stok yang tertunda.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <Filter className="h-4 w-4 text-gray-500 mr-2" />
            <h3 className="font-medium text-gray-700">Filter</h3>
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-sm text-gray-500 flex items-center hover:text-gray-700"
          >
            <RefreshCw className="h-3 w-3 mr-1" /> Reset
          </button>
        </div>
        <form onSubmit={handleApplyFilters} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Transfer Number */}
          <div>
            <label
              htmlFor="nomorTransfer"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              <Search className="h-3 w-3 inline mr-1" /> Nomor Transfer
            </label>
            <input
              type="text"
              id="nomorTransfer"
              name="nomorTransfer"
              value={filters.nomorTransfer}
              onChange={handleFilterChange}
              placeholder="Cari berdasarkan nomor transfer"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Branch Filter */}
          <div>
            <label
              htmlFor="cabangId"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              <Building className="h-3 w-3 inline mr-1" /> Cabang
            </label>
            <select
              id="cabangId"
              name="cabangId"
              value={filters.cabangId}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Semua Cabang</option>
              {branchesData?.data?.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.namaCabang}
                </option>
              ))}
            </select>
          </div>
          
          {/* Status Filter */}
          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              <Clock className="h-3 w-3 inline mr-1" /> Status
            </label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="pending_approval">Menunggu Persetujuan</option>
              <option value="approved">Disetujui</option>
              <option value="rejected">Ditolak</option>
              <option value="dikirim">Dikirim</option>
              <option value="diterima">Diterima</option>
              <option value="dibatalkan">Dibatalkan</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label
              htmlFor="startDate"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              <Calendar className="h-3 w-3 inline mr-1" /> Tanggal Mulai
            </label>
            <DatePicker
              id="startDate"
              selected={filters.startDate}
              onChange={(date) => handleDateFilterChange('startDate', date)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholderText="Pilih tanggal mulai"
              dateFormat="dd/MM/yyyy"
              isClearable
            />
          </div>

          {/* End Date */}
          <div>
            <label
              htmlFor="endDate"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              <Calendar className="h-3 w-3 inline mr-1" /> Tanggal Akhir
            </label>
            <DatePicker
              id="endDate"
              selected={filters.endDate}
              onChange={(date) => handleDateFilterChange('endDate', date)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholderText="Pilih tanggal akhir"
              dateFormat="dd/MM/yyyy"
              isClearable
              minDate={filters.startDate}
            />
          </div>

          {/* Submit Button */}
          <div className="flex items-end">
            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full"
            >
              Terapkan Filter
            </button>
          </div>
        </form>
      </div>

      {/* Bulk Actions */}
      {transfers.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2 items-center justify-between">
          <div className="text-sm text-gray-600">
            {selectedTransfers.length > 0 ? (
              <span className="font-medium">{selectedTransfers.length} transfer dipilih</span>
            ) : (
              <span>Pilih transfer untuk aksi massal</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={openBulkApproveDialog}
              disabled={selectedTransfers.length === 0}
              className={`flex items-center px-3 py-1.5 text-sm rounded-md ${selectedTransfers.length > 0 ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
            >
              <Check className="h-4 w-4 mr-1" /> Setujui yang Dipilih
            </button>
            <button
              type="button"
              onClick={openBulkRejectDialog}
              disabled={selectedTransfers.length === 0}
              className={`flex items-center px-3 py-1.5 text-sm rounded-md ${selectedTransfers.length > 0 ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
            >
              <X className="h-4 w-4 mr-1" /> Tolak yang Dipilih
            </button>
          </div>
        </div>
      )}

      {/* Transfers Table */}
      <div className="overflow-x-auto mt-4">
        {isLoadingTransfers || loading ? (
          <div className="text-center py-8">
            <Spinner />
            <p className="mt-4 text-gray-500">Memuat data transfer...</p>
          </div>
        ) : transfers.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              Tidak ada transfer ditemukan
            </h3>
            <p className="mt-2 text-gray-500">
              Tidak ada transfer dengan filter yang dipilih.
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      checked={selectedTransfers.length === transfers.length && transfers.length > 0}
                      onChange={handleSelectAllTransfers}
                      title="Select all transfers"
                    />
                  </div>
                </th>
                <th 
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange('nomorTransfer')}
                >
                  <div className="flex items-center">
                    Nomor Transfer
                    {filters.sortBy === 'nomorTransfer' && (
                      <ArrowUpDown className="h-3 w-3 ml-1" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange('cabangId')}
                >
                  <div className="flex items-center">
                    Cabang
                    {filters.sortBy === 'cabangId' && (
                      <ArrowUpDown className="h-3 w-3 ml-1" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange('status')}
                >
                  <div className="flex items-center">
                    Status
                    {filters.sortBy === 'status' && (
                      <ArrowUpDown className="h-3 w-3 ml-1" />
                    )}
                  </div>
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Diminta Oleh
                </th>
                <th 
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange('createdAt')}
                >
                  <div className="flex items-center">
                    Tanggal
                    {filters.sortBy === 'createdAt' && (
                      <ArrowUpDown className="h-3 w-3 ml-1" />
                    )}
                  </div>
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transfers.map((transfer) => (
                <tr key={transfer.id} className={selectedTransfers.includes(transfer.id) ? 'bg-indigo-50' : ''}>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        checked={selectedTransfers.includes(transfer.id)}
                        onChange={() => handleSelectTransfer(transfer.id)}
                      />
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">
                      {transfer.nomorTransfer}
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {transfer.cabangAsal?.namaCabang || '-'}
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center">
                      {renderStatusBadge(transfer.status)}
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {transfer.createdByUser?.namaLengkap || "-"}
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(transfer.createdAt)}
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {transfer.transferDetails.length} item
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openTransferDetail(transfer.id)}
                        className="text-indigo-600 hover:text-indigo-900 flex items-center"
                        title="Lihat detail"
                      >
                        <Eye className="h-4 w-4 mr-1" /> Lihat
                      </button>
                      <button
                        onClick={() => openApproveDialog(transfer)}
                        className="text-green-600 hover:text-green-900 flex items-center"
                        title="Setujui transfer"
                      >
                        <Check className="h-4 w-4 mr-1" /> Setujui
                      </button>
                      <button
                        onClick={() => openRejectDialog(transfer)}
                        className="text-red-600 hover:text-red-900 flex items-center"
                        title="Tolak transfer"
                      >
                        <X className="h-4 w-4 mr-1" /> Tolak
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {transfers.length > 0 && (
        <div className="mt-6">
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Approve Dialog */}
      <ConfirmationDialog
        isOpen={showApproveDialog}
        title="Setujui Transfer Stok"
        message={
          selectedTransfer
            ? `Apakah Anda yakin ingin menyetujui transfer stok ${selectedTransfer.nomorTransfer}?`
            : "Apakah Anda yakin ingin menyetujui transfer stok ini?"
        }
        confirmText="Setujui"
        confirmButtonColor="green"
        cancelText="Batal"
        onConfirm={handleApproveTransfer}
        onCancel={() => setShowApproveDialog(false)}
      />

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <X className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Tolak Transfer Stok
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Berikan alasan untuk menolak transfer stok{" "}
                        <span className="font-medium">
                          {selectedTransfer?.nomorTransfer}
                        </span>
                        .
                      </p>
                      <div className="mt-4">
                        <label
                          htmlFor="rejectReason"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Alasan Penolakan*
                        </label>
                        <textarea
                          id="rejectReason"
                          name="rejectReason"
                          rows="3"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          className="mt-1 shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="Masukkan alasan penolakan"
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleRejectTransfer}
                >
                  Tolak
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowRejectDialog(false)}
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Approve Dialog */}
      <ConfirmationDialog
        isOpen={showBulkApproveDialog}
        title="Setujui Beberapa Transfer Stok"
        message={`Apakah Anda yakin ingin menyetujui ${selectedTransfers.length} transfer stok yang dipilih?`}
        confirmText="Setujui Semua"
        confirmButtonColor="green"
        cancelText="Batal"
        onConfirm={handleBulkApproveTransfers}
        onCancel={() => setShowBulkApproveDialog(false)}
      />

      {/* Bulk Reject Dialog */}
      {showBulkRejectDialog && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <X className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Tolak Transfer Stok (Massal)
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Berikan alasan untuk menolak {selectedTransfers.length}{" "}
                        transfer stok yang dipilih.
                      </p>
                      <div className="mt-4">
                        <label
                          htmlFor="bulkRejectReason"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Alasan Penolakan*
                        </label>
                        <textarea
                          id="bulkRejectReason"
                          name="bulkRejectReason"
                          rows="3"
                          value={bulkRejectReason}
                          onChange={(e) => setBulkRejectReason(e.target.value)}
                          className="mt-1 shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="Masukkan alasan penolakan"
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleBulkRejectTransfers}
                >
                  Tolak Semua
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowBulkRejectDialog(false)}
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockTransferApprovalList;
