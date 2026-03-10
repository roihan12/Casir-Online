const prisma = require("../config/db");
const { ResponseError } = require("../error/responseError");
const { generateTransferNumber } = require("../utils/generateTransferNumber");
const notificationService = require("./notificationService");
const { logger } = require("../utils/logger");


// Mendapatkan daftar transfer stok dengan filter
const getStockTransfers = async (filters) => {
  const {
    cabangAsalId,
    cabangTujuanId,
    status,
    startDate,
    endDate,
    nomorTransfer,
    page = 1,
    limit = 10,
  } = filters;

  const skip = (page - 1) * limit;

  // Membuat kondisi filter
  const where = {};

  if (cabangAsalId) where.cabangAsalId = cabangAsalId;
  if (cabangTujuanId) where.cabangTujuanId = cabangTujuanId;
  if (status) where.status = status;
  if (nomorTransfer) where.nomorTransfer = { contains: nomorTransfer };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  // Query untuk mendapatkan total count
  const totalCount = await prisma.stockTransfer.count({ where });

  // Query untuk mendapatkan data dengan pagination
  const transfers = await prisma.stockTransfer.findMany({
    where,
    include: {
      cabangAsal: {
        select: {
          id: true,
          namaCabang: true,
        },
      },
      cabangTujuan: {
        select: {
          id: true,
          namaCabang: true,
        },
      },
      createdByUser: {
        select: {
          id: true,
          namaLengkap: true,
        },
      },
      transferDetails: {
        include: {
          produk: {
            include: {
              produkMaster: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take: limit,
  });

  // Buat data pagination
  const totalPages = Math.ceil(totalCount / limit);

  return {
    data: transfers,
    pagination: {
      totalItems: totalCount,
      totalPages,
      currentPage: parseInt(page),
      itemsPerPage: parseInt(limit),
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

// Mendapatkan transfer stok berdasarkan ID
const getStockTransferById = async (transferId) => {
  const transfer = await prisma.stockTransfer.findUnique({
    where: {
      id: transferId,
    },
    include: {
      cabangAsal: {
        select: {
          id: true,
          namaCabang: true,
        },
      },
      cabangTujuan: {
        select: {
          id: true,
          namaCabang: true,
        },
      },
      transferDetails: {
        include: {
          produk: {
            include: {
              produkMaster: true,
            },
          },
        },
      },
    },
  });

  if (!transfer) {
    throw new ResponseError(404, "Stock transfer not found");
  }

  return transfer;
};

const getStatsStockTransfer = async () => {
  const stats = await prisma.stockTransfer.aggregate({
    where: {
      status: "draft",
    },
    _count: {
      id: true,
    },
    _sum: {
      jumlahKirim: true,
    },
  });

  return stats;
};

// Membuat transfer stok baru
const createStockTransfer = async (data, auditInfo) => {
  if (!data) {
    throw new ResponseError(400, "Request data is required")
  }
  logger.info("masuk", data)

  const { cabangAsalId, cabangTujuanId, tanggalKirim, keterangan, items } = data;

  // Validasi cabang asal dan tujuan
  if (cabangAsalId === cabangTujuanId) {
    throw new ResponseError(
      400,
      "Origin and destination branches cannot be the same"
    );
  }

  // Cek apakah cabang asal ada
  const cabangAsal = await prisma.cabang.findUnique({
    where: {
      id: cabangAsalId,
    },
  });

  if (!cabangAsal) {
    throw new ResponseError(404, "Origin branch not found");
  }

  // Cek apakah cabang tujuan ada
  const cabangTujuan = await prisma.cabang.findUnique({
    where: {
      id: cabangTujuanId,
    },
  });

  if (!cabangTujuan) {
    throw new ResponseError(404, "Destination branch not found");
  }



  const nomorTransfer = await generateTransferNumber({cabangAsalId, cabangTujuanId, tanggalKirim});

  logger.info("nomor transfer", nomorTransfer)

  // Lakukan transaksi untuk memastikan semua operasi berhasil
  const result = await prisma.$transaction(async (prisma) => {
    // Buat transfer stok baru
    const transfer = await prisma.stockTransfer.create({
      data: {
        nomorTransfer,
        cabangAsalId,
        cabangTujuanId,
        tanggalKirim,
        status: "draft",
        keterangan,
        created_by_user_Id: auditInfo.userId,
        created_by: auditInfo.namaLengkap, 
      },
    });

    // Buat detail transfer stok
    const transferDetails = [];

    for (const item of items) {
      const { produkId, jumlahKirim, keterangan: itemKeterangan } = item;

      // Cek apakah produk ada di cabang asal
      const produk = await prisma.produk.findFirst({
        where: {
          id: produkId,
          cabangId: cabangAsalId,
        },
        include: {
          produkMaster: true,
        },
      });

      if (!produk) {
        throw new ResponseError(
          404,
          `Product with ID ${produkId} not found in the origin branch`
        );
      }

      // Cek apakah stok mencukupi
      if ((produk.stok || 0) < jumlahKirim) {
        throw new ResponseError(
          400,
          `Insufficient stock for product ${produk.produkMaster.namaProduk} (${produk.stok} available)`
        );
      }

      // Buat detail transfer
      const transferDetail = await prisma.stockTransferDetail.create({
        data: {
          transferId: transfer.id,
          produkId,
          jumlahKirim,
          keterangan: itemKeterangan,
        },
      });

      transferDetails.push(transferDetail);
    }

    // Tambahkan log audit
    await prisma.auditLog.create({
      data: {
        user_id: auditInfo.userId,
        created_by: auditInfo.namaLengkap,
        cabang_id: cabangAsalId, // Menggunakan cabang asal sebagai cabang audit dat
        ip_address: auditInfo.ipAddress,
        action: "CREATE_STOCK_TRANSFER",
        table_name: "stock_transfer",
        record_id: transfer.id,
        new_values: JSON.stringify({ transfer, transferDetails }),
      },
    });

    // Return transfer dengan detail
    return await prisma.stockTransfer.findUnique({
      where: {
        id: transfer.id,
      },
      include: {
        cabangAsal: {
          select: {
            id: true,
            namaCabang: true,
          },
        },
        cabangTujuan: {
          select: {
            id: true,
            namaCabang: true,
          },
        },
        
        transferDetails: {
          include: {
            produk: {
              include: {
                produkMaster: true,
              },
            },
          },
        },
      },
    });
  });

  return result;
};

// Update transfer stok (hanya untuk status draft)
const updateStockTransfer = async (transferId, data, auditInfo) => {
  const { cabangAsalId, cabangTujuanId, tanggalKirim, keterangan, items } =
    data;

  // Cek apakah transfer ada dan masih berstatus draft
  const existingTransfer = await prisma.stockTransfer.findUnique({
    where: {
      id: transferId,
    },
    include: {
      transferDetails: true,
    },
  });

  if (!existingTransfer) {
    throw new ResponseError(404, "Stock transfer not found");
  }

  if (existingTransfer.status !== "draft") {
    throw new ResponseError(400, "Only draft transfers can be updated");
  }

  // Validasi cabang jika diubah
  if (cabangAsalId && cabangTujuanId && cabangAsalId === cabangTujuanId) {
    throw new ResponseError(
      400,
      "Origin and destination branches cannot be the same"
    );
  }

  // Siapkan data update untuk transfer
  const updateData = {};
  if (cabangAsalId) updateData.cabangAsalId = cabangAsalId;
  if (cabangTujuanId) updateData.cabangTujuanId = cabangTujuanId;
  if (tanggalKirim !== undefined) updateData.tanggalKirim = tanggalKirim;
  if (keterangan !== undefined) updateData.keterangan = keterangan;

  // Lakukan transaksi untuk memastikan semua operasi berhasil
  const result = await prisma.$transaction(async (prisma) => {
    // Update transfer
    const oldTransferData = { ...existingTransfer };

    const transfer = await prisma.stockTransfer.update({
      where: {
        id: transferId,
      },
      data: {
        ...updateData,
        updated_by: auditInfo.namaLengkap,
        updated_by_user_Id: auditInfo.userId,
      },
    });

    // Update items jika ada
    if (items && items.length > 0) {
      // Dapatkan daftar detail yang sudah ada
      const existingDetails = existingTransfer.transferDetails;
      const existingDetailIds = existingDetails.map((d) => d.id);

      // Process each item
      for (const item of items) {
        const { id, produkId, jumlahKirim, keterangan: itemKeterangan } = item;

        // Cek apakah produk ada di cabang asal
        const produk = await prisma.produk.findFirst({
          where: {
            id: produkId,
            cabangId: cabangAsalId || existingTransfer.cabangAsalId,
          },
          include: {
            produkMaster: true,
          },
        });

        if (!produk) {
          throw new ResponseError(
            404,
            `Product with ID ${produkId} not found in the origin branch`
          );
        }

        // Cek apakah stok mencukupi
        if ((produk.stok || 0) < jumlahKirim) {
          throw new ResponseError(
            400,
            `Insufficient stock for product ${produk.produkMaster.namaProduk} (${produk.stok} available)`
          );
        }

        if (id) {
          // Update existing detail
          await prisma.stockTransferDetail.update({
            where: {
              id,
            },
            data: {
              produkId,
              jumlahKirim,
              keterangan: itemKeterangan,
            },
          });
        } else {
          // Create new detail
          await prisma.stockTransferDetail.create({
            data: {
              transferId,
              produkId,
              jumlahKirim,
              keterangan: itemKeterangan,
            },
          });
        }
      }

      // Get all detail IDs from the request
      const requestDetailIds = items
        .filter((item) => item.id)
        .map((item) => item.id);

      // Find details to delete (those in existing but not in request)
      const detailsToDelete = existingDetailIds.filter(
        (id) => !requestDetailIds.includes(id)
      );

      // Delete removed details
      if (detailsToDelete.length > 0) {
        await prisma.stockTransferDetail.deleteMany({
          where: {
            id: {
              in: detailsToDelete,
            },
          },
        });
      }
    }

    // Tambahkan log audit
    await prisma.auditLog.create({
      data: {
        user_id: auditInfo.userId,
        created_by: auditInfo.namaLengkap,
        cabang_id: cabangAsalId || existingTransfer.cabangAsalId, // Menggunakan cabang asal sebagai cabang audit
        ip_address: auditInfo.ipAddress,
        action: "UPDATE_STOCK_TRANSFER",
        table_name: "stock_transfer",
        record_id: transferId,
        old_values: JSON.stringify(oldTransferData),
        new_values: JSON.stringify(updateData),
      },
    });

    // Return updated transfer with details
    return await prisma.stockTransfer.findUnique({
      where: {
        id: transferId,
      },
      include: {
        cabangAsal: {
          select: {
            id: true,
            namaCabang: true,
          },
        },
        cabangTujuan: {
          select: {
            id: true,
            namaCabang: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            namaLengkap: true,
          },
        },
        transferDetails: {
          include: {
            produk: {
              include: {
                produkMaster: true,
              },
            },
          },
        },
      },
    });
  });

  return result;
};

// Submit transfer stok untuk approval
const submitForApproval = async (transferId, data, auditInfo) => {
  const { keterangan } = data;
  const { userId, ipAddress } = auditInfo;

  // Dapatkan transfer
  const transfer = await prisma.stockTransfer.findUnique({
    where: {
      id: transferId,
    },
    include: {
      transferDetails: true,
    },
  });

  if (!transfer) {
    throw new ResponseError(404, "Stock transfer not found");
  }

  // Cek apakah status transfer adalah draft
  if (transfer.status !== "draft") {
    throw new ResponseError(
      400,
      "Cannot submit for approval. Transfer must be in draft status"
    );
  }

  // Check if the transfer has details
  if (transfer.transferDetails.length === 0) {
    throw new ResponseError(400, "Cannot submit empty transfer");
  }

  // Lakukan update status transfer menjadi pending_approval
  const updatedTransfer = await prisma.stockTransfer.update({
    where: {
      id: transferId,
    },
    data: {
      status: "pending_approval",
      keterangan: keterangan || transfer.keterangan,
      updated_by: userId,
      updated_by_user_Id: userId,
    },
    include: {
      cabangAsal: {
        select: {
          id: true,
          namaCabang: true,
        },
      },
      cabangTujuan: {
        select: {
          id: true,
          namaCabang: true,
        },
      },
      transferDetails: {
        include: {
          produk: {
            include: {
              produkMaster: true,
            },
          },
        },
      },
    },
  });

  // Catat ke audit log
  await prisma.auditLog.create({
    data: {
      user_id: userId,
      cabang_id: transfer.cabangAsalId,
      ip_address: ipAddress,
      action: "SUBMIT_FOR_APPROVAL",
      table_name: "stock_transfer",
      record_id: transferId,
      old_values: JSON.stringify({
        status: transfer.status,
        keterangan: transfer.keterangan,
      }),
      new_values: JSON.stringify({
        status: "pending_approval",
        keterangan: keterangan || transfer.keterangan,
      }),
      cabang_id: transfer.cabangAsalId,
    },
  });

  // Send notification to admins for approval
  try {
    const transferWithItems = await prisma.stockTransfer.findUnique({
      where: { id: updatedTransfer.id },
      include: {
        transferDetails: {
          include: {
            produk: {
              include: {
                produkMaster: true,
              },
            },
          },
        },
      },
    });
    await notificationService.sendStockTransferRequestNotification(transferWithItems);
  } catch (notifError) {
    logger.error("Failed to send stock transfer request notification:", notifError);
    // Continue execution even if notification fails
  }

  return updatedTransfer;
};

// Approve transfer stok
const approveStockTransfer = async (transferId, data, auditInfo) => {
  const { keterangan } = data;
  const { userId, ipAddress } = auditInfo;

  // Dapatkan transfer
  const transfer = await prisma.stockTransfer.findUnique({
    where: {
      id: transferId,
    },
  });

  if (!transfer) {
    throw new ResponseError(404, "Stock transfer not found");
  }

  // Cek apakah status transfer adalah pending_approval
  if (transfer.status !== "pending_approval") {
    throw new ResponseError(
      400,
      "Cannot approve. Transfer must be in pending_approval status"
    );
  }

  // Lakukan update status transfer menjadi approved
  const updatedTransfer = await prisma.stockTransfer.update({
    where: {
      id: transferId,
    },
    data: {
      status: "approved",
      keterangan: keterangan || transfer.keterangan,
      approvedAt: new Date(),
      approvedById: userId,
      updated_by: userId,
      updated_by_user_Id: userId,
    },
    include: {
      cabangAsal: {
        select: {
          id: true,
          namaCabang: true,
        },
      },
      cabangTujuan: {
        select: {
          id: true,
          namaCabang: true,
        },
      },
      transferDetails: {
        include: {
          produk: {
            include: {
              produkMaster: true,
            },
          },
        },
      },
    },
  });

  // Catat ke audit log
  await prisma.auditLog.create({
    data: {
      user_id: userId,
      ip_address: ipAddress,
      cabang_id: transfer.cabangAsalId,
      action: "APPROVE_TRANSFER",
      table_name: "stock_transfer",
      record_id: transferId,
      old_values: JSON.stringify({
        status: transfer.status,
        keterangan: transfer.keterangan,
        approvedAt: transfer.approvedAt,
        approvedById: transfer.approvedById,
      }),
      new_values: JSON.stringify({
        status: "approved",
        keterangan: keterangan || transfer.keterangan,
        approvedAt: new Date(),
        approvedById: userId,
      }),
      cabang_id: transfer.cabangAsalId,
    },
  });

  // Send notification that transfer has been approved
  try {
    const transferWithItems = await prisma.stockTransfer.findUnique({
      where: { id: updatedTransfer.id },
      include: {
        transferDetails: {
          include: {
            produk: {
              include: {
                produkMaster: true,
              },
            },
          },
        },
      },
    });
    await notificationService.sendStockTransferApprovedNotification(transferWithItems);
  } catch (notifError) {
    logger.error("Failed to send stock transfer approved notification:", notifError);
    // Continue execution even if notification fails
  }

  return updatedTransfer;
};

// Reject transfer stok
const rejectStockTransfer = async (transferId, data, auditInfo) => {
  const { alasanReject } = data;
  const { userId, ipAddress } = auditInfo;

  // Dapatkan transfer
  const transfer = await prisma.stockTransfer.findUnique({
    where: {
      id: transferId,
    },
  });

  if (!transfer) {
    throw new ResponseError(404, "Stock transfer not found");
  }

  // Cek apakah status transfer adalah pending_approval
  if (transfer.status !== "pending_approval") {
    throw new ResponseError(
      400,
      "Cannot reject. Transfer must be in pending_approval status"
    );
  }

  // Lakukan update status transfer menjadi rejected
  const updatedTransfer = await prisma.stockTransfer.update({
    where: {
      id: transferId,
    },
    data: {
      status: "rejected",
      alasanReject,
      approvedAt: new Date(),
      approvedById: userId,
      updated_by: userId,
      updated_by_user_Id: userId,
    },
    include: {
      cabangAsal: {
        select: {
          id: true,
          namaCabang: true,
        },
      },
      cabangTujuan: {
        select: {
          id: true,
          namaCabang: true,
        },
      },
      transferDetails: {
        include: {
          produk: {
            include: {
              produkMaster: true,
            },
          },
        },
      },
    },
  });

  // Catat ke audit log
  await prisma.auditLog.create({
    data: {
      user_id: userId,
      ip_address: ipAddress,
      cabang_id: transfer.cabangAsalId,
      action: "REJECT_TRANSFER",
      table_name: "stock_transfer",
      record_id: transferId,
      old_values: JSON.stringify({
        status: transfer.status,
        alasanReject: transfer.alasanReject,
        approvedAt: transfer.approvedAt,
        approvedById: transfer.approvedById,
      }),
      new_values: JSON.stringify({
        status: "rejected",
        alasanReject,
        approvedAt: new Date(),
        approvedById: userId,
      }),
      cabang_id: transfer.cabangAsalId,
    },
  });

  // Send notification that transfer has been rejected
  try {
    const transferWithItems = await prisma.stockTransfer.findUnique({
      where: { id: updatedTransfer.id },
      include: {
        transferDetails: {
          include: {
            produk: {
              include: {
                produkMaster: true,
              },
            },
          },
        },
      },
    });
    await notificationService.sendStockTransferRejectedNotification(transferWithItems);
  } catch (notifError) {
    logger.error("Failed to send stock transfer rejected notification:", notifError);
    // Continue execution even if notification fails
  }

  return updatedTransfer;
};

// Mengirim transfer stok (mengubah status dari approved ke dikirim)
const sendStockTransfer = async (transferId, data, auditInfo) => {
  const { tanggalKirim, keterangan } = data;

  // Cek apakah transfer ada dan berstatus approved
  const existingTransfer = await prisma.stockTransfer.findUnique({
    where: {
      id: transferId,
    },
    include: {
      transferDetails: {
        include: {
          produk: {
            include: {
              produkMaster: true,
            },
          },
        },
      },
    },
  });

  if (!existingTransfer) {
    throw new ResponseError(404, "Stock transfer not found");
  }

  if (existingTransfer.status !== "approved") {
    throw new ResponseError(400, "Only approved transfers can be sent");
  }

  // Lakukan transaksi untuk memastikan semua operasi berhasil
  const result = await prisma.$transaction(async (prisma) => {
    // Generate ID referensi untuk inventory movement
    const referenceId = `TRF-OUT-${existingTransfer.nomorTransfer}`;

    // Kurangi stok di cabang asal
    for (const detail of existingTransfer.transferDetails) {
      // Update stok produk
      const updatedProduk = await prisma.produk.update({
        where: {
          id: detail.produkId,
        },
        data: {
          stok: {
            decrement: detail.jumlahKirim,
          },
        },
      });

      // Pastikan stok tidak negatif
      if ((updatedProduk.stok || 0) < 0) {
        throw new ResponseError(
          400,
          `Insufficient stock for product ${detail.produk.produkMaster.namaProduk}`
        );
      }

      // Catat inventory movement
      await prisma.inventoryMovement.create({
        data: {
          produkId: detail.produkId,
          cabangId: existingTransfer.cabangAsalId,
          referenceId,
          referenceType: "transfer",
          quantity: -detail.jumlahKirim, // Negatif karena stok keluar
          keterangan: `Stock transfer to ${existingTransfer.cabangTujuanId}`,
          userId: auditInfo.userId,
        },
      });
    }

    // Update status transfer menjadi dikirim
    const updatedTransfer = await prisma.stockTransfer.update({
      where: {
        id: transferId,
      },
      data: {
        status: "dikirim",
        tanggalKirim,
        keterangan: keterangan || existingTransfer.keterangan,
      },
      include: {
        cabangAsal: {
          select: {
            id: true,
            namaCabang: true,
          },
        },
        cabangTujuan: {
          select: {
            id: true,
            namaCabang: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            namaLengkap: true,
          },
        },
        transferDetails: {
          include: {
            produk: {
              include: {
                produkMaster: true,
              },
            },
          },
        },
      },
    });

    // Tambahkan log audit
    await prisma.auditLog.create({
      data: {
        user_id: auditInfo.userId,
        ip_address: auditInfo.ipAddress,
        action: "SEND_STOCK_TRANSFER",
        table_name: "stock_transfer",
        record_id: transferId,
        old_values: JSON.stringify({ status: "approved" }),
        new_values: JSON.stringify({ status: "dikirim", tanggalKirim }),
      },
    });

    return updatedTransfer;
  });

  return result;
};

// Menerima transfer stok (mengubah status dari dikirim ke diterima)
const receiveStockTransfer = async (transferId, data, auditInfo) => {
  const { tanggalTerima, keterangan, items } = data;

  // Cek apakah transfer ada dan masih berstatus dikirim
  const existingTransfer = await prisma.stockTransfer.findUnique({
    where: {
      id: transferId,
    },
    include: {
      cabangAsal: true,
      cabangTujuan: true,
      transferDetails: {
        include: {
          produk: {
            include: {
              produkMaster: true,
            },
          },
        },
      },
    },
  });

  if (!existingTransfer) {
    throw new ResponseError(404, "Stock transfer not found");
  }

  if (existingTransfer.status !== "dikirim") {
    throw new ResponseError(400, "Only sent transfers can be received");
  }

  // Validasi bahwa semua item di request ada di transferDetails
  const transferDetailIds = existingTransfer.transferDetails.map((d) => d.id);
  const requestDetailIds = items.map((i) => i.transferDetailId);

  // Cek apakah semua item di request ada di transferDetails
  const invalidDetailIds = requestDetailIds.filter(
    (id) => !transferDetailIds.includes(id)
  );
  if (invalidDetailIds.length > 0) {
    throw new ResponseError(
      400,
      `Invalid transfer detail IDs: ${invalidDetailIds.join(", ")}`
    );
  }

  // Lakukan transaksi untuk memastikan semua operasi berhasil
  const result = await prisma.$transaction(async (prisma) => {
    // Generate ID referensi untuk inventory movement
    const referenceId = `TRF-IN-${existingTransfer.nomorTransfer}`;

    // Process each item
    for (const item of items) {
      const {
        transferDetailId,
        jumlahTerima,
        keterangan: itemKeterangan,
      } = item;

      // Dapatkan detail transfer
      const transferDetail = existingTransfer.transferDetails.find(
        (d) => d.id === transferDetailId
      );

      // Update jumlah terima pada detail transfer
      await prisma.stockTransferDetail.update({
        where: {
          id: transferDetailId,
        },
        data: {
          jumlahTerima,
          keterangan: itemKeterangan || transferDetail.keterangan,
        },
      });

      // Check if the product exists in the destination branch
      let produkTujuan = await prisma.produk.findFirst({
        where: {
          produkMasterId: transferDetail.produk.produkMasterId,
          cabangId: existingTransfer.cabangTujuanId,
        },
      });

      // If product doesn't exist in destination branch, create it
      if (!produkTujuan) {
        produkTujuan = await prisma.produk.create({
          data: {
            produkMasterId: transferDetail.produk.produkMasterId,
            cabangId: existingTransfer.cabangTujuanId,
            hargaBeli: transferDetail.produk.hargaBeli,
            hargaJual: transferDetail.produk.hargaJual,
            hargaGrosir: transferDetail.produk.hargaGrosir,
            stok: 0,
            minStok: transferDetail.produk.minStok,
            maxStok: transferDetail.produk.maxStok,
            status: transferDetail.produk.status,
          },
        });
      }

      // Update stok produk di cabang tujuan
      await prisma.produk.update({
        where: {
          id: produkTujuan.id,
        },
        data: {
          stok: {
            increment: jumlahTerima,
          },
        },
      });

      // Catat inventory movement
      await prisma.inventoryMovement.create({
        data: {
          produkId: produkTujuan.id,
          cabangId: existingTransfer.cabangTujuanId,
          referenceId,
          referenceType: "transfer",
          quantity: jumlahTerima,
          keterangan: `Stock transfer from ${existingTransfer.cabangAsal.namaCabang}`,
          userId: auditInfo.userId,
        },
      });
    }

    // Update status transfer menjadi diterima
    const updatedTransfer = await prisma.stockTransfer.update({
      where: {
        id: transferId,
      },
      data: {
        status: "diterima",
        tanggalTerima,
        keterangan: keterangan || existingTransfer.keterangan,
      },
      include: {
        cabangAsal: {
          select: {
            id: true,
            namaCabang: true,
          },
        },
        cabangTujuan: {
          select: {
            id: true,
            namaCabang: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            namaLengkap: true,
          },
        },
        transferDetails: {
          include: {
            produk: {
              include: {
                produkMaster: true,
              },
            },
          },
        },
      },
    });

    // Tambahkan log audit
    await prisma.auditLog.create({
      data: {
        user_id: auditInfo.userId,
        cabang_id: existingTransfer.cabangTujuanId,
        ip_address: auditInfo.ipAddress,
        action: "RECEIVE_STOCK_TRANSFER",
        table_name: "stock_transfer",
        record_id: transferId,
        old_values: JSON.stringify({ status: "dikirim" }),
        new_values: JSON.stringify({
          status: "diterima",
          tanggalTerima,
          items,
        }),
      },
    });

    return updatedTransfer;
  });

  return result;
};

// Membatalkan transfer stok (hanya untuk status draft atau dikirim)
const cancelStockTransfer = async (transferId, data, auditInfo) => {
  const { alasanBatal } = data;

  // Cek apakah transfer ada dan statusnya draft atau dikirim
  const existingTransfer = await prisma.stockTransfer.findUnique({
    where: {
      id: transferId,
    },
    include: {
      transferDetails: {
        include: {
          produk: true,
        },
      },
    },
  });

  if (!existingTransfer) {
    throw new ResponseError(404, "Stock transfer not found");
  }

  if (
    existingTransfer.status !== "draft" &&
    existingTransfer.status !== "dikirim"
  ) {
    throw new ResponseError(
      400,
      "Only draft or sent transfers can be canceled"
    );
  }

  // Lakukan transaksi untuk memastikan semua operasi berhasil
  const result = await prisma.$transaction(async (prisma) => {
    // Jika status dikirim, kembalikan stok ke cabang asal
    if (existingTransfer.status === "dikirim") {
      // Generate ID referensi untuk inventory movement
      const referenceId = `TRF-CANCEL-${existingTransfer.nomorTransfer}`;

      // Kembalikan stok ke cabang asal
      for (const detail of existingTransfer.transferDetails) {
        // Update stok produk
        await prisma.produk.update({
          where: {
            id: detail.produkId,
          },
          data: {
            stok: {
              increment: detail.jumlahKirim,
            },
          },
        });

        // Catat inventory movement
        await prisma.inventoryMovement.create({
          data: {
            produkId: detail.produkId,
            cabangId: existingTransfer.cabangAsalId,
            referenceId,
            referenceType: "adjustment",
            quantity: detail.jumlahKirim,
            keterangan: `Canceled stock transfer #${existingTransfer.nomorTransfer}. Reason: ${alasanBatal}`,
            userId: auditInfo.userId,
          },
        });
      }
    }

    // Update status transfer menjadi dibatalkan
    const updatedTransfer = await prisma.stockTransfer.update({
      where: {
        id: transferId,
      },
      data: {
        status: "dibatalkan",
        keterangan: existingTransfer.keterangan
          ? `${existingTransfer.keterangan} | Dibatalkan: ${alasanBatal}`
          : `Dibatalkan: ${alasanBatal}`,
      },
      include: {
        cabangAsal: {
          select: {
            id: true,
            namaCabang: true,
          },
        },
        cabangTujuan: {
          select: {
            id: true,
            namaCabang: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            namaLengkap: true,
          },
        },
        transferDetails: {
          include: {
            produk: {
              include: {
                produkMaster: true,
              },
            },
          },
        },
      },
    });

    // Tambahkan log audit
    await prisma.auditLog.create({
      data: {
        user_id: auditInfo.userId,
        ip_address: auditInfo.ipAddress,
        action: "CANCEL_STOCK_TRANSFER",
        table_name: "stock_transfer",
        record_id: transferId,
        old_values: JSON.stringify({ status: existingTransfer.status }),
        new_values: JSON.stringify({ status: "dibatalkan", alasanBatal }),
      },
    });

    return updatedTransfer;
  });

  return result;
};

// Mendapatkan daftar transfer yang sedang pending (dikirim) untuk cabang
const getPendingTransfersForBranch = async (cabangId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  // Mendapatkan total count
  const totalCount = await prisma.stockTransfer.count({
    where: {
      cabangTujuanId: cabangId,
      status: "dikirim",
    },
  });

  // Mendapatkan data dengan pagination
  const transfers = await prisma.stockTransfer.findMany({
    where: {
      cabangTujuanId: cabangId,
      status: "dikirim",
    },
    include: {
      cabangAsal: {
        select: {
          id: true,
          namaCabang: true,
        },
      },
      cabangTujuan: {
        select: {
          id: true,
          namaCabang: true,
        },
      },
      createdByUser: {
        select: {
          id: true,
          namaLengkap: true,
        },
      },
      transferDetails: {
        include: {
          produk: {
            include: {
              produkMaster: true,
            },
          },
        },
      },
    },
    orderBy: {
      tanggalKirim: "asc",
    },
    skip,
    take: limit,
  });

  // Buat data pagination
  const totalPages = Math.ceil(totalCount / limit);

  return {
    data: transfers,
    pagination: {
      totalItems: totalCount,
      totalPages,
      currentPage: parseInt(page),
      itemsPerPage: parseInt(limit),
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

// Mendapatkan riwayat transfer untuk cabang
const getTransferHistoryForBranch = async (cabangId, filters) => {
  const { status, startDate, endDate, page = 1, limit = 10 } = filters;
  const skip = (page - 1) * limit;

  // Membuat kondisi filter
  const where = {
    OR: [{ cabangAsalId: cabangId }, { cabangTujuanId: cabangId }],
  };

  if (status) where.status = status;

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  // Mendapatkan total count
  const totalCount = await prisma.stockTransfer.count({ where });

  // Mendapatkan data dengan pagination
  const transfers = await prisma.stockTransfer.findMany({
    where,
    include: {
      cabangAsal: {
        select: {
          id: true,
          namaCabang: true,
        },
      },
      cabangTujuan: {
        select: {
          id: true,
          namaCabang: true,
        },
      },
      createdByUser: {
        select: {
          id: true,
          namaLengkap: true,
        },
      },
      transferDetails: {
        include: {
          produk: {
            include: {
              produkMaster: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take: limit,
  });

  // Buat data pagination
  const totalPages = Math.ceil(totalCount / limit);

  return {
    data: transfers,
    pagination: {
      totalItems: totalCount,
      totalPages,
      currentPage: parseInt(page),
      itemsPerPage: parseInt(limit),
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

// Mendapatkan daftar transfer yang perlu approval
const getTransfersNeedingApproval = async (filters) => {
  const {
    page = 1,
    limit = 10,
    cabangAsalId,
    cabangTujuanId,
    nomorTransfer,
    startDate,
    endDate,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = filters;

  const skip = (page - 1) * limit;

  // Membuat kondisi filter
  const where = {
    status: "pending_approval",
  };

  // Tambahkan filter tambahan jika ada
  if (cabangAsalId) where.cabangAsalId = cabangAsalId;
  if (cabangTujuanId) where.cabangTujuanId = cabangTujuanId;
  if (nomorTransfer) where.nomorTransfer = { contains: nomorTransfer };

  // Filter berdasarkan tanggal
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  // Query untuk mendapatkan total count
  const totalCount = await prisma.stockTransfer.count({ where });

  // Buat orderBy object berdasarkan sortBy dan sortOrder
  const orderBy = {};
  orderBy[sortBy] = sortOrder;

  // Query untuk mendapatkan data dengan pagination
  const transfers = await prisma.stockTransfer.findMany({
    where,
    include: {
      cabangAsal: {
        select: {
          id: true,
          namaCabang: true,
        },
      },
      cabangTujuan: {
        select: {
          id: true,
          namaCabang: true,
        },
      },
      createdByUser: {
        select: {
          id: true,
          namaLengkap: true,
        },
      },
      approvedByUser: {
        select: {
          id: true,
          namaLengkap: true,
        },
      },
      transferDetails: {
        include: {
          produk: {
            include: {
              produkMaster: true,
            },
          },
        },
      },
    },
    orderBy,
    skip,
    take: limit,
  });

  // Buat data pagination
  const totalPages = Math.ceil(totalCount / limit);

  return {
    data: transfers,
    pagination: {
      totalItems: totalCount,
      totalPages,
      currentPage: parseInt(page),
      itemsPerPage: parseInt(limit),
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

// Mendapatkan statistik transfer stok untuk dashboard
const getStockTransferStats = async (cabangId = null) => {
  let whereClause = '';
  const queryParams = [];
  
  if (cabangId) {
    whereClause = 'WHERE cabang_id = $1';
    queryParams.push(cabangId);
  }
  
  const query = `
    SELECT 
      CAST(SUM(draft_count) AS INTEGER) AS total_drafts,
      CAST(SUM(pending_approval_count) AS INTEGER) AS total_pending_approval,
      CAST(SUM(approved_pending_shipment) AS INTEGER) AS total_ready_to_ship,
      CAST(SUM(in_transit_count) AS INTEGER) AS total_in_transit,
      CAST(SUM(completed_count) AS INTEGER) AS total_completed,
      CAST(SUM(total_items_transferred) AS INTEGER) AS total_produk,
      CAST(SUM(total_transfers) AS INTEGER) AS total_transfers
    FROM stock_transfer_stats 
    ${whereClause}
  `;
  
  const result = await prisma.$queryRawUnsafe(query, ...queryParams);
  
  // If a specific branch was requested, return a single object instead of an array
  if (cabangId && result.length > 0) {
    return result[0];
  }
  
  return result;
};

module.exports = {
  getStockTransfers,
  getStockTransferById,
  getStockTransferStats,
  createStockTransfer,
  updateStockTransfer,
  submitForApproval,
  approveStockTransfer,
  rejectStockTransfer,
  sendStockTransfer,
  receiveStockTransfer,
  cancelStockTransfer,
  getPendingTransfersForBranch,
  getTransferHistoryForBranch,
  getTransfersNeedingApproval,
};
