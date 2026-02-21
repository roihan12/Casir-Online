const prisma = require("../config/db");
const { ResponseError } = require("../error/responseError");
const { logger } = require("../utils/logger");
const { createAuditLog } = require("../utils/auditLog");

/**
 * Get leave quota for a specific user and year
 */
const getKuotaCutiByUser = async (userId, tahun) => {
  try {
    const year = tahun || new Date().getFullYear();

    const kuota = await prisma.kuota_cuti.findUnique({
      where: {
        user_id_tahun: {
          user_id: userId,
          tahun: year,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            namaLengkap: true,
            email: true,
          },
        },
      },
    });

    if (!kuota) {
      throw new ResponseError(404, `Kuota cuti untuk tahun ${year} belum di-generate`);
    }

    return kuota;
  } catch (error) {
    logger.error("Get leave quota failed", { error: error.message, userId, tahun });
    throw error;
  }
};

/**
 * Get all leave quota (admin), with pagination
 */
const getAllKuotaCuti = async (filters) => {
  const { tahun, page = 1, limit = 20 } = filters;

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (tahun) {
      where.tahun = parseInt(tahun);
    }

    const total = await prisma.kuota_cuti.count({ where });

    const kuotaList = await prisma.kuota_cuti.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            namaLengkap: true,
            email: true,
          },
        },
      },
      orderBy: [{ tahun: "desc" }, { user: { namaLengkap: "asc" } }],
      skip,
      take: parseInt(limit),
    });

    return {
      data: kuotaList,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  } catch (error) {
    logger.error("Get all leave quotas failed", { error: error.message });
    throw error;
  }
};

/**
 * Generate leave quota for all active employees for a given year
 */
const generateKuotaTahunan = async (data, auditInfo) => {
  const { tahun, kuotaDefault = 12, carryOver = false, maxCarryOver = 5 } = data;
  const { userId, ipAddress } = auditInfo;

  try {
    // Get all active users
    const activeUsers = await prisma.user.findMany({
      where: { status: "aktif" },
      select: { id: true, namaLengkap: true },
    });

    let created = 0;
    let skipped = 0;

    for (const user of activeUsers) {
      // Check if quota already exists for this user and year
      const existing = await prisma.kuota_cuti.findUnique({
        where: {
          user_id_tahun: {
            user_id: user.id,
            tahun: tahun,
          },
        },
      });

      if (existing) {
        skipped++;
        continue;
      }

      let bonusCarryOver = 0;

      if (carryOver) {
        // Check previous year's quota
        const prevKuota = await prisma.kuota_cuti.findUnique({
          where: {
            user_id_tahun: {
              user_id: user.id,
              tahun: tahun - 1,
            },
          },
        });

        if (prevKuota) {
          const sisa = prevKuota.kuota_tahunan - prevKuota.kuota_diambil;
          bonusCarryOver = Math.min(Math.max(sisa, 0), maxCarryOver);
        }
      }

      await prisma.kuota_cuti.create({
        data: {
          user_id: user.id,
          tahun: tahun,
          kuota_tahunan: kuotaDefault + bonusCarryOver,
          kuota_diambil: 0,
          kuota_pending: 0,
        },
      });

      created++;
    }

    // Audit log
    await createAuditLog(prisma,{
      userId,
      ipAddress,
      action: "GENERATE_KUOTA_CUTI",
      tableName: "kuota_cuti",
      recordId: `bulk-${tahun}`,
      oldValue: null,
      newValue: JSON.stringify({ tahun, kuotaDefault, carryOver, created, skipped }),
    });

    logger.info("Leave quota generated", { tahun, created, skipped });

    return { tahun, created, skipped, total: activeUsers.length };
  } catch (error) {
    logger.error("Generate leave quota failed", { error: error.message });
    throw error;
  }
};

/**
 * Manual adjust leave quota (HRD only)
 */
const updateKuotaCuti = async (id, data, auditInfo) => {
  const { userId, ipAddress } = auditInfo;

  try {
    const existing = await prisma.kuota_cuti.findUnique({
      where: { kuota_id: id },
    });

    if (!existing) {
      throw new ResponseError(404, "Kuota cuti tidak ditemukan");
    }

    const oldValue = {
      kuota_tahunan: existing.kuota_tahunan,
      kuota_diambil: existing.kuota_diambil,
      kuota_pending: existing.kuota_pending,
    };

    const updateData = {};
    if (data.kuotaTahunan !== undefined) updateData.kuota_tahunan = data.kuotaTahunan;
    if (data.kuotaDiambil !== undefined) updateData.kuota_diambil = data.kuotaDiambil;
    if (data.kuotaPending !== undefined) updateData.kuota_pending = data.kuotaPending;
    updateData.updated_at = new Date();

    const updated = await prisma.kuota_cuti.update({
      where: { kuota_id: id },
      data: updateData,
    });

    await createAuditLog(prisma,{
      userId,
      ipAddress,
      action: "UPDATE_KUOTA_CUTI",
      tableName: "kuota_cuti",
      recordId: id,
      oldValue: JSON.stringify(oldValue),
      newValue: JSON.stringify({ ...updateData, alasan: data.alasan }),
    });

    logger.info("Leave quota updated", { id, alasan: data.alasan });
    return updated;
  } catch (error) {
    logger.error("Update leave quota failed", { error: error.message });
    throw error;
  }
};

module.exports = {
  getKuotaCutiByUser,
  getAllKuotaCuti,
  generateKuotaTahunan,
  updateKuotaCuti,
};
