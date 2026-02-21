const prisma = require("../config/db");
const { ResponseError } = require("../error/responseError");
const { logger } = require("../utils/logger");
const { createAuditLog } = require("../utils/auditLog");
const hariLiburService = require("./hariLiburService");

/**
 * Create a new izin (leave permission) request
 */
const createIzin = async (data, auditInfo) => {
  const { tipeIzin, cabangId, tanggalMulai, tanggalSelesai, alasan, lampiranFile } = data;
 


  try {
    const startDate = new Date(tanggalMulai);
    const endDate = new Date(tanggalSelesai);

    // Calculate jumlah hari (working days only)
    const { totalHariKerja } = await hariLiburService.hitungHariKerja(startDate, endDate);

    if (totalHariKerja <= 0) {
      throw new ResponseError(400, "Tanggal yang dipilih tidak mengandung hari kerja");
    }

    // Check for overlap with existing approved/pending izin/cuti
    const overlap = await prisma.izin_cuti.findFirst({
      where: {
        user_id: auditInfo.userId,
        status: { in: ["pending", "disetujui"] },
        OR: [
          {
            tanggal_mulai: { lte: endDate },
            tanggal_selesai: { gte: startDate },
          },
        ],
      },
    });

    if (overlap) {
      throw new ResponseError(
        400,
        `Pengajuan overlap dengan izin/cuti yang sudah ada (${overlap.tipe_izin}: ${overlap.tanggal_mulai.toISOString().split("T")[0]} - ${overlap.tanggal_selesai.toISOString().split("T")[0]})`
      );
    }

    const izin = await prisma.izin_cuti.create({
      data: {
        user_id: auditInfo.userId,
        cabang_id: cabangId,
        tipe_izin: tipeIzin,
        tanggal_mulai: startDate,
        tanggal_selesai: endDate,
        jumlah_hari: totalHariKerja,
        alasan,
        lampiran_file: lampiranFile || null,
        status: "pending",
        approved_by: auditInfo.userId, // placeholder, updated when actually approved
      },
      include: {
        user_izin_cuti_user_idTouser: {
          select: { id: true, namaLengkap: true, email: true },
        },
        cabang: {
          select: { id: true, namaCabang: true },
        },
      },
    });

    await createAuditLog(prisma, {
      userId: auditInfo.userId,
      ipAddress: auditInfo.ipAddress,
      action: "CREATE_IZIN",
      tableName: "izin_cuti",
      recordId: izin.izin_id,
      oldValue: null,
      newValue: JSON.stringify({ tipeIzin, tanggalMulai, tanggalSelesai, jumlahHari: totalHariKerja }),
    });

    logger.info("Izin request created", { izinId: izin.izin_id, tipeIzin, userId: auditInfo.userId });

    return izin;
  } catch (error) {
    logger.error("Create izin failed", { error: error.message, data });
    throw error;
  }
};

/**
 * Create a new cuti (annual leave) request with quota check
 */
