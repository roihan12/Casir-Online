import { useState } from "react";
import {
  FiTruck,
  FiPackage,
  FiUser,
  FiPhone,
  FiMapPin,
  FiClock,
  FiCheck,
  FiX,
  FiRefreshCw,
  FiFilter,
  FiDollarSign,
  FiAlertTriangle,
} from "react-icons/fi";
import {
  useDeliveryOrders,
  useAvailableDrivers,
  useAssignDriver,
  useUpdateDeliveryStatus,
  useMarkPaymentReceived,
  useMarkDeliveryFailed,
} from "../hooks/useDelivery";
import { CURRENCY_FORMATTER } from "../../../config";
import toast from "react-hot-toast";

const DeliveryDashboardPage = () => {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [assignModal, setAssignModal] = useState(null);
  const [selectedDriverId, setSelectedDriverId] = useState("");

  const { data: ordersData, isLoading, refetch } = useDeliveryOrders({
    status: statusFilter,
    page,
    limit: 20,
  });

  const orders = ordersData?.data || [];
  const pagination = ordersData?.pagination || {};

  const assignDriver = useAssignDriver();
  const updateStatus = useUpdateDeliveryStatus();
  const markPaid = useMarkPaymentReceived();
  const markFailed = useMarkDeliveryFailed();

  // Fetch available drivers when assign modal opens
  const { data: driversData } = useAvailableDrivers(
    assignModal ? undefined : null
  );
  const availableDrivers = driversData?.data || [];

  const handleAssign = async () => {
    if (!selectedDriverId || !assignModal) return;
    try {
      await assignDriver.mutateAsync({
        transaksiId: assignModal,
        driverId: selectedDriverId,
      });
      toast.success("Driver berhasil ditugaskan");
      setAssignModal(null);
      setSelectedDriverId("");
    } catch (err) {
      toast.error(err.response?.data?.errors || "Gagal assign driver");
    }
  };

  const handleStatusUpdate = async (transaksiId, status) => {
    try {
      await updateStatus.mutateAsync({
        transaksiId,
        data: { status },
      });
      toast.success(
        status === "PICKED_UP" ? "Status: Dalam Perjalanan" : "Status: Terkirim"
      );
    } catch (err) {
      toast.error(err.response?.data?.errors || "Gagal update status");
    }
  };

  const handlePaymentReceived = async (transaksiId, total) => {
    try {
      await markPaid.mutateAsync({
        transaksiId,
        data: { jumlah_bayar: total, notes: "COD - diterima" },
      });
      toast.success("Pembayaran COD berhasil dicatat");
    } catch (err) {
      toast.error(err.response?.data?.errors || "Gagal catat pembayaran");
    }
  };

  const handleFailed = async (transaksiId) => {
    const alasan = window.prompt("Alasan gagal kirim:");
    if (!alasan) return;
    try {
      await markFailed.mutateAsync({ transaksiId, alasan });
      toast.success("Pengiriman ditandai gagal");
    } catch (err) {
      toast.error(err.response?.data?.errors || "Gagal update");
    }
  };

  const statusFilters = [
    { value: "ALL", label: "Semua" },
    { value: "CONFIRMED", label: "Belum Assign" },
    { value: "ASSIGNED", label: "Assigned" },
    { value: "PICKED_UP", label: "Dalam Perjalanan" },
  ];

  const getStatusBadge = (order) => {
    if (order.delivery_status === "ASSIGNED")
      return "bg-blue-100 text-blue-700";
    if (order.delivery_status === "PICKED_UP")
      return "bg-indigo-100 text-indigo-700";
    if (order.delivery_status === "DELIVERED")
      return "bg-emerald-100 text-emerald-700";
    if (order.order_status === "CONFIRMED" && !order.delivery_status)
      return "bg-amber-100 text-amber-700";
    return "bg-slate-100 text-slate-700";
  };

  const getStatusLabel = (order) => {
    if (order.delivery_status === "ASSIGNED") return "Driver Ditugaskan";
    if (order.delivery_status === "PICKED_UP") return "Dalam Perjalanan";
    if (order.delivery_status === "DELIVERED") return "Terkirim";
    if (order.order_status === "CONFIRMED" && !order.delivery_status)
      return "Belum Assign";
    return order.order_status;
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FiTruck className="text-indigo-500" />
            Delivery Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Kelola pengiriman order online
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors text-sm font-medium"
        >
          <FiRefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Status Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {statusFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => {
              setStatusFilter(f.value);
              setPage(1);
            }}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              statusFilter === f.value
                ? "bg-indigo-500 text-white shadow-md shadow-indigo-200"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-4 border border-slate-100 animate-pulse"
            >
              <div className="h-5 bg-slate-200 rounded w-1/3 mb-3" />
              <div className="h-4 bg-slate-200 rounded w-2/3 mb-2" />
              <div className="h-4 bg-slate-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <FiPackage className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Tidak ada order delivery</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.transaksi_id}
              className="bg-white rounded-2xl p-4 md:p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Order Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-slate-800">
                    {order.nomor_transaksi}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(order.created_at).toLocaleString("id-ID")}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusBadge(order)}`}
                >
                  {getStatusLabel(order)}
                </span>
              </div>

              {/* Customer Info */}
              <div className="space-y-1 mb-3">
                <p className="text-sm text-slate-700 flex items-center gap-1.5">
                  <FiUser className="w-3.5 h-3.5 text-slate-400" />
                  {order.customer_name}
                </p>
                {order.customer_phone !== "-" && (
                  <p className="text-sm text-slate-500 flex items-center gap-1.5">
                    <FiPhone className="w-3.5 h-3.5 text-slate-400" />
                    {order.customer_phone}
                  </p>
                )}
                {order.customer_address && (
                  <p className="text-sm text-slate-500 flex items-start gap-1.5">
                    <FiMapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                    {order.customer_address}
                  </p>
                )}
              </div>

              {/* Items */}
              <div className="bg-slate-50 rounded-xl p-3 mb-3">
                <p className="text-xs text-slate-400 mb-1">
                  {order.items_count} item
                </p>
                {order.items.map((item, i) => (
                  <p key={i} className="text-sm text-slate-700">
                    {item.jumlah}× {item.nama}
                  </p>
                ))}
                <p className="text-sm font-bold text-indigo-600 mt-2">
                  Total: {CURRENCY_FORMATTER.format(order.total)}
                </p>
                {order.status_pembayaran !== "LUNAS" && (
                  <span className="inline-block mt-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    COD - Belum Bayar
                  </span>
                )}
              </div>

              {/* Driver Info */}
              {order.driver && (
                <div className="bg-indigo-50 rounded-xl p-3 mb-3">
                  <p className="text-sm font-medium text-indigo-800">
                    🛵 {order.driver.nama}
                  </p>
                  <p className="text-xs text-indigo-600">
                    {order.driver.no_hp} · {order.driver.plat}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {/* Assign driver (CONFIRMED, no driver) */}
                {order.order_status === "CONFIRMED" &&
                  !order.delivery_status && (
                    <button
                      onClick={() => setAssignModal(order.transaksi_id)}
                      className="px-3 py-1.5 text-xs font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1"
                    >
                      <FiUser className="w-3 h-3" /> Assign Driver
                    </button>
                  )}

                {/* Picked up (ASSIGNED) */}
                {order.delivery_status === "ASSIGNED" && (
                  <button
                    onClick={() =>
                      handleStatusUpdate(order.transaksi_id, "PICKED_UP")
                    }
                    className="px-3 py-1.5 text-xs font-medium bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors flex items-center gap-1"
                  >
                    <FiPackage className="w-3 h-3" /> Pickup
                  </button>
                )}

                {/* Delivered (PICKED_UP) */}
                {order.delivery_status === "PICKED_UP" && (
                  <button
                    onClick={() =>
                      handleStatusUpdate(order.transaksi_id, "DELIVERED")
                    }
                    className="px-3 py-1.5 text-xs font-medium bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-1"
                  >
                    <FiCheck className="w-3 h-3" /> Terkirim
                  </button>
                )}

                {/* COD Payment (unpaid & delivered or picked_up) */}
                {order.status_pembayaran !== "LUNAS" &&
                  (order.delivery_status === "PICKED_UP" ||
                    order.delivery_status === "DELIVERED") && (
                    <button
                      onClick={() =>
                        handlePaymentReceived(
                          order.transaksi_id,
                          order.total
                        )
                      }
                      className="px-3 py-1.5 text-xs font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors flex items-center gap-1"
                    >
                      <FiDollarSign className="w-3 h-3" /> COD Diterima
                    </button>
                  )}

                {/* Failed (if not completed) */}
                {order.delivery_status &&
                  order.delivery_status !== "DELIVERED" &&
                  order.delivery_status !== "FAILED" && (
                    <button
                      onClick={() => handleFailed(order.transaksi_id)}
                      className="px-3 py-1.5 text-xs font-medium bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-200 transition-colors flex items-center gap-1"
                    >
                      <FiAlertTriangle className="w-3 h-3" /> Gagal
                    </button>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm disabled:opacity-50 hover:bg-slate-50"
          >
            Prev
          </button>
          <span className="text-sm text-slate-600">
            {page} / {pagination.totalPages}
          </span>
          <button
            onClick={() =>
              setPage((p) => Math.min(pagination.totalPages, p + 1))
            }
            disabled={page >= pagination.totalPages}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm disabled:opacity-50 hover:bg-slate-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Assign Driver Modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setAssignModal(null)}
          />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              Pilih Driver
            </h3>
            {availableDrivers.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">
                Tidak ada driver tersedia
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                {availableDrivers.map((d) => (
                  <label
                    key={d.id}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border-2 transition-all ${
                      selectedDriverId === d.id
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="driver"
                      value={d.id}
                      onChange={() => setSelectedDriverId(d.id)}
                      className="sr-only"
                    />
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm">
                      {d.nama.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        {d.nama}
                      </p>
                      <p className="text-xs text-slate-500">
                        {d.no_hp} · {d.jenis_kendaraan}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setAssignModal(null)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium text-sm transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleAssign}
                disabled={!selectedDriverId || assignDriver.isPending}
                className="flex-1 py-2.5 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 font-medium text-sm disabled:opacity-50 transition-colors"
              >
                {assignDriver.isPending ? "..." : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryDashboardPage;
