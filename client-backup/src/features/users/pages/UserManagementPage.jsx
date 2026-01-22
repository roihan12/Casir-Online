import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit,
  Trash,
  Search,
  Filter,
  Eye,
  UserPlus,
  Users,
  Lock,
  Loader2,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Modal from "../../common/Modal";
import Table from "../../common/Table";
import UserForm from "../components/UserForm";
import UserDashboard from "../components/UserDashboard";
import userService from "../services/userService";
import roleService from "../../../services/roleService";
import { toast } from "react-hot-toast";

const UserManagementPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDashboard, setShowDashboard] = useState(true);

  // React Query for fetching users
  const {
    data: usersData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [
      "users",
      searchQuery,
      roleFilter,
      statusFilter,
      currentPage,
      itemsPerPage,
    ],
    queryFn: () =>
      userService.getUserList({
        search: searchQuery,
        roleId: roleFilter !== "all" ? roleFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        page: currentPage,
        limit: itemsPerPage,
      }),
    keepPreviousData: true,
  });

  const { data: roleList = [], isLoading: isLoadingRoles } = useQuery({
    queryKey: ["user-management-roles"],
    queryFn: async () => {
      try {
        const response = await roleService.getRoleList();
        return response.data || [];
      } catch (error) {
        console.error("Error fetching role list:", error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch dashboard data
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    isError: isDashboardError,
  } = useQuery({
    queryKey: ["userManagement", "dashboard"],
    queryFn: async () => {
      try {
        const response = await userService.getUserDashboard();
        return response.data;
      } catch (error) {
        console.error("Error fetching user management dashboard:", error);
        throw new Error(
          error.response?.data?.message || "Failed to fetch dashboard data"
        );
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    enabled: showDashboard,
  });

  // Extract user list and pagination info from the response
  const userList = usersData?.data || [];
  const pagination = usersData?.pagination || {
    totalItems: 0,
    totalPages: 0,
    currentPage: 1,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false,
  };

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: (userData) => userService.createUser(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["userManagement", "dashboard"] });
      setShowAddModal(false);
      toast.success("User berhasil ditambahkan");
    },
    onError: (error) => {
      toast.error(`Gagal menambahkan user: ${error.message}`);
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ id, userData }) => userService.updateUser(id, userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["userManagement", "dashboard"] });
      setShowEditModal(false);
      toast.success("User berhasil diperbarui");
    },
    onError: (error) => {
      toast.error(`Gagal memperbarui user: ${error.message}`);
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (id) => userService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["userManagement", "dashboard"] });
      setShowDeleteModal(false);
      toast.success("User berhasil dihapus");
    },
    onError: (error) => {
      toast.error(`Gagal menghapus user: ${error.message}`);
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: (id) => userService.resetPassword(id),
    onSuccess: () => {
      setShowResetPasswordModal(false);
      toast.success("Password berhasil direset");
    },
    onError: (error) => {
      toast.error(`Gagal mereset password: ${error.message}`);
    },
  });

  // Handle add new user
  const handleAddUser = () => {
    setSelectedUser(null);
    setShowAddModal(true);
  };

  // Handle edit user
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  // Handle view user details
  const handleViewUser = (user) => {
    if (user && user.id) {
      navigate(`/users/${user.id}`);
    } else {
      setShowDashboard(false);
    }
  };

  // Handle reset password
  const handleResetPassword = (user) => {
    setSelectedUser(user);
    setShowResetPasswordModal(true);
  };

  // Handle delete user
  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  // Confirm delete user
  const confirmDeleteUser = () => {
    deleteUserMutation.mutate(selectedUser.id);
  };

  // Confirm reset password
  const confirmResetPassword = () => {
    resetPasswordMutation.mutate(selectedUser.id);
  };

  // Handle form submit for add new user
  const handleAddFormSubmit = (userData, isFormData) => {
    createUserMutation.mutate(userData);
  };

  // Handle form submit for edit user
  const handleEditFormSubmit = (userData, isFormData) => {
    updateUserMutation.mutate({
      id: selectedUser.id,
      userData,
    });
  };

  // Handle page change from pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  // Toggle dashboard view
  const toggleDashboard = () => {
    const newShowDashboard = !showDashboard;
    setShowDashboard(newShowDashboard);
    if (newShowDashboard) {
      queryClient.invalidateQueries({ queryKey: ["userManagement", "dashboard"] });
    }
  };

  // Format role for display
  const formatRole = (role) => {
    const roleMap = {
      super_admin: "Super Admin",
      admin_cabang: "Admin Cabang",
      kasir: "Kasir",
    };
    return roleMap[role] || role;
  };

  // Get role badge class
  const getRoleBadgeClass = (role) => {
    const badgeMap = {
      super_admin: "bg-purple-100 text-purple-800",
      admin_cabang: "bg-blue-100 text-blue-800",
      kasir: "bg-green-100 text-green-800",
    };
    return badgeMap[role] || "bg-gray-100 text-gray-800";
  };

  // Show error message if query fails
  if (isError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 p-4 rounded-lg border border-red-200 mb-6">
          <p className="text-red-700">Error: {error.message}</p>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["users"] })}
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Table columns definition
  const columns = [
    {
      header: "Nama User",
      accessor: "namaLengkap",
      cell: (row) => (
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {row.avatarUrl ? (
              <img
                src={row.avatarUrl}
                alt={row.namaLengkap}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-gray-500 font-medium">
                {row.namaLengkap.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="ml-3">
            <p className="font-medium text-gray-900">{row.namaLengkap}</p>
            <p className="text-xs text-gray-500">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Username",
      accessor: "username",
    },
    {
      header: "Role",
      accessor: "userRoles",
      cell: (row) => (
        <div>
          {row.userRoles && row.userRoles.length > 0 ? (
            row.userRoles.map((userRole, index) => (
              <span
                key={index}
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeClass(
                  userRole.role.namaRole
                )} ${index > 0 ? "ml-1" : ""}`}
              >
                {formatRole(userRole.role.namaRole)}
              </span>
            ))
          ) : (
            <span className="text-gray-400 italic">Tidak ada role</span>
          )}
        </div>
      ),
    },
    {
      header: "Cabang",
      accessor: "userCabang",
      cell: (row) => (
        <div>
          {row.userCabang && row.userCabang.length > 0 ? (
            row.userCabang.map((cabang, index) => (
              <div key={index} className={index > 0 ? "mt-1" : ""}>
                <span>
                  {cabang.cabang.namaCabang}
                  {cabang.isPrimary && (
                    <span className="ml-1 text-xs text-green-600">(Utama)</span>
                  )}
                </span>
              </div>
            ))
          ) : (
            <span className="text-gray-400 italic">Belum Ditetapkan</span>
          )}
        </div>
      ),
    },
    {
      header: "Telepon",
      accessor: "telepon",
      cell: (row) => (
        <div>
          {row.telepon ? (
            <span>{row.telepon}</span>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      cell: (row) => (
        <div>
          {row.status === "aktif" ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Aktif
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Nonaktif
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Aksi",
      accessor: "actions",
      cell: (row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleViewUser(row)}
            className="p-1 text-gray-600 hover:text-indigo-800 rounded-full hover:bg-indigo-100"
            title="Lihat Detail"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleEditUser(row)}
            className="p-1 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-100"
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleResetPassword(row)}
            className="p-1 text-orange-600 hover:text-orange-800 rounded-full hover:bg-orange-100"
            title="Reset Password"
          >
            <Lock className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteUser(row)}
            className="p-1 text-red-600 hover:text-red-800 rounded-full hover:bg-red-100"
            title="Hapus"
          >
            <Trash className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="px-6 py-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            Manajemen User
          </h1>
          <div className="flex space-x-2">
            <button
              onClick={() => navigate("/users/roles")}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center hover:bg-gray-200"
            >
              <Users className="h-5 w-5 mr-2" />
              Roles & Perizinan
            </button>
            <button
              onClick={handleAddUser}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700"
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Tambah User
            </button>
          </div>
        </div>

        {/* Dashboard Section */}
        {showDashboard && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">
                Dashboard User
              </h2>
              <button
                onClick={toggleDashboard}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                {showDashboard ? "Sembunyikan" : "Tampilkan"} Dashboard
              </button>
            </div>
            <UserDashboard
              totalUsers={pagination.totalItems}
              userList={userList}
              onViewUser={handleViewUser}
              data={dashboardData}
              isLoading={isDashboardLoading}
              isError={isDashboardError}
              className=""
            />
          </div>
        )}

        {/* Table Section */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="p-4 border-b flex items-center justify-between flex-wrap gap-4">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Cari user..."
                className="pl-10 pr-4 py-2 border rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Filter className="text-gray-400" size={18} />
                <select
                  className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="all">Semua Role</option>
                  {roleList.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.namaRole}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <select
                  className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Semua Status</option>
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Tampilkan:</span>
                <select
                  className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>

              {!showDashboard && (
                <button
                  onClick={toggleDashboard}
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                >
                  Tampilkan Dashboard
                </button>
              )}
            </div>
          </div>

          <Table
            columns={columns}
            data={userList}
            isLoading={isLoading}
            emptyMessage="Tidak ada data user yang tersedia"
            pagination={pagination}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Tambah User Baru"
      >
        <UserForm
          onSubmit={handleAddFormSubmit}
          onCancel={() => setShowAddModal(false)}
          isLoading={createUserMutation.isPending}
        />
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit User"
      >
        <UserForm
          user={selectedUser}
          onSubmit={handleEditFormSubmit}
          onCancel={() => setShowEditModal(false)}
          isLoading={updateUserMutation.isPending}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Konfirmasi Hapus"
      >
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Apakah Anda yakin ingin menghapus user "{selectedUser?.namaLengkap}
            "? Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100"
              disabled={deleteUserMutation.isPending}
            >
              Batal
            </button>
            <button
              onClick={confirmDeleteUser}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed flex items-center"
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash className="h-4 w-4 mr-2" />
                  Hapus
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Reset Password Confirmation Modal */}
      <Modal
        isOpen={showResetPasswordModal}
        onClose={() => setShowResetPasswordModal(false)}
        title="Reset Password"
      >
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Apakah Anda yakin ingin mereset password untuk user "
            {selectedUser?.namaLengkap}"? Email dengan instruksi reset password
            akan dikirimkan ke {selectedUser?.email}.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowResetPasswordModal(false)}
              className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100"
              disabled={resetPasswordMutation.isPending}
            >
              Batal
            </button>
            <button
              onClick={confirmResetPassword}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed flex items-center"
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Reset Password
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagementPage;
