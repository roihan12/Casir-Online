const prisma = require("../config/db");
const { ResponseError } = require("../error/responseError");
const { logger } = require("../utils/logger");

/**
 * Create a single work schedule
 * @param {Object} data - Schedule data
 * @param {Object} auditInfo - Audit information
 * @returns {Promise<Object>} Created schedule
 */
const createJadwal = async (data, auditInfo) => {
  const {
    userId,
    cabangId,
    tanggal,
    tipeJadwal,
    shiftId,
    jamMasukOverride,
    jamKeluarOverride,
    keterangan,
  } = data;

  try {
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ResponseError(404, "User not found");
    }

    // Verify cabang exists
    const cabang = await prisma.cabang.findUnique({
      where: { id: cabangId },
    });

    if (!cabang) {
      throw new ResponseError(404, "Cabang not found");
    }

    // Validate shift if tipeJadwal is shift
    let shiftData = null;
    if (tipeJadwal === "shift") {
      if (!shiftId) {
        throw new ResponseError(400, "shiftId is required when tipeJadwal is 'shift'");
      }

      shiftData = await prisma.master_shift.findFirst({
        where: {
          id: shiftId,
          isActive: true,
        },
      });

      if (!shiftData) {
        throw new ResponseError(404, "Shift not found or inactive");
      }
    }

    // Check for existing schedule on the same date for the same user
    const tanggalStart = new Date(tanggal);
    tanggalStart.setUTCHours(0, 0, 0, 0);
    const tanggalEnd = new Date(tanggalStart);
    tanggalEnd.setUTCDate(tanggalEnd.getUTCDate() + 1);

    const existingSchedule = await prisma.jadwalKerja.findFirst({
      where: {
        userId,
        tanggalMulai: {
          gte: tanggalStart,
          lt: tanggalEnd,
        },
      },
    });

    if (existingSchedule) {
      throw new ResponseError(
        400,
        `Schedule already exists for this user on ${tanggal.toISOString().split("T")[0]}`
      );
    }

    // Determine jamMasuk and jamKeluar based on tipeJadwal
    let jamMasuk = null;
    let jamKeluar = null;

    if (tipeJadwal === "shift" && shiftData) {
      jamMasuk = shiftData.jamMasuk;
      jamKeluar = shiftData.jamKeluar;
    } else if (tipeJadwal === "reguler") {
      jamMasuk = jamMasukOverride;
      jamKeluar = jamKeluarOverride;
    } else if (tipeJadwal === "libur" || tipeJadwal === "cuti" || tipeJadwal === "izin" || tipeJadwal === "wfh") {
      jamMasuk = "00:00:00";
      jamKeluar = "00:00:00";
    }

    // Create the schedule
    const schedule = await prisma.jadwalKerja.create({
  data: {
    user:   { connect: { id: userId } },
    cabang: { connect: { id: cabangId } },
    tanggalMulai: tanggalStart,
    tanggalSelesai: tanggalStart,
    jamMasuk,
    jamKeluar,
    hariKerja: [getDayName(tanggalStart.getDay())],
    keterangan,
    tipe_jadwal: tipeJadwal,
    created_by: auditInfo.userId,
    ...(shiftId && {
      master_shift: { connect: { id: shiftId } },
    }),
  },
});



    logger.info("Schedule created", {
      jadwalId: schedule.id,
      userId,
      tanggal,
      createdBy: auditInfo.userId,
    });

    return schedule;
  } catch (error) {
    logger.error("Create schedule failed", { error: error.message, data });
    throw error;
  }
};

/**
 * Generate schedules in bulk for multiple users
 * @param {Object} data - Generation parameters
 * @param {Object} auditInfo - Audit information
 * @returns {Promise<Object>} Generation result
 */
