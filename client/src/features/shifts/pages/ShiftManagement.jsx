import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  Users,
  Calendar,
  User,
  DollarSign,
  Search,
  ShoppingCart,
  Plus,
  ArrowRight,
} from "lucide-react";
import { useCabang } from "@features/cabang/hooks/useCabang";
import { useShifts } from "../hooks/useShiftQueries";
import Table from "@features/common/Table";
import CabangIndicator from "@features/cabang/components/CabangIndicator";
import formatCurrency from "@common/utils/formatCurrency";
import formatDate from "@common/utils/formatDate";

const ShiftManagement = () => {
  const navigate = useNavigate();
  const { selectedCabang } = useCabang();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: shiftResponse, isLoading, isError } = useShifts({
    cabangId: selectedCabang?.id,
    status: "dibuka",
    page: currentPage,
    limit: 10,
    search: searchQuery || undefined,
  });

  const activeShifts = shiftResponse?.data || [];
  const pagination = shiftResponse?.pagination || {
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false,
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleViewShiftDetails = (shift) => {
    navigate(`/shifts/detail/${shift.id}`);
  };

  const handleCreateNewShift = () => {
    navigate("/shifts/open");
  };

  const handleViewReports = () => {
    navigate("/shifts/reports");
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
      header: "Transaksi",
      accessor: "totalTransaksi",
      cell: (row) => (
        <div className="flex items-center">
          <ShoppingCart size={16} className="mr-2 text-gray-500" />
          <span>{row._count?.transaksi || 0}</span>
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      cell: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          {row.status === "dibuka"
            ? "Dibuka"
            : row.status === "ditutup"
            ? "Ditutup"
            : row.status === "disesuaikan"
            ? "Disesuaikan"
            : "Tidak diketahui"}
        </span>
      ),
    },
  ];

  if (!selectedCabang?.id) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4"> Manajemen Shift </h1>
        <p className="text-gray-500">Silakan pilih cabang terlebih dahulu.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            Manajemen Shift
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola shift aktif di <span className="font-semibold text-indigo-600">{selectedCabang?.namaCabang || "cabang"}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button 
            onClick={handleViewReports}
            className="flex-1 sm:flex-none bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-xl flex items-center justify-center text-sm font-bold hover:bg-gray-50 transition-all shadow-sm"
          >
            <Calendar size={18} className="mr-2 text-indigo-500" />
            Riwayat
          </button>
          <div className="flex-1 sm:flex-none">
            <CabangIndicator size="lg" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 mr-3">
              <Clock size={18} />
            </div>
            <h2 className="text-lg font-bold text-gray-800">Daftar Shift Aktif</h2>
          </div>
          <button 
            onClick={handleCreateNewShift}
            className="w-full sm:w-auto bg-indigo-600 text-white px-5 py-2.5 rounded-xl flex items-center justify-center text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
          >
            <Plus size={18} className="mr-1.5" />
            Buka Shift Baru
          </button>
        </div>

        <div className="p-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
            <div className="w-full sm:w-1/2 lg:w-1/3">
              <form onSubmit={handleSearch}>
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="Cari berdasarkan nama kasir..."
                    className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-gray-50/50"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-indigo-600 transition-colors"
                  >
                    <Search size={18} />
                  </button>
                </div>
              </form>
            </div>
          </div>

          <Table
            columns={columns}
            data={activeShifts}
            isLoading={isLoading}
            isError={isError}
            emptyMessage="Tidak ada shift aktif saat ini"
            onRowClick={handleViewShiftDetails}
            pagination={pagination}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      {/* Summary section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
            <Users size={24} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Total Aktif</h3>
            <p className="text-2xl font-black text-gray-900 leading-none mt-1">
              {pagination.totalItems}
            </p>
          </div>
        </div>

        <div className="bg-white px-6 py-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between sm:col-span-2">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
              <Calendar size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-tight">Riwayat Shift</h3>
              <p className="text-xs text-gray-500 mt-0.5">Saring berdasarkan tanggal & status</p>
            </div>
          </div>
          <button 
            onClick={handleViewReports}
            className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 font-bold flex items-center hover:bg-indigo-100 transition-colors text-sm"
          >
            Buka <ArrowRight size={18} className="ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShiftManagement;
