const prisma = require("../config/db");
const { ResponseError } = require("../error/responseError");
const { logger } = require("../utils/logger");

/**
 * Delivery Service — Handles delivery lifecycle management
 */

/**
 * Get online orders for admin delivery dashboard
 */
const getDeliveryOrders = async (cabangId, filters = {}) => {
  const { status = "ALL", page = 1, limit = 20 } = filters;
  const offset = (page - 1) * limit;

  const where = {
    cabang_id: cabangId,
    order_source: "ECATALOG",
    order_type: "DELIVERY",
    order_status: { notIn: ["CANCELLED"] },
  };

  // Filter by delivery status
  if (status !== "ALL") {
    if (status === "PENDING" || status === "CONFIRMED") {
      where.order_status = status;
      where.delivery_status = null; // Not yet assigned
    } else {
      where.delivery_status = status;
    }
  }

  const [orders, total] = await Promise.all([
    prisma.transaksi.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: offset,
      take: limit,
      include: {
        pelanggan: {
          select: { id: true, namaPelanggan: true, telepon: true },
        },
        driver: {
          select: {
            driver_id: true,
            nama: true,
            no_hp: true,
            plat_kendaraan: true,
          },
        },
        transaksi_detail: {
          include: {
            produk: {
              include: {
                produkMaster: {
                  select: { namaProduk: true },
                },
              },
            },
          },
        },
        delivery_tracking: {
          orderBy: { created_at: "asc" },
        },
      },
    }),
    prisma.transaksi.count({ where }),
  ]);

  return {
    data: orders.map((o) => ({
      transaksi_id: o.transaksi_id,
      nomor_transaksi: o.nomor_transaksi,
      order_status: o.order_status,
      delivery_status: o.delivery_status,
      status_pembayaran: o.status_pembayaran,
      total: Number(o.total),
      customer_name:
        o.pelanggan?.namaPelanggan || o.keterangan?.split(" - ")[0] || "-",
      customer_phone: o.pelanggan?.telepon || "-",
      customer_address: o.customer_address,
      customer_notes: o.customer_notes,
      created_at: o.created_at,
      driver: o.driver
        ? {
            id: o.driver.driver_id,
            nama: o.driver.nama,
            no_hp: o.driver.no_hp,
            plat: o.driver.plat_kendaraan,
          }
        : null,
      items: o.transaksi_detail.map((d) => ({
        nama: d.produk?.produkMaster?.namaProduk || "Unknown",
        jumlah: d.jumlah,
        total: Number(d.total),
      })),
      items_count: o.transaksi_detail.reduce((s, d) => s + d.jumlah, 0),
      tracking: o.delivery_tracking.map(t => ({
        status: t.status,
        latitude: t.latitude ? Number(t.latitude) : null,
        longitude: t.longitude ? Number(t.longitude) : null,
        created_at: t.created_at,
      }))
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
 * Assign driver to an order
 */
const assignDriver = async (transaksiId, driverId) => {
  const transaksi = await prisma.transaksi.findFirst({
    where: {
      transaksi_id: transaksiId,
      order_source: "ECATALOG",
      order_type: "DELIVERY",
    },
  });

  if (!transaksi) {
    throw new ResponseError(404, "Order delivery tidak ditemukan");
  }

  if (transaksi.order_status !== "CONFIRMED") {
    throw new ResponseError(
      400,
      "Order harus berstatus CONFIRMED untuk assign driver"
    );
  }

  const driver = await prisma.driver.findFirst({
    where: {
      driver_id: driverId,
      cabang_id: transaksi.cabang_id,
      status: "ACTIVE",
    },
  });

  if (!driver) {
    throw new ResponseError(404, "Driver tidak ditemukan atau tidak aktif");
  }

  await prisma.$transaction(async (tx) => {
    // Update transaksi
    await tx.transaksi.update({
      where: { transaksi_id: transaksiId },
      data: {
        delivery_driver_id: driverId,
        delivery_status: "ASSIGNED",
      },
    });

    // Create tracking entry
    await tx.delivery_tracking.create({
      data: {
        transaksi_id: transaksiId,
        driver_id: driverId,
        status: "ASSIGNED",
        notes: `Driver ${driver.nama} ditugaskan`,
      },
    });
  });

  // TODO: Send WA notification to driver
  // notificationService.notifyNewDeliveryTask(driverId, transaksiId);

  return {
    success: true,
    message: `Driver ${driver.nama} berhasil ditugaskan`,
  };
};

/**
 * Update delivery status (PICKED_UP or DELIVERED)
 */
const updateDeliveryStatus = async (transaksiId, data) => {
  const { status, notes, latitude, longitude, photo_url } = data;

  const transaksi = await prisma.transaksi.findFirst({
    where: {
      transaksi_id: transaksiId,
      order_source: "ECATALOG",
      order_type: "DELIVERY",
    },
  });

  if (!transaksi) {
    throw new ResponseError(404, "Order delivery tidak ditemukan");
  }

  // Validate status transition
  if (status === "PICKED_UP" && transaksi.delivery_status !== "ASSIGNED") {
    throw new ResponseError(
      400,
      "Order harus berstatus ASSIGNED untuk picked up"
    );
  }

  if (status === "DELIVERED" && transaksi.delivery_status !== "PICKED_UP") {
    throw new ResponseError(
      400,
      "Order harus berstatus PICKED_UP untuk delivered"
    );
  }

  await prisma.$transaction(async (tx) => {
    const updateData = {
      delivery_status: status,
    };

    if (status === "PICKED_UP") {
      updateData.delivery_sent_at = new Date();
    }

    if (status === "DELIVERED") {
      updateData.delivery_completed_at = new Date();
      // If payment is already LUNAS (Payment Link), mark order as COMPLETED
      if (transaksi.status_pembayaran === "LUNAS") {
        updateData.order_status = "COMPLETED";
      }
    }

    await tx.transaksi.update({
      where: { transaksi_id: transaksiId },
      data: updateData,
    });

    // Create tracking entry
    await tx.delivery_tracking.create({
      data: {
        transaksi_id: transaksiId,
        driver_id: transaksi.delivery_driver_id,
        status,
        notes: notes || null,
        latitude: latitude || null,
        longitude: longitude || null,
        photo_url: photo_url || null,
      },
    });
  });

  // TODO: Send WA notification
  // if (status === "PICKED_UP") notificationService.notifyOrderShipped(transaksiId);
  // if (status === "DELIVERED") notificationService.notifyOrderDelivered(transaksiId);

  return {
    success: true,
    message:
      status === "PICKED_UP"
        ? "Barang sudah diambil, dalam perjalanan"
        : "Pengiriman selesai",
  };
};

/**
 * COD: Mark payment as received by driver
 */
const markPaymentReceived = async (transaksiId, data) => {
  const { jumlah_bayar, notes } = data;

  const transaksi = await prisma.transaksi.findFirst({
    where: {
      transaksi_id: transaksiId,
      order_source: "ECATALOG",
    },
    include: { pembayaran: true },
  });

  if (!transaksi) {
    throw new ResponseError(404, "Order tidak ditemukan");
  }

  if (transaksi.status_pembayaran === "LUNAS") {
    throw new ResponseError(400, "Order sudah lunas");
  }

  await prisma.$transaction(async (tx) => {
    // Update pembayaran
    await tx.pembayaran.updateMany({
      where: {
        transaksi_id: transaksiId,
        status: "PENDING",
      },
      data: {
        status: "SUKSES",
        jumlah_bayar,
        jumlah_kembali: Math.max(0, jumlah_bayar - Number(transaksi.total)),
        paid_at: new Date(),
        keterangan: notes || "COD - dibayar ke driver",
      },
    });

    // Update transaksi
    const updateData = {
      status_pembayaran: "LUNAS",
      tanggal_lunas: new Date(),
    };

    // If delivery is already DELIVERED, mark as COMPLETED
    if (
      transaksi.delivery_status === "DELIVERED" ||
      transaksi.order_type === "PICKUP"
    ) {
      updateData.order_status = "COMPLETED";
    }

    await tx.transaksi.update({
      where: { transaksi_id: transaksiId },
      data: updateData,
    });
  });

  return {
    success: true,
    message: "Pembayaran berhasil dicatat",
    kembalian: Math.max(0, jumlah_bayar - Number(transaksi.total)),
  };
};

/**
 * Failed delivery — return stock
 */
const markDeliveryFailed = async (transaksiId, alasan) => {
  const transaksi = await prisma.transaksi.findFirst({
    where: {
      transaksi_id: transaksiId,
      order_source: "ECATALOG",
      order_type: "DELIVERY",
    },
    include: { transaksi_detail: true },
  });

  if (!transaksi) {
    throw new ResponseError(404, "Order delivery tidak ditemukan");
  }

  if (transaksi.order_status === "COMPLETED") {
    throw new ResponseError(400, "Order sudah selesai, tidak bisa gagal");
  }

  await prisma.$transaction(async (tx) => {
    // Update transaksi
    await tx.transaksi.update({
      where: { transaksi_id: transaksiId },
      data: {
        order_status: "CANCELLED",
        delivery_status: "FAILED",
        order_cancelled_reason: alasan,
        status_pembayaran:
          transaksi.status_pembayaran === "LUNAS"
            ? "LUNAS"
            : "DIBATALKAN",
      },
    });

    // Return stock for COD/PAY_AT_STORE orders (stock was reduced at checkout)
    // For PAYMENT_LINK, stock was already reduced after payment — so return it too
    for (const detail of transaksi.transaksi_detail) {
      await tx.produk.update({
        where: { id: detail.produk_id },
        data: { stok: { increment: detail.jumlah } },
      });

      await tx.inventoryMovement.create({
        data: {
          produkId: detail.produk_id,
          referenceId: transaksi.transaksi_id,
          referenceType: "DELIVERY_FAILED",
          quantity: detail.jumlah,
          keterangan: `Gagal kirim: ${alasan} (${transaksi.nomor_transaksi})`,
          userId: "system",
          cabangId: transaksi.cabang_id,
        },
      });
    }

    // Create cancellation record
    await tx.order_cancellation.create({
      data: {
        transaksi_id: transaksiId,
        cancellation_reason: `Gagal kirim: ${alasan}`,
        cancelled_at: new Date(),
      },
    });

    // Create tracking entry
    await tx.delivery_tracking.create({
      data: {
        transaksi_id: transaksiId,
        driver_id: transaksi.delivery_driver_id,
        status: "FAILED",
        notes: `Gagal kirim: ${alasan}`,
      },
    });
  });

  return {
    success: true,
    message: "Pengiriman ditandai gagal. Stok dikembalikan.",
  };
};

/**
 * Get active deliveries for a specific driver
 */
const getDriverActiveDeliveries = async (driverId) => {
  const orders = await prisma.transaksi.findMany({
    where: {
      delivery_driver_id: driverId,
      order_source: "ECATALOG",
      order_type: "DELIVERY",
      delivery_status: { in: ["ASSIGNED", "PICKED_UP"] },
      order_status: { notIn: ["CANCELLED"] },
    },
    orderBy: { created_at: "desc" },
    include: {
      transaksi_detail: {
        include: {
          produk: {
            include: {
              produkMaster: { select: { namaProduk: true } },
            },
          },
        },
      },
    },
  });

  return orders.map((o) => ({
    transaksi_id: o.transaksi_id,
    nomor_transaksi: o.nomor_transaksi,
    order_status: o.order_status,
    delivery_status: o.delivery_status,
    status_pembayaran: o.status_pembayaran,
    total: Number(o.total),
    customer_address: o.customer_address,
    customer_notes: o.customer_notes,
    created_at: o.created_at,
    items: o.transaksi_detail.map((d) => ({
      nama: d.produk?.produkMaster?.namaProduk || "Unknown",
      jumlah: d.jumlah,
    })),
    is_cod: o.status_pembayaran !== "LUNAS",
  }));
};

/**
 * Get delivery tracking timeline (public)
 */
const getDeliveryTracking = async (transaksiId) => {
  const tracking = await prisma.delivery_tracking.findMany({
    where: { transaksi_id: transaksiId },
    orderBy: { created_at: "asc" },
    include: {
      driver: {
        select: { nama: true, no_hp: true },
      },
    },
  });

  return tracking.map((t) => ({
    status: t.status,
    notes: t.notes,
    photo_url: t.photo_url,
    latitude: t.latitude ? Number(t.latitude) : null,
    longitude: t.longitude ? Number(t.longitude) : null,
    driver_name: t.driver?.nama,
    created_at: t.created_at,
  }));
};

/**
 * Driver: Save live location
 */
const addDeliveryLocation = async (transaksiId, data) => {
  const { latitude, longitude } = data;

  const transaksi = await prisma.transaksi.findFirst({
    where: {
      transaksi_id: transaksiId,
      order_source: "ECATALOG",
      order_type: "DELIVERY",
    },
  });

  if (!transaksi) {
    throw new ResponseError(404, "Order delivery tidak ditemukan");
  }

  if (transaksi.order_status === "CANCELLED" || transaksi.order_status === "COMPLETED") {
    throw new ResponseError(400, "Order sudah selesai/batal, tidak bisa update lokasi");
  }

  if (transaksi.delivery_status !== "PICKED_UP") {
    throw new ResponseError(400, "Live tracking hanya tersedia saat status Dalam Perjalanan (PICKED_UP)");
  }

  await prisma.delivery_tracking.create({
    data: {
      transaksi_id: transaksiId,
      driver_id: transaksi.delivery_driver_id,
      status: "LIVE_LOCATION",
      latitude: latitude,
      longitude: longitude,
      notes: "Update lokasi driver otomatis",
    },
  });

  return {
    success: true,
    message: "Lokasi berhasil disimpan",
  };
};

module.exports = {
  getDeliveryOrders,
  assignDriver,
  updateDeliveryStatus,
  markPaymentReceived,
  markDeliveryFailed,
  getDriverActiveDeliveries,
  getDeliveryTracking,
  addDeliveryLocation,
};
