// rolesService.js - Service untuk mengelola operasi terkait roles dan permissions

// Mock data untuk demo (akan digantikan dengan API calls pada implementasi sebenarnya)
const MOCK_ROLES = [
  {
    id: 1,
    type: "super_admin",
    name: "Super Admin",
    description: "Administrator dengan akses penuh ke seluruh sistem",
    permissions: {
      dashboard: ["view"],
      cabang: ["view", "create", "edit", "delete", "manage"],
      user: ["view", "create", "edit", "delete", "manage"],
      product: ["view", "create", "edit", "delete", "import", "export"],
      inventory: ["view", "create", "edit", "delete", "approve", "reject"],
      transaction: ["view", "create", "edit", "delete", "approve", "reject"],
      report: ["view", "export"],
      settings: ["view", "edit", "manage"],
    },
  },
  {
    id: 2,
    type: "admin_cabang",
    name: "Admin Cabang",
    description: "Administrator cabang dengan akses ke fitur cabang tertentu",
    permissions: {
      dashboard: ["view"],
      user: ["view", "create", "edit"],
      product: ["view", "create", "edit"],
      inventory: ["view", "create", "edit", "approve", "reject"],
      transaction: ["view", "create", "edit", "approve", "reject"],
      report: ["view", "export"],
      settings: ["view", "edit"],
    },
  },
  {
    id: 3,
    type: "kasir",
    name: "Kasir",
    description: "Kasir dengan akses terbatas untuk transaksi",
    permissions: {
      dashboard: ["view"],
      product: ["view"],
      inventory: ["view"],
      transaction: ["view", "create", "edit"],
      report: ["view"],
    },
  },
];

class RolesService {
  // Get all roles
  async getRoles() {
    // Simulasi API delay
    await this._delay(800);
    return [...MOCK_ROLES];
  }

  // Get role by ID
  async getRoleById(id) {
    // Simulasi API delay
    await this._delay(500);

    const role = MOCK_ROLES.find((role) => role.id === parseInt(id));

    if (!role) {
      throw new Error("Role not found");
    }

    return { ...role };
  }

  // Get role by type
  async getRoleByType(type) {
    // Simulasi API delay
    await this._delay(500);

    const role = MOCK_ROLES.find((role) => role.type === type);

    if (!role) {
      throw new Error("Role not found");
    }

    return { ...role };
  }

  // Update role permissions
  async updateRolePermissions(id, permissions) {
    // Simulasi API delay
    await this._delay(1000);

    const roleIndex = MOCK_ROLES.findIndex((role) => role.id === parseInt(id));

    if (roleIndex === -1) {
      throw new Error("Role not found");
    }

    // Update permissions
    MOCK_ROLES[roleIndex].permissions = permissions;

    return { ...MOCK_ROLES[roleIndex] };
  }

  // Helper method untuk simulasi delay
  _delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default new RolesService();
