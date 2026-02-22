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
    cabangId: selectedCabang?.id === "global" ? null : selectedCabang?.id,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">Riwayat & Laporan Shift</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola dan tinjau performa shift kasir Anda</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex-1 sm:flex-none">
            <CabangIndicator size="lg" />
          </div>
          <button
            onClick={handleExportReport}
            className="flex-1 sm:flex-none bg-white text-emerald-600 border border-emerald-200 px-4 py-2.5 rounded-xl flex items-center justify-center text-sm font-bold hover:bg-emerald-50 transition-all shadow-sm"
          >
            <Download size={18} className="mr-2" />
            Excel
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Total Shift</span>
            <p className="text-2xl font-black text-gray-900 mt-0.5">{summary.totalShifts}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600 flex-shrink-0">
            <ShoppingCart size={24} />
          </div>
          <div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Transaksi</span>
            <p className="text-2xl font-black text-gray-900 mt-0.5">{summary.totalTransactions}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 sm:col-span-2 lg:col-span-1">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 flex-shrink-0">
            <DollarSign size={24} />
          </div>
          <div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Pendapatan</span>
            <p className="text-2xl font-black text-gray-900 mt-0.5">{formatCurrency(summary.totalRevenue)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Filters Header */}
        {/* Filters Header */}
        <div className="p-5 border-b border-gray-100 flex flex-col xl:flex-row xl:items-center justify-between gap-5 bg-gray-50/30">
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-4">
            <div className="flex items-center gap-2 flex-1 sm:flex-none">
              <div className="relative flex-1">
                <input
                  type="date"
                  className="w-full pl-3 pr-2 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all bg-white"
                  value={filters.startDate}
                  onChange={(e) => handleDateChange("startDate", e.target.value)}
                />
              </div>
              <span className="text-gray-400 text-sm font-bold">~</span>
              <div className="relative flex-1">
                <input
                  type="date"
                  className="w-full pl-3 pr-2 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all bg-white"
                  value={filters.endDate}
                  onChange={(e) => handleDateChange("endDate", e.target.value)}
                />
              </div>
            </div>

            <select
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all bg-white cursor-pointer"
              value={filters.status}
              onChange={handleStatusChange}
            >
              <option value="">Semua Status</option>
              <option value="dibuka">Status: Dibuka</option>
              <option value="ditutup">Status: Ditutup</option>
              <option value="disesuaikan">Status: Disesuaikan</option>
            </select>
          </div>

          <form onSubmit={handleSearch} className="relative group w-full xl:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-indigo-500" size={18} />
            <input
              type="text"
              placeholder="Cari nama kasir..."
              className="pl-11 pr-4 py-2.5 w-full border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all bg-white shadow-sm"
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
