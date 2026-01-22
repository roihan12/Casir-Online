import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Tag,
  Filter,
  RefreshCw,
  Calendar,
  CheckCircle,
  XCircle,
  FileText,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Download,
  ArrowUpDown,
  Percent,
  DollarSign,
} from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { format } from "date-fns";
import promoService from "../../../services/promoService";
import { useCabang } from "../../../features/cabang/hooks/useCabang";

const DiscountManagement = () => {
  const navigate = useNavigate();
  const { selectedCabang } = useCabang();
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    tipeDiskon: "all",
    kategoriId: "",
    page: 1,
    limit: 10,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState({ field: "createdAt", direction: "desc" });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [categories, setCategories] = useState([]);

  // Fetch discounts data
  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      // Add cabangId and type filter for discounts to filters
      const apiFilters = {
        ...filters,
        cabangId: selectedCabang?.isGlobalView ? null : selectedCabang?.id,
        // Filter to only persentase and nominal discount types
        tipeDiskon:
          filters.tipeDiskon === "all"
            ? ["persentase", "nominal"]
            : [filters.tipeDiskon],
      };

      // Mock data for now since the API doesn't exist yet
      const mockData = generateMockDiscounts();

      setDiscounts(mockData.data);
      setPagination({
        currentPage: mockData.page,
        totalPages: mockData.totalPages,
        totalItems: mockData.totalItems,
      });
    } catch (error) {
      console.error("Error fetching discounts:", error);
      toast.error("Gagal memuat data diskon");
    } finally {
      setLoading(false);
    }
  };

  // Mock categories
  const fetchCategories = async () => {
    // Mock categories for now
    const mockCategories = [
      { id: "cat1", namaKategori: "Makanan" },
      { id: "cat2", namaKategori: "Minuman" },
      { id: "cat3", namaKategori: "Alat Tulis" },
      { id: "cat4", namaKategori: "Elektronik" },
      { id: "cat5", namaKategori: "Rumah Tangga" },
    ];

    setCategories(mockCategories);
  };

  // Generate mock data
  const generateMockDiscounts = () => {
    const mockData = [];
    const tipeDiskonOptions = ["persentase", "nominal"];
    const statusOptions = ["aktif", "nonaktif"];
    const categoryIds = ["cat1", "cat2", "cat3", "cat4", "cat5", null];
    const productIds = ["prod1", "prod2", "prod3", "prod4", "prod5", null];

    for (let i = 1; i <= 20; i++) {
      const tipeDiskon =
        tipeDiskonOptions[Math.floor(Math.random() * tipeDiskonOptions.length)];
      const status =
        statusOptions[Math.floor(Math.random() * statusOptions.length)];
      const categoryId =
        categoryIds[Math.floor(Math.random() * categoryIds.length)];
      const productId =
        productIds[Math.floor(Math.random() * productIds.length)];
      const now = new Date();
      const startDate = new Date(
        now.setDate(now.getDate() - Math.floor(Math.random() * 30))
      );
      const endDate = new Date(
        now.setDate(now.getDate() + Math.floor(Math.random() * 60))
      );

      mockData.push({
        id: `disc-${i}`,
        namaPromo: `Diskon ${
          tipeDiskon === "persentase" ? "Persentase" : "Nominal"
        } ${i}`,
        kodePromo: `DISC${i}`,
        tipeDiskon,
        nilaiDiskon:
          tipeDiskon === "persentase"
            ? Math.floor(Math.random() * 50)
            : Math.floor(Math.random() * 100000),
        minPembelian: Math.floor(Math.random() * 200000),
        maxDiskon:
          tipeDiskon === "persentase"
            ? Math.floor(Math.random() * 100000)
            : null,
        tanggalMulai: startDate,
        tanggalBerakhir: endDate,
        limitPenggunaan: Math.floor(Math.random() * 100),
        kategoriId: categoryId,
        kategoriNama: categoryId
          ? categories.find((c) => c.id === categoryId)?.namaKategori
          : null,
        produkId: productId,
        produkNama: productId
          ? `Produk ${productId.replace("prod", "")}`
          : null,
        status,
        createdAt: new Date(
          now.setDate(now.getDate() - Math.floor(Math.random() * 90))
        ),
        updatedAt: new Date(),
      });
    }

    // Filter based on search and other filters
    let filteredData = mockData;

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredData = filteredData.filter(
        (disc) =>
          disc.namaPromo.toLowerCase().includes(searchLower) ||
          disc.kodePromo.toLowerCase().includes(searchLower)
      );
    }

    if (filters.status !== "all") {
      filteredData = filteredData.filter(
        (disc) => disc.status === filters.status
      );
    }

    if (filters.tipeDiskon !== "all") {
      filteredData = filteredData.filter(
        (disc) => disc.tipeDiskon === filters.tipeDiskon
      );
    }

    if (filters.kategoriId) {
      filteredData = filteredData.filter(
        (disc) => disc.kategoriId === filters.kategoriId
      );
    }

    // Sort data
    filteredData.sort((a, b) => {
      if (sort.direction === "asc") {
        return a[sort.field] > b[sort.field] ? 1 : -1;
      } else {
        return a[sort.field] < b[sort.field] ? 1 : -1;
      }
    });

    // Paginate
    const startIndex = (filters.page - 1) * filters.limit;
    const endIndex = startIndex + filters.limit;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      page: filters.page,
      totalPages: Math.ceil(filteredData.length / filters.limit),
      totalItems: filteredData.length,
    };
  };

  // Handle filter change
  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
  };

  // Handle sort change
  const handleSort = (field) => {
    setSort((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setFilters((prev) => ({ ...prev, page: newPage }));
    }
  };

  // Handle delete confirmation
  const confirmDelete = (discount) => {
    setSelectedDiscount(discount);
    setShowDeleteModal(true);
  };

  // Handle delete discount
  const handleDeleteDiscount = async () => {
    if (!selectedDiscount) return;

    try {
      // Implement delete API call when backend is ready
      // await promoService.deletePromo(selectedDiscount.id);

      // For now, just update the UI
      setDiscounts((prev) => prev.filter((d) => d.id !== selectedDiscount.id));
      toast.success("Diskon berhasil dihapus");
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Error deleting discount:", error);
      toast.error("Gagal menghapus diskon");
    }
  };

  // Handle status change
  const handleStatusChange = async (discount) => {
    const newStatus = discount.status === "aktif" ? "nonaktif" : "aktif";

    try {
      // Implement status change API call when backend is ready
      // await promoService.changePromoStatus(discount.id, newStatus);

      // For now, just update the UI
      setDiscounts((prev) =>
        prev.map((d) =>
          d.id === discount.id ? { ...d, status: newStatus } : d
        )
      );

      toast.success(`Status diskon berhasil diubah menjadi ${newStatus}`);
    } catch (error) {
      console.error("Error changing discount status:", error);
      toast.error("Gagal mengubah status diskon");
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format discount value based on type
  const formatDiskonValue = (discount) => {
    if (discount.tipeDiskon === "persentase") {
      return `${discount.nilaiDiskon}%`;
    } else if (discount.tipeDiskon === "nominal") {
      return formatCurrency(discount.nilaiDiskon);
    }
    return "-";
  };

  // Format dates
  const formatDate = (date) => {
    if (!date) return "-";
    return format(new Date(date), "dd MMM yyyy");
  };

  // Get discount target display
  const getDiscountTarget = (discount) => {
    if (discount.kategoriId) {
      return `Kategori: ${discount.kategoriNama || discount.kategoriId}`;
    } else if (discount.produkId) {
      return `Produk: ${discount.produkNama || discount.produkId}`;
    } else {
      return "Semua Produk";
    }
  };

  // Load discounts on component mount and when filters or sort change
  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchDiscounts();
  }, [filters, sort, selectedCabang, categories]);

  // Add handleCreateDiscount function
  const handleCreateDiscount = () => {
    navigate("/superadmin/promos/discounts/create");
  };

  // Add handleEditDiscount function
  const handleEditDiscount = (id) => {
    navigate(`/superadmin/promos/discounts/edit/${id}`);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          Manajemen Diskon
        </h1>
        <div className="flex space-x-2">
          <button
            onClick={handleCreateDiscount}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700"
          >
            <Plus size={16} className="mr-2" />
            Tambah Diskon
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                className="pl-10 pr-4 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Cari diskon atau kode diskon..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50"
              >
                <Filter size={18} />
                <span>Filter</span>
                {showFilters ? (
                  <ChevronUp size={18} />
                ) : (
                  <ChevronDown size={18} />
                )}
              </button>
              <button
                onClick={fetchDiscounts}
                className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50"
              >
                <RefreshCw size={18} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50">
                <Download size={18} />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>

          {/* Advanced filters */}
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                >
                  <option value="all">Semua Status</option>
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipe Diskon
                </label>
                <select
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={filters.tipeDiskon}
                  onChange={(e) =>
                    handleFilterChange("tipeDiskon", e.target.value)
                  }
                >
                  <option value="all">Semua Tipe</option>
                  <option value="persentase">Persentase</option>
                  <option value="nominal">Nominal</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategori
                </label>
                <select
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={filters.kategoriId}
                  onChange={(e) =>
                    handleFilterChange("kategoriId", e.target.value)
                  }
                >
                  <option value="">Semua Kategori</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.namaKategori}
                    </option>
                  ))}
                </select>
              </div>
            </motion.div>
          )}
        </div>

        {/* Data table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                  <div
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => handleSort("namaPromo")}
                  >
                    <span>Nama Diskon</span>
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                  <div
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => handleSort("kodePromo")}
                  >
                    <span>Kode Diskon</span>
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                  Tipe
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                  Nilai
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                  Target
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                  <div
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => handleSort("tanggalMulai")}
                  >
                    <span>Periode</span>
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-4 py-12 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center">
                      <RefreshCw
                        size={40}
                        className="animate-spin mb-2 text-indigo-500"
                      />
                      <span>Memuat data diskon...</span>
                    </div>
                  </td>
                </tr>
              ) : discounts.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-4 py-12 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center">
                      <FileText size={40} className="mb-2 text-gray-400" />
                      <span>Tidak ada data diskon</span>
                      <p className="text-sm mt-1">
                        {filters.search
                          ? "Coba ubah filter pencarian"
                          : "Tambah diskon baru untuk mulai"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                discounts.map((discount) => (
                  <tr key={discount.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">
                        {discount.namaPromo}
                      </div>
                      <div className="text-xs text-gray-500">
                        Min. {formatCurrency(discount.minPembelian || 0)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                        {discount.kodePromo}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          discount.tipeDiskon === "persentase"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {discount.tipeDiskon === "persentase" ? (
                          <Percent size={12} className="mr-1" />
                        ) : (
                          <DollarSign size={12} className="mr-1" />
                        )}
                        {discount.tipeDiskon === "persentase"
                          ? "Persentase"
                          : "Nominal"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {formatDiskonValue(discount)}
                      </div>
                      {discount.tipeDiskon === "persentase" &&
                        discount.maxDiskon && (
                          <div className="text-xs text-gray-500">
                            Maks. {formatCurrency(discount.maxDiskon)}
                          </div>
                        )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        {getDiscountTarget(discount)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <Calendar size={14} className="mr-1 text-gray-500" />
                        <div>
                          <div className="text-sm">
                            {formatDate(discount.tanggalMulai)}
                          </div>
                          <div className="text-xs text-gray-500">
                            s/d {formatDate(discount.tanggalBerakhir)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          discount.status === "aktif"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {discount.status === "aktif" ? (
                          <CheckCircle size={12} className="mr-1" />
                        ) : (
                          <XCircle size={12} className="mr-1" />
                        )}
                        {discount.status === "aktif" ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            navigate(
                              `/superadmin/promos/discounts/${discount.id}`
                            )
                          }
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="Lihat Detail"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleEditDiscount(discount.id)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleStatusChange(discount)}
                          className={`p-1 ${
                            discount.status === "aktif"
                              ? "text-red-600 hover:text-red-800"
                              : "text-green-600 hover:text-green-800"
                          }`}
                          title={
                            discount.status === "aktif"
                              ? "Nonaktifkan"
                              : "Aktifkan"
                          }
                        >
                          {discount.status === "aktif" ? (
                            <XCircle size={18} />
                          ) : (
                            <CheckCircle size={18} />
                          )}
                        </button>
                        <button
                          onClick={() => confirmDelete(discount)}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="Hapus"
                        >
                          <Trash2 size={18} />
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
        {!loading && discounts.length > 0 && (
          <div className="px-4 py-3 border-t flex flex-col sm:flex-row items-center justify-between">
            <div className="text-sm text-gray-500 mb-3 sm:mb-0">
              Menampilkan {(pagination.currentPage - 1) * filters.limit + 1} -{" "}
              {Math.min(
                pagination.currentPage * filters.limit,
                pagination.totalItems
              )}{" "}
              dari {pagination.totalItems} diskon
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(1)}
                disabled={pagination.currentPage === 1}
                className={`px-3 py-1 rounded border ${
                  pagination.currentPage === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "hover:bg-gray-50"
                }`}
              >
                Pertama
              </button>
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className={`px-3 py-1 rounded border ${
                  pagination.currentPage === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "hover:bg-gray-50"
                }`}
              >
                Sebelumnya
              </button>
              <span className="px-3 py-1">
                {pagination.currentPage} / {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className={`px-3 py-1 rounded border ${
                  pagination.currentPage === pagination.totalPages
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "hover:bg-gray-50"
                }`}
              >
                Selanjutnya
              </button>
              <button
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={pagination.currentPage === pagination.totalPages}
                className={`px-3 py-1 rounded border ${
                  pagination.currentPage === pagination.totalPages
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "hover:bg-gray-50"
                }`}
              >
                Terakhir
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center mb-4 text-red-600">
              <AlertCircle size={24} className="mr-2" />
              <h3 className="text-lg font-semibold">Konfirmasi Penghapusan</h3>
            </div>
            <p className="mb-6">
              Apakah Anda yakin ingin menghapus diskon{" "}
              <span className="font-semibold">
                {selectedDiscount?.namaPromo}
              </span>
              ? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteDiscount}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscountManagement;
