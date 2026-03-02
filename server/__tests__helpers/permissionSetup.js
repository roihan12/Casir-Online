import { getPrisma } from './testSetup';

/**
 * Create a test role with all permissions for a specific module
 * @param {string} module - The module name (e.g., 'kategori', 'supplier')
 * @param {import('@prisma/client').PrismaClient} prismaOverride - Optional prisma client
 * @returns {Promise<Role>} The created role with permissions
 */
export const createRoleWithPermissions = async (module, prismaOverride = null) => {
  const prisma = prismaOverride || getPrisma();

  // 1. Create role
  const role = await prisma.role.create({
    data: {
      namaRole: `TEST_${module.toUpperCase()}_ADMIN_${Date.now()}`,
      deskripsi: `Test role with ${module} permissions`,
      displayName: `${module.charAt(0).toUpperCase() + module.slice(1)} Admin`,
      status: 'aktif',
    },
  });

  // 2. Get all permissions for this module
  const permissions = await prisma.permission.findMany({
    where: {
      module: module,
      status: 'aktif',
    },
  });

  // 3. If no permissions exist for this module, create them
  if (permissions.length === 0) {
    const actions = ['create', 'read', 'update', 'delete', 'manage'];

    for (const action of actions) {
      const permission = await prisma.permission.create({
        data: {
          name: `${module}:${action}`,
          description: `Permission to ${action} ${module}`,
          module: module,
          action: action,
          status: 'aktif',
        },
      });
      permissions.push(permission);
    }
  }

  // 4. Link permissions to role
  for (const permission of permissions) {
    await prisma.rolePermission.create({
      data: {
        roleId: role.id,
        permissionId: permission.id,
      },
    });
  }

  return role;
};

/**
 * Create a test user with all permissions for a specific module
 * @param {string} module - The module name (e.g., 'kategori', 'supplier')
 * @param {Object} userOverrides - Override user data
 * @param {import('@prisma/client').PrismaClient} prismaOverride - Optional prisma client
 * @returns {Promise<{user: User, role: Role, cabang: Cabang, plainPassword: string}>}
 */
export const createUserWithModulePermissions = async (
  module,
  userOverrides = {},
  prismaOverride = null
) => {
  const prisma = prismaOverride || getPrisma();

  // 1. Create Cabang
  const cabang = await prisma.cabang.create({
    data: {
      id: `cabang-${Date.now()}`,
      namaCabang: 'Test Cabang',
      alamat: 'Jl. Test No. 123',
      telepon: '08123456789',
      status: 'aktif',
    },
  });

  // 2. Create role with module permissions
  const role = await createRoleWithPermissions(module, prisma);

  // 3. Create user
  const plainPassword = 'password123';
  const bcrypt = await import('bcrypt');
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const user = await prisma.user.create({
    data: {
      namaLengkap: 'Test User',
      username: `testuser_${module}_${Date.now()}`,
      email: `testuser_${module}_${Date.now()}@example.com`,
      password: hashedPassword,
      status: 'aktif',
    },
  });

  // 4. Link user to role and cabang
  await prisma.userRole.create({
    data: {
      userId: user.id,
      roleId: role.id,
      cabangId: cabang.id,
    },
  });

  return { user, role, cabang, plainPassword };
};
