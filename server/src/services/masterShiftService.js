const prisma = require("../config/db");
const { ResponseError } = require("../error/responseError");
const { logger } = require("../utils/logger");
const {
  cacheSet,
  cacheGet,
  cacheDelete,
  createCacheKey,
  cacheOrFetch,
  cacheDeletePattern,
} = require("../utils/redisUtils");

/**
 * Create a new master shift type (work shift template)
 * @param {Object} data - Shift data
 * @param {Object} auditInfo - Audit information
 * @returns {Promise<Object>} Created master shift
 */
const createMasterShift = async (data, auditInfo) => {
  const { namaShift, jamMasuk, jamKeluar, toleransiTerlambat, cabangId, keterangan, isOvernight } = data;

  try {
    // Verify cabang if provided
    if (cabangId) {
      const cabang = await prisma.cabang.findUnique({
        where: { id: cabangId },
      });
      if (!cabang) {
        throw new ResponseError(404, "Cabang not found");
      }
    }

    // Check for duplicate active shifts with same name in same branch
    const existingShift = await prisma.master_shift.findFirst({
      where: {
        namaShift: namaShift,
        cabangId: cabangId || null,
      },
    });

    if (existingShift) {
      throw new ResponseError(400, `Shift with name "${namaShift}" already exists in this branch`);
    }

    

    
  

    const shift = await prisma.master_shift.create({
      data: {
        cabangId: cabangId || null,
        namaShift: namaShift,
        jamMasuk: jamMasuk,
        jamKeluar: jamKeluar,
        isOvernight: isOvernight || false,
        toleransiTerlambat: toleransiTerlambat || 15,
      },
      include: {
        cabang: {
          select: {
            id: true,
            namaCabang: true,
          },
        },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        user_id: auditInfo.userId,
        ip_address: auditInfo.ipAddress,
        action: "CREATE_MASTER_SHIFT",
        table_name: "master_shift",
        record_id: shift.id,
        new_values: JSON.stringify(shift),
      },
    });

    // Invalidate cache
    await cacheDeletePattern("master-shifts:*");

    logger.info("Master shift created", {
      shiftId: shift.id,
      namaShift: shift.namaShift,
      createdBy: auditInfo.userId,
    });

    // Format response
    return {
      id: shift.id,
      namaShift: shift.namaShift,
      jamMasuk,
      jamKeluar,
      isOvernight: shift.isOvernight,
      toleransiTerlambat: shift.toleransiTerlambat,
      cabangId: shift.cabangId,
      cabang: shift.cabang,
      keterangan,
      isActive: shift.isActive,
      createdAt: shift.createdAt,
    };
  } catch (error) {
    logger.error("Create master shift failed", { error: error.message, data });
    throw error;
  }
};

/**
 * Get all master shifts with filtering
 * @param {Object} filters - Query filters
 * @returns {Promise<Object>} Paginated master shifts
 */
const getMasterShifts = async (filters) => {
  const { cabangId, isActive, page = 1, limit = 20 } = filters;

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    console.log("cabangId", cabangId);

    // Build where clause for master shifts (template status)
    const where = {};

    if (cabangId) {
      where.cabangId = cabangId;
    } else {
      // Include global shifts (no cabang) if no specific cabang requested
      where.OR = [
        { cabangId: null },
        { cabangId: "" },
      ];
    }

    // Get total count
    const total = await prisma.master_shift.count({ where });

    // Get records
    const shifts = await prisma.master_shift.findMany({
      where,
      include: {
        cabang: {
          select: {
            id: true,
            namaCabang: true,
          },
        },
      },
      orderBy: {
        namaShift: "asc",
      },
      skip,
      take: parseInt(limit),
    });

    // Parse keterangan to get jamMasuk/jamKeluar
    const formattedShifts = shifts.map((shift) => {
      let details = { jamMasuk: "00:00", jamKeluar: "00:00", notes: null };
      try {
        details = JSON.parse(shift.keterangan || "{}");
      } catch (e) {
        // Keep default values if JSON parse fails
      }

      return {
        id: shift.id,
        namaShift: shift.namaShift,
        jamMasuk: shift.jamMasuk,
        jamKeluar: shift.jamKeluar,
        isOvernight: shift.isOvernight,
        toleransiTerlambat: shift.toleransiTerlambat,
        cabangId: shift.cabangId,
        cabang: shift.cabang,
        keterangan: details.notes,
        isActive: shift.isActive,
        createdAt: shift.createdAt,
      };
    });

    return {
      data: formattedShifts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  } catch (error) {
    logger.error("Get master shifts failed", { error: error.message, filters });
    throw error;
  }
};

/**
 * Get a single master shift by ID
 * @param {string} shiftId - Shift ID
 * @returns {Promise<Object>} Master shift details
 */
const getMasterShiftById = async (shiftId) => {
  try {
    const shift = await prisma.master_shift.findFirst({
      where: {
        id: shiftId,
      },
      include: {
        cabang: {
          select: {
            id: true,
            namaCabang: true,
          },
        },
      },
    });

    if (!shift) {
      throw new ResponseError(404, "Master shift not found");
    }

    return {
      id: shift.id,
      namaShift: shift.namaShift,
      jamMasuk: shift.jamMasuk || "00:00",
      jamKeluar: shift.jamKeluar || "00:00",
      isOvernight: shift.isOvernight,
      toleransiTerlambat: shift.toleransiTerlambat,
      cabangId: shift.cabangId,
      cabang: shift.cabang,
      isActive: shift.isActive,
      createdAt: shift.createdAt,
      updatedAt: shift.updatedAt,
    };
  } catch (error) {
    logger.error("Get master shift by ID failed", { error: error.message, shiftId });
    throw error;
  }
};

