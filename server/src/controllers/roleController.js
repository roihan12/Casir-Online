const roleService = require("../services/roleService");

const getAllRole = async (req, res) => {
  try {
    const { user } = req;
    const roleList = await roleService.getRole(user.id);

    return res.status(200).json({
      success: true,
      data: roleList,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get role",
    });
  }
};

const getRoleById = async (req, res) => {
  try {
    const { roleId } = req.params;
    const role = await roleService.getRoleById(roleId);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: role,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get role",
    });
  }
};

const createRole = async (req, res) => {
  try {
    const roleData = req.body;
    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip || req.connection?.remoteAddress,
    };
    const newRole = await roleService.createRole(roleData, auditInfo);

    return res.status(201).json({
      success: true,
      message: "Role created successfully",
      data: newRole,
    });
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to create role",
    });
  }
};

const updateRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const roleData = req.body;
    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip || req.connection?.remoteAddress,
    };

    const updatedRole = await roleService.updateRole(roleId, roleData, auditInfo);

    return res.status(200).json({
      success: true,
      message: "Role updated successfully",
      data: updatedRole,
    });
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to update role",
    });
  }
};

const deleteRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip || req.connection?.remoteAddress,
    };

    await roleService.deleteRole(roleId, auditInfo);

    return res.status(200).json({
      success: true,
      message: "Role deleted successfully",
    });
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to delete role",
    });
  }
};

const cloneRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { newRoleName } = req.body;
    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip || req.connection?.remoteAddress,
    };

    const clonedRole = await roleService.cloneRole(roleId, newRoleName, auditInfo);

    return res.status(201).json({
      success: true,
      message: "Role cloned successfully",
      data: clonedRole,
    });
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to clone role",
    });
  }
};

module.exports = {
  getAllRole,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  cloneRole,
};

