import React, { useState } from "react";
import {
  Search,
  FileText,
  Calendar,
  Eye,
  Download,
  Filter,
  Mail,
  RefreshCcw,
  Plus,
  Check,
  Clock,
  AlertTriangle,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { useCabang } from "../../../features/cabang/hooks/useCabang";
import toast from "react-hot-toast";
import { useInvoiceList } from "../hooks/useInvoices";

// Formatter untuk uang
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

// Component utama
const InvoiceManagement = () => {
  const navigate = useNavigate();
  const { selectedCabang, cabangList = [] } = useCabang();

  // Filter state
  const [filters, setFilters] = useState({
    startDate: dayjs().subtract(30, "day"),
    endDate: dayjs(),
    cabangId: "all", // Default to all cabang
    status: "all",
    search: "",
  });

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Fetch invoices using React Query
  const {
    data: invoicesData,
    isLoading,
    error
  } = useInvoiceList(filters, page, rowsPerPage);

  // Extract data from query results
  const invoices = invoicesData?.data || [];
  const pagination = invoicesData?.pagination || {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  };

  // Handle error
  React.useEffect(() => {
    if (error) {
      toast.error("Gagal memuat data invoice");
      console.error("Error fetching invoices:", error);
    }
  }, [error]);

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
    // React Query will automatically refetch when dependencies change
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      startDate: dayjs().subtract(30, "day"),
      endDate: dayjs(),
      cabangId: "all",
      status: "all",
      search: "",
    });
    setPage(0);
  };

  // View invoice detail
  const viewInvoiceDetail = (invoiceId) => {
    navigate(`/superadmin/invoices/${invoiceId}`);
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    let className;
    let icon;

    switch (status) {
      case "LUNAS":
        className = "bg-green-100 text-green-800";
        icon = <Check size={14} className="mr-1" />;
        break;
      case "BELUM_LUNAS":
        className = "bg-yellow-100 text-yellow-800";
        icon = <Clock size={14} className="mr-1" />;
        break;
      case "JATUH_TEMPO":
        className = "bg-red-100 text-red-800";
        icon = <AlertTriangle size={14} className="mr-1" />;
        break;
      case "DIBATALKAN":
        className = "bg-gray-100 text-gray-800";
        icon = <X size={14} className="mr-1" />;
        break;
      default:
        className = "bg-gray-100 text-gray-800";
        icon = null;
    }

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${className}`}
      >
        {icon}
        {status.replace("_", " ")}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manajemen Invoice</h1>
        <p className="mt-1 text-sm text-gray-500">
          Kelola semua invoice untuk transaksi penjualan
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Filter</h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range */}
            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Tanggal Mulai
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="startDate"
                  value={filters.startDate.format("YYYY-MM-DD")}
                  onChange={(e) =>
                    handleFilterChange("startDate", dayjs(e.target.value))
                  }
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Tanggal Akhir
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="endDate"
                  value={filters.endDate.format("YYYY-MM-DD")}
                  onChange={(e) =>
                    handleFilterChange("endDate", dayjs(e.target.value))
                  }
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Cabang */}
            <div>
              <label
                htmlFor="cabangId"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Cabang
              </label>
              <select
                id="cabangId"
                value={filters.cabangId}
                onChange={(e) => handleFilterChange("cabangId", e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="all">Semua Cabang</option>
                {cabangList.map((cabang) => (
                  <option key={cabang.id} value={cabang.id}>
                    {cabang.namaCabang}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Status
              </label>
              <select
                id="status"
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="all">Semua Status</option>
                <option value="LUNAS">Lunas</option>
                <option value="BELUM_LUNAS">Belum Lunas</option>
                <option value="JATUH_TEMPO">Jatuh Tempo</option>
                <option value="DIBATALKAN">Dibatalkan</option>
              </select>
            </div>
          </div>

          {/* Search and Buttons */}
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Cari nomor invoice, transaksi, atau pelanggan..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={applyFilters}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </button>
              <button
                onClick={resetFilters}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <RefreshCcw className="h-4 w-4 mr-2" />
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 flex justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/superadmin/invoices/create")}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Buat Invoice
          </button>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Nomor Invoice
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
                  Nomor Transaksi
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
                  Pelanggan
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
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Memuat data invoice...
                    </p>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center">
                    <FileText className="mx-auto h-10 w-10 text-gray-300" />
                    <p className="mt-2 text-sm text-gray-500">
                      Tidak ada data invoice
                    </p>
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invoice.nomorInvoice}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(
                        new Date(invoice.tanggalInvoice),
                        "dd MMM yyyy",
                        {
                          locale: id,
                        }
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.transaksi?.nomorTransaksi || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.cabang?.namaCabang || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.pelanggan?.namaPelanggan || "Pelanggan Umum"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                      {formatCurrency(invoice.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <StatusBadge status={invoice.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => viewInvoiceDetail(invoice.id)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Lihat Detail"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => navigate(`/superadmin/invoices/${invoice.id}/pdf`)}
                          className="text-green-600 hover:text-green-900"
                          title="Download PDF"
                        >
                          <Download className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => navigate(`/superadmin/invoices/${invoice.id}/send`)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Kirim Email"
                        >
                          <Mail className="h-5 w-5" />
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
        <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(old => Math.max(0, old - 1))}
              disabled={page === 0 || isLoading}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {page + 1} of {pagination.totalPages || 1}
            </span>
            <button
              onClick={() => setPage(old => old + 1)}
              disabled={page + 1 >= pagination.totalPages || isLoading}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="text-sm text-gray-500">
            Menampilkan {invoices.length} dari {pagination.total || 0} invoice
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceManagement;
