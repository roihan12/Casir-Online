import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FiPackage,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiTruck,
  FiMapPin,
  FiPhone,
  FiCopy,
  FiRefreshCw,
  FiArrowLeft,
  FiCreditCard,
  FiLoader,
} from "react-icons/fi";
import { useOrderStatus, useCancelOrder, useDeliveryTracking } from "../hooks/useCatalog";
import { CURRENCY_FORMATTER } from "../../../config";
import toast from "react-hot-toast";

const STATUS_MAP = {
  PENDING: {
    label: "Menunggu Pembayaran",
    color: "text-amber-600 bg-amber-50",
    icon: FiClock,
  },
  CONFIRMED: {
    label: "Dikonfirmasi",
    color: "text-blue-600 bg-blue-50",
    icon: FiCheckCircle,
  },
  COMPLETED: {
    label: "Selesai",
    color: "text-emerald-600 bg-emerald-50",
    icon: FiCheckCircle,
  },
  CANCELLED: {
    label: "Dibatalkan",
    color: "text-rose-600 bg-rose-50",
    icon: FiXCircle,
  },
};

const DELIVERY_STATUS_MAP = {
  ASSIGNED: { label: "Driver Ditugaskan", color: "text-blue-600" },
  PICKED_UP: { label: "Dalam Perjalanan", color: "text-indigo-600" },
  DELIVERED: { label: "Terkirim", color: "text-emerald-600" },
  FAILED: { label: "Gagal", color: "text-rose-600" },
};

