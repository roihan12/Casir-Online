import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Truck,
  ArrowLeft,
  Save,
  AlertTriangle,
  RotateCw,
  Check,
  X,
} from "lucide-react";
import supplierService from "../../services/supplierService";
import { getCabangList } from "../../features/cabang/services/cabangService";
import toast from "react-hot-toast";
import Spinner from "../../features/common/Spinner";

const SupplierForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  // Form state
  const [formData, setFormData] = useState({
    namaSupplier: "",
    alamat: "",
    telepon: "",
    email: "",
    npwp: "",
    picNama: "",
    picKontak: "",
    status: "aktif",
    cabang_id: "",
  });

  // UI state
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [cabangList, setCabangList] = useState([]);
  const [hasFetched, setHasFetched] = useState(false);

  // Load supplier data if in edit mode
  useEffect(() => {
    const fetchSupplierData = async () => {
      if (!isEditMode) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const data = await getSupplierById(id);
        setFormData({
          namaSupplier: data.namaSupplier || "",
          alamat: data.alamat || "",
          telepon: data.telepon || "",
          email: data.email || "",
          npwp: data.npwp || "",
          picNama: data.picNama || "",
          picKontak: data.picKontak || "",
          status: data.status || "aktif",
          cabang_id: data.cabang_id || "",
        });
        setHasFetched(true);
      } catch (err) {
        console.error("Error loading supplier data:", err);
        setError("Terjadi kesalahan saat memuat data supplier");
        toast.error("Gagal memuat data supplier");
      } finally {
        setIsLoading(false);
      }
    };

    // Load cabang list
    const fetchCabangList = async () => {
      try {
        const data = await getCabangList();
        setCabangList(data.items || []);
      } catch (err) {
        console.error("Error loading cabang list:", err);
      }
    };

    fetchSupplierData();
    fetchCabangList();
  }, [id, isEditMode]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.namaSupplier.trim()) {
      toast.error("Nama supplier harus diisi");
      return;
    }

    setIsSaving(true);

    try {
      if (isEditMode) {
        await updateSupplier(id, formData);
        toast.success("Supplier berhasil diperbarui");
      } else {
        await supplierService.createSupplier(formData);
        toast.success("Supplier baru berhasil ditambahkan");
      }
      navigate("/superadmin/suppliers");
    } catch (err) {
      console.error("Error saving supplier:", err);
      toast.error(
        `Gagal ${isEditMode ? "memperbarui" : "menambahkan"} supplier`
      );
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isEditMode && error && !hasFetched) {
    return (
      <div className="mx-6 mt-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center">
        <AlertTriangle className="h-5 w-5 mr-2" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="bg-indigo-600 text-white py-6">
        <div className="mx-6">
          <button
            onClick={() => navigate("/superadmin/suppliers")}
            className="flex items-center text-indigo-100 hover:text-white mb-4"
          >
            <ArrowLeft size={16} className="mr-1" />
            <span>Kembali ke Daftar Supplier</span>
          </button>
          <h1 className="text-2xl font-bold">
            {isEditMode ? "Edit Supplier" : "Tambah Supplier Baru"}
          </h1>
          <div className="flex items-center mt-2">
            <Truck size={18} className="mr-2" />
            <span>
              {isEditMode
                ? `Memperbarui informasi ${formData.namaSupplier}`
                : "Lengkapi informasi supplier baru"}
            </span>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="mx-6 mt-6 bg-white rounded-xl shadow-sm">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-800">
                Informasi Supplier
              </h3>

              {/* Nama Supplier */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nama Supplier <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="namaSupplier"
                  value={formData.namaSupplier}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>

              {/* Alamat */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Alamat
                </label>
                <textarea
                  name="alamat"
                  value={formData.alamat}
                  onChange={handleChange}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              {/* Telepon */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Telepon
                </label>
                <input
                  type="text"
                  name="telepon"
                  value={formData.telepon}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              {/* NPWP */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  NPWP
                </label>
                <input
                  type="text"
                  name="npwp"
                  value={formData.npwp}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-800">
                Person In Charge (PIC)
              </h3>

              {/* Nama PIC */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nama PIC
                </label>
                <input
                  type="text"
                  name="picNama"
                  value={formData.picNama}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              {/* Kontak PIC */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Kontak PIC
                </label>
                <input
                  type="text"
                  name="picKontak"
                  value={formData.picKontak}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <h3 className="text-lg font-medium text-gray-800 pt-4">
                Pengaturan
              </h3>

              {/* Cabang */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Cabang
                </label>
                <select
                  name="cabang_id"
                  value={formData.cabang_id}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">-- Semua Cabang --</option>
                  {cabangList.map((cabang) => (
                    <option key={cabang.id} value={cabang.id}>
                      {cabang.namaCabang}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Biarkan kosong jika supplier tersedia untuk semua cabang
                </p>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center">
                    <input
                      id="status-aktif"
                      name="status"
                      type="radio"
                      value="aktif"
                      checked={formData.status === "aktif"}
                      onChange={handleChange}
                      className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label
                      htmlFor="status-aktif"
                      className="ml-2 flex items-center text-sm font-medium text-gray-700"
                    >
                      <Check size={16} className="mr-1 text-green-500" /> Aktif
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="status-nonaktif"
                      name="status"
                      type="radio"
                      value="nonaktif"
                      checked={formData.status === "nonaktif"}
                      onChange={handleChange}
                      className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label
                      htmlFor="status-nonaktif"
                      className="ml-2 flex items-center text-sm font-medium text-gray-700"
                    >
                      <X size={16} className="mr-1 text-red-500" /> Nonaktif
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form buttons */}
          <div className="mt-8 border-t border-gray-200 pt-6 flex justify-end">
            <button
              type="button"
              className="mr-3 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={() => navigate("/superadmin/suppliers")}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center"
            >
              {isSaving ? (
                <>
                  <RotateCw size={16} className="mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  {isEditMode ? "Perbarui Supplier" : "Simpan Supplier"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupplierForm;
