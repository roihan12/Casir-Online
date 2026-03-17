const prisma = require("../config/db");
const { createAuditLog } = require("../utils/auditLog");
const { ResponseError } = require("../error/responseError");
const { validate } = require("../validation/validation");
const {
  createPelangganSchema,
  updatePelangganSchema,
} = require("../validation/pelangganValidation");

const createPelanggan = async (data, { userId, ipAddress }) => {
  const validData = validate(createPelangganSchema, data);

  const cabang = await prisma.cabang.findUnique({
    where: { id: data.cabang_id },
  });

  if (!cabang) {
    throw new ResponseError(404, "Branch not found");
  }

  const pelangganExists = await prisma.pelanggan.findFirst({
    where: { namaPelanggan: validData.namaPelanggan },
  });

  if (pelangganExists) {
    throw new ResponseError(400, "Pelanggan already exists");
  }

  const pelangganNew = await prisma.pelanggan.create({
    data: validData,
  });

  await createAuditLog(prisma, {
    userId,
    ipAddress,
    cabang_id: data.cabang_id,
    action: "CREATE",
    tableName: "pelanggan",
    record_id: pelangganNew.id,
    oldValues: null,
    new_values: validData,
  });

  return pelangganNew;
};

const updatePelanggan = async (id, data, { userId, ipAddress }) => {
  const validData = validate(updatePelangganSchema, data);

  const oldData = await prisma.pelanggan.findUnique({ where: { id } });

  if (!oldData) {
    throw new ResponseError(404, "Pelanggan not found");
  }

  const updated = await prisma.pelanggan.update({
    where: { id },
    data: validData,
  });

  await createAuditLog(prisma, {
    userId,
    ipAddress,
    cabang_id: data.cabang_id,
    action: "UPDATE",
    tableName: "pelanggan",
    record_id: updated.id,
    oldValues: oldData,
    new_values: validData,
  });

  return updated;
};

const deletePelanggan = async (id, { userId, ipAddress }) => {
  const oldData = await prisma.pelanggan.findUnique({ where: { id } });

  if (!oldData) {
    throw new ResponseError(404, "Pelanggan not found");
  }

  await prisma.pelanggan.delete({ where: { id } });

  await createAuditLog(prisma, {
    userId,
    ipAddress,
    cabang_id: oldData.cabang_id,
    action: "DELETE",
    tableName: "pelanggan",
    record_id: oldData.id,
    oldValues: oldData,
    new_values: null,
  });

  return { message: "Pelanggan deleted successfully" };
};

const getAllPelanggan = async ({
  page = 1,
  limit = 10,
  search = "",
  cabang_id = null,
  segmen = null,
  status = null,
}) => {
  const skip = (page - 1) * limit;
  const whereClause = {
    ...(search && {
      OR: [
        { namaPelanggan: { contains: search, mode: "insensitive" } },
        { telepon: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...(cabang_id && { cabang_id }),
    ...(segmen && segmen !== "all" && { segmen }),
    ...(status && status !== "all" && { status }),
  };

  const [data, total] = await Promise.all([
    prisma.pelanggan.findMany({
      skip,
      take: limit,
      where: whereClause,
      orderBy: { createdAt: "desc" },
    }),
    prisma.pelanggan.count({ where: whereClause }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      totalItems: total,
      totalPages,
      currentPage: parseInt(page),
      itemsPerPage: parseInt(limit),
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

const getCustomerStats = async (cabang_id = null) => {
  const whereClause = cabang_id ? { cabang_id } : {};

  const [total, vip, grosir, retail, active, inactive] = await Promise.all([
    prisma.pelanggan.count({ where: whereClause }),
    prisma.pelanggan.count({ where: { ...whereClause, segmen: "vip" } }),
    prisma.pelanggan.count({ where: { ...whereClause, segmen: "grosir" } }),
    prisma.pelanggan.count({ where: { ...whereClause, segmen: "retail" } }),
    prisma.pelanggan.count({
      where: { ...whereClause, status: "aktif" },
    }),
    prisma.pelanggan.count({
      where: { ...whereClause, status: "nonaktif" },
    }),
  ]);

  return {
    total,
    vip,
    grosir,
    retail,
    active,
    inactive,
  };
};

const getPelangganById = async (id) => {
  const pelanggan = await prisma.pelanggan.findUnique({ where: { id } });

  if (!pelanggan) {
    throw new ResponseError(404, "Pelanggan not found");
  }

  return pelanggan;
};

const getPelangganByCabang = async (
  cabang_id,
  { page = 1, limit = 10, search = "" }
) => {
  const skip = (page - 1) * limit;
  const whereClause = {
    cabang_id,
    namaPelanggan: search
      ? { contains: search, mode: "insensitive" }
      : undefined,
  };

  const [data, total] = await Promise.all([
    prisma.pelanggan.findMany({
      skip,
      take: limit,
      where: whereClause,
      orderBy: { createdAt: "desc" },
    }),
    prisma.pelanggan.count({ where: whereClause }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      totalItems: total,
      totalPages,
      currentPage: parseInt(page),
      itemsPerPage: parseInt(limit),
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

const getCustomerTransactions = async (
  pelanggan_id,
  { page = 1, limit = 10 }
) => {
  const skip = (page - 1) * limit;
  const whereClause = { pelanggan_id };

  const [data, total] = await Promise.all([
    prisma.transaksi.findMany({
      skip,
      take: limit,
      where: whereClause,
      include: {
        transaksi_detail: true,
      },
      orderBy: { tanggal: "desc" },
    }),

    prisma.transaksi.count({ where: whereClause }),
  ]);

  // Format response for UI compatibility
  const formattedData = data.map((tx) => ({
    ...tx,
    jumlah_produk: tx.transaksi_detail ? tx.transaksi_detail.reduce(
      (acc, detail) => acc + (detail.jumlah || detail.qty || 1),
      0
    ) : 0,
    transaksi_detail: undefined, // remove to keep payload small
  }));

  const totalPages = Math.ceil(total / limit);

  return {
    data: formattedData,
    pagination: {
      totalItems: total,
      totalPages,
      currentPage: parseInt(page),
      itemsPerPage: parseInt(limit),
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

module.exports = {
  createPelanggan,
  updatePelanggan,
  deletePelanggan,
  getAllPelanggan,
  getPelangganById,
  getPelangganByCabang,
  getCustomerStats,
  getCustomerTransactions,
};