const generateJadwalBulk = async (data, auditInfo) => {
  const {
    userIds,
    cabangId,
    shiftId,
    tanggalMulai,
    tanggalSelesai,
    hariKerja,
    tipeJadwal,
    skipExisting,
    jamMasukOverride,
    jamKeluarOverride,
    keterangan,
  } = data;

  // Tipe yang tidak butuh shift
  const TIPE_TANPA_SHIFT = ["libur", "cuti", "izin", "wfh"];
  const needsShift = !TIPE_TANPA_SHIFT.includes(tipeJadwal);

  try {
    // Verify cabang exists
    const cabang = await prisma.cabang.findUnique({
      where: { id: cabangId },
    });

    if (!cabang) {
      throw new ResponseError(404, "Cabang not found");
    }

    // Verify shift exists (hanya untuk tipe yang butuh shift)
    let shiftData = null;
    if (needsShift) {
      if (!shiftId) {
        throw new ResponseError(400, `shiftId wajib diisi untuk tipe jadwal '${tipeJadwal}'`);
      }

      shiftData = await prisma.master_shift.findFirst({
        where: {
          id: shiftId,
          isActive: true,
        },
      });

      if (!shiftData) {
        throw new ResponseError(404, "Shift not found or inactive");
      }
    }

    // Tentukan jamMasuk & jamKeluar berdasarkan tipeJadwal
    let jamMasuk, jamKeluar;
    if (tipeJadwal === "shift" && shiftData) {
      jamMasuk = shiftData.jamMasuk;
      jamKeluar = shiftData.jamKeluar;
    } else if (tipeJadwal === "reguler") {
      if (!jamMasukOverride || !jamKeluarOverride) {
        throw new ResponseError(400, "jamMasukOverride dan jamKeluarOverride wajib diisi untuk tipe 'reguler'");
      }
      jamMasuk = jamMasukOverride;
      jamKeluar = jamKeluarOverride;
    } else {
      // libur, cuti, izin, wfh
      jamMasuk = "00:00:00";
      jamKeluar = "00:00:00";
    }

    // Get date range
    const startDate = new Date(tanggalMulai);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(tanggalSelesai);
    endDate.setHours(0, 0, 0, 0);

    // Calculate days between dates
    const dayDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    if (dayDiff > 366) {
      throw new ResponseError(400, "Date range cannot exceed 1 year");
    }

    // Map hariKerja to day indices (0 = Sunday, 1 = Monday, etc.)
    const dayNameToIndex = {
      Minggu: 0,
      Senin: 1,
      Selasa: 2,
      Rabu: 3,
      Kamis: 4,
      Jumat: 5,
      Sabtu: 6,
    };

    const workingDays = hariKerja.map((day) => dayNameToIndex[day]);

    // Verify all users exist
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        namaLengkap: true,
        email: true,
      },
    });

    if (users.length !== userIds.length) {
      throw new ResponseError(404, "Some users not found");
    }

    // Prepare schedules to create
    const schedulesToCreate = [];
    let skippedCount = 0;
    const existingDates = new Set();

    // Check existing schedules if skipExisting is true
    if (skipExisting) {
      const existingSchedules = await prisma.jadwalKerja.findMany({
        where: {
          userId: { in: userIds },
          cabangId,
          tanggalMulai: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          userId: true,
          tanggalMulai: true,
        },
      });

      existingSchedules.forEach((s) => {
        const dateKey = `${s.userId}_${s.tanggalMulai.toISOString().split("T")[0]}`;
        existingDates.add(dateKey);
      });
    }

    // Generate schedules for each user and each working day
    for (const user of users) {
      for (let i = 0; i < dayDiff; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);

        const dayIndex = currentDate.getDay();

        // Check if this is a working day
        if (!workingDays.includes(dayIndex)) {
          continue;
        }

        // Check if schedule already exists
        const dateKey = `${user.id}_${currentDate.toISOString().split("T")[0]}`;
        if (existingDates.has(dateKey)) {
          skippedCount++;
          continue;
        }

        schedulesToCreate.push({
          userId: user.id,
          cabangId,
          tanggalMulai: currentDate,
          tanggalSelesai: currentDate,
          jamMasuk,
          jamKeluar,
          hariKerja: [getDayName(dayIndex)],
          tipe_jadwal: tipeJadwal,
          ...(needsShift && shiftId ? { master_shift_id: shiftId } : {}),
          ...(keterangan ? { keterangan } : {}),
          created_by: auditInfo.userId,
        });
      }
    }

    // Bulk create schedules (in batches to avoid hitting limits)
    const batchSize = 100;
    let createdCount = 0;

    for (let i = 0; i < schedulesToCreate.length; i += batchSize) {
      const batch = schedulesToCreate.slice(i, i + batchSize);
      await prisma.jadwalKerja.createMany({
        data: batch,
        skipDuplicates: true,
      });
      createdCount += batch.length;
    }

    logger.info("Bulk schedule generation completed", {
      totalSchedules: schedulesToCreate.length,
      created: createdCount,
      skipped: skippedCount,
      usersCount: userIds.length,
      createdBy: auditInfo.userId,
    });

    return {
      success: true,
      message: "Schedules generated successfully",
      data: {
        totalGenerated: createdCount,
        skipped: skippedCount,
        usersProcessed: userIds.length,
        dateRange: {
          start: startDate.toISOString().split("T")[0],
          end: endDate.toISOString().split("T")[0],
        },
      },
    };
  } catch (error) {
    logger.error("Generate schedules bulk failed", { error: error.message, data });
    throw error;
  }
};



