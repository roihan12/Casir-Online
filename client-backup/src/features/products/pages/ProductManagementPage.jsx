import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit,
  Trash,
  Search,
  Filter,
  Download,
  Upload,
  Eye,
  Tag,
  BarChart2,
  Package,
  Layers,
  ShoppingBag,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../../auth/hooks/useAuth.js";
import { toast } from "react-hot-toast";
import Modal from "../../common/Modal.jsx";
import Table from "../../common/Table.jsx";
import ProductDashboard from "../components/ProductDashboard";
import ProductImportExport from "../components/ProductImportExport";
import {
  useDeleteProdukMaster,
  useProdukMasterDashboard,
} from "../hooks/useProdukMasterQueries";
import useProdukQueries from "../hooks/useProdukQueries";
import { useCabangList } from "../../cabang/hooks/useCabangQueries";
import { useQueryClient } from "@tanstack/react-query";

const ProductManagementPage = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const isAdminCabang = hasRole("admin_cabang");
  const queryClient = useQueryClient();
  const { useAllProducts } = useProdukQueries();

  // State for filters and UI
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImportExportModal, setShowImportExportModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cabangFilter, setCabangFilter] = useState("all");
  const [minHargaFilter, setMinHargaFilter] = useState("");
  const [maxHargaFilter, setMaxHargaFilter] = useState("");
  const [minStokFilter, setMinStokFilter] = useState("");
  const [maxStokFilter, setMaxStokFilter] = useState("");
  const [createdAfterFilter, setCreatedAfterFilter] = useState("");
  const [createdBeforeFilter, setCreatedBeforeFilter] = useState("");
  const [updatedAfterFilter, setUpdatedAfterFilter] = useState("");
  const [updatedBeforeFilter, setUpdatedBeforeFilter] = useState("");
  const [sortByFilter, setSortByFilter] = useState("updatedAt");
  const [sortOrderFilter, setSortOrderFilter] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDashboard, setShowDashboard] = useState(true);
  const [categories, setCategories] = useState([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Fetch cabang list data from useCabangQueries
  const { data: cabangData, isLoading: isCabangLoading } = useCabangList();
  const cabangList = cabangData?.data || [];

  // Create filter params for the API
  const filterParams = {
    search: searchQuery || undefined,
    kategoriId: categoryFilter !== "all" ? categoryFilter : undefined,
    cabangId: cabangFilter !== "all" ? cabangFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    minHarga: minHargaFilter || undefined,
    maxHarga: maxHargaFilter || undefined,
    minStok: minStokFilter || undefined,
    maxStok: maxStokFilter || undefined,
    createdAfter: createdAfterFilter || undefined,
    createdBefore: createdBeforeFilter || undefined,
    updatedAfter: updatedAfterFilter || undefined,
    updatedBefore: updatedBeforeFilter || undefined,
    sortBy: sortByFilter || "updatedAt",
    sortOrder: sortOrderFilter || "desc",
    page: currentPage,
    limit: itemsPerPage,
  };

  // Handle category filter change with page reset
  const handleCategoryChange = (e) => {
    setCategoryFilter(e.target.value);
    setCurrentPage(1); // Reset to first page
  };

  // Handle cabang filter change with page reset
  const handleCabangChange = (e) => {
    setCabangFilter(e.target.value);
    setCurrentPage(1); // Reset to first page
  };

  // Handle status filter change with page reset
  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1); // Reset to first page
  };

  // Handle search query change with page reset
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page when search changes
  };

  // Handle sort change with page reset
  const handleSortByChange = (e) => {
    setSortByFilter(e.target.value);
    setCurrentPage(1); // Reset to first page
  };

  // Handle sort order change with page reset
  const handleSortOrderChange = (e) => {
    setSortOrderFilter(e.target.value);
    setCurrentPage(1); // Reset to first page
  };

  // Reset filters with page reset
  const resetFilters = () => {
    setCategoryFilter("all");
    setCabangFilter("all");
    setStatusFilter("all");
    setSearchQuery("");
    setMinHargaFilter("");
    setMaxHargaFilter("");
    setMinStokFilter("");
    setMaxStokFilter("");
    setCreatedAfterFilter("");
    setCreatedBeforeFilter("");
    setUpdatedAfterFilter("");
    setUpdatedBeforeFilter("");
    setSortByFilter("updatedAt");
    setSortOrderFilter("desc");
    setCurrentPage(1); // Reset to first page when filters are reset
  };

  // Use React Query to fetch produk master data using the updated hook
  const {
    data: productData,
    isLoading,
    isError,
    error,
    refetch,
  } = useAllProducts(filterParams);

  // Delete mutation hook
  const deleteMutation = useDeleteProdukMaster();

  // Fetch dashboard data using React Query
  const { data: dashboardData, isLoading: isDashboardLoading } =
    useProdukMasterDashboard({
      enabled: showDashboard, // Only fetch when dashboard is visible
      staleTime: 5 * 60 * 1000, // 5 minutes
    });

  // Extract data from query result
  const productList = productData?.data || [];
  const totalItems = productData?.pagination?.totalItems || 0;
  const totalPages = productData?.pagination?.totalPages || 1;

  const pagination = productData?.pagination || {
    totalItems: 0,
    totalPages: 0,
    currentPage: 1,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false,
  };

  // Extract unique categories from product list
  useEffect(() => {
    if (productList && productList.length > 0) {
      const uniqueCategories = [
        ...new Set(
          productList
            .filter((product) => product.produkMaster.kategori)
            .map((product) =>
              JSON.stringify({
                id: product.produkMaster.kategori.id,
                name: product.produkMaster.kategori.namaKategori,
              })
            )
        ),
      ].map((categoryStr) => JSON.parse(categoryStr));

      setCategories(uniqueCategories);
    }
  }, [productList]);

  // Handle refresh product list
  const handleRefresh = () => {
    refetch();
  };

  // Handle add new product
  const handleAddProduct = () => {
    navigate("/superadmin/products/create");
  };

  // Handle edit product
  const handleEditProduct = (product) => {
    navigate(`/superadmin/products/edit/${product.id}`);
  };

  // Handle view product details
  const handleViewProduct = (product) => {
    if (product && product.id) {
      navigate(`/superadmin/products/${product.id}`);
    } else {
      // If no specific product, just show the main list
      setShowDashboard(false);
    }
  };

  // Handle delete product
  const handleDeleteProduct = (product) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  // Confirm delete product
  const confirmDeleteProduct = async () => {
    try {
      await deleteMutation.mutateAsync(selectedProduct.id);
      setShowDeleteModal(false);
      toast.success("Produk berhasil dihapus");
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error(error.response?.data?.message || "Gagal menghapus produk");
    }
  };

  // Handle page change from pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Call refetch to update the data based on the new page
    setTimeout(() => {
      refetch();
    }, 0);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Handle import
  const handleImport = (file, preview) => {
    console.log("Importing file:", file, preview);
    // In a real application, you would process the file and update productList
    // For now, we'll just close the modal
    setShowImportExportModal(false);
  };

  // Handle export
  const handleExport = (options) => {
    console.log("Exporting with options:", options);
    // In a real application, you would generate and download the export file
    // For now, we'll just close the modal
    setShowImportExportModal(false);
  };

  // Toggle dashboard view
  const toggleDashboard = () => {
    setShowDashboard(!showDashboard);
  };

  // Navigate to categories
  const handleNavigateToCategories = () => {
    navigate("/superadmin/products/categories");
  };

  // Navigate to product requests
  const handleNavigateToRequests = () => {
    navigate("/superadmin/products/requests");
  };

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Get stock status class
  const getStockStatusClass = (stock) => {
    if (stock <= 0) return "bg-red-100 text-red-800";
    if (stock < 10) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  // Format number with thousand separator
  const formatNumber = (num) => {
    return new Intl.NumberFormat("id-ID").format(num);
  };

  // Table columns definition
  const columns = [
    {
      header: "Produk",
      accessor: "produkMaster.namaProduk",
      cell: (row) => (
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
            {row.produkMaster.produkImage &&
            row.produkMaster.produkImage.length > 0 ? (
              <img
                src={row.produkMaster.produkImage[0].filePath}
                alt={row.produkMaster.namaProduk}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <Package className="h-6 w-6 text-gray-400" />
              </div>
            )}
          </div>
          <div className="ml-3">
            <p className="font-medium text-gray-900">
              {row.produkMaster.namaProduk}
            </p>
            <p className="text-xs text-gray-500">SKU: {row.produkMaster.sku}</p>
            {row.produkMaster.barcode && (
              <p className="text-xs text-gray-500">
                Barcode: {row.produkMaster.barcode}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      header: "Kategori",
      accessor: "produkMaster.kategori.namaKategori",
      cell: (row) => (
        <div>
          {row.produkMaster.kategori ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <Tag className="h-3 w-3 mr-1" />
              {row.produkMaster.kategori.namaKategori}
            </span>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      ),
    },
    {
      header: "Cabang",
      accessor: "cabang.namaCabang",
      cell: (row) => (
        <div>
          {row.cabang ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              {row.cabang.namaCabang}
            </span>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      ),
    },
    {
      header: "Harga",
      accessor: "hargaJual",
      cell: (row) => (
        <div className="text-xs text-gray-500">
          <div className="font-medium text-gray-900">
            Jual: {formatPrice(row.hargaJual)}
          </div>
          <div>Beli: {formatPrice(row.hargaBeli)}</div>
          {row.hargaGrosir && <div>Grosir: {formatPrice(row.hargaGrosir)}</div>}
        </div>
      ),
    },
    {
      header: "Stok",
      accessor: "stok",
      cell: (row) => {
        return (
          <div>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStockStatusClass(
                row.stok
              )}`}
            >
              {row.stok <= 0
                ? "Habis"
                : row.stok < row.minStok
                ? "Stok Rendah"
                : "Tersedia"}
            </span>
            <p className="text-xs text-gray-500 mt-1">
              {row.stok} {row.produkMaster.satuan || "pcs"}
            </p>
            {row.minStok && (
              <p className="text-xs text-gray-500">Min: {row.minStok}</p>
            )}
          </div>
        );
      },
    },
    {
      header: "Status",
      accessor: "status",
      cell: (row) => (
        <div>
          {row.status === "tersedia" ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Tersedia
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Tidak Tersedia
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Aksi",
      accessor: "actions",
      cell: (row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleViewProduct(row)}
            className="p-1 text-gray-600 hover:text-indigo-800 rounded-full hover:bg-indigo-100"
            title="Lihat Detail"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleEditProduct(row)}
            className="p-1 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-100"
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteProduct(row)}
            className="p-1 text-red-600 hover:text-red-800 rounded-full hover:bg-red-100"
            title="Hapus"
          >
            <Trash className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  // Get low stock count
  const getLowStockCount = () => {
    return productList.filter((product) => {
      return product.stok > 0 && product.stok < product.minStok;
    }).length;
  };

  // Get out of stock count
  const getOutOfStockCount = () => {
    return productList.filter((product) => {
      return product.stok <= 0;
    }).length;
  };

  // Handle errors
  if (isError) {
    console.error("Error fetching products:", error);
  }

  // Handle price filter changes with page reset
  const handleMinHargaFilterChange = (e) => {
    setMinHargaFilter(e.target.value);
    setCurrentPage(1); // Reset to first page
  };

  const handleMaxHargaFilterChange = (e) => {
    setMaxHargaFilter(e.target.value);
    setCurrentPage(1); // Reset to first page
  };

  // Handle stock filter changes with page reset
  const handleMinStokFilterChange = (e) => {
    setMinStokFilter(e.target.value);
    setCurrentPage(1); // Reset to first page
  };

  const handleMaxStokFilterChange = (e) => {
    setMaxStokFilter(e.target.value);
    setCurrentPage(1); // Reset to first page
  };

  // Handle date filter changes with page reset
  const handleCreatedAfterFilterChange = (e) => {
    setCreatedAfterFilter(e.target.value);
    setCurrentPage(1); // Reset to first page
  };

  const handleCreatedBeforeFilterChange = (e) => {
    setCreatedBeforeFilter(e.target.value);
    setCurrentPage(1); // Reset to first page
  };

  const handleUpdatedAfterFilterChange = (e) => {
    setUpdatedAfterFilter(e.target.value);
    setCurrentPage(1); // Reset to first page
  };

  const handleUpdatedBeforeFilterChange = (e) => {
    setUpdatedBeforeFilter(e.target.value);
    setCurrentPage(1); // Reset to first page
  };

  return (
    <div>
      <div className="px-6 py-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            Manajemen Produk
          </h1>
          <div className="flex space-x-2">
            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              className="bg-white text-gray-700 px-3 py-2 rounded-lg flex items-center hover:bg-gray-100 border border-gray-200"
              disabled={isLoading}
              title="Refresh data"
            >
              <RefreshCw
                className={`h-5 w-5 ${
                  isLoading ? "animate-spin text-indigo-600" : "text-gray-500"
                }`}
              />
            </button>

            <button
              onClick={handleNavigateToCategories}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center hover:bg-gray-200"
            >
              <Layers className="h-5 w-5 mr-2" />
              Kategori
            </button>

            {/* Request button only visible for admin_cabang */}
            {isAdminCabang && (
              <button
                onClick={handleNavigateToRequests}
                className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg flex items-center hover:bg-blue-200"
              >
                <ShoppingBag className="h-5 w-5 mr-2" />
                Request Produk
              </button>
            )}

            <button
              onClick={() => setShowImportExportModal(true)}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center hover:bg-gray-200"
            >
              <Upload className="h-5 w-5 mr-2" />
              Impor/Ekspor
            </button>

            <button
              onClick={handleAddProduct}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Tambah Produk
            </button>
          </div>
        </div>

        {/* Alert for low stock items */}
        {(getLowStockCount() > 0 || getOutOfStockCount() > 0) && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Perhatian</h3>
              <p className="text-sm text-yellow-700 mt-1">
                {getOutOfStockCount() > 0 && (
                  <span className="block">
                    Terdapat <strong>{getOutOfStockCount()}</strong> produk
                    dengan stok habis.
                  </span>
                )}
                {getLowStockCount() > 0 && (
                  <span className="block">
                    Terdapat <strong>{getLowStockCount()}</strong> produk dengan
                    stok rendah.
                  </span>
                )}
                {isAdminCabang && (
                  <button
                    onClick={handleNavigateToRequests}
                    className="text-blue-600 hover:text-blue-800 underline mt-1 font-medium"
                  >
                    Buat request produk sekarang
                  </button>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Dashboard Section */}
        {showDashboard && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">
                Dashboard Produk
              </h2>
              <button
                onClick={toggleDashboard}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                {showDashboard ? "Sembunyikan" : "Tampilkan"} Dashboard
              </button>
            </div>
            <ProductDashboard
              productList={productList}
              dashboardData={dashboardData?.data}
              onViewProduct={handleViewProduct}
              isLoading={isDashboardLoading}
            />
          </div>
        )}

        {/* Table Section */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="p-4 border-b flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Cari produk..."
                  className="pl-10 pr-4 py-2 border rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>

              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded text-sm"
              >
                <Filter className="h-4 w-4 mr-1" />
                {showAdvancedFilters ? "Sembunyikan Filter" : "Filter Lanjutan"}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <select
                  className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={categoryFilter}
                  onChange={handleCategoryChange}
                >
                  <option value="all">Semua Kategori</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <select
                  className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={cabangFilter}
                  onChange={handleCabangChange}
                >
                  <option value="all">Semua Cabang</option>
                  {cabangList.map((cabang) => (
                    <option key={cabang.id} value={cabang.id}>
                      {cabang.namaCabang}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <select
                  className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={statusFilter}
                  onChange={handleStatusChange}
                >
                  <option value="all">Semua Status</option>
                  <option value="tersedia">Tersedia</option>
                  <option value="tidak_tersedia">Tidak Tersedia</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <select
                  className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={sortByFilter}
                  onChange={handleSortByChange}
                >
                  <option value="updatedAt">Tanggal Update</option>
                  <option value="createdAt">Tanggal Dibuat</option>
                  <option value="namaProduk">Nama Produk</option>
                  <option value="hargaJual">Harga Jual</option>
                  <option value="stok">Stok</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <select
                  className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={sortOrderFilter}
                  onChange={handleSortOrderChange}
                >
                  <option value="desc">Menurun</option>
                  <option value="asc">Menaik</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Tampilkan:</span>
                <select
                  className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            {showAdvancedFilters && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Harga Minimal
                  </label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Harga minimal"
                    value={minHargaFilter}
                    onChange={handleMinHargaFilterChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Harga Maksimal
                  </label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Harga maksimal"
                    value={maxHargaFilter}
                    onChange={handleMaxHargaFilterChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stok Minimal
                  </label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Stok minimal"
                    value={minStokFilter}
                    onChange={handleMinStokFilterChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stok Maksimal
                  </label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Stok maksimal"
                    value={maxStokFilter}
                    onChange={handleMaxStokFilterChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dibuat Setelah
                  </label>
                  <input
                    type="date"
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={createdAfterFilter}
                    onChange={handleCreatedAfterFilterChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dibuat Sebelum
                  </label>
                  <input
                    type="date"
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={createdBeforeFilter}
                    onChange={handleCreatedBeforeFilterChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Diperbarui Setelah
                  </label>
                  <input
                    type="date"
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={updatedAfterFilter}
                    onChange={handleUpdatedAfterFilterChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Diperbarui Sebelum
                  </label>
                  <input
                    type="date"
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={updatedBeforeFilter}
                    onChange={handleUpdatedBeforeFilterChange}
                  />
                </div>

                <div className="col-span-full flex justify-end">
                  <button
                    onClick={() => {
                      // Reset all advanced filters
                      setMinHargaFilter("");
                      setMaxHargaFilter("");
                      setMinStokFilter("");
                      setMaxStokFilter("");
                      setCreatedAfterFilter("");
                      setCreatedBeforeFilter("");
                      setUpdatedAfterFilter("");
                      setUpdatedBeforeFilter("");
                      setCurrentPage(1); // Reset to first page when filters are reset
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 mr-2"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => {
                      // Apply filters and go back to page 1
                      setCurrentPage(1);
                      refetch();
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Terapkan Filter
                  </button>
                </div>
              </div>
            )}
          </div>

          <Table
            columns={columns}
            data={productList}
            isLoading={isLoading}
            emptyMessage="Tidak ada data produk yang tersedia"
            pagination={pagination}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Konfirmasi Hapus"
      >
        <div className="p-6">
          <div className="flex items-start mb-4">
            <div className="flex-shrink-0 bg-red-100 rounded-full p-2">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900">
                Konfirmasi Penghapusan
              </h3>
              <p className="text-gray-700 mt-1">
                Apakah Anda yakin ingin menghapus produk "
                <span className="font-medium">
                  {selectedProduct?.namaProduk}
                </span>
                "? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100"
            >
              Batal
            </button>
            <button
              onClick={confirmDeleteProduct}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Menghapus..." : "Hapus"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Import/Export Modal */}
      <ProductImportExport
        isOpen={showImportExportModal}
        onClose={() => setShowImportExportModal(false)}
        onImport={handleImport}
        onExport={handleExport}
        productList={productList}
      />
    </div>
  );
};

export default ProductManagementPage;
