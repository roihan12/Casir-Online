import React, { useState, useEffect } from "react";
import {
  Calendar,
  FileText,
  Clock,
  User,
  DollarSign,
  Search,
  Download,
  ShoppingCart,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import { useCabang } from "@features/cabang/hooks/useCabang";
import api from "@common/utils/api";
import Table from "@features/common/Table";
import CabangIndicator from "@features/cabang/components/CabangIndicator";
import formatCurrency from "@common/utils/formatCurrency";
import formatDate from "@common/utils/formatDate";

const ShiftReports = () => {
  const { selectedCabang } = useCabang();
  const [shifts, setShifts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState("waktuMulai");
  const [sortDirection, setSortDirection] = useState("desc");

  // Pagination
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Summary stats
  const [summary, setSummary] = useState({
    totalShifts: 0,
    totalTransactions: 0,
    totalRevenue: 0,
  });

  const fetchShiftReports = async (page = 1) => {
    if (!selectedCabang?.id) return;

    setIsLoading(true);
    try {
      const response = await api.get(`/shifts/reports`, {
        params: {
          cabangId: selectedCabang.id,
          page,
          limit: pagination.itemsPerPage,
          search: searchQuery || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          sortBy: sortField || "waktuMulai",
          sortDirection: sortDirection || "desc",
        },
      });

      setShifts(response.data.data);
      setPagination({
        totalItems: response.data.meta.totalItems,
        totalPages: response.data.meta.totalPages,
        currentPage: response.data.meta.currentPage,
        itemsPerPage: response.data.meta.itemsPerPage,
        hasNextPage: response.data.meta.hasNextPage,
        hasPrevPage: response.data.meta.hasPrevPage,
      });

      // Update summary
      setSummary({
        totalShifts: response.data.meta.totalItems,
        totalTransactions: response.data.summary?.totalTransactions || 0,
        totalRevenue: response.data.summary?.totalRevenue || 0,
      });

      setError(null);
    } catch (err) {
      console.error("Error fetching shift reports:", err);
      setError("Gagal mengambil laporan shift. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShiftReports();
  }, [selectedCabang?.id]);

  const handlePageChange = (newPage) => {
    fetchShiftReports(newPage);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchShiftReports(1);
  };

  const handleFilter = () => {
    fetchShiftReports(1);
  };

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    fetchShiftReports(1);
  };

  const handleViewShiftDetails = (shift) => {
    // Navigate to shift detail page - this would be implemented
    console.log("View shift report details for:", shift.id);
  };

  const handleExportReport = () => {
    // Export report functionality - this would be implemented
    console.log("Exporting shift reports");
  };

  const columns = [
    {
      header: "Kasir",
      accessor: "user",
      cell: (row) => (
        <div className="flex items-center">
          <User size={16} className="mr-2 text-gray-500" />
          <span>{row.user?.namaLengkap || "Tidak tersedia"}</span>
        </div>
      ),
    },
    {
      header: "Waktu Mulai",
      accessor: "waktuMulai",
      cell: (row) => (
        <div className="flex items-center">
          <Clock size={16} className="mr-2 text-gray-500" />
          <span>{formatDate(row.waktuMulai)}</span>
        </div>
      ),
    },
    {
      header: "Waktu Selesai",
      accessor: "waktuSelesai",
      cell: (row) => (
        <div className="flex items-center">
          <Clock size={16} className="mr-2 text-gray-500" />
          <span>{row.waktuSelesai ? formatDate(row.waktuSelesai) : "-"}</span>
        </div>
      ),
    },
    {
      header: "Kas Awal",
      accessor: "kasAwal",
      cell: (row) => (
        <div className="flex items-center">
          <DollarSign size={16} className="mr-2 text-gray-500" />
          <span>{formatCurrency(row.kasAwal)}</span>
        </div>
      ),
    },
    {
      header: "Kas Akhir",
      accessor: "kasAkhir",
      cell: (row) => (
        <div className="flex items-center">
          <DollarSign size={16} className="mr-2 text-gray-500" />
          <span>{row.kasAkhir ? formatCurrency(row.kasAkhir) : "-"}</span>
        </div>
      ),
    },
    {
      header: "Transaksi",
      accessor: "totalTransaksi",
      cell: (row) => (
        <div className="flex items-center">
          <ShoppingCart size={16} className="mr-2 text-gray-500" />
          <span>{row.totalTransaksi || 0}</span>
        </div>
      ),
    },
    {
      header: "Pendapatan",
      accessor: "totalPendapatan",
      cell: (row) => (
        <div className="flex items-center">
          <DollarSign size={16} className="mr-2 text-indigo-500" />
          <span>{formatCurrency(row.totalPendapatan || 0)}</span>
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      cell: (row) => {
        let statusColor = "gray";
        switch (row.status) {
          case "dibuka":
            statusColor = "green";
            break;
          case "ditutup":
            statusColor = "blue";
            break;
          case "disesuaikan":
            statusColor = "orange";
            break;
        }

        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${statusColor}-100 text-${statusColor}-800`}
          >
            {row.status === "dibuka"
              ? "Dibuka"
              : row.status === "ditutup"
              ? "Ditutup"
              : row.status === "disesuaikan"
              ? "Disesuaikan"
              : "Tidak diketahui"}
          </span>
        );
      },
    },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Laporan Shift
          </h1>
          <p className="text-sm text-gray-500">
            Lihat riwayat dan laporan shift di{" "}
            {selectedCabang?.namaCabang || "cabang"}
          </p>
        </div>
        <CabangIndicator size="lg" />
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center">
            <FileText size={18} className="text-indigo-500 mr-2" />
            <h2 className="text-lg font-medium">Laporan Shift</h2>
          </div>
          <button
            onClick={handleExportReport}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center text-sm font-medium hover:bg-green-700 transition-colors"
          >
            <Download size={16} className="mr-1" />
            Export Laporan
          </button>
        </div>

        <div className="p-4">
          {/* Filters */}
          <div className="flex flex-wrap items-end gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Mulai
              </label>
              <input
                type="date"
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Akhir
              </label>
              <input
                type="date"
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Semua Status</option>
                <option value="dibuka">Dibuka</option>
                <option value="ditutup">Ditutup</option>
                <option value="disesuaikan">Disesuaikan</option>
              </select>
            </div>

            <div>
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Cari berdasarkan nama kasir..."
                    className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="absolute right-0 top-0 mt-2 mr-3 text-gray-400 hover:text-gray-600"
                  >
                    <Search size={20} />
                  </button>
                </div>
              </form>
            </div>

            <button
              onClick={handleFilter}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <Filter size={16} className="mr-1" />
              Terapkan Filter
            </button>
          </div>

          <Table
            columns={columns}
            data={shifts}
            isLoading={isLoading}
            emptyMessage="Tidak ada data shift yang ditemukan"
            onRowClick={handleViewShiftDetails}
            pagination={pagination}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      {/* Summary section */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 font-medium">Total Shift</h3>
            <Clock size={20} className="text-indigo-500" />
          </div>
          <p className="text-2xl font-semibold text-gray-800">
            {summary.totalShifts}
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 font-medium">Total Transaksi</h3>
            <ShoppingCart size={20} className="text-indigo-500" />
          </div>
          <p className="text-2xl font-semibold text-gray-800">
            {summary.totalTransactions}
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 font-medium">Total Pendapatan</h3>
            <DollarSign size={20} className="text-indigo-500" />
          </div>
          <p className="text-2xl font-semibold text-gray-800">
            {formatCurrency(summary.totalRevenue)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShiftReports;