const generateJadwalReguRolling = async (data, auditInfo) => {
  const {
    cabangId,
    tanggalMulai,
    tanggalSelesai,
    skipExisting = true,
    regu: reguList,
  } = data;

  try {
    // ── Validasi cabang ──────────────────────────────────────────────
    const cabang = await prisma.cabang.findUnique({ where: { id: cabangId } });
    if (!cabang) throw new ResponseError(404, "Cabang not found");

    // ── Kumpulkan semua shiftId unik dari semua regu ─────────────────
    const allShiftIds = [...new Set(reguList.flatMap((r) => r.rotasiShift))];
    const allShifts = await prisma.master_shift.findMany({
      where: { id: { in: allShiftIds }, isActive: true, deleted_at: null },
    });

    if (allShifts.length !== allShiftIds.length) {
      const foundIds = allShifts.map((s) => s.id);
      const missing = allShiftIds.filter((id) => !foundIds.includes(id));
      throw new ResponseError(404, `Shift tidak ditemukan/nonaktif: ${missing.join(", ")}`);
    }
    const shiftMap = Object.fromEntries(allShifts.map((s) => [s.id, s]));

    // ── Validasi & load semua regu ───────────────────────────────────
    const reguIds = reguList.map((r) => r.reguId);
    const reguData = await prisma.regu.findMany({
      where: { id: { in: reguIds } },
      include: {
        regu_member: {
          include: { user: { select: { id: true, namaLengkap: true } } },
        },
      },
    });

    if (reguData.length !== reguIds.length) {
      const foundIds = reguData.map((r) => r.id);
      const missing = reguIds.filter((id) => !foundIds.includes(id));
      throw new ResponseError(404, `Regu tidak ditemukan: ${missing.join(", ")}`);
    }

    // Validasi per regu
    for (const regu of reguData) {
      if (regu.regu_member.length === 0) {
        throw new ResponseError(400, `Regu "${regu.nama_regu}" tidak memiliki anggota`);
      }
    }

    const reguDataMap = Object.fromEntries(reguData.map((r) => [r.id, r]));

    // ── Validasi input per regu ──────────────────────────────────────
    for (const reguInput of reguList) {
      const { pola, rotasiShift, hariKerjaPerRotasi, startShiftId } = reguInput;

      if (!pola || !Array.isArray(pola) || pola.length === 0) {
        throw new ResponseError(400, `Regu ${reguInput.reguId}: pola tidak valid`);
      }

      if (!pola.includes(1)) {
        throw new ResponseError(400, `Regu ${reguInput.reguId}: pola harus mengandung minimal 1 hari kerja`);
      }

      if (!rotasiShift || rotasiShift.length === 0) {
        throw new ResponseError(400, `Regu ${reguInput.reguId}: rotasiShift tidak boleh kosong`);
      }

      if (hariKerjaPerRotasi < 1) {
        throw new ResponseError(400, `Regu ${reguInput.reguId}: hariKerjaPerRotasi minimal 1`);
      }

      if (!rotasiShift.includes(startShiftId)) {
        throw new ResponseError(
          400,
          `Regu ${reguInput.reguId}: startShiftId harus ada di dalam rotasiShift`
        );
      }
    }

    // ── Setup tanggal generate ───────────────────────────────────────
    const generateStart = new Date(tanggalMulai);
    generateStart.setHours(0, 0, 0, 0);
    const generateEnd = new Date(tanggalSelesai);
    generateEnd.setHours(0, 0, 0, 0);

    const totalDays = Math.ceil((generateEnd - generateStart) / (1000 * 60 * 60 * 24)) + 1;
    if (totalDays > 366) throw new ResponseError(400, "Rentang tanggal max 1 tahun");

    // ── Load existing schedules ──────────────────────────────────────
    const allUserIds = reguData.flatMap((r) => r.regu_member.map((m) => m.user.id));
    const existingDates = new Set();

    if (skipExisting) {
      const existing = await prisma.jadwalKerja.findMany({
        where: {
          userId: { in: allUserIds },
          tanggalMulai: { gte: generateStart, lte: generateEnd },
        },
        select: { userId: true, tanggalMulai: true },
      });
      existing.forEach((s) => {
        existingDates.add(`${s.userId}_${s.tanggalMulai.toISOString().split("T")[0]}`);
      });
    }

    // ── Generate jadwal per regu ─────────────────────────────────────
    const schedulesToCreate = [];
    let skippedCount = 0;
    const summaryPerRegu = [];

    for (const reguInput of reguList) {
      const {
        reguId,
        pola,
        rotasiShift,
        hariKerjaPerRotasi,
        startShiftId,
        tanggalMulaiKerjaRegu,
      } = reguInput;

      const regu = reguDataMap[reguId];
      const userIds = regu.regu_member.map((m) => m.user.id);
      const polaLength = pola.length;

      // ── Hitung offset & state awal dari tanggalMulaiKerjaRegu ──────
      const reguStartDate = new Date(tanggalMulaiKerjaRegu);
      reguStartDate.setHours(0, 0, 0, 0);

      // Selisih hari antara tanggalMulaiKerjaRegu dan generateStart
      // Negatif = regu sudah mulai sebelum periode generate
      // Positif = regu mulai setelah periode generate dimulai
      const MS_PER_DAY = 1000 * 60 * 60 * 24;
      const dayOffset = Math.round((generateStart - reguStartDate) / MS_PER_DAY);

      // Simulasi pola dari reguStartDate sampai generateStart
      // untuk dapatkan state (polaPos & workDayCount & shiftIdx) yang tepat
      const { polaPos: initPolaPos, workDayCount: initWorkDayCount, shiftIdx: initShiftIdx } =
        simulatePolaState({
          pola,
          polaLength,
          rotasiShift,
          hariKerjaPerRotasi,
          startShiftId,
          dayOffset,       // berapa hari yang sudah "berlalu" sebelum generate
        });

      // ── Loop harian untuk regu ini ──────────────────────────────────
      let currentPolaPos = initPolaPos;
      let workDayCount = initWorkDayCount;
      let currentShiftIdx = initShiftIdx;

      const reguSummary = {
        reguId,
        namaRegu: regu.nama_regu,
        jumlahAnggota: userIds.length,
        jadwalDibuat: 0,
        jadwalDilewati: 0,
        rotasiDetail: [],
      };

      for (let i = 0; i < totalDays; i++) {
        const currentDate = new Date(generateStart);
        currentDate.setDate(generateStart.getDate() + i);
        const dateStr = currentDate.toISOString().split("T")[0];

        const isWorkDay = pola[currentPolaPos] === 1;

        // Cek ganti shift sebelum assign (hanya saat hari kerja)
        if (isWorkDay && workDayCount >= hariKerjaPerRotasi) {
          currentShiftIdx = (currentShiftIdx + 1) % rotasiShift.length;
          workDayCount = 0;
        }

        const currentShiftId = isWorkDay ? rotasiShift[currentShiftIdx] : null;
        const currentShift = currentShiftId ? shiftMap[currentShiftId] : null;

        // Catat rotasi detail untuk summary (hanya saat shift berubah)
        if (isWorkDay) {
          const lastDetail = reguSummary.rotasiDetail.at(-1);
          if (!lastDetail || lastDetail.shiftId !== currentShiftId) {
            reguSummary.rotasiDetail.push({
              mulaiTanggal: dateStr,
              shiftId: currentShiftId,
              namaShift: currentShift.namaShift,
            });
          }
        }

        for (const userId of userIds) {
          const dateKey = `${userId}_${dateStr}`;

          if (existingDates.has(dateKey)) {
            skippedCount++;
            reguSummary.jadwalDilewati++;
            continue;
          }

          schedulesToCreate.push({
            userId,
            cabangId,
            tanggalMulai: new Date(currentDate),
            tanggalSelesai: new Date(currentDate),
            jamMasuk: isWorkDay ? currentShift.jamMasuk : "00:00",
            jamKeluar: isWorkDay ? currentShift.jamKeluar : "00:00",
            hariKerja: [getDayName(currentDate.getDay())],
            tipe_jadwal: isWorkDay ? "shift" : "libur",
            master_shift_id: isWorkDay ? currentShiftId : null,
            keterangan: !isWorkDay ? "Libur rotasi" : null,
            created_by: auditInfo.userId,
          });

          reguSummary.jadwalDibuat++;
        }

        // Advance state
        if (isWorkDay) workDayCount++;
        currentPolaPos = (currentPolaPos + 1) % polaLength;
      }

      summaryPerRegu.push(reguSummary);
    }

    // ── Bulk insert ──────────────────────────────────────────────────
    const batchSize = 100;
    let createdCount = 0;

    for (let i = 0; i < schedulesToCreate.length; i += batchSize) {
      const batch = schedulesToCreate.slice(i, i + batchSize);
      await prisma.jadwalKerja.createMany({ data: batch, skipDuplicates: true });
      createdCount += batch.length;
    }

    logger.info("Generate jadwal regu rolling selesai", {
      createdCount,
      skippedCount,
      reguCount: reguList.length,
      createdBy: auditInfo.userId,
    });

    return {
      success: true,
      message: "Jadwal regu berhasil dibuat",
      data: {
        totalGenerated: createdCount,
        skipped: skippedCount,
        dateRange: {
          start: generateStart.toISOString().split("T")[0],
          end: generateEnd.toISOString().split("T")[0],
        },
        summaryPerRegu,
      },
    };
  } catch (error) {
    logger.error("Generate jadwal regu rolling failed", { error: error.message, data });
    throw error;
  }
};

