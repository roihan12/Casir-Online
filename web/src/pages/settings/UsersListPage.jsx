import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Edit, Trash2, Shield, ToggleLeft, ToggleRight, Key, UserCheck, UserX } from 'lucide-react';
import { Card, Button, Input, DataTable, Modal, Tooltip } from '@shared/ui';
import { useUsers, useDeleteUser, useChangeUserStatus, useResetUserPassword, useCabang } from '@entities/user';
import { useRoles } from '@entities/role';
import { formatDateTime } from '@shared/lib';
import { Can } from '@features/auth';
import MainLayout from '@widgets/layout/MainLayout';

const UsersListPage = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [cabangFilter, setCabangFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const { data: usersData, isLoading } = useUsers({ 
    page, 
    limit: 10, 
    search: search || undefined,
    status: statusFilter || undefined,
    roleId: roleFilter || undefined,
    cabangId: cabangFilter || undefined,
  });
  const { data: rolesData } = useRoles();
  const { data: cabangData } = useCabang();
  const deleteUser = useDeleteUser();
  const changeStatus = useChangeUserStatus();
  const resetPassword = useResetUserPassword();

  const users = usersData?.data?.users || usersData?.data || [];
  const pagination = usersData?.pagination;
  const stats = usersData?.stats;
  const roles = rolesData?.data || [];
  const cabangList = cabangData?.data || [];

  const handleToggleStatus = (user) => {
    const newStatus = user.status === 'aktif' ? 'nonaktif' : 'aktif';
    changeStatus.mutate({ id: user.id || user.userId, status: newStatus });
  };

  const handleResetPassword = () => {
    if (!newPassword || newPassword.length < 6) return;
    resetPassword.mutate(
      { id: selectedUser.id || selectedUser.userId, password: newPassword },
      { onSuccess: () => { setShowResetModal(false); setNewPassword(''); } }
    );
  };

  const handleDelete = () => {
    deleteUser.mutate(selectedUser.id || selectedUser.userId, {
      onSuccess: () => { setShowDeleteModal(false); setSelectedUser(null); },
    });
  };

  const columns = [
    {
      key: 'namaLengkap',
      header: 'User',
      render: (value, row) => (
        <div className="flex items-center gap-3">
          {row.avatarUrl ? (
            <img src={row.avatarUrl} alt={value} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold">
              {value?.charAt(0) || 'U'}
            </div>
          )}
          <div>
            <p className="font-medium text-gray-800">{value}</p>
            <p className="text-xs text-gray-500">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'username',
      header: 'Username',
    },
    {
      key: 'userRoles',
      header: 'Roles',
      render: (value) => (
        <div className="flex flex-wrap gap-1">
          {value?.map((ur, i) => (
            <span key={i} className="badge bg-indigo-100 text-indigo-700 text-xs">
              {ur.role?.namaRole || ur.namaRole || '-'}
            </span>
          )) || '-'}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => (
        <span className={`badge ${value === 'aktif' ? 'badge-success' : 'badge-danger'}`}>
          {value === 'aktif' ? 'Aktif' : 'Nonaktif'}
        </span>
      ),
    },
    {
      key: 'lastLogin',
      header: 'Login Terakhir',
      render: (value) => value ? formatDateTime(value) : '-',
    },
     {
      key: 'userCabang',
      header: 'Cabang',
      render: (value) => (
        <div className="flex flex-wrap gap-1">
          {value?.map((ur, i) => (
            <span key={i} className="badge bg-red-100 text-red-700 text-xs">
              {ur.cabang?.namaCabang || ur.namaCabang || '-'}
            </span>
          )) || '-'}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <Can permission="user:update">
            <Tooltip content={row.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'} position="top">
              <button
                onClick={(e) => { e.stopPropagation(); handleToggleStatus(row); }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {row.status === 'aktif' ? (
                  <ToggleRight className="w-4 h-4 text-emerald-500" />
                ) : (
                  <ToggleLeft className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </Tooltip>
            <Tooltip content="Reset Password" position="top">
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedUser(row); setShowResetModal(true); }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Key className="w-4 h-4 text-amber-500" />
              </button>
            </Tooltip>
            <Tooltip content="Edit User" position="top">
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/settings/pengguna/${row.id}/edit`); }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4 text-gray-500" />
              </button>
            </Tooltip>
          </Can>
          <Can permission="user:delete">
            <Tooltip content="Hapus User" position="top">
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedUser(row); setShowDeleteModal(true); }}
                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </Tooltip>
          </Can>
        </div>
      ),
    },
  ];

  return (
    <MainLayout title="User Management" subtitle="Kelola pengguna sistem">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-white/70">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl glass-surface text-indigo-500">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats?.totalUsers ?? pagination?.totalItems ?? 0}</p>
              <p className="text-sm text-gray-500">Total Users</p>
            </div>
          </div>
        </Card>
        <Card className="bg-white/70">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl glass-surface text-emerald-500">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats?.activeUsers ?? 0}</p>
              <p className="text-sm text-gray-500">User Aktif</p>
            </div>
          </div>
        </Card>
        <Card className="bg-white/70">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl glass-surface text-red-500">
              <UserX className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats?.inactiveUsers ?? 0}</p>
              <p className="text-sm text-gray-500">User Nonaktif</p>
            </div>
          </div>
        </Card>
        <Card className="bg-white/70">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl glass-surface text-purple-500">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{roles.length}</p>
              <p className="text-sm text-gray-500">Roles</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Actions */}
      <Card className="mb-6">
        <div className="flex flex-col gap-4">
          {/* Filters Row */}
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px] max-w-md">
              <Input
                placeholder="Cari user..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Semua Status</option>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Semua Role</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>{role.namaRole}</option>
              ))}
            </select>
            <select
              value={cabangFilter}
              onChange={(e) => { setCabangFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Semua Cabang</option>
              {cabangList.map(cabang => (
                <option key={cabang.id} value={cabang.id}>{cabang.namaCabang}</option>
              ))}
            </select>
          </div>
          {/* Add Button */}
          <div className="flex justify-end">
            <Can permission="user:create">
              <Button leftIcon={<Plus className="w-5 h-5" />} onClick={() => navigate('/settings/pengguna/tambah')}>
                Tambah User
              </Button>
            </Can>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <DataTable
          columns={columns}
          data={users}
          loading={isLoading}
          pagination={pagination}
          onPageChange={setPage}
          emptyMessage="Belum ada user"
        />
      </Card>

      {/* Delete Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Hapus User" size="sm">
        <p className="text-gray-600 mb-4">Yakin ingin menghapus user "{selectedUser?.namaLengkap}"?</p>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>Batal</Button>
          <Button onClick={handleDelete} loading={deleteUser.isPending} className="bg-red-500 hover:bg-red-600">
            Hapus
          </Button>
        </div>
      </Modal>

      {/* Reset Password Modal */}
      <Modal isOpen={showResetModal} onClose={() => setShowResetModal(false)} title="Reset Password" size="sm">
        <p className="text-gray-600 mb-4">Reset password untuk: {selectedUser?.namaLengkap}</p>
        <Input
          type="password"
          placeholder="Password baru (min 6 karakter)"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="mb-4"
        />
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => { setShowResetModal(false); setNewPassword(''); }}>Batal</Button>
          <Button onClick={handleResetPassword} loading={resetPassword.isPending} disabled={newPassword.length < 6}>
            Reset Password
          </Button>
        </div>
      </Modal>
    </MainLayout>
  );
};

export default UsersListPage;

