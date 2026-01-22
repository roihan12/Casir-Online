import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Database,
  Box,
  PlusCircle,
  Search,
  AlertTriangle,
  Calendar,
  FileText,
  Trash2,
  Edit,
  Eye,
  ChevronDown,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Truck,
  BarChart2,
  Package,
  AlertCircle,
  ArrowUpDown,
  MessageSquare,
  Repeat,
  Clock,
  Clipboard,
  X,
} from "lucide-react";

import GlobalStatsCard from "../../common/components/GlobalStatsCard";
import Spinner from "../../../features/common/Spinner";
import Pagination from "../../../features/common/Pagination";
import ConfirmationDialog from "../../../features/common/ConfirmationDialog";
import withCabangData from "../../../features/cabang/hoc/withCabangData"
import { toast } from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { stockAdjustmentSchema } from "../validation/InventoryValidation";
import useInventoryQueries from "../../../hooks/useInventoryQueries";
import { useQueryClient } from "@tanstack/react-query";
import useInventoryMutations from "../../../hooks/useInventoryMutations";
import { useCabangList } from "../../../features/cabang/hooks/useCabangQueries";

// In a real application, you would import the actual service
// import { getInventoryList, getInventoryStats } from "../../../services/inventoryService";

const InventoryManagement = ({ cabangData }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Get queries from custom hook
  const {
    useDashboardData,
    useLowStockProducts,
    useStockMovementData,
    useBranchTransferData,
  } = useInventoryQueries();

  const [inventory, setInventory] = useState([]);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [error, setError] = useState(null);

  // Branch state
  const { data: cabangListData, isLoading: isCabangLoading } = useCabangList();
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState("all");

  // Period selection state
  const [selectedPeriod, setSelectedPeriod] = useState(30);

  // Filter and pagination states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Modal states
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Form setup with react-hook-form and zod validation
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: {
      newStock: 0,
      reason: "",
      notes: "",
      batchNumber: "",
      expiryDate: "",
    },
  });

  // React Query hooks
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useDashboardData(selectedBranchId, selectedPeriod);

  const {
    data: lowStockData,
    isLoading: isLowStockLoading,
    error: lowStockError,
  } = useLowStockProducts(selectedBranchId);

  const {
    data: movementData,
    isLoading: isMovementLoading,
    error: movementError,
  } = useStockMovementData(selectedBranchId, selectedPeriod);

  const {
    data: transferData,
    isLoading: isTransferLoading,
    error: transferError,
  } = useBranchTransferData(selectedBranchId, selectedPeriod);

  // Check if all data is loading
  const isLoading =
    isDashboardLoading ||
    isLowStockLoading ||
    isMovementLoading ||
    isTransferLoading ||
    isCabangLoading;

  // Mock data for demonstration
  const mockInventoryStats = {
    totalProducts: 247,
    lowStockProducts: 18,
    outOfStockProducts: 5,
    expiringProducts: 12,
    recentMovements: 34,
    inventoryValue: 45600000,
  };

  const mockInventoryItems = [
    {
      id: "1",
      productName: "Laptop ASUS TUF Gaming A15",
      sku: "LP-ASUS-TUF-001",
      category: "Elektronik",
      currentStock: 15,
      minStock: 5,
      maxStock: 30,
      status: "normal",
      lastUpdated: new Date().toISOString(),
      expiryDate: null,
      batchNumber: "BATCH-ASUS-001",
      location: "Rak A-12",
      value: 12500000,
    },
    {
      id: "2",
      productName: "Smartphone Samsung Galaxy S21",
      sku: "SP-SAMS-S21-001",
      category: "Elektronik",
      currentStock: 3,
      minStock: 5,
      maxStock: 20,
      status: "low_stock",
      lastUpdated: new Date().toISOString(),
      expiryDate: null,
      batchNumber: "BATCH-SAMS-002",
      location: "Rak B-05",
      value: 9800000,
    },
    {
      id: "3",
      productName: "Susu Ultra Milk 1L",
      sku: "GR-ULTM-1L-001",
      category: "Makanan",
      currentStock: 0,
      minStock: 10,
      maxStock: 50,
      status: "out_of_stock",
      lastUpdated: new Date().toISOString(),
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      batchNumber: "BATCH-ULTM-245",
      location: "Rak C-02",
      value: 15000,
    },
    {
      id: "4",
      productName: "Biskuit Oreo Original 137g",
      sku: "GR-OREO-137-001",
      category: "Makanan",
      currentStock: 25,
      minStock: 10,
      maxStock: 100,
      status: "normal",
      lastUpdated: new Date().toISOString(),
      expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      batchNumber: "BATCH-OREO-089",
      location: "Rak C-04",
      value: 10000,
    },
    {
      id: "5",
      productName: "Minyak Goreng Bimoli 2L",
      sku: "GR-BIML-2L-001",
      category: "Makanan",
      currentStock: 8,
      minStock: 10,
      maxStock: 50,
      status: "low_stock",
      lastUpdated: new Date().toISOString(),
      expiryDate: new Date(
        Date.now() + 180 * 24 * 60 * 60 * 1000
      ).toISOString(),
      batchNumber: "BATCH-BIML-123",
      location: "Rak D-09",
      value: 35000,
    },
  ];

  // Load inventory and stats (using mock data for now)
  const loadData = async () => {
    setError(null);

    try {
      // In a real application, you would call actual API services
      // const inventoryData = await getInventoryList(filters, currentPage, pageSize);
      // const statsData = await getInventoryStats();
      // const branchesData = await getBranches();

      // Using mock data for demonstration
      setTimeout(() => {
        // Mock branches data
        const mockBranches = [
          { id: "cab-001", namaCabang: "Cabang Pusat Jakarta" },
          { id: "cab-002", namaCabang: "Cabang Bandung" },
          { id: "cab-003", namaCabang: "Cabang Surabaya" },
          { id: "cab-004", namaCabang: "Cabang Semarang" },
        ];

        setBranches(mockBranches);
        if (!selectedBranchId && mockBranches.length > 0) {
          setSelectedBranchId(mockBranches[0].id);
        }

        // Add branch information to inventory items
        const inventoryWithBranch = mockInventoryItems.map((item) => ({
          ...item,
          branchId:
            mockBranches[Math.floor(Math.random() * mockBranches.length)].id,
          branchName:
            mockBranches[Math.floor(Math.random() * mockBranches.length)]
              .namaCabang,
        }));

        // Filter by selected branch if needed
        const filteredInventory = selectedBranchId
          ? inventoryWithBranch.filter(
              (item) => item.branchId === selectedBranchId
            )
          : inventoryWithBranch;

        setInventory(filteredInventory);
        setTotalItems(filteredInventory.length);
        setTotalPages(Math.ceil(filteredInventory.length / pageSize));
      }, 800);
    } catch (err) {
      console.error("Error loading inventory data:", err);
      setError("Terjadi kesalahan saat memuat data inventori");
      toast.error("Gagal memuat data inventori");
    }
  };

  // Update state when dashboard data is loaded
  useEffect(() => {
    if (dashboardData) {
      // Process products for inventory table
      if (lowStockData) {
        // Use low stock data and combine with dashboard data
        const processedInventory = lowStockData?.data.map((item) => ({
          id: item.id,
          productName: item.nama_produk,
          harga_jual: item.harga_jual,
          harga_beli: item.harga_beli,
          sku: item.sku || "N/A",
          currentStock: item.stok,
          minStock: item.stok_minimum,
          maxStock: item.max_stok,
          status:
            item.stok <= 0
              ? "out_of_stock"
              : item.stok <= item.stok_minimum
              ? "low_stock"
              : "normal",
          lastUpdated: item.updated_at,
          expiryDate: null,
          batchNumber: "N/A",
          location: "N/A",
          value: 0,
          branchId: selectedBranchId,
          branchName:
            branches.find((branch) => branch.id === selectedBranchId)
              ?.namaCabang || "Unknown",
        }));

        setInventory(processedInventory);
        setTotalItems(processedInventory.length);
        setTotalPages(Math.ceil(processedInventory.length / pageSize));
      }
    }
  }, [dashboardData, lowStockData, selectedBranchId, branches, pageSize]);

  // Add useEffect to update branches when cabangListData is loaded
  useEffect(() => {
    if (cabangListData?.data) {
      const branchesData = cabangListData.data.map((cabang) => ({
        id: cabang.id || cabang.cabang_id, // Handle different ID formats
        namaCabang: cabang.namaCabang || cabang.nama_cabang, // Handle different property names
      }));
      setBranches(branchesData);

      // Removed the auto-selection of first branch
      // Let the default remain "all"
    }
  }, [cabangListData]);

  // Add this useEffect to refetch data when branch changes
  useEffect(() => {
    if (selectedBranchId) {
      // Refetch all queries when branch changes
      refetchDashboard();
    }
  }, [selectedBranchId]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    // Filter inventory locally
    if (inventory.length > 0) {
      const filteredItems = inventory.filter(
        (item) =>
          item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.sku.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setTotalItems(filteredItems.length);
      setTotalPages(Math.ceil(filteredItems.length / pageSize));
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setCategoryFilter("");
    setBatchFilter("");
    setCurrentPage(1);

    // Reset to original data from API
    if (lowStockData) {
      const processedInventory = lowStockData.map((item) => ({
        id: item.id,
        productName: item.produkMaster.namaProduk,
        sku: item.produkMaster.sku || "N/A",
        category: item.produkMaster.kategori?.namaKategori || "Uncategorized",
        currentStock: item.stok,
        minStock: item.minStok,
        maxStock: 0,
        status:
          item.stok <= 0
            ? "out_of_stock"
            : item.stok <= item.minStok
            ? "low_stock"
            : "normal",
        lastUpdated: new Date().toISOString(),
        expiryDate: null,
        batchNumber: "N/A",
        location: "N/A",
        value: 0,
        branchId: selectedBranchId,
        branchName:
          branches.find((branch) => branch.id === selectedBranchId)
            ?.namaCabang || "Unknown",
      }));

      setInventory(processedInventory);
      setTotalItems(processedInventory.length);
      setTotalPages(Math.ceil(processedInventory.length / pageSize));
    }
  };

  // Handle stock adjustment
  const handleAdjustStock = async (formData) => {
    if (!selectedProduct) return;

    // Get the mutation hook
    const { useStockAdjustment } = useInventoryMutations();
    const { mutateAsync, isLoading } = useStockAdjustment();

    setIsAdjusting(true);

    try {
      // Prepare adjustment data
      const adjustmentData = {
        productId: selectedProduct.id,
        newStock: formData.newStock,
        reason: formData.reason,
        notes: formData.notes,
        batchNumber: formData.batchNumber,
        expiryDate: formData.expiryDate,
      };

      // Call the mutation
      await mutateAsync(adjustmentData);

      // No need to manually invalidate queries - the mutation will handle it
      setShowAdjustmentModal(false);
      setSelectedProduct(null);
      reset();
    } catch (err) {
      console.error("Error adjusting product stock:", err);
      // Error handling is done in the mutation hook
    } finally {
      setIsAdjusting(false);
    }
  };

  // Open adjustment modal
  const openAdjustmentModal = (product) => {
    setSelectedProduct(product);
    setValue("newStock", product.currentStock);
    setValue("batchNumber", product.batchNumber);
    setValue(
      "expiryDate",
      product.expiryDate
        ? new Date(product.expiryDate).toISOString().split("T")[0]
        : ""
    );
    setShowAdjustmentModal(true);
  };

  // Handle inventory transfer
  const handleNavigateToTransfer = () => {
    navigate("/superadmin/inventory/transfer");
  };

  // Handle inventory notifications
  const handleNavigateToNotifications = () => {
    navigate("/superadmin/inventory/notifications");
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Get status class for table row
  const getStatusClass = (status) => {
    switch (status) {
      case "low_stock":
        return "text-orange-600";
      case "out_of_stock":
        return "text-red-600";
      case "expiring_soon":
        return "text-yellow-600";
      default:
        return "text-green-600";
    }
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "low_stock":
        return "bg-orange-100 text-orange-800";
      case "out_of_stock":
        return "bg-red-100 text-red-800";
      case "expiring_soon":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-green-100 text-green-800";
    }
  };

  return (
    <div className="pb-6">
      {/* Dashboard Header */}
      <div className="flex flex-col items-center justify-center bg-indigo-600 text-white py-8 mb-6">
        <h1 className="text-2xl font-bold mb-2">Manajemen Inventori</h1>
        <div className="flex items-center">
          <Database size={24} className="mr-2" />
          <span>Kelola stok produk dan pergerakan inventori</span>
        </div>
      </div>

      {/* Branch Selection */}
      <div className="mx-6 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
            <div className="mb-4 sm:mb-0">
              <h2 className="text-lg font-medium text-gray-900">
                Pilih Cabang
              </h2>
              <p className="text-sm text-gray-500">
                Filter data inventori berdasarkan cabang
              </p>
            </div>
            <div className="w-full sm:w-64">
              {isCabangLoading ? (
                <div className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md shadow-sm">
                  <Spinner size="small" />
                  <span className="ml-2">Memuat data cabang...</span>
                </div>
              ) : (
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  disabled={isCabangLoading}
                >
                  <option value="all">Semua Cabang (Data Agregat)</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.namaCabang}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add this section after the branch selection and before the stats cards */}
      {selectedBranchId === "all" &&
        dashboardData?.metadata?.branchCount > 0 && (
          <div className="mx-6 mb-6">
            <div className="bg-purple-50 p-4 rounded-xl shadow-sm border border-purple-200">
              <div className="flex items-center">
                <div className="mr-4 bg-purple-100 p-2 rounded-full">
                  <Database className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-medium text-gray-900">
                    Melihat Data Agregat Seluruh Cabang
                  </h2>
                  <p className="text-sm text-gray-600">
                    Menampilkan ringkasan inventori dari semua{" "}
                    {dashboardData?.metadata?.branchCount} cabang.
                    {dashboardData?.metadata?.lastRefreshed && (
                      <span className="ml-1">
                        Terakhir diperbarui pada{" "}
                        {new Date(
                          dashboardData.metadata.lastRefreshed
                        ).toLocaleString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Stats Cards */}
      <div className="mx-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
        <GlobalStatsCard
          title="Total Produk"
          value={dashboardData?.summaryData?.totalProduk || 0}
          percentage={`${
            dashboardData?.changeData?.totalProdukPerubahan || 0
          }% dari periode sebelumnya`}
          isPositive={
            (dashboardData?.changeData?.totalProdukPerubahan || 0) >= 0
          }
          icon={Box}
          isLoading={isDashboardLoading}
        />

        <GlobalStatsCard
          title="Stok Rendah"
          value={dashboardData?.summaryData?.stokRendah || 0}
          percentage={`${
            dashboardData?.changeData?.stokRendahPerubahan || 0
          }% dari periode sebelumnya`}
          isPositive={false}
          icon={AlertCircle}
          isLoading={isDashboardLoading}
        />

        <GlobalStatsCard
          title="Habis Stok"
          value={dashboardData?.summaryData?.habisStok || 0}
          percentage={`${
            dashboardData?.changeData?.habisStokPerubahan || 0
          }% dari periode sebelumnya`}
          isPositive={false}
          icon={AlertTriangle}
          isLoading={isDashboardLoading}
        />

        <GlobalStatsCard
          title="Kedaluwarsa < 30 Hari"
          value={dashboardData?.summaryData?.kadaluwarsa30Hari || 0}
          percentage="dari total produk"
          isPositive={false}
          icon={Calendar}
          isLoading={isDashboardLoading}
        />

        <GlobalStatsCard
          title="Nilai Inventori"
          value={formatCurrency(
            dashboardData?.summaryData?.nilaiInventori || 0
          )}
          percentage="Total aset persediaan"
          isPositive={true}
          icon={BarChart2}
          isLoading={isDashboardLoading}
        />
      </div>

      {/* Movement Stats Cards */}
      <div className="mx-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Pergerakan Stok
              </h3>
              <p className="text-sm text-gray-500">
                {selectedPeriod} hari terakhir
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <Repeat className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            {isDashboardLoading ? (
              <Spinner />
            ) : (
              <>
                <p className="text-2xl font-bold">
                  {dashboardData?.movementData?.pergerakanStok?.total || 0}
                </p>
                <div className="mt-1 flex items-center text-sm">
                  <span
                    className={
                      dashboardData?.movementData?.pergerakanStok?.perubahan >=
                      0
                        ? "text-green-500"
                        : "text-red-500"
                    }
                  >
                    {dashboardData?.movementData?.pergerakanStok?.perubahan >= 0
                      ? "+"
                      : ""}
                    {dashboardData?.movementData?.pergerakanStok?.perubahan ||
                      0}
                    %
                  </span>
                  <span className="text-gray-500 ml-1">
                    dari periode sebelumnya
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Stok Masuk</h3>
              <p className="text-sm text-gray-500">
                {selectedPeriod} hari terakhir
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <ArrowUpDown className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            {isDashboardLoading ? (
              <Spinner />
            ) : (
              <>
                <p className="text-2xl font-bold">
                  {dashboardData?.movementData?.stokMasuk?.total || 0}
                </p>
                <div className="mt-1 flex items-center text-sm">
                  <span
                    className={
                      dashboardData?.movementData?.stokMasuk?.perubahan >= 0
                        ? "text-green-500"
                        : "text-red-500"
                    }
                  >
                    {dashboardData?.movementData?.stokMasuk?.perubahan >= 0
                      ? "+"
                      : ""}
                    {dashboardData?.movementData?.stokMasuk?.perubahan || 0}%
                  </span>
                  <span className="text-gray-500 ml-1">
                    dari periode sebelumnya
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Stok Keluar</h3>
              <p className="text-sm text-gray-500">
                {selectedPeriod} hari terakhir
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <Package className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4">
            {isDashboardLoading ? (
              <Spinner />
            ) : (
              <>
                <p className="text-2xl font-bold">
                  {dashboardData?.movementData?.stokKeluar?.total || 0}
                </p>
                <div className="mt-1 flex items-center text-sm">
                  <span
                    className={
                      dashboardData?.movementData?.stokKeluar?.perubahan >= 0
                        ? "text-green-500"
                        : "text-red-500"
                    }
                  >
                    {dashboardData?.movementData?.stokKeluar?.perubahan >= 0
                      ? "+"
                      : ""}
                    {dashboardData?.movementData?.stokKeluar?.perubahan || 0}%
                  </span>
                  <span className="text-gray-500 ml-1">
                    dari periode sebelumnya
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Transfer Antar Cabang
              </h3>
              <p className="text-sm text-gray-500">
                {selectedPeriod} hari terakhir
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Truck className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            {isDashboardLoading ? (
              <Spinner />
            ) : (
              <>
                <p className="text-2xl font-bold">
                  {dashboardData?.movementData?.transferCabang?.total || 0}
                </p>
                <div className="mt-1 flex items-center text-sm">
                  <span className="text-purple-500">
                    {dashboardData?.movementData?.transferCabang
                      ?.cabangTerhubung || 0}
                  </span>
                  <span className="text-gray-500 ml-1">cabang terlibat</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add this section after the movement stats cards when viewing data for all branches */}
      {selectedBranchId === "all" &&
        dashboardData?.metadata?.branches &&
        dashboardData.metadata.branches.length > 0 && (
          <div className="mx-6 mb-6">
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Ringkasan per Cabang
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Cabang
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Total Produk
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Stok Rendah
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Habis Stok
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Nilai Inventori
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dashboardData.metadata.branches.map((branch) => (
                      <tr key={branch.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                              <Database size={16} />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {branch.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {branch.totalProducts}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {branch.lowStock}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {branch.outOfStock}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(branch.totalValue)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <button
                            onClick={() => setSelectedBranchId(branch.id)}
                            className="inline-flex items-center px-2.5 py-1.5 border border-indigo-500 text-xs font-medium rounded text-indigo-500 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Lihat Detail
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      {/* Action Bar */}
      <div className="mx-6 flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        {/* Search Bar */}
        <form
          onSubmit={handleSearch}
          className="w-full md:w-auto flex-grow md:max-w-md"
        >
          <div className="relative">
            <input
              type="text"
              placeholder="Cari produk..."
              className="w-full px-4 py-2 pr-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              type="submit"
              className="absolute right-0 top-0 mt-2 mr-3 text-gray-400 hover:text-indigo-500"
            >
              <Search size={20} />
            </button>
          </div>
        </form>

        {/* Filters & Actions */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {/* Category Filter */}
          <div className="relative">
            <select
              className="appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-10 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">Semua Kategori</option>
              <option value="Elektronik">Elektronik</option>
              <option value="Makanan">Makanan</option>
              <option value="Minuman">Minuman</option>
              <option value="Pakaian">Pakaian</option>
              <option value="Kesehatan">Kesehatan</option>
              <option value="Kecantikan">Kecantikan</option>
              <option value="Rumah Tangga">Rumah Tangga</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <ChevronDown size={16} />
            </div>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              className="appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-10 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Semua Status</option>
              <option value="normal">Normal</option>
              <option value="low_stock">Stok Rendah</option>
              <option value="out_of_stock">Habis Stok</option>
              <option value="expiring_soon">Segera Kedaluwarsa</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <ChevronDown size={16} />
            </div>
          </div>

          {/* Batch Filter */}
          <div className="relative">
            <input
              type="text"
              placeholder="Filter Batch..."
              className="appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-10 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
            />
          </div>

          {/* Clear Filters Button */}
          <button
            className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50"
            onClick={clearFilters}
          >
            <X size={16} className="mr-1" />
            <span>Bersihkan Filter</span>
          </button>

          {/* Refresh Button */}
          <button
            className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50"
            onClick={() => loadData()}
            disabled={isLoading}
          >
            <RefreshCw
              size={16}
              className={`mr-1 ${isLoading ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </button>

          {/* Export Button */}
          <button className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50">
            <Download size={16} className="mr-1" />
            <span>Export</span>
          </button>

          {/* Transfer Stock Button */}
          <button
            className="flex items-center justify-center px-3 py-2 border border-indigo-500 rounded-lg text-indigo-500 bg-white hover:bg-indigo-50"
            onClick={handleNavigateToTransfer}
          >
            <ArrowUpDown size={16} className="mr-1" />
            <span>Transfer Stok</span>
          </button>

          {/* View Notifications Button */}
          <button
            className="flex items-center justify-center px-3 py-2 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700"
            onClick={handleNavigateToNotifications}
          >
            <MessageSquare size={16} className="mr-1" />
            <span>Notifikasi</span>
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="mx-6 bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
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
                 Harga
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Stok
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
                  Lokasi
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
                  Batch / Kadaluarsa
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Pembaruan Terakhir
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
              {isLoading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-4 text-center">
                    <Spinner />
                  </td>
                </tr>
              ) : dashboardError || lowStockError ? (
                <tr>
                  <td
                    colSpan="9"
                    className="px-6 py-4 text-center text-red-500"
                  >
                    <AlertTriangle className="h-5 w-5 inline mr-1" />
                    {dashboardError?.message ||
                      lowStockError?.message ||
                      "Terjadi kesalahan saat memuat data"}
                  </td>
                </tr>
              ) : inventory.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Tidak ada data inventori yang ditemukan
                  </td>
                </tr>
              ) : (
                inventory.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-gray-50 ${getStatusClass(
                      item.status
                    )}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                          <Package size={20} />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {item.productName}
                          </div>
                          <div className="text-xs text-gray-500">
                            SKU: {item.sku}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="text-sm text-gray-600 font-medium">
                        Jual: {item.harga_jual}
                      </div>
                      <div className="text-sm text-gray-600 font-medium">
                        Beli: {item.harga_beli}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">
                        {item.currentStock}
                      </div>
                      <div className="text-xs text-gray-500">
                        Min: {item.minStock} | Max: {item.maxStock || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                          item.status
                        )}`}
                      >
                        {item.status === "normal"
                          ? "Normal"
                          : item.status === "low_stock"
                          ? "Stok Rendah"
                          : item.status === "out_of_stock"
                          ? "Habis Stok"
                          : "Kedaluwarsa"}
                      </span>
                      {item.expiryDate && (
                        <div className="text-xs text-gray-500 mt-1">
                          Exp:{" "}
                          {new Date(item.expiryDate).toLocaleDateString(
                            "id-ID"
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.branchName || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{item.batchNumber || "-"}</div>
                      {item.expiryDate && (
                        <div className="text-xs mt-1">
                          Exp:{" "}
                          {new Date(item.expiryDate).toLocaleDateString(
                            "id-ID"
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.lastUpdated).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => {
                            /* View product details */
                            navigate(
                              `/superadmin/inventory/product/${item.id}`
                            );
                          }}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Lihat detail"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => openAdjustmentModal(item)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Sesuaikan stok"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => {
                            /* Create movement history */
                            navigate(
                              `/superadmin/inventory/movements?productId=${item.id}`
                            );
                          }}
                          className="text-green-600 hover:text-green-900"
                          title="Riwayat pergerakan"
                        >
                          <Clipboard size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && !error && inventory.length > 0 && (
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
                  <span className="font-medium">{inventory.length}</span> dari{" "}
                  <span className="font-medium">{totalItems}</span> data produk
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

      {/* Stock Adjustment Modal */}
      <ConfirmationDialog
        isOpen={showAdjustmentModal}
        title="Sesuaikan Stok Produk"
        message={`Sesuaikan stok untuk produk "${selectedProduct?.productName}"`}
        confirmLabel="Simpan"
        cancelLabel="Batal"
        isLoading={isAdjusting}
        onConfirm={handleSubmit(handleAdjustStock)}
        onCancel={() => {
          setShowAdjustmentModal(false);
          setSelectedProduct(null);
          reset();
        }}
        confirmButtonClassName="bg-blue-600 hover:bg-blue-700"
        customContent={
          <div className="mt-4">
            <div className="mb-4">
              <label
                htmlFor="currentStock"
                className="block text-sm font-medium text-gray-700"
              >
                Stok Saat Ini
              </label>
              <input
                type="text"
                id="currentStock"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={selectedProduct?.currentStock || 0}
                disabled
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="branchName"
                className="block text-sm font-medium text-gray-700"
              >
                Cabang
              </label>
              <input
                type="text"
                id="branchName"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={selectedProduct?.branchName || "-"}
                disabled
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="newStock"
                className="block text-sm font-medium text-gray-700"
              >
                Stok Baru
              </label>
              <input
                type="number"
                id="newStock"
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                  errors.newStock ? "border-red-500" : ""
                }`}
                {...register("newStock", { valueAsNumber: true })}
              />
              {errors.newStock && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.newStock.message}
                </p>
              )}
            </div>
            <div className="mb-4">
              <label
                htmlFor="batchNumber"
                className="block text-sm font-medium text-gray-700"
              >
                Nomor Batch
              </label>
              <input
                type="text"
                id="batchNumber"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                {...register("batchNumber")}
                placeholder="Masukkan nomor batch"
              />
              {errors.batchNumber && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.batchNumber.message}
                </p>
              )}
            </div>
            <div className="mb-4">
              <label
                htmlFor="expiryDate"
                className="block text-sm font-medium text-gray-700"
              >
                Tanggal Kadaluarsa
              </label>
              <input
                type="date"
                id="expiryDate"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                {...register("expiryDate")}
                placeholder="Pilih tanggal kadaluarsa"
              />
              {errors.expiryDate && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.expiryDate.message}
                </p>
              )}
            </div>
            <div className="mb-4">
              <label
                htmlFor="reason"
                className="block text-sm font-medium text-gray-700"
              >
                Alasan Penyesuaian
              </label>
              <select
                id="reason"
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                  errors.reason ? "border-red-500" : ""
                }`}
                {...register("reason")}
              >
                <option value="">Pilih alasan</option>
                <option value="correction">Koreksi Stok</option>
                <option value="damage">Barang Rusak</option>
                <option value="expiry">Barang Kedaluwarsa</option>
                <option value="theft">Pencurian</option>
                <option value="transfer">Transfer Antar Cabang</option>
                <option value="other">Lainnya</option>
              </select>
              {errors.reason && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.reason.message}
                </p>
              )}
            </div>
            <div className="mb-4">
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-gray-700"
              >
                Catatan
              </label>
              <textarea
                id="notes"
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Tambahkan catatan penyesuaian jika diperlukan"
                {...register("notes")}
              />
              {errors.notes && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.notes.message}
                </p>
              )}
            </div>
          </div>
        }
      />
    </div>
  );
};

export default withCabangData(InventoryManagement);
