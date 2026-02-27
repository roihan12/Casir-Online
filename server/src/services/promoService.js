const prisma = require("../config/db");
const { createAuditLog } = require("../utils/auditLog");
const { ResponseError } = require("../error/responseError");
const { validate } = require("../validation/validation");
const {
  createPromoSchema,
  updatePromoSchema,
  verifyPromoSchema,
  verifyMultiplePromosSchema,
  calculatePreviewSchema,
  changePromoStatusSchema,
} = require("../validation/promoValidation");
const {
  cacheSet,
  cacheGet,
  cacheDelete,
  createCacheKey,
  cacheOrFetch,
  cacheDeletePattern,
} = require("../utils/redisUtils");

/**
 * Create a new promo with raw SQL query
 */
const createPromo = async (data, context) => {
  const { userId, ipAddress, userName } = context;
  const validData = validate(createPromoSchema, data);

  // Check for duplicate kode promo
  const existingPromo = await prisma.$queryRaw`
    SELECT promo_id, kode_promo, deleted_at
    FROM promo_diskon
    WHERE kode_promo = ${validData.kodePromo}::VARCHAR
    AND deleted_at IS NULL
    LIMIT 1
  `;

  if (existingPromo && existingPromo.length > 0) {
    throw new ResponseError(400, "Kode promo sudah ada");
  }

  // Validate cabang exists if cabangId provided
  if (validData.cabangId) {
    const cabang = await prisma.$queryRaw`
      SELECT cabang_id FROM cabang
      WHERE cabang_id = ${validData.cabangId}::VARCHAR
      AND deleted_at IS NULL
      LIMIT 1
    `;
    if (!cabang || cabang.length === 0) {
      throw new ResponseError(404, "Cabang tidak ditemukan");
    }
  }

  // Validate kategori exists if kategoriId provided
  if (validData.kategoriId) {
    const kategori = await prisma.$queryRaw`
      SELECT kategori_id FROM kategori
      WHERE kategori_id = ${validData.kategoriId}::VARCHAR
      LIMIT 1
    `;
    if (!kategori || kategori.length === 0) {
      throw new ResponseError(404, "Kategori tidak ditemukan");
    }
  }

  // Validate produk exists if produkId provided
  if (validData.produkId) {
    const produk = await prisma.$queryRaw`
      SELECT produk_master_id FROM produk_master
      WHERE produk_master_id = ${validData.produkId}::VARCHAR
      LIMIT 1
    `;
    if (!produk || produk.length === 0) {
      throw new ResponseError(404, "Produk tidak ditemukan");
    }
  }

  return await prisma.$transaction(async (tx) => {
    const buyXgetYConfigJson = validData.buyXgetYConfig
      ? JSON.stringify(validData.buyXgetYConfig)
      : null;

    const result = await tx.$executeRaw`
      INSERT INTO promo_diskon (
        nama_promo,
        kode_promo,
        deskripsi,
        tipe_diskon,
        nilai_diskon,
        buy_x_get_y_config,
        min_pembelian,
        max_diskon,
        max_penggunaan_total,
        max_penggunaan_per_user,
        tanggal_mulai,
        tanggal_berakhir,
        limit_penggunaan,
        tipe_scope,
        kategori_id,
        produk_id,
        cabang_id,
        status,
        created_by,
        created_by_user_id,
        updated_by,
        updated_by_user_id
      )
      VALUES (
        ${validData.namaPromo}::VARCHAR,
        ${validData.kodePromo}::VARCHAR,
        ${validData.deskripsi}::TEXT,
        ${validData.tipeDiskon}::VARCHAR,
        ${validData.nilaiDiskon}::NUMERIC(15,2),
        ${buyXgetYConfigJson}::JSONB,
        ${validData.minPembelian}::NUMERIC(15,2),
        ${validData.maxDiskon}::NUMERIC(15,2),
        ${validData.maxPenggunaanTotal}::INTEGER,
        ${validData.maxPenggunaanPerUser}::INTEGER,
        ${validData.tanggalMulai || null}::DATE,
        ${validData.tanggalBerakhir || null}::DATE,
        ${validData.limitPenggunaan}::INTEGER,
        ${validData.tipeScope}::VARCHAR,
        ${validData.kategoriId}::VARCHAR,
        ${validData.produkId}::VARCHAR,
        ${validData.cabangId}::VARCHAR,
        ${validData.status}::VARCHAR,
        ${userName}::VARCHAR,
        ${userId}::VARCHAR,
        ${userName}::VARCHAR,
        ${userId}::VARCHAR
      )
      RETURNING *
    `;

    const promo = result[0];

    // Create audit log
    createAuditLog(tx, {
      userId,
      userName,
      ipAddress,
      cabangId: validData.cabangId,
      action: "CREATE",
      tableName: "promo_diskon",
      recordId: promo.promo_id,
      oldValues: null,
      newValues: validData,
    }).catch((error) => console.error("Audit log creation failed:", error));

    // Invalidate cache
    await cacheDeletePattern("promo-list:*");
    await cacheDeletePattern("promo:eligible:*");

    return {
      id: promo.promo_id,
      namaPromo: promo.nama_promo,
      kodePromo: promo.kode_promo,
      deskripsi: promo.deskripsi,
      tipeDiskon: promo.tipe_diskon,
      nilaiDiskon: parseFloat(promo.nilai_diskon),
      buyXgetYConfig: promo.buy_x_get_y_config,
      minPembelian: promo.min_pembelian ? parseFloat(promo.min_pembelian) : null,
      maxDiskon: promo.max_diskon ? parseFloat(promo.max_diskon) : null,
      maxPenggunaanTotal: promo.max_penggunaan_total,
      maxPenggunaanPerUser: promo.max_penggunaan_per_user,
      tanggalMulai: promo.tanggal_mulai,
      tanggalBerakhir: promo.tanggal_berakhir,
      limitPenggunaan: promo.limit_penggunaan,
      tipeScope: promo.tipe_scope,
      kategoriId: promo.kategori_id,
      produkId: promo.produk_id,
      cabangId: promo.cabang_id,
      status: promo.status,
      createdAt: promo.created_at,
    };
  });
};

