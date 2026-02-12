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
} from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { format } from "date-fns";
import promoService from "../../../services/promoService";
import { useCabang } from "@features/cabang/hooks/useCabang";

const PromoManagement = () => {
  const navigate = useNavigate();
  const { selectedCabang } = useCabang();
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    tipeDiskon: "all",
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
  const [selectedPromo, setSelectedPromo] = useState(null);

  // Fetch promos data
  const fetchPromos = async () => {
    setLoading(true);
    try {
      // Add cabangId to filters if a cabang is selected
      const apiFilters = {
        ...filters,
        cabangId: selectedCabang?.isGlobalView ? null : selectedCabang?.id,
      };

      // Filter out "all" values for status and tipeDiskon
      if (apiFilters.status === "all") {
        delete apiFilters.status;
      }
      if (apiFilters.tipeDiskon === "all") {
        delete apiFilters.tipeDiskon;
      }
      if (!apiFilters.search) {
        delete apiFilters.search;
      }

      const response = await promoService.getAllPromos(apiFilters);

      setPromos(response.data || []);
      setPagination({
        currentPage: response.pagination?.currentPage || 1,
        totalPages: response.pagination?.totalPages || 1,
        totalItems: response.pagination?.totalItems || 0,
      });
    } catch (error) {
      console.error("Error fetching promos:", error);
      toast.error(error.response?.data?.message || "Gagal memuat data promo dan diskon");
    } finally {
      setLoading(false);
    }
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
  const confirmDelete = (promo) => {
    setSelectedPromo(promo);
    setShowDeleteModal(true);
  };

  // Handle delete promo
  const handleDeletePromo = async () => {
    if (!selectedPromo) return;

    try {
      await promoService.deletePromo(selectedPromo.id);

      // Refresh the promos list
      await fetchPromos();
      toast.success("Promo berhasil dihapus");
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Error deleting promo:", error);
      toast.error(error.response?.data?.message || "Gagal menghapus promo");
    }
  };

  // Handle status change
  const handleStatusChange = async (promo) => {
    const newStatus = promo.status === "aktif" ? "tidak_aktif" : "aktif";

    try {
      await promoService.changePromoStatus(promo.id, newStatus);

      // Update the local state
      setPromos((prev) =>
        prev.map((p) => (p.id === promo.id ? { ...p, status: newStatus } : p))
      );

      toast.success(`Status promo berhasil diubah menjadi ${newStatus === "aktif" ? "Aktif" : "Nonaktif"}`);
    } catch (error) {
      console.error("Error changing promo status:", error);
      toast.error(error.response?.data?.message || "Gagal mengubah status promo");
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
  const formatDiskonValue = (promo) => {
    if (promo.tipeDiskon === "PERSENTASE") {
      return `${promo.nilaiDiskon}%`;
    } else if (promo.tipeDiskon === "NOMINAL") {
      return formatCurrency(promo.nilaiDiskon);
    } else if (promo.tipeDiskon === "BUY_X_GET_Y") {
      return "Beli 1 Gratis 1";
    } else if (promo.tipeDiskon === "VOUCHER") {
      return formatCurrency(promo.nilaiDiskon);
    } else if (promo.tipeDiskon === "CASHBACK") {
      return formatCurrency(promo.maxDiskon);
    } else if (promo.tipeDiskon === "BUNDLE") {
      return "Paket Bundling";
    }
    return "-";
  };

  // Format dates
  const formatDate = (date) => {
    if (!date) return "-";
    return format(new Date(date), "dd MMM yyyy");
  };

  // Load promos on component mount and when filters or sort change
  useEffect(() => {
    fetchPromos();
  }, [filters, sort, selectedCabang]);

  // Add handleCreatePromo function
  const handleCreatePromo = () => {
    navigate("/promos/create");
  };

  // Add handleEditPromo function
  const handleEditPromo = (id) => {
    navigate(`/promos/edit/${id}`);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          Manajemen Promo
        </h1>
        <div className="flex space-x-2">
          <button
            onClick={handleCreatePromo}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700"
          >
            <Plus size={16} className="mr-2" />
            Tambah Promo
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
                placeholder="Cari promo atau kode promo..."
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
                onClick={fetchPromos}
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
                  <option value="tidak_aktif">Nonaktif</option>
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
                  <option value="bogo">Beli 1 Gratis 1</option>
                  <option value="bundle">Bundling</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jumlah per halaman
                </label>
                <select
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={filters.limit}
                  onChange={(e) =>
                    handleFilterChange("limit", parseInt(e.target.value))
                  }
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
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
                    <span>Nama Promo</span>
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                  <div
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => handleSort("kodePromo")}
                  >
                    <span>Kode Promo</span>
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                  Tipe Diskon
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                  Nilai Diskon
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
                    colSpan="7"
                    className="px-4 py-12 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center">
                      <RefreshCw
                        size={40}
                        className="animate-spin mb-2 text-indigo-500"
                      />
                      <span>Memuat data promo...</span>
                    </div>
                  </td>
                </tr>
              ) : promos.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-4 py-12 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center">
                      <FileText size={40} className="mb-2 text-gray-400" />
                      <span>Tidak ada data promo</span>
                      <p className="text-sm mt-1">
                        {filters.search
                          ? "Coba ubah filter pencarian"
                          : "Tambah promo baru untuk mulai"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                promos.map((promo) => (
                  <tr key={promo.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">
                        {promo.namaPromo}
                      </div>
                      <div className="text-xs text-gray-500">
                        Min. {formatCurrency(promo.minPembelian || 0)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                        {promo.kodePromo}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          promo.tipeDiskon === "PERSENTASE"
                            ? "bg-blue-100 text-blue-800"
                            : promo.tipeDiskon === "NOMINAL"
                            ? "bg-green-100 text-green-800"
                            : promo.tipeDiskon === "BUY_X_GET_Y"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        <Tag size={12} className="mr-1" />
                        {promo.tipeDiskon === "PERSENTASE"
                          ? "Persentase"
                          : promo.tipeDiskon === "NOMINAL"
                          ? "Nominal"
                          : promo.tipeDiskon === "BUY_X_GET_Y"
                          ? "Beli 1 Gratis 1"
                          : promo.tipeDiskon === "VOUCHER"
                          ? "Voucher"
                          : promo.tipeDiskon === "CASHBACK"
                          ? "Cashback"
                          : "Bundling"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {formatDiskonValue(promo)}
                      </div>
                      {promo.tipeDiskon === "persentase" && promo.maxDiskon && (
                        <div className="text-xs text-gray-500">
                          Maks. {formatCurrency(promo.maxDiskon)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <Calendar size={14} className="mr-1 text-gray-500" />
                        <div>
                          <div className="text-sm">
                            {formatDate(promo.tanggalMulai)}
                          </div>
                          <div className="text-xs text-gray-500">
                            s/d {formatDate(promo.tanggalBerakhir)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          promo.status === "aktif"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {promo.status === "aktif" ? (
                          <CheckCircle size={12} className="mr-1" />
                        ) : (
                          <XCircle size={12} className="mr-1" />
                        )}
                        {promo.status === "aktif" ? "Aktif" : "Tidak Aktif"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            navigate(`/promos/${promo.id}`)
                          }
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="Lihat Detail"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleEditPromo(promo.id)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleStatusChange(promo)}
                          className={`p-1 ${
                            promo.status === "aktif"
                              ? "text-red-600 hover:text-red-800"
                              : "text-green-600 hover:text-green-800"
                          }`}
                          title={
                            promo.status === "aktif"
                              ? "Nonaktifkan"
                              : "Aktifkan"
                          }
                        >
                          {promo.status === "aktif" ? (
                            <XCircle size={18} />
                          ) : (
                            <CheckCircle size={18} />
                          )}
                        </button>
                        <button
                          onClick={() => confirmDelete(promo)}
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
        {!loading && promos.length > 0 && (
          <div className="px-4 py-3 border-t flex flex-col sm:flex-row items-center justify-between">
            <div className="text-sm text-gray-500 mb-3 sm:mb-0">
              Menampilkan {(pagination.currentPage - 1) * filters.limit + 1} -{" "}
              {Math.min(
                pagination.currentPage * filters.limit,
                pagination.totalItems
              )}{" "}
              dari {pagination.totalItems} promo
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
              Apakah Anda yakin ingin menghapus promo{" "}
              <span className="font-semibold">{selectedPromo?.namaPromo}</span>?
              Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleDeletePromo}
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

export default PromoManagement;
