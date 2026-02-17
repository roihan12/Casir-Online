const prisma = require("../config/db");
const { ResponseError } = require("../error/responseError");
const { logger } = require("../utils/logger");

// ═══════════════════════════════════════════════
// REGU CRUD
// ═══════════════════════════════════════════════

/**
 * Buat regu baru
 */
const createRegu = async (data, userId) => {
  const { namaRegu, cabangId, keterangan } = data;

  try {
    // Verifikasi cabang
    const cabang = await prisma.cabang.findUnique({ where: { id: cabangId } });
    if (!cabang) throw new ResponseError(404, "Cabang not found");

    // Cek nama regu tidak duplikat dalam cabang yang sama
    const existing = await prisma.regu.findFirst({
      where: { nama_regu: namaRegu, cabang_id: cabangId, deleted_at: null },
    });
    if (existing) {
      throw new ResponseError(409, `Regu "${namaRegu}" sudah ada di cabang ini`);
    }


    const regu = await prisma.regu.create({
      data: {
        nama_regu: namaRegu,
        cabang_id: cabangId,
       keterangan: keterangan || null,
        created_by: userId,
      },
      include: {
        cabang: { select: { id: true, namaCabang: true } },
        _count: { select: { regu_member: true } },
      },
    });



    logger.info("Regu created", { reguId: regu.id, namaRegu, createdBy: userId });
    return regu;
  } catch (error) {
    logger.error("Create regu failed", { error: error.message, data });
    throw error;
  }
};

/**
 * Get list regu dengan filter & pagination
 */
const getRegu = async (filters) => {
  const { cabangId, search, page = 1, limit = 20 } = filters;

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { deleted_at: null };
    if (cabangId) where.cabang_id = cabangId;
    if (search) {
      where.nama_regu = { contains: search, mode: "insensitive" };
    }

    const [total, reguList] = await Promise.all([
      prisma.regu.count({ where }),
      prisma.regu.findMany({
        where,
        include: {
          cabang: { select: { id: true, namaCabang: true } },
          _count: { select: { regu_member: true } },
        },
        orderBy: { nama_regu: "asc" },
        skip,
        take: parseInt(limit),
      }),
    ]);

    return {
      data: reguList,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  } catch (error) {
    logger.error("Get regu failed", { error: error.message, filters });
    throw error;
  }
};

/**
 * Get regu by ID (beserta members)
 */
const getReguById = async (reguId) => {
  try {
    const regu = await prisma.regu.findFirst({
      where: { id: reguId, deleted_at: null },
      include: {
        cabang: { select: { id: true, namaCabang: true } },
      regu_member: {
          include: {
            user: {
              select: {
                id: true,
                namaLengkap: true,
                email: true,
              },
            },
          },
          orderBy: { joined_at: "asc" },
        },
      },
    });

    if (!regu) throw new ResponseError(404, "Regu not found");
    return regu;
  } catch (error) {
    logger.error("Get regu by ID failed", { error: error.message, reguId });
    throw error;
  }
};

/**
 * Update regu
 */
const updateRegu = async (reguId, data, auditInfo) => {
  const { namaRegu, keterangan } = data;

  try {
    const existing = await prisma.regu.findFirst({
      where: { id: reguId, deleted_at: null },
    });
    if (!existing) throw new ResponseError(404, "Regu not found");

    // Cek nama duplikat dalam cabang yang sama (kecuali dirinya sendiri)
    if (namaRegu && namaRegu !== existing.nama_regu) {
      const duplicate = await prisma.regu.findFirst({
        where: {
          nama_regu: namaRegu,
          cabang_id: existing.cabang_id,
          deleted_at: null,
          id: { not: reguId },
        },
      });
      if (duplicate) {
        throw new ResponseError(409, `Regu "${namaRegu}" sudah ada di cabang ini`);
      }
    }

    const updated = await prisma.regu.update({
      where: { id: reguId },
      data: {
        ...(namaRegu !== undefined && { nama_regu: namaRegu }),
        ...(keterangan !== undefined && { keterangan }),
        updated_by: auditInfo.userId,
      },
      include: {
        cabang: { select: { id: true, namaCabang: true } },
        _count: { select: { regu_member: true } },
      },
    });

    logger.info("Regu updated", { reguId, updatedBy: auditInfo.userId });
    return updated;
  } catch (error) {
    logger.error("Update regu failed", { error: error.message, reguId });
    throw error;
  }
};

/**
 * Soft delete regu
 * Tidak bisa dihapus jika masih punya member aktif
 */
