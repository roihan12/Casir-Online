import React, { useState } from "react";
import { useTransactionsList, useUpdateOnlineOrderStatus } from "../hooks/useTransactions";
import { Link } from "react-router-dom";
import formatCurrency  from "@common/utils/formatCurrency";
import dayjs from "dayjs";
import { FiSearch, FiCheck, FiX, FiPackage, FiTruck, FiRefreshCw, FiClock, FiCheckCircle, FiEye } from "react-icons/fi";
import { useAuth } from "@features/auth";
import toast from "react-hot-toast";

const AdminOnlineOrdersPage = () => {
  const { currentCabang } = useAuth();
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    cabangId: currentCabang?.id || "all",
    order_source: "ECATALOG", // Default to online orders only
    order_status: "all",
    search: "",
  });

  const { data: transactions, isLoading, refetch } = useTransactionsList(filters, page, rowsPerPage);
  const { mutate: updateStatus, isLoading: isUpdating } = useUpdateOnlineOrderStatus();

  const handleStatusUpdate = (id, newStatus) => {
    updateStatus(
      { id, data: { order_status: newStatus, transaksi_id: id } },
      {
        onSuccess: () => {
          toast.success(`Berhasil mengubah status order ke ${newStatus}`);
          refetch();
        },
        onError: (err) => {
          toast.error(err.response?.data?.message || "Gagal mengubah status order");
        },
      }
    );
  };

  const statusList = [
    { value: "all", label: "Semua Status" },
    { value: "PENDING", label: "Pending Menunggu Konfirmasi" },
    { value: "CONFIRMED", label: "Dikonfirmasi" },
    { value: "PROCESSING", label: "Diproses" },
    { value: "READY", label: "Siap Diambil/Kirim" },
    { value: "ON_DELIVERY", label: "Dalam Pengiriman" },
    { value: "DELIVERED", label: "Terkirim" },
    { value: "COMPLETED", label: "Selesai" },
    { value: "CANCELLED", label: "Dibatalkan" },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "CONFIRMED": return "bg-blue-100 text-blue-800 border-blue-200";
      case "PROCESSING": return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "READY": return "bg-purple-100 text-purple-800 border-purple-200";
      case "ON_DELIVERY": return "bg-orange-100 text-orange-800 border-orange-200";
      case "DELIVERED": return "bg-teal-100 text-teal-800 border-teal-200";
      case "COMPLETED": return "bg-green-100 text-green-800 border-green-200";
      case "CANCELLED": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "PENDING": return <FiClock className="w-4 h-4 mr-1" />;
      case "CONFIRMED": return <FiCheck className="w-4 h-4 mr-1" />;
      case "PROCESSING": return <FiRefreshCw className="w-4 h-4 mr-1 animate-spin-slow" />;
      case "READY": return <FiPackage className="w-4 h-4 mr-1" />;
      case "ON_DELIVERY": return <FiTruck className="w-4 h-4 mr-1" />;
      case "COMPLETED": case "DELIVERED": return <FiCheckCircle className="w-4 h-4 mr-1" />;
      case "CANCELLED": return <FiX className="w-4 h-4 mr-1" />;
      default: return null;
    }
  };

  return (
    <div className="w-full p-4 lg:p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 font-outfit">Order Online & ECatalog</h1>
        <p className="text-xs sm:text-sm text-gray-600">Kelola pesanan dari pelanggan online</p>
      </div>

      <div className="space-y-6">
        
        {/* Header & Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-lg font-bold font-outfit text-gray-800">Manajemen Order E-Catalog</h2>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Cari ID / No HP..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm transition-all"
                  value={filters.search}
                  onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                />
              </div>
              <select
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm bg-white"
                value={filters.order_status}
                onChange={(e) => setFilters(f => ({ ...f, order_status: e.target.value }))}
              >
                {statusList.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 text-gray-400">
              <FiRefreshCw className="w-8 h-8 animate-spin text-primary mb-4" />
              <p>Memuat pesanan...</p>
            </div>
          ) : transactions?.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-gray-400">
              <FiPackage className="w-16 h-16 text-gray-200 mb-4" />
              <p className="text-lg font-medium text-gray-500">Belum ada pesanan online</p>
              <p className="text-sm">Pesanan yang masuk melalui e-catalog akan muncul di sini.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-500 font-medium">
                  <tr>
                    <th className="px-6 py-4">ID Transaksi</th>
                    <th className="px-6 py-4">Pelanggan</th>
                    <th className="px-6 py-4">Waktu Pesan</th>
                    <th className="px-6 py-4">Total</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Aksi Manajemen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {transactions?.map((trx) => (
                    <tr key={trx.transaksi_id} className="hover:bg-primary/5 transition-colors">
                      <td className="px-6 py-4">
                        <Link to={`/transactions/${trx.transaksi_id}`} className="font-semibold text-indigo-600 hover:text-indigo-800 transition-colors block">
                          {trx.nomor_transaksi}
                        </Link>
                        <span className="text-xs text-gray-500">{trx.transaksi_id.substring(0, 8)}...</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-800 block">
                          {trx.pelanggan ? trx.pelanggan.namaPelanggan : "Pelanggan Guest"}
                        </span>
                        {trx.pelanggan?.telepon && (
                          <span className="text-xs text-gray-500">{trx.pelanggan.telepon}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="block text-gray-700">{dayjs(trx.tanggal).format("DD MMM YYYY")}</span>
                        <span className="text-xs text-gray-500">{dayjs(trx.tanggal).format("HH:mm")} WIB</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-900">{formatCurrency(trx.total)}</span>
                        <span className="block text-xs text-gray-500">{trx.metode_pembayaran}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(trx.order_status || "PENDING")}`}>
                          {getStatusIcon(trx.order_status || "PENDING")}
                          {trx.order_status || "PENDING"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Link 
                            to={`/transactions/${trx.transaksi_id}`} 
                            className="p-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                            title="Lihat Detail Transaksi"
                          >
                            <FiEye className="w-4 h-4" />
                          </Link>
                          
                          {/* Next logic depending on status */}
                          {(!trx.order_status || trx.order_status === "PENDING") && (
                            <>
                              <button onClick={() => handleStatusUpdate(trx.transaksi_id, "CONFIRMED")} disabled={isUpdating} className="px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-xs font-medium flex items-center">
                                <FiCheck className="mr-1" /> Konfirmasi
                              </button>
                              <button onClick={() => handleStatusUpdate(trx.transaksi_id, "CANCELLED")} disabled={isUpdating} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors">
                                <FiX className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {trx.order_status === "CONFIRMED" && (
                            <button onClick={() => handleStatusUpdate(trx.transaksi_id, "PROCESSING")} disabled={isUpdating} className="px-3 py-1.5 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors text-xs font-medium flex items-center">
                              <FiRefreshCw className="mr-1" /> Proses Pesanan
                            </button>
                          )}
                          {trx.order_status === "PROCESSING" && (
                            <button onClick={() => handleStatusUpdate(trx.transaksi_id, "READY")} disabled={isUpdating} className="px-3 py-1.5 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors text-xs font-medium flex items-center">
                              <FiPackage className="mr-1" /> Siap
                            </button>
                          )}
                          {trx.order_status === "READY" && (
                            <button onClick={() => handleStatusUpdate(trx.transaksi_id, "COMPLETED")} disabled={isUpdating} className="px-3 py-1.5 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-xs font-medium flex items-center">
                              <FiCheckCircle className="mr-1" /> Selesaikan (Pickup)
                            </button>
                          )}
                          {(trx.order_status === "COMPLETED" || trx.order_status === "DELIVERED" || trx.order_status === "CANCELLED") && (
                            <span className="text-gray-400 text-xs italic">Selesai</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Basic Pagination Header placeholder */}
              <div className="flex justify-between items-center p-4 border-t border-gray-100 text-sm text-gray-500">
                <span>Total {transactions?.length || 0} pesanan</span>
                <div className="flex gap-2">
                  <button 
                    disabled={page === 0} 
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    className="px-3 py-1 border border-gray-200 rounded-md disabled:opacity-50 hover:bg-gray-50"
                  >
                    Prev
                  </button>
                  <button 
                    onClick={() => setPage(p => p + 1)}
                    disabled={transactions?.length < rowsPerPage}
                    className="px-3 py-1 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOnlineOrdersPage;
