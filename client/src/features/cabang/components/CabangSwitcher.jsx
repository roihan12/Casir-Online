import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  MapPin,
  Building,
  LogOut,
  User,
  Settings,
  Globe,
} from "lucide-react";
import { useCabang, GLOBAL_CABANG_ID } from "../context/CabangContext";
import { useAuth } from "../../auth/hooks/useAuth";
import { Link } from "react-router-dom";

const CabangSwitcher = () => {
  const { selectedCabang, cabangList, isGlobalView, switchCabang, canSwitchCabang } = useCabang();
  const { user, getUserRole, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Get user initials
  const getUserInitials = () => {
    if (!user?.namaLengkap) return "U";
    const nameParts = user.namaLengkap.split(" ");
    if (nameParts.length > 1) {
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    }
    return nameParts[0].substring(0, 2).toUpperCase();
  };

  // Get role display name
  const getRoleDisplayName = () => {
    const role = getUserRole();
    const roleNames = {
      super_admin: "Super Admin",
      admin_cabang: "Admin Cabang",
      kasir: "Kasir",
      gudang: "Gudang",
      manajer: "Manajer",
    };
    return roleNames[role] || role;
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectCabang = (cabang, e) => {
    e.stopPropagation();
    switchCabang(cabang.id);
    setShowDropdown(false);
  };

  const handleLogout = (e) => {
    e.preventDefault();
    e.stopPropagation();
    logout();
  };

  return (
    <div className="flex items-center relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <div
        className="flex items-center cursor-pointer bg-gray-100 hover:bg-gray-200 py-1 px-2 rounded-lg transition-colors"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center mr-2">
          <span className="text-purple-500 font-medium">{getUserInitials()}</span>
        </div>

        <div className="flex flex-col mr-1">
          <span className="text-sm font-medium">{user?.namaLengkap}</span>
          {selectedCabang && (
            <div className="flex items-center text-xs text-gray-500">
              {isGlobalView ? (
                <>
                  <Globe size={12} className="mr-1" />
                  <span>Semua Cabang</span>
                </>
              ) : (
                <>
                  <MapPin size={12} className="mr-1" />
                  <span>{selectedCabang.namaCabang || "Pilih Cabang"}</span>
                </>
              )}
            </div>
          )}
        </div>

        <ChevronDown size={18} className="ml-1 text-gray-500" />
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 top-14 bg-white shadow-lg rounded-lg z-10 w-64 py-2 border">
          {/* User Info */}
          <div className="px-4 py-3 border-b">
            <div className="flex items-start">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <span className="text-purple-500 font-medium">{getUserInitials()}</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{user?.namaLengkap}</p>
                <p className="text-xs text-gray-500">{getRoleDisplayName()}</p>
              </div>
            </div>
          </div>

          {/* Cabang Switcher */}
          {canSwitchCabang && cabangList?.length > 0 && (
            <>
              <div className="px-4 py-2 border-b">
                <p className="text-sm font-medium">Pilih Cabang</p>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {cabangList.map((cabang) => (
                  <div
                    key={cabang.id}
                    className={`px-4 py-2 flex items-center hover:bg-gray-50 cursor-pointer ${
                      selectedCabang?.id === cabang.id ? "bg-indigo-50 text-indigo-600" : ""
                    }`}
                    onClick={(e) => handleSelectCabang(cabang, e)}
                  >
                    {cabang.id === GLOBAL_CABANG_ID ? (
                      <Globe
                        size={16}
                        className={selectedCabang?.id === cabang.id ? "text-blue-500" : "text-gray-400"}
                      />
                    ) : (
                      <Building
                        size={16}
                        className={selectedCabang?.id === cabang.id ? "text-indigo-500" : "text-gray-400"}
                      />
                    )}
                    <span className="ml-3 text-sm">{cabang.namaCabang}</span>
                    {selectedCabang?.id === cabang.id && (
                      <div
                        className={`ml-auto ${
                          cabang.id === GLOBAL_CABANG_ID
                            ? "bg-blue-100 text-blue-600"
                            : "bg-indigo-100 text-indigo-600"
                        } text-xs px-2 py-0.5 rounded`}
                      >
                        Aktif
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* User Actions */}
          <div className="border-t">
            <Link
              to="/profile"
              className="px-4 py-2 flex items-center text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              <User size={16} className="text-gray-400 mr-3" />
              <span>Profil Saya</span>
            </Link>

            <Link
              to="/settings/account"
              className="px-4 py-2 flex items-center text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              <Settings size={16} className="text-gray-400 mr-3" />
              <span>Pengaturan</span>
            </Link>

            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 flex items-center text-sm text-red-600 hover:bg-gray-50 cursor-pointer border-t"
            >
              <LogOut size={16} className="text-red-500 mr-3" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CabangSwitcher;
