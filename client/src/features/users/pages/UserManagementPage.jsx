import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiEdit2 as Edit,
  FiTrash2 as Trash,
  FiEye as Eye,
  FiUserPlus as UserPlus,
  FiUsers as Users,
  FiLock as Lock,
} from "react-icons/fi";
import Modal from "@features/common/Modal";
import Table from "@features/common/Table";
import UserForm from "../components/UserForm";
import UserDashboard from "../components/UserDashboard";
import UserFilters from "../components/UserFilters";
import UserDeleteModal from "../components/UserDeleteModal";
import UserResetPasswordModal from "../components/UserResetPasswordModal";
import useUsers from "../hooks/useUsers";
import { useAuth } from "@common/hooks/useAuth";
import { useCabangList } from "../../cabang/hooks/useCabangQueries";
import { Can } from "@features/common/Can";

const UserManagementPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cabangFilter, setCabangFilter] = useState("all"); // Initialize cabangFilter
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDashboard, setShowDashboard] = useState(true);

  const { user, isSuperAdmin } = useAuth();
  const isAdmin = isSuperAdmin();

  // Fetch all branches only if super admin
  const { data: allCabangData } = useCabangList(1, 100, {
    enabled: isAdmin
  });
  const allCabangList = allCabangData?.data || [];

  // Determine available branches for filtering based on user role
  const availableCabangForFilter = isAdmin
    ? allCabangList // Already has id and namaCabang
    : user?.cabang?.map(c => ({ id: c.cabangId, namaCabang: c.namaCabang })) || [];

  // Set initial cabangFilter based on user's assigned branches
  useEffect(() => {
    if (!isAdmin && user?.cabang?.length === 1) {
      setCabangFilter(user.cabang[0].cabangId);
    } else {
      setCabangFilter("all");
    }
  }, [isAdmin, user?.cabang]);

  // useUsers hook for all data and operations
  const {
    getUsersQuery,
    getDashboardQuery,
    getRolesQuery,
    createUser,
    updateUser,
    deleteUser,
    resetPassword,
  } = useUsers({
    search: searchQuery,
    roleId: roleFilter !== "all" ? roleFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    cabangId: cabangFilter !== "all" ? cabangFilter : undefined, // Add cabangId to useUsers payload
    page: currentPage,
    limit: itemsPerPage,
  });

  const { data: usersData, isLoading: isLoadingUsers, isError: isUsersError, error: usersError } = getUsersQuery;
  const { data: roleList = [] } = getRolesQuery;
  const { data: dashboardData, isLoading: isDashboardLoading, isError: isDashboardError } = getDashboardQuery(showDashboard, cabangFilter);

  // Extract user list and pagination info
  const userList = usersData?.data || [];
  const pagination = usersData?.pagination || {
    totalItems: 0,
    totalPages: 0,
    currentPage: 1,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false,
  };

  // UI Handlers
  const handleAddUser = () => {
    setSelectedUser(null);
    setShowAddModal(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleViewUser = (user) => {
    if (user?.id) {
      navigate(`/users/${user.id}`);
    } else {
      setShowDashboard(false);
    }
  };

  const handleResetPassword = (user) => {
    setSelectedUser(user);
    setShowResetPasswordModal(true);
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleAddFormSubmit = (userData) => {
    createUser.mutate(userData, {
      onSuccess: () => setShowAddModal(false)
    });
  };

  const handleEditFormSubmit = (userData) => {
    updateUser.mutate({ id: selectedUser.id, userData }, {
      onSuccess: () => setShowEditModal(false)
    });
  };

  const toggleDashboard = () => setShowDashboard(!showDashboard);

  const columns = useMemo(() => [
    {
      header: "Nama User",
      accessor: "namaLengkap",
      cell: (row) => (
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {row.avatarUrl ? (
              <img src={row.avatarUrl} alt={row.namaLengkap} className="h-full w-full object-cover" />
            ) : (
              <span className="text-gray-500 font-medium">{row.namaLengkap.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="ml-3">
            <p className="font-medium text-gray-900">{row.namaLengkap}</p>
            <p className="text-xs text-gray-500">{row.email}</p>
          </div>
        </div>
      ),
    },
    { header: "Username", accessor: "username" },
    {
      header: "Role",
      accessor: "userRoles",
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.userRoles?.map((userRole, index) => (
            <span
              key={index}
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                userRole.role.namaRole === "super_admin" ? "bg-purple-100 text-purple-800" :
                userRole.role.namaRole === "admin_cabang" ? "bg-blue-100 text-blue-800" :
                "bg-green-100 text-green-800"
              }`}
            >
              {userRole.role.namaRole.replace("_", " ")}
            </span>
          )) || <span className="text-gray-400 italic">Tidak ada role</span>}
        </div>
      ),
    },
    {
      header: "Cabang",
      accessor: "userCabang",
      cell: (row) => (
        <div>
          {row.userCabang?.map((cabang, index) => (
            <div key={index} className={index > 0 ? "mt-1" : ""}>
              <span>{cabang.cabang.namaCabang} {cabang.isPrimary && <span className="ml-1 text-xs text-green-600">(Utama)</span>}</span>
            </div>
          )) || <span className="text-gray-400 italic">Belum Ditetapkan</span>}
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      cell: (row) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          row.status === "aktif" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}>
          {row.status ? row.status.charAt(0).toUpperCase() + row.status.slice(1) : "-"}
        </span>
      ),
    },
    {
      header: "Aksi",
      accessor: "actions",
      cell: (row) => (
        <div className="flex space-x-2">
          <Can permission="user:read">
            <button onClick={() => handleViewUser(row)} className="p-1 text-gray-600 hover:text-indigo-800 rounded-full hover:bg-indigo-100" title="Lihat">
              <Eye className="h-4 w-4" />
            </button>
          </Can>
          <Can permission="user:update">
            <button onClick={() => handleEditUser(row)} className="p-1 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-100" title="Edit">
              <Edit className="h-4 w-4" />
            </button>
          </Can>
          <Can permission="user:reset-password">
            <button onClick={() => handleResetPassword(row)} className="p-1 text-orange-600 hover:text-orange-800 rounded-full hover:bg-orange-100" title="Reset">
              <Lock className="h-4 w-4" />
            </button>
          </Can>
          <Can permission="user:delete">
            <button onClick={() => handleDeleteUser(row)} className="p-1 text-red-600 hover:text-red-800 rounded-full hover:bg-red-100" title="Hapus">
              <Trash className="h-4 w-4" />
            </button>
          </Can>
        </div>
      ),
    },
  ], []);

  if (isUsersError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 p-4 rounded-lg border border-red-200 mb-6">
          <p className="text-red-700">Error: {usersError.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 sm:gap-0">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Manajemen User</h1>
        <div className="grid grid-cols-2 sm:flex sm:flex-row w-full sm:w-auto gap-2 sm:space-x-2">
          <Can anyPermissions={["role:read", "permission:read"]}>
            <button onClick={() => navigate("/users/roles")} className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors text-sm sm:text-base">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 flex-shrink-0" /> <span className="truncate">Roles & Perizinan</span>
            </button>
          </Can>
          <Can permission="user:create">
            <button onClick={handleAddUser} className="bg-indigo-600 text-white px-3 py-2 rounded-lg flex items-center justify-center hover:bg-indigo-700 transition-colors text-sm sm:text-base shadow-sm">
              <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 flex-shrink-0" /> <span className="truncate">Tambah User</span>
            </button>
          </Can>
        </div>
      </div>

      {/* Dashboard Section */}
      {showDashboard && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Dashboard User</h2>
            <button onClick={toggleDashboard} className="text-sm text-gray-500 hover:text-gray-700">Sembunyikan Dashboard</button>
          </div>
          <UserDashboard
            totalUsers={pagination.totalItems}
            userList={userList}
            onViewUser={handleViewUser}
            data={dashboardData}
            isLoading={isDashboardLoading}
            isError={isDashboardError}
          />
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <UserFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          cabangFilter={cabangFilter}
          setCabangFilter={setCabangFilter}
          availableCabang={availableCabangForFilter}
          itemsPerPage={itemsPerPage}
          handleItemsPerPageChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
          roleList={roleList}
          showDashboard={showDashboard}
          toggleDashboard={toggleDashboard}
        />

        <Table
          columns={columns}
          data={userList}
          isLoading={isLoadingUsers}
          emptyMessage="Tidak ada data user yang tersedia"
          pagination={pagination}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Modals */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Tambah User Baru" size="xl">
        <UserForm onSubmit={handleAddFormSubmit} onCancel={() => setShowAddModal(false)} isLoading={createUser.isPending} />
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit User" size="xl">
        <UserForm user={selectedUser} onSubmit={handleEditFormSubmit} onCancel={() => setShowEditModal(false)} isLoading={updateUser.isPending} />
      </Modal>

      <UserDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        selectedUser={selectedUser}
        onConfirm={() => deleteUser.mutate(selectedUser.id, { onSuccess: () => setShowDeleteModal(false) })}
        isLoading={deleteUser.isPending}
      />

      <UserResetPasswordModal
        isOpen={showResetPasswordModal}
        onClose={() => setShowResetPasswordModal(false)}
        selectedUser={selectedUser}
        onConfirm={() => resetPassword.mutate(selectedUser.id, { onSuccess: () => setShowResetPasswordModal(false) })}
        isLoading={resetPassword.isPending}
      />
    </div>
  );
};

export default UserManagementPage;
