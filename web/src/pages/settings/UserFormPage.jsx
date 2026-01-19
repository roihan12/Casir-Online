import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Eye, EyeOff, Building2 } from 'lucide-react';
import { Card, Button, Input } from '@shared/ui';
import { useUser, useCreateUser, useUpdateUser, useCabang } from '@entities/user';
import { useRoles } from '@entities/role';
import MainLayout from '@widgets/layout/MainLayout';

const UserFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    namaLengkap: '',
    telepon: '',
    password: '',
    confirmPassword: '',
    selectedRoles: [], // Array of { roleId, cabangId }
    selectedCabang: [], // Array of { cabangId, isPrimary }
    status: 'aktif',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  // Fetch data
  const { data: userData, isLoading: userLoading } = useUser(id);
  const { data: rolesData } = useRoles();
  const { data: cabangData } = useCabang();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const roles = rolesData?.data || [];
  const cabangList = cabangData?.data || [];

  // Populate form when editing
  useEffect(() => {
    if (isEdit && userData?.data) {
      const user = userData.data;
      setFormData({
        username: user.username || '',
        email: user.email || '',
        namaLengkap: user.namaLengkap || '',
        telepon: user.telepon || '',
        password: '',
        confirmPassword: '',
        selectedRoles: user.userRoles?.map(ur => ({ 
          roleId: ur.roleId, 
          cabangId: ur.cabangId 
        })) || [],
        selectedCabang: user.userCabang?.map(uc => ({ 
          cabangId: uc.cabangId, 
          isPrimary: uc.isPrimary || false 
        })) || [],
        status: user.status || 'aktif',
      });
    }
  }, [isEdit, userData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  // Handle cabang selection
  const handleCabangToggle = (cabangId) => {
    setFormData(prev => {
      const exists = prev.selectedCabang.find(c => c.cabangId === cabangId);
      if (exists) {
        // Remove cabang and its associated roles
        return {
          ...prev,
          selectedCabang: prev.selectedCabang.filter(c => c.cabangId !== cabangId),
          selectedRoles: prev.selectedRoles.filter(r => r.cabangId !== cabangId),
        };
      } else {
        // Add cabang with isPrimary = false (or true if first)
        return {
          ...prev,
          selectedCabang: [
            ...prev.selectedCabang,
            { cabangId, isPrimary: prev.selectedCabang.length === 0 }
          ],
        };
      }
    });
  };

  // Handle primary cabang
  const handlePrimaryCabang = (cabangId) => {
    setFormData(prev => ({
      ...prev,
      selectedCabang: prev.selectedCabang.map(c => ({
        ...c,
        isPrimary: c.cabangId === cabangId,
      })),
    }));
  };

  // Handle role selection per cabang
  const handleRoleToggle = (roleId, cabangId) => {
    setFormData(prev => {
      const exists = prev.selectedRoles.find(r => r.roleId === roleId && r.cabangId === cabangId);
      if (exists) {
        return {
          ...prev,
          selectedRoles: prev.selectedRoles.filter(r => !(r.roleId === roleId && r.cabangId === cabangId)),
        };
      } else {
        return {
          ...prev,
          selectedRoles: [...prev.selectedRoles, { roleId, cabangId }],
        };
      }
    });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = 'Username wajib diisi';
    if (!formData.email.trim()) newErrors.email = 'Email wajib diisi';
    if (!formData.namaLengkap.trim()) newErrors.namaLengkap = 'Nama lengkap wajib diisi';
    if (!isEdit && !formData.password) newErrors.password = 'Password wajib diisi';
    if (formData.password && formData.password.length < 6) newErrors.password = 'Password minimal 6 karakter';
    if (formData.password && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Password tidak cocok';
    }
    if (formData.selectedCabang.length === 0) newErrors.cabang = 'Pilih minimal 1 cabang';
    if (formData.selectedRoles.length === 0) newErrors.roles = 'Pilih minimal 1 role untuk setiap cabang';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Transform to backend format
    const payload = {
      username: formData.username,
      email: formData.email,
      namaLengkap: formData.namaLengkap,
      telepon: formData.telepon || null,
      status: formData.status,
      userRoles: formData.selectedRoles,
      userCabang: formData.selectedCabang,
    };
    if (formData.password) payload.password = formData.password;

    if (isEdit) {
      updateUser.mutate({ id, data: payload }, {
        onSuccess: () => navigate('/settings/pengguna'),
      });
    } else {
      createUser.mutate(payload, {
        onSuccess: () => navigate('/settings/pengguna'),
      });
    }
  };

  if (isEdit && userLoading) {
    return (
      <MainLayout title="Loading...">
        <Card><div className="animate-pulse h-96 bg-gray-100 rounded-lg" /></Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={isEdit ? 'Edit User' : 'Tambah User'} subtitle="Pengaturan Sistem">
      <form onSubmit={handleSubmit}>
        {/* Basic Info Card */}
        <Card className="mb-6">
          <Card.Header>
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <Card.Title>{isEdit ? 'Edit User' : 'Tambah User Baru'}</Card.Title>
            </div>
          </Card.Header>
          <Card.Content>
            <div className="grid md:grid-cols-2 gap-6">
              <Input
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                error={errors.username}
                placeholder="Masukkan username"
              />
              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                placeholder="email@example.com"
              />
              <Input
                label="Nama Lengkap"
                name="namaLengkap"
                value={formData.namaLengkap}
                onChange={handleChange}
                error={errors.namaLengkap}
                placeholder="Masukkan nama lengkap"
              />
              <Input
                label="Nomor Telepon"
                name="telepon"
                value={formData.telepon}
                onChange={handleChange}
                placeholder="08xxxxxxxxxx"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl glass-surface border-0 focus:ring-2 focus:ring-pink-300"
                >
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
              </div>
              <div className="relative">
                <Input
                  label={isEdit ? 'Password Baru (kosongkan jika tidak diubah)' : 'Password'}
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-gray-400"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <Input
                label="Konfirmasi Password"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                placeholder="••••••••"
              />
            </div>
          </Card.Content>
        </Card>

        {/* Cabang Selection Card */}
        <Card className="mb-6">
          <Card.Header>
            <Card.Title className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-500" />
              Pilih Cabang
            </Card.Title>
          </Card.Header>
          <Card.Content>
            {errors.cabang && <p className="text-sm text-red-500 mb-3">{errors.cabang}</p>}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {cabangList.map((cabang) => {
                const isSelected = formData.selectedCabang.find(c => c.cabangId === cabang.id);
                const isPrimary = isSelected?.isPrimary;
                return (
                  <div
                    key={cabang.id}
                    className={`p-3 rounded-xl cursor-pointer transition-all border-2 ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-400'
                        : 'glass-surface border-transparent hover:bg-gray-50'
                    }`}
                  >
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!isSelected}
                        onChange={() => handleCabangToggle(cabang.id)}
                        className="rounded border-gray-300 text-indigo-500"
                      />
                      <span className="text-sm font-medium">{cabang.namaCabang}</span>
                    </label>
                    {isSelected && (
                      <button
                        type="button"
                        onClick={() => handlePrimaryCabang(cabang.id)}
                        className={`mt-2 text-xs px-2 py-1 rounded-full ${
                          isPrimary
                            ? 'bg-indigo-500 text-white'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      >
                        {isPrimary ? '★ Primary' : 'Set Primary'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </Card.Content>
        </Card>

        {/* Role Selection per Cabang */}
        {formData.selectedCabang.length > 0 && (
          <Card className="mb-6">
            <Card.Header>
              <Card.Title>Assign Role per Cabang</Card.Title>
            </Card.Header>
            <Card.Content>
              {errors.roles && <p className="text-sm text-red-500 mb-3">{errors.roles}</p>}
              <div className="space-y-6">
                {formData.selectedCabang.map((sc) => {
                  const cabang = cabangList.find(c => c.id === sc.cabangId);
                  return (
                    <div key={sc.cabangId} className="glass-surface p-4 rounded-xl">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-indigo-500" />
                        {cabang?.namaCabang || sc.cabangId}
                        {sc.isPrimary && <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">Primary</span>}
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {roles.map((role) => {
                          const isRoleSelected = formData.selectedRoles.find(
                            r => r.roleId === role.id && r.cabangId === sc.cabangId
                          );
                          return (
                            <label
                              key={role.id}
                              className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all text-sm ${
                                isRoleSelected
                                  ? 'bg-indigo-100 text-indigo-700'
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={!!isRoleSelected}
                                onChange={() => handleRoleToggle(role.id, sc.cabangId)}
                                className="rounded border-gray-300 text-indigo-500"
                              />
                              <span>{role.namaRole}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card.Content>
          </Card>
        )}

        {/* Submit Button */}
        <Card>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
              Batal
            </Button>
            <Button
              type="submit"
              leftIcon={<Save className="w-5 h-5" />}
              loading={createUser.isPending || updateUser.isPending}
            >
              {isEdit ? 'Update' : 'Simpan'}
            </Button>
          </div>
        </Card>
      </form>
    </MainLayout>
  );
};

export default UserFormPage;
