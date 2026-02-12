import React, { useState, useEffect } from "react";
import { Save, Info, FileText, Upload, X, Image, Check } from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useCabang } from "../../../features/cabang/hooks/useCabang";

const ReceiptSettings = () => {
  const { selectedCabang } = useCabang();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [receiptConfig, setReceiptConfig] = useState({
    headerText: "",
    footerText: "",
    showTaxDetails: true,
    showCashierName: true,
    printPaperWidth: 80,
    printAutomatically: false,
    thankYouMessage: "",
    address: "",
    phoneNumber: "",
    showQrCode: true,
    logoUrl: "",
    fontSize: 12,
    language: "id",
  });
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);

  // Fetch receipt configuration for the selected branch
  useEffect(() => {
    if (selectedCabang?.id) {
      fetchReceiptConfig();
    }
  }, [selectedCabang]);

  const fetchReceiptConfig = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/receipt-settings/${selectedCabang.id}`
      );
      if (response.data.success) {
        setReceiptConfig(response.data.data);
        if (response.data.data.logoUrl) {
          setLogoPreview(response.data.data.logoUrl);
        }
      }
    } catch (error) {
      console.error("Error fetching receipt settings:", error);
      toast.error("Gagal mengambil pengaturan struk");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setReceiptConfig((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    const numValue = parseInt(value, 10) || 0;
    setReceiptConfig((prev) => ({
      ...prev,
      [name]: numValue,
    }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toast.error("Ukuran logo terlalu besar. Maksimum 1MB.");
        return;
      }

      setLogoFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogoPreview = () => {
    setLogoPreview(null);
    setLogoFile(null);
    setReceiptConfig((prev) => ({
      ...prev,
      logoUrl: "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // If there's a new logo, upload it first
      if (logoFile) {
        const formData = new FormData();
        formData.append("logo", logoFile);
        formData.append("cabangId", selectedCabang.id);

        const uploadResponse = await axios.post(
          "/api/upload/receipt-logo",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (uploadResponse.data.success) {
          setReceiptConfig((prev) => ({
            ...prev,
            logoUrl: uploadResponse.data.logoUrl,
          }));
        } else {
          throw new Error("Logo upload failed");
        }
      }

      // Then save the receipt config
      const response = await axios.post(
        `/api/receipt-settings/${selectedCabang.id}`,
        receiptConfig
      );

      if (response.data.success) {
        toast.success("Pengaturan struk berhasil disimpan");
      } else {
        toast.error("Gagal menyimpan pengaturan struk");
      }
    } catch (error) {
      console.error("Error saving receipt settings:", error);
      toast.error("Gagal menyimpan pengaturan struk");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Pengaturan Struk</h1>
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
                Informasi Pengaturan Struk
              </h3>
              <p className="text-blue-600 text-sm mt-1">
                Pengaturan ini akan memengaruhi tampilan dan konten struk yang
                dicetak untuk pelanggan di cabang{" "}
                {selectedCabang?.namaCabang || "ini"}.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Logo Upload */}
            <div className="mb-6">
              <label className="text-gray-800 font-medium block mb-2">
                Logo Struk
              </label>

              {logoPreview ? (
                <div className="relative border border-gray-300 rounded-lg p-2 w-48 h-48 flex items-center justify-center mb-2">
                  <img
                    src={logoPreview}
                    alt="Logo Preview"
                    className="max-w-full max-h-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={removeLogoPreview}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center mb-2 cursor-pointer hover:bg-gray-50 transition-colors duration-200">
                  <input
                    type="file"
                    id="logo"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="logo"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Image size={40} className="text-gray-400 mb-2" />
                    <span className="block text-gray-500 font-medium">
                      Klik untuk upload logo
                    </span>
                    <span className="block text-gray-400 text-sm mt-1">
                      Maksimum 1MB, format JPG, PNG, atau SVG
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label
                  htmlFor="address"
                  className="text-gray-800 font-medium block mb-2"
                >
                  Alamat
                </label>
                <textarea
                  rows="3"
                  name="address"
                  id="address"
                  value={receiptConfig.address || ""}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="Masukkan alamat yang akan ditampilkan pada struk"
                />
              </div>
              <div>
                <label
                  htmlFor="phoneNumber"
                  className="text-gray-800 font-medium block mb-2"
                >
                  Nomor Telepon
                </label>
                <input
                  type="text"
                  name="phoneNumber"
                  id="phoneNumber"
                  value={receiptConfig.phoneNumber || ""}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="Ex: 021-1234567"
                />
              </div>
            </div>

            {/* Header & Footer Text */}
            <div className="grid grid-cols-1 gap-4 mb-6">
              <div>
                <label
                  htmlFor="headerText"
                  className="text-gray-800 font-medium block mb-2"
                >
                  Header Struk
                </label>
                <textarea
                  rows="3"
                  name="headerText"
                  id="headerText"
                  value={receiptConfig.headerText || ""}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="Header akan ditampilkan di bagian atas struk"
                />
              </div>
              <div>
                <label
                  htmlFor="footerText"
                  className="text-gray-800 font-medium block mb-2"
                >
                  Footer Struk
                </label>
                <textarea
                  rows="3"
                  name="footerText"
                  id="footerText"
                  value={receiptConfig.footerText || ""}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="Footer akan ditampilkan di bagian bawah struk"
                />
              </div>
              <div>
                <label
                  htmlFor="thankYouMessage"
                  className="text-gray-800 font-medium block mb-2"
                >
                  Pesan Terima Kasih
                </label>
                <input
                  type="text"
                  name="thankYouMessage"
                  id="thankYouMessage"
                  value={receiptConfig.thankYouMessage || ""}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="Contoh: Terima kasih telah berbelanja di toko kami"
                />
              </div>
            </div>

            {/* Display Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-gray-800 font-medium mb-3">
                  Tampilan Informasi
                </h3>

                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="showTaxDetails"
                      checked={receiptConfig.showTaxDetails}
                      onChange={handleChange}
                      className="form-checkbox h-5 w-5 text-indigo-600 rounded focus:ring-indigo-400"
                    />
                    <span className="ml-2 text-gray-700">
                      Tampilkan Detail Pajak
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="showCashierName"
                      checked={receiptConfig.showCashierName}
                      onChange={handleChange}
                      className="form-checkbox h-5 w-5 text-indigo-600 rounded focus:ring-indigo-400"
                    />
                    <span className="ml-2 text-gray-700">
                      Tampilkan Nama Kasir
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="showQrCode"
                      checked={receiptConfig.showQrCode}
                      onChange={handleChange}
                      className="form-checkbox h-5 w-5 text-indigo-600 rounded focus:ring-indigo-400"
                    />
                    <span className="ml-2 text-gray-700">
                      Tampilkan QR Code
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-gray-800 font-medium mb-3">
                  Opsi Pencetakan
                </h3>

                <div className="mb-3">
                  <label
                    htmlFor="printPaperWidth"
                    className="block text-gray-700 mb-1"
                  >
                    Lebar Kertas (mm)
                  </label>
                  <input
                    type="number"
                    name="printPaperWidth"
                    id="printPaperWidth"
                    min="58"
                    max="100"
                    value={receiptConfig.printPaperWidth}
                    onChange={handleNumberChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <p className="text-gray-500 text-sm mt-1">
                    Lebar standar: 58mm atau 80mm
                  </p>
                </div>

                <div className="mb-3">
                  <label
                    htmlFor="fontSize"
                    className="block text-gray-700 mb-1"
                  >
                    Ukuran Font
                  </label>
                  <select
                    name="fontSize"
                    id="fontSize"
                    value={receiptConfig.fontSize}
                    onChange={handleNumberChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="10">Kecil (10pt)</option>
                    <option value="12">Sedang (12pt)</option>
                    <option value="14">Besar (14pt)</option>
                  </select>
                </div>

                <label className="flex items-center mt-4">
                  <input
                    type="checkbox"
                    name="printAutomatically"
                    checked={receiptConfig.printAutomatically}
                    onChange={handleChange}
                    className="form-checkbox h-5 w-5 text-indigo-600 rounded focus:ring-indigo-400"
                  />
                  <span className="ml-2 text-gray-700">
                    Cetak Otomatis setelah Transaksi
                  </span>
                </label>
              </div>
            </div>

            {/* Language Selection */}
            <div className="mb-6">
              <label
                htmlFor="language"
                className="text-gray-800 font-medium block mb-2"
              >
                Bahasa Struk
              </label>
              <select
                name="language"
                id="language"
                value={receiptConfig.language}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="id">Bahasa Indonesia</option>
                <option value="en">English</option>
              </select>
            </div>

            {/* Receipt Preview */}
            <div className="mb-6 border border-gray-300 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-800">Preview Struk</h3>
                <button
                  type="button"
                  className="text-indigo-600 hover:text-indigo-800 flex items-center"
                  onClick={() =>
                    toast.success("Fitur preview dalam pengembangan")
                  }
                >
                  <FileText size={16} className="mr-1" />
                  <span>Lihat Preview</span>
                </button>
              </div>
              <div className="bg-gray-100 p-4 rounded-lg text-center text-gray-500">
                Preview struk akan tersedia di sini
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

export default ReceiptSettings;
