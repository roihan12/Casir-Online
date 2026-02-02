const prisma = require("../config/db");
const { ResponseError } = require("../error/responseError");

/**
 * Get all discount configs with optional cabang filter
 */
const getAllDiscountConfigs = async (cabangId = null) => {
  let query = `
    SELECT 
      dc.discount_config_id as id,
      dc.cabang_id as "cabangId",
      dc.enable_member_discount as "enableMemberDiscount",
      dc.member_discount_type as "memberDiscountType",
      dc.discount_segmen as "discountSegmen",
      dc.max_manual_discount_persen as "maxManualDiscountPersen",
      dc.max_manual_discount_nominal as "maxManualDiscountNominal",
      dc.min_transaction_for_discount as "minTransactionForDiscount",
      dc.allow_combine_with_promo as "allowCombineWithPromo",
      dc.is_active as "isActive",
      dc.created_at as "createdAt",
      dc.updated_at as "updatedAt",
      c.nama_cabang as "namaCabang"
    FROM discount_config dc
    LEFT JOIN cabang c ON dc.cabang_id = c.cabang_id
  `;

  let result;
  if (cabangId) {
    query += ` WHERE dc.cabang_id = $1 OR dc.cabang_id IS NULL ORDER BY dc.cabang_id NULLS FIRST`;
    result = await prisma.$queryRawUnsafe(query, cabangId);
  } else {
    query += ` ORDER BY dc.cabang_id NULLS FIRST`;
    result = await prisma.$queryRawUnsafe(query);
  }

  return result.map(config => ({
    ...config,
    maxManualDiscountPersen: config.maxManualDiscountPersen ? parseFloat(config.maxManualDiscountPersen) : null,
    maxManualDiscountNominal: config.maxManualDiscountNominal ? parseFloat(config.maxManualDiscountNominal) : null,
    minTransactionForDiscount: config.minTransactionForDiscount ? parseFloat(config.minTransactionForDiscount) : null,
  }));
};

/**
 * Get discount config by ID
 */
const getDiscountConfigById = async (id) => {
  const result = await prisma.$queryRaw`
    SELECT 
      dc.discount_config_id as id,
      dc.cabang_id as "cabangId",
      dc.enable_member_discount as "enableMemberDiscount",
      dc.member_discount_type as "memberDiscountType",
      dc.discount_segmen as "discountSegmen",
      dc.max_manual_discount_persen as "maxManualDiscountPersen",
      dc.max_manual_discount_nominal as "maxManualDiscountNominal",
      dc.min_transaction_for_discount as "minTransactionForDiscount",
      dc.allow_combine_with_promo as "allowCombineWithPromo",
      dc.is_active as "isActive",
      dc.created_at as "createdAt",
      dc.updated_at as "updatedAt",
      c.nama_cabang as "namaCabang"
    FROM discount_config dc
    LEFT JOIN cabang c ON dc.cabang_id = c.cabang_id
    WHERE dc.discount_config_id = ${id}::VARCHAR
    LIMIT 1
  `;

  if (!result || result.length === 0) {
    throw new ResponseError(404, "Discount config tidak ditemukan");
  }

  const config = result[0];
  return {
    ...config,
    maxManualDiscountPersen: config.maxManualDiscountPersen ? parseFloat(config.maxManualDiscountPersen) : null,
    maxManualDiscountNominal: config.maxManualDiscountNominal ? parseFloat(config.maxManualDiscountNominal) : null,
    minTransactionForDiscount: config.minTransactionForDiscount ? parseFloat(config.minTransactionForDiscount) : null,
  };
};

/**
 * Create new discount config
 */
