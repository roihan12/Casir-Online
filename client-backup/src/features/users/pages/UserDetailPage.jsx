import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  User,
  Activity,
  Lock,
  Shield,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { useUserById, useUsers } from "../hooks/useUsers"; // Import hooks
import Modal from "@features/common/Modal";
import UserForm from "../components/UserForm";
import UserDetailHeader from "../components/UserDetail/UserDetailHeader";
import UserProfileTab from "../components/UserDetail/UserProfileTab";
import UserActivityTab from "../components/UserDetail/UserActivityTab";
import UserSecurityTab from "../components/UserDetail/UserSecurityTab";
import UserPermissionsTab from "../components/UserDetail/UserPermissionsTab";
import UserPerformanceTab from "../components/UserDetail/UserPerformanceTab";
import userService from "../services/userService";

const UserDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");

  // Modals state
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showForceLogoutModal, setShowForceLogoutModal] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);

  // Use hook to fetch user data
  const { 
    data: user, 
    isLoading, 
    isError, 
    refetch 
  } = useUserById(id);

  // Fetch activity logs (we can move this to the tab component or keep it here if simplistic)
  const [activityLogs, setActivityLogs] = useState([]);
  const [isLogsLoading, setIsLogsLoading] = useState(false);

  // Load activity logs when tab changes to activity
  React.useEffect(() => {
    if (activeTab === "activity" && id) {
      const loadActivityLogs = async () => {
        try {
          setIsLogsLoading(true);
          const response = await userService.getActivityLogs({ userId: id, limit: 20 });
          setActivityLogs(response.data || []);
        } catch (error) {
          console.error("Error loading activity logs:", error);
        } finally {
          setIsLogsLoading(false);
        }
      };
      loadActivityLogs();
    }
  }, [activeTab, id]);

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

  // Action Handlers
  const handleEditUser = () => setShowEditModal(true);
  const handleBack = () => navigate("/users");

  const handleFormSubmit = async () => {
    await refetch();
    setShowEditModal(false);
  };

  const confirmResetPassword = async () => {
    setActionInProgress(true);
    try {
      await userService.resetPassword(user.id);
      setShowResetPasswordModal(false);
      // Ideally show toast notification here
    } catch (error) {
      console.error("Error resetting password:", error);
    } finally {
      setActionInProgress(false);
    }
  };

  const confirmToggleStatus = async () => {
    setActionInProgress(true);
    try {
      const newStatus = user.status === "aktif" ? "nonaktif" : "aktif";
      await userService.updateUserStatus(user.id, newStatus);
      await refetch();
      setShowDeactivateModal(false);
    } catch (error) {
      console.error("Error updating user status:", error);
    } finally {
      setActionInProgress(false);
    }
  };

  const confirmForceLogout = async () => {
    setActionInProgress(true);
    try {
      await userService.forceLogout(user.id);
      await refetch();
      setShowForceLogoutModal(false);
    } catch (error) {
      console.error("Error forcing logout:", error);
    } finally {
      setActionInProgress(false);
    }
  };

  const confirmDeleteUser = async () => {
    setActionInProgress(true);
    try {
      await userService.deleteUser(user.id);
      setShowDeleteModal(false);
      navigate("/users");
    } catch (error) {
      console.error("Error deleting user:", error);
    } finally {
      setActionInProgress(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <AlertTriangle className="h-16 w-16 text-yellow-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-800">User tidak ditemukan</h2>
        <p className="text-gray-500 mb-6">User yang Anda cari mungkin telah dihapus atau ID tidak valid.</p>
        <button
          onClick={handleBack}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Kembali ke Daftar User
        </button>
      </div>
    );
  }

  const tabs = [
    { id: "profile", label: "Profil", icon: User },
    { id: "activity", label: "Aktivitas", icon: Activity },
    { id: "security", label: "Keamanan", icon: Lock },
    { id: "permissions", label: "Hak Akses", icon: Shield },
    ...(user.role === "kasir" || user.role === "admin_cabang" ? [{ id: "performance", label: "Performa", icon: TrendingUp }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <UserDetailHeader 
          user={user} 
          onBack={handleBack} 
          onEdit={handleEditUser} 
        />

        {/* Tabs Navigation */}
        <div className="bg-white rounded-t-xl shadow-sm border-b border-gray-200">
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors
                    ${activeTab === tab.id
                      ? "border-indigo-500 text-indigo-600 bg-indigo-50/50"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                    }
                  `}
                >
                  <Icon className={`h-5 w-5 mr-2 ${activeTab === tab.id ? "text-indigo-500" : "text-gray-400"}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-b-xl shadow-sm min-h-[400px]">
          {activeTab === "profile" && (
            <UserProfileTab 
              user={user}
              formatDate={formatDate}
              formatTime={formatTime}
              formatRoleName={formatRoleName}
              onResetPassword={() => setShowResetPasswordModal(true)}
              onDeactivate={() => setShowDeactivateModal(true)}
              onForceLogout={() => setShowForceLogoutModal(true)}
              onDelete={() => setShowDeleteModal(true)}
            />
          )}

          {activeTab === "activity" && (
            <UserActivityTab 
              activityLogs={activityLogs}
              isLoading={isLogsLoading}
              formatDate={formatDate}
              formatTime={formatTime}
            />
          )}

          {activeTab === "security" && (
            <UserSecurityTab 
              user={user}
              formatDate={formatDate}
              formatTime={formatTime}
              onResetPassword={() => setShowResetPasswordModal(true)}
              onDeactivate={() => setShowDeactivateModal(true)}
              onForceLogout={() => setShowForceLogoutModal(true)}
            />
          )}

          {activeTab === "permissions" && (
            <UserPermissionsTab user={user} />
          )}

          {activeTab === "performance" && (
            <UserPerformanceTab user={user} />
          )}
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit User"
      >
        <UserForm
          user={user}
          userList={[user]} 
          onSubmitSuccess={handleFormSubmit}
          onCancel={() => setShowEditModal(false)}
        />
      </Modal>

      <Modal
        isOpen={showResetPasswordModal}
        onClose={() => setShowResetPasswordModal(false)}
        title="Reset Password"
      >
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Apakah Anda yakin ingin mereset password untuk user ini? Email dengan instruksi akan dikirimkan ke <strong>{user?.email}</strong>.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowResetPasswordModal(false)}
              className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              disabled={actionInProgress}
            >
              Batal
            </button>
            <button
              onClick={confirmResetPassword}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
              disabled={actionInProgress}
            >
              {actionInProgress ? "Memproses..." : "Reset Password"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDeactivateModal}
        onClose={() => setShowDeactivateModal(false)}
        title={user?.status === "aktif" ? "Nonaktifkan User" : "Aktifkan User"}
      >
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            {user?.status === "aktif"
              ? `Apakah Anda yakin ingin menonaktifkan user "${user.namaLengkap}"? User tidak akan dapat login ke sistem.`
              : `Apakah Anda yakin ingin mengaktifkan user "${user.namaLengkap}"? User akan dapat login ke sistem.`}
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowDeactivateModal(false)}
              className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              disabled={actionInProgress}
            >
              Batal
            </button>
            <button
              onClick={confirmToggleStatus}
              className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                user?.status === "aktif"
                  ? "bg-red-600 hover:bg-red-700" // Deactivate action is destructive-ish
                  : "bg-green-600 hover:bg-green-700"
              }`}
              disabled={actionInProgress}
            >
              {actionInProgress ? "Memproses..." : (user?.status === "aktif" ? "Nonaktifkan" : "Aktifkan")}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showForceLogoutModal}
        onClose={() => setShowForceLogoutModal(false)}
        title="Force Logout"
      >
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Apakah Anda yakin ingin memaksa logout untuk user <strong>{user?.namaLengkap}</strong>? Semua sesi aktif user ini akan diakhiri.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowForceLogoutModal(false)}
              className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              disabled={actionInProgress}
            >
              Batal
            </button>
            <button
              onClick={confirmForceLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              disabled={actionInProgress}
            >
              {actionInProgress ? "Memproses..." : "Force Logout"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Hapus User"
      >
        <div className="p-6">
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4 flex items-start">
            <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Perhatian!</p>
              <p className="text-sm">Tindakan ini tidak dapat dibatalkan. Data user akan dihapus secara permanen.</p>
            </div>
          </div>
          <p className="text-gray-700 mb-4">
            Ketidio "<strong>{user?.namaLengkap}</strong>" untuk mengonfirmasi penghapusan.
          </p>
          {/* Simplified delete confirmation without typing for now */}
          <div className="flex justify-end space-x-3">
             <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              disabled={actionInProgress}
            >
              Batal
            </button>
            <button
              onClick={confirmDeleteUser}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              disabled={actionInProgress}
            >
              {actionInProgress ? "Menghapus..." : "Hapus User"}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default UserDetailPage;
