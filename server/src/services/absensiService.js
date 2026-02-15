const { prisma, faceServiceClient } = require("../config/db");
const { logger } = require("../utils/logger");
const { haversineDistance, isValidCoordinates } = require("../utils/geoUtils");
const { ResponseError } = require("../error/responseError");
const FormData = require("form-data");
const { uploadFileToSupabase } = require("../utils/uploadToSupabase");

// Constants
const DEFAULT_LATE_THRESHOLD = parseInt(process.env.DEFAULT_LATE_THRESHOLD) || 15; // minutes

/**
 * Clock in with face verification and location validation
 * @param {Object} data - Clock in data
 * @param {string} data.userId - User ID
 * @param {string} data.lokasiAbsensiId - Attendance location ID
 * @param {number} data.latitude - GPS latitude
 * @param {number} data.longitude - GPS longitude
 * @param {Buffer|string} data.photo - Photo buffer or base64
 * @param {string} data.cabangId - Branch ID
 * @returns {Promise<Object>} Created attendance record
 */
const clockIn = async (data) => {
  const { userId, lokasiAbsensiId, latitude, longitude, photo, cabangId, frames } = data;

  logger.info("Clock in attempt", { userId, lokasiAbsensiId, latitude, longitude });

  try {
    // 1. Validate coordinates
    if (!isValidCoordinates(latitude, longitude)) {
      throw new ResponseError(400, "Invalid GPS coordinates");
    }

    // 2. Check if user has a registered face
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { faceDataJson: true, faceImageUrl: true, namaLengkap: true }
    });

    if (!user) {
      throw new ResponseError(404, "User not found");
    }

    if (!user.faceDataJson) {
      throw new ResponseError(400, "No face data registered. Please register your face first.");
    }

    // 3. Verify attendance location
    const location = await prisma.lokasiAbsensi.findUnique({
      where: { id: lokasiAbsensiId }
    });

    if (!location) {
      throw new ResponseError(404, "Attendance location not found");
    }

    // Check if location is active (isActive is Boolean)
    if (!location.isActive) {
      throw new ResponseError(400, "Attendance location is not active");
    }

    // Verify user is assigned to this location (check in UserLokasiAbsensi)
    const userLocation = await prisma.userLokasiAbsensi.findFirst({
      where: {
        userId,
        lokasiId: lokasiAbsensiId  // Using lokasiId not lokasiAbsensiId
      }
    });

    // Note: isRequireAssignment removed - assignment logic handled differently
    // If user is explicitly assigned, check that. Otherwise allow if location is public.

    // Verify geofencing
    const distance = haversineDistance(
      latitude, longitude,
      Number(location.latitude),
      Number(location.longitude)
    );

    if (distance > location.radius) {
      throw new ResponseError(
        400,
        `You are outside the attendance area. Distance: ${Math.round(distance)}m (Max: ${location.radius}m)`
      );
    }

    // 4. Process photo and verify face
    const photoBuffer = Buffer.isBuffer(photo) ? photo : Buffer.from(photo, "base64");

    // 4a. Verify face
    const faceVerifyResult = await verifyFace(user.faceDataJson, photoBuffer, userId);

    if (!faceVerifyResult.is_match) {
      throw new ResponseError(
        401,
        `Face verification failed. Similarity: ${(faceVerifyResult.similarity * 100).toFixed(1)}%`
      );
    }

    // 4b. Check liveness if face recognition is required
    // if (location.requireFaceRecognition) {
    //   // Prioritize video liveness check if frames are available
    //   if (frames && frames.length > 0) {
    //     logger.info("Performing multi-frame liveness check", { frameCount: frames.length });
        
    //     // Convert frames to buffers
    //     const frameBuffers = frames.map(frame => 
    //       Buffer.isBuffer(frame) ? frame : Buffer.from(frame, "base64")
    //     );
        
    //     const livenessResult = await checkLivenessVideo(frameBuffers);
        
    //     if (!livenessResult.is_live) {
    //       throw new ResponseError(
    //         401,
    //         `Liveness check failed. ${livenessResult.message || "Please ensure you are using a real face."}`
    //       );
    //     }
    //   } else {
    //     // Fallback to single photo liveness check
    //     logger.info("Performing single-frame liveness check");
    //     const livenessResult = await checkLiveness(photoBuffer);

    //     if (!livenessResult.is_live) {
    //       throw new ResponseError(
    //         401,
    //         "Liveness check failed. Please ensure you are using a real face, not a photo."
    //       );
    //     }
    //   }
    // }

    // 5. Upload photo to cloud storage
    // const photoUrl = await uploadFileToSupabase(photoBuffer);

    // logger.info("Photo uploaded", { photoUrl });

    // 6. Check if already clocked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingAttendance = await prisma.absensiPegawai.findFirst({
      where: {
        userId,
        cabangId,
        tanggalAbsensi: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    if (existingAttendance && existingAttendance.waktuMasuk) {
      throw new ResponseError(400, "You have already clocked in today");
    }

    // 7. Determine attendance status (late vs on time)
    // Note: jamMasuk/jamKeluar removed from LokasiAbsensi model
    // Using DEFAULT_LATE_THRESHOLD or get from Shift/JadwalKerja
    const now = new Date();

    // Check if user has a work schedule (JadwalKerja)
    const workSchedule = await prisma.jadwalKerja.findFirst({
      where: {
        userId,
        cabangId,
        tanggalMulai: { lte: today },
        tanggalSelesai: { gte: today }
      }
    });

    let isLate = false;
    let lateMinutes = 0;

    if (workSchedule && workSchedule.jamMasuk) {
      const [hours, minutes] = workSchedule.jamMasuk.split(':');
      const workStartTime = new Date(today);
      workStartTime.setHours(parseInt(hours), parseInt(minutes), 0);

      isLate = now > workStartTime;
      lateMinutes = isLate ? Math.round((now - workStartTime) / (1000 * 60)) : 0;
    }

    let statusKehadiran = "hadir";
    if (isLate && lateMinutes > DEFAULT_LATE_THRESHOLD) {
      statusKehadiran = "terlambat";
    }

    // 8. Create attendance record
    // Using correct field names from model:
    // - faceRecognitionMasuk: Boolean (not JSON)
    // - faceMatchScoreMasuk: Decimal (5,2)
    const attendance = await prisma.absensiPegawai.create({
      data: {
        userId,
        cabangId,
        lokasiAbsensiId,
        tanggalAbsensi: today,
        waktuMasuk: now,
        statusKehadiran,
        latitudeMasuk: latitude,
        longitudeMasuk: longitude,
        fotoMasuk: "",
        faceRecognitionMasuk: true,  // Boolean, not JSON
        faceMatchScoreMasuk: parseFloat((faceVerifyResult.similarity * 100).toFixed(2)),  // Decimal as percentage
        keterangan: isLate ? `Terlambat ${lateMinutes} menit` : null
      }
    });

    logger.info("Clock in successful", {
      userId,
      attendanceId: attendance.id,
      faceMatchScore: faceVerifyResult.similarity,
      distance: Math.round(distance)
    });

    return attendance;

  } catch (error) {
    logger.error("Clock in failed", { userId, error: error.message });
    throw error;
  }
};

