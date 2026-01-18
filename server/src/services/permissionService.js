const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { ResponseError } = require("../error/responseError");
const { validate } = require("../validation/validation");
const {
  CreatePermissionValidation,
  UpdatePermissionValidation,
  AssignPermissionValidation,
  BulkAssignPermissionsValidation,
  BulkCreatePermissionsValidation,
} = require("../validation/permissionValidation");
const {
  cacheGet,
  cacheSet,
  cacheDelete,
  createCacheKey,
  cacheOrFetch,
  cacheDeletePattern,
} = require("../utils/redisUtils");

class PermissionService {
  /**
   * Create a new permission
   */
  async createPermission(permissionData, auditInfo) {
    const validData = validate(CreatePermissionValidation, permissionData);

    // Check if permission with the same name already exists
    const existingPermission = await prisma.permission.findFirst({
      where: {
        name: validData.name,
      },
    });

    if (existingPermission) {
      throw new ResponseError(400, `Permission with name ${validData.name} already exists`);
    }

    const newPermission = await prisma.permission.create({
      data: {
        name: validData.name,
        description: validData.description,
        module: validData.module,
        action: validData.action,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: auditInfo.userId,
        action: "CREATE",
        resource: "Permission",
        resourceId: newPermission.id,
        oldValues: null,
        newValues: JSON.stringify(newPermission),
        ipAddress: auditInfo.ipAddress,
      },
    });

    // Clear all permission caches
    await cacheDeletePattern("permissions:*");

    return newPermission;
  }

  /**
   * Bulk create multiple permissions at once
   */
  async bulkCreatePermissions(permissionsData, auditInfo) {
    const validData = validate(BulkCreatePermissionsValidation, permissionsData);
    const { permissions } = validData;

    // Check for duplicate names within the batch
    const permissionNames = permissions.map(p => p.name);
    const uniqueNames = new Set(permissionNames);
    if (uniqueNames.size !== permissionNames.length) {
      throw new ResponseError(400, "Duplicate permission names found in the request");
    }

    // Check for existing permissions with the same names
    const existingPermissions = await prisma.permission.findMany({
      where: {
        name: { in: permissionNames },
      },
    });

    if (existingPermissions.length > 0) {
      const existingNames = existingPermissions.map(p => p.name).join(", ");
      throw new ResponseError(400, `Permissions already exist with names: ${existingNames}`);
    }

    // Create all permissions in a transaction
    const result = await prisma.$transaction(async (prisma) => {
      const createdPermissions = [];

      for (const permissionData of permissions) {
        // Validate each permission individually
        const validPermission = validate(CreatePermissionValidation, permissionData);

        const newPermission = await prisma.permission.create({
          data: {
            name: validPermission.name,
            description: validPermission.description,
            module: validPermission.module,
            action: validPermission.action,
          },
        });

        createdPermissions.push(newPermission);

        // Create audit log for each permission
        await prisma.auditLog.create({
          data: {
            userId: auditInfo.userId,
            action: "CREATE",
            resource: "Permission",
            resourceId: newPermission.id,
            oldValues: null,
            newValues: JSON.stringify(newPermission),
            ipAddress: auditInfo.ipAddress,
          },
        });
      }

      return createdPermissions;
    });

    // Clear all permission caches
    await cacheDeletePattern("role_permissions:*");
    await cacheDeletePattern("permissions:*");

    return {
      message: "Permissions created successfully",
      count: result.length,
      permissions: result,
    };
  }

  /**
   * Update an existing permission
   */
  async updatePermission(permissionId, permissionData, auditInfo) {
    const validData = validate(UpdatePermissionValidation, permissionData);

    // Check if permission exists
    const existingPermission = await prisma.permission.findUnique({
      where: { id: permissionId },
    });

    if (!existingPermission) {
      throw new ResponseError(404, "Permission not found");
    }

    // If name is being updated, check for duplicates
    if (validData.name && validData.name !== existingPermission.name) {
      const duplicatePermission = await prisma.permission.findFirst({
        where: {
          name: validData.name,
          id: { not: permissionId },
        },
      });

      if (duplicatePermission) {
        throw new ResponseError(400, `Permission with name ${validData.name} already exists`);
      }
    }

    const oldValues = { ...existingPermission };

    const updatedPermission = await prisma.permission.update({
      where: { id: permissionId },
      data: validData,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: auditInfo.userId,
        action: "UPDATE",
        resource: "Permission",
        resourceId: permissionId,
        oldValues: JSON.stringify(oldValues),
        newValues: JSON.stringify(updatedPermission),
        ipAddress: auditInfo.ipAddress,
      },
    });

