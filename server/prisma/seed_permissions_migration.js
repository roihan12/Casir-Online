const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const permissionsData = [
	{
		"permission_id" : "perm-dashboard-read",
		"name" : "dashboard.read",
		"description" : "Melihat dashboard",
		"module" : "dashboard",
		"action" : "read",
		"status" : "aktif"
	},
	{
		"permission_id" : "perm-user-create",
		"name" : "user.create",
		"description" : "Membuat user baru",
		"module" : "user",
		"action" : "create",
		"status" : "aktif"
	},
	{
		"permission_id" : "perm-user-read",
		"name" : "user.read",
		"description" : "Melihat data user",
		"module" : "user",
		"action" : "read",
		"status" : "aktif"
	},
	{
		"permission_id" : "perm-user-update",
		"name" : "user.update",
		"description" : "Mengubah data user",
		"module" : "user",
		"action" : "update",
		"status" : "aktif"
	},
	{
		"permission_id" : "perm-user-delete",
		"name" : "user.delete",
		"description" : "Menghapus user",
		"module" : "user",
		"action" : "delete",
		"status" : "aktif"
	},
	{
		"permission_id" : "perm-role-create",
		"name" : "role.create",
		"description" : "Membuat role baru",
		"module" : "role",
		"action" : "create",
		"status" : "aktif"
	}
];

const menuData = [
	{
		"menu_id" : "menu-005",
		"menu_name" : "Manajemen Pelanggan",
		"path" : "/customers",
		"icon" : "Users",
		"parent_id" : null,
		"order_index" : 5,
		"is_active" : true,
		"required_permission" : "pelanggan.read"
	},
	{
		"menu_id" : "menu-006",
		"menu_name" : "Manajemen Supplier",
		"path" : "/suppliers",
		"icon" : "Truck",
		"parent_id" : null,
		"order_index" : 6,
		"is_active" : true,
		"required_permission" : "supplier.read"
	},
	{
		"menu_id" : "menu-007",
		"menu_name" : "Inventori Global",
		"path" : "/inventory",
		"icon" : "Database",
		"parent_id" : null,
		"order_index" : 7,
		"is_active" : true,
		"required_permission" : "inventory.read"
	},
	{
		"menu_id" : "menu-011",
		"menu_name" : "Marketing",
		"path" : "/marketing",
		"icon" : "Megaphone",
		"parent_id" : null,
		"order_index" : 11,
		"is_active" : true,
		"required_permission" : "marketing.read"
	},
	{
		"menu_id" : "menu-012",
		"menu_name" : "WhatsApp",
		"path" : "/whatsapp",
		"icon" : "Smartphone",
		"parent_id" : null,
		"order_index" : 12,
		"is_active" : true,
		"required_permission" : "whatsapp.read"
	},
	{
		"menu_id" : "menu-013",
		"menu_name" : "Pengaturan Sistem",
		"path" : "/settings",
		"icon" : "Settings",
		"parent_id" : null,
		"order_index" : 13,
		"is_active" : true,
		"required_permission" : "settings.read"
	},
	{
		"menu_id" : "menu-003-001",
		"menu_name" : "Daftar User",
		"path" : "/users",
		"icon" : "Users",
		"parent_id" : "menu-003",
		"order_index" : 1,
		"is_active" : true,
		"required_permission" : "user.read"
	},
	{
		"menu_id" : "menu-003-002",
		"menu_name" : "Roles",
		"path" : "/users/roles",
		"icon" : "UserCheck",
		"parent_id" : "menu-003",
		"order_index" : 2,
		"is_active" : true,
		"required_permission" : "role.read"
	},
	{
		"menu_id" : "menu-003-003",
		"menu_name" : "Perizinan",
		"path" : "/users/permissions",
		"icon" : "ShieldCheck",
		"parent_id" : "menu-003",
		"order_index" : 3,
		"is_active" : true,
		"required_permission" : "role.read"
	}
];

// Note: Ensure parent_id 'menu-003' exists or is handled. 
// Based on the data, 'menu-003' is NOT in the input, but children reference it.
// I will attempt to assume menu-003 might need to be created or already exists.
// I'll add a dummy menu-003 if not present to avoid FK errors, or assume it's there.
// Given strict FKs, check if menu-003 is in existing DB? 
// For now, I'll add it to the data list if it's not there, but let's check existing DB state later.
// Actually, I'll just add it to the script to be safe.

const extraParentMenus = [
  {
    "menu_id": "menu-003",
    "menu_name": "User Management", // Guessing name
    "path": null,
    "icon": "Users",
    "parent_id": null,
    "order_index": 3,
    "is_active": true,
    "required_permission": "user.read" // Guessing permission
  }
];