/**
 * Clock out with face verification and location validation
 * @param {Object} data - Clock out data
 * @param {string} data.userId - User ID
 * @param {string} data.lokasiAbsensiId - Attendance location ID
 * @param {number} data.latitude - GPS latitude
 * @param {number} data.longitude - GPS longitude
 * @param {Buffer|string} data.photo - Photo buffer or base64
 * @param {string} data.cabangId - Branch ID
 * @returns {Promise<Object>} Updated attendance record
 */
const clockOut = async (data) => {
  const { userId, lokasiAbsensiId, latitude, longitude, photo, cabangId } = data;

  logger.info("Clock out attempt", { userId, lokasiAbsensiId, latitude, longitude });

  try {
    // 1. Validate coordinates
    if (!isValidCoordinates(latitude, longitude)) {
      throw new ResponseError(400, "Invalid GPS coordinates");
    }

    // 2. Get user face data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { faceDataJson: true, faceImageUrl: true, nama: true }
    });

    if (!user) {
      throw new ResponseError(404, "User not found");
    }

    if (!user.faceDataJson) {
      throw new ResponseError(400, "No face data registered. Please register your face first.");
    }

    // 3. Get today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await prisma.absensiPegawai.findFirst({
      where: {
        userId,
        cabangId,
        tanggalAbsensi: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    if (!attendance) {
      throw new ResponseError(404, "No clock-in record found for today. Please clock in first.");
    }

    if (attendance.waktuKeluar) {
      throw new ResponseError(400, "You have already clocked out today");
    }

    // 4. Verify location
    const location = await prisma.lokasiAbsensi.findUnique({
      where: { id: lokasiAbsensiId }
    });

    if (!location) {
      throw new ResponseError(404, "Attendance location not found");
    }

    // Verify geofencing
    const distance = haversineDistance(
      latitude, longitude,
      Number(location.latitude),
      Number(location.longitude)
    );

    if (distance > location.radius) {
      throw new ResponseError(
        400,
        `You are outside the attendance area. Distance: ${Math.round(distance)}m (Max: ${location.radius}m)`
      );
    }

    // 5. Verify face
    const photoBuffer = Buffer.isBuffer(photo) ? photo : Buffer.from(photo, "base64");
    const faceVerifyResult = await verifyFace(user.faceDataJson, photoBuffer, userId);

    if (!faceVerifyResult.is_match) {
      throw new ResponseError(
        401,
        `Face verification failed. Similarity: ${(faceVerifyResult.similarity * 100).toFixed(1)}%`
      );
    }

    // 6. Check liveness if required
    if (location.requireFaceRecognition) {
      // Prioritize video liveness check if frames are available
      if (data.frames && data.frames.length > 0) {
        logger.info("Performing multi-frame liveness check (Clock Out)", { frameCount: data.frames.length });
        
        // Convert frames to buffers
        const frameBuffers = data.frames.map(frame => 
          Buffer.isBuffer(frame) ? frame : Buffer.from(frame, "base64")
        );
        
        const livenessResult = await checkLivenessVideo(frameBuffers);
        
        if (!livenessResult.is_live) {
          throw new ResponseError(
            401,
            `Liveness check failed. ${livenessResult.message || "Please ensure you are using a real face."}`
          );
        }
      } else {
        const livenessResult = await checkLiveness(photoBuffer);

        if (!livenessResult.is_live) {
          throw new ResponseError(
            401,
            "Liveness check failed. Please ensure you are using a real face, not a photo."
          );
        }
      }
    }

    // 7. Upload photo
    const photoUrl = await uploadFileToSupabase(photoBuffer);

    // 8. Calculate work duration and overtime
    const now = new Date();

    // Check work schedule for end time
    const workSchedule = await prisma.jadwalKerja.findFirst({
      where: {
        userId,
        cabangId,
        tanggalMulai: { lte: today },
        tanggalSelesai: { gte: today }
      }
    });

    let workEndTime = now;
    if (workSchedule && workSchedule.jamKeluar) {
      const [hours, minutes] = workSchedule.jamKeluar.split(':');
      workEndTime = new Date(today);
      workEndTime.setHours(parseInt(hours), parseInt(minutes), 0);
    }

    const workStart = new Date(attendance.waktuMasuk);
    const workDuration = now - workStart; // milliseconds

    // Calculate overtime (work more than 8 hours)
    const isOvertime = workDuration > (8 * 60 * 60 * 1000);
    const overtimeHours = isOvertime
      ? parseFloat(((workDuration - (8 * 60 * 60 * 1000)) / (1000 * 60 * 60)).toFixed(2))
      : 0;

    const totalHours = parseFloat((workDuration / (1000 * 60 * 60)).toFixed(2));

    // 9. Update attendance record
    const updatedAttendance = await prisma.absensiPegawai.update({
      where: { id: attendance.id },
      data: {
        waktuKeluar: now,
        latitudeKeluar: latitude,
        longitudeKeluar: longitude,
        fotoKeluar: photoUrl,
        faceRecognitionKeluar: true,  // Boolean, not JSON
        faceMatchScoreKeluar: parseFloat((faceVerifyResult.similarity * 100).toFixed(2)),  // Decimal as percentage
        isLembur: isOvertime,
        jamLembur: overtimeHours,
        jamKerja: totalHours,
        statusKehadiran: isOvertime ? "lembur" : attendance.statusKehadiran
      }
    });

    logger.info("Clock out successful", {
      userId,
      attendanceId: attendance.id,
      faceMatchScore: faceVerifyResult.similarity,
      workHours: totalHours,
      overtime: overtimeHours
    });

    return updatedAttendance;

  } catch (error) {
    logger.error("Clock out failed", { userId, error: error.message });
    throw error;
  }
};

