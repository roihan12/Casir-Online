const { prisma } = require("../config/db");
const { logger } = require("../utils/logger");
const { ResponseError } = require("../error/responseError");

/**
 * Create a new attendance location
 * @param {Object} data - Location data
 * @returns {Promise<Object>} Created location
 */
const createLocation = async (data) => {
  const {
    nama,
    alamat,
    latitude,
    longitude,
    radius,
    cabangId,
    requireFaceRecognition = false,
    minFaceMatchScore,
    isActive = true
  } = data;

  logger.info("Creating attendance location", { nama, cabangId });

  try {
    // Validate coordinates
    if (latitude < -90 || latitude > 90) {
      throw new ResponseError(400, "Invalid latitude. Must be between -90 and 90");
    }
    if (longitude < -180 || longitude > 180) {
      throw new ResponseError(400, "Invalid longitude. Must be between -180 and 180");
    }
    if (radius <= 0 || radius > 1000) {
      throw new ResponseError(400, "Invalid radius. Must be between 1 and 1000 meters");
    }

    // Check if branch exists (if provided)
    if (cabangId) {
      const cabang = await prisma.cabang.findUnique({
        where: { id: cabangId }
      });

      if (!cabang) {
        throw new ResponseError(404, "Branch not found");
      }
    }

    // Create location using correct field names from model:
    // - nama -> nama_lokasi (column mapping)
    // - isActive -> Boolean
    // - requireFaceRecognition -> Boolean
    const location = await prisma.lokasiAbsensi.create({
      data: {
        nama,  // Prisma maps to nama_lokasi column
        alamat,
        latitude,
        longitude,
        radius,
        isActive,
        requireFaceRecognition,
        minFaceMatchScore: minFaceMatchScore ? parseFloat(minFaceMatchScore) : null,
        cabangId
      }
    });

    logger.info("Attendance location created", { locationId: location.id, nama });

    return location;

  } catch (error) {
    logger.error("Create location failed", { error: error.message });
    throw error;
  }
};

/**
 * Update an existing attendance location
 * @param {string} id - Location ID
 * @param {Object} data - Updated location data
 * @returns {Promise<Object>} Updated location
 */
const updateLocation = async (id, data) => {
  logger.info("Updating attendance location", { locationId: id });

  try {
    // Check if location exists
    const existingLocation = await prisma.lokasiAbsensi.findUnique({
      where: { id }
    });

    if (!existingLocation) {
      throw new ResponseError(404, "Attendance location not found");
    }

    // Validate coordinates if provided
    if (data.latitude !== undefined && (data.latitude < -90 || data.latitude > 90)) {
      throw new ResponseError(400, "Invalid latitude. Must be between -90 and 90");
    }
    if (data.longitude !== undefined && (data.longitude < -180 || data.longitude > 180)) {
      throw new ResponseError(400, "Invalid longitude. Must be between -180 and 180");
    }
    if (data.radius !== undefined && (data.radius <= 0 || data.radius > 1000)) {
      throw new ResponseError(400, "Invalid radius. Must be between 1 and 1000 meters");
    }

    // Prepare update data with correct field types
    const updateData = {};

    if (data.nama !== undefined) updateData.nama = data.nama;
    if (data.alamat !== undefined) updateData.alamat = data.alamat;
    if (data.latitude !== undefined) updateData.latitude = data.latitude;
    if (data.longitude !== undefined) updateData.longitude = data.longitude;
    if (data.radius !== undefined) updateData.radius = data.radius;
    if (data.cabangId !== undefined) updateData.cabangId = data.cabangId;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.requireFaceRecognition !== undefined) updateData.requireFaceRecognition = data.requireFaceRecognition;
    if (data.minFaceMatchScore !== undefined) {
      updateData.minFaceMatchScore = data.minFaceMatchScore ? parseFloat(data.minFaceMatchScore) : null;
    }

    // Update location
    const location = await prisma.lokasiAbsensi.update({
      where: { id },
      data: updateData
    });

    logger.info("Attendance location updated", { locationId: id });

    return location;

  } catch (error) {
    logger.error("Update location failed", { locationId: id, error: error.message });
    throw error;
  }
};

