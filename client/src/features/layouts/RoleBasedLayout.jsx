import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/hooks/useAuth.js';
import { useCabang } from '../cabang/context/CabangContext';
import { useUserMenus } from './hooks/useUserMenus';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

const RoleBasedLayout = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const { selectedCabang } = useCabang();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  // Get menu items based on user role
  const { menuItems, isLoading: menuLoading } = useUserMenus();
  
  if (loading || menuLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar 
        menuItems={menuItems} 
        user={user} 
        selectedCabang={selectedCabang}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header user={user} selectedCabang={selectedCabang} />
        <main className="flex-1 overflow-y-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default RoleBasedLayout;