const deleteRegu = async (reguId, auditInfo) => {
  try {
    const regu = await prisma.regu.findFirst({
      where: { id: reguId, deleted_at: null },
      include: { _count: { select: { regu_member: true } } },
    });
    if (!regu) throw new ResponseError(404, "Regu not found");

    if (regu._count.regu_member > 0) {
      throw new ResponseError(
        400,
        `Regu masih memiliki ${regu._count.regu_member} anggota. Hapus anggota terlebih dahulu.`
      );
    }

    await prisma.regu.update({
      where: { id: reguId },
      data: {
        deleted_at: new Date(),
        updated_by: auditInfo.userId,
      },
    });

    logger.info("Regu deleted", { reguId, deletedBy: auditInfo.userId });
    return { success: true, message: "Regu berhasil dihapus" };
  } catch (error) {
    logger.error("Delete regu failed", { error: error.message, reguId });
    throw error;
  }
};

// ═══════════════════════════════════════════════
// REGU MEMBER CRUD
// ═══════════════════════════════════════════════

/**
 * Tambah anggota ke regu (bulk)
 * Validasi:
 * - User harus ada
 * - User belum jadi anggota regu ini
 * - (Opsional) User tidak boleh di 2 regu dalam cabang yang sama
 */
const addReguMember = async (reguId, data, auditInfo) => {
  const { userIds } = data;

  try {
    // Verifikasi regu
    const regu = await prisma.regu.findFirst({
      where: { id: reguId, deleted_at: null },
    });
    if (!regu) throw new ResponseError(404, "Regu not found");

    // Verifikasi semua user ada
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, namaLengkap: true },
    });
    if (users.length !== userIds.length) {
      const foundIds = users.map((u) => u.id);
      const missing = userIds.filter((id) => !foundIds.includes(id));
      throw new ResponseError(404, `User tidak ditemukan: ${missing.join(", ")}`);
    }

    // Cek user yang sudah jadi anggota regu ini
    const existingMembers = await prisma.regu_member.findMany({
      where: { regu_id: reguId, user_id: { in: userIds } },
      select: { user_id: true },
    });
    if (existingMembers.length > 0) {
      const existingIds = existingMembers.map((m) => m.user_id);
      const existingNames = users
        .filter((u) => existingIds.includes(u.id))
        .map((u) => u.namaLengkap);
      throw new ResponseError(
        409,
        `User berikut sudah menjadi anggota regu ini: ${existingNames.join(", ")}`
      );
    }

    // Cek apakah user sudah ada di regu lain dalam cabang yang sama
    const conflictMembers = await prisma.regu_member.findMany({
      where: {
        user_id: { in: userIds },
        regu: {
          cabang_id: regu.cabang_id,
          deleted_at: null,
          id: { not: reguId },
        },
      },
      include: {
        user: { select: { namaLengkap: true } },
        regu: { select: { nama_regu: true } },
      },
    });

    if (conflictMembers.length > 0) {
      const conflicts = conflictMembers
        .map((m) => `${m.user.namaLengkap} (sudah di Regu ${m.regu.nama_regu})`)
        .join(", ");
      throw new ResponseError(
        409,
        `User berikut sudah terdaftar di regu lain dalam cabang yang sama: ${conflicts}`
      );
    }

    // Bulk insert
    const membersToCreate = userIds.map((userId) => ({
      regu_id: reguId,
      user_id: userId,
      created_by: auditInfo.userId,
    }));

    await prisma.regu_member.createMany({
      data: membersToCreate,
      skipDuplicates: true,
    });

    // Ambil data member yang baru ditambahkan untuk response
    const newMembers = await prisma.regu_member.findMany({
      where: { regu_id: reguId, user_id: { in: userIds } },
      include: {
        user: { select: { id: true, namaLengkap: true, email: true } },
      },
      orderBy: { joined_at: "asc" },
    });

    logger.info("Regu members added", {
      reguId,
      userIds,
      addedBy: auditInfo.userId,
    });

    return {
      reguId,
      namaRegu: regu.nama_regu,
      addedCount: newMembers.length,
      members: newMembers,
    };
  } catch (error) {
    logger.error("Add regu member failed", { error: error.message, reguId, data });
    throw error;
  }
};

/**
 * Get daftar anggota regu dengan pagination
 */