/**
 * Verify face against stored embedding
 * @param {Array|string} storedEmbedding - Stored face embedding array or JSON string
 * @param {Buffer} photoBuffer - Photo buffer to verify
 * @param {string} userId - User ID for logging
 * @returns {Promise<Object>} Face verification result
 */
const verifyFace = async (storedEmbedding, photoBuffer, userId) => {
  try {
    // Parse stored embedding if it's a string
    const embedding = typeof storedEmbedding === "string"
      ? JSON.parse(storedEmbedding)
      : storedEmbedding;

    // Create form data
    const formData = new FormData();
    formData.append("image", photoBuffer, "photo.jpg");
    formData.append("stored_embedding", JSON.stringify(embedding));
    formData.append("user_id", userId);

    // Call face recognition service
    const response = await faceServiceClient.post("/api/face/verify", formData, {
      headers: {
        ...formData.getHeaders()
      }
    });

    if (response.data.success) {
      return response.data;
    } else {
      throw new ResponseError(400, response.data.message || "Face verification failed");
    }

  } catch (error) {
    logger.error("Face verification error", { userId, error: error.message });
    throw new ResponseError(500, "Face recognition service error: " + error.message);
  }
};

/**
 * Check liveness of a photo
 * @param {Buffer} photoBuffer - Photo buffer
 * @returns {Promise<Object>} Liveness check result
 */