/**
 * Simulasikan state pola dari titik awal regu hingga hari generate dimulai.
 * Mengembalikan posisi pola, jumlah hari kerja di rotasi saat ini, dan index shift.
 *
 * Kasus dayOffset negatif: regu mulai SETELAH tanggalMulai generate
 * → simulasi maju dari reguStart ke generateStart tidak perlu (offset 0 saja)
 *   karena regu belum mulai
 *
 * Kasus dayOffset positif: regu mulai SEBELUM tanggalMulai generate
 * → simulasi maju dayOffset hari untuk dapatkan state yang tepat
 */
const simulatePolaState = ({
  pola,
  polaLength,
  rotasiShift,
  hariKerjaPerRotasi,
  startShiftId,
  dayOffset,
}) => {
  // Kalau regu mulai setelah periode generate → tidak perlu simulasi
  if (dayOffset <= 0) {
    return {
      polaPos: Math.abs(dayOffset) % polaLength,
      workDayCount: 0,
      shiftIdx: rotasiShift.indexOf(startShiftId),
    };
  }

  // Simulasi maju dari hari ke-0 (reguStartDate) sampai hari ke-dayOffset
  let polaPos = 0;
  let workDayCount = 0;
  let shiftIdx = rotasiShift.indexOf(startShiftId);

  for (let d = 0; d < dayOffset; d++) {
    const isWorkDay = pola[polaPos] === 1;

    if (isWorkDay) {
      if (workDayCount >= hariKerjaPerRotasi) {
        shiftIdx = (shiftIdx + 1) % rotasiShift.length;
        workDayCount = 0;
      }
      workDayCount++;
    }

    polaPos = (polaPos + 1) % polaLength;
  }

  return { polaPos, workDayCount, shiftIdx };
};









