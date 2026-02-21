const prisma = require("../config/db");
const { ResponseError } = require("../error/responseError");
const { logger } = require("../utils/logger");
const { createAuditLog } = require("../utils/auditLog");

// ===================================================================
// T-20: ENGINE KALKULASI GAJI + T-21: GENERATE & MANAGE SLIP GAJI
// ===================================================================

/**
 * Calculate salary for a single employee for a given period
 */
const kalkulasiGaji = async (userId, periode, cabangId) => {
  try {
    const [year, month] = periode.split("-").map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of month

    // 1. Get gaji pokok
    const gajiPegawai = await prisma.gaji_pegawai.findUnique({
      where: { user_id: userId },
    });

    if (!gajiPegawai) {
      throw new ResponseError(400, `Data gaji untuk user ${userId} belum diatur`);
    }

    // 2. Get absensi records for the period
    const absensiList = await prisma.absensiPegawai.findMany({
      where: {
        userId: userId,
        cabangId: cabangId,
        tanggalAbsensi: { gte: startDate, lte: endDate },
      },
    });

    // Calculate attendance summary
    let totalHadir = 0, totalTerlambat = 0, totalIzin = 0, totalSakit = 0;
    let totalCuti = 0, totalAlpha = 0, totalMenitTerlambat = 0;
    let totalJamKerja = 0, totalJamLembur = 0;

    for (const a of absensiList) {
      switch (a.status_kehadiran) {
        case "hadir":
          totalHadir++;
          break;
        case "terlambat":
        case "hadir_terlambat":
          totalHadir++;
          totalTerlambat++;
          break;
        case "izin":
          totalIzin++;
          break;
        case "sakit":
          totalSakit++;
          break;
        case "cuti":
          totalCuti++;
          break;
        case "alpha":
        case "tanpa_keterangan":
          totalAlpha++;
          break;
      }

      if (a.jamKerja) totalJamKerja += parseFloat(a.jamKerja);
      if (a.jamLembur) totalJamLembur += parseFloat(a.jamLembur);
    }

    // 3. Calculate working days in the month (excluding weekends + holidays)
    const holidays = await prisma.hari_libur.findMany({
      where: { tanggal: { gte: startDate, lte: endDate } },
    });
    const holidaySet = new Set(holidays.map((h) => h.tanggal.toISOString().split("T")[0]));

    let totalHariKerja = 0;
    const datePtr = new Date(startDate);
    while (datePtr <= endDate) {
      const dayOfWeek = datePtr.getDay();
      const dateStr = datePtr.toISOString().split("T")[0];
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidaySet.has(dateStr)) {
        totalHariKerja++;
      }
      datePtr.setDate(datePtr.getDate() + 1);
    }

    // 4. Get active tunjangan
    const tunjangan = await prisma.tunjangan_pegawai.findMany({
      where: {
        user_id: userId,
        is_active: true,
        berlaku_dari: { lte: endDate },
        OR: [
          { berlaku_sampai: null },
          { berlaku_sampai: { gte: startDate } },
        ],
      },
      include: { komponen_gaji: true },
    });

    // 5. Calculate tunjangan & potongan
    let totalTunjangan = 0;
    let totalPotongan = 0;
    const detailKomponen = [];

    for (const t of tunjangan) {
      const nilai = t.nilai_override !== null ? parseFloat(t.nilai_override) : parseFloat(t.komponen_gaji.nilai);
      let nilaiProrate = nilai;

      // Pro-rate based on actual days worked
      if (t.komponen_gaji.is_prorate && totalHariKerja > 0) {
        nilaiProrate = (nilai / totalHariKerja) * totalHadir;
      }

      nilaiProrate = Math.round(nilaiProrate);

      if (t.komponen_gaji.tipe === "tunjangan") {
        totalTunjangan += nilaiProrate;
      } else {
        totalPotongan += nilaiProrate;
      }

      detailKomponen.push({
        komponenId: t.komponen_gaji.komponen_id,
        nama: t.komponen_gaji.nama,
        tipe: t.komponen_gaji.tipe,
        nilai: nilaiProrate,
        keterangan: t.komponen_gaji.is_prorate
          ? `Pro-rate: ${totalHadir}/${totalHariKerja} hari`
          : null,
      });
    }

    // 6. Calculate salary components
    const gajiPokok = parseFloat(gajiPegawai.gaji_pokok);
    const tarifLembur = parseFloat(gajiPegawai.tarif_lembur);

    // Lembur = tarif per jam × total jam lembur
    const upahLembur = Math.round(tarifLembur * totalJamLembur);

    // Potongan alpha = (gaji pokok / total hari kerja) × total alpha
    const potonganAlpha = totalHariKerja > 0
      ? Math.round((gajiPokok / totalHariKerja) * totalAlpha)
      : 0;

    // Potongan terlambat = 1% gaji pokok per keterlambatan (simplified)
    const potonganTerlambat = Math.round(gajiPokok * 0.01 * totalTerlambat);

    // 7. Final calculation
    const gajiBersih =
      gajiPokok +
      totalTunjangan +
      upahLembur -
      totalPotongan -
      potonganAlpha -
      potonganTerlambat;

    return {
      userId,
      cabangId,
      periode,
      totalHariKerja,
      totalHadir,
      totalIzin,
      totalSakit,
      totalCuti,
      totalAlpha,
      totalTerlambat,
      totalMenitTerlambat,
      totalJamKerja: parseFloat(totalJamKerja.toFixed(2)),
      totalJamLembur: parseFloat(totalJamLembur.toFixed(2)),
      gajiPokok,
      totalTunjangan,
      totalPotongan,
      upahLembur,
      potonganAlpha,
      potonganTerlambat,
      gajiBersih: Math.max(0, gajiBersih),
      detailKomponen,
    };
  } catch (error) {
    logger.error("Salary calculation failed", { error: error.message, userId, periode });
    throw error;
  }
};

