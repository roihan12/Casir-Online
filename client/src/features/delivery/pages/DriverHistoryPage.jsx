import { useState } from "react";
import { FiClock, FiCheckCircle, FiXCircle, FiTruck, FiFilter } from "react-icons/fi";
import { useAuth } from "../../auth/hooks/useAuth";
import { useDriverHistory } from "../hooks/useDelivery";

const DriverHistoryPage = () => {
  const { user } = useAuth();
  const driverId = user?.driverId;
  const [filter, setFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useDriverHistory(driverId, { status: filter, page, limit: 15 });
  const history = data?.data || [];
  const pagination = data?.pagination || {};

  if (!driverId) {
    return (
      <div className="flex items-center justify-center p-8 h-[calc(100vh-64px)]">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center max-w-sm w-full font-medium shadow-sm border border-red-100">
          Akun Anda belum terhubung dengan data driver.
        </div>
      </div>
    );
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "DELIVERED": return <FiCheckCircle className="text-emerald-500 w-5 h-5" />;
      case "FAILED": return <FiXCircle className="text-red-500 w-5 h-5" />;
      case "CANCELLED": return <FiXCircle className="text-gray-400 w-5 h-5" />;
      default: return <FiClock className="text-gray-400 w-5 h-5" />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "DELIVERED": return "Berhasil";
      case "FAILED": return "Gagal Diantar";
      case "CANCELLED": return "Dibatalkan";
      default: return status;
    }
  };

  const statusFilters = [
    { id: "ALL", label: "Semua" },
    { id: "DELIVERED", label: "Berhasil" },
    { id: "FAILED", label: "Gagal" }
  ];

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10 md:pt-6">
        <div className="max-w-lg mx-auto">
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
            <FiClock className="text-indigo-500" /> Riwayat Pengiriman
          </h1>
          
          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {statusFilters.map((f) => (
              <button
                key={f.id}
                onClick={() => { setFilter(f.id); setPage(1); }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === f.id 
                    ? "bg-indigo-600 text-white shadow-sm" 
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-3 mt-2">
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-24 animate-pulse border border-gray-100 shadow-sm"></div>
          ))
        ) : history.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100 border-dashed mt-4">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiTruck className="text-gray-300 w-8 h-8" />
            </div>
            <h3 className="text-gray-800 font-bold mb-1">Riwayat Kosong</h3>
            <p className="text-gray-500 text-sm">Belum ada riwayat pengiriman dengan status ini.</p>
          </div>
        ) : (
          <>
            {history.map((order) => (
              <div key={order.transaksi_id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-indigo-100 transition-colors">
                <div className="flex gap-3">
                  <div className="mt-1 flex-shrink-0">
                    {getStatusIcon(order.delivery_status || order.order_status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-gray-800 text-sm truncate pr-2">
                        {order.customer_name}
                      </h4>
                      <span className="text-gray-400 text-xs font-mono shrink-0">
                        #{order.nomor_transaksi?.slice(-6)}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs mb-2 line-clamp-1">
                      {order.customer_address}
                    </p>
                    <div className="flex justify-between items-center bg-gray-50 rounded-lg px-2.5 py-1.5">
                      <span className="text-xs font-semibold text-gray-600">
                        {getStatusLabel(order.delivery_status || order.order_status)}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium">
                        {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-between items-center pt-4 px-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-xl border border-gray-200 disabled:opacity-50 shadow-sm"
                >
                  Sebelumnya
                </button>
                <span className="text-xs text-gray-500 font-medium">
                  {page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-xl border border-gray-200 disabled:opacity-50 shadow-sm"
                >
                  Selanjutnya
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DriverHistoryPage;
