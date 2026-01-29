import { useState } from "react";
import { X, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

const PembayaranHutangModal = ({ isOpen, onClose, onSubmit, hutang, isLoading }) => {
  const [formData, setFormData] = useState({
    jumlah_bayar: "",
    metode_pembayaran: "TUNAI",
    nomor_referensi: "",
    keterangan: "",
  });

  if (!isOpen) return null;

  const sisaHutang = parseFloat(hutang?.sisaHutang || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    const jumlahBayar = parseFloat(formData.jumlah_bayar);

    if (jumlahBayar <= 0) {
      alert("Jumlah bayar harus lebih dari 0");
      return;
    }

    if (jumlahBayar > sisaHutang) {
      alert(`Jumlah bayar melebihi sisa hutang (Rp ${sisaHutang.toLocaleString("id-ID")})`);
      return;
    }

    onSubmit({
      ...formData,
      jumlah_bayar: jumlahBayar,
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleQuickAmount = (percentage) => {
    const amount = (sisaHutang * percentage) / 100;
    setFormData((prev) => ({ ...prev, jumlah_bayar: amount.toString() }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Pembayaran Hutang
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Info Sisa Hutang */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Sisa Hutang</p>
                <p className="text-xl font-bold text-blue-700">
                  Rp {sisaHutang.toLocaleString("id-ID")}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Jatuh Tempo:{" "}
              {format(new Date(hutang?.jatuhTempo), "dd MMM yyyy", { locale: idLocale })}
            </p>
          </div>

          {/* Quick Amount Buttons */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jumlah Cepat
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handleQuickAmount(pct)}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Jumlah Bayar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jumlah Bayar <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                Rp
              </span>
              <input
                type="number"
                name="jumlah_bayar"
                value={formData.jumlah_bayar}
                onChange={handleChange}
                required
                min="0.01"
                step="0.01"
                max={sisaHutang}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Maksimum: Rp {sisaHutang.toLocaleString("id-ID")}
            </p>
          </div>

          {/* Metode Pembayaran */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Metode Pembayaran <span className="text-red-500">*</span>
            </label>
            <select
              name="metode_pembayaran"
              value={formData.metode_pembayaran}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="TUNAI">Tunai</option>
              <option value="TRANSFER">Transfer Bank</option>
              <option value="KARTU_DEBIT">Kartu Debit</option>
              <option value="KARTU_KREDIT">Kartu Kredit</option>
              <option value="QRIS">QRIS</option>
              <option value="E_WALLET">E-Wallet</option>
            </select>
          </div>

          {/* Nomor Referensi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nomor Referensi
            </label>
            <input
              type="text"
              name="nomor_referensi"
              value={formData.nomor_referensi}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Contoh: NO-REF-001"
            />
          </div>

          {/* Keterangan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Keterangan
            </label>
            <textarea
              name="keterangan"
              value={formData.keterangan}
              onChange={handleChange}
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Catatan pembayaran..."
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Memproses..." : "Bayar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PembayaranHutangModal;