/**
 * Generate slip gaji for employees (batch)
 */
const generateSlipGaji = async (data, auditInfo) => {
  const { periode, cabangId, userIds } = data;
  const { userId: adminId, ipAddress } = auditInfo;

  try {
    // Get target employees
    let targetUsers;

    if (userIds && userIds.length > 0) {
      targetUsers = await prisma.user.findMany({
        where: { id: { in: userIds }, status: "aktif" },
        select: { id: true, namaLengkap: true },
      });
    } else {
      // All active users in the branch
      const userRoles = await prisma.userRole.findMany({
        where: { cabangId },
        include: {
          user: { select: { id: true, namaLengkap: true, status: true } },
        },
      });
      targetUsers = userRoles
        .filter((ur) => ur.user.status === "aktif")
        .map((ur) => ur.user);
      // Remove duplicates
      const seen = new Set();
      targetUsers = targetUsers.filter((u) => {
        if (seen.has(u.id)) return false;
        seen.add(u.id);
        return true;
      });
    }

    const results = { created: 0, skipped: 0, errors: [] };

    for (const user of targetUsers) {
      try {
        // Check if slip already exists
        const existing = await prisma.slip_gaji.findUnique({
          where: {
            user_id_periode: { user_id: user.id, periode },
          },
        });

        if (existing) {
          results.skipped++;
          continue;
        }

        // Calculate salary
        const calc = await kalkulasiGaji(user.id, periode, cabangId);

        // Create slip gaji
        const slip = await prisma.slip_gaji.create({
          data: {
            user_id: user.id,
            cabang_id: cabangId,
            periode,
            total_hari_kerja: calc.totalHariKerja,
            total_hadir: calc.totalHadir,
            total_izin: calc.totalIzin,
            total_sakit: calc.totalSakit,
            total_cuti: calc.totalCuti,
            total_alpha: calc.totalAlpha,
            total_terlambat: calc.totalTerlambat,
            total_menit_terlambat: calc.totalMenitTerlambat,
            total_jam_kerja: calc.totalJamKerja,
            total_jam_lembur: calc.totalJamLembur,
            gaji_pokok: calc.gajiPokok,
            total_tunjangan: calc.totalTunjangan,
            total_potongan: calc.totalPotongan,
            upah_lembur: calc.upahLembur,
            potongan_alpha: calc.potonganAlpha,
            potongan_terlambat: calc.potonganTerlambat,
            gaji_bersih: calc.gajiBersih,
            status: "draft",
            created_by: adminId,
          },
        });

        // Create slip detail entries for each komponen
        for (const detail of calc.detailKomponen) {
          await prisma.slip_gaji_detail.create({
            data: {
              slip_gaji_id: slip.slip_id,
              komponen_id: detail.komponenId,
              nama: detail.nama,
              tipe: detail.tipe,
              nilai: detail.nilai,
              keterangan: detail.keterangan,
            },
          });
        }

        results.created++;
      } catch (err) {
        results.errors.push({ userId: user.id, nama: user.namaLengkap, error: err.message });
      }
    }

    await createAuditLog(prisma,{
      userId: adminId,
      ipAddress,
      action: "GENERATE_SLIP_GAJI",
      tableName: "slip_gaji",
      recordId: `batch-${periode}`,
      oldValue: null,
      newValue: JSON.stringify({ periode, cabangId, created: results.created, skipped: results.skipped }),
    });

    logger.info("Slip gaji generated", { periode, cabangId, ...results });
    return results;
  } catch (error) {
    logger.error("Generate slip gaji failed", { error: error.message });
    throw error;
  }
};