const getReguMembers = async (reguId, filters) => {
  const { page = 1, limit = 20 } = filters;

  try {
    const regu = await prisma.regu.findFirst({
      where: { id: reguId, deleted_at: null },
    });
    if (!regu) throw new ResponseError(404, "Regu not found");

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [total, members] = await Promise.all([
      prisma.regu_member.count({ where: { regu_id: reguId } }),
      prisma.regu_member.findMany({
        where: { regu_id: reguId },
        include: {
          user: { select: { id: true, namaLengkap: true, email: true } },
        },
        orderBy: { joined_at: "asc" },
        skip,
        take: parseInt(limit),
      }),
    ]);

    return {
      reguId,
      namaRegu: regu.nama_regu,
      data: members,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  } catch (error) {
    logger.error("Get regu members failed", { error: error.message, reguId });
    throw error;
  }
};

/**
 * Hapus anggota dari regu (bulk)
 */
const removeReguMember = async (reguId, data, auditInfo) => {
  const { userIds } = data;

  try {
    const regu = await prisma.regu.findFirst({
      where: { id: reguId, deleted_at: null },
    });
    if (!regu) throw new ResponseError(404, "Regu not found");

    // Verifikasi user memang anggota regu ini
    const existingMembers = await prisma.regu_member.findMany({
      where: { regu_id: reguId, user_id: { in: userIds } },
      include: { user: { select: { namaLengkap: true } } },
    });

    if (existingMembers.length === 0) {
      throw new ResponseError(404, "Tidak ada user yang ditemukan sebagai anggota regu ini");
    }

    // Kalau ada yang tidak ditemukan, info tapi tidak error
    const foundIds = existingMembers.map((m) => m.user_id);
    const notFoundIds = userIds.filter((id) => !foundIds.includes(id));

    await prisma.regu_member.deleteMany({
      where: { regu_id: reguId, user_id: { in: foundIds } },
    });

    logger.info("Regu members removed", {
      reguId,
      removedUserIds: foundIds,
      removedBy: auditInfo.userId,
    });

    return {
      success: true,
      message: `${foundIds.length} anggota berhasil dihapus dari regu`,
      removedCount: foundIds.length,
      ...(notFoundIds.length > 0 && {
        skipped: `${notFoundIds.length} userId tidak ditemukan sebagai anggota: ${notFoundIds.join(", ")}`,
      }),
    };
  } catch (error) {
    logger.error("Remove regu member failed", { error: error.message, reguId });
    throw error;
  }
};

/**
 * Pindah anggota dari satu regu ke regu lain
 */
const moveReguMember = async (data, auditInfo) => {
  const { userIds, fromReguId, toReguId } = data;

  try {
    // Verifikasi kedua regu
    const [fromRegu, toRegu] = await Promise.all([
      prisma.regu.findFirst({ where: { id: fromReguId, deleted_at: null } }),
      prisma.regu.findFirst({ where: { id: toReguId, deleted_at: null } }),
    ]);

    if (!fromRegu) throw new ResponseError(404, "Regu asal tidak ditemukan");
    if (!toRegu) throw new ResponseError(404, "Regu tujuan tidak ditemukan");

    if (fromReguId === toReguId) {
      throw new ResponseError(400, "Regu asal dan tujuan tidak boleh sama");
    }

    // Verifikasi user ada di regu asal
    const existingMembers = await prisma.regu_member.findMany({
      where: { regu_id: fromReguId, user_id: { in: userIds } },
      select: { user_id: true },
    });

    if (existingMembers.length === 0) {
      throw new ResponseError(404, "User tidak ditemukan di regu asal");
    }

    const foundIds = existingMembers.map((m) => m.user_id);

    // Transaksi: hapus dari regu asal, tambah ke regu tujuan
    await prisma.$transaction(async (tx) => {
      await tx.regu_member.deleteMany({
        where: { regu_id: fromReguId, user_id: { in: foundIds } },
      });

      await tx.regu_member.createMany({
        data: foundIds.map((userId) => ({
          regu_id: toReguId,
          user_id: userId,
          created_by: auditInfo.userId,
        })),
        skipDuplicates: true,
      });
    });

    logger.info("Regu members moved", {
      fromReguId,
      toReguId,
      userIds: foundIds,
      movedBy: auditInfo.userId,
    });

    return {
      success: true,
      message: `${foundIds.length} anggota berhasil dipindah ke ${toRegu.nama_regu}`,
      movedCount: foundIds.length,
    };
  } catch (error) {
    logger.error("Move regu member failed", { error: error.message, data });
    throw error;
  }
};

module.exports = {
  // Regu
  createRegu,
  getRegu,
  getReguById,
  updateRegu,
  deleteRegu,
  // Member
  addReguMember,
  getReguMembers,
  removeReguMember,
  moveReguMember,
};