/**
 * Update an existing promo with raw SQL query
 */
const updatePromo = async (id, data, context) => {
  const { userId, ipAddress, userName } = context;
  const validData = validate(updatePromoSchema, data);

  // Check if promo exists
  const existingPromo = await prisma.$queryRaw`
    SELECT * FROM promo_diskon
    WHERE promo_id = ${id}::VARCHAR
    AND deleted_at IS NULL
    LIMIT 1
  `;

  if (!existingPromo || existingPromo.length === 0) {
    throw new ResponseError(404, "Promo tidak ditemukan");
  }

  const oldData = existingPromo[0];

  // Check for duplicate kode promo if changed
  if (validData.kodePromo && validData.kodePromo !== oldData.kode_promo) {
    const duplicatePromo = await prisma.$queryRaw`
      SELECT promo_id FROM promo_diskon
      WHERE kode_promo = ${validData.kodePromo}::VARCHAR
      AND promo_id != ${id}::VARCHAR
      AND deleted_at IS NULL
      LIMIT 1
    `;

    if (duplicatePromo && duplicatePromo.length > 0) {
      throw new ResponseError(400, "Kode promo sudah ada");
    }
  }

  return await prisma.$transaction(async (tx) => {
    // Build dynamic update query with proper parameter numbering
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    if (validData.namaPromo !== undefined) {
      updateFields.push(`nama_promo = $${paramIndex}`);
      values.push(validData.namaPromo);
      paramIndex++;
    }
    if (validData.kodePromo !== undefined) {
      updateFields.push(`kode_promo = $${paramIndex}`);
      values.push(validData.kodePromo);
      paramIndex++;
    }
    if (validData.deskripsi !== undefined) {
      updateFields.push(`deskripsi = $${paramIndex}`);
      values.push(validData.deskripsi);
      paramIndex++;
    }
    if (validData.tipeDiskon !== undefined) {
      updateFields.push(`tipe_diskon = $${paramIndex}`);
      values.push(validData.tipeDiskon);
      paramIndex++;
    }
    if (validData.nilaiDiskon !== undefined) {
      updateFields.push(`nilai_diskon = $${paramIndex}`);
      values.push(validData.nilaiDiskon);
      paramIndex++;
    }
    if (validData.buyXgetYConfig !== undefined) {
      updateFields.push(`buy_x_get_y_config = $${paramIndex}`);
      values.push(validData.buyXgetYConfig ? JSON.stringify(validData.buyXgetYConfig) : null);
      paramIndex++;
    }
    if (validData.minPembelian !== undefined) {
      updateFields.push(`min_pembelian = $${paramIndex}`);
      values.push(validData.minPembelian);
      paramIndex++;
    }
    if (validData.maxDiskon !== undefined) {
      updateFields.push(`max_diskon = $${paramIndex}`);
      values.push(validData.maxDiskon);
      paramIndex++;
    }
    if (validData.maxPenggunaanTotal !== undefined) {
      updateFields.push(`max_penggunaan_total = $${paramIndex}`);
      values.push(validData.maxPenggunaanTotal);
      paramIndex++;
    }
    if (validData.maxPenggunaanPerUser !== undefined) {
      updateFields.push(`max_penggunaan_per_user = $${paramIndex}`);
      values.push(validData.maxPenggunaanPerUser);
      paramIndex++;
    }
    if (validData.tanggalMulai !== undefined) {
      updateFields.push(`tanggal_mulai = $${paramIndex}`);
      values.push(validData.tanggalMulai);
      paramIndex++;
    }
    if (validData.tanggalBerakhir !== undefined) {
      updateFields.push(`tanggal_berakhir = $${paramIndex}`);
      values.push(validData.tanggalBerakhir);
      paramIndex++;
    }
    if (validData.limitPenggunaan !== undefined) {
      updateFields.push(`limit_penggunaan = $${paramIndex}`);
      values.push(validData.limitPenggunaan);
      paramIndex++;
    }
    if (validData.tipeScope !== undefined) {
      updateFields.push(`tipe_scope = $${paramIndex}`);
      values.push(validData.tipeScope);
      paramIndex++;
    }
    if (validData.kategoriId !== undefined) {
      updateFields.push(`kategori_id = $${paramIndex}`);
      values.push(validData.kategoriId);
      paramIndex++;
    }
    if (validData.produkId !== undefined) {
      updateFields.push(`produk_id = $${paramIndex}`);
      values.push(validData.produkId);
      paramIndex++;
    }
    if (validData.cabangId !== undefined) {
      updateFields.push(`cabang_id = $${paramIndex}`);
      values.push(validData.cabangId);
      paramIndex++;
    }
    if (validData.status !== undefined) {
      updateFields.push(`status = $${paramIndex}`);
      values.push(validData.status);
      paramIndex++;
    }

    // Always add audit fields
    updateFields.push(`updated_by = $${paramIndex}`);
    values.push(userName);
    paramIndex++;
    updateFields.push(`updated_by_user_id = $${paramIndex}`);
    values.push(userId);
    paramIndex++;
    updateFields.push(`updated_at = $${paramIndex}`);
    values.push(new Date());
    paramIndex++;

    // Add WHERE clause parameter
    values.push(id);

    const result = await tx.$queryRawUnsafe(
      `UPDATE promo_diskon SET ${updateFields.join(", ")} WHERE promo_id = $${paramIndex} RETURNING *`,
      values
    );

    const promo = result[0];

    // Create audit log
    createAuditLog(tx, {
      userId,
      userName,
      ipAddress,
      cabangId: promo.cabang_id || oldData.cabang_id,
      action: "UPDATE",
      tableName: "promo_diskon",
      recordId: promo.promo_id,
      oldValues: oldData,
      newValues: validData,
    }).catch((error) => console.error("Audit log creation failed:", error));

    // Invalidate cache
    await cacheDelete(createCacheKey("promo", id));
    await cacheDeletePattern("promo-list:*");
    await cacheDeletePattern("promo:eligible:*");

    return {
      id: promo.promo_id,
      namaPromo: promo.nama_promo,
      kodePromo: promo.kode_promo,
      deskripsi: promo.deskripsi,
      tipeDiskon: promo.tipe_diskon,
      nilaiDiskon: parseFloat(promo.nilai_diskon),
      buyXgetYConfig: promo.buy_x_get_y_config,
      minPembelian: promo.min_pembelian ? parseFloat(promo.min_pembelian) : null,
      maxDiskon: promo.max_diskon ? parseFloat(promo.max_diskon) : null,
      maxPenggunaanTotal: promo.max_penggunaan_total,
      maxPenggunaanPerUser: promo.max_penggunaan_per_user,
      tanggalMulai: promo.tanggal_mulai,
      tanggalBerakhir: promo.tanggal_berakhir,
      limitPenggunaan: promo.limit_penggunaan,
      tipeScope: promo.tipe_scope,
      kategoriId: promo.kategori_id,
      produkId: promo.produk_id,
      cabangId: promo.cabang_id,
      status: promo.status,
      createdAt: promo.created_at,
      updatedAt: promo.updated_at,
    };
  });
};