const checkLiveness = async (photoBuffer) => {
  try {
    // Create form data
    const formData = new FormData();
    formData.append("image", photoBuffer, "photo.jpg");

    // Call liveness detection service
    const response = await faceServiceClient.post("/api/face/liveness/check", formData, {
      headers: {
        ...formData.getHeaders()
      }
    });

    if (response.data.success) {
      return response.data;
    } else {
      throw new ResponseError(400, response.data.message || "Liveness check failed");
    }

  } catch (error) {
    logger.error("Liveness check error", { error: error.message });
    throw new ResponseError(500, "Liveness detection service error: " + error.message);
  }
};

/**
 * Check liveness of a video (sequence of frames)
 * @param {Buffer[]} frameBuffers - Array of photo buffers
 * @returns {Promise<Object>} Liveness check result
 */
const checkLivenessVideo = async (frameBuffers) => {
  try {
    // Create form data
    const formData = new FormData();
    
    // Append each frame as "images" (matches FastAPI endpoint List[UploadFile])
    frameBuffers.forEach((buffer, index) => {
      formData.append("images", buffer, `frame_${index}.jpg`);
    });

    // Call liveness detection service (check-video endpoint)
    const response = await faceServiceClient.post("/api/face/liveness/check-video", formData, {
      headers: {
        ...formData.getHeaders()
      }
    });

    if (response.data.success) {
      return response.data;
    } else {
      throw new ResponseError(400, response.data.message || "Video liveness check failed");
    }

  } catch (error) {
    logger.error("Video liveness check error", { error: error.message });
    throw new ResponseError(500, "Liveness detection service error: " + error.message);
  }
};