const createCuti = async (data, auditInfo) => {
  const { tipeIzin, cabangId, tanggalMulai, tanggalSelesai, alasan, lampiranFile } = data;
  const { userId, ipAddress } = auditInfo;

  try {
    const startDate = new Date(tanggalMulai);
    const endDate = new Date(tanggalSelesai);
    const tahun = startDate.getFullYear();

    // Calculate jumlah hari
    const { totalHariKerja } = await hariLiburService.hitungHariKerja(startDate, endDate);

    if (totalHariKerja <= 0) {
      throw new ResponseError(400, "Tanggal yang dipilih tidak mengandung hari kerja");
    }

    // Check quota only for cuti_tahunan
    if (tipeIzin === "cuti_tahunan") {
      const kuota = await prisma.kuota_cuti.findUnique({
        where: {
          user_id_tahun: { user_id: userId, tahun },
        },
      });

      if (!kuota) {
        throw new ResponseError(400, `Kuota cuti untuk tahun ${tahun} belum di-generate. Hubungi HRD.`);
      }

      const kuotaSisa = kuota.kuota_tahunan - kuota.kuota_diambil - kuota.kuota_pending;

      if (kuotaSisa < totalHariKerja) {
        throw new ResponseError(
          400,
          `Saldo cuti tidak mencukupi. Sisa: ${kuotaSisa} hari, dibutuhkan: ${totalHariKerja} hari`
        );
      }

      // Increment kuota_pending
      await prisma.kuota_cuti.update({
        where: { kuota_id: kuota.kuota_id },
        data: {
          kuota_pending: kuota.kuota_pending + totalHariKerja,
          updated_at: new Date(),
        },
      });
    }

    // Check for overlap
    const overlap = await prisma.izin_cuti.findFirst({
      where: {
        user_id: userId,
        status: { in: ["pending", "disetujui"] },
        OR: [
          {
            tanggal_mulai: { lte: endDate },
            tanggal_selesai: { gte: startDate },
          },
        ],
      },
    });

    if (overlap) {
      throw new ResponseError(
        400,
        `Pengajuan overlap dengan izin/cuti yang sudah ada (${overlap.tipe_izin}: ${overlap.tanggal_mulai.toISOString().split("T")[0]} - ${overlap.tanggal_selesai.toISOString().split("T")[0]})`
      );
    }

    const izin = await prisma.izin_cuti.create({
      data: {
        user_id: userId,
        cabang_id: cabangId,
        tipe_izin: tipeIzin,
        tanggal_mulai: startDate,
        tanggal_selesai: endDate,
        jumlah_hari: totalHariKerja,
        alasan,
        lampiran_file: lampiranFile || null,
        status: "pending",
        approved_by: userId, // placeholder
      },
      include: {
        user_izin_cuti_user_idTouser: {
          select: { id: true, namaLengkap: true, email: true },
        },
        cabang: {
          select: { id: true, namaCabang: true },
        },
      },
    });

    await createAuditLog(prisma,{
      userId,
      ipAddress,
      action: "CREATE_CUTI",
      tableName: "izin_cuti",
      recordId: izin.izin_id,
      oldValue: null,
      newValue: JSON.stringify({ tipeIzin, tanggalMulai, tanggalSelesai, jumlahHari: totalHariKerja }),
    });

    logger.info("Cuti request created", { izinId: izin.izin_id, tipeIzin, userId });

    return izin;
  } catch (error) {
    logger.error("Create cuti failed", { error: error.message, data });
    throw error;
  }
};

/**
 * Get izin/cuti requests with filtering
 */
const getIzin = async (filters) => {
  const { userId, cabangId, status, tipeIzin, tanggalMulai, tanggalSelesai, page = 1, limit = 20 } = filters;

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (userId) where.user_id = userId;
    if (cabangId) where.cabang_id = cabangId;
    if (status) where.status = status;
    if (tipeIzin) where.tipe_izin = tipeIzin;

    if (tanggalMulai || tanggalSelesai) {
      where.created_at = {};
      if (tanggalMulai) where.created_at.gte = new Date(tanggalMulai);
      if (tanggalSelesai) where.created_at.lte = new Date(tanggalSelesai);
    }

    const total = await prisma.izin_cuti.count({ where });

    const izinList = await prisma.izin_cuti.findMany({
      where,
      include: {
        user_izin_cuti_user_idTouser: {
          select: { id: true, namaLengkap: true, email: true },
        },
        user_izin_cuti_approved_byTouser: {
          select: { id: true, namaLengkap: true },
        },
        cabang: {
          select: { id: true, namaCabang: true },
        },
      },
      orderBy: { created_at: "desc" },
      skip,
      take: parseInt(limit),
    });

    return {
      data: izinList,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  } catch (error) {
    logger.error("Get izin list failed", { error: error.message });
    throw error;
  }
};

/**
 * Get a single izin/cuti by ID
 */
const getIzinById = async (id) => {
  try {
    const izin = await prisma.izin_cuti.findUnique({
      where: { izin_id: id },
      include: {
        user_izin_cuti_user_idTouser: {
          select: { id: true, namaLengkap: true, email: true },
        },
        user_izin_cuti_approved_byTouser: {
          select: { id: true, namaLengkap: true },
        },
        cabang: {
          select: { id: true, namaCabang: true },
        },
      },
    });

    if (!izin) {
      throw new ResponseError(404, "Pengajuan izin/cuti tidak ditemukan");
    }

    return izin;
  } catch (error) {
    logger.error("Get izin by ID failed", { error: error.message });
    throw error;
  }
};

/**
 * Cancel a pending izin/cuti
 */
