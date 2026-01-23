import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Filter,
  ArrowUp,
  ArrowDown,
  Tag,
  Box,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  XCircle,
  Layers,
  BarChart2,
  TrendingUp,
  ShoppingBag,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import produkMasterService from "@services/produkMasterService";
import Spinner from "@features/common/Spinner";
import Pagination from "@features/common/Pagination";
import Alert from "@features/common/Alert";
import Table from "@features/common/Table";

const ProductMasterList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State for filters and pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const [selectedKategori, setSelectedKategori] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Debounce search term
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch dashboard data
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ["produk-master-dashboard"],
    queryFn: produkMasterService.getDashboardDataStats,
  });

  // Fetch product master data
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["produk-master", currentPage, itemsPerPage],
    queryFn: () =>
      produkMasterService.getAllProdukMaster({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearchTerm,
        kategoriId: selectedKategori,
        status: selectedStatus,
        sortBy: sortField,
        sortDirection: sortDirection,
      }),
    keepPreviousData: true,
  });

  // Separate query for search and filters that causes refetch
  React.useEffect(() => {
    const timer = setTimeout(() => {
      refetch();
    }, 300);
    return () => clearTimeout(timer);
  }, [
    debouncedSearchTerm,
    selectedKategori,
    selectedStatus,
    sortField,
    sortDirection,
    refetch,
  ]);

  // Fetch categories for filter
  const { data: categories } = useQuery({
    queryKey: ["kategori"],
    queryFn: () => produkMasterService.getCategories(),
  });

  // Handle search
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Get sort icon
  const getSortIcon = (field) => {
    if (sortField !== field) return null;

    return sortDirection === "asc" ? (
      <ArrowUp className="h-4 w-4 inline-block ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 inline-block ml-1" />
    );
  };

  // Handle add new product master
  const handleAddProduct = () => {
    navigate("/superadmin/product-master/create");
  };

  // Handle edit product master
  const handleEditProduct = (id) => {
    navigate(`/superadmin/product-master/edit/${id}`);
  };

  // Handle view product master
  const handleViewProduct = (id) => {
    navigate(`/superadmin/product-master/view/${id}`);
  };

  // Handle delete product master
  const handleDeleteProduct = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus produk ini?")) {
      try {
        await produkMasterService.deleteProdukMaster(id);
        toast.success("Produk berhasil dihapus");
        refetch();
      } catch (error) {
        toast.error(`Gagal menghapus produk: ${error.message}`);
      }
    }
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setSelectedKategori("");
    setSelectedStatus("");
    setCurrentPage(1);
    setSortField("createdAt");
    setSortDirection("desc");
  };

  // Define table columns
  const columns = [
    {
      header: (
        <button
          onClick={() => handleSort("namaProduk")}
          className="font-medium flex items-center"
        >
          Produk
          {getSortIcon("namaProduk")}
        </button>
      ),
      accessor: "namaProduk",
      cell: (row) => (
        <div className="flex items-center">
          <div className="w-10 h-10 flex-shrink-0 mr-3">
            {row.produkImage && row.produkImage.length > 0 ? (
              <img
                src={row.produkImage[0].filePath}
                alt={row.namaProduk}
                className="w-10 h-10 rounded-md object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-md bg-gray-200 flex items-center justify-center">
                <Package className="h-5 w-5 text-gray-500" />
              </div>
            )}
          </div>
          <div>
            <div className="font-medium text-gray-900">{row.namaProduk}</div>
            {row.barcode && (
              <div className="text-xs text-gray-500">
                Barcode: {row.barcode}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      header: (
        <button
          onClick={() => handleSort("sku")}
          className="font-medium flex items-center"
        >
          SKU
          {getSortIcon("sku")}
        </button>
      ),
      accessor: "sku",
      cell: (row) => <span className="text-gray-500">{row.sku}</span>,
    },
    {
      header: (
        <button
          onClick={() => handleSort("kategori.namaKategori")}
          className="font-medium flex items-center"
        >
          Kategori
          {getSortIcon("kategori.namaKategori")}
        </button>
      ),
      accessor: "kategori",
      cell: (row) =>
        row.kategori ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Tag className="h-3 w-3 mr-1" />
            {row.kategori.namaKategori}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
    {
      header: (
        <button
          onClick={() => handleSort("status")}
          className="font-medium flex items-center"
        >
          Status
          {getSortIcon("status")}
        </button>
      ),
      accessor: "status",
      cell: (row) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            row.status === "aktif"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {row.status === "aktif" ? "Aktif" : "Nonaktif"}
        </span>
      ),
    },
    {
      header: <div className="text-right">Aksi</div>,
      accessor: "actions",
      cell: (row) => (
        <div className="text-right space-x-2 whitespace-nowrap">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewProduct(row.id);
            }}
            className="text-blue-600 hover:text-blue-900"
            title="Lihat Detail"
          >
            <Eye className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEditProduct(row.id);
            }}
            className="text-yellow-600 hover:text-yellow-900"
            title="Edit"
          >
            <Edit className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteProduct(row.id);
            }}
            className="text-red-600 hover:text-red-900"
            title="Hapus"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      ),
    },
  ];

  // Error state
  if (isError) {
    return (
      <div className="p-4">
        <Alert
          type="error"
          title="Error"
          message={`Gagal memuat data produk: ${error.message}`}
        />
        <button
          onClick={refetch}
          className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-800"
        >
          <RefreshCw className="h-4 w-4" /> Coba lagi
        </button>
      </div>
    );
  }

  const products = data?.data || [];
  const totalItems = data?.pagination?.totalItems || 0;
  const totalPages = data?.pagination?.totalPages || 1;

  // Prepare pagination object for Table component
  const paginationConfig = {
    totalItems,
    totalPages,
    currentPage,
    itemsPerPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <Package className="mr-2 h-6 w-6" />
          Manajemen Produk Master
        </h1>
        <button
          onClick={handleAddProduct}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah Produk
        </button>
      </div>

      {/* Dashboard Section */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <BarChart2 className="mr-2 h-5 w-5 text-indigo-600" />
          Dashboard Produk Master
        </h2>

        {dashboardLoading ? (
          <div className="flex justify-center items-center h-32">
            <Spinner />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Products */}
            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-indigo-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Produk</p>
                  <h3 className="text-2xl font-bold text-gray-800">
                    {dashboardData?.data?.totalProducts || 0}
                  </h3>
                </div>
                <div className="bg-indigo-100 p-2 rounded-lg">
                  <Package className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-500">
                {dashboardData?.data?.productsAddedThisMonth || 0} produk
                ditambahkan bulan ini
              </div>
            </div>

            {/* Active Products */}
            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Produk Aktif</p>
                  <h3 className="text-2xl font-bold text-gray-800">
                    {dashboardData?.data?.activeProducts || 0}
                  </h3>
                </div>
                <div className="bg-green-100 p-2 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-500">
                {Math.round(
                  (dashboardData?.data?.activeProducts /
                    dashboardData?.data?.totalProducts) *
                    100
                ) || 0}
                % dari total produk
              </div>
            </div>

            {/* Inactive Products */}
            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Produk Nonaktif</p>
                  <h3 className="text-2xl font-bold text-gray-800">
                    {dashboardData?.data?.inactiveProducts || 0}
                  </h3>
                </div>
                <div className="bg-red-100 p-2 rounded-lg">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-500">
                {Math.round(
                  (dashboardData?.data?.inactiveProducts /
                    dashboardData?.data?.totalProducts) *
                    100
                ) || 0}
                % dari total produk
              </div>
            </div>

            {/* Categories */}
            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Kategori</p>
                  <h3 className="text-2xl font-bold text-gray-800">
                    {dashboardData?.data?.totalCategories || 0}
                  </h3>
                </div>
                <div className="bg-yellow-100 p-2 rounded-lg">
                  <Tag className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-500">
                Kategori paling banyak:{" "}
                {dashboardData?.data?.mostPopularCategory || "-"}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Cari produk..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter className="h-5 w-5 mr-2 text-gray-500" />
            Filter
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 border-t pt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kategori
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={selectedKategori}
                onChange={(e) => setSelectedKategori(e.target.value)}
              >
                <option value="">Semua Kategori</option>
                {categories?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.namaKategori}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="">Semua Status</option>
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleResetFilters}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset Filter
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {products.length === 0 && !isLoading ? (
          <div className="p-8 text-center">
            <Box className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-1">
              Tidak ada produk
            </h3>
            <p className="text-gray-500 mb-4">
              Belum ada produk yang tersedia atau tidak ada yang cocok dengan
              pencarian Anda.
            </p>
            <button
              onClick={handleAddProduct}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg inline-flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Produk Pertama
            </button>
          </div>
        ) : (
          <Table
            columns={columns}
            data={products}
            isLoading={isLoading}
            emptyMessage="Tidak ada produk yang tersedia"
            onRowClick={(row) => handleViewProduct(row.id)}
            pagination={paginationConfig}
            onPageChange={handlePageChange}
            usePagination={true}
            className="w-full"
            tableClassName="divide-y divide-gray-200"
          />
        )}
      </div>
    </div>
  );
};

export default ProductMasterList;