/**
 * Register user face
 * @param {string} userId - User ID
 * @param {Buffer} photo - Photo buffer
 * @returns {Promise<Object>} Face registration result
 */
const registerFace = async (userId, photo) => {
  try {
    // Create form data
    const formData = new FormData();
    formData.append("image", photo, "photo.jpg");
    formData.append("user_id", userId);

    // Call face recognition service
    const response = await faceServiceClient.post("/api/face/register", formData, {
      headers: {
        ...formData.getHeaders()
      }
    });

    if (response.data.success) {
      // Update user face data in database
      const photoUrl = await uploadFileToSupabase(photo);

      logger.info("Photo URL: ", photoUrl);

      await prisma.user.update({
        where: { id: userId },
        data: {
          faceDataJson: JSON.stringify(response.data.embedding),
          faceImageUrl: photoUrl
        }
      });

      logger.info("Face registered successfully", { userId });

      return {
        success: true,
        embedding: response.data.embedding,
        faceImageUrl: photoUrl,
        message: "Face registered successfully"
      };
    } else {
      throw new ResponseError(400, response.data.message || "Face registration failed");
    }

  } catch (error) {
    logger.error("Face registration error", { userId, error: error.message });
    throw new ResponseError(500, "Face recognition service error: " + error.message);
  }
};

/**
 * Get today's attendance for a user
 * @param {string} userId - User ID
 * @param {string} cabangId - Branch ID
 * @returns {Promise<Object|null>} Today's attendance record
 */
const getTodayAttendance = async (userId, cabangId) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await prisma.absensiPegawai.findFirst({
      where: {
        userId,
        cabangId,
        tanggalAbsensi: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      },
      include: {
        lokasiAbsensi: {
          select: {
            id: true,
            nama: true,  // Changed from nama_lokasi to nama (Prisma handles mapping)
            alamat: true
          }
        }
      }
    });

    return attendance;

  } catch (error) {
    logger.error("Get today's attendance error", { userId, error: error.message });
    throw error;
  }
};

/**
 * Get attendance history with pagination
 * @param {Object} filters - Query filters
 * @param {string} filters.userId - User ID (optional, for admin to view specific user)
 * @param {string} filters.cabangId - Branch ID (required)
 * @param {Date} filters.startDate - Start date
 * @param {Date} filters.endDate - End date
 * @param {string} filters.status - Attendance status filter
 * @param {number} filters.page - Page number
 * @param {number} filters.limit - Items per page
 * @returns {Promise<Object>} Paginated attendance history
 */
const getAttendanceHistory = async (filters) => {
  const {
    userId,
    cabangId,
    startDate,
    endDate,
    status,
    page = 1,
    limit = 20
  } = filters;

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = { cabangId };

    if (userId) {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.tanggalAbsensi = {};
      if (startDate) {
        where.tanggalAbsensi.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.tanggalAbsensi.lte = end;
      }
    }

    if (status) {
      where.statusKehadiran = status;
    }

    // Get total count
    const total = await prisma.absensiPegawai.count({ where });

    // Get records
    const records = await prisma.absensiPegawai.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            nama: true,
            email: true
          }
        },
        lokasiAbsensi: {
          select: {
            id: true,
            nama: true,
            alamat: true
          }
        }
      },
      orderBy: {
        tanggalAbsensi: "desc"
      },
      skip,
      take: parseInt(limit)
    });

    return {
      data: records,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };

  } catch (error) {
    logger.error("Get attendance history error", { filters, error: error.message });
    throw error;
  }
};