/**
 * Get schedules with filtering and pagination
 * @param {Object} filters - Query filters
 * @returns {Promise<Object>} Paginated schedules
 */
const getJadwal = async (filters) => {
  const { userId, cabangId, tanggalMulai, tanggalSelesai, tipeJadwal, shiftId, reguId } = filters;

  try {
    

    // Build where clause
    const where = {};

    if (userId) where.userId = userId;
    if (cabangId) where.cabangId = cabangId;
    if (tipeJadwal) where.tipe_jadwal = tipeJadwal;
    if (shiftId) where.master_shift_id = shiftId;

    if (tanggalMulai || tanggalSelesai) {
      where.tanggalMulai = {};
      if (tanggalMulai) {
        where.tanggalMulai.gte = new Date(tanggalMulai);
      }
      if (tanggalSelesai) {
        where.tanggalMulai.lte = new Date(tanggalSelesai);
      }
    }


    if (reguId) {
      where.user = {
        regu_member: {
          some: {
            regu_id: reguId,
          },
        },
      };
    }

    // Get total count
    const total = await prisma.jadwalKerja.count({ where });

    // Get records
    const schedules = await prisma.jadwalKerja.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            namaLengkap: true,
            email: true,
          },
        },
        cabang: {
          select: {
            id: true,
            namaCabang: true,
          },
        },
        master_shift: {
          select: {
            id: true,
            namaShift: true,
            toleransiTerlambat: true,
            isOvernight: true,
          },
        },
      },
      orderBy: {
        tanggalMulai: "desc",
      },
    });

    return {
      data: schedules,
    };
  } catch (error) {
    logger.error("Get schedules failed", { error: error.message, filters });
    throw error;
  }
};

