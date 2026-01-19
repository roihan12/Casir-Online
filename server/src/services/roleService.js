const prisma = require("../config/db");
const { ResponseError } = require("../error/responseError");
const { validate } = require("../validation/validation");
const { CreateRoleValidation, UpdateRoleValidation } = require("../validation/roleValidation");
const { cacheDeletePattern } = require("../utils/redisUtils");

// System roles that cannot be edited or deleted
const SYSTEM_ROLES = ["super_admin"];

const getRole = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: { role: true },
      },
    },
  });

  if (!user) {
    throw new ResponseError(404, "User not found");
  }

  const isSuperAdmin = user.userRoles.some(
    (ur) => ur.role.namaRole === "super_admin"
  );

  if (isSuperAdmin) {
    // Super admin can see all roles with user count
    return prisma.role.findMany({
      include: {
        _count: {
          select: { 
            permissions: true,
            userRoles: true  // Count users per role
          }
        }
      },
      orderBy: { namaRole: 'asc' }
    });
  } else {
    // Other users can only see their roles
    return prisma.role.findMany({
      where: {
        userRoles: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        _count: {
          select: { 
            permissions: true,
            userRoles: true
          }
        }
      },
      orderBy: { namaRole: 'asc' }
    });
  }
};

const getRoleById = async (roleId) => {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: {
      _count: {
        select: { 
          permissions: true,
          userRoles: true
        }
      }
    }
  });

  if (!role) {
    throw new ResponseError(404, "Role not found");
  }

  return role;
};

const createRole = async (roleData, auditInfo = null) => {
  const validData = validate(CreateRoleValidation, roleData);

  // Prevent creating role with system role name
  if (SYSTEM_ROLES.includes(validData.namaRole)) {
    throw new ResponseError(400, `Cannot create role with reserved name: ${validData.namaRole}`);
  }

  const role = await prisma.role.create({
    data: validData,
  });

  // Create audit log if auditInfo provided
  if (auditInfo) {
    await prisma.auditLog.create({
      data: {
        user_id: auditInfo.userId,
        action: "CREATE",
        table_name: "roles",
        record_id: role.id,
        old_values: null,
        new_values: JSON.stringify(role),
        ip_address: auditInfo.ipAddress,
      },
    });
  }

  return role;
};

const updateRole = async (roleId, roleData, auditInfo = null) => {
  const validData = validate(UpdateRoleValidation, roleData);
  const role = await prisma.role.findUnique({ where: { id: roleId } });

  if (!role) {
    throw new ResponseError(404, "Role not found");
  }

  // Protect system roles from being edited
  if (role.is_system || SYSTEM_ROLES.includes(role.namaRole)) {
    throw new ResponseError(403, "System role cannot be modified");
  }

  // Prevent renaming to system role name
  if (validData.namaRole && SYSTEM_ROLES.includes(validData.namaRole)) {
    throw new ResponseError(400, `Cannot rename role to reserved name: ${validData.namaRole}`);
  }

  const oldValues = { ...role };

  const updatedRole = await prisma.role.update({
    where: { id: roleId },
    data: validData,
  });

  // Create audit log if auditInfo provided
  if (auditInfo) {
    await prisma.auditLog.create({
      data: {
        user_id: auditInfo.userId,
        action: "UPDATE",
        table_name: "roles",
        record_id: roleId,
        old_values: JSON.stringify(oldValues),
        new_values: JSON.stringify(updatedRole),
        ip_address: auditInfo.ipAddress,
      },
    });
  }

  // Clear permission caches since role was updated
  await cacheDeletePattern("role_permissions:*");
  await cacheDeletePattern("permissions:*");

  return updatedRole;
};

const deleteRole = async (roleId, auditInfo = null) => {
  const role = await prisma.role.findUnique({ 
    where: { id: roleId },
    include: {
      _count: {
        select: { userRoles: true }
      }
    }
  });

  if (!role) {
    throw new ResponseError(404, "Role not found");
  }

  // Protect system roles from being deleted
  if (role.is_system || SYSTEM_ROLES.includes(role.namaRole)) {
    throw new ResponseError(403, "System role cannot be deleted");
  }

  // Prevent deletion if role has active users
  if (role._count.userRoles > 0) {
    throw new ResponseError(400, `Cannot delete role that is assigned to ${role._count.userRoles} user(s). Please reassign users first.`);
  }

  const deletedRole = await prisma.role.delete({
    where: { id: roleId },
  });

  // Create audit log if auditInfo provided
  if (auditInfo) {
    await prisma.auditLog.create({
      data: {
        user_id: auditInfo.userId,
        action: "DELETE",
        table_name: "roles",
        record_id: roleId,
        old_values: JSON.stringify(role),
        new_values: null,
        ip_address: auditInfo.ipAddress,
      },
    });
  }

  // Clear permission caches
  await cacheDeletePattern("role_permissions:*");
  await cacheDeletePattern("permissions:*");

  return deletedRole;
};

/**
 * Clone a role with its permissions
 */
const cloneRole = async (roleId, newRoleName, auditInfo = null) => {
  const sourceRole = await prisma.role.findUnique({
    where: { id: roleId },
    include: {
      permissions: true
    }
  });

  if (!sourceRole) {
    throw new ResponseError(404, "Source role not found");
  }

  // Validate new role name
  if (!newRoleName || newRoleName.trim() === '') {
    throw new ResponseError(400, "New role name is required");
  }

  if (SYSTEM_ROLES.includes(newRoleName)) {
    throw new ResponseError(400, `Cannot use reserved name: ${newRoleName}`);
  }

  // Check if role with new name already exists
  const existingRole = await prisma.role.findUnique({
    where: { namaRole: newRoleName }
  });

  if (existingRole) {
    throw new ResponseError(400, `Role with name "${newRoleName}" already exists`);
  }

  // Create new role with same permissions in transaction
  const result = await prisma.$transaction(async (tx) => {
    const newRole = await tx.role.create({
      data: {
        namaRole: newRoleName,
        deskripsi: `Cloned from ${sourceRole.namaRole}`,
        displayName: newRoleName,
        status: 'aktif',
        is_system: false
      }
    });

    // Copy permissions
    if (sourceRole.permissions.length > 0) {
      await tx.rolePermission.createMany({
        data: sourceRole.permissions.map(rp => ({
          roleId: newRole.id,
          permissionId: rp.permissionId
        }))
      });
    }

    return newRole;
  });

  // Create audit log if auditInfo provided
  if (auditInfo) {
    await prisma.auditLog.create({
      data: {
        user_id: auditInfo.userId,
        action: "CREATE",
        table_name: "roles",
        record_id: result.id,
        old_values: null,
        new_values: JSON.stringify({ ...result, clonedFrom: sourceRole.namaRole }),
        ip_address: auditInfo.ipAddress,
      },
    });
  }

  return result;
};

module.exports = {
  getRole,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  cloneRole,
  SYSTEM_ROLES,
};
