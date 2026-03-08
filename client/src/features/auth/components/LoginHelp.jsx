import React from 'react';
import { FaUserShield, FaUserTie, FaUserCircle } from 'react-icons/fa';

const LoginHelp = () => {
  return (
    <div className="mt-8 pt-6 border-t border-gray-100">
      <p className="text-sm font-medium text-gray-500 mb-4 text-center lg:text-left">Detail akun demo:</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        
        {/* Super Admin */}
        <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl flex items-center gap-3 transition-colors hover:bg-indigo-100">
          <div className="bg-indigo-200 text-indigo-700 p-2 rounded-lg">
             <FaUserShield className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-indigo-900">Super Admin</p>
            <p className="text-xs text-indigo-700/80 font-mono mt-0.5">superadmin</p>
          </div>
        </div>

        {/* Admin Cabang */}
        <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl flex items-center gap-3 transition-colors hover:bg-blue-100">
          <div className="bg-blue-200 text-blue-700 p-2 rounded-lg">
             <FaUserTie className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-blue-900">Admin Cabang</p>
            <p className="text-xs text-blue-700/80 font-mono mt-0.5">admincabang</p>
          </div>
        </div>

        {/* Kasir */}
        <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-center gap-3 transition-colors hover:bg-emerald-100">
          <div className="bg-emerald-200 text-emerald-700 p-2 rounded-lg">
             <FaUserCircle className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-900">Kasir</p>
            <p className="text-xs text-emerald-700/80 font-mono mt-0.5">kasir</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginHelp;
