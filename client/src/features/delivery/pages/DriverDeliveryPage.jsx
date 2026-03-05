import { useState } from "react";
import {
  FiTruck,
  FiPackage,
  FiPhone,
  FiMapPin,
  FiCheck,
  FiX,
  FiRefreshCw,
  FiDollarSign,
  FiAlertTriangle,
  FiNavigation,
  FiClock,
  FiUser,
  FiClipboard,
} from "react-icons/fi";
import toast from "react-hot-toast";
import {
  useDriverActiveDeliveries,
  useUpdateDeliveryStatus,
  useMarkPaymentReceived,
  useMarkDeliveryFailed,
  useAddDeliveryLocation,
} from "../hooks/useDelivery";
import { useAuth } from "../../auth/hooks/useAuth";

const DriverDeliveryPage = () => {
  const { user } = useAuth();
  const [codModal, setCodModal] = useState(null);
  const [failedModal, setFailedModal] = useState(null);
  const [jumlahBayar, setJumlahBayar] = useState("");
  const [alasanGagal, setAlasanGagal] = useState("");

  // driverId is populated by authService if user has a linked driver record
  const driverId = user?.driverId;

  const {
    data: deliveries,
    isLoading,
    refetch,
  } = useDriverActiveDeliveries(driverId);

  const updateStatus = useUpdateDeliveryStatus();
  const markPayment = useMarkPaymentReceived();
  const markFailed = useMarkDeliveryFailed();
  const addLocation = useAddDeliveryLocation();

  const orders = deliveries?.data || deliveries || [];

  const handlePickup = async (transaksiId) => {
    try {
      await updateStatus.mutateAsync({
        transaksiId,
        data: { status: "PICKED_UP" },
      });
      toast.success("Barang diambil! Mulai pengiriman 🚚");
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Gagal update status");
    }
  };

  const handleDelivered = async (transaksiId) => {
    try {
      // Try to get current location for proof
      let lat = null, lng = null;
      try {
        const pos = await new Promise((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch { /* GPS not available */ }

      await updateStatus.mutateAsync({
        transaksiId,
        data: {
          status: "DELIVERED",
          latitude: lat,
          longitude: lng,
        },
      });
      toast.success("Pengiriman selesai! ✅");
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Gagal update status");
    }
  };

  const handleCodSubmit = async () => {
    if (!jumlahBayar || Number(jumlahBayar) <= 0) {
      toast.error("Masukkan jumlah bayar yang valid");
      return;
    }
    try {
      const result = await markPayment.mutateAsync({
        transaksiId: codModal.transaksi_id,
        data: { jumlah_bayar: Number(jumlahBayar) },
      });
      toast.success(
        `Pembayaran COD diterima! Kembalian: Rp ${(result?.data?.kembalian || 0).toLocaleString("id-ID")}`
      );
      setCodModal(null);
      setJumlahBayar("");
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Gagal catat pembayaran");
    }
  };

  const handleFailedSubmit = async () => {
    if (!alasanGagal.trim()) {
      toast.error("Masukkan alasan gagal kirim");
      return;
    }
    try {
      await markFailed.mutateAsync({
        transaksiId: failedModal.transaksi_id,
        alasan: alasanGagal,
      });
      toast.success("Pengiriman ditandai gagal");
      setFailedModal(null);
      setAlasanGagal("");
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Gagal update status");
    }
  };

  const handleShareLocation = async (transaksiId) => {
    try {
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
      );
      await addLocation.mutateAsync({
        transaksiId,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      toast.success("Lokasi dikirim 📍");
    } catch {
      toast.error("Gagal mengirim lokasi. Aktifkan GPS.");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "ASSIGNED": return "bg-amber-500";
      case "PICKED_UP": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "ASSIGNED": return "Menunggu Pickup";
      case "PICKED_UP": return "Dalam Perjalanan";
      default: return status;
    }
  };

  if (!driverId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800/70 backdrop-blur-xl rounded-2xl p-8 text-center border border-gray-700/50 max-w-md w-full">
          <FiAlertTriangle className="mx-auto text-amber-400 mb-4" size={48} />
          <h2 className="text-xl font-bold text-white mb-2">Akun Driver Tidak Terhubung</h2>
          <p className="text-gray-400">
            Akun Anda belum terhubung dengan data driver. Hubungi admin untuk menghubungkan akun.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-5 sticky top-0 z-10 shadow-xl">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-2.5">
              <FiTruck className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">Tugas Pengiriman</h1>
              <p className="text-emerald-100 text-sm">
                {orders.length} tugas aktif
              </p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            className="bg-white/20 hover:bg-white/30 rounded-full p-2.5 text-white transition"
          >
            <FiRefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-4 space-y-4 pb-20">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-500 border-t-transparent"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-gray-800/60 backdrop-blur rounded-2xl p-8 text-center border border-gray-700/50">
            <FiPackage className="mx-auto text-gray-500 mb-4" size={48} />
            <h3 className="text-white font-semibold text-lg mb-1">Tidak Ada Tugas</h3>
            <p className="text-gray-400 text-sm">
              Belum ada pengiriman yang ditugaskan. Tarik untuk refresh.
            </p>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.transaksi_id}
              className="bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-gray-700/50 overflow-hidden shadow-lg"
            >
              {/* Card Header */}
              <div className="px-4 py-3 border-b border-gray-700/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`${getStatusColor(order.delivery_status)} text-white text-xs font-bold px-2.5 py-1 rounded-full`}>
                    {getStatusLabel(order.delivery_status)}
                  </span>
                  {order.is_cod && (
                    <span className="bg-orange-500/20 text-orange-400 text-xs font-bold px-2.5 py-1 rounded-full border border-orange-500/30">
                      💰 COD
                    </span>
                  )}
                </div>
                <span className="text-gray-400 text-xs font-mono">
                  #{order.nomor_transaksi?.slice(-8)}
                </span>
              </div>

              {/* Card Body */}
              <div className="px-4 py-3 space-y-3">
                {/* Customer Info */}
                <div className="space-y-1.5">
                  <div className="flex items-start gap-2">
                    <FiUser className="text-gray-400 mt-0.5 shrink-0" size={14} />
                    <span className="text-white text-sm">{order.customer_name || "-"}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <FiMapPin className="text-emerald-400 mt-0.5 shrink-0" size={14} />
                    <span className="text-gray-300 text-sm">{order.customer_address || "-"}</span>
                  </div>
                  {order.customer_phone && order.customer_phone !== "-" && (
                    <div className="flex items-center gap-2">
                      <FiPhone className="text-blue-400 shrink-0" size={14} />
                      <a href={`tel:${order.customer_phone}`} className="text-blue-400 text-sm underline">
                        {order.customer_phone}
                      </a>
                    </div>
                  )}
                  {order.customer_notes && (
                    <div className="flex items-start gap-2">
                      <FiClipboard className="text-amber-400 mt-0.5 shrink-0" size={14} />
                      <span className="text-amber-300 text-sm italic">{order.customer_notes}</span>
                    </div>
                  )}
                </div>

                {/* Items */}
                <div className="bg-gray-900/50 rounded-xl p-3">
                  <div className="text-gray-400 text-xs uppercase tracking-wider mb-1.5 font-semibold">
                    Item Pesanan
                  </div>
                  {order.items?.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm py-0.5">
                      <span className="text-gray-300">{item.nama}</span>
                      <span className="text-white font-semibold">x{item.jumlah}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-700/50 mt-2 pt-2 flex justify-between">
                    <span className="text-gray-400 text-sm font-semibold">Total</span>
                    <span className="text-emerald-400 font-bold">
                      Rp {order.total?.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                {/* Time */}
                <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                  <FiClock size={12} />
                  {new Date(order.created_at).toLocaleString("id-ID", {
                    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-4 py-3 border-t border-gray-700/50 space-y-2">
                {order.delivery_status === "ASSIGNED" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePickup(order.transaksi_id)}
                      disabled={updateStatus.isPending}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50"
                    >
                      <FiPackage size={16} /> Ambil Barang
                    </button>
                    <button
                      onClick={() => setFailedModal(order)}
                      className="bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-1 transition border border-red-500/30"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                )}

                {order.delivery_status === "PICKED_UP" && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelivered(order.transaksi_id)}
                        disabled={updateStatus.isPending}
                        className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50"
                      >
                        <FiCheck size={16} /> Sudah Diantar
                      </button>
                      <button
                        onClick={() => handleShareLocation(order.transaksi_id)}
                        disabled={addLocation.isPending}
                        className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 font-semibold py-3 px-4 rounded-xl flex items-center justify-center transition border border-purple-500/30"
                      >
                        <FiNavigation size={16} />
                      </button>
                    </div>
                    {order.is_cod && (
                      <button
                        onClick={() => { setCodModal(order); setJumlahBayar(String(order.total)); }}
                        className="w-full bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition"
                      >
                        <FiDollarSign size={16} /> Terima Bayaran COD
                      </button>
                    )}
                    <button
                      onClick={() => setFailedModal(order)}
                      className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 transition text-sm border border-red-500/20"
                    >
                      <FiAlertTriangle size={14} /> Gagal Kirim
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* COD Payment Modal */}
      {codModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-800 rounded-2xl w-full max-w-md border border-gray-700/50 shadow-2xl">
            <div className="px-5 py-4 border-b border-gray-700/50">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <FiDollarSign className="text-orange-400" /> Terima Bayaran COD
              </h3>
              <p className="text-gray-400 text-sm mt-1">
                #{codModal.nomor_transaksi?.slice(-8)} — Total: Rp {codModal.total?.toLocaleString("id-ID")}
              </p>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="text-gray-300 text-sm font-medium mb-1.5 block">Jumlah Bayar</label>
                <input
                  type="number"
                  value={jumlahBayar}
                  onChange={(e) => setJumlahBayar(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-600 rounded-xl px-4 py-3 text-white text-lg font-semibold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  placeholder="0"
                />
              </div>
              {Number(jumlahBayar) > 0 && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                  <span className="text-emerald-300 text-sm">Kembalian: </span>
                  <span className="text-emerald-400 font-bold text-lg">
                    Rp {Math.max(0, Number(jumlahBayar) - codModal.total).toLocaleString("id-ID")}
                  </span>
                </div>
              )}
            </div>
            <div className="px-5 py-4 border-t border-gray-700/50 flex gap-3">
              <button
                onClick={() => { setCodModal(null); setJumlahBayar(""); }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 rounded-xl transition"
              >
                Batal
              </button>
              <button
                onClick={handleCodSubmit}
                disabled={markPayment.isPending}
                className="flex-1 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
              >
                {markPayment.isPending ? "Memproses..." : "Konfirmasi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Failed Delivery Modal */}
      {failedModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-800 rounded-2xl w-full max-w-md border border-gray-700/50 shadow-2xl">
            <div className="px-5 py-4 border-b border-gray-700/50">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <FiAlertTriangle className="text-red-400" /> Gagal Kirim
              </h3>
              <p className="text-gray-400 text-sm mt-1">
                #{failedModal.nomor_transaksi?.slice(-8)}
              </p>
            </div>
            <div className="px-5 py-4">
              <label className="text-gray-300 text-sm font-medium mb-1.5 block">Alasan Gagal</label>
              <textarea
                value={alasanGagal}
                onChange={(e) => setAlasanGagal(e.target.value)}
                rows={3}
                className="w-full bg-gray-900/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none resize-none"
                placeholder="Contoh: Alamat tidak ditemukan, customer tidak ada di tempat..."
              />
            </div>
            <div className="px-5 py-4 border-t border-gray-700/50 flex gap-3">
              <button
                onClick={() => { setFailedModal(null); setAlasanGagal(""); }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 rounded-xl transition"
              >
                Batal
              </button>
              <button
                onClick={handleFailedSubmit}
                disabled={markFailed.isPending}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
              >
                {markFailed.isPending ? "Memproses..." : "Konfirmasi Gagal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverDeliveryPage;
