import React, { useState, useEffect } from "react";
import { Save, Info, AlertTriangle, Check, X } from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useCabang } from "../../../features/cabang/hooks/useCabang";

const TaxSettings = () => {
  const { selectedCabang } = useCabang();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [taxConfig, setTaxConfig] = useState({
    is_tax_enabled: false,
    tax_percentage: 0,
    tax_name: "PPN",
    tax_number: "",
    is_tax_included: false,
  });

  // Fetch tax configuration for the selected branch
  useEffect(() => {
    if (selectedCabang?.id) {
      fetchTaxConfig();
    }
  }, [selectedCabang]);

  const fetchTaxConfig = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/tax-settings/${selectedCabang.id}`
      );
      if (response.data.success) {
        setTaxConfig(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching tax settings:", error);
      toast.error("Gagal mengambil pengaturan pajak");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTaxConfig((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value) || 0;
    setTaxConfig((prev) => ({
      ...prev,
      [name]: numValue,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await axios.post(
        `/api/tax-settings/${selectedCabang.id}`,
        taxConfig
      );

      if (response.data.success) {
        toast.success("Pengaturan pajak berhasil disimpan");
      } else {
        toast.error("Gagal menyimpan pengaturan pajak");
      }
    } catch (error) {
      console.error("Error saving tax settings:", error);
      toast.error("Gagal menyimpan pengaturan pajak");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Pengaturan Pajak</h1>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start">
            <Info
              className="text-blue-500 mr-3 mt-0.5 flex-shrink-0"
              size={20}
            />
            <div>
              <h3 className="font-semibold text-blue-700">
                Informasi Pengaturan Pajak
              </h3>
              <p className="text-blue-600 text-sm mt-1">
                Pengaturan ini akan memengaruhi perhitungan pajak pada seluruh
                transaksi di cabang {selectedCabang?.namaCabang || "ini"}.
                Pastikan informasi pajak yang dimasukkan sesuai dengan peraturan
                perpajakan yang berlaku.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Enable Tax Toggle */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-gray-800 font-medium block">
                    Aktifkan Pajak
                  </label>
                  <p className="text-sm text-gray-500">
                    Pajak akan diterapkan pada setiap transaksi
                  </p>
                </div>
                <div className="relative inline-block w-12 align-middle select-none">
                  <input
                    type="checkbox"
                    name="is_tax_enabled"
                    id="is_tax_enabled"
                    checked={taxConfig.is_tax_enabled}
                    onChange={handleChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="is_tax_enabled"
                    className={`block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${
                      taxConfig.is_tax_enabled ? "bg-indigo-500" : ""
                    }`}
                  >
                    <span
                      className={`block h-6 w-6 rounded-full bg-white transform transition-transform duration-200 ease-in ${
                        taxConfig.is_tax_enabled
                          ? "translate-x-6"
                          : "translate-x-0"
                      }`}
                    ></span>
                  </label>
                </div>
              </div>
            </div>

            {/* Tax Percentage */}
            <div className="mb-6">
              <label
                htmlFor="tax_percentage"
                className="text-gray-800 font-medium block mb-2"
              >
                Persentase Pajak (%)
              </label>
              <input
                type="number"
                name="tax_percentage"
                id="tax_percentage"
                min="0"
                max="100"
                step="0.01"
                value={taxConfig.tax_percentage}
                onChange={handleNumberChange}
                disabled={!taxConfig.is_tax_enabled}
                className={`w-full border ${
                  !taxConfig.is_tax_enabled
                    ? "bg-gray-100 border-gray-200"
                    : "border-gray-300"
                } rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400`}
              />
              <p className="text-sm text-gray-500 mt-1">
                Masukkan persentase pajak (e.g., 11 untuk 11%)
              </p>
            </div>

            {/* Tax Name */}
            <div className="mb-6">
              <label
                htmlFor="tax_name"
                className="text-gray-800 font-medium block mb-2"
              >
                Nama Pajak
              </label>
              <input
                type="text"
                name="tax_name"
                id="tax_name"
                value={taxConfig.tax_name}
                onChange={handleChange}
                disabled={!taxConfig.is_tax_enabled}
                className={`w-full border ${
                  !taxConfig.is_tax_enabled
                    ? "bg-gray-100 border-gray-200"
                    : "border-gray-300"
                } rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400`}
                placeholder="Contoh: PPN, PPh, dll."
              />
              <p className="text-sm text-gray-500 mt-1">
                Nama pajak yang akan ditampilkan pada struk dan faktur
              </p>
            </div>

            {/* Tax Number */}
            <div className="mb-6">
              <label
                htmlFor="tax_number"
                className="text-gray-800 font-medium block mb-2"
              >
                Nomor NPWP
              </label>
              <input
                type="text"
                name="tax_number"
                id="tax_number"
                value={taxConfig.tax_number}
                onChange={handleChange}
                disabled={!taxConfig.is_tax_enabled}
                className={`w-full border ${
                  !taxConfig.is_tax_enabled
                    ? "bg-gray-100 border-gray-200"
                    : "border-gray-300"
                } rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400`}
                placeholder="Contoh: 01.234.567.8-123.000"
              />
              <p className="text-sm text-gray-500 mt-1">
                NPWP yang akan ditampilkan pada faktur pajak
              </p>
            </div>

            {/* Tax Included Toggle */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-gray-800 font-medium block">
                    Harga Sudah Termasuk Pajak
                  </label>
                  <p className="text-sm text-gray-500">
                    Jika diaktifkan, harga yang ditampilkan sudah termasuk pajak
                  </p>
                </div>
                <div className="relative inline-block w-12 align-middle select-none">
                  <input
                    type="checkbox"
                    name="is_tax_included"
                    id="is_tax_included"
                    checked={taxConfig.is_tax_included}
                    onChange={handleChange}
                    disabled={!taxConfig.is_tax_enabled}
                    className="hidden"
                  />
                  <label
                    htmlFor="is_tax_included"
                    className={`block overflow-hidden h-6 rounded-full ${
                      !taxConfig.is_tax_enabled
                        ? "bg-gray-200 cursor-not-allowed"
                        : "bg-gray-300 cursor-pointer"
                    } ${
                      taxConfig.is_tax_included && taxConfig.is_tax_enabled
                        ? "bg-indigo-500"
                        : ""
                    }`}
                  >
                    <span
                      className={`block h-6 w-6 rounded-full bg-white transform transition-transform duration-200 ease-in ${
                        taxConfig.is_tax_included && taxConfig.is_tax_enabled
                          ? "translate-x-6"
                          : "translate-x-0"
                      }`}
                    ></span>
                  </label>
                </div>
              </div>
            </div>

            {/* Warning for tax change */}
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
              <AlertTriangle
                className="text-yellow-500 mr-3 mt-0.5 flex-shrink-0"
                size={20}
              />
              <div>
                <h3 className="font-semibold text-yellow-700">Perhatian</h3>
                <p className="text-yellow-600 text-sm mt-1">
                  Perubahan pada pengaturan pajak akan memengaruhi seluruh
                  transaksi baru. Transaksi yang sudah ada tidak akan
                  terpengaruh.
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className={`flex items-center px-4 py-2 rounded-lg ${
                  saving ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"
                } text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-50`}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="mr-2" size={18} />
                    <span>Simpan Pengaturan</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default TaxSettings;
