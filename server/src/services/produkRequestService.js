const prisma = require("../config/db");
const { ResponseError } = require("../error/responseError");
const { createAuditLog } = require("../utils/auditLog");
const {
  uploadFileToSupabase,
  deleteFilesFromSupabase,
} = require("../utils/uploadToSupabase");

// Get all product requests with filtering and pagination
const getAllProdukRequests = async ({
  search,
  cabangId,
  requestType,
  status,
  prioritas,
  page = 1,
  limit = 10,
}) => {
  const skip = (page - 1) * Number(limit);
  const take = Number(limit);

  const where = {};

  if (search) {
    where.OR = [
      // Search in request ID
      {
        id: { contains: search, mode: "insensitive" },
      },
      // Search in branch name
      {
        cabang: {
          namaCabang: { contains: search, mode: "insensitive" },
        },
      },
      // Search in requester name
      {
        createdByUser: {
          namaLengkap: { contains: search, mode: "insensitive" },
        },
      },
      // Search in reason (alasan)
      {
        alasan: { contains: search, mode: "insensitive" },
      },
      // Search in product names (for restock requests)
      {
        items: {
          some: {
            produkMaster: {
              namaProduk: { contains: search, mode: "insensitive" },
            },
          },
        },
      },
      // Search in product names (for new product requests)
      {
        items: {
          some: {
            namaProduk: { contains: search, mode: "insensitive" },
          },
        },
      },
    ];
  }

  if (cabangId) {
    where.cabangId = cabangId;
  }

  if (requestType) {
    where.requestType = requestType;
  }

  if (status) {
    where.status = status;
  }

  if (prioritas) {
    where.prioritas = prioritas;
  }

  const [total, data] = await Promise.all([
    prisma.produkRequest.count({ where }),
    prisma.produkRequest.findMany({
      where,
      include: {
        cabang: true,
        createdByUser: {
          select: {
            id: true,
            namaLengkap: true,
            email: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            namaLengkap: true,
            email: true,
          },
        },
        items: {
          include: {
            produkMaster: {
              include: {
                produkImage: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
            kategori: true,
            generatedProdukMaster: true,
          },
        },
        attachments: true,
      },
      skip,
      take,
      orderBy: [
        {
          prioritas: "desc", // Critical first, then urgent, then normal
        },
        {
          updatedAt: "desc",
        },
      ],
    }),
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

// Get a product request by ID
const getProdukRequestById = async (id) => {
  return prisma.produkRequest.findFirst({
    where: {
      id,
    },
    include: {
      cabang: true,
      createdByUser: {
        select: {
          id: true,
          namaLengkap: true,
          email: true,
        },
      },
      approvedBy: {
        select: {
          id: true,
          namaLengkap: true,
          email: true,
        },
      },
      items: {
        include: {
          produkMaster: {
            include: {
              kategori: true,
              produkImage: {
                orderBy: {
                  urutan: "asc",
                },
              },
            },
          },
          kategori: true,
          generatedProdukMaster: true,
        },
      },
      attachments: true,
    },
  });
};

// Create a new product request
const createProdukRequest = async (
  data,
  attachments,
  { userId, ipAddress }
) => {
  return prisma.$transaction(async (tx) => {
    // Extract items from request data
    const { items, ...requestData } = data;

    // Check if branch exists
    const cabang = await tx.cabang.findUnique({
      where: { id: requestData.cabangId },
    });

    if (!cabang) {
      throw new ResponseError(404, "Branch not found");
    }

    // Create the product request
    const newRequest = await tx.produkRequest.create({
      data: {
        ...requestData,
        created_by_user_Id: userId,
        status: "draft", // Start as draft
      },
    });

    // Add request items
    if (items && items.length > 0) {
      // Process each item
      for (const item of items) {
        await tx.produkRequestItem.create({
          data: {
            requestId: newRequest.id,
            produkMasterId: item.produkMasterId,
            namaProduk: item.namaProduk,
            sku: item.sku,
            barcode: item.barcode,
            deskripsi: item.deskripsi,
            kategoriId: item.kategoriId,
            brand: item.brand,
            satuan: item.satuan,
            berat: item.berat,
            dimensiP: item.dimensiP,
            dimensiL: item.dimensiL,
            dimensiT: item.dimensiT,
            isManagedStock: item.isManagedStock,
            hasExpired: item.hasExpired,
            hargaBeli: item.hargaBeli,
            hargaJual: item.hargaJual,
            hargaGrosir: item.hargaGrosir,
            jumlahDiminta: item.jumlahDiminta,
            catatan: item.catatan,
          },
        });
      }
    }

    // Process attachments if provided
    if (attachments && attachments.length > 0) {
      // Upload files to Supabase and create attachment records
      const attachmentUploadPromises = attachments.map(async (file) => {
        // Upload to Supabase
        const { url } = await uploadFileToSupabase(file);

        // Return data for database insertion
        return {
          requestId: newRequest.id,
          fileName: file.originalname,
          filePath: url,
          isReferensi: file.fieldname === "referensi",
          uploadedById: userId,
        };
      });

      // Wait for all uploads to complete
      const uploadedAttachments = await Promise.all(attachmentUploadPromises);

      // Create attachments in database
      for (const attachment of uploadedAttachments) {
        await tx.produkRequestAttachment.create({
          data: attachment,
        });
      }
    }

    // Create audit log
    await createAuditLog(tx, {
      userId,
      ipAddress,
      action: "CREATE",
      tableName: "produk_request",
      recordId: newRequest.id,
      oldValues: null,
      newValues: { ...requestData, items },
    });

    // Return the created request with related data
    return getProdukRequestById(newRequest.id);
  });
};

// Submit a product request (change status from draft to submitted)
const submitProdukRequest = async (id, { userId, ipAddress }) => {
  return prisma.$transaction(async (tx) => {
    // Get existing request
    const existingRequest = await tx.produkRequest.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingRequest) {
      throw new ResponseError(404, "Product request not found");
    }

    if (existingRequest.status !== "draft") {
      throw new ResponseError(400, "Only draft requests can be submitted");
    }

    if (existingRequest.items.length === 0) {
      throw new ResponseError(400, "Cannot submit a request with no items");
    }

    // Validate items for new product requests
    if (existingRequest.requestType === "new_product") {
      for (const item of existingRequest.items) {
        if (!item.namaProduk || !item.sku) {
          throw new ResponseError(
            400,
            "All new product items must have name and SKU"
          );
        }

        // Check if SKU already exists
        if (item.sku) {
          const existingSku = await tx.produkMaster.findUnique({
            where: { sku: item.sku },
          });

          if (existingSku) {
            throw new ResponseError(400, `SKU ${item.sku} already exists`);
          }
        }
      }
    }

    // Update request status
    const updatedRequest = await tx.produkRequest.update({
      where: { id },
      data: { status: "submitted" },
    });

    // Create audit log
    await createAuditLog(tx, {
      userId,
      ipAddress,
      action: "UPDATE",
      tableName: "produk_request",
      recordId: id,
      oldValues: { status: existingRequest.status },
      newValues: { status: "submitted" },
    });

    return getProdukRequestById(id);
  });
};

// Update an existing product request
const updateProdukRequest = async (
  id,
  data,
  attachments,
  { userId, ipAddress }
) => {
  return prisma.$transaction(async (tx) => {
    // Get existing request
    const existingRequest = await tx.produkRequest.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingRequest) {
      throw new ResponseError(404, "Product request not found");
    }

    // Can only update draft requests
    if (existingRequest.status !== "draft") {
      throw new ResponseError(400, "Only draft requests can be updated");
    }

    // Update the request (basic fields)
    const { items, ...requestData } = data;
    const updatedRequest = await tx.produkRequest.update({
      where: { id },
      data: requestData,
    });

    // Update items if provided
    if (items && items.length > 0) {
      // Delete existing items and create new ones
      await tx.produkRequestItem.deleteMany({
        where: { requestId: id },
      });

      // Add new items
      for (const item of items) {
        await tx.produkRequestItem.create({
          data: {
            requestId: id,
            produkMasterId: item.produkMasterId,
            namaProduk: item.namaProduk,
            sku: item.sku,
            barcode: item.barcode,
            deskripsi: item.deskripsi,
            kategoriId: item.kategoriId,
            brand: item.brand,
            satuan: item.satuan,
            berat: item.berat,
            dimensiP: item.dimensiP,
            dimensiL: item.dimensiL,
            dimensiT: item.dimensiT,
            isManagedStock: item.isManagedStock,
            hasExpired: item.hasExpired,
            hargaBeli: item.hargaBeli,
            hargaJual: item.hargaJual,
            hargaGrosir: item.hargaGrosir,
            jumlahDiminta: item.jumlahDiminta,
            catatan: item.catatan,
          },
        });
      }
    }

    // Process attachments if provided
    if (attachments && attachments.length > 0) {
      // Upload files to Supabase and create attachment records
      const attachmentUploadPromises = attachments.map(async (file) => {
        // Upload to Supabase
        const { url } = await uploadFileToSupabase(file);

        // Return data for database insertion
        return {
          requestId: id,
          fileName: file.originalname,
          filePath: url,
          isReferensi: file.fieldname === "referensi",
          uploadedById: userId,
        };
      });

      // Wait for all uploads to complete
      const uploadedAttachments = await Promise.all(attachmentUploadPromises);

      // Create attachments in database
      for (const attachment of uploadedAttachments) {
        await tx.produkRequestAttachment.create({
          data: attachment,
        });
      }
    }

    // Create audit log
    await createAuditLog(tx, {
      userId,
      ipAddress,
      action: "UPDATE",
      tableName: "produk_request",
      recordId: id,
      oldValues: existingRequest,
      newValues: data,
    });

    return getProdukRequestById(id);
  });
};

// Process approval or rejection by super_admin
const processRequest = async (
  id,
  { isApproved, catatan, userId, ipAddress }
) => {
  return prisma.$transaction(async (tx) => {
    // Get existing request
    const existingRequest = await tx.produkRequest.findUnique({
      where: { id },
      include: {
        items: true,
        cabang: true,
        attachments: true,
      },
    });

    if (!existingRequest) {
      throw new ResponseError(404, "Product request not found");
    }

    if (existingRequest.status !== "submitted") {
      throw new ResponseError(400, "Only submitted requests can be processed");
    }

    // Process the request based on approval decision
    if (isApproved) {
      // Update request status to approved
      await tx.produkRequest.update({
        where: { id },
        data: {
          status: "approved",
          approvedAt: new Date(),
          approvedById: userId,
          catatan: catatan,
        },
      });

      // Process each item in the request
      for (const item of existingRequest.items) {
        // For new product requests, create product master
        if (
          existingRequest.requestType === "new_product" &&
          !item.produkMasterId
        ) {
          // Create a new product master
          const newProdukMaster = await tx.produkMaster.create({
            data: {
              namaProduk: item.namaProduk,
              sku: item.sku,
              barcode: item.barcode,
              deskripsi: item.deskripsi,
              kategoriId: item.kategoriId,
              brand: item.brand,
              satuan: item.satuan,
              berat: item.berat,
              dimensiP: item.dimensiP,
              dimensiL: item.dimensiL,
              dimensiT: item.dimensiT,
              isManagedStock: item.isManagedStock,
              hasExpired: item.hasExpired,
              status: "aktif",
            },
          });

          // Link the request item to the newly created product master
          await tx.produkRequestItem.update({
            where: { id: item.id },
            data: {
              generatedProdukMasterId: newProdukMaster.id,
              statusItem: "approved",
              jumlahDisetujui: item.jumlahDiminta,
            },
          });

          // Create product in the branch with stock and prices
          const newProduk = await tx.produk.create({
            data: {
              produkMasterId: newProdukMaster.id,
              cabangId: existingRequest.cabangId,
              hargaBeli: item.hargaBeli,
              hargaJual: item.hargaJual,
              hargaGrosir: item.hargaGrosir,
              stok: item.jumlahDiminta,
              minStok: 10, // Default value
              status: "tersedia",
            },
          });

          // Create price history records
          await tx.produkPriceHistory.create({
            data: {
              produkId: newProduk.id,
              cabangId: existingRequest.cabangId,
              tipeHarga: "beli",
              hargaLama: 0,
              hargaBaru: item.hargaBeli,
              tanggalPerubahan: new Date(),
              alasanPerubahan: "Initial price from product request",
            created_by_user_Id: userId,
            },
          });

          await tx.produkPriceHistory.create({
            data: {
              produkId: newProduk.id,
              cabangId: existingRequest.cabangId,
              tipeHarga: "jual",
              hargaLama: 0,
              hargaBaru: item.hargaJual,
              tanggalPerubahan: new Date(),
              alasanPerubahan: "Initial price from product request",
              created_by_user_Id: userId,
            },
          });

          if (item.hargaGrosir) {
            await tx.produkPriceHistory.create({
              data: {
                produkId: newProduk.id,
                cabangId: existingRequest.cabangId,
                tipeHarga: "grosir",
                hargaLama: 0,
                hargaBaru: item.hargaGrosir,
                tanggalPerubahan: new Date(),
                alasanPerubahan: "Initial price from product request",
                created_by_user_Id: userId,
              },
            });
          }

          // If there are reference images, create product images
          const referenceImages = existingRequest.attachments.filter(
            (a) => a.isReferensi
          );
          if (referenceImages.length > 0) {
            // Create product images from reference attachments
            for (let i = 0; i < referenceImages.length; i++) {
              const image = referenceImages[i];

              await tx.produkImage.create({
                data: {
                  produkMasterId: newProdukMaster.id,
                  fileName: image.fileName,
                  filePath: image.filePath,
                  isPrimary: i === 0, // First image is primary
                  urutan: i + 1,
                },
              });
            }
          }
        }
        // For restock requests, update existing product stock
        else if (
          existingRequest.requestType === "restock" &&
          item.produkMasterId
        ) {
          // Get existing product in branch
          const existingProduk = await tx.produk.findFirst({
            where: {
              produkMasterId: item.produkMasterId,
              cabangId: existingRequest.cabangId,
            },
          });

          if (existingProduk) {
            // Update existing product stock
            await tx.produk.update({
              where: { id: existingProduk.id },
              data: {
                stok: {
                  increment: item.jumlahDiminta,
                },
              },
            });

            // Create inventory movement record
            await tx.inventoryMovement.create({
              data: {
                produkId: existingProduk.id,
                cabangId: existingRequest.cabangId,
                referenceId: id,
                referenceType: "REQUEST",
                quantity: item.jumlahDiminta,
                keterangan: "Restock from product request",
              userId: userId,
              },
            });
          } else {
            // If product exists in master but not in this branch, create it
            const newProduk = await tx.produk.create({
              data: {
                produkMasterId: item.produkMasterId,
                cabangId: existingRequest.cabangId,
                hargaBeli: item.hargaBeli,
                hargaJual: item.hargaJual,
                hargaGrosir: item.hargaGrosir,
                stok: item.jumlahDiminta,
                minStok: 10, // Default value
                status: "tersedia",
              },
            });

            // Create price history records
            await tx.produkPriceHistory.create({
              data: {
                produkId: newProduk.id,
                cabangId: existingRequest.cabangId,
                tipeHarga: "beli",
                hargaLama: 0,
                hargaBaru: item.hargaBeli,
                tanggalPerubahan: new Date(),
                alasanPerubahan: "Initial price from product request",
                userId: userId,
              },
            });

            await tx.produkPriceHistory.create({
              data: {
                produkId: newProduk.id,
                cabangId: existingRequest.cabangId,
                tipeHarga: "jual",
                hargaLama: 0,
                hargaBaru: item.hargaJual,
                tanggalPerubahan: new Date(),
                alasanPerubahan: "Initial price from product request",
                created_by_user_Id: userId,
              },
            });

            if (item.hargaGrosir) {
              await tx.produkPriceHistory.create({
                data: {
                  produkId: newProduk.id,
                  cabangId: existingRequest.cabangId,
                  tipeHarga: "grosir",
                  hargaLama: 0,
                  hargaBaru: item.hargaGrosir,
                  tanggalPerubahan: new Date(),
                  alasanPerubahan: "Initial price from product request",
                  created_by_user_Id: userId,
                },
              });
            }

            // Create inventory movement record
            await tx.inventoryMovement.create({
              data: {
                produkId: newProduk.id,
                cabangId: existingRequest.cabangId,
                referenceId: id,
                referenceType: "REQUEST",
                quantity: item.jumlahDiminta,
                keterangan: "Initial stock from product request",
                userId: userId,
              },
            });
          }

          // Update request item status
          await tx.produkRequestItem.update({
            where: { id: item.id },
            data: {
              statusItem: "approved",
              jumlahDisetujui: item.jumlahDiminta,
            },
          });
        }
      }
    } else {
      // Reject the request
      await tx.produkRequest.update({
        where: { id },
        data: {
          status: "rejected",
          approvedAt: new Date(),
          approvedById: userId,
          catatan: catatan,
        },
      });

      // Update all items to rejected
      await tx.produkRequestItem.updateMany({
        where: { requestId: id },
        data: {
          statusItem: "rejected",
          jumlahDisetujui: 0,
        },
      });
    }

    // Create audit log
    await createAuditLog(tx, {
      userId,
      ipAddress,
      action: "UPDATE",
      tableName: "produk_request",
      recordId: id,
      oldValues: { status: existingRequest.status },
      newValues: { status: isApproved ? "approved" : "rejected" },
    });

    return getProdukRequestById(id);
  });
};

// Mark a request as completed after fulfillment
const completeProdukRequest = async (id, { userId, ipAddress }) => {
  return prisma.$transaction(async (tx) => {
    // Get existing request
    const existingRequest = await tx.produkRequest.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingRequest) {
      throw new ResponseError(404, "Product request not found");
    }

    if (existingRequest.status !== "approved") {
      throw new ResponseError(
        400,
        "Only approved requests can be marked as completed"
      );
    }

    // Update request status to completed
    await tx.produkRequest.update({
      where: { id },
      data: { status: "completed" },
    });

    // Update all items to completed
    await tx.produkRequestItem.updateMany({
      where: {
        requestId: id,
        statusItem: "approved",
      },
      data: { statusItem: "completed" },
    });

    // Create audit log
    await createAuditLog(tx, {
      userId,
      ipAddress,
      action: "UPDATE",
      tableName: "produk_request",
      recordId: id,
      oldValues: { status: existingRequest.status },
      newValues: { status: "completed" },
    });

    return getProdukRequestById(id);
  });
};

// Delete a product request (only drafts)
const deleteProdukRequest = async (id, { userId, ipAddress }) => {
  return prisma.$transaction(async (tx) => {
    // Get existing request
    const existingRequest = await tx.produkRequest.findUnique({
      where: { id },
      include: { attachments: true },
    });

    if (!existingRequest) {
      throw new ResponseError(404, "Product request not found");
    }

    // Only draft requests can be deleted
    if (existingRequest.status !== "draft") {
      throw new ResponseError(400, "Only draft requests can be deleted");
    }

    // Delete attachments from Supabase
    if (existingRequest.attachments.length > 0) {
      const filePaths = existingRequest.attachments.map((a) => a.filePath);
      try {
        await deleteFilesFromSupabase(filePaths);
      } catch (error) {
        console.error("Error deleting attachments:", error);
        // Continue with deletion even if file deletion fails
      }
    }

    // Delete request (will cascade delete items and attachments)
    await tx.produkRequest.delete({
      where: { id },
    });

    // Create audit log
    await createAuditLog(tx, {
      userId,
      ipAddress,
      action: "DELETE",
      tableName: "produk_request",
      recordId: id,
      oldValues: existingRequest,
      newValues: null,
    });

    return { success: true, id };
  });
};

// Delete attachment
const deleteRequestAttachment = async (attachmentId, { userId, ipAddress }) => {
  return prisma.$transaction(async (tx) => {
    // Get existing attachment and related request
    const attachment = await tx.produkRequestAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        request: true,
      },
    });

    if (!attachment) {
      throw new ResponseError(404, "Attachment not found");
    }

    // Can only delete attachments from draft requests
    if (attachment.request.status !== "draft") {
      throw new ResponseError(
        400,
        "Can only delete attachments from draft requests"
      );
    }

    // Delete the file from Supabase
    try {
      await deleteFilesFromSupabase(attachment.filePath);
    } catch (error) {
      console.error("Error deleting file from Supabase:", error);
    }

    // Delete the attachment record
    await tx.produkRequestAttachment.delete({
      where: { id: attachmentId },
    });

    // Create audit log
    await createAuditLog(tx, {
      userId,
      ipAddress,
      action: "DELETE",
      tableName: "produk_request_attachment",
      recordId: attachmentId,
      oldValues: attachment,
      newValues: null,
    });

    return { success: true, id: attachmentId };
  });
};