    // Clear all permission caches
    await cacheDeletePattern("role_permissions:*");
    await cacheDeletePattern("permissions:*");

    return updatedPermission;
  }

  /**
   * Delete a permission
   */
  async deletePermission(permissionId, auditInfo) {
    // Check if permission exists
    const existingPermission = await prisma.permission.findUnique({
      where: { id: permissionId },
    });

    if (!existingPermission) {
      throw new ResponseError(404, "Permission not found");
    }

    // Check if permission is assigned to any roles
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { permissionId },
    });

    if (rolePermissions.length > 0) {
      throw new ResponseError(400, "Cannot delete permission that is assigned to roles");
    }

    const deletedPermission = await prisma.permission.delete({
      where: { id: permissionId },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: auditInfo.userId,
        action: "DELETE",
        resource: "Permission",
        resourceId: permissionId,
        oldValues: JSON.stringify(existingPermission),
        newValues: null,
        ipAddress: auditInfo.ipAddress,
      },
    });

    // Clear all permission caches
    await cacheDeletePattern("role_permissions:*");
    await cacheDeletePattern("permissions:*");

    return deletedPermission;
  }

  /**
   * Get all permissions
   */
  async getAllPermissions() {
    return prisma.permission.findMany({
      orderBy: [
        { module: 'asc' },
        { name: 'asc' }
      ],
    });
  }

  /**
   * Get permissions by module
   */
  async getPermissionsByModule(module) {
    return prisma.permission.findMany({
      where: { module },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get permissions for a specific role
   */
  async getRolePermissions(roleId) {
    const roleWithPermissions = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!roleWithPermissions) {
      throw new ResponseError(404, "Role not found");
    }

  

    return roleWithPermissions.permissions.map(rp => rp.permission);
  }

  /**
   * Get permissions for a user based on their roles
   */
  async getUserPermissions(userId, cabangId) {
    const cacheKey = createCacheKey("permissions", userId, cabangId);

    return await cacheOrFetch(
      cacheKey,
      async () => {
        // Get user roles for the specified cabang
        const userRoles = await prisma.userRole.findMany({
          where: {
            userId: userId,
            cabangId: cabangId,
          },
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        });

        // Extract unique permissions from all roles
        const permissionMap = new Map();
        userRoles.forEach(userRole => {
          userRole.role.rolePermissions.forEach(rolePermission => {
            if (!permissionMap.has(rolePermission.permission.id)) {
              permissionMap.set(rolePermission.permission.id, rolePermission.permission);
            }
          });
        });

        return Array.from(permissionMap.values());
      },
      300 // Cache for 5 minutes
    );
  }

  /**
   * Check if a user has a specific permission
   */
  async hasPermission(userId, cabangId, permissionName) {
    const permissions = await this.getUserPermissions(userId, cabangId);
    return permissions.some(permission => permission.name === permissionName);
  }

  /**
   * Assign a permission to a role
   */
  async assignPermissionToRole(roleId, permissionId, auditInfo) {
    const validData = validate(AssignPermissionValidation, { roleId, permissionId });

    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: validData.roleId },
    });

    if (!role) {
      throw new ResponseError(404, "Role not found");
    }

    // Check if permission exists
    const permission = await prisma.permission.findUnique({
      where: { id: validData.permissionId },
    });

    if (!permission) {
      throw new ResponseError(404, "Permission not found");
    }

    // Check if the role already has this permission
    const existingRolePermission = await prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId: validData.roleId,
          permissionId: validData.permissionId,
        },
      },
    });

    if (existingRolePermission) {
      throw new ResponseError(400, "Permission is already assigned to this role");
    }

    // Assign permission to role
    const rolePermission = await prisma.rolePermission.create({
      data: {
        roleId: validData.roleId,
        permissionId: validData.permissionId,
      },
      include: {
        permission: true,
        role: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: auditInfo.userId,
        action: "CREATE",
        resource: "RolePermission",
        resourceId: rolePermission.id,
        oldValues: null,
        newValues: JSON.stringify({
          roleId: validData.roleId,
          permissionId: validData.permissionId,
          roleName: role.namaRole,
          permissionName: permission.name,
        }),
        ipAddress: auditInfo.ipAddress,
      },
    });

    // Clear all permission caches
    await cacheDeletePattern("role_permissions:*");
    await cacheDeletePattern("permissions:*");

    return rolePermission;
  }

  /**
   * Remove a permission from a role
   */
  async removePermissionFromRole(rolePermissionId, auditInfo) {
    // Check if role permission exists
    const rolePermission = await prisma.rolePermission.findUnique({
      where: { id: rolePermissionId },
      include: {
        permission: true,
        role: true,
      },
    });

    if (!rolePermission) {
      throw new ResponseError(404, "Role permission not found");
    }

    // Store data for audit log
    const rolePermissionData = {
      id: rolePermission.id,
      roleId: rolePermission.roleId,
      permissionId: rolePermission.permissionId,
      roleName: rolePermission.role.namaRole,
      permissionName: rolePermission.permission.name,
    };

    // Remove permission from role
    await prisma.rolePermission.delete({
      where: { id: rolePermissionId },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: auditInfo.userId,
        action: "DELETE",
        resource: "RolePermission",
        resourceId: rolePermissionId,
        oldValues: JSON.stringify(rolePermissionData),
        newValues: null,
        ipAddress: auditInfo.ipAddress,
      },
    });

    // Clear all permission caches
    await cacheDeletePattern("role_permissions:*");
    await cacheDeletePattern("permissions:*");

    return { message: "Permission removed from role successfully" };
  }

  /**
   * Bulk assign permissions to a role
   */
  async bulkAssignPermissionsToRole(roleId, permissionIds, auditInfo) {
    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new ResponseError(404, "Role not found");
    }

    // Check if all permissions exist
    const permissions = await prisma.permission.findMany({
      where: {
        id: { in: permissionIds },
      },
    });

    if (permissions.length !== permissionIds.length) {
      throw new ResponseError(400, "One or more permissions not found");
    }

    // Get existing role permissions to avoid duplicates
    const existingRolePermissions = await prisma.rolePermission.findMany({
      where: {
        roleId,
        permissionId: { in: permissionIds },
      },
    });

    const existingPermissionIds = existingRolePermissions.map(rp => rp.permissionId);
    const newPermissionIds = permissionIds.filter(id => !existingPermissionIds.includes(id));

    // Create new role permissions in a transaction
    const result = await prisma.$transaction(async (prisma) => {
      const createdRolePermissions = [];

      for (const permissionId of newPermissionIds) {
        const rolePermission = await prisma.rolePermission.create({
          data: {
            roleId,
            permissionId,
          },
          include: {
            permission: true,
          },
        });

        createdRolePermissions.push(rolePermission);

        // Create audit log for each assignment
        await prisma.auditLog.create({
          data: {
            userId: auditInfo.userId,
            action: "CREATE",
            resource: "RolePermission",
            resourceId: rolePermission.id,
            oldValues: null,
            newValues: JSON.stringify({
              roleId,
              permissionId,
              roleName: role.namaRole,
              permissionName: rolePermission.permission.name,
            }),
            ipAddress: auditInfo.ipAddress,
          },
        });
      }

      return {
        created: createdRolePermissions,
        existing: existingRolePermissions.length,
        total: permissionIds.length,
      };
    });

    // Clear all permission caches
    await cacheDeletePattern("permissions:*");

    return {
      message: "Permissions assigned to role successfully",
      created: result.created.length,
      existing: result.existing,
      total: result.total,
    };
  }
}

module.exports = new PermissionService();