const createDiscountConfig = async (data) => {
  const {
    cabangId = null,
    enableMemberDiscount = true,
    memberDiscountType = 'PERCENTAGE',
    discountSegmen = { vip: 10, grosir: 5, member: 3, retail: 0 },
    maxManualDiscountPersen = 50,
    maxManualDiscountNominal = 500000,
    minTransactionForDiscount = 100000,
    allowCombineWithPromo = false,
    isActive = true,
  } = data;

  // Check if config already exists for this cabang
  const existingCheck = cabangId
    ? await prisma.$queryRaw`
        SELECT discount_config_id FROM discount_config 
        WHERE cabang_id = ${cabangId}::VARCHAR
        LIMIT 1
      `
    : await prisma.$queryRaw`
        SELECT discount_config_id FROM discount_config 
        WHERE cabang_id IS NULL
        LIMIT 1
      `;

  if (existingCheck && existingCheck.length > 0) {
    throw new ResponseError(400, cabangId 
      ? "Discount config untuk cabang ini sudah ada" 
      : "Discount config global sudah ada"
    );
  }

  const discountSegmenJson = JSON.stringify(discountSegmen);

  const result = await prisma.$queryRaw`
    INSERT INTO discount_config (
      cabang_id,
      enable_member_discount,
      member_discount_type,
      discount_segmen,
      max_manual_discount_persen,
      max_manual_discount_nominal,
      min_transaction_for_discount,
      allow_combine_with_promo,
      is_active
    ) VALUES (
      ${cabangId}::VARCHAR,
      ${enableMemberDiscount}::BOOLEAN,
      ${memberDiscountType}::VARCHAR,
      ${discountSegmenJson}::JSONB,
      ${maxManualDiscountPersen}::NUMERIC(15,2),
      ${maxManualDiscountNominal}::NUMERIC(15,2),
      ${minTransactionForDiscount}::NUMERIC(15,2),
      ${allowCombineWithPromo}::BOOLEAN,
      ${isActive}::BOOLEAN
    )
    RETURNING 
      discount_config_id as id,
      cabang_id as "cabangId",
      enable_member_discount as "enableMemberDiscount",
      member_discount_type as "memberDiscountType",
      discount_segmen as "discountSegmen",
      max_manual_discount_persen as "maxManualDiscountPersen",
      max_manual_discount_nominal as "maxManualDiscountNominal",
      min_transaction_for_discount as "minTransactionForDiscount",
      allow_combine_with_promo as "allowCombineWithPromo",
      is_active as "isActive",
      created_at as "createdAt"
  `;

  const config = result[0];
  return {
    ...config,
    maxManualDiscountPersen: config.maxManualDiscountPersen ? parseFloat(config.maxManualDiscountPersen) : null,
    maxManualDiscountNominal: config.maxManualDiscountNominal ? parseFloat(config.maxManualDiscountNominal) : null,
    minTransactionForDiscount: config.minTransactionForDiscount ? parseFloat(config.minTransactionForDiscount) : null,
  };
};

/**
 * Update discount config
 */
const updateDiscountConfig = async (id, data) => {
  // Check if exists
  const existing = await prisma.$queryRaw`
    SELECT discount_config_id FROM discount_config 
    WHERE discount_config_id = ${id}::VARCHAR
    LIMIT 1
  `;

  if (!existing || existing.length === 0) {
    throw new ResponseError(404, "Discount config tidak ditemukan");
  }

  const {
    enableMemberDiscount,
    memberDiscountType,
    discountSegmen,
    maxManualDiscountPersen,
    maxManualDiscountNominal,
    minTransactionForDiscount,
    allowCombineWithPromo,
    isActive,
  } = data;

  // Build update fields dynamically
  const updateFields = [];
  const params = [];
  let paramIndex = 1;

  if (enableMemberDiscount !== undefined) {
    updateFields.push(`enable_member_discount = $${paramIndex}::BOOLEAN`);
    params.push(enableMemberDiscount);
    paramIndex++;
  }
  if (memberDiscountType !== undefined) {
    updateFields.push(`member_discount_type = $${paramIndex}::VARCHAR`);
    params.push(memberDiscountType);
    paramIndex++;
  }
  if (discountSegmen !== undefined) {
    updateFields.push(`discount_segmen = $${paramIndex}::JSONB`);
    params.push(JSON.stringify(discountSegmen));
    paramIndex++;
  }
  if (maxManualDiscountPersen !== undefined) {
    updateFields.push(`max_manual_discount_persen = $${paramIndex}::NUMERIC(15,2)`);
    params.push(maxManualDiscountPersen);
    paramIndex++;
  }
  if (maxManualDiscountNominal !== undefined) {
    updateFields.push(`max_manual_discount_nominal = $${paramIndex}::NUMERIC(15,2)`);
    params.push(maxManualDiscountNominal);
    paramIndex++;
  }
  if (minTransactionForDiscount !== undefined) {
    updateFields.push(`min_transaction_for_discount = $${paramIndex}::NUMERIC(15,2)`);
    params.push(minTransactionForDiscount);
    paramIndex++;
  }
  if (allowCombineWithPromo !== undefined) {
    updateFields.push(`allow_combine_with_promo = $${paramIndex}::BOOLEAN`);
    params.push(allowCombineWithPromo);
    paramIndex++;
  }
  if (isActive !== undefined) {
    updateFields.push(`is_active = $${paramIndex}::BOOLEAN`);
    params.push(isActive);
    paramIndex++;
  }

  // Always update updated_at
  updateFields.push(`updated_at = NOW()`);

  if (updateFields.length === 1) {
    // Only updated_at, no actual changes
    return await getDiscountConfigById(id);
  }

  params.push(id);

  const query = `
    UPDATE discount_config 
    SET ${updateFields.join(", ")}
    WHERE discount_config_id = $${paramIndex}::VARCHAR
    RETURNING 
      discount_config_id as id,
      cabang_id as "cabangId",
      enable_member_discount as "enableMemberDiscount",
      member_discount_type as "memberDiscountType",
      discount_segmen as "discountSegmen",
      max_manual_discount_persen as "maxManualDiscountPersen",
      max_manual_discount_nominal as "maxManualDiscountNominal",
      min_transaction_for_discount as "minTransactionForDiscount",
      allow_combine_with_promo as "allowCombineWithPromo",
      is_active as "isActive",
      updated_at as "updatedAt"
  `;

  const result = await prisma.$queryRawUnsafe(query, ...params);

  const config = result[0];
  return {
    ...config,
    maxManualDiscountPersen: config.maxManualDiscountPersen ? parseFloat(config.maxManualDiscountPersen) : null,
    maxManualDiscountNominal: config.maxManualDiscountNominal ? parseFloat(config.maxManualDiscountNominal) : null,
    minTransactionForDiscount: config.minTransactionForDiscount ? parseFloat(config.minTransactionForDiscount) : null,
  };
};

