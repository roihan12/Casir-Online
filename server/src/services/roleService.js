const prisma = require("../config/db");
const { ResponseError } = require("../error/responseError");
const { validate } = require("../validation/validation");
const { CreateRoleValidation, UpdateRoleValidation } = require("../validation/roleValidation");

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
    // Super admin can see all role
    return prisma.role.findMany();
  } else {
    // Other users can only see their role
    return prisma.role.findMany({
      where: {
        userCabang: {
          some: {
            userId: userId,
          },
        },
      },
    });
  }
};

const getRoleById = async (roleId) => {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
  });

  if (!role) {
    throw new ResponseError(404, "Role not found");
  }

  return role;
};

const createRole = async (roleData) => {
  const validData = validate(CreateRoleValidation, roleData);

  return prisma.role.create({
    data: validData,
  });
};

const updateRole = async (roleId, roleData) => {
  const validData = validate(UpdateRoleValidation, roleData);
  const role = await prisma.role.findUnique({ where: { id: roleId } });

  if (!role) {
    throw new ResponseError(404, "Role not found");
  }

  return prisma.role.update({
    where: { id: roleId },
    data: validData,
  });
};

const deleteRole = async (roleId) => {
  const role = await prisma.role.findUnique({ where: { id: roleId } });

  if (!role) {
    throw new ResponseError(404, "Role not found");
  }

  return prisma.role.delete({
    where: { id: roleId },
  });
};

module.exports = {
  getRole,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
};
