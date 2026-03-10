const prisma = require("../config/db");
const { ResponseError } = require("../error/responseError");
const { createAuditLog } = require("../utils/auditLog");
const {
  uploadFileToSupabase,
  deleteFilesFromSupabase,
} = require("../utils/uploadToSupabase");
const {
  cacheSet,
  cacheGet,
  cacheDelete,
  createCacheKey,
  cacheOrFetch,
  cacheDeletePattern,
} = require("../utils/redisUtils");
const ProductDashboardService = require("./productDashboardService");
const { logger } = require("../utils/logger");


// Helper function to convert any string/boolean value to proper boolean
const convertToBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }
  return Boolean(value);
};

const getAllProdukMaster = async ({
  search,
  kategoriId,
  status,
  page = 1,
  limit = 10,
}) => {
  // Buat cache key berdasarkan parameter filter
  const cacheKey = createCacheKey(
    "produk-master-list",
    `search:${search || "-"}-kategori:${kategoriId || "-"}-status:${
      status || "-"
    }-page:${page}-limit:${limit}`
  );

  // TTL cache untuk daftar produk (10 menit)
  const cacheTTL = 600;

  return await cacheOrFetch(
    cacheKey,
    async () => {
      const skip = (page - 1) * Number(limit);
      const take = Number(limit);

      const where = {
        deletedAt: null,
      };

      if (search) {
        where.OR = [
          { namaProduk: { contains: search, mode: "insensitive" } },
          { sku: { contains: search, mode: "insensitive" } },
          { barcode: { contains: search, mode: "insensitive" } },
          { brand: { contains: search, mode: "insensitive" } },
        ];
      }

      if (kategoriId) {
        where.kategoriId = kategoriId;
      }

      if (status) {
        where.status = status;
      }

      const [total, data] = await Promise.all([
        prisma.produkMaster.count({ where }),
        prisma.produkMaster.findMany({
          where,
          include: {
            kategori: true,
            produkImage: {
              orderBy: {
                urutan: "asc",
              },
            },
          },
          skip,
          take,
          orderBy: {
            updatedAt: "desc",
          },
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
    },
    cacheTTL
  );
};

const getProdukMasterById = async (id) => {
  const cacheKey = createCacheKey("produk-master", id);

  return await cacheOrFetch(
    cacheKey,
    async () => {
      return prisma.produkMaster.findFirst({
        where: {
          id,
          deletedAt: null,
        },
        include: {
          kategori: true,
          produkImage: {
            orderBy: {
              urutan: "asc",
            },
          },
          produkSupplier: {
            include: {
              supplier: true,
            },
          },
        },
      });
    },
    3600
  ); // Cache 1 jam
};

const getProdukMasterBySku = async (sku) => {
  const cacheKey = createCacheKey("produk-master-sku", sku);

  return await cacheOrFetch(
    cacheKey,
    async () => {
      return prisma.produkMaster.findFirst({
        where: {
          sku,
          deletedAt: null,
        },
      });
    },
    3600
  ); // Cache 1 jam
};

const createProdukMaster = async (
  data,
  imagesProduk,
  { userId, ipAddress }
) => {
  const { produkImages, ...produkMasterData } = data;

  // Convert boolean fields
  if (produkMasterData.isManagedStock !== undefined) {
    produkMasterData.isManagedStock = convertToBoolean(
      produkMasterData.isManagedStock
    );
  }

  if (produkMasterData.hasExpired !== undefined) {
    produkMasterData.hasExpired = convertToBoolean(produkMasterData.hasExpired);
  }

  const kategoriIsExists = await prisma.kategori.findUnique({
    where: { id: produkMasterData.kategoriId },
  });

  if (!kategoriIsExists) {
    throw new ResponseError(404, "Category not found");
  }

  const newProdukMaster = await prisma.$transaction(async (tx) => {
    // Create the produk master record

    const newProdukMaster = await tx.produkMaster.create({
      data: produkMasterData,
    });

    // Create audit log entry for the product creation
    await createAuditLog(tx, {
      userId,
      ipAddress,
      action: "CREATE",
      tableName: "produk_master",
      recordId: newProdukMaster.id,
      oldValues: null,
      newValues: produkMasterData,
    });

    // If product images are provided, process and upload them
    if (imagesProduk && imagesProduk.length > 0) {
      // Upload images to Supabase and create image records
      const imageUploadPromises = imagesProduk.map(async (image, index) => {
        // Upload to Supabase
        const { url } = await uploadFileToSupabase(image);

        // Return data for database insertion
        return {
          produkMasterId: newProdukMaster.id,
          isPrimary: index === 0, // First image is primary by default
          urutan: index + 1,
          fileName: image.originalname,
          filePath: url,
        };
      });

      // Wait for all uploads to complete
      const uploadedImages = await Promise.all(imageUploadPromises);

      // Create images in database
      await tx.produkImage.createMany({
        data: uploadedImages.map((img) => ({
          produkMasterId: img.produkMasterId,
          fileName: img.fileName,
          filePath: img.filePath,
          isPrimary: img.isPrimary,
          urutan: img.urutan,
        })),
      });

      // Create audit log entry for image creation
      await createAuditLog(tx, {
        userId,
        ipAddress,
        action: "CREATE",
        tableName: "produk_image",
        recordId: newProdukMaster.id,
        oldValues: null,
        newValues: { images: uploadedImages },
      });
    }

    // Return the created product with its images
    return tx.produkMaster.findFirst({
      where: { id: newProdukMaster.id },
      include: {
        kategori: true,
        produkImage: true,
      },
    });
  });

  // Simpan ke cache
  const cacheKey = createCacheKey("produk-master", newProdukMaster.id);
  await cacheSet(cacheKey, newProdukMaster, 3600);

  // Invalidasi cache daftar produk
  await cacheDeletePattern("produk-master-list:*");

  // Invalidasi cache dashboard produk
  await ProductDashboardService.invalidateProductDashboardCache();

  return newProdukMaster;
};

const updateProdukMaster = async (
  id,
  data,
  imagesProduk,
  { userId, ipAddress }
) => {
  const { produkImages, ...produkMasterData } = data;

  // Convert boolean fields
  if (produkMasterData.isManagedStock !== undefined) {
    produkMasterData.isManagedStock = convertToBoolean(
      produkMasterData.isManagedStock
    );
  }

  if (produkMasterData.hasExpired !== undefined) {
    produkMasterData.hasExpired = convertToBoolean(produkMasterData.hasExpired);
  }

  const updatedProdukMaster = await prisma.$transaction(async (tx) => {
    // Get the existing product data for audit logging
    const existingProduct = await tx.produkMaster.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      throw new ResponseError(404, "Product not found");
    }

    // Update the produk master record
    const updatedProdukMaster = await tx.produkMaster.update({
      where: { id },
      data: produkMasterData,
    });

    // Create audit log entry for product update
    await createAuditLog(tx, {
      userId,
      ipAddress,
      action: "UPDATE",
      tableName: "produk_master",
      recordId: id,
      oldValues: existingProduct,
      newValues: produkMasterData,
    });

    // If product images are provided or explicitly set to empty array, handle them
    if (imagesProduk !== undefined) {
      // Get existing images for audit logging and Supabase deletion
      const existingImages = await tx.produkImage.findMany({
        where: { produkMasterId: id },
      });

      // Create audit log entry for image deletion
      if (existingImages.length > 0) {
        await createAuditLog(tx, {
          userId,
          ipAddress,
          action: "DELETE",
          tableName: "produk_image",
          recordId: id,
          oldValues: { images: existingImages },
          newValues: null,
        });
      }

      // Collect file paths to delete from Supabase
      const filePathsToDelete = existingImages
        .map((img) => img.filePath)
        .filter(Boolean);

      // Delete existing images from database
      await tx.produkImage.deleteMany({
        where: { produkMasterId: id },
      });

      // Then create new ones if provided
      if (imagesProduk && imagesProduk.length > 0) {
        // Upload new images to Supabase
        const imageUploadPromises = imagesProduk.map(async (image, index) => {
          // Upload to Supabase
          const { url } = await uploadFileToSupabase(image);

          // Return data for database insertion
          return {
            produkMasterId: id,
            isPrimary: index === 0, // First image is primary by default
            urutan: index + 1,
            fileName: image.originalname,
            filePath: url,
          };
        });

        // Wait for all uploads to complete
        const uploadedImages = await Promise.all(imageUploadPromises);

        // Create images in database
        await tx.produkImage.createMany({
          data: uploadedImages.map((img) => ({
            produkMasterId: id,
            fileName: img.fileName,
            filePath: img.filePath,
            isPrimary: img.isPrimary,
            urutan: img.urutan,
          })),
        });

        // Create audit log entry for new images
        await createAuditLog(tx, {
          userId,
          ipAddress,
          action: "CREATE",
          tableName: "produk_image",
          recordId: id,
          oldValues: null,
          newValues: { images: uploadedImages },
        });
      }

      // Delete old files from Supabase after transaction completes
      if (filePathsToDelete.length > 0) {
        try {
          // We use Promise.allSettled to avoid transaction failure if deletion fails
          await deleteFilesFromSupabase(filePathsToDelete);
        } catch (error) {
          // Log error but don't fail the transaction
          logger.error("Error deleting images from Supabase:", error);
        }
      }
    }

    // Return the updated product with its images
    return tx.produkMaster.findFirst({
      where: { id },
      include: {
        kategori: true,
        produkImage: true,
      },
    });
  });

  // Update cache
  const cacheKey = createCacheKey("produk-master", id);
  await cacheSet(cacheKey, updatedProdukMaster, 3600);

  // Invalidasi cache lainnya
  await cacheDeletePattern("produk-master-list:*");
  await cacheDelete(
    createCacheKey("produk-master-sku", updatedProdukMaster.sku)
  );

  // Invalidasi cache dashboard produk
  await ProductDashboardService.invalidateProductDashboardCache();

  return updatedProdukMaster;
};

const deleteProdukMaster = async (id, { userId, ipAddress }) => {
  const result = await prisma.$transaction(async (tx) => {
    // Get the existing product data for audit logging
    const existingProduct = await tx.produkMaster.findUnique({
      where: { id },
      include: {
        produkImage: true,
      },
    });

    if (!existingProduct) {
      throw new ResponseError(404, "Product not found");
    }

    // Collect file paths to delete from Supabase
    const filePathsToDelete = existingProduct.produkImage
      .map((img) => img.filePath)
      .filter(Boolean);

    // Create audit log entry for product deletion
    await createAuditLog(tx, {
      userId,
      ipAddress,
      action: "DELETE",
      tableName: "produk_master",
      recordId: id,
      oldValues: existingProduct,
      newValues: null,
    });

    // Delete product (cascades to images due to foreign key relationship)
    await prisma.produkMaster.update({
      where: { id },
      data: {
        status: "nonaktif",
        deletedAt: new Date(),
      },
    });

    // Delete files from Supabase after transaction completes
    if (filePathsToDelete.length > 0) {
      try {
        await deleteFilesFromSupabase(filePathsToDelete);
      } catch (error) {
        // Log error but don't fail the transaction
        logger.error("Error deleting images from Supabase:", error);
      }
    }

    return { success: true, id };
  });

  // Hapus dari cache
  await cacheDelete(createCacheKey("produk-master", id));

  // Invalidasi cache daftar produk
  await cacheDeletePattern("produk-master-list:*");
  await cacheDeletePattern("produk-master-sku:*");

  // Invalidasi cache dashboard produk
  await ProductDashboardService.invalidateProductDashboardCache();

  return result;
};

// Fungsi untuk mengatur gambar primer produk
const setPrimaryImage = async (
  produkMasterId,
  imageId,
  { userId, ipAddress }
) => {
  return prisma.$transaction(async (tx) => {
    // First check if product and image exist
    const product = await tx.produkMaster.findUnique({
      where: { id: produkMasterId },
      include: { produkImage: true },
    });

    if (!product) {
      throw new ResponseError(404, "Product not found");
    }

    const imageExists = product.produkImage.some((img) => img.id === imageId);
    if (!imageExists) {
      throw new ResponseError(404, "Image not found for this product");
    }

    // Reset all images to non-primary
    await tx.produkImage.updateMany({
      where: { produkMasterId },
      data: { isPrimary: false },
    });

    // Set the selected image as primary
    await tx.produkImage.update({
      where: { id: imageId },
      data: { isPrimary: true },
    });

    // Create audit log entry
    await createAuditLog(tx, {
      userId,
      ipAddress,
      action: "UPDATE",
      tableName: "produk_image",
      recordId: produkMasterId,
      oldValues: {
        primaryImageId:
          product.produkImage.find((img) => img.isPrimary)?.id || null,
      },
      newValues: { primaryImageId: imageId },
    });

    // Return updated product
    return tx.produkMaster.findFirst({
      where: { id: produkMasterId },
      include: {
        kategori: true,
        produkImage: true,
      },
    });
  });
};

const uploadProdukImages = async (
  produkMasterId,
  imagesProduk,
  { userId, ipAddress }
) => {
  // Check if product exists
  const product = await prisma.produkMaster.findFirst({
    where: {
      id: produkMasterId,
      deletedAt: null,
    },
    include: {
      produkImage: true,
    },
  });

  if (!product) {
    throw new ResponseError("Product not found");
  }

  return prisma.$transaction(async (tx) => {
    // Upload the images to Supabase
    if (imagesProduk && imagesProduk.length > 0) {
      // Calculate the next order number
      const maxUrutan = product.produkImage.reduce(
        (max, img) => (img.urutan > max ? img.urutan : max),
        0
      );

      // Determine if these should be primary images
      const hasPrimaryImage = product.produkImage.some((img) => img.isPrimary);

      // Upload new images to Supabase
      const imageUploadPromises = imagesProduk.map(async (image, index) => {
        // Upload to Supabase
        const { url, filePath } = await uploadFileToSupabase(image);

        // Return data for database insertion
        return {
          produkMasterId: produkMasterId,
          fileName: image.originalname,
          filePath: url,
          isPrimary: !hasPrimaryImage && index === 0,
          urutan: maxUrutan + index + 1,
        };
      });

      // Wait for all uploads to complete
      const uploadedImages = await Promise.all(imageUploadPromises);

      // Create images in database
      const createdImages = await tx.produkImage.createMany({
        data: uploadedImages.map((img) => ({
          produkMasterId: img.produkMasterId,
          fileName: img.fileName,
          filePath: img.filePath,
          isPrimary: img.isPrimary,
          urutan: img.urutan,
        })),
      });

      // Create audit log entry for new images
      if (userId && ipAddress) {
        await createAuditLog(tx, {
          userId,
          ipAddress,
          action: "CREATE",
          tableName: "produk_image",
          recordId: produkMasterId,
          oldValues: null,
          newValues: { images: uploadedImages },
        });
      }

      // Return the updated product with images
      return tx.produkMaster.findFirst({
        where: { id: produkMasterId },
        include: {
          produkImage: true,
        },
      });
    }
    return product;
  });
};

// Delete image function
const deleteProdukImage = async (imageId, { userId, ipAddress } = {}) => {
  // Get the image record
  const image = await prisma.produkImage.findUnique({
    where: { id: imageId },
    include: {
      produkMaster: true,
    },
  });

  if (!image) {
    throw new ResponseError("Image not found");
  }

  // Check if this is the primary image and there are other images
  const isPrimary = image.isPrimary;
  const produkMasterId = image.produkMasterId;

  return prisma.$transaction(async (tx) => {
    // Delete the image from database
    await tx.produkImage.delete({
      where: { id: imageId },
    });

    // Delete the file from Supabase
    try {
      await deleteFilesFromSupabase(image.filePath);
    } catch (error) {
      logger.error("Error deleting file from Supabase:", error);
    }

    // Create audit log entry if user info is provided
    if (userId && ipAddress) {
      await createAuditLog(tx, {
        userId,
        ipAddress,
        action: "DELETE",
        tableName: "produk_image",
        recordId: imageId,
        oldValues: image,
        newValues: null,
      });
    }

    // If this was the primary image, set another image as primary if available
    if (isPrimary) {
      const remainingImages = await tx.produkImage.findMany({
        where: { produkMasterId },
        orderBy: { urutan: "asc" },
      });

      if (remainingImages.length > 0) {
        await tx.produkImage.update({
          where: { id: remainingImages[0].id },
          data: { isPrimary: true },
        });
      }
    }

    return { success: true, id: imageId };
  });
};

const invalidateProdukMasterCache = async (id = null) => {
  if (id) {
    await cacheDelete(createCacheKey("produk-master", id));
  } else {
    await cacheDeletePattern("produk-master:*");
    await cacheDeletePattern("produk-master-list:*");
    await cacheDeletePattern("produk-master-sku:*");
  }
};

module.exports = {
  getAllProdukMaster,
  getProdukMasterById,
  getProdukMasterBySku,
  createProdukMaster,
  updateProdukMaster,
  deleteProdukMaster,
  uploadProdukImages,
  setPrimaryImage,
  deleteProdukImage,
  invalidateProdukMasterCache,
};
