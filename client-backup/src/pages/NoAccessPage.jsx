import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldOff, LogOut, ArrowLeft } from 'lucide-react';
import { useAuth } from '../features/auth/hooks/useAuth';

/**
 * NoAccessPage - Shown when a user doesn't have required permissions.
 * Provides options to go back, logout, or contact admin.
 */
const NoAccessPage = () => {
  const navigate = useNavigate();
  const { logout, user, getUserRole } = useAuth();

  const userRole = getUserRole();

  const handleLogout = async () => {
    await logout();
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Icon */}
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldOff className="w-10 h-10 text-red-500" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Akses Ditolak
        </h1>

        {/* Description */}
        <p className="text-gray-600 mb-6">
          Maaf, akun Anda ({user?.namaLengkap || userRole}) tidak memiliki izin untuk mengakses halaman ini.
        </p>

        {/* Info Box */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <p className="text-amber-800 text-sm">
            Jika Anda merasa ini adalah kesalahan, silakan hubungi administrator untuk mendapatkan izin yang diperlukan.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleGoBack}
            className="w-full flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
          >
            <LogOut size={18} className="mr-2" />
            Logout
          </button>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-400 mt-6">
          Role: {userRole || 'Unknown'} • ID: {user?.id?.slice(0, 8) || 'N/A'}
        </p>
      </div>
    </div>
  );
};

export default NoAccessPage;