const cancelIzin = async (id, auditInfo) => {
  const { userId, ipAddress } = auditInfo;

  try {
    const izin = await prisma.izin_cuti.findUnique({
      where: { izin_id: id },
    });

    if (!izin) {
      throw new ResponseError(404, "Pengajuan izin/cuti tidak ditemukan");
    }

    if (izin.user_id !== userId) {
      throw new ResponseError(403, "Anda hanya bisa membatalkan pengajuan sendiri");
    }

    if (izin.status !== "pending") {
      throw new ResponseError(400, `Tidak bisa membatalkan pengajuan dengan status: ${izin.status}`);
    }

    // Return pending quota if it was cuti_tahunan
    if (izin.tipe_izin === "cuti_tahunan") {
      const tahun = izin.tanggal_mulai.getFullYear();
      const kuota = await prisma.kuota_cuti.findUnique({
        where: {
          user_id_tahun: { user_id: userId, tahun },
        },
      });

      if (kuota) {
        await prisma.kuota_cuti.update({
          where: { kuota_id: kuota.kuota_id },
          data: {
            kuota_pending: Math.max(0, kuota.kuota_pending - izin.jumlah_hari),
            updated_at: new Date(),
          },
        });
      }
    }

    const updated = await prisma.izin_cuti.update({
      where: { izin_id: id },
      data: {
        status: "dibatalkan",
        updated_at: new Date(),
      },
    });

    await createAuditLog(prisma,{
      userId,
      ipAddress,
      action: "CANCEL_IZIN",
      tableName: "izin_cuti",
      recordId: id,
      oldValue: JSON.stringify({ status: "pending" }),
      newValue: JSON.stringify({ status: "dibatalkan" }),
    });

    logger.info("Izin/cuti cancelled", { izinId: id, userId });
    return updated;
  } catch (error) {
    logger.error("Cancel izin failed", { error: error.message });
    throw error;
  }
};

/**
 * Get pending izin/cuti for approver
 */
const getPendingIzin = async (filters) => {
  const { cabangId, page = 1, limit = 20 } = filters;

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = { status: "pending" };

    if (cabangId) where.cabang_id = cabangId;

    const total = await prisma.izin_cuti.count({ where });

    const izinList = await prisma.izin_cuti.findMany({
      where,
      include: {
        user_izin_cuti_user_idTouser: {
          select: { id: true, namaLengkap: true, email: true },
        },
        cabang: {
          select: { id: true, namaCabang: true },
        },
      },
      orderBy: { created_at: "asc" },
      skip,
      take: parseInt(limit),
    });

    return {
      data: izinList,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  } catch (error) {
    logger.error("Get pending izin failed", { error: error.message });
    throw error;
  }
};

/**
 * Approve an izin/cuti request
 */