/**
 * Get slip gaji list with filtering
 */
const getSlipGaji = async (filters) => {
  const { userId, cabangId, periode, status, page = 1, limit = 20 } = filters;

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (userId) where.user_id = userId;
    if (cabangId) where.cabang_id = cabangId;
    if (periode) where.periode = periode;
    if (status) where.status = status;

    const total = await prisma.slip_gaji.count({ where });

    const data = await prisma.slip_gaji.findMany({
      where,
      include: {
        user: { select: { id: true, namaLengkap: true, email: true } },
        cabang: { select: { id: true, namaCabang: true } },
      },
      orderBy: [{ periode: "desc" }, { user: { namaLengkap: "asc" } }],
      skip,
      take: parseInt(limit),
    });

    return {
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  } catch (error) {
    logger.error("Get slip gaji failed", { error: error.message });
    throw error;
  }
};

/**
 * Get slip gaji detail by ID
 */
const getSlipGajiById = async (id) => {
  try {
    const slip = await prisma.slip_gaji.findUnique({
      where: { slip_id: id },
      include: {
        user: { select: { id: true, namaLengkap: true, email: true } },
        cabang: { select: { id: true, namaCabang: true } },
        slip_gaji_detail: {
          include: { komponen_gaji: true },
          orderBy: { tipe: "asc" },
        },
      },
    });

    if (!slip) {
      throw new ResponseError(404, "Slip gaji tidak ditemukan");
    }

    return slip;
  } catch (error) {
    logger.error("Get slip gaji by ID failed", { error: error.message });
    throw error;
  }
};

/**
 * Finalize a slip gaji (draft → final)
 */
const finalizeSlipGaji = async (id, data, auditInfo) => {
  const { userId: adminId, ipAddress } = auditInfo;

  try {
    const slip = await prisma.slip_gaji.findUnique({ where: { slip_id: id } });

    if (!slip) throw new ResponseError(404, "Slip gaji tidak ditemukan");
    if (slip.status !== "draft") {
      throw new ResponseError(400, `Slip gaji sudah berstatus: ${slip.status}`);
    }

    const updated = await prisma.slip_gaji.update({
      where: { slip_id: id },
      data: {
        status: "final",
        catatan: data.catatan || null,
        tanggal_bayar: new Date(),
        updated_at: new Date(),
      },
    });

    // Send notification to the employee
    try {
      await prisma.notifikasi.create({
        data: {
          user_id: slip.user_id,
          tipe: "slip_gaji_terbit",
          judul: "Slip Gaji Tersedia",
          pesan: `Slip gaji periode ${slip.periode} telah diterbitkan. Silakan cek di menu Penggajian.`,
          data: JSON.stringify({ slipId: id, periode: slip.periode }),
        },
      });
    } catch (notifErr) {
      logger.warn("Failed to send slip notification", { error: notifErr.message });
    }

    await createAuditLog(prisma,{
      userId: adminId,
      ipAddress,
      action: "FINALIZE_SLIP_GAJI",
      tableName: "slip_gaji",
      recordId: id,
      oldValue: JSON.stringify({ status: "draft" }),
      newValue: JSON.stringify({ status: "final" }),
    });

    logger.info("Slip gaji finalized", { slipId: id });
    return updated;
  } catch (error) {
    logger.error("Finalize slip gaji failed", { error: error.message });
    throw error;
  }
};

