import React, { useState, useEffect } from "react";
import {
  Clock,
  Users,
  Calendar,
  User,
  DollarSign,
  Search,
  ShoppingCart,
  Plus,
} from "lucide-react";
import { useCabang } from "@features/cabang/hooks/useCabang";
import { useAuth } from "@features/auth/hooks/useAuth";
import api from "@common/utils/api";
import Table from "@features/common/Table";
import CabangIndicator from "@features/cabang/components/CabangIndicator";
import formatCurrency from "@common/utils/formatCurrency";
import formatDate from "@common/utils/formatDate";

const ShiftManagement = () => {
  const { selectedCabang } = useCabang();
  const { user } = useAuth();
  const [activeShifts, setActiveShifts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const fetchActiveShifts = async (page = 1) => {
    if (!selectedCabang?.id) return;

    setIsLoading(true);
    try {
      const response = await api.get(`/shifts/active`, {
        params: {
          cabangId: selectedCabang.id,
          page,
          limit: pagination.itemsPerPage,
          search: searchQuery || undefined,
        },
      });

      setActiveShifts(response.data.data);
      setPagination({
        totalItems: response.data.meta.totalItems,
        totalPages: response.data.meta.totalPages,
        currentPage: response.data.meta.currentPage,
        itemsPerPage: response.data.meta.itemsPerPage,
        hasNextPage: response.data.meta.hasNextPage,
        hasPrevPage: response.data.meta.hasPrevPage,
      });
      setError(null);
    } catch (err) {
      console.error("Error fetching active shifts:", err);
      setError("Gagal mengambil data shift aktif. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveShifts();
  }, [selectedCabang?.id]);

  const handlePageChange = (newPage) => {
    fetchActiveShifts(newPage);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchActiveShifts(1);
  };

  const handleViewShiftDetails = (shift) => {
    // Navigate to shift detail page - this would be implemented
    console.log("View shift details for:", shift.id);
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
        <CabangIndicator size="lg" />
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center">
            <Calendar size={18} className="text-indigo-500 mr-2" />
            <h2 className="text-lg font-medium">Shift Aktif</h2>
          </div>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center text-sm font-medium hover:bg-indigo-700 transition-colors">
            <Plus size={16} className="mr-1" />
            Buat Shift Baru
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
            emptyMessage="Tidak ada shift aktif saat ini"
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
            <h3 className="text-gray-600 font-medium">Total Shift Aktif</h3>
            <Users size={20} className="text-indigo-500" />
          </div>
          <p className="text-2xl font-semibold text-gray-800">
            {activeShifts.length}
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 font-medium">
              Total Transaksi Hari Ini
            </h3>
            <ShoppingCart size={20} className="text-indigo-500" />
          </div>
          <p className="text-2xl font-semibold text-gray-800">
            {activeShifts.reduce(
              (sum, shift) => sum + (shift.totalTransaksi || 0),
              0
            )}
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 font-medium">
              Total Pendapatan Hari Ini
            </h3>
            <DollarSign size={20} className="text-indigo-500" />
          </div>
          <p className="text-2xl font-semibold text-gray-800">
            {formatCurrency(
              activeShifts.reduce(
                (sum, shift) => sum + (shift.totalPendapatan || 0),
                0
              )
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShiftManagement;