/**
 * Get a single schedule by ID
 * @param {string} jadwalId - Schedule ID
 * @returns {Promise<Object>} Schedule details
 */
const getJadwalById = async (jadwalId) => {
  try {
    const schedule = await prisma.jadwalKerja.findUnique({
      where: { id: jadwalId },
      include: {
        user: {
          select: {
            id: true,
            namaLengkap: true,
            email: true,
          },
        },
        cabang: {
          select: {
            id: true,
            namaCabang: true,
          },
        },
        master_shift: {
          select: {
            id: true,
            namaShift: true,
            toleransiTerlambat: true,
            isOvernight: true,
          },
        },
      },
    });

    if (!schedule) {
      throw new ResponseError(404, "Schedule not found");
    }

    return schedule;
  } catch (error) {
    logger.error("Get schedule by ID failed", { error: error.message, jadwalId });
    throw error;
  }
};

/**
 * Update a schedule
 * @param {string} jadwalId - Schedule ID
 * @param {Object} data - Update data
 * @param {Object} auditInfo - Audit information
 * @returns {Promise<Object>} Updated schedule
 */
const updateJadwal = async (jadwalId, data, auditInfo) => {
  const { tipeJadwal, shiftId, jamMasukOverride, jamKeluarOverride, keterangan } = data;

  try {
    // Check if schedule exists
    const existingSchedule = await prisma.jadwalKerja.findUnique({
      where: { id: jadwalId },
    });

    if (!existingSchedule) {
      throw new ResponseError(404, "Schedule not found");
    }

    // Prepare update data
    const updateData = {};
    if (tipeJadwal) updateData.tipe_jadwal = tipeJadwal;
    if (shiftId !== undefined) {
      if (tipeJadwal === "shift" || existingSchedule.tipe_jadwal === "shift") {
        updateData.master_shift_id = shiftId;
      }
    }
    if (jamMasukOverride !== undefined) updateData.jamMasuk = jamMasukOverride;
    if (jamKeluarOverride !== undefined) updateData.jamKeluar = jamKeluarOverride;
    if (keterangan !== undefined) updateData.keterangan = keterangan;
    updateData.updated_by = auditInfo.userId;

    const updatedSchedule = await prisma.jadwalKerja.update({
      where: { id: jadwalId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            namaLengkap: true,
            email: true,
          },
        },
        cabang: {
          select: {
            id: true,
            namaCabang: true,
          },
        },
        master_shift: {
          select: {
            id: true,
            namaShift: true,
          },
        },
      },
    });

    logger.info("Schedule updated", {
      jadwalId,
      updatedBy: auditInfo.userId,
    });

    return updatedSchedule;
  } catch (error) {
    logger.error("Update schedule failed", { error: error.message, jadwalId, data });
    throw error;
  }
};

/**
 * Delete a schedule
 * @param {string} jadwalId - Schedule ID
 * @param {Object} auditInfo - Audit information
 * @returns {Promise<Object>} Deleted schedule
 */
const deleteJadwal = async (jadwalId, auditInfo) => {
  try {
    // Check if schedule exists
    const schedule = await prisma.jadwalKerja.findUnique({
      where: { id: jadwalId },
    });

    if (!schedule) {
      throw new ResponseError(404, "Schedule not found");
    }

    await prisma.jadwalKerja.delete({
      where: { id: jadwalId },
    });

    logger.info("Schedule deleted", {
      jadwalId,
      deletedBy: auditInfo.userId,
    });

    return {
      success: true,
      message: "Schedule deleted successfully",
    };
  } catch (error) {
    logger.error("Delete schedule failed", { error: error.message, jadwalId });
    throw error;
  }
};

/**
 * Helper function to get day name in Indonesian from day index
 * @param {number} dayIndex - Day index (0 = Sunday, 1 = Monday, etc.)
 * @returns {string} Day name in Indonesian
 */
const getDayName = (dayIndex) => {
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  return days[dayIndex];
};

module.exports = {
  createJadwal,
  generateJadwalBulk,
  generateJadwalReguRolling,
  getJadwal,
  getJadwalById,
  updateJadwal,
  deleteJadwal,
};