/**
 * Delete discount config
 */
const deleteDiscountConfig = async (id) => {
  // Check if exists
  const existing = await prisma.$queryRaw`
    SELECT discount_config_id, cabang_id FROM discount_config 
    WHERE discount_config_id = ${id}::VARCHAR
    LIMIT 1
  `;

  if (!existing || existing.length === 0) {
    throw new ResponseError(404, "Discount config tidak ditemukan");
  }

  // Prevent deleting global config
  if (existing[0].cabang_id === null) {
    throw new ResponseError(400, "Tidak dapat menghapus konfigurasi global. Gunakan update untuk menonaktifkan.");
  }

  await prisma.$executeRaw`
    DELETE FROM discount_config 
    WHERE discount_config_id = ${id}::VARCHAR
  `;

  return { message: "Discount config berhasil dihapus" };
};

/**
 * Get active config for a cabang (or global if no cabang-specific)
 */
const getActiveConfigForCabang = async (cabangId) => {
  const result = await prisma.$queryRaw`
    SELECT 
      dc.discount_config_id as id,
      dc.cabang_id as "cabangId",
      dc.enable_member_discount as "enableMemberDiscount",
      dc.member_discount_type as "memberDiscountType",
      dc.discount_segmen as "discountSegmen",
      dc.max_manual_discount_persen as "maxManualDiscountPersen",
      dc.max_manual_discount_nominal as "maxManualDiscountNominal",
      dc.min_transaction_for_discount as "minTransactionForDiscount",
      dc.allow_combine_with_promo as "allowCombineWithPromo",
      dc.is_active as "isActive"
    FROM discount_config dc
    WHERE (dc.cabang_id = ${cabangId}::VARCHAR OR dc.cabang_id IS NULL)
    AND dc.is_active = TRUE
    ORDER BY dc.cabang_id NULLS LAST
    LIMIT 1
  `;

  if (!result || result.length === 0) {
    return null;
  }

  const config = result[0];
  return {
    ...config,
    maxManualDiscountPersen: config.maxManualDiscountPersen ? parseFloat(config.maxManualDiscountPersen) : null,
    maxManualDiscountNominal: config.maxManualDiscountNominal ? parseFloat(config.maxManualDiscountNominal) : null,
    minTransactionForDiscount: config.minTransactionForDiscount ? parseFloat(config.minTransactionForDiscount) : null,
  };
};

module.exports = {
  getAllDiscountConfigs,
  getDiscountConfigById,
  createDiscountConfig,
  updateDiscountConfig,
  deleteDiscountConfig,
  getActiveConfigForCabang,
};
