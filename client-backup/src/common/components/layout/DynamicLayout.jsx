import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "@features/auth/hooks/useAuth";
import { useCabang } from "@features/cabang/hooks/useCabang";
import SuperAdminLayout from "./SuperAdminLayout";
import AdminCabangLayout from "./AdminCabangLayout";
import KasirLayout from "./KasirLayout";

/**
 * DynamicLayout component that renders the appropriate layout based on user role and selected branch
 * 
 * This component is key to the branch switching functionality:
 * - For super_admin users, it shows AdminCabangLayout when viewing a specific branch
 * - For super_admin users, it shows SuperAdminLayout when in global view
 * - For other roles, it shows their role-specific layouts
 * 
 * The layout changes automatically when selectedCabang changes through CabangSwitcher
 * without requiring specific route changes.
 * 
 * @returns {JSX.Element} The appropriate layout component based on user role and selected branch
 */
const DynamicLayout = () => {
  const { getUserRole } = useAuth();
  const { selectedCabang, isGlobalView } = useCabang();
  const userRole = getUserRole();
  // State untuk memaksa render ulang komponen
  const [forceUpdate, setForceUpdate] = useState(0);

  // Untuk debugging
  useEffect(() => {
    console.log('DynamicLayout mounted/updated with:', {
      userRole,
      selectedCabang,
      isGlobalView,
      selectedCabangId: selectedCabang?.id,
      isGlobalViewFromCabang: selectedCabang?.isGlobalView
    });
    
    // Tambahkan logging untuk memeriksa apakah isGlobalView konsisten dengan selectedCabang.isGlobalView
    if (selectedCabang && selectedCabang.isGlobalView !== isGlobalView) {
      console.warn('DynamicLayout: Inconsistent isGlobalView state detected in useEffect', {
        selectedCabang: selectedCabang,
        isGlobalView: isGlobalView,
        selectedCabangIsGlobalView: selectedCabang.isGlobalView
      });
    }
  }, [userRole, selectedCabang, isGlobalView]);
  
  // Listener untuk event cabangSwitch
  useEffect(() => {
    const handleCabangSwitch = () => {
      console.log('DynamicLayout: Detected cabangSwitch event, forcing re-render');
      // Memaksa render ulang komponen
      setForceUpdate(prev => prev + 1);
    };
    
    // Daftarkan event listener
    window.addEventListener('cabangSwitch', handleCabangSwitch);
    
    // Cleanup event listener saat komponen unmount
    return () => {
      window.removeEventListener('cabangSwitch', handleCabangSwitch);
    };
  }, []);

  // Determine which layout to use based on user role
  const getLayoutComponent = () => {
    console.log('DynamicLayout.getLayoutComponent - userRole:', userRole, 'selectedCabang:', selectedCabang, 'isGlobalView:', isGlobalView);
    
    // Jika tidak ada selectedCabang, tampilkan loading atau fallback
    if (!selectedCabang) {
      console.log('DynamicLayout: No selectedCabang, rendering fallback');
      return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }
    
    // Log tambahan untuk debugging
    console.log('DynamicLayout.getLayoutComponent - selectedCabang details:', {
      id: selectedCabang.id,
      namaCabang: selectedCabang.namaCabang,
      isGlobalView: selectedCabang.isGlobalView
    });
    
    // Pastikan isGlobalView konsisten dengan selectedCabang.isGlobalView
    // dan gunakan selectedCabang.isGlobalView sebagai sumber kebenaran
    const actualIsGlobalView = selectedCabang.isGlobalView;
    if (actualIsGlobalView !== isGlobalView) {
      console.warn('DynamicLayout: Inconsistent isGlobalView state detected', {
        selectedCabang: selectedCabang,
        isGlobalView: isGlobalView,
        selectedCabangIsGlobalView: actualIsGlobalView
      });
      // Gunakan nilai dari selectedCabang.isGlobalView sebagai sumber kebenaran
      console.log('DynamicLayout: Using selectedCabang.isGlobalView as source of truth:', actualIsGlobalView);
    }
    
    // Kita tidak perlu kondisi khusus di sini karena sudah ditangani dalam switch statement
    // dengan menggunakan actualIsGlobalView sebagai sumber kebenaran

    // Otherwise use role-specific layout
    switch (userRole) {
      case "super_admin":
        // Untuk super_admin, gunakan SuperAdminLayout hanya jika dalam global view
        if (actualIsGlobalView) {
          console.log('DynamicLayout: Rendering SuperAdminLayout for super_admin with global view');
          return <SuperAdminLayout />;
        } else {
          // Jika tidak dalam global view, gunakan AdminCabangLayout
          console.log('DynamicLayout: Rendering AdminCabangLayout for super_admin with specific branch (from switch)');
          return <AdminCabangLayout />;
        }
      case "admin_cabang":
        console.log('DynamicLayout: Rendering AdminCabangLayout for admin_cabang');
        return <AdminCabangLayout />;
      case "kasir":
        console.log('DynamicLayout: Rendering KasirLayout for kasir');
        return <KasirLayout />;
      case "gudang":
      case "manajer":
        // Gudang and Manajer use the same layout as AdminCabang
        console.log(`DynamicLayout: Rendering AdminCabangLayout for ${userRole}`);
        return <AdminCabangLayout />;
      default:
        // Fallback to SuperAdminLayout if role is unknown
        console.log('DynamicLayout: Rendering SuperAdminLayout as fallback for unknown role:', userRole);
        return <SuperAdminLayout />;
    }
  };

  return getLayoutComponent();
};

export default DynamicLayout;