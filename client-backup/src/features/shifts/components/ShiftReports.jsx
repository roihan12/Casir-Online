import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { useCabang } from "@features/cabang/hooks/useCabang";
import { useShiftReport } from "../hooks/useShiftQueries";
import Table from "@features/common/Table";
import CabangIndicator from "@features/cabang/components/CabangIndicator";
import formatCurrency from "@common/utils/formatCurrency";
import formatDate from "@common/utils/formatDate";

const ShiftReports = () => {
  const navigate = useNavigate();
  const { selectedCabang } = useCabang();
  
  // Helper to get today's date in YYYY-MM-DD format
  const getToday = () => new Date().toISOString().split('T')[0];
  
  // Helper to get first day of month in YYYY-MM-DD
  const getFirstDayOfMonth = () => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
  };

  // Filter states
  const [filters, setFilters] = useState({
    startDate: getFirstDayOfMonth(),
    endDate: getToday(),
    search: "",
    status: "",
    page: 1,
    limit: 10,
  });

  const [searchInput, setSearchInput] = useState("");

  const { data: reportData, isLoading, isError } = useShiftReport({
    ...filters,
    cabangId: selectedCabang?.id,
  });

  console.log(reportData);



  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, search: searchInput, page: 1 }));
  };

  const handleStatusChange = (e) => {
    setFilters((prev) => ({ ...prev, status: e.target.value, page: 1 }));
  };

  const handleDateChange = (type, value) => {
    setFilters((prev) => ({ ...prev, [type]: value, page: 1 }));
  };

  const handleViewShiftDetails = (shift) => {
    navigate(`/shifts/detail/${shift.id}`);
  };

  const handleExportReport = () => {
    // In a real app, this would call an endpoint that returns a CSV/Excel
    console.log("Exporting shift reports with filters:", filters);
    alert("Fitur ekspor laporan sedang dalam pengembangan.");
  };

  const shifts = reportData?.data || [];
  const meta = reportData?.meta || { totalItems: 0, totalPages: 1, currentPage: 1 };
  const summary = reportData?.summary || { totalShifts: 0, totalTransactions: 0, totalRevenue: 0 };

  
  const columns = [
    {
      header: "Kasir",
      accessor: "user",
      cell: (row) => (
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 mr-3 font-bold text-xs">
            {row.user?.namaLengkap?.charAt(0) || "U"}
          </div>
          <span className="font-medium text-gray-700">{row.user?.namaLengkap || "N/A"}</span>
        </div>
      ),
    },
    {
      header: "Waktu",
      accessor: "waktuMulai",
      cell: (row) => (
        <div className="space-y-0.5 text-xs">
          <div className="flex items-center text-gray-700 font-medium">
            <Calendar size={12} className="mr-1 text-gray-400" />
            {formatDate(row.waktuMulai)}
          </div>
          <div className="flex items-center text-gray-400">
            <Clock size={12} className="mr-1" />
            {row.waktuSelesai ? "Selesai" : "Sedang Berjalan"}
          </div>
        </div>
      ),
    },
    {
      header: "Kas",
      accessor: "kasAwal",
      cell: (row) => (
        <div className="space-y-0.5 text-xs">
          <div className="text-gray-500">Awal: {formatCurrency(row.kasAwal)}</div>
          <div className="text-indigo-600 font-bold">Akhir: {row.kasAkhir ? formatCurrency(row.kasAkhir) : "-"}</div>
        </div>
      ),
    },
    {
      header: "Transaksi",
      accessor: "totalTransaksi",
      cell: (row) => (
        <div className="text-center">
          <span className="px-2 py-1 bg-gray-100 rounded text-gray-700 font-bold">{row.totalTransaksi || 0}</span>
        </div>
      ),
    },
    {
      header: "Pendapatan",
      accessor: "totalPendapatan",
      cell: (row) => (
        <span className="font-bold text-green-600">{formatCurrency(row.totalPendapatan || 0)}</span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      cell: (row) => (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
          row.status === "dibuka" ? "bg-green-100 text-green-700" : 
          row.status === "ditutup" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
        }`}>
          {row.status}
        </span>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Riwayat & Laporan Shift</h1>
          <p className="text-gray-500 mt-1">Kelola dan tinjau performa shift kasir Anda</p>
        </div>
        <div className="flex items-center gap-3">
          <CabangIndicator size="lg" />
          <button
            onClick={handleExportReport}
            className="bg-white text-green-600 border border-green-200 px-4 py-2.5 rounded-xl flex items-center text-sm font-bold hover:bg-green-50 transition-all shadow-sm"
          >
            <Download size={18} className="mr-2" />
            Excel
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Clock size={20} />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Shift</span>
          </div>
          <p className="text-3xl font-black text-gray-900">{summary.totalShifts}</p>
          <p className="text-xs text-gray-500 mt-2">Sesuai filter yang diterapkan</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
              <ShoppingCart size={20} />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Transaksi</span>
          </div>
          <p className="text-3xl font-black text-gray-900">{summary.totalTransactions}</p>
          <p className="text-xs text-green-600 mt-2 font-medium">Berhasil diproses</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <DollarSign size={20} />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pendapatan</span>
          </div>
          <p className="text-3xl font-black text-gray-900">{formatCurrency(summary.totalRevenue)}</p>
          <p className="text-xs text-gray-500 mt-2">Total dari semua shift</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Filters Header */}
        <div className="p-5 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/30">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="date"
                  className="pl-3 pr-2 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  value={filters.startDate}
                  onChange={(e) => handleDateChange("startDate", e.target.value)}
                />
              </div>
              <span className="text-gray-400 text-sm">s/d</span>
              <div className="relative">
                <input
                  type="date"
                  className="pl-3 pr-2 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  value={filters.endDate}
                  onChange={(e) => handleDateChange("endDate", e.target.value)}
                />
              </div>
            </div>

            <select
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              value={filters.status}
              onChange={handleStatusChange}
            >
              <option value="">Semua Status</option>
              <option value="dibuka">Dibuka</option>
              <option value="ditutup">Ditutup</option>
              <option value="disesuaikan">Disesuaikan</option>
            </select>
          </div>

          <form onSubmit={handleSearch} className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-indigo-500" size={18} />
            <input
              type="text"
              placeholder="Cari nama kasir..."
              className="pl-10 pr-4 py-2 w-full md:w-64 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </form>
        </div>

        <div className="p-0">
          <Table
            columns={columns}
            data={shifts}
            isLoading={isLoading}
            emptyMessage="Tidak ada data shift yang ditemukan"
            onRowClick={handleViewShiftDetails}
            pagination={{
              totalItems: meta.totalItems,
              totalPages: meta.totalPages,
              currentPage: meta.currentPage,
              itemsPerPage: meta.itemsPerPage,
              hasNextPage: meta.hasNextPage,
              hasPrevPage: meta.hasPrevPage,
            }}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
};

export default ShiftReports;
