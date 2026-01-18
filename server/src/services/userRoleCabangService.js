const prisma = require("../config/db");
const { ResponseError } = require("../error/responseError");
const { validate } = require("../validation/validation");
const { createAuditLog } = require("../utils/auditLog");
const {
  userRoleAssignSchema,
  userCabangAssignSchema,
} = require("../validation/userValidation");

const assignRoleToUser = async (data, { userId, ipAddress }) => {
  // Validate input data
  const validData = validate(userRoleAssignSchema, data);

  return prisma.$transaction(async (tx) => {
    // Check if user exists
    const user = await tx.user.findUnique({
      where: { id: validData.userId },
    });

    if (!user) {
      throw new ResponseError(404, "User not found");
    }

    // Check if role exists
    const role = await tx.role.findUnique({
      where: { id: validData.roleId },
    });

    if (!role) {
      throw new ResponseError(404, "Role not found");
    }

    // Check if branch exists
    const cabang = await tx.cabang.findUnique({
      where: { id: validData.cabangId },
    });

    if (!cabang) {
      throw new ResponseError(404, "Branch not found");
    }

    // Check if user is already assigned to this role in this branch
    const existingRole = await tx.userRole.findFirst({
      where: {
        userId: validData.userId,
        roleId: validData.roleId,
        cabangId: validData.cabangId,
      },
    });

    if (existingRole) {
      throw new ResponseError(400, "User already has this role in this branch");
    }

    // Create the user role assignment
    const userRole = await tx.userRole.create({
      data: {
        userId: validData.userId,
        roleId: validData.roleId,
        cabangId: validData.cabangId,
      },
      include: {
        user: true,
        role: true,
        cabang: true,
      },
    });

    // Create audit log
    await createAuditLog(tx, {
      userId,
      ipAddress,
      action: "CREATE",
      tableName: "user_roles",
      recordId: userRole.id,
      oldValues: null,
      newValues: validData,
    });

    return userRole;
  });
};


const removeRoleFromUser = async (userRoleId, { userId, ipAddress }) => {
  return prisma.$transaction(async (tx) => {
    // Check if user role exists
    const userRole = await tx.userRole.findUnique({
      where: { id: userRoleId },
      include: {
        user: true,
        role: true,
        cabang: true,
      },
    });

    if (!userRole) {
      throw new ResponseError(404, "User role assignment not found");
    }

    // Delete the user role
    await tx.userRole.delete({
      where: { id: userRoleId },
    });

    // Create audit log
    await createAuditLog(tx, {
      userId,
      ipAddress,
      action: "DELETE",
      tableName: "user_roles",
      recordId: userRoleId,
      oldValues: userRole,
      newValues: null,
    });

    return {
      success: true,
      message: "Role removed from user successfully",
    };
  });
};


const getUserRoles = async (userId) => {
  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ResponseError(404, "User not found");
  }

  // Get all roles for the user
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: true,
      cabang: true,
    },
  });

  return userRoles;
};


const assignUserToCabang = async (data, { userId, ipAddress }) => {
  // Validate input data
  const validData = validate(userCabangAssignSchema, data);

  // Set default value for isPrimary
  if (validData.isPrimary === undefined) {
    validData.isPrimary = false;
  }

  return prisma.$transaction(async (tx) => {
    // Check if user exists
    const user = await tx.user.findUnique({
      where: { id: validData.userId },
    });

    if (!user) {
      throw new ResponseError(404, "User not found");
    }

    // Check if branch exists
    const cabang = await tx.cabang.findUnique({
      where: { id: validData.cabangId },
    });

    if (!cabang) {
      throw new ResponseError(404, "Branch not found");
    }

    // Check if user is already assigned to this branch
    const existingCabang = await tx.userCabang.findFirst({
      where: {
        userId: validData.userId,
        cabangId: validData.cabangId,
      },
    });

    if (existingCabang) {
      throw new ResponseError(400, "User is already assigned to this branch");
    }

    // If setting as primary, update existing primary branch
    if (validData.isPrimary) {
      await tx.userCabang.updateMany({
        where: {
          userId: validData.userId,
          isPrimary: true,
        },
        data: {
          isPrimary: false,
        },
      });
    }

    // Create the user branch assignment
    const userCabang = await tx.userCabang.create({
      data: {
        userId: validData.userId,
        cabangId: validData.cabangId,
        isPrimary: validData.isPrimary,
      },
      include: {
        user: true,
        cabang: true,
      },
    });

    // Create audit log
    await createAuditLog(tx, {
      userId,
      ipAddress,
      action: "CREATE",
      tableName: "user_cabang",
      recordId: userCabang.id,
      oldValues: null,
      newValues: validData,
    });

    return userCabang;
  });
};


