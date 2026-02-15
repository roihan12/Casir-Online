import React, { useState } from "react";
import {
  User,
  Mail,
  Phone,
  Shield,
  Building,
  AlertTriangle,
  Lock,
  LogOut,
  XCircle,
  CheckCircle,
  Trash,
} from "lucide-react";
import { Can } from "@features/common/Can";
import { useNavigate } from "react-router-dom";
import { FaceRegistration } from "@features/attendance";

const UserProfileTab = ({
  user,
  formatDate,
  formatTime,
  formatRoleName,
  onResetPassword,
  onDeactivate,
  onForceLogout,
  onDelete,
}) => {
  const navigate = useNavigate();
  const [localUser, setLocalUser] = useState(user);

  console.log(user);

  const handleFaceRegistered = (result) => {
    // Update local user state when face is registered
    setLocalUser(prev => ({
      ...prev,
      faceDataJson: result.embedding,
      faceImageUrl: result.faceImageUrl
    }));
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row">
        {/* User Avatar */}
        <div className="flex-shrink-0 mb-6 md:mb-0">
          <div className="h-32 w-32 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-md">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.namaLengkap}
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-16 w-16 text-gray-400" />
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="md:ml-8 flex-grow">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            {user.namaLengkap}
          </h2>
          <p className="text-gray-500 mb-4">@{user.username}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8 mb-6">
            <div className="flex items-center text-gray-700">
              <div className="w-8 flex justify-center mr-2">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <span>{user.email}</span>
            </div>
            <div className="flex items-center text-gray-700">
              <div className="w-8 flex justify-center mr-2">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <span>{user.noTelepon || "-"}</span>
            </div>
            <div className="flex items-center text-gray-700">
              <div className="w-8 flex justify-center mr-2">
                <Shield className="h-5 w-5 text-gray-400" />
              </div>
              <span
                className={`px-2 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wide ${
                  user.role === "super_admin"
                    ? "bg-purple-100 text-purple-800"
                    : user.role === "admin_cabang"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {formatRoleName(user.role)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="md:ml-auto flex flex-col space-y-2 min-w-[200px]">
          <Can permission="user:reset-password">
            <button
              onClick={onResetPassword}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center w-full"
            >
              <Lock className="h-4 w-4 mr-2" />
              Reset Password
            </button>
          </Can>
          <Can permission="user:force-logout">
            <button
              onClick={onForceLogout}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Force Logout
            </button>
          </Can>
          <Can permission="user:update-status">
            <button
              onClick={onDeactivate}
              className={`px-4 py-2 rounded-lg flex items-center justify-center w-full transition-colors ${
                user.status === "aktif"
                  ? "bg-yellow-50 border border-yellow-200 text-yellow-700 hover:bg-yellow-100"
                  : "bg-green-50 border border-green-200 text-green-700 hover:bg-green-100"
              }`}
            >
              {user.status === "aktif" ? (
                <XCircle className="h-4 w-4 mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              {user.status === "aktif" ? "Nonaktifkan" : "Aktifkan"}
            </button>
          </Can>
          <Can permission="user:delete">
            <button
              onClick={onDelete}
              className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center w-full"
            >
              <Trash className="h-4 w-4 mr-2" />
              Hapus User
            </button>
          </Can>
        </div>
      </div>

      {/* Additional Info Section */}
      <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Registration Info */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
            Informasi Registrasi
          </h3>
          <div className="bg-gray-50 p-4 rounded-xl space-y-3 text-sm border border-gray-100">
            <div className="flex justify-between">
              <span className="text-gray-500">Terdaftar pada</span>
              <span className="font-medium text-gray-900">
                {formatDate(user.createdAt)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Login terakhir</span>
              <span className="font-medium text-gray-900">
                {user.lastLogin ? (
                  <>
                    {formatDate(user.lastLogin)} &bull; {formatTime(user.lastLogin)}
                  </>
                ) : (
                  "Belum pernah login"
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Terakhir diperbarui</span>
              <span className="font-medium text-gray-900">
                {formatDate(user.updatedAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Cabang Info (if applicable) */}
        {user.userRoles.namaRole !== "super_admin" && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Informasi Cabang
            </h3>
            {user.userCabang ? (
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 hover:shadow-sm transition-shadow">
                <div className="flex items-start">
                  <div className="bg-white p-2 rounded-lg shadow-sm mr-3">
                    <Building className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-gray-900 font-bold mb-1">
                      {user.userCabang[0].cabang.namaCabang}
                    </p>
                    <p className="text-sm text-gray-500 mb-1">
                      {user.userCabang[0].cabang.alamat}
                    </p>
                    {user.userCabang[0].cabang.telepon && (
                      <p className="text-sm text-gray-500 mb-2">
                        {user.userCabang[0].cabang.telepon}
                      </p>
                    )}
                    <button
                      onClick={() => navigate(`/cabang/${user.userCabang[0].cabang.id}`)}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      Lihat detail cabang &rarr;
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex items-center text-sm">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3 flex-shrink-0" />
                <span className="text-yellow-700">
                  User ini belum ditetapkan ke cabang mana pun.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Face Recognition Info */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
            Data Wajah (Face Recognition)
          </h3>
          <div className={`p-4 rounded-xl border ${localUser?.faceDataJson ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'}`}>
            {localUser?.faceDataJson ? (
              <div>
                <div className="flex items-start gap-3 mb-3">
                  <div className="bg-green-100 p-2 rounded-full">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-green-900">Wajah Terdaftar</p>
                    <p className="text-sm text-green-700">
                      User dapat menggunakan face recognition untuk absensi
                    </p>
                  </div>
                </div>

                {localUser.faceImageUrl && (
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={localUser.faceImageUrl}
                      alt="Registered face"
                      className="w-16 h-16 object-cover rounded-lg border-2 border-green-300"
                    />
                    <div className="text-xs text-green-700">
                      <p>Face data tersimpan di database</p>
                      <p className="text-green-600 mt-1">
                        Embedding dimension: {Array.isArray(localUser.faceDataJson) ? localUser.faceDataJson.length : '512'}d
                      </p>
                    </div>
                  </div>
                )}

                <FaceRegistration
                  userId={localUser.id}
                  userName={localUser.namaLengkap}
                  hasExistingFace={true}
                  onSuccess={handleFaceRegistered}
                  buttonText="Update Data Wajah"
                  buttonClassName="w-full mt-2"
                />
              </div>
            ) : (
              <div>
                <div className="flex items-start gap-3 mb-3">
                  <div className="bg-gray-200 p-2 rounded-full">
                    <AlertTriangle className="h-5 w-5 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Belum Terdaftar</p>
                    <p className="text-sm text-gray-600">
                      User belum memiliki data wajah untuk absensi
                    </p>
                  </div>
                </div>

                <FaceRegistration
                  userId={localUser.id}
                  userName={localUser.namaLengkap}
                  hasExistingFace={false}
                  onSuccess={handleFaceRegistered}
                  buttonText="Daftarkan Wajah"
                  buttonClassName="w-full mt-2"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileTab;