/**
 * Delete a promo (soft delete) with raw SQL query
 */
const deletePromo = async (id, context) => {
  const { userId, ipAddress, userName } = context;

  return await prisma.$transaction(async (tx) => {
    // Check if promo exists
    const existingPromo = await tx.$queryRaw`
      SELECT * FROM promo_diskon
      WHERE promo_id = ${id}::VARCHAR
      AND deleted_at IS NULL
      LIMIT 1
    `;

    if (!existingPromo || existingPromo.length === 0) {
      throw new ResponseError(404, "Promo tidak ditemukan");
    }

    const oldData = existingPromo[0];

    // Soft delete
    await tx.$executeRaw`
      UPDATE promo_diskon
      SET deleted_at = NOW(),
          deleted_by = ${userName}::VARCHAR,
          deleted_by_user_id = ${userId}::VARCHAR
      WHERE promo_id = ${id}::VARCHAR
    `;

    // Create audit log
    createAuditLog(tx, {
      userId,
      userName,
      ipAddress,
      cabangId: oldData.cabang_id,
      action: "DELETE",
      tableName: "promo_diskon",
      recordId: id,
      oldValues: oldData,
      newValues: null,
    }).catch((error) => console.error("Audit log creation failed:", error));

    // Invalidate cache
    await cacheDelete(createCacheKey("promo", id));
    await cacheDeletePattern("promo-list:*");
    await cacheDeletePattern("promo:eligible:*");

    return { message: "Promo deleted successfully" };
  });
};

