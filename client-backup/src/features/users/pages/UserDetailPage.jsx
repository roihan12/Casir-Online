import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building,
  Clock,
  Shield,
  Edit,
  Trash,
  Lock,
  LogOut,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import userService from "../../../services/userService";
import Modal from "../../../features/common/Modal";
import UserForm from "../../../components/superadmin/UserForm";

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showForceLogoutModal, setShowForceLogoutModal] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);

  // Load user data
  useEffect(() => {
    const loadUserDetail = async () => {
      try {
        setIsLoading(true);
        const data = await userService.getUserById(id);
        setUser(data);
      } catch (error) {
        console.error("Error loading user detail:", error);
        // Show error message
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadUserDetail();
    }
  }, [id]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Format time
  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format role name
  const formatRoleName = (role) => {
    const roleMap = {
      super_admin: "Super Admin",
      admin_cabang: "Admin Cabang",
      kasir: "Kasir",
    };
    return roleMap[role] || role;
  };

  // Handle edit user
  const handleEditUser = () => {
    setShowEditModal(true);
  };

  // Handle form submission for edit
  const handleFormSubmit = (updatedUserData) => {
    // Find the updated user data
    const updatedUser = updatedUserData.find((u) => u.id === user.id);
    setUser(updatedUser);
    setShowEditModal(false);
  };

  // Handle reset password
  const confirmResetPassword = async () => {
    setActionInProgress(true);
    try {
      await userService.resetPassword(user.id);
      setShowResetPasswordModal(false);
      // Show success message
    } catch (error) {
      console.error("Error resetting password:", error);
      // Show error message
    } finally {
      setActionInProgress(false);
    }
  };

  // Handle activate/deactivate user
  const confirmToggleStatus = async () => {
    setActionInProgress(true);
    try {
      const newStatus = user.status === "active" ? "inactive" : "active";
      const updatedUser = await userService.updateUserStatus(
        user.id,
        newStatus
      );
      setUser(updatedUser);
      setShowDeactivateModal(false);
      // Show success message
    } catch (error) {
      console.error("Error updating user status:", error);
      // Show error message
    } finally {
      setActionInProgress(false);
    }
  };

  // Handle force logout
  const confirmForceLogout = async () => {
    setActionInProgress(true);
    try {
      await userService.forceLogout(user.id);
      setShowForceLogoutModal(false);
      // Show success message
    } catch (error) {
      console.error("Error forcing logout:", error);
      // Show error message
    } finally {
      setActionInProgress(false);
    }
  };

  // Handle delete user
  const confirmDeleteUser = async () => {
    setActionInProgress(true);
    try {
      await userService.deleteUser(user.id);
      setShowDeleteModal(false);
      navigate("/superadmin/users");
    } catch (error) {
      console.error("Error deleting user:", error);
      // Show error message
    } finally {
      setActionInProgress(false);
    }
  };

  // Go back to user list
  const handleBack = () => {
    navigate("/superadmin/users");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
        <h2 className="text-xl text-gray-700">User tidak ditemukan</h2>
        <button
          onClick={handleBack}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Kembali ke Daftar User
        </button>
      </div>
    );
  }

  return (
    <div className="px-6 py-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button
            onClick={handleBack}
            className="mr-4 p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">
            Detail User: {user.nama}
          </h1>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleEditUser}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
          >
            <Edit className="h-5 w-5 mr-2" />
            Edit User
          </button>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-6">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            user.status === "active"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {user.status === "active" ? (
            <CheckCircle className="h-4 w-4 mr-1" />
          ) : (
            <XCircle className="h-4 w-4 mr-1" />
          )}
          Status: {user.status === "active" ? "Aktif" : "Nonaktif"}
        </span>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("profile")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "profile"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <User className="inline-block h-5 w-5 mr-2" />
            Profil
          </button>
          <button
            onClick={() => setActiveTab("activity")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "activity"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Activity className="inline-block h-5 w-5 mr-2" />
            Aktivitas
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "security"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Lock className="inline-block h-5 w-5 mr-2" />
            Keamanan
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm">
        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="p-6">
            <div className="flex">
              {/* User Avatar */}
              <div className="flex-shrink-0">
                <div className="h-32 w-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.nama}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-16 w-16 text-gray-400" />
                  )}
                </div>
              </div>

              {/* User Info */}
              <div className="ml-6 flex-grow">
                <h2 className="text-xl font-semibold text-gray-900">
                  {user.nama}
                </h2>
                <div className="mt-2 space-y-3">
                  <div className="flex items-center text-gray-600">
                    <Mail className="h-5 w-5 text-gray-400 mr-2" />
                    {user.email}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Phone className="h-5 w-5 text-gray-400 mr-2" />
                    {user.noTelepon || "-"}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Shield className="h-5 w-5 text-gray-400 mr-2" />
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
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
              <div className="ml-6 flex flex-col space-y-2">
                <button
                  onClick={() => setShowResetPasswordModal(true)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Reset Password
                </button>
                <button
                  onClick={() => setShowForceLogoutModal(true)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Force Logout
                </button>
                <button
                  onClick={() => setShowDeactivateModal(true)}
                  className={`px-4 py-2 rounded-lg flex items-center ${
                    user.status === "active"
                      ? "bg-yellow-100 border border-yellow-300 text-yellow-800 hover:bg-yellow-200"
                      : "bg-green-100 border border-green-300 text-green-800 hover:bg-green-200"
                  }`}
                >
                  {user.status === "active" ? (
                    <XCircle className="h-4 w-4 mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  {user.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center"
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Hapus User
                </button>
              </div>
            </div>

            {/* Additional Info Section */}
            <div className="mt-8 pt-6 border-t grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Registration Info */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Informasi Registrasi
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">
                      Terdaftar pada
                    </span>
                    <span className="text-sm text-gray-900">
                      {formatDate(user.createdAt)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">
                      Login terakhir
                    </span>
                    <span className="text-sm text-gray-900">
                      {user.lastLogin ? (
                        <>
                          {formatDate(user.lastLogin)}{" "}
                          {formatTime(user.lastLogin)}
                        </>
                      ) : (
                        "Belum pernah login"
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">
                      Terakhir diperbarui
                    </span>
                    <span className="text-sm text-gray-900">
                      {formatDate(user.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cabang Info (if applicable) */}
              {user.role !== "super_admin" && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Informasi Cabang
                  </h3>
                  {user.cabang ? (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-start">
                        <Building className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                        <div>
                          <p className="text-gray-900 font-medium">
                            {user.cabang.namaCabang}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {user.cabang.alamat}
                          </p>
                          {user.cabang.telepon && (
                            <p className="text-sm text-gray-500 mt-1">
                              {user.cabang.telepon}
                            </p>
                          )}
                          <button
                            onClick={() =>
                              navigate(`/superadmin/cabang/${user.cabang.id}`)
                            }
                            className="text-sm text-indigo-600 mt-2 hover:text-indigo-800"
                          >
                            Lihat detail cabang
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex items-center">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                      <span className="text-yellow-700">
                        User ini belum ditetapkan ke cabang mana pun
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === "activity" && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Riwayat Aktivitas
            </h3>
            {user.activities && user.activities.length > 0 ? (
              <div className="relative">
                {/* Activity Timeline */}
                <div className="border-l-2 border-gray-200 ml-4">
                  {user.activities.map((activity, index) => (
                    <div key={index} className="mb-6 ml-6 relative">
                      {/* Timeline dot */}
                      <div
                        className={`absolute -left-9 mt-1.5 w-4 h-4 rounded-full border-2 border-white ${
                          activity.type === "login"
                            ? "bg-green-500"
                            : activity.type === "logout"
                            ? "bg-blue-500"
                            : "bg-gray-500"
                        }`}
                      ></div>

                      {/* Activity content */}
                      <div className="bg-white p-4 rounded-lg border shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-md font-medium text-gray-900">
                              {activity.description}
                            </h4>
                            <p className="text-sm text-gray-500 mt-1">
                              {activity.details}
                            </p>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDate(activity.timestamp)}{" "}
                            {formatTime(activity.timestamp)}
                          </span>
                        </div>

                        {activity.ipAddress && (
                          <div className="mt-2 text-xs text-gray-500">
                            IP: {activity.ipAddress}
                            {activity.location && ` • ${activity.location}`}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center p-8 bg-gray-50 rounded-lg">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  Belum ada aktivitas yang tercatat
                </p>
              </div>
            )}
          </div>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Pengaturan Keamanan
            </h3>

            <div className="space-y-6">
              {/* Password Settings */}
              <div className="bg-white p-4 rounded-lg border">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-md font-medium text-gray-900">
                      Password
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {user.passwordLastChanged
                        ? `Terakhir diubah pada ${formatDate(
                            user.passwordLastChanged
                          )}`
                        : "Password belum pernah diubah sejak registrasi"}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowResetPasswordModal(true)}
                    className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-sm hover:bg-indigo-200"
                  >
                    Reset Password
                  </button>
                </div>
              </div>

              {/* Account Security */}
              <div className="bg-white p-4 rounded-lg border">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-md font-medium text-gray-900">Akun</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Status:{" "}
                      <span
                        className={
                          user.status === "active"
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {user.status === "active" ? "Aktif" : "Nonaktif"}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDeactivateModal(true)}
                    className={`px-3 py-1.5 rounded-lg text-sm ${
                      user.status === "active"
                        ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                        : "bg-green-100 text-green-700 hover:bg-green-200"
                    }`}
                  >
                    {user.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                </div>

                <div className="mt-4 text-sm text-gray-500">
                  <p>
                    {user.status === "active"
                      ? "User dapat login dan mengakses sistem sesuai dengan perizinan role-nya."
                      : "User tidak dapat login dan mengakses sistem."}
                  </p>
                </div>
              </div>

              {/* Active Sessions */}
              <div className="bg-white p-4 rounded-lg border">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-md font-medium text-gray-900">
                      Sesi Aktif
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {user.activeSessions && user.activeSessions.length > 0
                        ? `${user.activeSessions.length} sesi aktif`
                        : "Tidak ada sesi aktif"}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowForceLogoutModal(true)}
                    className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200"
                    disabled={
                      !user.activeSessions || user.activeSessions.length === 0
                    }
                  >
                    Force Logout
                  </button>
                </div>

                {user.activeSessions && user.activeSessions.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {user.activeSessions.map((session, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-2 bg-gray-50 rounded"
                      >
                        <div>
                          <p className="text-sm text-gray-700">
                            {session.device || "Unknown Device"}
                          </p>
                          <p className="text-xs text-gray-500">
                            IP: {session.ipAddress}
                            {session.location && ` • ${session.location}`}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500">
                          Login: {formatDate(session.lastActivity)}{" "}
                          {formatTime(session.lastActivity)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 text-sm text-gray-500">
                    <p>User ini tidak sedang login di perangkat manapun.</p>
                  </div>
                )}
              </div>

              {/* Danger Zone */}
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h4 className="text-md font-medium text-red-700">
                  Danger Zone
                </h4>
                <p className="text-sm text-red-600 mt-1">
                  Tindakan berikut tidak dapat dibatalkan. Harap hati-hati.
                </p>

                <div className="mt-4">
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <Trash className="h-4 w-4 inline-block mr-2" />
                    Hapus User
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit User"
      >
        <UserForm
          user={user}
          userList={[user]} // We only need the current user for validation
          onSubmitSuccess={handleFormSubmit}
          onCancel={() => setShowEditModal(false)}
        />
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={showResetPasswordModal}
        onClose={() => setShowResetPasswordModal(false)}
        title="Reset Password"
      >
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Apakah Anda yakin ingin mereset password untuk user ini? Email
            dengan instruksi reset password akan dikirimkan ke {user.email}.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowResetPasswordModal(false)}
              className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100"
              disabled={actionInProgress}
            >
              Batal
            </button>
            <button
              onClick={confirmResetPassword}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
              disabled={actionInProgress}
            >
              {actionInProgress ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Memproses...
                </>
              ) : (
                "Reset Password"
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Deactivate/Activate User Modal */}
      <Modal
        isOpen={showDeactivateModal}
        onClose={() => setShowDeactivateModal(false)}
        title={user.status === "active" ? "Nonaktifkan User" : "Aktifkan User"}
      >
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            {user.status === "active"
              ? `Apakah Anda yakin ingin menonaktifkan user "${user.nama}"? User tidak akan dapat login ke sistem.`
              : `Apakah Anda yakin ingin mengaktifkan user "${user.nama}"? User akan dapat login ke sistem.`}
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowDeactivateModal(false)}
              className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100"
              disabled={actionInProgress}
            >
              Batal
            </button>
            <button
              onClick={confirmToggleStatus}
              className={`px-4 py-2 rounded-lg text-white flex items-center ${
                user.status === "active"
                  ? "bg-yellow-500 hover:bg-yellow-600"
                  : "bg-green-500 hover:bg-green-600"
              }`}
              disabled={actionInProgress}
            >
              {actionInProgress ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Memproses...
                </>
              ) : user.status === "active" ? (
                "Nonaktifkan"
              ) : (
                "Aktifkan"
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Force Logout Modal */}
      <Modal
        isOpen={showForceLogoutModal}
        onClose={() => setShowForceLogoutModal(false)}
        title="Force Logout"
      >
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Apakah Anda yakin ingin melakukan force logout untuk user "
            {user.nama}"? Tindakan ini akan menghentikan semua sesi aktif
            pengguna.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowForceLogoutModal(false)}
              className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100"
              disabled={actionInProgress}
            >
              Batal
            </button>
            <button
              onClick={confirmForceLogout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center"
              disabled={actionInProgress}
            >
              {actionInProgress ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Memproses...
                </>
              ) : (
                "Force Logout"
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete User Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Hapus User"
      >
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Apakah Anda yakin ingin menghapus user "{user.nama}"? Tindakan ini
            tidak dapat dibatalkan dan semua data pengguna akan dihapus.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100"
              disabled={actionInProgress}
            >
              Batal
            </button>
            <button
              onClick={confirmDeleteUser}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
              disabled={actionInProgress}
            >
              {actionInProgress ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Memproses...
                </>
              ) : (
                "Hapus User"
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserDetail;
