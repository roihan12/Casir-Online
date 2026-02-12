import React from 'react';
import { useSelector } from 'react-redux';
import SuperAdminLayout from './SuperAdminLayout';
import AdminCabangLayout from './AdminCabangLayout';
import KasirLayout from './KasirLayout';

/**
 * DynamicLayout - Komponen yang menentukan layout berdasarkan peran pengguna
 * 
 * Komponen ini akan memilih layout yang sesuai berdasarkan peran pengguna yang sedang login
 * dan juga mempertimbangkan tampilan global untuk super_admin
 */
const DynamicLayout = () => {
  const { user } = useSelector((state) => state.auth);
  const { selectedCabang, isGlobalView } = useSelector((state) => state.cabang);

  // Tentukan layout berdasarkan peran pengguna
  const renderLayout = () => {
    const role = user?.role?.name;

    // Jika super_admin dengan cabang terpilih dan bukan tampilan global, gunakan AdminCabangLayout
    if (role === 'super_admin' && selectedCabang && !isGlobalView) {
      return <AdminCabangLayout />;
    }

    // Pilih layout berdasarkan peran
    switch (role) {
      case 'super_admin':
        return <SuperAdminLayout />;
      case 'admin_cabang':
      case 'manajer':
      case 'gudang':
        return <AdminCabangLayout />;
      case 'kasir':
        return <KasirLayout />;
      default:
        // Fallback ke SuperAdminLayout jika peran tidak dikenali
        return <SuperAdminLayout />;
    }
  };

  return renderLayout();
};

export default DynamicLayout;