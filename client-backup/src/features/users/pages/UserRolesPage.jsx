import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Lock,
  User,
  Edit,
  Save,
  RefreshCw,
} from "lucide-react";
import rolesService from "../../../services/rolesService";

const UserRoles = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRole, setExpandedRole] = useState(null);
  const [editMode, setEditMode] = useState(null);
  const [editedPermissions, setEditedPermissions] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Load roles & permissions from API
  useEffect(() => {
    const loadRoles = async () => {
      try {
        setIsLoading(true);
        const data = await rolesService.getRoles();
        setRoles(data);
      } catch (error) {
        console.error("Error loading roles:", error);
        // Show error message
      } finally {
        setIsLoading(false);
      }
    };

    loadRoles();
  }, []);

  // Toggle role expansion
  const toggleRole = (roleId) => {
    setExpandedRole(expandedRole === roleId ? null : roleId);
  };

  // Start editing role
  const startEditing = (role) => {
    setEditMode(role.id);
    setEditedPermissions({ ...role.permissions });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditMode(null);
    setEditedPermissions({});
  };

  // Toggle permission
  const togglePermission = (moduleId, permissionId) => {
    setEditedPermissions((prev) => {
      const updatedPermissions = { ...prev };

      if (!updatedPermissions[moduleId]) {
        updatedPermissions[moduleId] = [];
      }

      const permIndex = updatedPermissions[moduleId].indexOf(permissionId);

      if (permIndex === -1) {
        updatedPermissions[moduleId] = [
          ...updatedPermissions[moduleId],
          permissionId,
        ];
      } else {
        updatedPermissions[moduleId] = updatedPermissions[moduleId].filter(
          (p) => p !== permissionId
        );
      }

      return updatedPermissions;
    });
  };

  // Save role permissions
  const saveRolePermissions = async (roleId) => {
    setIsSaving(true);

    try {
      await rolesService.updateRolePermissions(roleId, editedPermissions);

      // Update the local state
      setRoles((prevRoles) =>
        prevRoles.map((role) =>
          role.id === roleId
            ? { ...role, permissions: { ...editedPermissions } }
            : role
        )
      );

      setEditMode(null);
      setEditedPermissions({});
    } catch (error) {
      console.error("Error saving role permissions:", error);
      // Show error message
    } finally {
      setIsSaving(false);
    }
  };

  // Get module list from all permissions
  const getModules = () => {
    const modules = new Set();

    roles.forEach((role) => {
      if (role.permissions) {
        Object.keys(role.permissions).forEach((module) => {
          modules.add(module);
        });
      }
    });

    return Array.from(modules).sort();
  };

  // Format role name
  const formatRoleName = (roleKey) => {
    const roleMap = {
      super_admin: "Super Admin",
      admin_cabang: "Admin Cabang",
      kasir: "Kasir",
    };
    return roleMap[roleKey] || roleKey;
  };

  // Format module name
  const formatModuleName = (moduleKey) => {
    const moduleMap = {
      dashboard: "Dashboard",
      cabang: "Manajemen Cabang",
      user: "Manajemen User",
      product: "Manajemen Produk",
      inventory: "Inventori",
      transaction: "Transaksi",
      report: "Laporan",
      settings: "Pengaturan",
    };
    return moduleMap[moduleKey] || moduleKey;
  };

  // Format permission name
  const formatPermissionName = (permissionKey) => {
    const permissionMap = {
      view: "Lihat",
      create: "Tambah",
      edit: "Edit",
      delete: "Hapus",
      manage: "Kelola",
      export: "Ekspor",
      import: "Impor",
      approve: "Setujui",
      reject: "Tolak",
    };
    return permissionMap[permissionKey] || permissionKey;
  };

  // Check if a permission is granted
  const hasPermission = (role, moduleId, permissionId) => {
    if (editMode === role.id) {
      return (
        editedPermissions[moduleId] &&
        editedPermissions[moduleId].includes(permissionId)
      );
    }

    return (
      role.permissions &&
      role.permissions[moduleId] &&
      role.permissions[moduleId].includes(permissionId)
    );
  };

  // Generate all available permissions per module
  const getAvailablePermissions = (moduleId) => {
    // Common permissions for all modules
    const commonPermissions = ["view", "create", "edit", "delete"];

    // Special permissions for specific modules
    const specialPermissions = {
      report: ["export"],
      product: ["import", "export"],
      inventory: ["approve", "reject"],
      transaction: ["approve", "reject"],
    };

    return specialPermissions[moduleId]
      ? [...commonPermissions, ...specialPermissions[moduleId]]
      : commonPermissions;
  };

  return (
    <div className="px-6 py-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Roles & Perizinan
          </h1>
          <p className="text-gray-500 mt-1">
            Kelola peran dan hak akses pengguna
          </p>
        </div>
        <button
          onClick={() => navigate("/superadmin/users")}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          <User className="h-5 w-5 inline-block mr-2" />
          Manajemen User
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Daftar Role</h2>
            <p className="text-sm text-gray-500">
              {roles.length} role tersedia
            </p>
          </div>

          <div className="divide-y">
            {roles.map((role) => (
              <div key={role.id} className="p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div
                      className={`p-2 rounded-full ${
                        role.type === "super_admin"
                          ? "bg-purple-100"
                          : role.type === "admin_cabang"
                          ? "bg-blue-100"
                          : "bg-green-100"
                      }`}
                    >
                      <Shield
                        className={`h-5 w-5 ${
                          role.type === "super_admin"
                            ? "text-purple-600"
                            : role.type === "admin_cabang"
                            ? "text-blue-600"
                            : "text-green-600"
                        }`}
                      />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {formatRoleName(role.type)}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {role.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {editMode === role.id ? (
                      <>
                        <button
                          onClick={cancelEditing}
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                          disabled={isSaving}
                        >
                          <X className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => saveRolePermissions(role.id)}
                          className="p-2 text-green-500 hover:text-green-700 hover:bg-green-100 rounded"
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <RefreshCw className="h-5 w-5 animate-spin" />
                          ) : (
                            <Save className="h-5 w-5" />
                          )}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => startEditing(role)}
                        className="p-2 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-100 rounded"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                    )}
                    <button
                      onClick={() => toggleRole(role.id)}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                    >
                      {expandedRole === role.id ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {expandedRole === role.id && (
                  <div className="mt-4 border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Modul
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Perizinan
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getModules().map((moduleId) => (
                          <tr key={moduleId}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {formatModuleName(moduleId)}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-2">
                                {getAvailablePermissions(moduleId).map(
                                  (permissionId) => (
                                    <div
                                      key={`${moduleId}-${permissionId}`}
                                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        editMode === role.id
                                          ? "cursor-pointer"
                                          : ""
                                      } ${
                                        hasPermission(
                                          role,
                                          moduleId,
                                          permissionId
                                        )
                                          ? "bg-green-100 text-green-800 border border-green-200"
                                          : "bg-gray-100 text-gray-500 border border-gray-200"
                                      }`}
                                      onClick={
                                        editMode === role.id
                                          ? () =>
                                              togglePermission(
                                                moduleId,
                                                permissionId
                                              )
                                          : undefined
                                      }
                                    >
                                      {hasPermission(
                                        role,
                                        moduleId,
                                        permissionId
                                      ) ? (
                                        <Check className="h-3 w-3 inline-block mr-1" />
                                      ) : (
                                        <X className="h-3 w-3 inline-block mr-1" />
                                      )}
                                      {formatPermissionName(permissionId)}
                                    </div>
                                  )
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="p-4 bg-gray-50 border-t">
            <div className="text-sm text-gray-600">
              <p className="mb-2">
                <Lock className="h-4 w-4 inline-block mr-1 text-gray-500" />
                <span className="font-medium">Catatan tentang Perizinan:</span>
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1 text-gray-500">
                <li>Super Admin memiliki semua hak akses ke seluruh fitur</li>
                <li>
                  Admin Cabang hanya memiliki akses ke cabang yang ditugaskan
                </li>
                <li>Kasir hanya memiliki akses ke POS dan transaksi harian</li>
                <li>
                  Perubahan perizinan akan langsung diterapkan ke semua pengguna
                  dengan role terkait
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Default Role Info Panel */}
      <div className="bg-white rounded-lg shadow-sm mt-6 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Deskripsi Role Default
        </h2>

        <div className="space-y-6">
          {/* Super Admin */}
          <div className="flex">
            <div className="p-3 bg-purple-100 rounded-full h-12 w-12 flex items-center justify-center flex-shrink-0">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-md font-medium text-gray-900">Super Admin</h3>
              <p className="text-sm text-gray-500 mt-1">
                Role tertinggi dengan akses penuh ke seluruh sistem. Dapat
                mengelola cabang, user, produk, laporan, dan semua pengaturan
                sistem. Tidak dibatasi oleh cabang tertentu dan dapat mengakses
                data dari semua cabang.
              </p>
            </div>
          </div>

          {/* Admin Cabang */}
          <div className="flex">
            <div className="p-3 bg-blue-100 rounded-full h-12 w-12 flex items-center justify-center flex-shrink-0">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-md font-medium text-gray-900">
                Admin Cabang
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Mengelola operasional cabang tertentu. Memiliki akses untuk
                mengelola staf, inventori, dan transaksi di cabang yang
                ditugaskan. Dapat melihat laporan cabang dan mengelola
                pengaturan cabang tertentu.
              </p>
            </div>
          </div>

          {/* Kasir */}
          <div className="flex">
            <div className="p-3 bg-green-100 rounded-full h-12 w-12 flex items-center justify-center flex-shrink-0">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-md font-medium text-gray-900">Kasir</h3>
              <p className="text-sm text-gray-500 mt-1">
                Menangani transaksi penjualan harian di POS. Memiliki akses
                terbatas ke sistem, fokus pada transaksi dan pelanggan. Dapat
                mengelola shift, melihat inventori, dan memproses pengembalian
                produk dengan otorisasi.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserRoles;