/**
 * Get all promos with filters and pagination using raw SQL query
 */
const getAllPromos = async (filters) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    status = null,
    tipeDiskon = null,
    cabangId = null,
    kategoriId = null,
    produkId = null,
  } = filters;

  const offset = (page - 1) * limit;

  // Build WHERE conditions
  const conditions = ["p.deleted_at IS NULL"];
  const params = [];
  let paramIndex = 1;

  if (search) {
    conditions.push(`(p.nama_promo ILIKE $${paramIndex} OR p.kode_promo ILIKE $${paramIndex})`);
    params.push(`%${search}%`);
    paramIndex++;
  }

  if (status) {
    conditions.push(`p.status = $${paramIndex}`);
    params.push(status);
    paramIndex++;
  }

  if (tipeDiskon) {
    // Handle comma-separated tipeDiskon values and cast to enum
     
    const tipeValues = tipeDiskon.toUpperCase().split(',').map(t => t.trim()).filter(t => t);
    if (tipeValues.length === 1) {
      conditions.push(`p.tipe_diskon = $${paramIndex}::"tipe_diskon"`);
      params.push(tipeValues[0]);
      paramIndex++;
    } else if (tipeValues.length > 1) {
      // Use ANY for multiple values
      conditions.push(`p.tipe_diskon = ANY($${paramIndex}::"tipe_diskon"[])`);
      params.push(tipeValues);
      paramIndex++;
    }
  }

  if (cabangId) {
    conditions.push(`(p.cabang_id = $${paramIndex} OR p.cabang_id IS NULL)`);
    params.push(cabangId);
    paramIndex++;
  }

  if (kategoriId) {
    conditions.push(`p.kategori_id = $${paramIndex}`);
    params.push(kategoriId);
    paramIndex++;
  }

  if (produkId) {
    conditions.push(`p.produk_id = $${paramIndex}`);
    params.push(produkId);
    paramIndex++;
  }

  const whereClause = conditions.join(" AND ");

  console.log(whereClause);
  console.log(params);

  // Get data with JOIN to related tables
  const data = await prisma.$queryRawUnsafe(
    `
    SELECT
      p.promo_id as id,
      p.nama_promo as "namaPromo",
      p.kode_promo as "kodePromo",
      p.deskripsi,
      p.tipe_diskon as "tipeDiskon",
      p.nilai_diskon as "nilaiDiskon",
      p.buy_x_get_y_config as "buyXgetYConfig",
      p.min_pembelian as "minPembelian",
      p.max_diskon as "maxDiskon",
      p.max_penggunaan_total as "maxPenggunaanTotal",
      p.max_penggunaan_per_user as "maxPenggunaanPerUser",
      p.current_usage as "currentUsage",
      p.tanggal_mulai as "tanggalMulai",
      p.tanggal_berakhir as "tanggalBerakhir",
      p.limit_penggunaan as "limitPenggunaan",
      p.tipe_scope as "tipeScope",
      p.kategori_id as "kategoriId",
      p.produk_id as "produkId",
      p.cabang_id as "cabangId",
      p.status,
      p.created_at as "createdAt",
      p.updated_at as "updatedAt",
      c.nama_cabang as "namaCabang",
      k.nama_kategori as "namaKategori",
      pm.nama_produk as "namaProduk"
    FROM promo_diskon p
    LEFT JOIN cabang c ON p.cabang_id = c.cabang_id
    LEFT JOIN kategori k ON p.kategori_id = k.kategori_id
    LEFT JOIN produk_master pm ON p.produk_id = pm.produk_master_id
    WHERE ${whereClause}
    ORDER BY p.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `,
    ...params, limit, offset
  );

  // Get total count
  const countResult = await prisma.$queryRawUnsafe(
    `
    SELECT COUNT(*) as total
    FROM promo_diskon p
    WHERE ${whereClause}
    `,
    ...params
  );

  const total = parseInt(countResult[0].total);
  const totalPages = Math.ceil(total / limit);

  // Format decimal fields
  const formattedData = data.map((promo) => ({
    ...promo,
    nilaiDiskon: promo.nilaiDiskon ? parseFloat(promo.nilaiDiskon) : null,
    minPembelian: promo.minPembelian ? parseFloat(promo.minPembelian) : null,
    maxDiskon: promo.maxDiskon ? parseFloat(promo.maxDiskon) : null,
  }));

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

/**
 * Get promo by ID using raw SQL query
 */
