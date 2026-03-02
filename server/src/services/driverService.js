const prisma = require("../config/db");
const { ResponseError } = require("../error/responseError");

/**
 * Driver Service — CRUD operations for store delivery drivers
 */

/**
 * Get all drivers for a branch
 */
const getDrivers = async (cabangId, { page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit;

  const [drivers, total] = await Promise.all([
    prisma.driver.findMany({
      where: { cabang_id: cabangId },
      orderBy: { created_at: "desc" },
      skip: offset,
      take: limit,
    }),
    prisma.driver.count({ where: { cabang_id: cabangId } }),
  ]);

  console.log(drivers);

  return {
    data: drivers.map((d) => ({
      id: d.driver_id,
      nama: d.nama,
      no_hp: d.no_hp,
      email: d.email,
      foto_url: d.foto_url,
      jenis_kendaraan: d.jenis_kendaraan,
      plat_kendaraan: d.plat_kendaraan,
      status: d.status,
      is_available: d.is_available,
      total_deliveries: d.total_deliveries,
      successful_deliveries: d.successful_deliveries,
      average_rating: d.average_rating ? Number(d.average_rating) : null,
      last_seen_at: d.last_seen_at,
    })),
    pagination: {
      page,
      limit,
      totalData: total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get available drivers for a branch
 */
const getAvailableDrivers = async (cabangId) => {
  const drivers = await prisma.driver.findMany({
    where: {
      cabang_id: cabangId,
      status: "ACTIVE",
      is_available: true,
    },
    orderBy: { nama: "asc" },
  });

  return drivers.map((d) => ({
    id: d.driver_id,
    nama: d.nama,
    no_hp: d.no_hp,
    jenis_kendaraan: d.jenis_kendaraan,
    plat_kendaraan: d.plat_kendaraan,
    total_deliveries: d.total_deliveries,
    average_rating: d.average_rating ? Number(d.average_rating) : null,
  }));
};

/**
 * Create a new driver
 */
const createDriver = async (cabangId, data) => {
  const driver = await prisma.driver.create({
    data: {
      cabang_id: cabangId,
      nama: data.nama,
      no_hp: data.no_hp,
      email: data.email || null,
      jenis_kendaraan: data.jenis_kendaraan || null,
      plat_kendaraan: data.plat_kendaraan || null,
      max_delivery_distance: data.max_delivery_distance || null,
      status: "ACTIVE",
      is_available: true,
    },
  });

  return {
    id: driver.driver_id,
    nama: driver.nama,
    no_hp: driver.no_hp,
    status: driver.status,
  };
};

/**
 * Update a driver
 */
const updateDriver = async (driverId, data) => {
  const existing = await prisma.driver.findUnique({
    where: { driver_id: driverId },
  });

  if (!existing) {
    throw new ResponseError(404, "Driver tidak ditemukan");
  }

  const driver = await prisma.driver.update({
    where: { driver_id: driverId },
    data: {
      ...(data.nama && { nama: data.nama }),
      ...(data.no_hp && { no_hp: data.no_hp }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.jenis_kendaraan !== undefined && {
        jenis_kendaraan: data.jenis_kendaraan,
      }),
      ...(data.plat_kendaraan !== undefined && {
        plat_kendaraan: data.plat_kendaraan,
      }),
      ...(data.max_delivery_distance !== undefined && {
        max_delivery_distance: data.max_delivery_distance,
      }),
    },
  });

  return {
    id: driver.driver_id,
    nama: driver.nama,
    no_hp: driver.no_hp,
    status: driver.status,
  };
};

/**
 * Delete a driver (soft — set status OFFLINE)
 */
const deleteDriver = async (driverId) => {
  const existing = await prisma.driver.findUnique({
    where: { driver_id: driverId },
  });

  if (!existing) {
    throw new ResponseError(404, "Driver tidak ditemukan");
  }

  // Check for active deliveries
  const activeOrders = await prisma.transaksi.count({
    where: {
      delivery_driver_id: driverId,
      order_status: { in: ["CONFIRMED"] },
      delivery_status: { in: ["ASSIGNED", "PICKED_UP"] },
    },
  });

  if (activeOrders > 0) {
    throw new ResponseError(
      400,
      "Driver masih memiliki pengiriman aktif. Selesaikan dulu."
    );
  }

  await prisma.driver.update({
    where: { driver_id: driverId },
    data: { status: "OFFLINE", is_available: false },
  });

  return { success: true };
};

/**
 * Toggle driver status (ACTIVE/OFFLINE)
 */
const toggleDriverStatus = async (driverId) => {
  const driver = await prisma.driver.findUnique({
    where: { driver_id: driverId },
  });

  if (!driver) {
    throw new ResponseError(404, "Driver tidak ditemukan");
  }

  const newStatus = driver.status === "ACTIVE" ? "OFFLINE" : "ACTIVE";
  const newAvailable = newStatus === "ACTIVE";

  const updated = await prisma.driver.update({
    where: { driver_id: driverId },
    data: {
      status: newStatus,
      is_available: newAvailable,
      last_seen_at: new Date(),
    },
  });

  return {
    id: updated.driver_id,
    nama: updated.nama,
    status: updated.status,
    is_available: updated.is_available,
  };
};

module.exports = {
  getDrivers,
  getAvailableDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
  toggleDriverStatus,
};