/**
 * Delete an attendance location
 * @param {string} id - Location ID
 * @returns {Promise<Object>} Deleted location
 */
const deleteLocation = async (id) => {
  logger.info("Deleting attendance location", { locationId: id });

  try {
    // Check if location exists
    const existingLocation = await prisma.lokasiAbsensi.findUnique({
      where: { id }
    });

    if (!existingLocation) {
      throw new ResponseError(404, "Attendance location not found");
    }

    // Check if location has attendance records
    const attendanceCount = await prisma.absensiPegawai.count({
      where: { lokasiAbsensiId: id }
    });

    if (attendanceCount > 0) {
      throw new ResponseError(
        400,
        `Cannot delete location with ${attendanceCount} attendance records. Please deactivate it instead.`
      );
    }

    // Check if location has user assignments
    const userLocationCount = await prisma.userLokasiAbsensi.count({
      where: { lokasiId: id }
    });

    if (userLocationCount > 0) {
      throw new ResponseError(
        400,
        `Cannot delete location with ${userLocationCount} user assignments. Please unassign users first.`
      );
    }

    // Delete location
    await prisma.lokasiAbsensi.delete({
      where: { id }
    });

    logger.info("Attendance location deleted", { locationId: id });

    return { success: true, message: "Location deleted successfully" };

  } catch (error) {
    logger.error("Delete location failed", { locationId: id, error: error.message });
    throw error;
  }
};

/**
 * Get a location by ID
 * @param {string} id - Location ID
 * @returns {Promise<Object>} Location details
 */
const getLocationById = async (id) => {
  try {
    const location = await prisma.lokasiAbsensi.findUnique({
      where: { id },
      include: {
        cabang: {
          select: {
            id: true,
            namaCabang: true
          }
        },
        _count: {
          select: {
            userLokasiAbsensis: true,
            absensiPegawai: true
          }
        }
      }
    });

    if (!location) {
      throw new ResponseError(404, "Attendance location not found");
    }

    return location;

  } catch (error) {
    logger.error("Get location failed", { locationId: id, error: error.message });
    throw error;
  }
};

/**
 * Get all locations with filters
 * @param {Object} filters - Query filters
 * @returns {Promise<Array>} List of locations
 */