const getPromoById = async (id) => {
  const cacheKey = createCacheKey("promo", id);

  return await cacheOrFetch(
    cacheKey,
    async () => {
      const result = await prisma.$queryRaw`
        SELECT
          p.promo_id as id,
          p.nama_promo as "namaPromo",
          p.kode_promo as "kodePromo",
          p.deskripsi,
          p.tipe_diskon as "tipeDiskon",
          p.nilai_diskon as "nilaiDiskon",
          p.buy_x_get_y_config as "buyXgetYConfig",
          p.min_pembelian as "minPembelian",
          p.max_diskon as "maxDiskon",
          p.max_penggunaan_total as "maxPenggunaanTotal",
          p.max_penggunaan_per_user as "maxPenggunaanPerUser",
          p.current_usage as "currentUsage",
          p.tanggal_mulai as "tanggalMulai",
          p.tanggal_berakhir as "tanggalBerakhir",
          p.limit_penggunaan as "limitPenggunaan",
          p.tipe_scope as "tipeScope",
          p.kategori_id as "kategoriId",
          p.produk_id as "produkId",
          p.cabang_id as "cabangId",
          p.status,
          p.created_at as "createdAt",
          p.updated_at as "updatedAt",
          p.created_by as "createdBy",
          c.nama_cabang as "namaCabang",
          k.nama_kategori as "namaKategori",
          pm.nama_produk as "namaProduk"
        FROM promo_diskon p
        LEFT JOIN cabang c ON p.cabang_id = c.cabang_id
        LEFT JOIN kategori k ON p.kategori_id = k.kategori_id
        LEFT JOIN produk_master pm ON p.produk_id = pm.produk_master_id
        WHERE p.promo_id = ${id}::VARCHAR
        AND p.deleted_at IS NULL
      `;

      if (!result || result.length === 0) {
        throw new ResponseError(404, "Promo tidak ditemukan");
      }

      const promo = result[0];
      return {
        ...promo,
        nilaiDiskon: promo.nilaiDiskon ? parseFloat(promo.nilaiDiskon) : null,
        minPembelian: promo.minPembelian ? parseFloat(promo.minPembelian) : null,
        maxDiskon: promo.maxDiskon ? parseFloat(promo.maxDiskon) : null,
      };
    },
    3600 // Cache for 1 hour
  );
};

/**
 * Change promo status using raw SQL query
 */
const changePromoStatus = async (id, status, context) => {
  const { userId, ipAddress, userName } = context;
  const validData = validate(changePromoStatusSchema, { status });

  return await prisma.$transaction(async (tx) => {
    // Check if promo exists
    const existingPromo = await tx.$queryRaw`
      SELECT * FROM promo_diskon
      WHERE promo_id = ${id}::VARCHAR
      AND deleted_at IS NULL
      LIMIT 1
    `;

    if (!existingPromo || existingPromo.length === 0) {
      throw new ResponseError(404, "Promo tidak ditemukan");
    }

    const oldData = existingPromo[0];

    // Update status
    const result = await tx.$executeRaw`
      UPDATE promo_diskon
      SET status = ${validData.status}::VARCHAR,
          updated_by = ${userName}::VARCHAR,
          updated_by_user_id = ${userId}::VARCHAR,
          updated_at = NOW()
      WHERE promo_id = ${id}::VARCHAR
      RETURNING *
    `;

    const promo = result[0];

    // Create audit log
    createAuditLog(tx, {
      userId,
      userName,
      ipAddress,
      cabangId: promo.cabang_id,
      action: "UPDATE",
      tableName: "promo_diskon",
      recordId: promo.promo_id,
      oldValues: { status: oldData.status },
      newValues: { status: promo.status },
    }).catch((error) => console.error("Audit log creation failed:", error));

    // Invalidate cache
    await cacheDelete(createCacheKey("promo", id));
    await cacheDeletePattern("promo-list:*");
    await cacheDeletePattern("promo:eligible:*");

    return {
      id: promo.promo_id,
      namaPromo: promo.nama_promo,
      kodePromo: promo.kode_promo,
      status: promo.status,
    };
  });
};

/**
 * Get promo usage statistics using raw SQL query
 */
