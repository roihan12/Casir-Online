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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Manajemen Shift
          </h1>
          <p className="text-sm text-gray-500">
            Kelola shift aktif di {selectedCabang?.namaCabang || "cabang"}
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleViewReports}
            className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg flex items-center text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Calendar size={16} className="mr-2 text-indigo-500" />
            Riwayat & Laporan
          </button>
          <CabangIndicator size="lg" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center">
            <Clock size={18} className="text-indigo-500 mr-2" />
            <h2 className="text-lg font-medium">Daftar Shift Aktif</h2>
          </div>
          <button 
            onClick={handleCreateNewShift}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus size={16} className="mr-1" />
            Buka Shift Baru
          </button>
        </div>

        <div className="p-4">
          <div className="flex justify-between mb-4">
            <div className="w-1/3">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 font-medium">Total Shift Aktif</h3>
            <Users size={20} className="text-indigo-500" />
          </div>
          <p className="text-2xl font-semibold text-gray-800">
            {pagination.totalItems}
          </p>
        </div>

        <div className="bg-white col-span-2 p-4 rounded-lg shadow flex items-center justify-between">
          <div>
            <h3 className="text-gray-600 font-medium">Lihat Semua Riwayat Shift</h3>
            <p className="text-sm text-gray-500">Saring berdasarkan tanggal, kasir, dan status</p>
          </div>
          <button 
            onClick={handleViewReports}
            className="text-indigo-600 font-medium flex items-center hover:underline"
          >
            Buka Laporan <ArrowRight size={16} className="ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShiftManagement;