// Get analytics for dashboard
const getProdukRequestAnalytics = async (cabangId, period = "month") => {
  // Define date range based on period
  let startDate = new Date();

  switch (period) {
    case "week":
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "month":
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case "quarter":
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case "year":
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate.setMonth(startDate.getMonth() - 1); // Default to 1 month
  }

  // Build the filter
  const where = {
    createdAt: {
      gte: startDate,
    },
  };

  if (cabangId) {
    where.cabangId = cabangId;
  }

  // Get aggregated data
  const [
    totalRequests,
    totalNewProductRequests,
    totalRestockRequests,
    statusCounts,
    approvedRequests,
  ] = await Promise.all([
    // Total requests
    prisma.produkRequest.count({ where }),

    // Total new product requests
    prisma.produkRequest.count({
      where: {
        ...where,
        requestType: "new_product",
      },
    }),

    // Total restock requests
    prisma.produkRequest.count({
      where: {
        ...where,
        requestType: "restock",
      },
    }),

    // Status distribution
    prisma.produkRequest.groupBy({
      by: ["status"],
      where,
      _count: true,
    }),

    // Approved requests with details for processing time calculation
    prisma.produkRequest.findMany({
      where: {
        ...where,
        status: "approved",
        approvedAt: { not: null },
      },
      select: {
        createdAt: true,
        approvedAt: true,
      },
    }),
  ]);

  // Calculate average processing time (in hours)
  let avgProcessingTimeHours = 0;
  if (approvedRequests.length > 0) {
    const totalHours = approvedRequests.reduce((sum, request) => {
      const processingTimeMs =
        request.approvedAt.getTime() - request.createdAt.getTime();
      return sum + processingTimeMs / (1000 * 60 * 60); // Convert to hours
    }, 0);
    avgProcessingTimeHours = totalHours / approvedRequests.length;
  }

  // Format status counts into an object
  const statusDistribution = {};
  statusCounts.forEach((item) => {
    statusDistribution[item.status] = item._count;
  });

  // Return formatted analytics
  return {
    totalRequests,
    newProductRequests: totalNewProductRequests,
    restockRequests: totalRestockRequests,
    statusDistribution,
    avgProcessingTimeHours: parseFloat(avgProcessingTimeHours.toFixed(2)),
    period,
  };
};

module.exports = {
  getAllProdukRequests,
  getProdukRequestById,
  createProdukRequest,
  submitProdukRequest,
  updateProdukRequest,
  processRequest,
  completeProdukRequest,
  deleteProdukRequest,
  deleteRequestAttachment,
  getProdukRequestAnalytics,
};
