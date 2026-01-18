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
    const newRole = await roleService.createRole(roleData);

    return res.status(201).json({
      success: true,
      message: "Role created successfully",
      data: newRole,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create role",
    });
  }
};

const updateRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const roleData = req.body;

    const updatedRole = await roleService.updateRole(roleId, roleData);

    return res.status(200).json({
      success: true,
      message: "Role updated successfully",
      data: updatedRole,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update role",
    });
  }
};

const deleteRole = async (req, res) => {
  try {
    const { roleId } = req.params;

    await roleService.deleteRole(roleId);

    return res.status(200).json({
      success: true,
      message: "Role deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete role",
    });
  }
};

module.exports = {
  getAllRole,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
};
