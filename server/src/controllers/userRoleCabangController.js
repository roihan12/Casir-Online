const userRoleCabangService = require("../services/userRoleCabangService");

const assignRoleToUser = async (req, res, next) => {
  try {
    const { userId, roleId, cabangId } = req.body;
    const adminId = req.user.id; // User ID of the admin performing the action
    const ipAddress = req.ip;

    const result = await userRoleCabangService.assignRoleToUser(
      { userId, roleId, cabangId },
      { userId: adminId, ipAddress }
    );

    res.status(201).json({
      status: true,
      message: "Role assigned to user successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


const removeRoleFromUser = async (req, res, next) => {
  try {
    const { userRoleId } = req.params;
    const adminId = req.user.id;
    const ipAddress = req.ip;

    const result = await userRoleCabangService.removeRoleFromUser(userRoleId, {
      userId: adminId,
      ipAddress,
    });

    res.status(200).json({
      status: true,
      message: "Role removed from user successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


const getUserRoles = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const result = await userRoleCabangService.getUserRoles(userId);

    res.status(200).json({
      status: true,
      message: "User roles retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


const assignUserToCabang = async (req, res, next) => {
  try {
    const { userId, cabangId, isPrimary } = req.body;
    const adminId = req.user.id;
    const ipAddress = req.ip;

    const result = await userRoleCabangService.assignUserToCabang(
      { userId, cabangId, isPrimary },
      { userId: adminId, ipAddress }
    );

    res.status(201).json({
      status: true,
      message: "User assigned to branch successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


const removeUserFromCabang = async (req, res, next) => {
  try {
    const { userCabangId } = req.params;
    const adminId = req.user.id;
    const ipAddress = req.ip;

    const result = await userRoleCabangService.removeUserFromCabang(
      userCabangId,
      { userId: adminId, ipAddress }
    );

    res.status(200).json({
      status: true,
      message: "User removed from branch successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


const setPrimaryCabang = async (req, res, next) => {
  try {
    const { userCabangId } = req.params;
    const adminId = req.user.id;
    const ipAddress = req.ip;

    const result = await userRoleCabangService.setPrimaryCabang(userCabangId, {
      userId: adminId,
      ipAddress,
    });

    res.status(200).json({
      status: true,
      message: "Primary branch set successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


const getUserCabang = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const result = await userRoleCabangService.getUserCabang(userId);

    res.status(200).json({
      status: true,
      message: "User branches retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
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
