const prisma = require("../config/db");
const { ResponseError } = require("../error/responseError");
const { logger } = require("../utils/logger");
const { createAuditLog } = require("../utils/auditLog");

/**
 * Create a new attendance correction request
 * @param {Object} data - Correction data
 * @param {Object} auditInfo - Audit information
 * @returns {Promise<Object>} Created correction request
 */
const createKoreksi = async (data, auditInfo) => {
  const { absensiId, alasan, waktuMasukBaru, waktuKeluarBaru, statusBaru } = data;
  const { userId, ipAddress } = auditInfo;

  try {
    // Get the attendance record
    const absensi = await prisma.absensiPegawai.findUnique({
      where: { id: absensiId },
    });

    if (!absensi) {
      throw new ResponseError(404, "Attendance record not found");
    }

    // Check if user owns this attendance record (or is admin)
    if (absensi.userId !== userId) {
      // Check if user has permission to correct others' attendance
      const isAdmin = await checkIsAdmin(userId);
      if (!isAdmin) {
        throw new ResponseError(403, "You can only submit correction for your own attendance");
      }
    }

    // Check if attendance date is within H+7 (7 days after attendance date)
    const attendanceDate = new Date(absensi.tanggalAbsensi);
    const today = new Date();
    const daysDiff = Math.floor((today - attendanceDate) / (1000 * 60 * 60 * 24));

    if (daysDiff > 7) {
      throw new ResponseError(
        400,
        `Corrections can only be submitted within 7 days. This attendance is from ${daysDiff} days ago.`
      );
    }

    // Check if there's already a pending correction for this attendance
    const existingPending = await prisma.koreksi_absensi.findFirst({
      where: {
        absensi_id: absensiId,
        status: "pending",
      },
    });

    if (existingPending) {
      throw new ResponseError(
        400,
        "There's already a pending correction request for this attendance. Please wait for it to be processed."
      );
    }

    // Create the correction request
    const koreksi = await prisma.koreksi_absensi.create({
      data: {
        absensi_id: absensiId,
        user_id: userId,
        alasan,
        waktu_masuk_baru: waktuMasukBaru,
        waktu_keluar_baru: waktuKeluarBaru,
        status_baru: statusBaru,
        status: "pending",
      },
      include: {
        absensi_pegawai: {
          select: {
            id: true,
            tanggalAbsensi: true,
            waktuMasuk: true,
            waktuKeluar: true,
            status_kehadiran: true,
            user: {
              select: {
                id: true,
                namaLengkap: true,
              },
            },
          },
        },
      },
    });

    // Create audit log
    await createAuditLog({
      userId,
      ipAddress,
      action: "CREATE_KOREKSI_ABSENSI",
      tableName: "koreksi_absensi",
      recordId: koreksi.koreksi_id,
      oldValue: null,
      newValue: JSON.stringify({
        absensiId,
        alasan,
        waktuMasukBaru,
        waktuKeluarBaru,
        statusBaru,
      }),
    });

    logger.info("Attendance correction request created", {
      koreksiId: koreksi.koreksi_id,
      absensiId,
      userId,
    });

    return koreksi;
  } catch (error) {
    logger.error("Create attendance correction failed", { error: error.message, data });
    throw error;
  }
};

/**
 * Get correction requests with filtering
 * @param {Object} filters - Query filters
 * @returns {Promise<Object>} Paginated correction requests
 */
