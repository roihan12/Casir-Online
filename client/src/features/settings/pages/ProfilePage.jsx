import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "@features/auth/hooks/useAuth";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  Edit2,
  Save,
  X,
  RefreshCw,
  Clock,
  Badge,
  Upload,
  Image,
} from "lucide-react";
import { FaCamera, FaCheckCircle, FaExclamationTriangle, FaSync } from "react-icons/fa";
import * as authService from "@features/auth/services/authService";
import { FaceRegistration } from "@features/attendance";
import api from "../../../services/api";
import { toast } from "react-hot-toast";

const ProfilePage = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    namaLengkap: "",
    email: "",
    telepon: "",
    alamat: "",
    username: "",
    avatarUrl: "",
  });
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);
  const [avatarFile, setAvatarFile] = useState(null);

  // Face registration state
  const [faceStatus, setFaceStatus] = useState({
    loading: true,
    registered: false,
    imageUrl: null,
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        namaLengkap: user.namaLengkap || "",
        email: user.email || "",
        telepon: user.telepon || "",
        alamat: user.alamat || "",
        username: user.username || "",
        avatarUrl: user.avatarUrl || "",
      });

      if (user.avatarUrl) {
        setPreviewImage(user.avatarUrl);
      }
    }
  }, [user]);

  // Fetch face registration status
  const fetchFaceStatus = useCallback(async () => {
    if (!user) return;
    try {
      setFaceStatus((prev) => ({ ...prev, loading: true }));
      const res = await api.get(`/attendance/face-status/${user.id}`);
      setFaceStatus({
        loading: false,
        registered: res.data?.data?.hasRegisteredFace || false,
        imageUrl: res.data?.data?.faceImageUrl || null,
      });
    } catch {
      // If endpoint doesn't exist or error, assume not registered
      setFaceStatus({ loading: false, registered: false, imageUrl: null });
    }
  }, [user]);

  useEffect(() => {
    fetchFaceStatus();
  }, [fetchFaceStatus]);

  const handleFaceRegistered = (result) => {
    setFaceStatus({
      loading: false,
      registered: true,
      imageUrl: result.faceImageUrl || null,
    });
    toast.success("Data wajah berhasil didaftarkan!");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData({
      ...profileData,
      [name]: value,
    });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 2MB");
      return;
    }

    setAvatarFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleClickUpload = () => {
    fileInputRef.current.click();
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      setProfileData({
        namaLengkap: user.namaLengkap || "",
        email: user.email || "",
        telepon: user.telepon || "",
        alamat: user.alamat || "",
        username: user.username || "",
        avatarUrl: user.avatarUrl || "",
      });

      if (user.avatarUrl) {
        setPreviewImage(user.avatarUrl);
      } else {
        setPreviewImage(null);
      }

      setAvatarFile(null);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("namaLengkap", profileData.namaLengkap);
      formData.append("email", profileData.email);
      formData.append("telepon", profileData.telepon || "");
      formData.append("alamat", profileData.alamat || "");

      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const updatedUser = await authService.updateProfileWithAvatar(formData);

      setUser({
        ...user,
        ...updatedUser,
      });

      setIsEditing(false);
      setAvatarFile(null);
      toast.success("Profil berhasil diperbarui");
    } catch (error) {
      toast.error(
        "Gagal memperbarui profil: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const getUserRole = () => {
    if (!user || !user.roles || user.roles.length === 0)
      return "Pengguna";

    const role = user.roles[0]?.namaRole;
    return role || "Pengguna";
  };

  

  const getCabangName = () => {
    if (!user || !user.cabang || user.cabang.length === 0)
      return "Tidak ada cabang";

    const primaryCabang = user.cabang.find((uc) => uc.isPrimary);
    return primaryCabang
      ? primaryCabang.namaCabang
      : user.cabang[0].namaCabang;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getUserStatus = () => {
    if (!user || !user.status) return "Tidak diketahui";
    if (user.status === "aktif") return "Aktif";
    if (user.status === "nonaktif") return "Nonaktif";
    return user.status;
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600">Memuat informasi profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 sm:px-6 space-y-6">
      {/* Profile Card */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Profile Header */}
        <div className="bg-indigo-600 px-6 py-8 text-white">
          <div className="flex flex-col md:flex-row items-center">
            <div className="h-24 w-24 rounded-full bg-indigo-300 flex items-center justify-center text-indigo-700 text-4xl font-bold mb-4 md:mb-0 md:mr-6 overflow-hidden">
              {previewImage ? (
                <img
                  src={previewImage}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              ) : user.namaLengkap ? (
                user.namaLengkap.charAt(0).toUpperCase()
              ) : (
                "U"
              )}
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-2xl font-bold">
                {user.namaLengkap || "Nama Pengguna"}
              </h1>
              <p className="text-indigo-200">{getUserRole()}</p>
              <p className="text-indigo-200 mt-1">
                <Building size={16} className="inline mr-1" /> {getCabangName()}
              </p>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="p-6">
          <div className="flex justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Informasi Profil
            </h2>
            {isEditing ? (
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={toggleEdit}
                  className="flex items-center px-3 py-1 text-sm rounded-md border border-gray-300 hover:bg-gray-100 text-gray-600"
                >
                  <X size={16} className="mr-1" /> Batal
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={toggleEdit}
                className="flex items-center px-3 py-1 text-sm rounded-md bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
              >
                <Edit2 size={16} className="mr-1" /> Edit Profil
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleUpdateProfile}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={profileData.username}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Username tidak dapat diubah
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    name="namaLengkap"
                    value={profileData.namaLengkap}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telepon
                  </label>
                  <input
                    type="text"
                    name="telepon"
                    value={profileData.telepon}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alamat
                  </label>
                  <input
                    type="text"
                    name="alamat"
                    value={profileData.alamat}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Foto Profil
                  </label>
                  <div className="mt-1 flex items-center">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center mr-4 border">
                      {previewImage ? (
                        <img
                          src={previewImage}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Image className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleAvatarChange}
                        accept="image/*"
                      />
                      <button
                        type="button"
                        onClick={handleClickUpload}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Pilih Foto
                      </button>
                      <p className="text-xs text-gray-500 mt-1">
                        JPG, PNG, GIF. Maks 2MB
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={16} className="mr-2 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save size={16} className="mr-2" />
                      Simpan Perubahan
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 md:gap-x-12">
              <div className="flex items-start">
                <User className="w-5 h-5 text-indigo-500 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Username</p>
                  <p className="font-medium">{user.username || "-"}</p>
                </div>
              </div>

              <div className="flex items-start">
                <User className="w-5 h-5 text-indigo-500 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Nama Lengkap</p>
                  <p className="font-medium">{user.namaLengkap || "-"}</p>
                </div>
              </div>

              <div className="flex items-start">
                <Mail className="w-5 h-5 text-indigo-500 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{user.email || "-"}</p>
                </div>
              </div>

              <div className="flex items-start">
                <Phone className="w-5 h-5 text-indigo-500 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Telepon</p>
                  <p className="font-medium">{user.telepon || "-"}</p>
                </div>
              </div>

              <div className="flex items-start">
                <MapPin className="w-5 h-5 text-indigo-500 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Alamat</p>
                  <p className="font-medium">{user.alamat || "-"}</p>
                </div>
              </div>

              <div className="flex items-start">
                <Building className="w-5 h-5 text-indigo-500 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Cabang</p>
                  <p className="font-medium">{getCabangName()}</p>
                </div>
              </div>

              <div className="flex items-start">
                <Badge className="w-5 h-5 text-indigo-500 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.status === "aktif"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {getUserStatus()}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <Calendar className="w-5 h-5 text-indigo-500 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Tanggal Bergabung</p>
                  <p className="font-medium">{formatDate(user.createdAt)}</p>
                </div>
              </div>

              <div className="flex items-start">
                <Clock className="w-5 h-5 text-indigo-500 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Terakhir Diperbarui</p>
                  <p className="font-medium">{formatDate(user.updatedAt)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Face Registration Card */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <FaCamera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Registrasi Wajah — Absensi</h2>
              <p className="text-blue-100 text-sm">
                Daftarkan wajah Anda untuk verifikasi saat absen
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {faceStatus.loading ? (
            <div className="flex items-center justify-center py-8">
              <FaSync className="w-5 h-5 text-indigo-500 animate-spin mr-3" />
              <span className="text-gray-500">Memuat status wajah...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Status Banner */}
              <div
                className={`flex items-start gap-4 p-4 rounded-xl border ${
                  faceStatus.registered
                    ? "bg-green-50 border-green-200"
                    : "bg-amber-50 border-amber-200"
                }`}
              >
                <div
                  className={`p-2 rounded-full flex-shrink-0 ${
                    faceStatus.registered ? "bg-green-100" : "bg-amber-100"
                  }`}
                >
                  {faceStatus.registered ? (
                    <FaCheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <FaExclamationTriangle className="w-5 h-5 text-amber-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-semibold ${
                      faceStatus.registered ? "text-green-900" : "text-amber-900"
                    }`}
                  >
                    {faceStatus.registered
                      ? "Wajah Terdaftar ✓"
                      : "Wajah Belum Terdaftar"}
                  </p>
                  <p
                    className={`text-sm mt-1 ${
                      faceStatus.registered ? "text-green-700" : "text-amber-700"
                    }`}
                  >
                    {faceStatus.registered
                      ? "Anda dapat menggunakan fitur absensi dengan verifikasi wajah."
                      : "Anda perlu mendaftarkan wajah sebelum bisa melakukan absensi."}
                  </p>
                </div>

                {/* Face Image Preview */}
                {faceStatus.registered && faceStatus.imageUrl && (
                  <img
                    src={faceStatus.imageUrl}
                    alt="Wajah terdaftar"
                    className="w-16 h-16 object-cover rounded-lg border-2 border-green-300 flex-shrink-0"
                  />
                )}
              </div>

              {/* Tips Section */}
              {!faceStatus.registered && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-sm font-medium text-blue-900 mb-2">
                    Tips untuk hasil terbaik:
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sm text-blue-800">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                      Posisikan wajah di tengah frame
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                      Pastikan pencahayaan merata
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                      Lihat langsung ke kamera
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                      Lepas kacamata jika memungkinkan
                    </li>
                  </ul>
                </div>
              )}

              {/* Action Button */}
              <div>
                <FaceRegistration
                  userId={user.id}
                  userName={user.namaLengkap}
                  hasExistingFace={faceStatus.registered}
                  onSuccess={handleFaceRegistered}
                  buttonText={
                    faceStatus.registered
                      ? "Perbarui Data Wajah"
                      : "Daftarkan Wajah"
                  }
                  buttonClassName="w-full sm:w-auto"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
