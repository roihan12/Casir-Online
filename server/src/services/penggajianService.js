const prisma = require("../config/db");
const { ResponseError } = require("../error/responseError");
const { logger } = require("../utils/logger");
const { createAuditLog } = require("../utils/auditLog");

// ===================================================================
// T-17: KOMPONEN GAJI (Salary Components)
// ===================================================================

const createKomponenGaji = async (data, auditInfo) => {
  const { nama, tipe, nilai, isProrate, isActive, keterangan } = data;
  const { userId, ipAddress } = auditInfo;

  try {
    // Check duplicate name
    const existing = await prisma.komponen_gaji.findFirst({
      where: { nama: { equals: nama, mode: "insensitive" } },
    });

    if (existing) {
      throw new ResponseError(400, `Komponen gaji "${nama}" sudah ada`);
    }

    const komponen = await prisma.komponen_gaji.create({
      data: {
        nama,
        tipe,
        nilai,
        is_prorate: isProrate || false,
        is_active: isActive !== false,
        keterangan: keterangan || null,
        created_by: userId,
        updated_by: userId,
      },
    });

    await createAuditLog(prisma,{
      userId,
      ipAddress,
      action: "CREATE_KOMPONEN_GAJI",
      tableName: "komponen_gaji",
      recordId: komponen.komponen_id,
      oldValue: null,
      newValue: JSON.stringify({ nama, tipe, nilai }),
    });

    logger.info("Komponen gaji created", { id: komponen.komponen_id, nama });
    return komponen;
  } catch (error) {
    logger.error("Create komponen gaji failed", { error: error.message });
    throw error;
  }
};

const getKomponenGaji = async (filters) => {
  const { tipe, isActive, search, page = 1, limit = 50 } = filters;

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (tipe) where.tipe = tipe;
    if (isActive !== undefined) where.is_active = isActive;
    if (search) {
      where.nama = { contains: search, mode: "insensitive" };
    }

    const total = await prisma.komponen_gaji.count({ where });

    const data = await prisma.komponen_gaji.findMany({
      where,
      orderBy: [{ tipe: "asc" }, { nama: "asc" }],
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
    logger.error("Get komponen gaji failed", { error: error.message });
    throw error;
  }
};

const getKomponenGajiById = async (id) => {
  try {
    const komponen = await prisma.komponen_gaji.findUnique({
      where: { komponen_id: id },
      include: {
        tunjangan_pegawai: {
          where: { is_active: true },
          include: {
            user: { select: { id: true, namaLengkap: true } },
          },
        },
      },
    });

    if (!komponen) {
      throw new ResponseError(404, "Komponen gaji tidak ditemukan");
    }

    return komponen;
  } catch (error) {
    logger.error("Get komponen gaji by ID failed", { error: error.message });
    throw error;
  }
};

const updateKomponenGaji = async (id, data, auditInfo) => {
  const { userId, ipAddress } = auditInfo;

  try {
    const existing = await prisma.komponen_gaji.findUnique({
      where: { komponen_id: id },
    });

    if (!existing) {
      throw new ResponseError(404, "Komponen gaji tidak ditemukan");
    }

    const updateData = {};
    if (data.nama !== undefined) updateData.nama = data.nama;
    if (data.tipe !== undefined) updateData.tipe = data.tipe;
    if (data.nilai !== undefined) updateData.nilai = data.nilai;
    if (data.isProrate !== undefined) updateData.is_prorate = data.isProrate;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;
    if (data.keterangan !== undefined) updateData.keterangan = data.keterangan;
    updateData.updated_by = userId;
    updateData.updated_at = new Date();

    const updated = await prisma.komponen_gaji.update({
      where: { komponen_id: id },
      data: updateData,
    });

    await createAuditLog(prisma,{
      userId,
      ipAddress,
      action: "UPDATE_KOMPONEN_GAJI",
      tableName: "komponen_gaji",
      recordId: id,
      oldValue: JSON.stringify({ nama: existing.nama, tipe: existing.tipe, nilai: existing.nilai }),
      newValue: JSON.stringify(updateData),
    });

    logger.info("Komponen gaji updated", { id });
    return updated;
  } catch (error) {
    logger.error("Update komponen gaji failed", { error: error.message });
    throw error;
  }
};

const deleteKomponenGaji = async (id, auditInfo) => {
  const { userId, ipAddress } = auditInfo;

  try {
    const existing = await prisma.komponen_gaji.findUnique({
      where: { komponen_id: id },
      include: { tunjangan_pegawai: true, slip_gaji_detail: true },
    });

    if (!existing) {
      throw new ResponseError(404, "Komponen gaji tidak ditemukan");
    }

    // Cannot delete if already used
    if (existing.tunjangan_pegawai.length > 0 || existing.slip_gaji_detail.length > 0) {
      throw new ResponseError(
        400,
        "Tidak bisa menghapus komponen yang sudah digunakan di tunjangan pegawai atau slip gaji. Nonaktifkan saja."
      );
    }

    await prisma.komponen_gaji.delete({ where: { komponen_id: id } });

    await createAuditLog(prisma,{
      userId,
      ipAddress,
      action: "DELETE_KOMPONEN_GAJI",
      tableName: "komponen_gaji",
      recordId: id,
      oldValue: JSON.stringify({ nama: existing.nama }),
      newValue: null,
    });

    logger.info("Komponen gaji deleted", { id });
    return { message: "Komponen gaji berhasil dihapus" };
  } catch (error) {
    logger.error("Delete komponen gaji failed", { error: error.message });
    throw error;
  }
};

// ===================================================================
// T-18: TUNJANGAN PEGAWAI (Employee Allowances)
// ===================================================================

const createTunjangan = async (data, auditInfo) => {
  const { userId: empUserId, komponenId, nilaiOverride, berlakuDari, berlakuSampai } = data;
  const { userId, ipAddress } = auditInfo;

  try {
    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: empUserId } });
    if (!user) throw new ResponseError(404, "Karyawan tidak ditemukan");

    // Verify komponen exists
    const komponen = await prisma.komponen_gaji.findUnique({ where: { komponen_id: komponenId } });
    if (!komponen) throw new ResponseError(404, "Komponen gaji tidak ditemukan");

    // Check for existing same komponen for user
    const existing = await prisma.tunjangan_pegawai.findUnique({
      where: { user_id_komponen_id: { user_id: empUserId, komponen_id: komponenId } },
    });

    if (existing) {
      throw new ResponseError(400, `Karyawan sudah memiliki tunjangan "${komponen.nama}". Gunakan update.`);
    }

    const tunjangan = await prisma.tunjangan_pegawai.create({
      data: {
        user_id: empUserId,
        komponen_id: komponenId,
        nilai_override: nilaiOverride || null,
        berlaku_dari: new Date(berlakuDari),
        berlaku_sampai: berlakuSampai ? new Date(berlakuSampai) : null,
        is_active: true,
      },
      include: {
        user: { select: { id: true, namaLengkap: true } },
        komponen_gaji: true,
      },
    });

    await createAuditLog(prisma,{
      userId,
      ipAddress,
      action: "CREATE_TUNJANGAN",
      tableName: "tunjangan_pegawai",
      recordId: tunjangan.tunjangan_id,
      oldValue: null,
      newValue: JSON.stringify({ empUserId, komponenId, nilaiOverride, berlakuDari }),
    });

    logger.info("Tunjangan created", { id: tunjangan.tunjangan_id });
    return tunjangan;
  } catch (error) {
    logger.error("Create tunjangan failed", { error: error.message });
    throw error;
  }
};

