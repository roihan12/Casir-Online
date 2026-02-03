import React, { useState, useMemo } from "react";
import {
  Search,
  FileText,
  Calendar,
  RefreshCcw,
  Eye,
  Download,
  Filter,
  ShoppingCart,
  ArrowLeft,
  ArrowUpCircle,
  ArrowDownCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { useCabang } from "@features/cabang/hooks/useCabang";
import toast from "react-hot-toast";
import { useReturList } from "../hooks/useReturQueries";

// Formatter untuk uang
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

// Component utama
const GlobalReturns = () => {
  const navigate = useNavigate();
  const { selectedCabang, cabangList = [] } = useCabang();

  // State untuk filter dan pagination
  const [filters, setFilters] = useState({
    startDate: dayjs().subtract(30, "day"),
    endDate: dayjs(),
    cabangId: "all",
    jenisRetur: "all", // RETUR_PENJUALAN atau RETUR_PEMBELIAN
    statusPembayaran: "all",
    search: "",
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Build query params for API
  const queryParams = useMemo(() => ({
    startDate: appliedFilters.startDate.format("YYYY-MM-DD"),
    endDate: appliedFilters.endDate.format("YYYY-MM-DD"),
    cabangId: appliedFilters.cabangId !== "all" ? appliedFilters.cabangId : undefined,
    jenisTransaksi: appliedFilters.jenisRetur !== "all" 
      ? appliedFilters.jenisRetur 
      : ["RETUR_PENJUALAN", "RETUR_PEMBELIAN"],
    statusPembayaran: appliedFilters.statusPembayaran !== "all" 
      ? appliedFilters.statusPembayaran 
      : undefined,
    search: appliedFilters.search || undefined,
    page: page + 1,
    limit: rowsPerPage,
  }), [appliedFilters, page, rowsPerPage]);

  // Fetch returns using React Query
  const { data: returnsData, isLoading: loading, isError, error, refetch } = useReturList(queryParams);

  // Extract data from response
  const returns = returnsData?.transactions || [];
  const totalReturns = returnsData?.meta?.total || 0;



  // Handle filter changes
  const handleFilterChange = (name, value) => {
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  // Apply filters
  const applyFilters = () => {
    setPage(0); // Reset to first page when applying filters
    setAppliedFilters(filters);
  };

  // Reset filters
  const resetFilters = () => {
    const defaultFilters = {
      startDate: dayjs().subtract(30, "day"),
      endDate: dayjs(),
      cabangId: "all",
      jenisRetur: "all",
      statusPembayaran: "all",
      search: "",
    };
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    setPage(0);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // View return detail
  const viewReturnDetail = (returnId) => {
    navigate(`/returns/${returnId}`);
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    let className;

    switch (status) {
      case "LUNAS":
        className = "bg-green-100 text-green-800";
        break;
      case "BELUM_LUNAS":
        className = "bg-yellow-100 text-yellow-800";
        break;
      case "DIBATALKAN":
        className = "bg-red-100 text-red-800";
        break;
      default:
        className = "bg-gray-100 text-gray-800";
    }

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${className}`}
      >
        {status.replace("_", " ")}
      </span>
    );
  };

  // Return type badge component
  const ReturnTypeBadge = ({ type }) => {
    let className;
    let icon;

    switch (type) {
      case "RETUR_PENJUALAN":
        className = "text-amber-600 border-amber-600";
        icon = <RefreshCcw size={14} className="mr-1" />;
        break;
      case "RETUR_PEMBELIAN":
        className = "text-red-600 border-red-600";
        icon = <RefreshCcw size={14} className="mr-1" />;
        break;
      default:
        className = "text-gray-600 border-gray-600";
        icon = null;
    }

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${className}`}
      >
        {icon}
        {type.replace("RETUR_", "").replace("_", " ")}
      </span>
    );
  };


  return (
    <div className="w-full p-6">
      {/* Dashboard Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-800">
          Manajemen Retur
        </h1>
        <p className="text-sm text-gray-600">
          Pengelolaan data retur penjualan dan pembelian di semua cabang
        </p>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-800 flex items-center">
            <Filter className="h-5 w-5 mr-2 text-gray-500" />
            Filter Data
          </h2>
          <button
            onClick={resetFilters}
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            Reset Filter
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Filter Periode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Periode Awal
            </label>
            <div className="relative">
              <input
                type="date"
                className="w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                value={filters.startDate.format("YYYY-MM-DD")}
                onChange={(e) =>
                  handleFilterChange("startDate", dayjs(e.target.value))
                }
              />
              <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Periode Akhir
            </label>
            <div className="relative">
              <input
                type="date"
                className="w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                value={filters.endDate.format("YYYY-MM-DD")}
                onChange={(e) =>
                  handleFilterChange("endDate", dayjs(e.target.value))
                }
              />
              <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Filter Cabang */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cabang
            </label>
            <select
              className="w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
              value={filters.cabangId}
              onChange={(e) => handleFilterChange("cabangId", e.target.value)}
            >
              <option value="all">Semua Cabang</option>
              {cabangList.map((cabang) => (
                <option key={cabang.id} value={cabang.id}>
                  {cabang.namaCabang}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Jenis Retur */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jenis Retur
            </label>
            <select
              className="w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
              value={filters.jenisRetur}
              onChange={(e) => handleFilterChange("jenisRetur", e.target.value)}
            >
              <option value="all">Semua Jenis</option>
              <option value="RETUR_PENJUALAN">Retur Penjualan</option>
              <option value="RETUR_PEMBELIAN">Retur Pembelian</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Filter Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              className="w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
              value={filters.statusPembayaran}
              onChange={(e) =>
                handleFilterChange("statusPembayaran", e.target.value)
              }
            >
              <option value="all">Semua Status</option>
              <option value="LUNAS">Lunas</option>
              <option value="BELUM_LUNAS">Belum Lunas</option>
              <option value="DIBATALKAN">Dibatalkan</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pencarian
            </label>
            <div className="relative rounded-md shadow-sm">
              <input
                type="text"
                className="w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                placeholder="Cari nomor transaksi, nama pelanggan/supplier, alasan retur..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && applyFilters()}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={applyFilters}
            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Terapkan Filter
          </button>
        </div>
      </div>

      {/* Create Return Button */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/returns/create")}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Buat Retur Baru
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Daftar Retur</h3>
        </div>

        {loading ? (
          <div className="p-6 flex justify-center">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
              <p className="mt-2 text-gray-500">Memuat data...</p>
            </div>
          </div>
        ) : isError ? (
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    {error?.response?.data?.message || "Gagal memuat data retur. Silakan coba lagi."}
                  </h3>
                </div>
              </div>
            </div>
          </div>
        ) : returns.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">
              Tidak ada data retur yang ditemukan.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    No. Retur
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Tanggal
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Jenis
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    No. Transaksi
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
                    Pelanggan/Supplier
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Total
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {returns.map((returnItem) => (
                  <tr
                    key={returnItem.transaksi_id}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {returnItem.nomor_transaksi}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(
                        new Date(returnItem.tanggal),
                        "dd MMM yyyy HH:mm",
                        {
                          locale: id,
                        }
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <ReturnTypeBadge type={returnItem.jenis_transaksi} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {returnItem.transaksi_asli?.nomor_transaksi || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {returnItem.cabang?.namaCabang || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {returnItem.jenis_transaksi === "RETUR_PENJUALAN"
                        ? returnItem.pelanggan?.namaPelanggan ||
                          "Pelanggan Umum"
                        : returnItem.supplier?.namaSupplier || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                      {formatCurrency(returnItem.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <StatusBadge status={returnItem.status_pembayaran} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() =>
                          viewReturnDetail(returnItem.transaksi_id)
                        }
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() =>
                          toast.success("Fitur cetak akan segera tersedia")
                        }
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-sm text-gray-700">
              Tampilkan{" "}
              <select
                className="mx-1 rounded-md border-gray-300 text-base focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={rowsPerPage}
                onChange={handleRowsPerPageChange}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>{" "}
              data per halaman
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 0}
              className={`px-3 py-1 rounded-md ${
                page === 0
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              } border border-gray-300`}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-gray-700">
              Halaman {page + 1} dari{" "}
              {Math.max(1, Math.ceil(totalReturns / rowsPerPage))}
            </span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={(page + 1) * rowsPerPage >= totalReturns}
              className={`px-3 py-1 rounded-md ${
                (page + 1) * rowsPerPage >= totalReturns
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              } border border-gray-300`}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalReturns;