const removeUserFromCabang = async (userCabangId, { userId, ipAddress }) => {
  return prisma.$transaction(async (tx) => {
    // Check if user cabang exists
    const userCabang = await tx.userCabang.findUnique({
      where: { id: userCabangId },
      include: {
        user: true,
        cabang: true,
      },
    });

    if (!userCabang) {
      throw new ResponseError(404, "User branch assignment not found");
    }

    // Check if any of the user's roles are associated with this branch
    const userRolesForBranch = await tx.userRole.findMany({
      where: {
        userId: userCabang.userId,
        cabangId: userCabang.cabangId,
      },
    });

    if (userRolesForBranch.length > 0) {
      throw new ResponseError(
        400,
        "Cannot remove user from branch as they have roles associated with this branch. Remove the roles first."
      );
    }

    // Delete the user cabang
    await tx.userCabang.delete({
      where: { id: userCabangId },
    });

    // Create audit log
    await createAuditLog(tx, {
      userId,
      ipAddress,
      action: "DELETE",
      tableName: "user_cabang",
      recordId: userCabangId,
      oldValues: userCabang,
      newValues: null,
    });

    // If this was the primary branch, set another branch as primary if available
    if (userCabang.isPrimary) {
      const remainingBranches = await tx.userCabang.findMany({
        where: { userId: userCabang.userId },
      });

      if (remainingBranches.length > 0) {
        await tx.userCabang.update({
          where: { id: remainingBranches[0].id },
          data: { isPrimary: true },
        });
      }
    }

    return {
      success: true,
      message: "User removed from branch successfully",
    };
  });
};


const setPrimaryCabang = async (userCabangId, { userId, ipAddress }) => {
  return prisma.$transaction(async (tx) => {
    // Check if user cabang exists
    const userCabang = await tx.userCabang.findUnique({
      where: { id: userCabangId },
    });

    if (!userCabang) {
      throw new ResponseError(404, "User branch assignment not found");
    }

    // Get current primary branch for audit log
    const currentPrimary = await tx.userCabang.findFirst({
      where: {
        userId: userCabang.userId,
        isPrimary: true,
      },
    });

    // Update all branches to not primary
    await tx.userCabang.updateMany({
      where: {
        userId: userCabang.userId,
        isPrimary: true,
      },
      data: {
        isPrimary: false,
      },
    });

    // Set the selected branch as primary
    const updatedUserCabang = await tx.userCabang.update({
      where: { id: userCabangId },
      data: { isPrimary: true },
      include: {
        user: true,
        cabang: true,
      },
    });

    // Create audit log
    await createAuditLog(tx, {
      userId,
      ipAddress,
      action: "UPDATE",
      tableName: "user_cabang",
      recordId: userCabangId,
      oldValues: {
        primaryCabangId: currentPrimary?.id,
      },
      newValues: {
        primaryCabangId: userCabangId,
      },
    });

    return updatedUserCabang;
  });
};


const getUserCabang = async (userId) => {
  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ResponseError(404, "User not found");
  }

  // Get all branches for the user
  const userCabang = await prisma.userCabang.findMany({
    where: { userId },
    include: {
      cabang: true,
    },
  });

  return userCabang;
};

module.exports = {
  assignRoleToUser,
  removeRoleFromUser,
  getUserRoles,
  assignUserToCabang,
  removeUserFromCabang,
  setPrimaryCabang,
  getUserCabang,
};