const rolePermissionsData = [
	{
		"role_permission_id" : "d7e692f9-ed42-46e1-b241-5018eab80a0b",
		"role_id" : "5b631c65-5eb7-4158-ad2e-e055621a53c2",
		"permission_id" : "perm-dashboard-read"
	},
	{
		"role_permission_id" : "5dc7769b-7505-4dce-b81d-c87431977c09",
		"role_id" : "5b631c65-5eb7-4158-ad2e-e055621a53c2",
		"permission_id" : "perm-user-create"
	},
	{
		"role_permission_id" : "ad73dbcf-b6eb-4690-9665-f53d9eaded0e",
		"role_id" : "5b631c65-5eb7-4158-ad2e-e055621a53c2",
		"permission_id" : "perm-user-read"
	},
	{
		"role_permission_id" : "22882c5f-3eb7-403f-b082-08db57b034fa",
		"role_id" : "5b631c65-5eb7-4158-ad2e-e055621a53c2",
		"permission_id" : "perm-user-update"
	},
	{
		"role_permission_id" : "7758365a-f306-4e81-bc45-4a4389bb2334",
		"role_id" : "5b631c65-5eb7-4158-ad2e-e055621a53c2",
		"permission_id" : "perm-user-delete"
	},
	{
		"role_permission_id" : "a6ec4659-1919-4e8b-95fc-2e637f7a9435",
		"role_id" : "5b631c65-5eb7-4158-ad2e-e055621a53c2",
		"permission_id" : "perm-role-create"
	},
	{
		"role_permission_id" : "f9d3c19e-eaf6-4b02-93d9-c449bbf652e8",
		"role_id" : "5b631c65-5eb7-4158-ad2e-e055621a53c2",
		"permission_id" : "perm-role-read" // Not in permissionsData above but referenced here. I should add it to permissionsData.
	}
];

// Add missing permissions found in rolePermissionsData or menuData
const additionalPermissions = [
	{
		"permission_id" : "perm-role-read", // Referenced in rolePermissionsData and menuData
		"name" : "role.read",
		"description" : "Melihat data role",
		"module" : "role",
		"action" : "read",
		"status" : "aktif"
	},
    // Menus reference these, but they are not in permissionsData or rolePermissionsData. 
    // I should create them to avoid broken references? 
    // Or just create them as inactive/placeholder?
    // User input permission list only had 6 items.
    // Menus require: pelanggan.read, supplier.read, inventory.read, marketing.read, whatsapp.read, settings.read, role.read
    // 'role.read' is handled above.
    // 'pelanggan.read', etc need to be added.
    { "permission_id": "perm-pelanggan-read", "name": "pelanggan.read", "module": "pelanggan", "action": "read" },
    { "permission_id": "perm-supplier-read", "name": "supplier.read", "module": "supplier", "action": "read" },
    { "permission_id": "perm-inventory-read", "name": "inventory.read", "module": "inventory", "action": "read" },
    { "permission_id": "perm-marketing-read", "name": "marketing.read", "module": "marketing", "action": "read" },
    { "permission_id": "perm-whatsapp-read", "name": "whatsapp.read", "module": "whatsapp", "action": "read" },
    { "permission_id": "perm-settings-read", "name": "settings.read", "module": "settings", "action": "read" }
];

async function main() {
  console.log('Starting migration...');

  // 1. Seed Permissions
  console.log('Seeding Permissions...');
  const allPermissions = [...permissionsData, ...additionalPermissions];
  
  for (const perm of allPermissions) {
    await prisma.permission.upsert({
        where: { id: perm.permission_id },
        update: {
            name: perm.name,
            description: perm.description,
            module: perm.module,
            action: perm.action,
            status: perm.status || 'aktif'
        },
        create: {
            id: perm.permission_id,
            name: perm.name,
            description: perm.description,
            module: perm.module,
            action: perm.action,
            status: perm.status || 'aktif'
        }
    });
  }
  console.log(` प्रोसेessed ${allPermissions.length} permissions.`);

  // 2. Seed Menus
  console.log('Seeding Menus...');
  // Ensure "menu-003" exists first because of FK
  await prisma.menu.upsert({
      where: { id: 'menu-003' },
      update: {},
      create: {
          id: 'menu-003',
          name: 'User Management',
          icon: 'Users',
          orderIndex: 3
      }
  });

  for (const menu of menuData) {
      // Fix json escape in path if present (e.g. \/customers -> /customers)
      const cleanPath = menu.path ? menu.path.replace(/\\/g, '') : null;
      
      await prisma.menu.upsert({
          where: { id: menu.menu_id },
          update: {
              name: menu.menu_name,
              path: cleanPath,
              icon: menu.icon,
              parentId: menu.parent_id,
              orderIndex: menu.order_index,
              isActive: menu.is_active,
              requiredPermission: menu.required_permission
          },
          create: {
              id: menu.menu_id,
              name: menu.menu_name,
              path: cleanPath,
              icon: menu.icon,
              parentId: menu.parent_id,
              orderIndex: menu.order_index,
              isActive: menu.is_active,
              requiredPermission: menu.required_permission
          }
      });
  }
  console.log(`Processed ${menuData.length} menus.`);

  // 3. Seed Role Permissions
  console.log('Seeding Role Permissions...');
  for (const rp of rolePermissionsData) {
      await prisma.rolePermission.upsert({
          where: { id: rp.role_permission_id },
          update: {
              roleId: rp.role_id,
              permissionId: rp.permission_id
          },
          create: {
              id: rp.role_permission_id,
              roleId: rp.role_id,
              permissionId: rp.permission_id
          }
      });
  }
  console.log(`Processed ${rolePermissionsData.length} role permissions.`);

  console.log('Migration completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