const approveIzin = async (id, data, auditInfo) => {
  const { catatanApprover } = data;
  const { userId: approverId, ipAddress } = auditInfo;

  try {
    const izin = await prisma.izin_cuti.findUnique({
      where: { izin_id: id },
    });

    if (!izin) {
      throw new ResponseError(404, "Pengajuan izin/cuti tidak ditemukan");
    }

    if (izin.status !== "pending") {
      throw new ResponseError(400, `Pengajuan sudah berstatus: ${izin.status}`);
    }

    // Update izin status
    const updatedIzin = await prisma.izin_cuti.update({
      where: { izin_id: id },
      data: {
        status: "disetujui",
        approved_by: approverId,
        approved_at: new Date(),
        catatan_approver: catatanApprover || null,
        updated_at: new Date(),
      },
    });

    // Auto-create absensi records for each working day in the izin range
    const startDate = new Date(izin.tanggal_mulai);
    const endDate = new Date(izin.tanggal_selesai);
    const currentDate = new Date(startDate);
    const createdAbsensi = [];

    // Get holidays in the range
    const holidays = await prisma.hari_libur.findMany({
      where: {
        tanggal: { gte: startDate, lte: endDate },
      },
    });
    const holidayDates = new Set(holidays.map((h) => h.tanggal.toISOString().split("T")[0]));

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      const dateStr = currentDate.toISOString().split("T")[0];

      // Skip weekends and holidays
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidayDates.has(dateStr)) {
        // Map tipe_izin to statusKehadiran
        let statusKehadiran;
        switch (izin.tipe_izin) {
          case "izin_sakit":
            statusKehadiran = "sakit";
            break;
          case "izin_keperluan":
            statusKehadiran = "izin";
            break;
          case "cuti_tahunan":
          case "cuti_melahirkan":
          case "cuti_bersama":
          case "cuti_khusus":
            statusKehadiran = "cuti";
            break;
          default:
            statusKehadiran = "izin";
        }

        try {
          const absensi = await prisma.absensiPegawai.create({
            data: {
              userId: izin.user_id,
              cabangId: izin.cabang_id,
              tanggalAbsensi: new Date(dateStr),
              status_kehadiran: statusKehadiran,
              keterangan: `${izin.tipe_izin} - ${izin.alasan}`,
            },
          });
          createdAbsensi.push(absensi.id);
        } catch (err) {
          // Skip if absensi already exists for that date
          logger.warn("Absensi already exists for date", { date: dateStr, userId: izin.user_id });
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // If cuti_tahunan: update kuota (move from pending to diambil)
    if (izin.tipe_izin === "cuti_tahunan") {
      const tahun = izin.tanggal_mulai.getFullYear();
      const kuota = await prisma.kuota_cuti.findUnique({
        where: {
          user_id_tahun: { user_id: izin.user_id, tahun },
        },
      });

      if (kuota) {
        await prisma.kuota_cuti.update({
          where: { kuota_id: kuota.kuota_id },
          data: {
            kuota_diambil: kuota.kuota_diambil + izin.jumlah_hari,
            kuota_pending: Math.max(0, kuota.kuota_pending - izin.jumlah_hari),
            updated_at: new Date(),
          },
        });
      }
    }

    // Create notification for the employee
    try {
      await prisma.notifikasi.create({
        data: {
          user_id: izin.user_id,
          tipe: "izin_disetujui",
          judul: "Pengajuan Disetujui",
          pesan: `Pengajuan ${izin.tipe_izin.replace(/_/g, " ")} Anda untuk tanggal ${izin.tanggal_mulai.toISOString().split("T")[0]} - ${izin.tanggal_selesai.toISOString().split("T")[0]} telah disetujui.`,
          data: JSON.stringify({ izinId: id }),
        },
      });
    } catch (notifErr) {
      logger.warn("Failed to create notification", { error: notifErr.message });
    }

    await createAuditLog(prisma,{
      userId: approverId,
      ipAddress,
      action: "APPROVE_IZIN",
      tableName: "izin_cuti",
      recordId: id,
      oldValue: JSON.stringify({ status: "pending" }),
      newValue: JSON.stringify({ status: "disetujui", absensiCreated: createdAbsensi.length }),
    });

    logger.info("Izin/cuti approved", { izinId: id, approverId, absensiCreated: createdAbsensi.length });

    return { updatedIzin, absensiCreated: createdAbsensi.length };
  } catch (error) {
    logger.error("Approve izin failed", { error: error.message });
    throw error;
  }
};

/**
 * Reject an izin/cuti request
 */
const rejectIzin = async (id, data, auditInfo) => {
  const { catatanApprover } = data;
  const { userId: approverId, ipAddress } = auditInfo;

  try {
    const izin = await prisma.izin_cuti.findUnique({
      where: { izin_id: id },
    });

    if (!izin) {
      throw new ResponseError(404, "Pengajuan izin/cuti tidak ditemukan");
    }

    if (izin.status !== "pending") {
      throw new ResponseError(400, `Pengajuan sudah berstatus: ${izin.status}`);
    }

    // Return pending quota if cuti_tahunan
    if (izin.tipe_izin === "cuti_tahunan") {
      const tahun = izin.tanggal_mulai.getFullYear();
      const kuota = await prisma.kuota_cuti.findUnique({
        where: {
          user_id_tahun: { user_id: izin.user_id, tahun },
        },
      });

      if (kuota) {
        await prisma.kuota_cuti.update({
          where: { kuota_id: kuota.kuota_id },
          data: {
            kuota_pending: Math.max(0, kuota.kuota_pending - izin.jumlah_hari),
            updated_at: new Date(),
          },
        });
      }
    }

    const updatedIzin = await prisma.izin_cuti.update({
      where: { izin_id: id },
      data: {
        status: "ditolak",
        approved_by: approverId,
        approved_at: new Date(),
        catatan_approver: catatanApprover,
        updated_at: new Date(),
      },
    });

    // Create notification
    try {
      await prisma.notifikasi.create({
        data: {
          user_id: izin.user_id,
          tipe: "izin_ditolak",
          judul: "Pengajuan Ditolak",
          pesan: `Pengajuan ${izin.tipe_izin.replace(/_/g, " ")} Anda ditolak. Alasan: ${catatanApprover}`,
          data: JSON.stringify({ izinId: id }),
        },
      });
    } catch (notifErr) {
      logger.warn("Failed to create notification", { error: notifErr.message });
    }

    await createAuditLog(prisma,{
      userId: approverId,
      ipAddress,
      action: "REJECT_IZIN",
      tableName: "izin_cuti",
      recordId: id,
      oldValue: JSON.stringify({ status: "pending" }),
      newValue: JSON.stringify({ status: "ditolak", catatanApprover }),
    });

    logger.info("Izin/cuti rejected", { izinId: id, approverId });
    return updatedIzin;
  } catch (error) {
    logger.error("Reject izin failed", { error: error.message });
    throw error;
  }
};

module.exports = {
  createIzin,
  createCuti,
  getIzin,
  getIzinById,
  cancelIzin,
  getPendingIzin,
  approveIzin,
  rejectIzin,
};
