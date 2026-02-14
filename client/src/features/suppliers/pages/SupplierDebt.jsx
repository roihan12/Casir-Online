import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  DollarSign,
  Search,
  SlidersHorizontal,
  Plus,
  Calendar,
  AlertTriangle,
  FileText,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
} from "lucide-react";
import { useHutang } from "../hooks/useHutang";
import Spinner from "../../common/Spinner";
import Pagination from "../../common/Pagination";
import EmptyState from "../../common/EmptyState";
import { formatCurrency, formatDate } from "../../../common/utils/format";
import { useCabang } from "../../cabang/hooks/useCabang";

const SupplierDebt = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const supplierId = queryParams.get("supplierId");
  const supplierName = queryParams.get("supplierName");
  const cabangIdFromUrl = queryParams.get("cabangId");

  const { selectedCabang } = useCabang();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    startDate: "",
    endDate: "",
  });

  // Initialize hutang hook
  const {
    supplierHutangList,
    supplierHutangPagination,
    supplierHutangSummary,
    isLoadingSupplierHutangList,
    isLoadingSupplierHutangSummary,
  } = useHutang({
    supplierId,
    cabangId: cabangIdFromUrl || selectedCabang?.id, // Prioritize URL param, fallback to global
    filterParams: {
      page,
      limit,
      search: searchTerm,
      status: filters.status !== "all" ? filters.status : undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
    },
  });

  // Handle search input
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  // Filter handlers
  const handleFilterChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setPage(1);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      status: "all",
      startDate: "",
      endDate: "",
    });
    setPage(1);
  };

  // If supplierId is not provided, redirect to suppliers page
  if (!supplierId) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center p-8">
          <h2 className="text-xl font-semibold mb-2">
            ID Supplier Tidak Ditemukan
          </h2>
          <p className="text-gray-600 mb-4">
            Silakan pilih supplier dari daftar supplier terlebih dahulu.
          </p>
          <button
            onClick={() => navigate("/suppliers")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Kembali ke Daftar Supplier
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <button
            onClick={() => navigate(`/suppliers/${supplierId}`)}
            className="flex items-center text-sm text-indigo-600 hover:text-indigo-800 mb-2"
          >
            <ArrowLeft size={16} className="mr-1" />
            <span>Kembali ke Detail Supplier</span>
          </button>
          <h1 className="text-2xl font-bold flex items-center">
            <DollarSign className="mr-2" size={24} />
            Hutang Supplier: {supplierName || supplierId}
          </h1>
        </div>
        <div className="mt-4 md:mt-0">
          <button
            onClick={() =>
              navigate(
                `/superadmin/hutang/create?supplierId=${supplierId}&supplierName=${supplierName}`
              )
            }
            className="px-4 py-2 bg-indigo-600 text-white rounded-md flex items-center hover:bg-indigo-700"
          >
            <Plus size={18} className="mr-1" />
            Tambah Hutang
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {isLoadingSupplierHutangSummary ? (
          <div className="col-span-3 flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Hutang</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {formatCurrency(supplierHutangSummary?.totalHutang || 0)}
                  </h3>
                </div>
                <div className="bg-indigo-100 p-3 rounded-full">
                  <DollarSign size={24} className="text-indigo-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Jumlah transaksi: {supplierHutangSummary?.jumlahTransaksi || 0}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Sudah Dibayar</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {formatCurrency(supplierHutangSummary?.totalDibayar || 0)}
                  </h3>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle size={24} className="text-green-600" />
                </div>
              </div>
              <div className="mt-2 text-sm">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width: `${
                        supplierHutangSummary?.totalHutang > 0
                          ? (supplierHutangSummary?.totalDibayar /
                              supplierHutangSummary?.totalHutang) *
                            100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Sisa Hutang</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {formatCurrency(supplierHutangSummary?.sisaHutang || 0)}
                  </h3>
                </div>
                <div className="bg-orange-100 p-3 rounded-full">
                  <Clock size={24} className="text-orange-600" />
                </div>
              </div>
              <p
                className={`text-sm mt-4 ${
                  supplierHutangSummary?.hutangJatuhTempo > 0
                    ? "text-red-500"
                    : "text-gray-500"
                }`}
              >
                {supplierHutangSummary?.hutangJatuhTempo > 0
                  ? `${supplierHutangSummary?.hutangJatuhTempo} hutang jatuh tempo`
                  : "Tidak ada hutang jatuh tempo"}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Filters and Search */}
      <div className="mb-6 bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Cari nomor referensi..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Search
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
          </div>
          <div className="flex items-center">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="px-4 py-2 border border-gray-300 rounded-md flex items-center hover:bg-gray-50"
            >
              <SlidersHorizontal size={18} className="mr-1" />
              Filter
            </button>
          </div>
        </div>

        {/* Filter options */}
        {filterOpen && (
          <div className="mt-4 p-4 border border-gray-200 rounded-md bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Filter Hutang</h3>
              <button
                onClick={resetFilters}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                Reset Filter
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Semua Status</option>
                  <option value="aktif">Aktif</option>
                  <option value="lunas">Lunas</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="startDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label
                  htmlFor="endDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Tanggal Akhir
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hutang List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoadingSupplierHutangList ? (
          <div className="flex justify-center items-center py-12">
            <Spinner size="lg" />
          </div>
        ) : supplierHutangList.length === 0 ? (
          <EmptyState
            title="Belum Ada Hutang"
            description="Supplier ini belum memiliki hutang. Tambahkan hutang untuk supplier ini."
            icon={<DollarSign size={48} className="text-gray-400" />}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      No. Referensi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jatuh Tempo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dibayar
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sisa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {supplierHutangList.map((hutang) => {
                    const isOverdue =
                      new Date(hutang.jatuhTempo) < new Date() &&
                      hutang.statusHutang === "aktif";

                    return (
                      <tr
                        key={hutang.id}
                        className={isOverdue ? "bg-red-50" : ""}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">
                              {hutang.nomorReferensi}
                            </div>
                            {hutang.transaksiId && (
                              <div className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                Transaksi
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(hutang.tanggalHutang)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div
                            className={`text-sm ${
                              isOverdue
                                ? "text-red-600 font-medium"
                                : "text-gray-900"
                            }`}
                          >
                            {formatDate(hutang.jatuhTempo)}
                            {isOverdue && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                <AlertTriangle size={12} className="mr-1" />
                                Jatuh Tempo
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatCurrency(hutang.jumlahTotal)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-green-600">
                            {formatCurrency(hutang.jumlahBayar)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(hutang.sisaHutang)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              hutang.statusHutang === "lunas"
                                ? "bg-green-100 text-green-800"
                                : hutang.statusHutang === "aktif"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {hutang.statusHutang === "lunas"
                              ? "Lunas"
                              : hutang.statusHutang === "aktif"
                              ? "Aktif"
                              : hutang.statusHutang === "hapus"
                              ? "Dihapus"
                              : hutang.statusHutang}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() =>
                              navigate(`/hutang/${hutang.id}`)
                            }
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {supplierHutangPagination && (
              <div className="px-6 py-4 border-t border-gray-200">
                <Pagination
                  currentPage={page}
                  totalPages={supplierHutangPagination.totalPages || 1}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SupplierDebt;