/**
 * Update a master shift
 * @param {string} shiftId - Shift ID
 * @param {Object} data - Update data
 * @param {Object} auditInfo - Audit information
 * @returns {Promise<Object>} Updated master shift
 */
const updateMasterShift = async (shiftId, data, auditInfo) => {
  const { namaShift, jamMasuk, jamKeluar, toleransiTerlambat, cabangId, keterangan, isOvernight, isActive } = data;

  try {
    // Check if shift exists
    const existingShift = await prisma.master_shift.findFirst({
      where: {
        id: shiftId,
      },
    });

    if (!existingShift) {
      throw new ResponseError(404, "Master shift not found");
    }

    // Verify cabang if provided
    if (cabangId) {
      const cabang = await prisma.cabang.findUnique({
        where: { id: cabangId },
      });
      if (!cabang) {
        throw new ResponseError(404, "Cabang not found");
      }
    }

    // Check for duplicate if changing name
    if (namaShift && namaShift !== existingShift.namaShift) {
      const duplicate = await prisma.master_shift.findFirst({
        where: {
          namaShift: namaShift,
          cabangId: cabangId || existingShift.cabangId || null,
          id: { not: shiftId },
        },
      });

      if (duplicate) {
        throw new ResponseError(400, `Shift with name "${namaShift}" already exists`);
      }
    }

    // Parse existing details
    let existingDetails = { jamMasuk: "00:00", jamKeluar: "00:00", notes: null };
    try {
      existingDetails = JSON.parse(existingShift.keterangan || "{}");
    } catch (e) {
      // Keep default values
    }


    // Prepare update data
    const updateData = {};
    if (namaShift) updateData.namaShift = namaShift;
    if (cabangId !== undefined) updateData.cabangId = cabangId || null;
    if (toleransiTerlambat !== undefined) updateData.toleransiTerlambat = toleransiTerlambat;
    if (isOvernight !== undefined) updateData.isOvernight = isOvernight;
    updateData.updatedBy = auditInfo.userId;

    const updatedShift = await prisma.master_shift.update({
      where: { id: shiftId },
      data: updateData,
      include: {
        cabang: {
          select: {
            id: true,
            namaCabang: true,
          },
        },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        user_id: auditInfo.userId,
        ip_address: auditInfo.ipAddress,
        action: "UPDATE_MASTER_SHIFT",
        table_name: "shift",
        record_id: shiftId,
        old_values: JSON.stringify(existingShift),
        new_values: JSON.stringify(updatedShift),
      },
    });

    // Invalidate cache
    await cacheDeletePattern("master-shifts:*");

    logger.info("Master shift updated", {
      shiftId,
      updatedBy: auditInfo.userId,
    });

    // Format response
    return {
      id: updatedShift.id,
      namaShift: updatedShift.namaShift,
      jamMasuk: updatedShift.jamMasuk,
      jamKeluar: updatedShift.jamKeluar,
      isOvernight: updatedShift.isOvernight,
      toleransiTerlambat: updatedShift.toleransiTerlambat,
      cabangId: updatedShift.cabangId,
      cabang: updatedShift.cabang,
      isActive: updatedShift.isActive,
      updatedAt: updatedShift.updatedAt,
    };
  } catch (error) {
    logger.error("Update master shift failed", { error: error.message, shiftId, data });
    throw error;
  }
};

/**
 * Soft delete (deactivate) a master shift
 * @param {string} shiftId - Shift ID
 * @param {Object} auditInfo - Audit information
 * @returns {Promise<Object>} Deactivated shift
 */
const deleteMasterShift = async (shiftId, auditInfo) => {
  try {
    // Check if shift exists
    const shift = await prisma.master_shift.findFirst({
      where: {
        id: shiftId,
      },
    });

    if (!shift) {
      throw new ResponseError(404, "Master shift not found or already deactivated");
    }

    // Check if shift is being used in any active schedules
    const schedulesUsingShift = await prisma.jadwalKerja.count({
      where: {
        master_shift_id: shiftId,
      },
    });

    if (schedulesUsingShift > 0) {
      throw new ResponseError(
        400,
        `Cannot deactivate shift. It is being used in ${schedulesUsingShift} active schedule(s)`
      );
    }

    // Soft delete
    await prisma.master_shift.delete({
      where: { id: shiftId },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        user_id: auditInfo.userId,
        ip_address: auditInfo.ipAddress,
        action: "DELETE_MASTER_SHIFT",
        table_name: "master_shift",
        record_id: shiftId,
        old_values: JSON.stringify(shift),
      },
    });

    // Invalidate cache
    await cacheDeletePattern("master-shifts:*");

    logger.info("Master shift deactivated", {
      shiftId,
      deactivatedBy: auditInfo.userId,
    });

    return {
      success: true,
      message: "Master shift deactivated successfully",
    };
  } catch (error) {
    logger.error("Delete master shift failed", { error: error.message, shiftId });
    throw error;
  }
};

module.exports = {
  createMasterShift,
  getMasterShifts,
  getMasterShiftById,
  updateMasterShift,
  deleteMasterShift,
};