const getPromoStats = async (id) => {
  const cacheKey = createCacheKey("promo", `stats:${id}`);

  return await cacheOrFetch(
    cacheKey,
    async () => {
      // Check if promo exists
      const promo = await prisma.$queryRaw`
        SELECT promo_id, nama_promo, kode_promo, status, max_penggunaan_total, current_usage
        FROM promo_diskon
        WHERE promo_id = ${id}::VARCHAR
        AND deleted_at IS NULL
        LIMIT 1
      `;

      if (!promo || promo.length === 0) {
        throw new ResponseError(404, "Promo tidak ditemukan");
      }

      // Get usage statistics from transaksi_promo
      const usageStats = await prisma.withRls(tx => tx.$queryRaw`
        SELECT
          COUNT(DISTINCT tp.transaksi_id) as total_transactions,
          COALESCE(SUM(tp.total_diskon), 0) as total_discount_given,
          COUNT(DISTINCT CASE WHEN t.pelanggan_id IS NOT NULL THEN t.pelanggan_id END) as unique_customers_used,
          COUNT(DISTINCT t.cabang_id) as branches_used
        FROM transaksi_promo tp
        LEFT JOIN transaksi t ON tp.transaksi_id = t.transaksi_id
        WHERE tp.promo_id = ${id}::VARCHAR
        AND t.deleted_at IS NULL
      `);

      // Get recent transactions using this promo
      const recentTransactions = await prisma.withRls(tx => tx.$queryRaw`
        SELECT
          t.transaksi_id,
          t.nomor_transaksi,
          t.tanggal,
          t.total,
          tp.total_diskon,
          c.nama_cabang,
          pel.nama_pelanggan
        FROM transaksi_promo tp
        LEFT JOIN transaksi t ON tp.transaksi_id = t.transaksi_id
        LEFT JOIN cabang c ON t.cabang_id = c.cabang_id
        LEFT JOIN pelanggan pel ON t.pelanggan_id = pel.pelanggan_id
        WHERE tp.promo_id = ${id}::VARCHAR
        AND t.deleted_at IS NULL
        ORDER BY t.tanggal DESC
        LIMIT 10
      `);

      const stats = usageStats[0];

      return {
        promo: {
          id: promo[0].promo_id,
          namaPromo: promo[0].nama_promo,
          kodePromo: promo[0].kode_promo,
          status: promo[0].status,
        },
        usage: {
          totalUsage: parseInt(promo[0].current_usage) || 0,
          maxUsage: promo[0].max_penggunaan_total,
          remainingUsage: promo[0].max_penggunaan_total
            ? promo[0].max_penggunaan_total - promo[0].current_usage
            : null,
          totalTransactions: parseInt(stats.total_transactions) || 0,
          totalDiscountGiven: parseFloat(stats.total_discount_given) || 0,
          uniqueCustomersUsed: parseInt(stats.unique_customers_used) || 0,
          branchesUsed: parseInt(stats.branches_used) || 0,
        },
        recentTransactions: recentTransactions.map((t) => ({
          transactionId: t.transaksi_id,
          nomorTransaksi: t.nomor_transaksi,
          tanggal: t.tanggal,
          total: parseFloat(t.total),
          discount: parseFloat(t.total_diskon),
          cabang: t.nama_cabang,
          pelanggan: t.nama_pelanggan,
        })),
      };
    },
    900 // Cache for 15 minutes
  );
};

/**
 * Get eligible products for a specific promo using raw SQL query
 */
const getEligibleProducts = async (promoId) => {
  const cacheKey = createCacheKey("promo", `eligible-products:${promoId}`);

  return await cacheOrFetch(
    cacheKey,
    async () => {
      // Get promo details
      const promo = await prisma.$queryRaw`
        SELECT promo_id, tipe_scope, kategori_id, produk_id, cabang_id
        FROM promo_diskon
        WHERE promo_id = ${promoId}::VARCHAR
        AND deleted_at IS NULL
        LIMIT 1
      `;

      if (!promo || promo.length === 0) {
        throw new ResponseError(404, "Promo tidak ditemukan");
      }

      const promoData = promo[0];

      // Get eligible products based on scope
      let products = [];

      if (promoData.tipe_scope === "GLOBAL") {
        // All products across all branches
        products = await prisma.$queryRaw`
          SELECT DISTINCT
            pm.produk_master_id as id,
            pm.nama_produk as "namaProduk",
            pm.sku,
            pm.barcode,
            k.nama_kategori as "namaKategori"
          FROM produk_master pm
          LEFT JOIN kategori k ON pm.kategori_id = k.kategori_id
          ORDER BY pm.nama_produk
        `;
      } else if (promoData.tipe_scope === "KATEGORI_SPESIFIK" && promoData.kategori_id) {
        // Products in specific category
        products = await prisma.$queryRaw`
          SELECT
            pm.produk_master_id as id,
            pm.nama_produk as "namaProduk",
            pm.sku,
            pm.barcode,
            k.nama_kategori as "namaKategori"
          FROM produk_master pm
          LEFT JOIN kategori k ON pm.kategori_id = k.kategori_id
          WHERE pm.kategori_id = ${promoData.kategori_id}::VARCHAR
          ORDER BY pm.nama_produk
        `;
      } else if (promoData.tipe_scope === "PRODUK_SPESIFIK" && promoData.produk_id) {
        // Specific product
        products = await prisma.$queryRaw`
          SELECT
            pm.produk_master_id as id,
            pm.nama_produk as "namaProduk",
            pm.sku,
            pm.barcode,
            k.nama_kategori as "namaKategori"
          FROM produk_master pm
          LEFT JOIN kategori k ON pm.kategori_id = k.kategori_id
          WHERE pm.produk_master_id = ${promoData.produk_id}::VARCHAR
          ORDER BY pm.nama_produk
        `;
      } else if (promoData.tipe_scope === "CABANG_SPESIFIK" && promoData.cabang_id) {
        // Products available in specific branch
        products = await prisma.withRls(tx => tx.$queryRaw`
          SELECT DISTINCT
            pm.produk_master_id as id,
            pm.nama_produk as "namaProduk",
            pm.sku,
            pm.barcode,
            k.nama_kategori as "namaKategori"
          FROM produk p
          INNER JOIN produk_master pm ON p.produk_master_id = pm.produk_master_id
          LEFT JOIN kategori k ON pm.kategori_id = k.kategori_id
          WHERE p.cabang_id = ${promoData.cabang_id}::VARCHAR
          ORDER BY pm.nama_produk
        `);
      }

      return {
        promoId: promoData.promo_id,
        tipeScope: promoData.tipe_scope,
        eligibleProducts: products,
        totalProducts: products.length,
      };
    },
    1800 // Cache for 30 minutes
  );
};

