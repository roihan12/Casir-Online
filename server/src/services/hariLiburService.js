const prisma = require("../config/db");
const { ResponseError } = require("../error/responseError");
const { logger } = require("../utils/logger");

/**
 * Get list of holidays with optional year filter
 */
const getHariLibur = async (filters) => {
  const { tahun, page = 1, limit = 50 } = filters;

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (tahun) {
      where.tanggal = {
        gte: new Date(`${tahun}-01-01`),
        lte: new Date(`${tahun}-12-31`),
      };
    }

    const total = await prisma.hari_libur.count({ where });

    const holidays = await prisma.hari_libur.findMany({
      where,
      orderBy: { tanggal: "asc" },
      skip,
      take: parseInt(limit),
    });

    return {
      data: holidays,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  } catch (error) {
    logger.error("Get holidays failed", { error: error.message });
    throw error;
  }
};

/**
 * Create a single holiday
 */
const createHariLibur = async (data) => {
  const { tanggal, nama, isRecurring } = data;

  try {
    // Check if date already exists
    const existing = await prisma.hari_libur.findUnique({
      where: { tanggal: new Date(tanggal) },
    });

    if (existing) {
      throw new ResponseError(400, `Tanggal ${tanggal} sudah terdaftar sebagai hari libur (${existing.nama})`);
    }

    const holiday = await prisma.hari_libur.create({
      data: {
        tanggal: new Date(tanggal),
        nama,
        is_recurring: isRecurring || false,
      },
    });

    logger.info("Holiday created", { id: holiday.libur_id, nama, tanggal });
    return holiday;
  } catch (error) {
    logger.error("Create holiday failed", { error: error.message });
    throw error;
  }
};

/**
 * Bulk import holidays
 */
const importHariLibur = async (data) => {
  const { holidays } = data;

  try {
    const results = { created: 0, skipped: 0, errors: [] };

    for (const h of holidays) {
      try {
        const existing = await prisma.hari_libur.findUnique({
          where: { tanggal: new Date(h.tanggal) },
        });

        if (existing) {
          results.skipped++;
          continue;
        }

        await prisma.hari_libur.create({
          data: {
            tanggal: new Date(h.tanggal),
            nama: h.nama,
            is_recurring: h.isRecurring || false,
          },
        });
        results.created++;
      } catch (err) {
        results.errors.push({ tanggal: h.tanggal, error: err.message });
      }
    }

    logger.info("Holidays imported", results);
    return results;
  } catch (error) {
    logger.error("Import holidays failed", { error: error.message });
    throw error;
  }
};

/**
 * Delete a holiday
 */
const deleteHariLibur = async (id) => {
  try {
    const existing = await prisma.hari_libur.findUnique({
      where: { libur_id: id },
    });

    if (!existing) {
      throw new ResponseError(404, "Hari libur tidak ditemukan");
    }

    await prisma.hari_libur.delete({
      where: { libur_id: id },
    });

    logger.info("Holiday deleted", { id });
    return { message: "Hari libur berhasil dihapus" };
  } catch (error) {
    logger.error("Delete holiday failed", { error: error.message });
    throw error;
  }
};

/**
 * Check if a specific date is a holiday
 */
const checkHariLibur = async (tanggal) => {
  try {
    const holiday = await prisma.hari_libur.findUnique({
      where: { tanggal: new Date(tanggal) },
    });

    return {
      isLibur: !!holiday,
      nama: holiday ? holiday.nama : null,
    };
  } catch (error) {
    logger.error("Check holiday failed", { error: error.message });
    throw error;
  }
};

/**
 * Calculate working days between two dates (excluding weekends and holidays)
 */
const hitungHariKerja = async (dari, sampai) => {
  try {
    const startDate = new Date(dari);
    const endDate = new Date(sampai);

    if (startDate > endDate) {
      throw new ResponseError(400, "Tanggal 'dari' harus lebih awal dari tanggal 'sampai'");
    }

    // Get all holidays in the range
    const holidays = await prisma.hari_libur.findMany({
      where: {
        tanggal: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const holidayDates = new Set(
      holidays.map((h) => h.tanggal.toISOString().split("T")[0])
    );

    let totalHariKerja = 0;
    const hariLiburList = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      const dateStr = currentDate.toISOString().split("T")[0];

      if (dayOfWeek === 0 || dayOfWeek === 6) {
        // Weekend — skip
      } else if (holidayDates.has(dateStr)) {
        hariLiburList.push(dateStr);
      } else {
        totalHariKerja++;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      totalHariKerja,
      hariLibur: hariLiburList,
    };
  } catch (error) {
    logger.error("Calculate working days failed", { error: error.message });
    throw error;
  }
};

module.exports = {
  getHariLibur,
  createHariLibur,
  importHariLibur,
  deleteHariLibur,
  checkHariLibur,
  hitungHariKerja,
};