/**
 * Batch finalize all draft slips for a period
 */
const batchFinalizeSlipGaji = async (periode, cabangId, auditInfo) => {
  const { userId: adminId, ipAddress } = auditInfo;

  try {
    const draftSlips = await prisma.slip_gaji.findMany({
      where: { periode, cabang_id: cabangId, status: "draft" },
    });

    let finalized = 0;

    for (const slip of draftSlips) {
      await prisma.slip_gaji.update({
        where: { slip_id: slip.slip_id },
        data: {
          status: "final",
          tanggal_bayar: new Date(),
          updated_at: new Date(),
        },
      });

      try {
        await prisma.notifikasi.create({
          data: {
            user_id: slip.user_id,
            tipe: "slip_gaji_terbit",
            judul: "Slip Gaji Tersedia",
            pesan: `Slip gaji periode ${periode} telah diterbitkan.`,
            data: JSON.stringify({ slipId: slip.slip_id, periode }),
          },
        });
      } catch (notifErr) {
        logger.warn("Notification failed for slip", { slipId: slip.slip_id });
      }

      finalized++;
    }

    await createAuditLog(prisma,{
      userId: adminId,
      ipAddress,
      action: "BATCH_FINALIZE_SLIP_GAJI",
      tableName: "slip_gaji",
      recordId: `batch-${periode}`,
      oldValue: null,
      newValue: JSON.stringify({ periode, cabangId, finalized }),
    });

    logger.info("Batch finalize complete", { periode, finalized });
    return { periode, cabangId, finalized, total: draftSlips.length };
  } catch (error) {
    logger.error("Batch finalize failed", { error: error.message });
    throw error;
  }
};

/**
 * Delete a draft slip gaji
 */
const deleteSlipGaji = async (id, auditInfo) => {
  const { userId: adminId, ipAddress } = auditInfo;

  try {
    const slip = await prisma.slip_gaji.findUnique({ where: { slip_id: id } });

    if (!slip) throw new ResponseError(404, "Slip gaji tidak ditemukan");
    if (slip.status !== "draft") {
      throw new ResponseError(400, "Hanya slip gaji berstatus draft yang bisa dihapus");
    }

    // Delete details first (cascade should handle this but being explicit)
    await prisma.slip_gaji_detail.deleteMany({ where: { slip_gaji_id: id } });
    await prisma.slip_gaji.delete({ where: { slip_id: id } });

    await createAuditLog(prisma,{
      userId: adminId,
      ipAddress,
      action: "DELETE_SLIP_GAJI",
      tableName: "slip_gaji",
      recordId: id,
      oldValue: JSON.stringify({ periode: slip.periode, userId: slip.user_id }),
      newValue: null,
    });

    logger.info("Slip gaji deleted", { slipId: id });
    return { message: "Slip gaji berhasil dihapus" };
  } catch (error) {
    logger.error("Delete slip gaji failed", { error: error.message });
    throw error;
  }
};

/**
 * Get my slip gaji (for employee)
 */
const getMySlipGaji = async (userId, filters) => {
  const { periode, page = 1, limit = 12 } = filters;

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {
      user_id: userId,
      status: "final", // employees can only see final slips
    };

    if (periode) where.periode = periode;

    const total = await prisma.slip_gaji.count({ where });

    const data = await prisma.slip_gaji.findMany({
      where,
      include: {
        cabang: { select: { id: true, namaCabang: true } },
        slip_gaji_detail: { orderBy: { tipe: "asc" } },
      },
      orderBy: { periode: "desc" },
      skip,
      take: parseInt(limit),
    });

    return {
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  } catch (error) {
    logger.error("Get my slip gaji failed", { error: error.message });
    throw error;
  }
};

module.exports = {
  kalkulasiGaji,
  generateSlipGaji,
  getSlipGaji,
  getSlipGajiById,
  finalizeSlipGaji,
  batchFinalizeSlipGaji,
  deleteSlipGaji,
  getMySlipGaji,
};
