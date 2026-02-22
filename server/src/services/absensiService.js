const { prisma, faceServiceClient } = require("../config/db");
const { logger } = require("../utils/logger");
const { haversineDistance, isValidCoordinates } = require("../utils/geoUtils");
const { ResponseError } = require("../error/responseError");
const FormData = require("form-data");
const { uploadBufferToSupabase } = require("../utils/uploadToSupabase");

// Constants
const DEFAULT_LATE_THRESHOLD = parseInt(process.env.DEFAULT_LATE_THRESHOLD) || 15; // minutes
const MAX_EARLY_MINUTES = parseInt(process.env.MAX_EARLY_CLOCK_IN) || 60; // minutes before shift start

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
        lokasiId: lokasiAbsensiId
      }
    });

    if (!userLocation) {
      throw new ResponseError(403, "Anda tidak terdaftar di lokasi absensi ini. Hubungi admin untuk mengatur lokasi.");
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

    // 4. Process photo and verify face
    const photoBuffer = Buffer.isBuffer(photo) ? photo : Buffer.from(photo, "base64");

    // 4a. Verify face
    const faceVerifyResult = await verifyFace(user.faceDataJson, photoBuffer, userId);

    if (!faceVerifyResult.is_match) {
      throw new ResponseError(
        400,
        `Face verification failed. Similarity: ${(faceVerifyResult.similarity * 100).toFixed(1)}%`
      );
    }

    // 4b. Check face match score against location threshold
    const minScore = location.minFaceMatchScore
      ? parseFloat(location.minFaceMatchScore)
      : 60;
    const matchScore = faceVerifyResult.similarity * 100;
    if (matchScore < minScore) {
      throw new ResponseError(
        400,
        `Face match terlalu rendah: ${matchScore.toFixed(1)}% (minimum: ${minScore}%)`
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
    const photoUrl = await uploadBufferToSupabase(photoBuffer);

    logger.info("Photo uploaded", { photoUrl });

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
    // Query user's work schedule with related MasterShift for toleransi_terlambat
    const now = new Date();

    // Check if user has a work schedule (JadwalKerja) for today
    const workSchedule = await prisma.jadwalKerja.findFirst({
      where: {
        userId,
        cabangId,
        tanggalMulai: { lte: today },
        tanggalSelesai: { gte: today }
      },
      include: {
        master_shift: {
          select: {
            id: true,
            namaShift: true,
            toleransiTerlambat: true,
          }
        }
      }
    });

    // 7a. Require work schedule
    if (!workSchedule) {
      throw new ResponseError(400,
        "Anda belum memiliki jadwal kerja untuk hari ini. Hubungi admin untuk mengatur jadwal."
      );
    }

    // 7b. Block if schedule is libur
    if (workSchedule.tipe_jadwal === "libur") {
      throw new ResponseError(400, "Hari ini adalah jadwal libur Anda.");
    }

    let isLate = false;
    let lateMinutes = 0;
    let lateThreshold = DEFAULT_LATE_THRESHOLD; // Default threshold

    // Determine the work start time and late threshold from schedule
    if (workSchedule.jamMasuk) {
      const [hours, minutes] = workSchedule.jamMasuk.split(':');
      const workStartTime = new Date(today);
      workStartTime.setHours(parseInt(hours), parseInt(minutes), 0);

      // 7c. Check if clock-in is too early
      const earlyMinutes = Math.round((workStartTime - now) / (1000 * 60));
      if (earlyMinutes > MAX_EARLY_MINUTES) {
        throw new ResponseError(400,
          `Belum bisa absen. Jam kerja dimulai pukul ${workSchedule.jamMasuk}, Anda hanya bisa absen ${MAX_EARLY_MINUTES} menit sebelumnya.`
        );
      }

      // Use master shift's toleransiTerlambat if shift is assigned, otherwise use default
      if (workSchedule.master_shift && workSchedule.master_shift.toleransiTerlambat !== undefined) {
        lateThreshold = workSchedule.master_shift.toleransiTerlambat;
      }

      // Late = arrived after start time + tolerance
      const workStartWithTolerance = new Date(workStartTime.getTime() + lateThreshold * 60 * 1000);
      isLate = now > workStartWithTolerance;
      lateMinutes = now > workStartTime ? Math.round((now - workStartTime) / (1000 * 60)) : 0;
    }

    // Set status kehadiran based on late threshold
    let statusKehadiran = "hadir";
    if (isLate) {
      statusKehadiran = "hadir_terlambat";
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
        status_kehadiran: statusKehadiran,
        latitudeMasuk: latitude,
        longitudeMasuk: longitude,
        fotoMasuk: photoUrl,
        faceRecognitionMasuk: true,  // Boolean, not JSON
        faceMatchScoreMasuk: parseFloat((faceVerifyResult.similarity * 100).toFixed(2)),  // Decimal as percentage
        shiftId: workSchedule?.master_shift?.id || null,
        keterangan: isLate ? `Terlambat ${lateMinutes} menit (toleransi: ${lateThreshold} menit)` : null
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
      select: { faceDataJson: true, faceImageUrl: true, namaLengkap: true }
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
        400,
        `Face verification failed. Similarity: ${(faceVerifyResult.similarity * 100).toFixed(1)}%`
      );
    }

    // 6. Check liveness if required
    // if (location.requireFaceRecognition) {
    //   // Prioritize video liveness check if frames are available
    //   if (data.frames && data.frames.length > 0) {
    //     logger.info("Performing multi-frame liveness check (Clock Out)", { frameCount: data.frames.length });
        
    //     // Convert frames to buffers
    //     const frameBuffers = data.frames.map(frame => 
    //       Buffer.isBuffer(frame) ? frame : Buffer.from(frame, "base64")
    //     );
        
    //     const livenessResult = await checkLivenessVideo(frameBuffers);
        
    //     if (!livenessResult.is_live) {
    //       throw new ResponseError(
    //         400,
    //         `Liveness check failed. ${livenessResult.message || "Please ensure you are using a real face."}`
    //       );
    //     }
    //   } else {
    //     const livenessResult = await checkLiveness(photoBuffer);

    //     if (!livenessResult.is_live) {
    //       throw new ResponseError(
    //         400,
    //         "Liveness check failed. Please ensure you are using a real face, not a photo."
    //       );
    //     }
    //   }
    // }

    // 7. Upload photo
    const photoUrl = await uploadBufferToSupabase(photoBuffer);

    // 8. Calculate work duration and overtime based on schedule
    const now = new Date();

    // Check work schedule for shift details
    const workSchedule = await prisma.jadwalKerja.findFirst({
      where: {
        userId,
        cabangId,
        tanggalMulai: { lte: today },
        tanggalSelesai: { gte: today }
      },
      include: {
        master_shift: {
          select: {
            id: true,
            namaShift: true,
            toleransiTerlambat: true,
            isOvernight: true,
          }
        }
      }
    });

    const workStart = new Date(attendance.waktuMasuk);
    const workDuration = now - workStart; // milliseconds
    const totalHours = parseFloat((workDuration / (1000 * 60 * 60)).toFixed(2));

    // Calculate normal work hours from schedule
    let normalWorkHours = 8; // Default 8 hours if no schedule
    let workEndTime = null;
    let isOvernightShift = false;
    let earlyDepartureMinutes = 0;

    if (workSchedule && workSchedule.jamMasuk && workSchedule.jamKeluar) {
      const [jamMasukHours, jamMasukMinutes] = workSchedule.jamMasuk.split(':').map(Number);
      const [jamKeluarHours, jamKeluarMinutes] = workSchedule.jamKeluar.split(':').map(Number);

      const jamMasukTime = jamMasukHours * 60 + jamMasukMinutes;
      const jamKeluarTime = jamKeluarHours * 60 + jamKeluarMinutes;

      // Check if this is an overnight shift
      if (jamKeluarTime <= jamMasukTime) {
        isOvernightShift = true;
        // For overnight shift, end time is on the next day
        normalWorkHours = (jamKeluarTime + (24 * 60) - jamMasukTime) / 60; // in hours
      } else {
        normalWorkHours = (jamKeluarTime - jamMasukTime) / 60; // in hours
      }

      // Calculate scheduled end time for comparison
      workEndTime = new Date(today);
      workEndTime.setHours(jamKeluarHours, jamKeluarMinutes, 0);

      // If overnight and clock out is before the end time (on the next day),
      // we need to check if user left early
      if (isOvernightShift) {
        // For overnight shifts, the end time is technically on the next day
        // If the user clocked out before the scheduled end time (next day),
        // they left early
        const nextDayEndTime = new Date(today);
        nextDayEndTime.setDate(nextDayEndTime.getDate() + 1);
        nextDayEndTime.setHours(jamKeluarHours, jamKeluarMinutes, 0);

        if (now < nextDayEndTime) {
          earlyDepartureMinutes = Math.round((nextDayEndTime - now) / (1000 * 60));
        }
      } else {
        // For regular shifts, check if clocked out before scheduled end time
        if (now < workEndTime && now > workStart) {
          earlyDepartureMinutes = Math.round((workEndTime - now) / (1000 * 60));
        }
      }
    }

    // Calculate overtime based on actual work duration vs normal work hours
    // Use a small buffer (5 minutes) to avoid calculating overtime for short overruns
    const overtimeBufferMinutes = 5;
    const normalWorkDurationMs = (normalWorkHours * 60 * 60 * 1000) - (overtimeBufferMinutes * 60 * 1000);
    const isOvertime = workDuration > normalWorkDurationMs;
    const overtimeHours = isOvertime
      ? parseFloat(((workDuration - normalWorkDurationMs) / (1000 * 60 * 60)).toFixed(2))
      : 0;

    // Validate maximum work hours (16 hours to prevent input errors)
    const maxWorkHours = 16;
    if (totalHours > maxWorkHours) {
      logger.warn("Excessive work hours detected", {
        userId,
        totalHours,
        maxWorkHours,
      });
      // Don't throw error, just log it - admin can review and correct if needed
    }

    // 9. Update attendance record
    // Determine final status based on overtime and early departure
    let finalStatus = attendance.status_kehadiran;
    if (earlyDepartureMinutes > 5) { // 5 minute tolerance for early departure
      finalStatus = "hadir_pulang_cepat";
    } else if (isOvertime && overtimeHours > 0) {
      // Keep the original status but note that overtime was worked
      // Don't change to "lembur" as that should be a separate status
    }

    // Build keterangan with work details
    let keterangan = attendance.keterangan || "";
    if (earlyDepartureMinutes > 5) {
      keterangan += keterangan ? " | " : "";
      keterangan += `Pulang cepat ${earlyDepartureMinutes} menit`;
    }
    if (isOvertime && overtimeHours > 0) {
      keterangan += keterangan ? " | " : "";
      keterangan += `Lembur ${overtimeHours} jam`;
    }

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
        status_kehadiran: finalStatus,
        keterangan: keterangan || null
      }
    });

    logger.info("Clock out successful", {
      userId,
      attendanceId: attendance.id,
      faceMatchScore: faceVerifyResult.similarity,
      workHours: totalHours,
      overtimeHours,
      normalWorkHours,
      earlyDepartureMinutes,
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
    if (error instanceof ResponseError) throw error;
    if (error.response) {
      // Face service returned an error response
      logger.error("Face verification service error", { userId, status: error.response.status, data: error.response.data });
      throw new ResponseError(400, error.response.data?.message || "Face verification failed");
    }
    // Network/connection error
    logger.error("Face verification connection error", { userId, error: error.message });
    throw new ResponseError(503, "Face recognition service tidak tersedia. Coba lagi nanti.");
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
    // Ensure photo is a Buffer
    const photoBuffer = Buffer.isBuffer(photo) ? photo : Buffer.from(photo, "base64");

    // Create form data
    const formData = new FormData();
    formData.append("image", photoBuffer, "photo.jpg");
    formData.append("user_id", userId);

    // Call face recognition service
    const response = await faceServiceClient.post("/api/face/register", formData, {
      headers: {
        ...formData.getHeaders()
      }
    });

    if (response.data.success) {
      // Update user face data in database
      const photoUrl = await uploadBufferToSupabase(photoBuffer);

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
    limit = 40
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
      where.status_kehadiran = status;
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
            namaLengkap: true,
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
      by: ["status_kehadiran"],
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
      statistics[stat.status_kehadiran] = stat._count.id;
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
/**
 * Get face registration status for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Face status
 */
const getFaceStatus = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      faceDataJson: true,
      faceImageUrl: true,
    },
  });

  if (!user) {
    throw new ResponseError(404, "User not found");
  }

  return {
    hasRegisteredFace: !!user.faceDataJson,
    faceImageUrl: user.faceImageUrl || null,
  };
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
  verifyAttendanceLocation,
  getFaceStatus,
};