const OrderStatusPage = () => {
  const { cabangId, transaksiId } = useParams();
  const navigate = useNavigate();
  const cancelOrder = useCancelOrder();

  const { data: orderData, isLoading, refetch } = useOrderStatus(transaksiId, cabangId);
  const order = orderData?.data || null;

  const { data: trackingData } = useDeliveryTracking(
    order?.order_type === "DELIVERY" ? transaksiId : null
  );
  const tracking = trackingData?.data || [];

  const handleCancel = async () => {
    if (!window.confirm("Yakin ingin membatalkan pesanan ini?")) return;
    try {
      await cancelOrder.mutateAsync({
        transaksiId,
        alasan: "Dibatalkan oleh customer",
        cabangId,
      });
      toast.success("Pesanan berhasil dibatalkan");
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.errors || "Gagal membatalkan");
    }
  };

  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(transaksiId);
    toast.success("ID Order disalin");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <FiLoader className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <FiPackage className="w-20 h-20 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-600">
            Order tidak ditemukan
          </h2>
          <Link
            to={`/catalog/${cabangId}`}
            className="mt-4 inline-block text-indigo-600 font-medium"
          >
            ← Kembali ke katalog
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = STATUS_MAP[order.order_status] || STATUS_MAP.PENDING;
  const StatusIcon = statusInfo.icon;
  const payment = order.pembayaran?.[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pb-16">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(`/catalog/${cabangId}`)}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-slate-800">Status Pesanan</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Status Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm text-center">
          <div
            className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${statusInfo.color} mb-4`}
          >
            <StatusIcon className="w-8 h-8" />
          </div>
          <h2 className={`text-xl font-bold ${statusInfo.color.split(" ")[0]}`}>
            {statusInfo.label}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {order.nomor_transaksi}
          </p>
          <button
            onClick={handleCopyOrderId}
            className="mt-2 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            <FiCopy className="w-3 h-3" /> Salin ID
          </button>
        </div>

        {/* Payment URL (if pending) */}
        {order.order_status === "PENDING" && payment?.payment_url && (
          <a
            href={payment.payment_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-center font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-200 transition-all"
          >
            <FiCreditCard className="inline w-5 h-5 mr-2" />
            Bayar Sekarang
          </a>
        )}

        {/* Expiry Notice */}
        {order.order_status === "PENDING" && order.order_expired_at && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
            <FiClock className="inline w-4 h-4 text-amber-600 mr-1" />
            <span className="text-sm text-amber-700">
              Batas pembayaran:{" "}
              {new Date(order.order_expired_at).toLocaleString("id-ID")}
            </span>
          </div>
        )}

        {/* Order Detail */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-3">Detail Pesanan</h3>
          <div className="space-y-2">
            {order.items.map((item, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.nama_produk}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FiPackage className="text-slate-300 w-4 h-4" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">
                    {item.nama_produk}
                  </p>
                  <p className="text-xs text-slate-500">
                    {item.jumlah} × {CURRENCY_FORMATTER.format(item.harga)}
                  </p>
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  {CURRENCY_FORMATTER.format(item.total)}
                </p>
              </div>
            ))}
          </div>
          <hr className="my-3" />
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span>{CURRENCY_FORMATTER.format(order.subtotal)}</span>
            </div>
            {order.diskon > 0 && (
              <div className="flex justify-between text-sm text-emerald-600">
                <span>Diskon</span>
                <span>-{CURRENCY_FORMATTER.format(order.diskon)}</span>
              </div>
            )}
            {order.delivery_fee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Ongkir</span>
                <span>{CURRENCY_FORMATTER.format(order.delivery_fee)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-1">
              <span>Total</span>
              <span className="text-indigo-600">
                {CURRENCY_FORMATTER.format(order.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Delivery Info */}
        {order.order_type === "DELIVERY" && (
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
            <h3 className="font-semibold text-slate-800">
              <FiTruck className="inline w-4 h-4 mr-1" />
              Info Pengiriman
            </h3>
            {order.customer?.address && (
              <p className="text-sm text-slate-600 flex items-start gap-2">
                <FiMapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {order.customer.address}
              </p>
            )}
            {order.driver && (
              <div className="bg-indigo-50 rounded-xl p-3">
                <p className="text-sm font-medium text-indigo-800">
                  Driver: {order.driver.nama}
                </p>
                <p className="text-xs text-indigo-600 flex items-center gap-1 mt-0.5">
                  <FiPhone className="w-3 h-3" />
                  {order.driver.phone}
                </p>
                {order.driver.plat && (
                  <p className="text-xs text-indigo-600 mt-0.5">
                    {order.driver.kendaraan} — {order.driver.plat}
                  </p>
                )}
              </div>
            )}
            {order.delivery_status && (
              <p
                className={`text-sm font-medium ${
                  DELIVERY_STATUS_MAP[order.delivery_status]?.color ||
                  "text-slate-600"
                }`}
              >
                Status:{" "}
                {DELIVERY_STATUS_MAP[order.delivery_status]?.label ||
                  order.delivery_status}
              </p>
            )}
          </div>
        )}

        {/* Delivery Tracking Timeline */}
        {tracking.length > 0 && (
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-3">
              Tracking Pengiriman
            </h3>
            <div className="space-y-3">
              {tracking.map((t, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        i === tracking.length - 1
                          ? "bg-indigo-500"
                          : "bg-slate-300"
                      }`}
                    />
                    {i < tracking.length - 1 && (
                      <div className="w-px h-full bg-slate-200" />
                    )}
                  </div>
                  <div className="pb-3">
                    <p className="text-sm font-medium text-slate-700">
                      {DELIVERY_STATUS_MAP[t.status]?.label || t.status}
                    </p>
                    {t.notes && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        {t.notes}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(t.created_at).toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Store Info */}
        {order.cabang && (
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-2">Info Toko</h3>
            <p className="text-sm text-slate-700">{order.cabang.nama}</p>
            <p className="text-xs text-slate-500">{order.cabang.alamat}</p>
            {order.cabang.telepon && (
              <p className="text-xs text-slate-500 mt-1">
                <FiPhone className="inline w-3 h-3 mr-1" />
                {order.cabang.telepon}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {order.order_status === "PENDING" && (
            <button
              onClick={handleCancel}
              disabled={cancelOrder.isPending}
              className="flex-1 py-3 border-2 border-rose-200 text-rose-600 font-semibold rounded-xl hover:bg-rose-50 transition-all disabled:opacity-50"
            >
              {cancelOrder.isPending ? "Membatalkan..." : "Batalkan Pesanan"}
            </button>
          )}
          <button
            onClick={() => navigate(`/catalog/${cabangId}`)}
            className="flex-1 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-all"
          >
            Kembali ke Katalog
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderStatusPage;
