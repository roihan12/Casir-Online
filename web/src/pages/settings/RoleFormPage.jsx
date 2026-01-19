import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Shield, Search, X } from 'lucide-react';
import { Card, Button, Input } from '@shared/ui';
import { useRole, useCreateRole, useUpdateRole, usePermissions, useRolePermissions, useBulkAssignPermissions } from '@entities/role';
import MainLayout from '@widgets/layout/MainLayout';

const RoleFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    namaRole: '',
    deskripsi: '',
  });
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [errors, setErrors] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch data
  const { data: roleData, isLoading: roleLoading } = useRole(id);
  const { data: permissionsData } = usePermissions();
  const { data: rolePermData } = useRolePermissions(id);
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const bulkAssign = useBulkAssignPermissions();

  const allPermissions = permissionsData?.data || [];

  // Filter permissions based on search query
  const filteredPermissions = useMemo(() => {
    if (!searchQuery.trim()) return allPermissions;
    const query = searchQuery.toLowerCase();
    return allPermissions.filter(perm => 
      perm.module?.toLowerCase().includes(query) ||
      perm.action?.toLowerCase().includes(query) ||
      perm.name?.toLowerCase().includes(query) ||
      perm.description?.toLowerCase().includes(query)
    );
  }, [allPermissions, searchQuery]);

  // Group filtered permissions by module
  const groupedPermissions = useMemo(() => {
    return filteredPermissions.reduce((acc, perm) => {
      const module = perm.module || 'other';
      if (!acc[module]) acc[module] = [];
      acc[module].push(perm);
      return acc;
    }, {});
  }, [filteredPermissions]);

  // Populate form when editing
  useEffect(() => {
    if (isEdit && roleData?.data) {
      setFormData({
        namaRole: roleData.data.namaRole || '',
        deskripsi: roleData.data.deskripsi || '',
      });
    }
  }, [isEdit, roleData]);

  // Populate permissions when editing
  useEffect(() => {
    if (rolePermData?.data) {
      setSelectedPermissions(rolePermData.data.map(p => p.id));
    }
  }, [rolePermData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handlePermissionToggle = (permId) => {
    setSelectedPermissions(prev =>
      prev.includes(permId)
        ? prev.filter(id => id !== permId)
        : [...prev, permId]
    );
  };

  const handleModuleToggle = (modulePerms) => {
    const permIds = modulePerms.map(p => p.id);
    const allSelected = permIds.every(id => selectedPermissions.includes(id));
    
    if (allSelected) {
      setSelectedPermissions(prev => prev.filter(id => !permIds.includes(id)));
    } else {
      setSelectedPermissions(prev => [...new Set([...prev, ...permIds])]);
    }
  };

  const handleSelectAll = () => {
    if (selectedPermissions.length === allPermissions.length) {
      setSelectedPermissions([]);
    } else {
      setSelectedPermissions(allPermissions.map(p => p.id));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.namaRole.trim()) newErrors.namaRole = 'Nama role wajib diisi';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (isEdit) {
        await updateRole.mutateAsync({ id, data: formData });
        // Update permissions
        await bulkAssign.mutateAsync({ roleId: id, permissionIds: selectedPermissions });
      } else {
        const result = await createRole.mutateAsync(formData);
        // Assign permissions to new role
        if (result?.data?.roleId && selectedPermissions.length > 0) {
          await bulkAssign.mutateAsync({ roleId: result.data.roleId, permissionIds: selectedPermissions });
        }
      }
      navigate('/settings/role');
    } catch (error) {
      console.error('Error saving role:', error);
    }
  };

  if (isEdit && roleLoading) {
    return (
      <MainLayout title="Loading...">
        <Card><div className="animate-pulse h-96 bg-gray-100 rounded-lg" /></Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={isEdit ? 'Edit Role' : 'Tambah Role'} subtitle="Pengaturan Sistem">
      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <Card className="mb-6">
          <Card.Header>
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <Card.Title>{isEdit ? 'Edit Role' : 'Tambah Role Baru'}</Card.Title>
            </div>
          </Card.Header>
          <Card.Content>
            <div className="grid md:grid-cols-2 gap-6">
              <Input
                label="Nama Role"
                name="namaRole"
                value={formData.namaRole}
                onChange={handleChange}
                error={errors.namaRole}
                placeholder="Contoh: admin, kasir, manager"
              />
              <Input
                label="Deskripsi"
                name="deskripsi"
                value={formData.deskripsi}
                onChange={handleChange}
                placeholder="Deskripsi role (opsional)"
              />
            </div>
          </Card.Content>
        </Card>

        {/* Permissions */}
        <Card className="mb-6">
          <Card.Header>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <Card.Title className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-500" />
                Permissions
              </Card.Title>
              <div className="flex items-center gap-3">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari permission..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-48 sm:w-64"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </div>
                {/* Select All Button */}
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-sm text-indigo-600 hover:text-indigo-800 whitespace-nowrap"
                >
                  {selectedPermissions.length === allPermissions.length ? 'Hapus Semua' : 'Pilih Semua'}
                </button>
              </div>
            </div>
          </Card.Header>
          <Card.Content>
            {Object.keys(groupedPermissions).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery ? (
                  <>
                    <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Tidak ada permission yang cocok dengan "{searchQuery}"</p>
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="mt-2 text-sm text-indigo-600 hover:underline"
                    >
                      Reset pencarian
                    </button>
                  </>
                ) : (
                  <p>Tidak ada permission tersedia</p>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedPermissions).map(([module, perms]) => {
                  const allSelected = perms.every(p => selectedPermissions.includes(p.id));
                  const someSelected = perms.some(p => selectedPermissions.includes(p.id));
                  
                  return (
                    <div key={module} className="glass-surface p-4 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-800 capitalize">{module}</h4>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            ref={(el) => el && (el.indeterminate = someSelected && !allSelected)}
                            onChange={() => handleModuleToggle(perms)}
                            className="rounded border-gray-300 text-indigo-500"
                          />
                          <span className="text-sm text-gray-600">Pilih Semua</span>
                        </label>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                        {perms.map((perm) => (
                          <label
                            key={perm.id}
                            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all text-sm ${
                              selectedPermissions.includes(perm.id)
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'hover:bg-gray-50'
                            }`}
                            title={perm.description || perm.name}
                          >
                            <input
                              type="checkbox"
                              checked={selectedPermissions.includes(perm.id)}
                              onChange={() => handlePermissionToggle(perm.id)}
                              className="rounded border-gray-300 text-indigo-500"
                            />
                            <span>{perm.action}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card.Content>
          <Card.Footer>
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">
                {selectedPermissions.length} dari {allPermissions.length} permission dipilih
                {searchQuery && ` (menampilkan ${filteredPermissions.length} hasil)`}
              </p>
              <div className="flex gap-3">
                <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
                  Batal
                </Button>
                <Button
                  type="submit"
                  leftIcon={<Save className="w-5 h-5" />}
                  loading={createRole.isPending || updateRole.isPending || bulkAssign.isPending}
                >
                  {isEdit ? 'Update' : 'Simpan'}
                </Button>
              </div>
            </div>
          </Card.Footer>
        </Card>
      </form>
    </MainLayout>
  );
};

export default RoleFormPage;