/**
 * Verify promo code for validation using raw SQL query
 */
const verifyPromoCode = async (data) => {
  const validData = validate(verifyPromoSchema, data);
  const { kodePromo, subtotal, cabangId, items, pelangganId, metodePembayaran } = validData;

  // Get promo by code
  const promo = await prisma.$queryRaw`
    SELECT
      p.*,
      CASE
        WHEN p.status != 'aktif' THEN 'Promo tidak aktif'
        WHEN p.tanggal_mulai IS NOT NULL AND p.tanggal_mulai > CURRENT_DATE THEN 'Promo belum dimulai'
        WHEN p.tanggal_berakhir IS NOT NULL AND p.tanggal_berakhir < CURRENT_DATE THEN 'Promo sudah kadaluarsa'
        WHEN p.min_pembelian IS NOT NULL AND ${subtotal}::NUMERIC < p.min_pembelian THEN 'Minimal pembelian tidak tercapai'
        WHEN p.max_penggunaan_total IS NOT NULL AND p.current_usage >= p.max_penggunaan_total THEN 'Kuota promo habis'
        ELSE NULL
      END as error_message
    FROM promo_diskon p
    WHERE p.kode_promo = ${kodePromo}::VARCHAR
    AND p.deleted_at IS NULL
    LIMIT 1
  `;

  if (!promo || promo.length === 0) {
    throw new ResponseError(404, "Kode promo tidak valid");
  }

  const promoData = promo[0];

  if (promoData.error_message) {
    throw new ResponseError(400, promoData.error_message);
  }

  // Check if promo is applicable to the branch
  if (promoData.tipe_scope === "CABANG_SPESIFIK" && promoData.cabang_id !== cabangId) {
    throw new ResponseError(400, "Promo tidak berlaku untuk cabang ini");
  }

  // Check per-user usage limit
  if (promoData.max_penggunaan_per_user && pelangganId) {
    const userUsage = await prisma.withRls(tx => tx.$queryRaw`
      SELECT COUNT(*) as usage_count
      FROM transaksi_promo tp
      INNER JOIN transaksi t ON tp.transaksi_id = t.transaksi_id
      WHERE tp.promo_id = ${promoData.promo_id}::VARCHAR
      AND t.pelanggan_id = ${pelangganId}::VARCHAR
    `);

    if (parseInt(userUsage[0].usage_count) >= promoData.max_penggunaan_per_user) {
      throw new ResponseError(400, "Anda telah mencapai batas penggunaan promo ini");
    }
  }

  // Calculate discount
  let discount = 0;
  const discountDetails = {};

  if (promoData.tipe_diskon === "PERSENTASE") {
    discount = subtotal * (parseFloat(promoData.nilai_diskon) / 100);
    if (promoData.max_diskon && discount > parseFloat(promoData.max_diskon)) {
      discount = parseFloat(promoData.max_diskon);
    }
    discountDetails.type = "PERSENTASE";
    discountDetails.percentage = parseFloat(promoData.nilai_diskon);
  } else if (promoData.tipe_diskon === "NOMINAL") {
    discount = parseFloat(promoData.nilai_diskon);
    if (discount > subtotal) {
      discount = subtotal;
    }
    discountDetails.type = "NOMINAL";
    discountDetails.amount = parseFloat(promoData.nilai_diskon);
  } else if (promoData.tipe_diskon === "HARGA_SPESIAL") {
    // This requires product-specific logic, simplified here
    discountDetails.type = "HARGA_SPESIAL";
    discount = 0; // Calculate based on products
  } else if (promoData.tipe_diskon === "BUY_X_GET_Y") {
    // Buy X Get Y logic
    const config = promoData.buy_x_get_y_config;
    if (config) {
      const buyQty = config.buyQty || 1;
      const getQty = config.getQty || 1;
      // Calculate free items based on cart
      const eligibleItems = items.filter(
        (item) => !config.buyProductId || item.produkId === config.buyProductId
      );
      const totalQty = eligibleItems.reduce((sum, item) => sum + item.quantity, 0);
      const freeItems = Math.floor(totalQty / buyQty) * getQty;
      discountDetails.type = "BUY_X_GET_Y";
      discountDetails.freeItems = freeItems;
    }
  }

  return {
    valid: true,
    promo: {
      id: promoData.promo_id,
      namaPromo: promoData.nama_promo,
      kodePromo: promoData.kode_promo,
      tipeDiskon: promoData.tipe_diskon,
      tipeScope: promoData.tipe_scope,
    },
    discount: parseFloat(discount.toFixed(2)),
    discountDetails,
  };
};

