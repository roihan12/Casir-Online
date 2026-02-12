import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  User,
  Building2,
  DollarSign,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import { useHutangList } from "../hooks/useHutangQueries";
import { useCabang } from "@features/cabang/hooks/useCabang";
import Spinner from '../../common/Spinner'

const HutangManagementPage = () => {
  const navigate = useNavigate();
  const { selectedCabang } = useCabang();

  const [filters, setFilters] = useState({
    jenisHutang: "",
    statusHutang: "aktif",
    search: "",
    page: 1,
    limit: 10,
  });

  const { data, isLoading, error } = useHutangList({
    ...filters,
    cabangId: selectedCabang?.id,
  });

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleSearch = (value) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "lunas":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Lunas
          </span>
        );
      case "cancel":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Batal
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Aktif
          </span>
        );
    }
  };

  const isOverdue = (jatuhTempo, status) => {
    return status === "aktif" && new Date(jatuhTempo) < new Date();
  };

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Hutang</h1>
          <p className="text-sm text-gray-500">
            Kelola hutang pelanggan dan supplier
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nomor referensi atau keterangan..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Jenis Hutang */}
          <div>
            <select
              value={filters.jenisHutang}
              onChange={(e) => handleFilterChange("jenisHutang", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Semua Jenis</option>
              <option value="pelanggan">Pelanggan</option>
              <option value="supplier">Supplier</option>
            </select>
          </div>

          {/* Status Hutang */}
          <div>
            <select
              value={filters.statusHutang}
              onChange={(e) => handleFilterChange("statusHutang", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Semua Status</option>
              <option value="aktif">Aktif</option>
              <option value="lunas">Lunas</option>
              <option value="cancel">Dibatalkan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Referensi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sisa Hutang
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jatuh Tempo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jenis Hutang
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.data && data.data.length > 0 ? (
                data.data.map((hutang) => (
                  <tr
                    key={hutang.id}
                    className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                      isOverdue(hutang.jatuhTempo, hutang.statusHutang)
                        ? "bg-red-50"
                        : ""
                    }`}
                    onClick={() => navigate(`/hutang/${hutang.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {hutang.nomorReferensi}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(hutang.tanggalHutang), "dd MMM yyyy", {
                              locale: idLocale,
                            })}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {hutang.jenisHutang === "pelanggan" ? (
                          <User className="w-4 h-4 text-blue-500" />
                        ) : (
                          <Building2 className="w-4 h-4 text-purple-500" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {hutang.jenisHutang === "pelanggan"
                              ? hutang.pelanggan?.namaPelanggan
                              : hutang.supplier?.namaSupplier}
                          </p>
                          <p className="text-xs text-gray-500">
                            {hutang.cabang?.namaCabang}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-medium text-gray-900">
                        Rp {parseFloat(hutang.jumlahTotal).toLocaleString("id-ID")}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p
                        className={`text-sm font-semibold ${
                          parseFloat(hutang.sisaHutang) > 0
                            ? "text-orange-600"
                            : "text-green-600"
                        }`}
                      >
                        Rp {parseFloat(hutang.sisaHutang).toLocaleString("id-ID")}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-900">
                            {format(new Date(hutang.jatuhTempo), "dd MMM yyyy", {
                              locale: idLocale,
                            })}
                          </p>
                          {isOverdue(hutang.jatuhTempo, hutang.statusHutang) && (
                            <p className="text-xs text-red-600 font-medium">
                              Terlambat!
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(hutang.statusHutang)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {hutang.jenisHutang === "pelanggan" ? "Pelanggan" : "Supplier"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/hutang/${hutang.id}`);
                        }}
                        className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-12 text-center text-sm text-gray-500"
                  >
                    {error
                      ? "Gagal memuat data"
                      : "Tidak ada data hutang yang ditemukan"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Halaman {data.pagination.currentPage} dari{" "}
                {data.pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      page: prev.page - 1,
                    }))
                  }
                  disabled={!data.pagination.hasPrevPage}
                  className="px-3 py-1 text-sm font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                <button
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      page: prev.page + 1,
                    }))
                  }
                  disabled={!data.pagination.hasNextPage}
                  className="px-3 py-1 text-sm font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const FileText = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

export default HutangManagementPage;
