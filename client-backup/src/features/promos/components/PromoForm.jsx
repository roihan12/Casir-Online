import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Save,
  ChevronLeft,
  Calendar,
  Percent,
  DollarSign,
  Tag,
  ShoppingBag,
  Layers,
  AlertCircle,
  Users,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import promoService from "../../../services/promoService";
import { useCabang } from "../../../features/cabang/hooks/useCabang";

const PromoForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedCabang } = useCabang();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    namaPromo: "",
    kodePromo: "",
    tipeDiskon: "persentase",
    nilaiDiskon: "",
    minPembelian: "",
    maxDiskon: "",
    tanggalMulai: format(new Date(), "yyyy-MM-dd"),
    tanggalBerakhir: format(
      new Date(new Date().setDate(new Date().getDate() + 30)),
      "yyyy-MM-dd"
    ),
    limitPenggunaan: "",
    kategoriId: "",
    produkId: "",
    cabangId: selectedCabang?.id || "",
    status: "aktif",
  });

  const isEditMode = !!id;

  // Load existing promo data if in edit mode
  useEffect(() => {
    const fetchPromo = async () => {
      if (!isEditMode) return;

      setLoading(true);
      try {
        // In a real app, this would be:
        // const response = await promoService.getPromoById(id);
        // const promoData = response.data;

        // Mock data for demonstration
        const promoData = {
          id,
          namaPromo: `Promo ${id.split("-")[1]}`,
          kodePromo: `PROMO${id.split("-")[1]}`,
          tipeDiskon: ["persentase", "nominal", "bogo", "bundle"][
            Math.floor(Math.random() * 4)
          ],
          nilaiDiskon: Math.floor(Math.random() * 50),
          minPembelian: Math.floor(Math.random() * 200000),
          maxDiskon: Math.floor(Math.random() * 100000),
          tanggalMulai: new Date(),
          tanggalBerakhir: new Date(
            new Date().setDate(new Date().getDate() + 30)
          ),
          limitPenggunaan: Math.floor(Math.random() * 100),
          kategoriId: Math.random() > 0.5 ? "cat1" : "",
          produkId: Math.random() > 0.5 ? "prod1" : "",
          cabangId: selectedCabang?.id || "",
          status: Math.random() > 0.5 ? "aktif" : "nonaktif",
        };

        // Format dates for form inputs
        const formattedPromo = {
          ...promoData,
          tanggalMulai: format(new Date(promoData.tanggalMulai), "yyyy-MM-dd"),
          tanggalBerakhir: format(
            new Date(promoData.tanggalBerakhir),
            "yyyy-MM-dd"
          ),
        };

        setFormData(formattedPromo);
      } catch (error) {
        console.error("Error fetching promo:", error);
        toast.error("Gagal memuat data promo");
      } finally {
        setLoading(false);
      }
    };

    fetchPromo();
  }, [id, isEditMode]);

  // Load categories and products
  useEffect(() => {
    const fetchCategoriesAndProducts = async () => {
      // Mock categories for now
      const mockCategories = [
        { id: "cat1", namaKategori: "Makanan" },
        { id: "cat2", namaKategori: "Minuman" },
        { id: "cat3", namaKategori: "Alat Tulis" },
        { id: "cat4", namaKategori: "Elektronik" },
        { id: "cat5", namaKategori: "Rumah Tangga" },
      ];

      // Mock products for now
      const mockProducts = [
        { id: "prod1", namaProduk: "Produk 1" },
        { id: "prod2", namaProduk: "Produk 2" },
        { id: "prod3", namaProduk: "Produk 3" },
        { id: "prod4", namaProduk: "Produk 4" },
        { id: "prod5", namaProduk: "Produk 5" },
      ];

      setCategories(mockCategories);
      setProducts(mockProducts);
    };

    fetchCategoriesAndProducts();
  }, [selectedCabang]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle numeric inputs with formatting
  const handleNumericChange = (e) => {
    const { name, value } = e.target;
    const numericValue = value.replace(/\D/g, "");
    setFormData((prev) => ({
      ...prev,
      [name]: numericValue,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validate form
      if (!formData.namaPromo || !formData.kodePromo || !formData.nilaiDiskon) {
        toast.error("Mohon lengkapi data yang diperlukan");
        setSubmitting(false);
        return;
      }

      // Format data for API
      const apiData = {
        ...formData,
        nilaiDiskon: parseFloat(formData.nilaiDiskon),
        minPembelian: formData.minPembelian
          ? parseFloat(formData.minPembelian)
          : null,
        maxDiskon: formData.maxDiskon ? parseFloat(formData.maxDiskon) : null,
        limitPenggunaan: formData.limitPenggunaan
          ? parseInt(formData.limitPenggunaan)
          : null,
        kategoriId: formData.kategoriId || null,
        produkId: formData.produkId || null,
      };

      if (isEditMode) {
        // In a real app, this would be:
        // await promoService.updatePromo(id, apiData);
        console.log("Updating promo:", apiData);
        toast.success("Promo berhasil diperbarui");
      } else {
        // In a real app, this would be:
        // await promoService.createPromo(apiData);
        console.log("Creating promo:", apiData);
        toast.success("Promo berhasil dibuat");
      }

      // Navigate back to promo list
      navigate("/superadmin/promos");
    } catch (error) {
      console.error("Error saving promo:", error);
      toast.error(
        isEditMode ? "Gagal memperbarui promo" : "Gagal membuat promo"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Format currency for display
  const formatCurrency = (value) => {
    if (!value) return "";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Show help text based on discount type
  const getDiscountHelp = () => {
    switch (formData.tipeDiskon) {
      case "persentase":
        return "Masukkan nilai persentase diskon (1-100)";
      case "nominal":
        return "Masukkan nilai diskon dalam Rupiah";
      case "bogo":
        return "Beli 1 Gratis 1 - Pembeli mendapatkan produk gratis dengan jumlah yang sama";
      case "bundle":
        return "Paket Bundling - Beberapa produk dijual dengan harga paket";
      default:
        return "";
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/superadmin/promos")}
            className="flex items-center justify-center h-10 w-10 rounded-lg border hover:bg-gray-50"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-2xl font-semibold text-gray-800">
            {isEditMode ? "Edit Promo" : "Buat Promo Baru"}
          </h1>
        </div>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <Save size={16} />
          <span>{submitting ? "Menyimpan..." : "Simpan"}</span>
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow p-6 flex items-center justify-center h-96">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mb-4"></div>
            <p className="text-gray-500">Memuat data promo...</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-medium mb-4">Informasi Dasar</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Promo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="namaPromo"
                  value={formData.namaPromo}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Masukkan nama promo"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kode Promo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="kodePromo"
                  value={formData.kodePromo}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                  placeholder="Masukkan kode promo"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Kode ini akan dimasukkan oleh pelanggan untuk mengaktifkan
                  promo
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipe Diskon <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="tipeDiskon"
                    value={formData.tipeDiskon}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none pr-10"
                    required
                  >
                    <option value="persentase">Persentase (%)</option>
                    <option value="nominal">Nominal (Rp)</option>
                    <option value="bogo">Beli 1 Gratis 1</option>
                    <option value="bundle">Bundling</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <ChevronLeft className="rotate-270 h-4 w-4 text-gray-500" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {getDiscountHelp()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nilai Diskon <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    {formData.tipeDiskon === "persentase" ? (
                      <Percent size={16} className="text-gray-500" />
                    ) : (
                      <DollarSign size={16} className="text-gray-500" />
                    )}
                  </div>
                  <input
                    type="text"
                    name="nilaiDiskon"
                    value={formData.nilaiDiskon}
                    onChange={handleNumericChange}
                    disabled={
                      formData.tipeDiskon === "bogo" ||
                      formData.tipeDiskon === "bundle"
                    }
                    className="w-full pl-10 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
                    placeholder={
                      formData.tipeDiskon === "persentase"
                        ? "Contoh: 10"
                        : "Contoh: 10000"
                    }
                    required={
                      formData.tipeDiskon !== "bogo" &&
                      formData.tipeDiskon !== "bundle"
                    }
                  />
                </div>
                {formData.tipeDiskon === "persentase" && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maksimum Diskon
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <DollarSign size={16} className="text-gray-500" />
                      </div>
                      <input
                        type="text"
                        name="maxDiskon"
                        value={formData.maxDiskon}
                        onChange={handleNumericChange}
                        className="w-full pl-10 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Maksimum diskon dalam Rupiah"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Batas maksimum nilai diskon yang bisa didapatkan
                    </p>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Pembelian
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <DollarSign size={16} className="text-gray-500" />
                  </div>
                  <input
                    type="text"
                    name="minPembelian"
                    value={formData.minPembelian}
                    onChange={handleNumericChange}
                    className="w-full pl-10 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Minimum pembelian dalam Rupiah"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Jumlah minimum pembelian untuk menggunakan promo ini
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <div className="relative">
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none pr-10"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <ChevronLeft className="rotate-270 h-4 w-4 text-gray-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-b">
            <h2 className="text-lg font-medium mb-4">Target Promo</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategori
                </label>
                <div className="relative">
                  <select
                    name="kategoriId"
                    value={formData.kategoriId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none pr-10"
                  >
                    <option value="">Semua Kategori</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.namaKategori}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <ChevronLeft className="rotate-270 h-4 w-4 text-gray-500" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Berlaku untuk semua produk dalam kategori ini
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Produk
                </label>
                <div className="relative">
                  <select
                    name="produkId"
                    value={formData.produkId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none pr-10"
                    disabled={formData.kategoriId !== ""}
                  >
                    <option value="">Semua Produk</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.namaProduk}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <ChevronLeft className="rotate-270 h-4 w-4 text-gray-500" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.kategoriId !== ""
                    ? "Tidak dapat memilih produk spesifik jika kategori dipilih"
                    : "Berlaku untuk produk spesifik ini saja"}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 border-b">
            <h2 className="text-lg font-medium mb-4">Periode & Batasan</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Mulai <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Calendar size={16} className="text-gray-500" />
                  </div>
                  <input
                    type="date"
                    name="tanggalMulai"
                    value={formData.tanggalMulai}
                    onChange={handleChange}
                    className="w-full pl-10 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Berakhir <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Calendar size={16} className="text-gray-500" />
                  </div>
                  <input
                    type="date"
                    name="tanggalBerakhir"
                    value={formData.tanggalBerakhir}
                    onChange={handleChange}
                    className="w-full pl-10 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Limit Penggunaan
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Users size={16} className="text-gray-500" />
                  </div>
                  <input
                    type="text"
                    name="limitPenggunaan"
                    value={formData.limitPenggunaan}
                    onChange={handleNumericChange}
                    className="w-full pl-10 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Jumlah maksimum penggunaan"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Batas maksimum berapa kali promo ini dapat digunakan.
                  Kosongkan untuk tanpa batas.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 flex justify-between">
            <div className="flex items-center">
              <AlertCircle size={16} className="text-amber-500 mr-2" />
              <span className="text-sm text-gray-600">
                <span className="text-red-500">*</span> menandakan kolom wajib
                diisi
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => navigate("/superadmin/promos")}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <Save size={16} />
                <span>{submitting ? "Menyimpan..." : "Simpan"}</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default PromoForm;
