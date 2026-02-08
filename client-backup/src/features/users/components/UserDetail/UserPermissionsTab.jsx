import React from "react";
import { Shield, Check, X } from "lucide-react";

/**
 * Component to display user permissions based on their role and assignments.
 * Expects `user` object to contain `userRoles` which includes `role` and `rolePermissions`.
 */
const UserPermissionsTab = ({ user }) => {
  // Check if user is super_admin
  const isSuperAdmin = user?.userRoles?.some(ur => ur.role?.namaRole === 'super_admin');

  const getPermissions = () => {
    if (!user.userRoles || user.userRoles.length === 0) return [];

    const allPermissions = [];
    user.userRoles.forEach((userRole) => {
      // Access permissions via the correct relation name 'permissions'
      if (userRole.role && userRole.role.permissions) {
        userRole.role.permissions.forEach((rp) => {
          if (rp.permission) {
            allPermissions.push({
              ...rp.permission,
              roleName: userRole.role.namaRole, // Changed from role.name to role.namaRole based on schema
              cabangName: userRole.cabang ? userRole.cabang.namaCabang : "Semua Cabang",
            });
          }
        });
      }
    });

    return allPermissions;
  };

  const permissions = getPermissions();

  // Group permissions by resource/module for better display
  const groupedPermissions = permissions.reduce((acc, perm) => {
    // Assuming permission name format like "resource:action"
    const [resource, action] = perm.name.split(":");
    if (!acc[resource]) {
      acc[resource] = [];
    }
    acc[resource].push({ ...perm, action });
    return acc;
  }, {});

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Shield className="h-6 w-6 text-indigo-600 mr-3" />
        <div>
          <h3 className="text-lg font-bold text-gray-900">Hak Akses User</h3>
          <p className="text-sm text-gray-500">
            Daftar izin yang dimiliki user berdasarkan role yang ditugaskan.
          </p>
        </div>
      </div>

      {isSuperAdmin ? (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-8 text-white shadow-lg mb-6">
          <div className="flex items-center mb-4">
            <div className="bg-white/20 p-3 rounded-full mr-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Akses Super Admin</h3>
              <p className="text-indigo-100">User ini memiliki akses penuh ke seluruh sistem tanpa batasan.</p>
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/20">
            <p className="text-sm">
              Role <strong>Super Admin</strong> secara otomatis memberikan izin untuk semua modul dan tindakan di semua cabang. Tidak ada daftar izin spesifik yang perlu ditampilkan.
            </p>
          </div>
        </div>
      ) : permissions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(groupedPermissions).map(([resource, perms]) => (
            <div
              key={resource}
              className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                <span className="font-semibold text-gray-700 capitalize">
                  {resource.replace(/_/g, " ")}
                </span>
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                  {perms.length} izin
                </span>
              </div>
              <div className="p-4 space-y-3">
                {perms.map((perm, idx) => (
                  <div key={idx} className="flex items-start">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {perm.action}
                      </p>
                      <p className="text-xs text-gray-500">
                        {perm.description || perm.name}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        via {perm.roleName} @ {perm.cabangName}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <Shield className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            User tidak memiliki izin khusus atau data permission belum dimuat.
          </p>
        </div>
      )}

      {!isSuperAdmin && (
        <div className="mt-8 bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start">
          <div className="bg-blue-100 p-2 rounded-full mr-3 flex-shrink-0">
            <Shield className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-blue-800">
              Informasi Keamanan
            </h4>
            <p className="text-sm text-blue-700 mt-1">
              Hak akses diatur melalui Role Management. Untuk mengubah izin user ini,
              silakan edit role yang bersangkutan atau tetapkan role lain pada user.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPermissionsTab;
