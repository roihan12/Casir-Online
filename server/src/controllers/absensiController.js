const { logger } = require("../utils/logger");
const {
  clockIn,
  clockOut,
  checkLiveness,
  registerFace,
  getTodayAttendance,
  getAttendanceHistory,
  getAttendanceStatistics,
  verifyAttendanceLocation,
  getFaceStatus,
} = require("../services/absensiService");
const { validate } = require("../validation/validation");
const {
  clockInValidation,
  clockOutValidation,
  livenessCheckValidation,
  registerFaceValidation,
  attendanceHistoryValidation,
  attendanceStatisticsValidation,
  verifyLocationValidation
} = require("../validation/absensiValidation");

/**
 * Clock in controller
 */
const clockInController = async (req, res, next) => {
  try {
    const userId = req.user?.id; // From auth middleware
    const cabangId = req.user?.cabang[0].cabangId; // From auth middleware

    if (!userId) {
      return res.status(401).json({
        status: false,
        message: "User not authenticated",
      });
    }

    if (!cabangId) {
      return res.status(400).json({
        status: false,
        message: "User branch not found",
      });
    }

    // Validate request
    const validatedData = await validate(clockInValidation, req.body);

    // Call service
    const result = await clockIn({
      userId,
      cabangId,
      ...validatedData
    });

    logger.info("Clock in successful", { userId, attendanceId: result.id });

    return res.status(201).json({
      status: true,
      message: "Clock in successful",
      data: result,
    });

  } catch (error) {
    logger.error("Clock in controller error", { error: error.message });
    next(error);
  }
};

/**
 * Clock out controller
 */
const clockOutController = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const cabangId = req.user?.cabang[0].cabangId;

    if (!userId) {
      return res.status(401).json({
        status: false,
        message: "User not authenticated",
      });
    }

    if (!cabangId) {
      return res.status(400).json({
        status: false,
        message: "User branch not found",
      });
    }

    // Validate request
    const validatedData = await validate(clockOutValidation, req.body);

    // Call service
    const result = await clockOut({
      userId,
      cabangId,
      ...validatedData
    });

    logger.info("Clock out successful", { userId, attendanceId: result.id });

    return res.status(200).json({
      status: true,
      message: "Clock out successful",
      data: result,
    });

  } catch (error) {
    logger.error("Clock out controller error", { error: error.message });
    next(error);
  }
};

/**
 * Liveness check controller
 */
const livenessCheckController = async (req, res, next) => {
  try {
    // Validate request
    const validatedData = await validate(livenessCheckValidation, req.body);

    // Convert base64 to buffer
    const photoBuffer = Buffer.from(validatedData.photo, "base64");

    // Call service
    const result = await checkLiveness(photoBuffer);

    logger.info("Liveness check completed", { isLive: result.is_live });

    return res.status(200).json({
      status: true,
      message: "Liveness check completed",
      data: result,
    });

  } catch (error) {
    logger.error("Liveness check controller error", { error: error.message });
    next(error);
  }
};

/**
 * Register face controller
 */
const registerFaceController = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        status: false,
        message: "User not authenticated",
      });
    }

    // Validate request
    const validatedData = await validate(registerFaceValidation, req.body);

    // Convert base64 to buffer
    const photoBuffer = Buffer.from(validatedData.photo, "base64");

    // Call service
    const result = await registerFace(userId, photoBuffer);

    logger.info("Face registered successfully", { userId });

    return res.status(201).json({
      status: true,
      message: "Face registered successfully",
      data: result,
    });

  } catch (error) {
    logger.error("Register face controller error", { error: error.message });
    next(error);
  }
};

/**
 * Get today's attendance controller
 */
const getTodayAttendanceController = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const cabangId = req.user?.cabang[0].cabangId;

    if (!userId) {
      return res.status(401).json({
        status: false,
        message: "User not authenticated",
      });
    }

    if (!cabangId) {
      return res.status(400).json({
        status: false,
        message: "User branch not found",
      });
    }

    // Call service
    const result = await getTodayAttendance(userId, cabangId);

    return res.status(200).json({
      status: true,
      message: result ? "Today's attendance retrieved" : "No attendance record for today",
      data: result,
    });

  } catch (error) {
    logger.error("Get today's attendance controller error", { error: error.message });
    next(error);
  }
};

/**
 * Get attendance history controller
 */
const getAttendanceHistoryController = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const cabangId = req.user?.cabang[0].cabangId;

    if (!cabangId) {
      return res.status(400).json({
        status: false,
        message: "Branch not found",
      });
    }

    // For regular users, only show their own attendance
    // For admins, can filter by userId
    let filterUserId = userId;
    const isAdmin = req.user?.role?.nama === "admin" || req.user?.role?.nama === "superadmin";

    if (isAdmin && req.query.userId) {
      filterUserId = req.query.userId;
    } else if (!userId) {
      return res.status(401).json({
        status: false,
        message: "User not authenticated",
      });
    }

    // Validate query parameters
    const validatedQuery = await validate(attendanceHistoryValidation, req.query);

    // Call service
    const result = await getAttendanceHistory({
      userId: filterUserId,
      cabangId,
      ...validatedQuery
    });

    return res.status(200).json({
      status: true,
      message: "Attendance history retrieved",
      data: result,
    });

  } catch (error) {
    logger.error("Get attendance history controller error", { error: error.message });
    next(error);
  }
};

/**
 * Get attendance statistics controller
 */
const getAttendanceStatisticsController = async (req, res, next) => {
  try {
    const cabangId = req.user?.cabang[0].cabangId;

    if (!cabangId) {
      return res.status(400).json({
        status: false,
        message: "Branch not found",
      });
    }

    // Validate query parameters
    const validatedQuery = await validate(attendanceStatisticsValidation, req.query);

    // Call service
    const result = await getAttendanceStatistics({
      cabangId,
      ...validatedQuery
    });

    return res.status(200).json({
      status: true,
      message: "Attendance statistics retrieved",
      data: result,
    });

  } catch (error) {
    logger.error("Get attendance statistics controller error", { error: error.message });
    next(error);
  }
};

/**
 * Verify attendance location controller
 */
const verifyLocationController = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        status: false,
        message: "User not authenticated",
      });
    }

    // Validate request
    const validatedData = await validate(verifyLocationValidation, req.body);

    // Call service
    const result = await verifyAttendanceLocation(
      userId,
      validatedData.lokasiAbsensiId,
      validatedData.latitude,
      validatedData.longitude
    );

    return res.status(200).json({
      status: true,
      message: result.canAccess ? "Location verified" : "Location verification failed",
      data: result,
    });

  } catch (error) {
    logger.error("Verify location controller error", { error: error.message });
    next(error);
  }
};
/**
 * Get face registration status
 */
const getFaceStatusController = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user.id;
    const result = await getFaceStatus(userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  clockInController,
  clockOutController,
  livenessCheckController,
  registerFaceController,
  getTodayAttendanceController,
  getAttendanceHistoryController,
  getAttendanceStatisticsController,
  verifyLocationController,
  getFaceStatusController,
};
