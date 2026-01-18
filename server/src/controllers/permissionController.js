const permissionService = require("../services/permissionService");

const getAllPermissions = async (req, res, next) => {
  try {
    const permissions = await permissionService.getAllPermissions();

    return res.status(200).json({
      success: true,
      data: permissions,
    });
  } catch (error) {
    next(error);
  }
};

const getPermissionsByModule = async (req, res, next) => {
  try {
    const { module } = req.params;
    const permissions = await permissionService.getPermissionsByModule(module);

    return res.status(200).json({
      success: true,
      data: permissions,
    });
  } catch (error) {
    next(error);
  }
};

const createPermission = async (req, res, next) => {
  try {
    const permissionData = req.body;
    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip,
    };

    const newPermission = await permissionService.createPermission(
      permissionData,
      auditInfo
    );

    return res.status(201).json({
      success: true,
      message: "Permission created successfully",
      data: newPermission,
    });
  } catch (error) {
    next(error);
  }
};

const updatePermission = async (req, res, next) => {
  try {
    const { permissionId } = req.params;
    const permissionData = req.body;
    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip,
    };

    const updatedPermission = await permissionService.updatePermission(
      permissionId,
      permissionData,
      auditInfo
    );

    return res.status(200).json({
      success: true,
      message: "Permission updated successfully",
      data: updatedPermission,
    });
  } catch (error) {
    next(error);
  }
};

const deletePermission = async (req, res, next) => {
  try {
    const { permissionId } = req.params;
    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip,
    };

    await permissionService.deletePermission(permissionId, auditInfo);

    return res.status(200).json({
      success: true,
      message: "Permission deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const getRolePermissions = async (req, res, next) => {
  try {
    const { roleId } = req.params;
    const permissions = await permissionService.getRolePermissions(roleId);

    return res.status(200).json({
      success: true,
      data: permissions,
    });
  } catch (error) {
    next(error);
  }
};

const assignPermissionToRole = async (req, res, next) => {
  try {
    const { roleId, permissionId } = req.body;
    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip,
    };

    const result = await permissionService.assignPermissionToRole(
      roleId,
      permissionId,
      auditInfo
    );

    return res.status(201).json({
      success: true,
      message: "Permission assigned to role successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const removePermissionFromRole = async (req, res, next) => {
  try {
    const { rolePermissionId } = req.params;
    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip,
    };

    const result = await permissionService.removePermissionFromRole(
      rolePermissionId,
      auditInfo
    );

    return res.status(200).json({
      success: true,
      message: "Permission removed from role successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const bulkAssignPermissionsToRole = async (req, res, next) => {
  try {
    const { roleId, permissionIds } = req.body;
    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip,
    };

    const result = await permissionService.bulkAssignPermissionsToRole(
      roleId,
      permissionIds,
      auditInfo
    );

    return res.status(200).json({
      success: true,
      message: "Permissions assigned to role successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const bulkCreatePermissions = async (req, res, next) => {
  try {
    const { permissions } = req.body;
    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip,
    };

    const result = await permissionService.bulkCreatePermissions(
      permissions,
      auditInfo
    );

    return res.status(201).json({
      success: true,
      message: "Permissions created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllPermissions,
  getPermissionsByModule,
  createPermission,
  updatePermission,
  deletePermission,
  getRolePermissions,
  assignPermissionToRole,
  removePermissionFromRole,
  bulkAssignPermissionsToRole,
  bulkCreatePermissions,
};