/**
 * Get attendance statistics
 * @param {Object} filters - Query filters
 * @param {string} filters.cabangId - Branch ID (required)
 * @param {Date} filters.startDate - Start date
 * @param {Date} filters.endDate - End date
 * @returns {Promise<Object>} Attendance statistics
 */
const getAttendanceStatistics = async (filters) => {
  const { cabangId, startDate, endDate } = filters;

  try {
    // Build date filter
    const dateFilter = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    // Get counts by status
    const stats = await prisma.absensiPegawai.groupBy({
      by: ["statusKehadiran"],
      where: {
        cabangId,
        ...(Object.keys(dateFilter).length > 0 ? { tanggalAbsensi: dateFilter } : {})
      },
      _count: {
        id: true
      }
    });

    // Format stats
    const statistics = {
      hadir: 0,
      terlambat: 0,
      izin: 0,
      sakit: 0,
      cuti: 0,
      tanpa_keterangan: 0,
      lembur: 0
    };

    stats.forEach(stat => {
      statistics[stat.statusKehadiran] = stat._count.id;
    });

    // Calculate totals
    const totalPresent = statistics.hadir + statistics.terlambat;
    const totalAbsent = statistics.izin + statistics.sakit + statistics.cuti + statistics.tanpa_keterangan;
    const totalRecords = totalPresent + totalAbsent + statistics.lembur;
    const attendanceRate = totalRecords > 0 ? (totalPresent / totalRecords) * 100 : 0;

    return {
      statistics,
      summary: {
        totalPresent,
        totalAbsent,
        totalRecords,
        attendanceRate: Math.round(attendanceRate * 10) / 10
      }
    };

  } catch (error) {
    logger.error("Get attendance statistics error", { filters, error: error.message });
    throw error;
  }
};

/**
 * Verify if user can access attendance location
 * @param {string} userId - User ID
 * @param {string} lokasiAbsensiId - Location ID
 * @param {number} latitude - User's latitude
 * @param {number} longitude - User's longitude
 * @returns {Promise<Object>} Verification result
 */
const verifyAttendanceLocation = async (userId, lokasiAbsensiId, latitude, longitude) => {
  try {
    // Get location
    const location = await prisma.lokasiAbsensi.findUnique({
      where: { id: lokasiAbsensiId }
    });

    if (!location) {
      throw new ResponseError(404, "Attendance location not found");
    }

    if (!location.isActive) {
      return {
        canAccess: false,
        reason: "Location is not active"
      };
    }

    // Check assignment (using lokasiId field name)
    const userLocation = await prisma.userLokasiAbsensi.findFirst({
      where: {
        userId,
        lokasiId: lokasiAbsensiId
      }
    });

    // If location requires assignment and user is not assigned
    // Note: Removed isRequireAssignment logic - check if user has explicit assignment
    // If no assignments exist for this user to any location, allow access to active locations

    // Check geofencing
    const distance = haversineDistance(
      latitude, longitude,
      Number(location.latitude),
      Number(location.longitude)
    );

    if (distance > location.radius) {
      return {
        canAccess: false,
        reason: "Outside geofence area",
        distance: Math.round(distance),
        maxDistance: location.radius
      };
    }

    return {
      canAccess: true,
      distance: Math.round(distance),
      location: {
        id: location.id,
        name: location.nama,
        address: location.alamat
      }
    };

  } catch (error) {
    logger.error("Verify attendance location error", { userId, lokasiAbsensiId, error: error.message });
    throw error;
  }
};

module.exports = {
  clockIn,
  clockOut,
  verifyFace,
  checkLiveness,
  registerFace,
  getTodayAttendance,
  getAttendanceHistory,
  getAttendanceStatistics,
  verifyAttendanceLocation
};