const getLocations = async (filters) => {
  const { cabangId, status, search } = filters;

  try {
    const where = {};

    if (cabangId) {
      where.cabangId = cabangId;
    }

    // Use isActive (Boolean) instead of status string
    if (status === "ACTIVE") {
      where.isActive = true;
    } else if (status === "INACTIVE") {
      where.isActive = false;
    }

    if (search) {
      where.OR = [
        { nama: { contains: search, mode: "insensitive" } },
        { alamat: { contains: search, mode: "insensitive" } }
      ];
    }

    const locations = await prisma.lokasiAbsensi.findMany({
      where,
      include: {
        cabang: {
          select: {
            id: true,
            namaCabang: true
          }
        },
        _count: {
          select: {
            userLokasiAbsensi: true,
            absensiPegawai: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return locations;

  } catch (error) {
    logger.error("Get locations failed", { filters, error: error.message });
    throw error;
  }
};

/**
 * Assign a user to a location
 * @param {Object} data - Assignment data
 * @returns {Promise<Object>} Created assignment
 */
const assignUserToLocation = async (data) => {
  const { userId, lokasiAbsensiId, isDefault = false } = data;

  logger.info("Assigning user to location", { userId, lokasiAbsensiId });

  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new ResponseError(404, "User not found");
    }

    // Check if location exists
    const location = await prisma.lokasiAbsensi.findUnique({
      where: { id: lokasiAbsensiId }
    });

    if (!location) {
      throw new ResponseError(404, "Attendance location not found");
    }

    // Check if assignment already exists (using lokasiId field)
    const existingAssignment = await prisma.userLokasiAbsensi.findFirst({
      where: {
        userId,
        lokasiId: lokasiAbsensiId
      }
    });

    if (existingAssignment) {
      throw new ResponseError(400, "User is already assigned to this location");
    }

    // Create assignment using correct field names:
    // - lokasiId (not lokasiAbsensiId)
    // - isDefault (Boolean)
    const assignment = await prisma.userLokasiAbsensi.create({
      data: {
        userId,
        lokasiId: lokasiAbsensiId,
        isDefault
      }
    });

    logger.info("User assigned to location", { userId, lokasiAbsensiId });

    return assignment;

  } catch (error) {
    logger.error("Assign user to location failed", { userId, lokasiAbsensiId, error: error.message });
    throw error;
  }
};

/**
 * Unassign a user from a location
 * @param {string} userId - User ID
 * @param {string} lokasiAbsensiId - Location ID
 * @returns {Promise<Object>} Result
 */
const unassignUserFromLocation = async (userId, lokasiAbsensiId) => {
  logger.info("Unassigning user from location", { userId, lokasiAbsensiId });

  try {
    // Find assignment (using lokasiId field, no isActive filter)
    const assignment = await prisma.userLokasiAbsensi.findFirst({
      where: {
        userId,
        lokasiId: lokasiAbsensiId
      }
    });

    if (!assignment) {
      throw new ResponseError(404, "Assignment not found");
    }

    // Hard delete the assignment
    await prisma.userLokasiAbsensi.delete({
      where: { id: assignment.id }
    });

    logger.info("User unassigned from location", { userId, lokasiAbsensiId });

    return { success: true, message: "User unassigned successfully" };

  } catch (error) {
    logger.error("Unassign user from location failed", { userId, lokasiAbsensiId, error: error.message });
    throw error;
  }
};

/**
 * Get users assigned to a location
 * @param {string} lokasiAbsensiId - Location ID
 * @returns {Promise<Array>} List of assigned users
 */
const getLocationUsers = async (lokasiAbsensiId) => {
  try {
    const assignments = await prisma.userLokasiAbsensi.findMany({
      where: {
        lokasiId: lokasiAbsensiId  // Using lokasiId field
      },
      include: {
        user: {
          select: {
            id: true,
            namaLengkap: true,
            email: true,
            telepon: true
          }
        }
      }
    });

    return assignments.map(a => ({
      ...a.user,
      assignmentId: a.id,
      isDefault: a.isDefault,
      assignedAt: a.createdAt
    }));

  } catch (error) {
    logger.error("Get location users failed", { lokasiAbsensiId, error: error.message });
    throw error;
  }
};

/**
 * Get locations for a user
 * @param {string} userId - User ID
 * @param {string} cabangId - Branch ID
 * @returns {Promise<Array>} List of locations
 */
const getUserLocations = async (userId, cabangId) => {
  try {
    // Get all active locations for user's branch
    const branchLocations = await prisma.lokasiAbsensi.findMany({
      where: {
        cabangId,
        isActive: true
      }
    });

    // Get user's assigned locations (using lokasiId field)
    const userAssignments = await prisma.userLokasiAbsensi.findMany({
      where: {
        userId
      },
      select: {
        lokasiId: true,
        isDefault: true
      }
    });

    const assignedLocationIds = new Set(userAssignments.map(a => a.lokasiId));
    const defaultLocationId = userAssignments.find(a => a.isDefault)?.lokasiId;

    // Mark which locations are assigned and set as default
    const locations = branchLocations.map(loc => ({
      ...loc,
      isAssigned: assignedLocationIds.has(loc.id),
      isDefault: defaultLocationId === loc.id
    }));

    return locations;

  } catch (error) {
    logger.error("Get user locations failed", { userId, cabangId, error: error.message });
    throw error;
  }
};

module.exports = {
  createLocation,
  updateLocation,
  deleteLocation,
  getLocationById,
  getLocations,
  assignUserToLocation,
  unassignUserFromLocation,
  getLocationUsers,
  getUserLocations
};