const getTunjangan = async (filters) => {
  const { userId, komponenId, isActive, page = 1, limit = 20 } = filters;

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (userId) where.user_id = userId;
    if (komponenId) where.komponen_id = komponenId;
    if (isActive !== undefined) where.is_active = isActive;

    const total = await prisma.tunjangan_pegawai.count({ where });

    const data = await prisma.tunjangan_pegawai.findMany({
      where,
      include: {
        user: { select: { id: true, namaLengkap: true, email: true } },
        komponen_gaji: true,
      },
      orderBy: { created_at: "desc" },
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
    logger.error("Get tunjangan failed", { error: error.message });
    throw error;
  }
};

const updateTunjangan = async (id, data, auditInfo) => {
  const { userId, ipAddress } = auditInfo;

  try {
    const existing = await prisma.tunjangan_pegawai.findUnique({
      where: { tunjangan_id: id },
    });

    if (!existing) throw new ResponseError(404, "Tunjangan tidak ditemukan");

    const updateData = {};
    if (data.nilaiOverride !== undefined) updateData.nilai_override = data.nilaiOverride;
    if (data.berlakuDari !== undefined) updateData.berlaku_dari = new Date(data.berlakuDari);
    if (data.berlakuSampai !== undefined) updateData.berlaku_sampai = data.berlakuSampai ? new Date(data.berlakuSampai) : null;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;
    updateData.updated_at = new Date();

    const updated = await prisma.tunjangan_pegawai.update({
      where: { tunjangan_id: id },
      data: updateData,
      include: {
        user: { select: { id: true, namaLengkap: true } },
        komponen_gaji: true,
      },
    });

    await createAuditLog(prisma,{
      userId,
      ipAddress,
      action: "UPDATE_TUNJANGAN",
      tableName: "tunjangan_pegawai",
      recordId: id,
      oldValue: JSON.stringify(existing),
      newValue: JSON.stringify(updateData),
    });

    logger.info("Tunjangan updated", { id });
    return updated;
  } catch (error) {
    logger.error("Update tunjangan failed", { error: error.message });
    throw error;
  }
};

const deleteTunjangan = async (id, auditInfo) => {
  const { userId, ipAddress } = auditInfo;

  try {
    const existing = await prisma.tunjangan_pegawai.findUnique({
      where: { tunjangan_id: id },
    });

    if (!existing) throw new ResponseError(404, "Tunjangan tidak ditemukan");

    await prisma.tunjangan_pegawai.delete({ where: { tunjangan_id: id } });

    await createAuditLog(prisma,{
      userId,
      ipAddress,
      action: "DELETE_TUNJANGAN",
      tableName: "tunjangan_pegawai",
      recordId: id,
      oldValue: JSON.stringify(existing),
      newValue: null,
    });

    logger.info("Tunjangan deleted", { id });
    return { message: "Tunjangan berhasil dihapus" };
  } catch (error) {
    logger.error("Delete tunjangan failed", { error: error.message });
    throw error;
  }
};

// ===================================================================
// T-19: GAJI PEGAWAI + RIWAYAT (Employee Salary + History/Versioning)
// ===================================================================

const getGajiPegawai = async (userId) => {
  try {
    const gaji = await prisma.gaji_pegawai.findUnique({
      where: { user_id: userId },
      include: {
        user: {
          select: { id: true, namaLengkap: true, email: true },
        },
      },
    });

    if (!gaji) {
      throw new ResponseError(404, "Data gaji pegawai belum diatur");
    }

    // Get active tunjangan
    const tunjangan = await prisma.tunjangan_pegawai.findMany({
      where: {
        user_id: userId,
        is_active: true,
        berlaku_dari: { lte: new Date() },
        OR: [
          { berlaku_sampai: null },
          { berlaku_sampai: { gte: new Date() } },
        ],
      },
      include: { komponen_gaji: true },
    });

    return { gaji, tunjangan };
  } catch (error) {
    logger.error("Get gaji pegawai failed", { error: error.message });
    throw error;
  }
};

const updateGajiPegawai = async (userId, data, auditInfo) => {
  const { gajiPokok, tarifLembur, tarifHarian, tipeGaji, alasan } = data;
  const { userId: adminId, ipAddress } = auditInfo;

  try {
    // Check user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ResponseError(404, "Karyawan tidak ditemukan");

    // Get existing or create new
    const existing = await prisma.gaji_pegawai.findUnique({
      where: { user_id: userId },
    });

    const oldValues = existing
      ? { gajiPokok: existing.gaji_pokok, tarifLembur: existing.tarif_lembur }
      : null;

    // Upsert gaji pegawai
    const gaji = await prisma.gaji_pegawai.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        gaji_pokok: gajiPokok,
        tarif_lembur: tarifLembur || 0,
        tarif_harian: tarifHarian || null,
        tipe_gaji: tipeGaji || "bulanan",
        created_by: adminId,
        updated_by: adminId,
      },
      update: {
        gaji_pokok: gajiPokok,
        tarif_lembur: tarifLembur || 0,
        tarif_harian: tarifHarian || null,
        tipe_gaji: tipeGaji || "bulanan",
        updated_by: adminId,
        updated_at: new Date(),
      },
    });

    // Create riwayat entry
    // Close previous riwayat if exists
    const lastRiwayat = await prisma.riwayat_gaji_pegawai.findFirst({
      where: { user_id: userId, berlaku_sampai: null },
      orderBy: { berlaku_dari: "desc" },
    });

    if (lastRiwayat) {
      await prisma.riwayat_gaji_pegawai.update({
        where: { riwayat_id: lastRiwayat.riwayat_id },
        data: { berlaku_sampai: new Date() },
      });
    }

    // Create new riwayat entry
    await prisma.riwayat_gaji_pegawai.create({
      data: {
        user_id: userId,
        gaji_pokok: gajiPokok,
        tarif_lembur: tarifLembur || 0,
        berlaku_dari: new Date(),
        berlaku_sampai: null,
        alasan,
        created_by: adminId,
      },
    });

    await createAuditLog(prisma,{
      userId: adminId,
      ipAddress,
      action: existing ? "UPDATE_GAJI_PEGAWAI" : "CREATE_GAJI_PEGAWAI",
      tableName: "gaji_pegawai",
      recordId: gaji.gaji_id,
      oldValue: oldValues ? JSON.stringify(oldValues) : null,
      newValue: JSON.stringify({ gajiPokok, tarifLembur, alasan }),
    });

    logger.info("Gaji pegawai updated", { userId, gajiPokok });
    return gaji;
  } catch (error) {
    logger.error("Update gaji pegawai failed", { error: error.message });
    throw error;
  }
};

const getRiwayatGaji = async (userId, filters) => {
  const { page = 1, limit = 20 } = filters;

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const total = await prisma.riwayat_gaji_pegawai.count({
      where: { user_id: userId },
    });

    const data = await prisma.riwayat_gaji_pegawai.findMany({
      where: { user_id: userId },
      orderBy: { berlaku_dari: "desc" },
      include: {
        user: { select: { id: true, namaLengkap: true } },
      },
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
    logger.error("Get riwayat gaji failed", { error: error.message });
    throw error;
  }
};

module.exports = {
  // T-17
  createKomponenGaji,
  getKomponenGaji,
  getKomponenGajiById,
  updateKomponenGaji,
  deleteKomponenGaji,
  // T-18
  createTunjangan,
  getTunjangan,
  updateTunjangan,
  deleteTunjangan,
  // T-19
  getGajiPegawai,
  updateGajiPegawai,
  getRiwayatGaji,
};
