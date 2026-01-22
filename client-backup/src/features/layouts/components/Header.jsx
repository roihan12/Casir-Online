import React, { useState } from 'react';
import { Bell, ChevronDown, LogOut, Settings, User } from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { useCabang } from '../../cabang/hooks/useCabang';
import { Link } from 'react-router-dom';

const Header = ({ user, selectedCabang }) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { logout } = useAuth();
  const { cabangList, selectCabang } = useCabang();

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
    if (notificationsOpen) setNotificationsOpen(false);
  };

  const toggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen);
    if (userMenuOpen) setUserMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
  };

  const handleChangeCabang = (cabangId) => {
    selectCabang(cabangId);
    setUserMenuOpen(false);
  };

  // Profile link is now role-independent
  const getProfileLink = () => {
    return '/profile';
  };

  return (
    <header className="bg-white border-b border-gray-200 py-3 px-4 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">
          {selectedCabang ? selectedCabang.nama : 'Dashboard'}
        </h1>
      </div>

      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={toggleNotifications}
            className="p-1 rounded-full hover:bg-gray-100 relative"
          >
            <Bell size={20} />
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
              <div className="px-4 py-2 border-b border-gray-200">
                <h3 className="text-sm font-semibold">Notifikasi</h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <div className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50">
                  <p className="text-sm font-medium">Stok Hampir Habis</p>
                  <p className="text-xs text-gray-500">Produk X tersisa 5 item</p>
                  <p className="text-xs text-gray-400 mt-1">2 jam yang lalu</p>
                </div>
                <div className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50">
                  <p className="text-sm font-medium">Pembayaran Diterima</p>
                  <p className="text-xs text-gray-500">Rp 500.000 dari Invoice #12345</p>
                  <p className="text-xs text-gray-400 mt-1">5 jam yang lalu</p>
                </div>
              </div>
              <div className="px-4 py-2 border-t border-gray-200">
                <Link
                  to="/notifications"
                  className="text-sm text-blue-600 hover:text-blue-800"
                  onClick={() => setNotificationsOpen(false)}
                >
                  Lihat Semua Notifikasi
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={toggleUserMenu}
            className="flex items-center space-x-2 focus:outline-none"
          >
            <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-500">{user?.role || 'Role'}</p>
            </div>
            <ChevronDown size={16} />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
              <Link
                to={getProfileLink()}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setUserMenuOpen(false)}
              >
                <User size={16} className="mr-2" />
                Profil
              </Link>

              {/* Cabang Selector - Only for roles that can switch branches */}
              {['super_admin', 'admin_cabang'].includes(user?.role) && cabangList && cabangList.length > 0 && (
                <div className="border-t border-gray-100 pt-1 mt-1">
                  <p className="px-4 py-1 text-xs text-gray-500">Pilih Cabang</p>
                  {cabangList.map(cabang => (
                    <button
                      key={cabang.id}
                      onClick={() => handleChangeCabang(cabang.id)}
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                      {cabang.nama}
                      {selectedCabang?.id === cabang.id && (
                        <span className="ml-auto text-xs text-green-600">Aktif</span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              <Link
                to="/settings"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-t border-gray-100"
                onClick={() => setUserMenuOpen(false)}
              >
                <Settings size={16} className="mr-2" />
                Pengaturan
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 border-t border-gray-100"
              >
                <LogOut size={16} className="mr-2" />
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;