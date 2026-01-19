import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Plus, Edit, Trash2, Check, Users, Lock, Copy, Search, X } from 'lucide-react';
import { Card, Button, DataTable, Modal, Input } from '@shared/ui';
import { useRoles, useDeleteRole, usePermissions, useCloneRole } from '@entities/role';
import { formatNumber } from '@shared/lib';
import { Can } from '@features/auth';
import MainLayout from '@widgets/layout/MainLayout';

// System roles that cannot be edited or deleted
const SYSTEM_ROLES = ['super_admin'];

const RolesListPage = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneName, setCloneName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: rolesData, isLoading } = useRoles();
  const { data: permissionsData } = usePermissions();
  const deleteRole = useDeleteRole();
  const cloneRole = useCloneRole();

  const allRoles = rolesData?.data || [];
  const allPermissions = permissionsData?.data || [];

  // Filter roles based on search query
  const roles = useMemo(() => {
    if (!searchQuery.trim()) return allRoles;
    const query = searchQuery.toLowerCase();
    return allRoles.filter(role =>
      role.namaRole?.toLowerCase().includes(query) ||
      role.deskripsi?.toLowerCase().includes(query) ||
      role.displayName?.toLowerCase().includes(query)
    );
  }, [allRoles, searchQuery]);

  // Check if role is a system role
  const isSystemRole = (role) => role.is_system || SYSTEM_ROLES.includes(role.namaRole);

  const handleDelete = () => {
    deleteRole.mutate(selectedRole.id, {
      onSuccess: () => {
        setShowDeleteModal(false);
        setSelectedRole(null);
      },
    });
  };

  const handleClone = () => {
    if (!cloneName.trim()) return;
    cloneRole.mutate(
      { roleId: selectedRole.id, newRoleName: cloneName.trim() },
      {
        onSuccess: () => {
          setShowCloneModal(false);
          setSelectedRole(null);
          setCloneName('');
        },
      }
    );
  };

  const openCloneModal = (role) => {
    setSelectedRole(role);
    setCloneName(`${role.namaRole}_copy`);
    setShowCloneModal(true);
  };

  const columns = [
    {
      key: 'namaRole',
      header: 'Role',
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg glass-surface ${isSystemRole(row) ? 'text-amber-500' : 'text-indigo-500'}`}>
            {isSystemRole(row) ? <Lock className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
          </div>
          <div>
            <span className="font-medium text-gray-800">{value}</span>
            {isSystemRole(row) && (
              <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                System
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'deskripsi',
      header: 'Deskripsi',
      render: (value) => <span className="text-gray-600">{value || '-'}</span>,
    },
    {
      key: '_count',
      header: 'Users',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="text-gray-700">{formatNumber(value?.userRoles || 0)}</span>
        </div>
      ),
    },
    {
      key: '_count',
      header: 'Permissions',
      render: (value) => (
        <span className="badge bg-indigo-100 text-indigo-700">
          {formatNumber(value?.permissions || 0)} izin
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (_, row) => {
        const isSystem = isSystemRole(row);
        return (
          <div className="flex items-center gap-1">
            <Can permission="role:create">
              <button
                onClick={(e) => { e.stopPropagation(); openCloneModal(row); }}
                className="p-2 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Clone Role"
              >
                <Copy className="w-4 h-4 text-indigo-500" />
              </button>
            </Can>
            <Can permission="role:update">
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/settings/role/${row.id}/edit`); }}
                className={`p-2 rounded-lg transition-colors ${isSystem ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                title={isSystem ? 'System role tidak bisa diedit' : 'Edit Role'}
                disabled={isSystem}
              >
                <Edit className="w-4 h-4 text-gray-500" />
              </button>
            </Can>
            <Can permission="role:delete">
              <button
                onClick={(e) => { 
                  e.stopPropagation(); 
                  if (!isSystem) {
                    setSelectedRole(row); 
                    setShowDeleteModal(true); 
                  }
                }}
                className={`p-2 rounded-lg transition-colors ${isSystem ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-50'}`}
                title={isSystem ? 'System role tidak bisa dihapus' : 'Hapus Role'}
                disabled={isSystem}
              >
                <Trash2 className={`w-4 h-4 ${isSystem ? 'text-gray-400' : 'text-red-500'}`} />
              </button>
            </Can>
          </div>
        );
      },
    },
  ];

  return (
    <MainLayout title="Role Management" subtitle="Kelola roles dan permissions">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Card className="bg-white/70">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl glass-surface text-indigo-500">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{formatNumber(roles.length)}</p>
              <p className="text-sm text-gray-500">Total Roles</p>
            </div>
          </div>
        </Card>
        <Card className="bg-white/70">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl glass-surface text-purple-500">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{formatNumber(allPermissions.length)}</p>
              <p className="text-sm text-gray-500">Total Permissions</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Actions */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Can permission="role:create">
            <Button leftIcon={<Plus className="w-5 h-5" />} onClick={() => navigate('/settings/role/tambah')}>
              Tambah Role
            </Button>
          </Can>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <DataTable
          columns={columns}
          data={roles}
          loading={isLoading}
          emptyMessage="Belum ada role"
        />
      </Card>

      {/* Delete Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Hapus Role" size="sm">
        <p className="text-gray-600 mb-2">Yakin ingin menghapus role "{selectedRole?.namaRole}"?</p>
        {selectedRole?._count?.userRoles > 0 && (
          <p className="text-amber-600 text-sm mb-4">
            ⚠️ Role ini masih digunakan oleh {selectedRole._count.userRoles} user. Mohon pindahkan user ke role lain terlebih dahulu.
          </p>
        )}
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>Batal</Button>
          <Button 
            variant="primary" 
            onClick={handleDelete} 
            loading={deleteRole.isPending} 
            className="bg-red-500 hover:bg-red-600"
            disabled={selectedRole?._count?.userRoles > 0}
          >
            Hapus
          </Button>
        </div>
      </Modal>

      {/* Clone Modal */}
      <Modal isOpen={showCloneModal} onClose={() => { setShowCloneModal(false); setCloneName(''); }} title="Clone Role" size="sm">
        <p className="text-gray-600 mb-4">
          Clone role "{selectedRole?.namaRole}" beserta {selectedRole?._count?.permissions || 0} permissions-nya.
        </p>
        <Input
          label="Nama Role Baru"
          placeholder="Masukkan nama role baru"
          value={cloneName}
          onChange={(e) => setCloneName(e.target.value)}
          className="mb-4"
        />
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => { setShowCloneModal(false); setCloneName(''); }}>Batal</Button>
          <Button 
            onClick={handleClone} 
            loading={cloneRole.isPending}
            disabled={!cloneName.trim()}
            leftIcon={<Copy className="w-4 h-4" />}
          >
            Clone
          </Button>
        </div>
      </Modal>
    </MainLayout>
  );
};

export default RolesListPage;