/**
 * Verify multiple promo codes using raw SQL query
 */
const verifyMultiplePromos = async (data) => {
  const validData = validate(verifyMultiplePromosSchema, data);
  const { promoCodes, cabangId, subtotal, items, pelangganId } = validData;

  const results = [];
  const errors = [];
  let totalDiscount = 0;

  // Verify each promo code
  for (const kodePromo of promoCodes) {
    try {
      const result = await verifyPromoCode({
        kodePromo,
        subtotal: subtotal - totalDiscount, // Apply to remaining amount
        cabangId,
        items,
        pelangganId,
      });

      if (result.valid) {
        results.push(result);
        totalDiscount += result.discount;
      }
    } catch (error) {
      errors.push({
        kodePromo,
        error: error.message,
      });
    }
  }

  return {
    applicablePromos: results,
    totalDiscount: parseFloat(totalDiscount.toFixed(2)),
    finalSubtotal: parseFloat((subtotal - totalDiscount).toFixed(2)),
    errors,
  };
};

/**
 * Calculate preview for promo application
 */
const calculatePreview = async (data) => {
  const validData = validate(calculatePreviewSchema, data);

  const result = await verifyMultiplePromos(validData);

  return {
    originalSubtotal: validData.subtotal,
    ...result,
  };
};

/**
 * Get eligible promos for a branch
 */
const getEligiblePromos = async (cabangId, cartData = {}) => {
  const cacheKey = createCacheKey("promo", `eligible:${cabangId}:${JSON.stringify(cartData)}`);

  return await cacheOrFetch(
    cacheKey,
    async () => {
      const { subtotal = 0, items = [] } = cartData;

      const promos = await prisma.$queryRaw`
        SELECT
          p.promo_id as id,
          p.nama_promo as "namaPromo",
          p.kode_promo as "kodePromo",
          p.deskripsi,
          p.tipe_diskon as "tipeDiskon",
          p.nilai_diskon as "nilaiDiskon",
          p.min_pembelian as "minPembelian",
          p.max_diskon as "maxDiskon",
          p.tanggal_mulai as "tanggalMulai",
          p.tanggal_berakhir as "tanggalBerakhir",
          p.tipe_scope as "tipeScope",
          p.status
        FROM promo_diskon p
        WHERE p.status = 'aktif'
        AND p.deleted_at IS NULL
        AND (p.cabang_id = ${cabangId}::VARCHAR OR p.cabang_id IS NULL OR p.tipe_scope = 'GLOBAL')
        AND (p.tanggal_mulai IS NULL OR p.tanggal_mulai <= CURRENT_DATE)
        AND (p.tanggal_berakhir IS NULL OR p.tanggal_berakhir >= CURRENT_DATE)
        AND (p.min_pembelian IS NULL OR p.min_pembelial <= ${subtotal}::NUMERIC)
        AND (p.max_penggunaan_total IS NULL OR p.current_usage < p.max_penggunaan_total)
        ORDER BY p.created_at DESC
      `;

      return {
        cabangId,
        eligiblePromos: promos.map((p) => ({
          ...p,
          nilaiDiskon: parseFloat(p.nilaiDiskon),
          minPembelian: p.minPembelian ? parseFloat(p.minPembelian) : null,
          maxDiskon: p.maxDiskon ? parseFloat(p.maxDiskon) : null,
        })),
        totalPromos: promos.length,
      };
    },
    300 // Cache for 5 minutes
  );
};

module.exports = {
  createPromo,
  updatePromo,
  deletePromo,
  getAllPromos,
  getPromoById,
  changePromoStatus,
  getPromoStats,
  getEligibleProducts,
  verifyPromoCode,
  verifyMultiplePromos,
  calculatePreview,
  getEligiblePromos,
};
