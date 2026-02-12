import { useState, useEffect } from "react";
import { FiSettings, FiSave, FiPercent, FiClock, FiDollarSign, FiToggleLeft, FiToggleRight } from "react-icons/fi";
import { useLoyaltyConfig, useCreateLoyaltyConfig, useUpdateLoyaltyConfig } from "../../loyalty/hooks/useLoyalty"

const LoyaltyConfigPage = () => {
  const { data: configData, isLoading } = useLoyaltyConfig();
  const createConfigMutation = useCreateLoyaltyConfig();
  const updateConfigMutation = useUpdateLoyaltyConfig();

  const [form, setForm] = useState({
    point_rate: 10000, // 1 poin per Rp 10.000
    minimum_transaction: 50000,
    expiry_days: 365,
    is_active: true,
    redeem_rules: { rate: 1, min_points: 10 }
  });

  const [hasConfig, setHasConfig] = useState(false);
  const [configId, setConfigId] = useState(null);

  useEffect(() => {
    if (configData?.data) {
      const config = configData.data;
      setForm({
        point_rate: parseInt(config.point_rate) || 10000,
        minimum_transaction: parseFloat(config.minimum_transaction) || 50000,
        expiry_days: parseInt(config.expiry_days) || 365,
        is_active: config.is_active !== false,
        redeem_rules: config.redeem_rules || { rate: 1, min_points: 10 }
      });
      if (config.loyalty_config_id) {
        setHasConfig(true);
        setConfigId(config.loyalty_config_id);
      }
    }
  }, [configData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (hasConfig && configId) {
      await updateConfigMutation.mutateAsync({ id: configId, data: form });
    } else {
      await createConfigMutation.mutateAsync(form);
    }
  };

  const isSaving = createConfigMutation.isPending || updateConfigMutation.isPending;

  // Calculate example points (point_rate means 1 point per X rupiah)
  const exampleAmount = 150000;
  const examplePoints = Math.floor(exampleAmount / form.point_rate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl">
            <FiSettings className="text-white" size={28} />
          </div>
          Konfigurasi Loyalty
        </h1>
        <p className="text-gray-400 mt-2">Atur pengaturan program loyalitas pelanggan</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-400 mt-4">Memuat konfigurasi...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 space-y-6">
              {/* Toggle Active */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <div>
                  <h3 className="text-white font-medium">Status Program Loyalty</h3>
                  <p className="text-gray-400 text-sm">
                    {form.is_active ? "Program sedang aktif" : "Program dinonaktifkan"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, is_active: !form.is_active })}
                  className={`p-2 rounded-lg transition-all ${
                    form.is_active ? "text-green-400" : "text-gray-500"
                  }`}
                >
                  {form.is_active ? (
                    <FiToggleRight size={32} />
                  ) : (
                    <FiToggleLeft size={32} />
                  )}
                </button>
              </div>

              {/* Points Rate */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-white font-medium">
                  <FiPercent className="text-amber-400" />
                  Point Rate (Rupiah per Poin)
                </label>
                <p className="text-gray-400 text-sm">
                  Berapa Rupiah yang harus dibelanjakan untuk mendapat 1 poin
                </p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">Rp</span>
                  <input
                    type="number"
                    value={form.point_rate}
                    onChange={(e) => setForm({ ...form, point_rate: parseInt(e.target.value) || 1000 })}
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                  />
                </div>
                <div className="text-xs text-gray-500">
                  Contoh: 10000 berarti 1 poin per Rp 10.000 belanja
                </div>
              </div>

              {/* Minimum Transaction */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-white font-medium">
                  <FiDollarSign className="text-green-400" />
                  Minimum Transaksi untuk Poin
                </label>
                <p className="text-gray-400 text-sm">
                  Transaksi minimal agar pelanggan mendapat poin
                </p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">Rp</span>
                  <input
                    type="number"
                    value={form.minimum_transaction}
                    onChange={(e) => setForm({ ...form, minimum_transaction: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-purple-500 outline-none"
                  />
                </div>
              </div>

              {/* Points Expiry */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-white font-medium">
                  <FiClock className="text-blue-400" />
                  Masa Berlaku Poin (Hari)
                </label>
                <p className="text-gray-400 text-sm">
                  Berapa hari poin berlaku sebelum kadaluarsa. Set 0 untuk tidak pernah expire.
                </p>
                <input
                  type="number"
                  value={form.expiry_days}
                  onChange={(e) => setForm({ ...form, expiry_days: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-purple-500 outline-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50"
              >
                <FiSave size={20} />
                {isSaving ? "Menyimpan..." : "Simpan Konfigurasi"}
              </button>
            </form>
          </div>

          {/* Preview Section */}
          <div className="space-y-6">
            {/* Points Calculator */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h3 className="text-white font-semibold mb-4">Simulasi Poin</h3>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl border border-amber-500/30">
                  <p className="text-gray-300 text-sm">Jika pelanggan belanja:</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    Rp {exampleAmount.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center justify-center">
                  <div className="w-8 h-8 flex items-center justify-center text-gray-500">↓</div>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30">
                  <p className="text-gray-300 text-sm">Poin yang didapat:</p>
                  <p className="text-3xl font-bold text-green-400 mt-1">
                    +{examplePoints.toLocaleString()} poin
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Info */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h3 className="text-white font-semibold mb-4">Informasi</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">1 Poin per</span>
                  <span className="text-white">Rp {form.point_rate.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Min. transaksi</span>
                  <span className="text-white">Rp {form.minimum_transaction.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Masa berlaku</span>
                  <span className="text-white">
                    {form.expiry_days > 0 ? `${form.expiry_days} hari` : "Tidak pernah expire"}
                  </span>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl p-6 border border-blue-500/20">
              <h3 className="text-blue-400 font-semibold mb-3">💡 Tips</h3>
              <ul className="text-gray-300 text-sm space-y-2">
                <li>• Rasio 0.01 = 1% cashback dalam bentuk poin</li>
                <li>• Set masa berlaku untuk mendorong pelanggan kembali</li>
                <li>• Minimum transaksi mencegah fraud dari transaksi kecil</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoyaltyConfigPage;
