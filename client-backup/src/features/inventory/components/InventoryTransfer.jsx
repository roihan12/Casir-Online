import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftRight,
  Box,
  Search,
  AlertTriangle,
  Truck,
  Building,
  ChevronDown,
  Filter,
  RefreshCw,
  Package,
  CheckCircle,
  Clock,
  FileText,
  Plus,
  BarChart2,
  Calendar,
  Trash2,
  ExternalLink,
  UserCheck,
  Info,
  X,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import GlobalStatsCard from "../../common/components/GlobalStatsCard";
import Spinner from "../../../features/common/Spinner";
import Pagination from "../../../features/common/Pagination";
import ConfirmationDialog from "../../../features/common/ConfirmationDialog";
import Modal from "../../../features/common/Modal";
import { toast } from "react-hot-toast";
import { useStockTransferQueries } from "../../../hooks/useStockTransferQueries";
import { useCabangList } from "../../../features/cabang/hooks/useCabangQueries";
import { stockTransferSchema } from "../../../features/stock-transfers/validation/stockTransferValidation";


const InventoryTransfer = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filter and pagination states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceCabangFilter, setSourceCabangFilter] = useState("");
  const [destinationCabangFilter, setDestinationCabangFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Get cabang data using useCabangList hook
  const { data: cabangData, isLoading: isLoadingCabang } = useCabangList();
  const cabangList = cabangData?.data || [];

  // Transfer form state
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedSourceCabang, setSelectedSourceCabang] = useState("");
  const [selectedDestinationCabang, setSelectedDestinationCabang] =
    useState("");
  const [selectedProducts, setSelectedProducts] = useState([]);


  console.log("selected cabang", selectedSourceCabang);

  // Product search state for the modal
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [productPage, setProductPage] = useState(1);

  console.log("selected cabang", selectedSourceCabang);

  // Stock transfer queries
  const {
    useTransfers,
    useTransferStats,
    useProductsForBranch,
    useCreateTransfer,
  } = useStockTransferQueries();

  // Get transfers with filters
  const filters = {
    search: searchTerm,
    status: statusFilter,
    cabangAsalId: sourceCabangFilter,
    cabangTujuanId: destinationCabangFilter,
  };

  const {
    data: transfersData,
    isLoading: isLoadingTransfers,
    refetch: refetchTransfers,
  } = useTransfers(filters, currentPage, pageSize);

  // Get transfer statistics
  const { data: statsData, isLoading: isLoadingStats } = useTransferStats();
  
  // Get products for selected source branch
  const {
    data: productsData,
    isLoading: isLoadingProducts,
    refetch: refetchProducts
  } = useProductsForBranch(selectedSourceCabang, {
    enabled: !!selectedSourceCabang,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    onSuccess: (data) => {
      console.log("Products fetched successfully:", data);
    },
    onError: (error) => {
      console.error("Error fetching products:", error);
      toast.error("Gagal memuat produk dari cabang");
    }
  });

  // Form validation with react-hook-form and zod - must be called before any effects that use reset
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    control,
  } = useForm({
    resolver: zodResolver(stockTransferSchema),
    defaultValues: {
      cabangAsalId: "",
      cabangTujuanId: "",
      items: [],
      keterangan: "",
      tanggalKirim: null,
    },
  });

  

  // Create transfer mutation
  const { mutate: createTransfer, isLoading: isCreatingTransfer } =
    useCreateTransfer();


  // Reset product search and refetch products when source cabang changes
  useEffect(() => {
    if (selectedSourceCabang) {
      setProductSearchTerm("");
      setProductPage(1);
      refetchProducts();
    }
  }, [selectedSourceCabang, refetchProducts]);

  // Data transformations
  const transfers = transfersData?.data || [];
  const products = productsData?.data || [];
 
  console.log("inventory transfer", products)

  const stats = statsData?.data[0] || {
    total_drafts: 0,
    total_completed: 0,
    total_in_transit: 0,
    total_pending_approval: 0,
    total_cancelled: 0,
  };

  // Handle product search in modal
  const handleProductSearch = (e) => {
    setProductSearchTerm(e.target.value);
    setProductPage(1); // Reset to first page when search changes
  };

  const totalItems = transfersData?.meta?.total || 0;
  const totalPages = transfersData?.meta?.totalPages || 1;

  console.log("ini stats", stats);

  // Handle form submission
  const onSubmitTransfer = (data) => {
    // Format the data according to the API requirements
    const formattedData = {
      cabangAsalId: data.cabangAsalId,
      cabangTujuanId: data.cabangTujuanId,
      tanggalKirim: data.tanggalKirim ? new Date(data.tanggalKirim).toISOString() : new Date().toISOString(),
      keterangan: data.keterangan || '',
      items: data.items.map(item => ({
        produkId: item.produkId,
        jumlahKirim: parseInt(item.jumlahKirim, 10),
        keterangan: item.keterangan || null
      }))
    };

    createTransfer(formattedData, {
      onSuccess: () => {
        toast.success('Transfer stok berhasil dibuat');
        setShowTransferModal(false);
        reset();
        setSelectedProducts([]);
        refetchTransfers();
      },
      onError: (error) => {
        toast.error(error.message || 'Gagal membuat transfer stok');
      }
    });
  };

  // Handle filter reset
  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setSourceCabangFilter("");
    setDestinationCabangFilter("");
    setCurrentPage(1);
  };

  // Handle view transfer details
  const viewTransferDetails = (transferId) => {
    navigate(`/super-admin/stock-transfer/${transferId}`);
  };

  // Format transfer status for display
  const getStatusBadge = (status) => {
    switch (status) {
      case "pending_approval":
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs flex items-center">
            <Clock size={12} className="mr-1" />
            Menunggu Persetujuan
          </span>
        );
      case "approved":
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs flex items-center">
            <CheckCircle size={12} className="mr-1" />
            Disetujui
          </span>
        );
      case "rejected":
        return (
          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs flex items-center">
            <X size={12} className="mr-1" />
            Ditolak
          </span>
        );
      case "draft":
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs flex items-center">
            <FileText size={12} className="mr-1" />
            Draft
          </span>
        );
      case "in_transit":
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center">
            <Truck size={12} className="mr-1" />
            Dalam Pengiriman
          </span>
        );
      case "completed":
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs flex items-center">
            <CheckCircle size={12} className="mr-1" />
            Selesai
          </span>
        );
      case "cancelled":
        return (
          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs flex items-center">
            <X size={12} className="mr-1" />
            Dibatalkan
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs flex items-center">
            <Info size={12} className="mr-1" />
            {status}
          </span>
        );
    }
  };

  // Add handler functions for the form
  // Handle new transfer modal
  const handleNewTransfer = () => {
    setSelectedSourceCabang("");
    setSelectedDestinationCabang("");
    setSelectedProducts([]);
    reset({
      cabangAsalId: "",
      cabangTujuanId: "",
      items: [],
      keterangan: "",
      tanggalKirim: null,
    });
    setShowTransferModal(true);
  };

  // Handle source cabang change
  const handleSourceCabangChange = (e) => {
    setSelectedSourceCabang(e.target.value);
    
    // Reset related states
    setSelectedProducts([]);
    setProductSearchTerm("");
    setProductPage(1);
    
    // Force refetch products when source branch changes
    if (e.target.value) {
      refetchProducts();
    }
  };

  // Handle destination cabang change
  const handleDestinationCabangChange = (e) => {
    const destinationCabangId = e.target.value;
    setValue("cabangTujuanId", destinationCabangId);
    setSelectedDestinationCabang(destinationCabangId);
  };

  // Handle product selection
  const handleProductSelect = (product) => {
    if (selectedProducts.some((p) => p.id === product.id)) {
      return; // Already selected
    }

    const newProduct = {
      ...product,
      transferQuantity: 1,
    };

    setSelectedProducts([...selectedProducts, newProduct]);

    // Update form value for items
    const currentItems = watch("items") || [];
    setValue("items", [
      ...currentItems,
      {
        produkId: product.id,
        jumlahKirim: 1,
        keterangan: "",
      },
    ], { shouldValidate: true });
  };

  // Handle product quantity change
  const handleQuantityChange = (productId, quantity) => {
    const numQuantity = parseInt(quantity, 10);
    if (isNaN(numQuantity) || numQuantity <= 0) return;

    setSelectedProducts(
      selectedProducts.map((product) =>
        product.id === productId
          ? { ...product, transferQuantity: numQuantity }
          : product
      )
    );

    // Update form items
    const currentItems = watch("items") || [];
    const updatedItems = currentItems.map((item) =>
      item.produkId === productId ? { ...item, jumlahKirim: numQuantity } : item
    );
    setValue("items", updatedItems, { shouldValidate: true });
  };

  // Handle remove product
  const handleRemoveProduct = (productId) => {
    setSelectedProducts(
      selectedProducts.filter((product) => product.id !== productId)
    );

    // Update form items
    const currentItems = watch("items") || [];
    const updatedItems = currentItems.filter(
      (item) => item.produkId !== productId
    );
    setValue("items", updatedItems, { shouldValidate: true });
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    refetchTransfers();
  };

  // Handle status filter change
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  // Handle source cabang filter change
  const handleSourceCabangFilterChange = (e) => {
    setSourceCabangFilter(e.target.value);
    setCurrentPage(1);
  };

  // Handle destination cabang filter change
  const handleDestinationCabangFilterChange = (e) => {
    setDestinationCabangFilter(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="pb-6">
      {/* Dashboard Header */}
      <div className="flex flex-col items-center justify-center bg-indigo-600 text-white py-8 mb-6">
        <h1 className="text-2xl font-bold mb-2">Transfer Stok Antar Cabang</h1>
        <div className="flex items-center">
          <ArrowLeftRight size={24} className="mr-2" />
          <span>Kelola perpindahan produk antar cabang</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mx-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <GlobalStatsCard
          title="Total Transfer"
          value={stats.total_transfers || 0}
          percentage="30 hari terakhir"
          isPositive={true}
          icon={Box}
        />

        <GlobalStatsCard
          title="Menunggu Persetujuan"
          value={stats.total_pending_approval || 0}
          percentage="perlu ditinjau"
          isPositive={false}
          icon={Clock}
        />

        <GlobalStatsCard
          title="Dalam Proses"
          value={stats.inTransit || 0}
          percentage="sedang dikirim"
          isPositive={true}
          icon={Truck}
        />

        <GlobalStatsCard
          title="Selesai"
          value={stats.total_completed || 0}
          percentage="berhasil"
          isPositive={true}
          icon={CheckCircle}
        />

        <GlobalStatsCard
          title="Total Produk"
          value={stats.totalProductsTransferred || 0}
          percentage="telah ditransfer"
          isPositive={true}
          icon={Package}
        />
      </div>

      {/* Search and Filters */}
      <div className="mx-6 bg-white rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Cari dan Filter Transfer
          </h2>
        </div>
        <div className="p-4">
          <form
            onSubmit={handleSearch}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
          >
            {/* Search Box */}
            <div className="relative">
              <input
                type="text"
                placeholder="Cari nomor transfer..."
                className="block w-full rounded-lg border-gray-300 pl-10 pr-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
            </div>

            {/* Source Cabang Filter */}
            <div>
              <select
                className="appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-10 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={sourceCabangFilter}
                onChange={handleSourceCabangFilterChange}
              >
                <option value="">Semua Cabang Asal</option>
                {cabangList.map((cabang) => (
                  <option key={`source-filter-${cabang.id}`} value={cabang.id}>
                    {cabang.namaCabang}
                  </option>
                ))}
              </select>
            </div>

            {/* Destination Cabang Filter */}
            <div>
              <select
                className="appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-10 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={destinationCabangFilter}
                onChange={handleDestinationCabangFilterChange}
              >
                <option value="">Semua Cabang Tujuan</option>
                {cabangList.map((cabang) => (
                  <option key={`dest-filter-${cabang.id}`} value={cabang.id}>
                    {cabang.namaCabang}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                className="appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-10 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={statusFilter}
                onChange={handleStatusFilterChange}
              >
                <option value="">Semua Status</option>
                <option value="draft">Draft</option>
                <option value="pending_approval">Menunggu Persetujuan</option>
                <option value="approved">Disetujui</option>
                <option value="rejected">Ditolak</option>
                <option value="dikirim">Dalam Pengiriman</option>
                <option value="diterima">Selesai</option>
                <option value="dibatalkan">Dibatalkan</option>
              </select>
            </div>

            {/* Buttons */}
            <div className="flex space-x-2">
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </button>
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* New Transfer Button */}
      <div className="mx-6 mb-6">
        <button
          className="flex items-center justify-center px-4 py-2 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          onClick={handleNewTransfer}
        >
          <Plus size={18} className="mr-2" />
          <span>Transfer Baru</span>
        </button>
      </div>

      {/* Transfer List */}
      <div className="mx-6 bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Referensi
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
                  Produk
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
                  Tanggal
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
              {isLoadingTransfers ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center">
                    <Spinner />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-4 text-center text-red-500"
                  >
                    <AlertTriangle className="h-5 w-5 inline mr-1" />
                    {error}
                  </td>
                </tr>
              ) : transfers.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Tidak ada data transfer yang ditemukan
                  </td>
                </tr>
              ) : (
                transfers.map((transfer) => (
                  <tr key={transfer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                          <ArrowLeftRight size={20} />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {transfer.nomorTransfer}
                          </div>
                          <div className="text-xs text-gray-500">
                            Diminta oleh: {transfer.user?.namaLengkap || "-"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center">
                          <Building className="h-4 w-4 text-gray-500 mr-1" />
                          <span>Dari: {transfer.cabangAsal.namaCabang}</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        <div className="flex items-center">
                          <Building className="h-4 w-4 text-gray-500 mr-1" />
                          <span>Ke: {transfer.cabangTujuan.namaCabang}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {transfer.transferDetails.length} jenis produk
                      </div>
                      <div className="text-xs text-gray-500">
                        {transfer.transferDetails
                          .map(
                            (p) =>
                              `${p.jumlahKirim}x ${
                                p.produk.produkMaster.namaProduk.split(" ")[0]
                              }`
                          )
                          .slice(0, 2)
                          .join(", ")}
                        {transfer.transferDetails.length > 2 && "..."}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(transfer.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex flex-col">
                        <span>Dibuat: {formatDate(transfer.createdAt)}</span>
                        {transfer.approvedAt && (
                          <span className="mt-1">
                            Disetujui: {formatDate(transfer.approvedAt)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() =>
                            navigate(
                              `/superadmin/stock-transfers/${transfer.id}`
                            )
                          }
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Lihat detail"
                        >
                          <ExternalLink size={18} />
                        </button>
                        {transfer.status === "pending_approval" && (
                          <>
                            <button
                              onClick={() => handleApproveTransfer(transfer.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Setujui transfer"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt(
                                  "Masukkan alasan penolakan:"
                                );
                                if (reason)
                                  handleRejectTransfer(transfer.id, reason);
                              }}
                              className="text-red-600 hover:text-red-900"
                              title="Tolak transfer"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoadingTransfers && !error && transfers.length > 0 && (
          <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  currentPage === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  currentPage === totalPages
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Menampilkan{" "}
                  <span className="font-medium">{transfers.length}</span> dari{" "}
                  <span className="font-medium">{totalItems}</span> transfer
                </p>
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        )}
      </div>

    <Modal
      isOpen={showTransferModal}
      onClose={() => setShowTransferModal(false)}
      title="Buat Transfer Stok Baru"
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmitTransfer)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Source Branch */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cabang Asal <span className="text-red-500">*</span>
            </label>
            <select
              className={`block w-full rounded-md border ${errors.cabangAsalId ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'} py-2 px-3 shadow-sm focus:outline-none sm:text-sm`}
              value={selectedSourceCabang}
              onChange={(e) => {
                handleSourceCabangChange(e);
                setValue('cabangAsalId', e.target.value, { shouldValidate: true });
              }}
              disabled={isCreatingTransfer}
            >
              <option value="">Pilih Cabang Asal</option>
              {cabangList.map((cabang) => (
                <option key={`source-${cabang.id}`} value={cabang.id}>
                  {cabang.namaCabang}
                </option>
              ))}
            </select>
            {errors.cabangAsalId && (
              <p className="mt-1 text-sm text-red-600">{errors.cabangAsalId.message}</p>
            )}
          </div>

          {/* Destination Branch */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cabang Tujuan <span className="text-red-500">*</span>
            </label>
            <select
              className={`block w-full rounded-md border ${errors.cabangTujuanId ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'} py-2 px-3 shadow-sm focus:outline-none sm:text-sm`}
              value={selectedDestinationCabang}
              onChange={handleDestinationCabangChange}
              disabled={isCreatingTransfer}
            >
              <option value="">Pilih Cabang Tujuan</option>
              {cabangList
                .filter((cabang) => cabang.id !== selectedSourceCabang)
                .map((cabang) => (
                  <option key={`dest-${cabang.id}`} value={cabang.id}>
                    {cabang.namaCabang}
                  </option>
                ))}
            </select>
            {errors.cabangTujuanId && (
              <p className="mt-1 text-sm text-red-600">{errors.cabangTujuanId.message}</p>
            )}
          </div>

          {/* Shipping Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Kirim
            </label>
            <input
              type="date"
              className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              {...register("tanggalKirim")}
              disabled={isCreatingTransfer}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Keterangan
            </label>
            <input
              type="text"
              className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              placeholder="Keterangan transfer (opsional)"
              {...register("keterangan")}
              disabled={isCreatingTransfer}
            />
          </div>
        </div>

        {/* Product Selection Section */}
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Pilih Produk</h3>
          
          {/* Product Search */}
          {selectedSourceCabang && (
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari produk..."
                  className="block w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  value={productSearchTerm}
                  onChange={handleProductSearch}
                  disabled={isCreatingTransfer}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
          )}

          {/* Product List */}
          {selectedSourceCabang ? (
            isLoadingProducts ? (
              <div className="flex justify-center py-4">
                <Spinner />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                Tidak ada produk tersedia di cabang ini
              </div>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <div className="max-h-60 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Produk
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stok
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Satuan
                        </th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {products
                        .filter(product => 
                          product.produkMaster.namaProduk.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
                          product.produkMaster.sku.toLowerCase().includes(productSearchTerm.toLowerCase())
                        )
                        .map((product) => (
                          <tr key={product.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {product.produkMaster.namaProduk}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {product.produkMaster.sku}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                {product.stok}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-green-800">
                                {product.produkMaster.satuan}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                              <button
                                type="button"
                                onClick={() => handleProductSelect(product)}
                                className="text-indigo-600 hover:text-indigo-900 disabled:text-gray-400"
                                disabled={selectedProducts.some(p => p.id === product.id) || isCreatingTransfer}
                              >
                                {selectedProducts.some(p => p.id === product.id) ? 'Terpilih' : 'Pilih'}
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          ) : (
            <div className="text-center py-4 text-gray-500">
              Pilih cabang asal untuk melihat produk
            </div>
          )}

          {/* Selected Products */}
          {selectedProducts.length > 0 && (
            <div className="mt-6 overflow-x-auto">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Produk yang Dipilih</h3>
              <div className="border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Produk
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stok
                      </th>
                     
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Jumlah
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Satuan
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Keterangan
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedProducts.map((product, index) => (
                      <tr key={product.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {product.produkMaster.namaProduk}
                              </div>
                              <div className="text-sm text-gray-500">
                                {product.produkMaster.sku}
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {product.stok}
                          </span>
                        </td>
                  
                       
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            min="1"
                            max={product.stok}
                            className="block w-20 rounded-md border border-gray-300 py-1 px-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                            value={product.transferQuantity}
                            onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                            disabled={isCreatingTransfer}
                          />
                          {errors.items && errors.items[index] && errors.items[index].jumlahKirim && (
                            <p className="mt-1 text-xs text-red-600">{errors.items[index].jumlahKirim.message}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-green-800">
                            {product.produkMaster.satuan}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            className="block w-full rounded-md border border-gray-300 py-1 px-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                            placeholder="Keterangan (opsional)"
                            onChange={(e) => {
                              const currentItems = watch("items") || [];
                              const updatedItems = currentItems.map((item) =>
                                item.produkId === product.id ? { ...item, keterangan: e.target.value } : item
                              );
                              setValue("items", updatedItems);
                            }}
                            disabled={isCreatingTransfer}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <button
                            type="button"
                            onClick={() => handleRemoveProduct(product.id)}
                            className="text-red-600 hover:text-red-900 disabled:text-gray-400"
                            disabled={isCreatingTransfer}
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {errors.items && typeof errors.items.message === 'string' && (
                <p className="mt-2 text-sm text-red-600">{errors.items.message}</p>
              )}
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => setShowTransferModal(false)}
            className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            disabled={isCreatingTransfer}
          >
            Batal
          </button>
          <button
            type="submit"
            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-300"
            disabled={isCreatingTransfer || selectedProducts.length === 0}
          >
            {isCreatingTransfer ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Menyimpan...
              </>
            ) : (
              'Simpan Transfer'
            )}
          </button>
        </div>
      </form>
    </Modal>

  </div>
  );
};

export default InventoryTransfer;
