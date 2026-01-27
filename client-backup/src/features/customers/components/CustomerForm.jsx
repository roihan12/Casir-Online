import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Heart,
  Briefcase,
  Home,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../../auth/hooks/useAuth.js";
import { toast } from "react-hot-toast";
import pelangganService from "../services/pelangganService";
import { useCabang } from "../../cabang/hooks/useCabang";

const CustomerForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const { cabangList, loadCabangList } = useCabang();
  const isSuperAdmin = hasRole("super_admin");
  const isEditMode = !!id;

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingCabang, setIsLoadingCabang] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    namaPelanggan: "",
    gender: "",
    alamat: "",
    telepon: "",
    email: "",
    tanggalLahir: "",
    segmen: "retail",
    poin: 0,
    status: "aktif",
    cabang_id: "",
  });

  // Load customer data in edit mode
  useEffect(() => {
    if (isEditMode) {
      loadCustomerData();
    }

    if (isSuperAdmin) {
      loadBranchData();
    }
  }, [id]);

  const loadCustomerData = async () => {
    try {
      setIsLoading(true);
      const data = await pelangganService.getPelangganById(id);
      setFormData({
        namaPelanggan: data.namaPelanggan || "",
        gender: data.gender || "",
        alamat: data.alamat || "",
        telepon: data.telepon || "",
        email: data.email || "",
        tanggalLahir: data.tanggalLahir
          ? formatDateForInput(data.tanggalLahir)
          : "",
        segmen: data.segmen || "retail",
        poin: data.poin || 0,
        status: data.status || "aktif",
        cabang_id: data.cabang_id || "",
      });
    } catch (error) {
      console.error("Error loading customer data:", error);
      toast.error("Gagal memuat data pelanggan");
      navigate("/customers");
    } finally {
      setIsLoading(false);
    }
  };

  const loadBranchData = async () => {
    try {
      setIsLoadingCabang(true);
      await loadCabangList();
    } catch (error) {
      console.error("Error loading branch data:", error);
    } finally {
      setIsLoadingCabang(false);
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle number input changes
  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: parseInt(value) || 0 });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (isEditMode) {
        await pelangganService.updatePelanggan(id, formData);
        toast.success("Pelanggan berhasil diperbarui");
      } else {
        await pelangganService.createPelanggan(formData);
        toast.success("Pelanggan baru berhasil dibuat");
      }
      navigate("/customers");
    } catch (error) {
      console.error("Error saving customer:", error);
      toast.error(
        isEditMode
          ? "Gagal memperbarui pelanggan"
          : "Gagal membuat pelanggan baru"
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Format date for input field (YYYY-MM-DD)
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center">
          <button
            onClick={() => navigate("/customers")}
            className="mr-4 p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">
            {isEditMode ? "Edit Pelanggan" : "Tambah Pelanggan Baru"}
          </h1>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow rounded-lg overflow-hidden"
      >
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informasi Dasar */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <User className="mr-2 h-5 w-5 text-gray-500" />
                Informasi Dasar
              </h3>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="namaPelanggan"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Nama Pelanggan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="namaPelanggan"
                    name="namaPelanggan"
                    value={formData.namaPelanggan}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="gender"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Jenis Kelamin
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">Pilih Jenis Kelamin</option>
                    <option value="pria">Pria</option>
                    <option value="wanita">Wanita</option>
                    <option value="lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="tanggalLahir"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Tanggal Lahir
                  </label>
                  <input
                    type="date"
                    id="tanggalLahir"
                    name="tanggalLahir"
                    value={formData.tanggalLahir}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Informasi Kontak */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Mail className="mr-2 h-5 w-5 text-gray-500" />
                Informasi Kontak
              </h3>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="telepon"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Nomor Telepon
                  </label>
                  <input
                    type="text"
                    id="telepon"
                    name="telepon"
                    value={formData.telepon}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="alamat"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Alamat
                  </label>
                  <textarea
                    id="alamat"
                    name="alamat"
                    rows={3}
                    value={formData.alamat}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Informasi Pelanggan */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Briefcase className="mr-2 h-5 w-5 text-gray-500" />
                Informasi Pelanggan
              </h3>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="segmen"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Segmen Pelanggan
                  </label>
                  <select
                    id="segmen"
                    name="segmen"
                    value={formData.segmen}
                    onChange={handleChange}
                    className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="retail">Retail</option>
                    <option value="grosir">Grosir</option>
                    <option value="vip">VIP</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="poin"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Poin Loyalitas
                  </label>
                  <input
                    type="number"
                    id="poin"
                    name="poin"
                    min="0"
                    value={formData.poin}
                    onChange={handleNumberChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="status"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Informasi Cabang */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Home className="mr-2 h-5 w-5 text-gray-500" />
                Informasi Cabang
              </h3>
              <div className="space-y-4">
                {isSuperAdmin ? (
                  <div>
                    <label
                      htmlFor="cabang_id"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Cabang <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="cabang_id"
                      name="cabang_id"
                      value={formData.cabang_id}
                      onChange={handleChange}
                      className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                    >
                      <option value="">Pilih Cabang</option>
                      {cabangList.map((cabang) => (
                        <option key={cabang.id} value={cabang.id}>
                          {cabang.namaCabang}
                        </option>
                      ))}
                    </select>
                    {isLoadingCabang && (
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                        <span>Memuat daftar cabang...</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-yellow-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                          Pelanggan akan dibuat untuk cabang Anda saat ini.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 bg-gray-50 text-right">
          <button
            type="button"
            onClick={() => navigate("/customers")}
            className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
          >
            Batal
          </button>
          <button
            type="submit"
            className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              isSaving ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEditMode ? "Perbarui Pelanggan" : "Simpan Pelanggan"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomerForm;