const getKoreksi = async (filters) => {
  const { userId, cabangId, status, tanggalMulai, tanggalSelesai, page = 1, limit = 20 } = filters;

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {};

    if (userId) {
      where.user_id = userId;
    }

    if (cabangId) {
      // Filter by attendance's cabangId
      where.absensi_pegawai = {
        cabangId: cabangId,
      };
    }

    if (status) {
      where.status = status;
    }

    if (tanggalMulai || tanggalSelesai) {
      where.created_at = {};
      if (tanggalMulai) {
        where.created_at.gte = new Date(tanggalMulai);
      }
      if (tanggalSelesai) {
        where.created_at.lte = new Date(tanggalSelesai);
      }
    }

    // Get total count
    const total = await prisma.koreksi_absensi.count({ where });

    // Get records
    const koreksiList = await prisma.koreksi_absensi.findMany({
      where,
      include: {
        absensi_pegawai: {
          select: {
            id: true,
            tanggalAbsensi: true,
            waktuMasuk: true,
            waktuKeluar: true,
            jamKerja: true,
            jamLembur: true,
            status_kehadiran: true,
            cabang: {
              select: {
                id: true,
                namaCabang: true,
              },
            },
          },
        },
        user_koreksi_absensi_user_idTouser: {
          select: {
            id: true,
            namaLengkap: true,
            email: true,
          },
        },
        user_koreksi_absensi_approved_byTouser: {
          select: {
            id: true,
            namaLengkap: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
      skip,
      take: parseInt(limit),
    });

    return {
      data: koreksiList,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  } catch (error) {
    logger.error("Get correction requests failed", { error: error.message, filters });
    throw error;
  }
};

/**
 * Get a single correction request by ID
 * @param {string} koreksiId - Correction ID
 * @returns {Promise<Object>} Correction request details
 */
const getKoreksiById = async (koreksiId) => {
  try {
    const koreksi = await prisma.koreksi_absensi.findUnique({
      where: { koreksi_id: koreksiId },
      include: {
        absensi_pegawai: {
          select: {
            id: true,
            tanggalAbsensi: true,
            waktuMasuk: true,
            waktuKeluar: true,
            jamKerja: true,
            jamLembur: true,
            isLembur: true,
            status_kehadiran: true,
            keterangan: true,
            cabang: {
              select: {
                id: true,
                namaCabang: true,
              },
            },
            user: {
              select: {
                id: true,
                namaLengkap: true,
                email: true,
              },
            },
          },
        },
        user_koreksi_absensi_user_idTouser: {
          select: {
            id: true,
            namaLengkap: true,
            email: true,
          },
        },
        user_koreksi_absensi_approved_byTouser: {
          select: {
            id: true,
            namaLengkap: true,
          },
        },
      },
    });

    if (!koreksi) {
      throw new ResponseError(404, "Correction request not found");
    }

    return koreksi;
  } catch (error) {
    logger.error("Get correction by ID failed", { error: error.message, koreksiId });
    throw error;
  }
};

/**
 * Approve a correction request
 * @param {string} koreksiId - Correction ID
 * @param {Object} data - Approval data
 * @param {Object} auditInfo - Audit information
 * @returns {Promise<Object>} Updated attendance record
 */
const approveKoreksi = async (koreksiId, data, auditInfo) => {
  const { catatanApprover } = data;
  const { userId: approverId, ipAddress } = auditInfo;

  try {
    // Get the correction request
    const koreksi = await prisma.koreksi_absensi.findUnique({
      where: { koreksi_id: koreksiId },
      include: {
        absensi_pegawai: true,
      },
    });

    if (!koreksi) {
      throw new ResponseError(404, "Correction request not found");
    }

    if (koreksi.status !== "pending") {
      throw new ResponseError(400, `Correction request is already ${koreksi.status}`);
    }

    // Save old values for audit
    const oldValues = {
      waktuMasuk: koreksi.absensi_pegawai.waktuMasuk,
      waktuKeluar: koreksi.absensi_pegawai.waktuKeluar,
      status_kehadiran: koreksi.absensi_pegawai.status_kehadiran,
      jamKerja: koreksi.absensi_pegawai.jamKerja,
      jamLembur: koreksi.absensi_pegawai.jamLembur,
      isLembur: koreksi.absensi_pegawai.isLembur,
    };

    // Update attendance record with correction data
    const updateData = {};
    if (koreksi.waktu_masuk_baru) {
      updateData.waktuMasuk = koreksi.waktu_masuk_baru;
    }
    if (koreksi.waktu_keluar_baru) {
      updateData.waktuKeluar = koreksi.waktu_keluar_baru;
    }
    if (koreksi.status_baru) {
      updateData.status_kehadiran = koreksi.status_baru;
    }

    // Recalculate work hours if times were changed
    if (koreksi.waktu_masuk_baru && koreksi.waktu_keluar_baru) {
      const workDuration = koreksi.waktu_keluar_baru - koreksi.waktu_masuk_baru;
      const totalHours = parseFloat((workDuration / (1000 * 60 * 60)).toFixed(2));

      // Get original schedule for normal work hours calculation
      const attendanceDate = new Date(koreksi.absensi_pegawai.tanggalAbsensi);
      const workSchedule = await prisma.jadwalKerja.findFirst({
        where: {
          userId: koreksi.absensi_pegawai.userId,
          cabangId: koreksi.absensi_pegawai.cabangId,
          tanggalMulai: { lte: attendanceDate },
          tanggalSelesai: { gte: attendanceDate },
        },
        include: {
          master_shift: {
            select: {
              jamMasuk: true,
              jamKeluar: true,
            },
          },
        },
      });

      let normalWorkHours = 8; // Default
      if (workSchedule && workSchedule.master_shift) {
        const [jamMasukHours, jamMasukMinutes] = workSchedule.master_shift.jamMasuk.split(':').map(Number);
        const [jamKeluarHours, jamKeluarMinutes] = workSchedule.master_shift.jamKeluar.split(':').map(Number);
        const jamMasukTime = jamMasukHours * 60 + jamMasukMinutes;
        const jamKeluarTime = jamKeluarHours * 60 + jamKeluarMinutes;

        if (jamKeluarTime <= jamMasukTime) {
          normalWorkHours = (jamKeluarTime + (24 * 60) - jamMasukTime) / 60;
        } else {
          normalWorkHours = (jamKeluarTime - jamMasukTime) / 60;
        }
      }

      const overtimeBufferMinutes = 5;
      const normalWorkDurationMs = (normalWorkHours * 60 * 60 * 1000) - (overtimeBufferMinutes * 60 * 1000);
      const isOvertime = workDuration > normalWorkDurationMs;
      const overtimeHours = isOvertime
        ? parseFloat(((workDuration - normalWorkDurationMs) / (1000 * 60 * 60)).toFixed(2))
        : 0;

      updateData.jamKerja = totalHours;
      updateData.isLembur = isOvertime;
      updateData.jamLembur = overtimeHours;
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Update attendance record
      const updatedAbsensi = await tx.absensiPegawai.update({
        where: { id: koreksi.absensi_id },
        data: updateData,
      });

      // Update correction request status
      const updatedKoreksi = await tx.koreksi_absensi.update({
        where: { koreksi_id: koreksiId },
        data: {
          status: "disetujui",
          approved_by: approverId,
          approved_at: new Date(),
          catatan_approver: catatanApprover,
        },
      });

      return { updatedAbsensi, updatedKoreksi };
    });

    // Create audit log for attendance update
    await createAuditLog({
      userId: approverId,
      ipAddress,
      action: "UPDATE_ABSENSI_VIA_KOREKSI",
      tableName: "absensi_pegawai",
      recordId: koreksi.absensi_id,
      oldValue: JSON.stringify(oldValues),
      newValue: JSON.stringify(updateData),
    });

    // Create audit log for correction approval
    await createAuditLog({
      userId: approverId,
      ipAddress,
      action: "APPROVE_KOREKSI",
      tableName: "koreksi_absensi",
      recordId: koreksiId,
      oldValue: JSON.stringify({ status: "pending" }),
      newValue: JSON.stringify({ status: "disetujui" }),
    });

    logger.info("Attendance correction approved", {
      koreksiId,
      absensiId: koreksi.absensi_id,
      approvedBy: approverId,
    });

    // TODO: Send notification to the employee who requested the correction

    return result;
  } catch (error) {
    logger.error("Approve correction failed", { error: error.message, koreksiId, data });
    throw error;
  }
};

/**
 * Reject a correction request
 * @param {string} koreksiId - Correction ID
 * @param {Object} data - Rejection data
 * @param {Object} auditInfo - Audit information
 * @returns {Promise<Object>} Updated correction request
 */
const rejectKoreksi = async (koreksiId, data, auditInfo) => {
  const { catatanApprover } = data;
  const { userId: approverId, ipAddress } = auditInfo;

  try {
    // Get the correction request
    const koreksi = await prisma.koreksi_absensi.findUnique({
      where: { koreksi_id: koreksiId },
    });

    if (!koreksi) {
      throw new ResponseError(404, "Correction request not found");
    }

    if (koreksi.status !== "pending") {
      throw new ResponseError(400, `Correction request is already ${koreksi.status}`);
    }

    // Update correction request status
    const updatedKoreksi = await prisma.koreksi_absensi.update({
      where: { koreksi_id: koreksiId },
      data: {
        status: "ditolak",
        approved_by: approverId,
        approved_at: new Date(),
        catatan_approver: catatanApprover,
      },
    });

    // Create audit log
    await createAuditLog({
      userId: approverId,
      ipAddress,
      action: "REJECT_KOREKSI",
      tableName: "koreksi_absensi",
      recordId: koreksiId,
      oldValue: JSON.stringify({ status: "pending" }),
      newValue: JSON.stringify({ status: "ditolak", catatanApprover }),
    });

    logger.info("Attendance correction rejected", {
      koreksiId,
      approvedBy: approverId,
      reason: catatanApprover,
    });

    // TODO: Send notification to the employee about the rejection

    return updatedKoreksi;
  } catch (error) {
    logger.error("Reject correction failed", { error: error.message, koreksiId, data });
    throw error;
  }
};

/**
 * Cancel a correction request (by the requester)
 * @param {string} koreksiId - Correction ID
 * @param {Object} auditInfo - Audit information
 * @returns {Promise<Object>} Updated correction request
 */
const cancelKoreksi = async (koreksiId, auditInfo) => {
  const { userId, ipAddress } = auditInfo;

  try {
    // Get the correction request
    const koreksi = await prisma.koreksi_absensi.findUnique({
      where: { koreksi_id: koreksiId },
    });

    if (!koreksi) {
      throw new ResponseError(404, "Correction request not found");
    }

    // Only the requester can cancel
    if (koreksi.user_id !== userId) {
      throw new ResponseError(403, "You can only cancel your own correction request");
    }

    if (koreksi.status !== "pending") {
      throw new ResponseError(400, `Cannot cancel correction with status: ${koreksi.status}`);
    }

    // Update correction request status
    const updatedKoreksi = await prisma.koreksi_absensi.update({
      where: { koreksi_id: koreksiId },
      data: {
        status: "dibatalkan",
      },
    });

    // Create audit log
    await createAuditLog({
      userId,
      ipAddress,
      action: "CANCEL_KOREKSI",
      tableName: "koreksi_absensi",
      recordId: koreksiId,
      oldValue: JSON.stringify({ status: "pending" }),
      newValue: JSON.stringify({ status: "dibatalkan" }),
    });

    logger.info("Attendance correction cancelled", {
      koreksiId,
      cancelledBy: userId,
    });

    return updatedKoreksi;
  } catch (error) {
    logger.error("Cancel correction failed", { error: error.message, koreksiId });
    throw error;
  }
};

/**
 * Create a manual attendance request (for "forgot to clock in" scenarios)
 * Creates a placeholder AbsensiPegawai + koreksi_absensi record for approval
 * @param {Object} data - Manual attendance data
 * @param {Object} auditInfo - Audit information
 * @returns {Promise<Object>} Created correction request
 */
const createAbsensiManual = async (data, auditInfo) => {
  const { tanggal, waktuMasuk, waktuKeluar, alasan, lokasiAbsensiId } = data;
  const { userId, cabangId, ipAddress } = auditInfo;

  try {
    const targetDate = new Date(tanggal);
    targetDate.setHours(0, 0, 0, 0);

    // 1. Validate date is not in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (targetDate > today) {
      throw new ResponseError(400, "Tanggal tidak boleh di masa depan.");
    }

    // 2. Validate within H+7
    const daysDiff = Math.floor((today - targetDate) / (1000 * 60 * 60 * 24));
    if (daysDiff > 7) {
      throw new ResponseError(400,
        `Pengajuan hanya bisa dilakukan dalam 7 hari. Absensi ini dari ${daysDiff} hari yang lalu.`
      );
    }

    // 3. Check if work schedule exists for that date
    const workSchedule = await prisma.jadwalKerja.findFirst({
      where: {
        userId,
        cabangId,
        tanggalMulai: { lte: targetDate },
        tanggalSelesai: { gte: targetDate },
      },
      include: {
        master_shift: {
          select: {
            id: true,
            namaShift: true,
            jamMasuk: true,
            jamKeluar: true,
          },
        },
      },
    });

    if (!workSchedule) {
      throw new ResponseError(400,
        "Tidak ada jadwal kerja untuk tanggal tersebut. Hubungi admin untuk mengatur jadwal."
      );
    }

    if (workSchedule.tipe_jadwal === "libur") {
      throw new ResponseError(400, "Tanggal tersebut adalah jadwal libur Anda.");
    }

    // 4. Check if attendance already exists for that date
    const existingAttendance = await prisma.absensiPegawai.findFirst({
      where: {
        userId,
        cabangId,
        tanggalAbsensi: {
          gte: targetDate,
          lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    if (existingAttendance) {
      throw new ResponseError(400,
        "Sudah ada record absensi untuk tanggal tersebut. Gunakan fitur koreksi absensi biasa."
      );
    }

    // 5. Check for existing pending manual request for the same date
    const existingPending = await prisma.koreksi_absensi.findFirst({
      where: {
        user_id: userId,
        status: "pending",
        absensi_pegawai: {
          tanggalAbsensi: {
            gte: targetDate,
            lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000),
          },
        },
      },
    });

    if (existingPending) {
      throw new ResponseError(400,
        "Sudah ada pengajuan absensi manual pending untuk tanggal tersebut."
      );
    }

    // 6. Create placeholder attendance + koreksi in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create placeholder AbsensiPegawai with "tanpa_keterangan" status
      const placeholder = await tx.absensiPegawai.create({
        data: {
          userId,
          cabangId,
          lokasiAbsensiId: lokasiAbsensiId || null,
          tanggalAbsensi: targetDate,
          waktuMasuk: new Date(waktuMasuk),
          waktuKeluar: new Date(waktuKeluar),
          status_kehadiran: "tanpa_keterangan", // Will be updated on approval
          fotoMasuk: null,
          fotoKeluar: null,
          faceRecognitionMasuk: false,
          faceRecognitionKeluar: false,
          shiftId: workSchedule?.master_shift?.id || null,
          keterangan: `Pengajuan absensi manual: ${alasan}`,
        },
      });

      // Create koreksi_absensi record pointing to the placeholder
      const koreksi = await tx.koreksi_absensi.create({
        data: {
          absensi_id: placeholder.id,
          user_id: userId,
          alasan: `[Absensi Manual] ${alasan}`,
          waktu_masuk_baru: new Date(waktuMasuk),
          waktu_keluar_baru: new Date(waktuKeluar),
          status_baru: "hadir",
          status: "pending",
        },
        include: {
          absensi_pegawai: {
            select: {
              id: true,
              tanggalAbsensi: true,
              waktuMasuk: true,
              waktuKeluar: true,
              status_kehadiran: true,
              user: {
                select: {
                  id: true,
                  namaLengkap: true,
                },
              },
            },
          },
        },
      });

      return { placeholder, koreksi };
    });

    // Create audit log
    await createAuditLog({
      userId,
      ipAddress,
      action: "CREATE_ABSENSI_MANUAL",
      tableName: "koreksi_absensi",
      recordId: result.koreksi.koreksi_id,
      oldValue: null,
      newValue: JSON.stringify({
        tanggal,
        waktuMasuk,
        waktuKeluar,
        alasan,
      }),
    });

    logger.info("Manual attendance request created", {
      koreksiId: result.koreksi.koreksi_id,
      absensiId: result.placeholder.id,
      userId,
      tanggal,
    });

    return result.koreksi;
  } catch (error) {
    logger.error("Create manual attendance failed", { error: error.message, data });
    throw error;
  }
};

/**
 * Helper function to check if user is admin
 */
const checkIsAdmin = async (userId) => {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: true,
    },
  });

  return userRoles.some(
    (ur) => ur.role.namaRole === "admin_cabang" || ur.role.namaRole === "super_admin"
  );
};

module.exports = {
  createKoreksi,
  getKoreksi,
  getKoreksiById,
  approveKoreksi,
  rejectKoreksi,
  cancelKoreksi,
  createAbsensiManual,
};
