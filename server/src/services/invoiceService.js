const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { logger } = require("../utils/logger");
const { createAuditLog } = require("../utils/auditLog");

/**
 * Invoice Service
 * Handles all invoice-related business logic using raw SQL queries
 */

/**
 * Get list of invoices with pagination and filters
 */
const getInvoiceList = async (filters = {}) => {
  const {
    page = 1,
    limit = 10,
    startDate,
    endDate,
    cabangId,
    status,
    search,
  } = filters;

  const offset = (parseInt(page) - 1) * parseInt(limit);

  // Build WHERE conditions
  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (startDate && endDate) {
    conditions.push(`i.tanggal_invoice >= $${paramIndex} AND i.tanggal_invoice <= $${paramIndex + 1}`);
    params.push(new Date(startDate), new Date(endDate));
    paramIndex += 2;
  }

  if (cabangId) {
    conditions.push(`i.cabang_id = $${paramIndex}`);
    params.push(cabangId);
    paramIndex++;
  }

  if (status) {
    conditions.push(`i.status = $${paramIndex}`);
    params.push(status);
    paramIndex++;
  }

  if (search) {
    conditions.push(`(
      i.nomor_invoice ILIKE $${paramIndex} OR
      t.nomor_transaksi ILIKE $${paramIndex} OR
      p.nama_pelanggan ILIKE $${paramIndex}
    )`);
    params.push(`%${search}%`);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM invoice i
      LEFT JOIN transaksi t ON i.transaksi_id = t.transaksi_id
      LEFT JOIN pelanggan p ON i.pelanggan_id = p.pelanggan_id
      ${whereClause}
    `;

    const countResult = await prisma.$queryRawUnsafe(countQuery, ...params);
    const total = parseInt(countResult[0].total);

    // Get invoices with pagination
    const selectQuery = `
      SELECT
        i.id,
        i.nomor_invoice as "nomorInvoice",
        i.tanggal_invoice as "tanggalInvoice",
        i.tanggal_jatuh_tempo as "tanggalJatuhTempo",
        i.total,
        i.status,
        i.catatan,
        i.created_at as "createdAt",
        i.updated_at as "updatedAt",
        t.nomor_transaksi as "nomorTransaksi",
        t.jenis_transaksi as "jenisTransaksi",
        t.tanggal,
        t.status_pembayaran as "statusPembayaran",
        c.nama_cabang as "namaCabang",
        p.nama_pelanggan as "namaPelanggan",
        p.telepon,
        p.email
      FROM invoice i
      LEFT JOIN transaksi t ON i.transaksi_id = t.transaksi_id
      LEFT JOIN cabang c ON i.cabang_id = c.cabang_id
      LEFT JOIN pelanggan p ON i.pelanggan_id = p.pelanggan_id
      ${whereClause}
      ORDER BY i.tanggal_invoice DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(parseInt(limit), offset);
    const invoices = await prisma.$queryRawUnsafe(selectQuery, ...params);

    return {
      data: invoices,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  } catch (error) {
    logger.error("Error in getInvoiceList service:", error);
    throw error;
  }
};

/**
 * Get invoice by ID
 */
const getInvoiceById = async (id) => {
  try {
    const query = `
      SELECT
        i.*,
        json_build_object(
          'nomorTransaksi', t.nomor_transaksi,
          'jenisTransaksi', t.jenis_transaksi,
          'tanggal', t.tanggal,
          'subtotal', t.subtotal,
          'diskon', t.diskon,
          'pajak', t.pajak,
          'biayaTambahan', t.biaya_tambahan,
          'total', t.total,
          'statusPembayaran', t.status_pembayaran,
          'keterangan', t.keterangan
        ) as transaksi,
        json_build_object(
          'id', c.cabang_id,
          'namaCabang', c.nama_cabang,
          'alamat', c.alamat,
          'telepon', c.telepon
        ) as cabang,
        json_build_object(
          'id', p.pelanggan_id,
          'namaPelanggan', p.nama_pelanggan,
          'alamat', p.alamat,
          'telepon', p.telepon,
          'email', p.email
        ) as pelanggan
      FROM invoice i
      LEFT JOIN transaksi t ON i.transaksi_id = t.transaksi_id
      LEFT JOIN cabang c ON i.cabang_id = c.cabang_id
      LEFT JOIN pelanggan p ON i.pelanggan_id = p.pelanggan_id
      WHERE i.id = $1
    `;

    const result = await prisma.$queryRawUnsafe(query, id);

    if (!result || result.length === 0) {
      return null;
    }

    return result[0];
  } catch (error) {
    logger.error("Error in getInvoiceById service:", error);
    throw error;
  }
};

/**
 * Get invoice with transaction details
 */
const getInvoiceWithDetails = async (id) => {
  try {
    // Get invoice basic info
    const invoiceQuery = `
      SELECT
        i.*,
        json_build_object(
          'transaksi_id', t.transaksi_id,
          'nomorTransaksi', t.nomor_transaksi,
          'jenisTransaksi', t.jenis_transaksi,
          'tanggal', t.tanggal,
          'subtotal', t.subtotal,
          'diskon', t.diskon,
          'pajak', t.pajak,
          'biayaTambahan', t.biaya_tambahan,
          'total', t.total,
          'statusPembayaran', t.status_pembayaran,
          'keterangan', t.keterangan
        ) as transaksi,
        json_build_object(
          'id', c.cabang_id,
          'namaCabang', c.nama_cabang,
          'alamat', c.alamat,
          'telepon', c.telepon
        ) as cabang,
        json_build_object(
          'id', p.pelanggan_id,
          'namaPelanggan', p.nama_pelanggan,
          'alamat', p.alamat,
          'telepon', p.telepon,
          'email', p.email
        ) as pelanggan
      FROM invoice i
      LEFT JOIN transaksi t ON i.transaksi_id = t.transaksi_id
      LEFT JOIN cabang c ON i.cabang_id = c.cabang_id
      LEFT JOIN pelanggan p ON i.pelanggan_id = p.pelanggan_id
      WHERE i.id = $1::uuid
    `;

    const invoiceResult = await prisma.$queryRawUnsafe(invoiceQuery, id);

    if (!invoiceResult || invoiceResult.length === 0) {
      return null;
    }

    const invoice = invoiceResult[0];

    // Get transaction details
    const detailsQuery = `
      SELECT
        td.transaksi_detail_id as "transaksiDetailId",
        td.jumlah,
        td.harga_satuan as "hargaSatuan",
        td.diskon_nominal as "diskonNominal",
        td.subtotal,
        pm.nama_produk as "namaProduk",
        pm.sku,
        k.nama_kategori as "namaKategori"
      FROM transaksi_detail td
      JOIN produk pr ON td.produk_id = pr.produk_id
      JOIN produk_master pm ON pr.produk_master_id = pm.produk_master_id
      JOIN kategori k ON pm.kategori_id = k.kategori_id
      WHERE td.transaksi_id = $1
    `;

    const items = await prisma.$queryRawUnsafe(detailsQuery, invoice.transaksi_id);

    // Get payments
    const paymentsQuery = `
      SELECT
        pembayaran_id as "pembayaranId",
        metode_pembayaran as "metodePembayaran",
        provider,
        jumlah_bayar as "jumlahBayar",
        jumlah_kembali as "jumlahKembali",
        nomor_referensi as "nomorReferensi",
        status
      FROM pembayaran
      WHERE transaksi_id = $1 AND status = 'SUKSES'
    `;

    const payments = await prisma.$queryRawUnsafe(paymentsQuery, invoice.transaksi_id);

    return {
      ...invoice,
      items,
      payments,
    };
  } catch (error) {
    logger.error("Error in getInvoiceWithDetails service:", error);
    throw error;
  }
};

/**
 * Get transaction by ID for invoice creation
 */
const getTransactionById = async (transaksiId) => {
  try {
    const query = `
      SELECT
        t.transaksi_id,
        t.nomor_transaksi as "nomorTransaksi",
        t.cabang_id as "cabangId",
        t.pelanggan_id as "pelangganId",
        t.total,
        t.status_pembayaran as "statusPembayaran",
        c.cabang_id as "cabangId",
        c.nama_cabang as "namaCabang",
        p.pelanggan_id as "pelangganId",
        p.nama_pelanggan as "namaPelanggan",
        p.alamat,
        p.telepon,
        p.email
      FROM transaksi t
      LEFT JOIN cabang c ON t.cabang_id = c.cabang_id
      LEFT JOIN pelanggan p ON t.pelanggan_id = p.pelanggan_id
      WHERE t.transaksi_id = $1::varchar
    `;

    const result = await prisma.$queryRawUnsafe(query, transaksiId);

    if (!result || result.length === 0) {
      return null;
    }

    return result[0];
  } catch (error) {
    logger.error("Error in getTransactionById service:", error);
    throw error;
  }
};

/**
 * Check if invoice exists for transaction
 */
const checkExistingInvoice = async (transaksiId) => {
  try {
    const query = `
      SELECT id
      FROM invoice
      WHERE transaksi_id = $1::varchar
      LIMIT 1
    `;

    const result = await prisma.$queryRawUnsafe(query, transaksiId);
    return result && result.length > 0 ? result[0] : null;
  } catch (error) {
    logger.error("Error in checkExistingInvoice service:", error);
    throw error;
  }
};

/**
 * Generate invoice number
 */
const generateInvoiceNumber = async () => {
  try {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");

    // Get count of invoices for today
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const countQuery = `
      SELECT COUNT(*) as count
      FROM invoice
      WHERE tanggal_invoice >= $1 AND tanggal_invoice <= $2
    `;

    const countResult = await prisma.$queryRawUnsafe(countQuery, startOfDay, endOfDay);
    const sequence = (parseInt(countResult[0].count) + 1).toString().padStart(3, "0");

    return `INV-${year}${month}${day}-${sequence}`;
  } catch (error) {
    logger.error("Error in generateInvoiceNumber service:", error);
    throw error;
  }
};

/**
 * Create new invoice with audit log
 */
const createInvoice = async (data, userInfo = {}) => {
  const { transaksiId, tanggalJatuhTempo, catatan } = data;
  const { userId, userName, ipAddress, cabangId } = userInfo;

  try {
    // Use transaction for both create invoice and audit log
    const result = await prisma.$transaction(async (tx) => {
      // Check if transaction exists
      const transaksi = await tx.$queryRaw`
        SELECT
          t.transaksi_id,
          t.cabang_id,
          t.pelanggan_id,
          t.total,
          t.status_pembayaran
        FROM transaksi t
        WHERE t.transaksi_id = ${transaksiId}
      `;

      if (!transaksi || transaksi.length === 0) {
        throw new Error("Transaksi tidak ditemukan");
      }

      // Check if invoice already exists
      const existingInvoice = await tx.$queryRaw`
        SELECT id
        FROM invoice
        WHERE transaksi_id = ${transaksiId}
        LIMIT 1
      `;

      if (existingInvoice && existingInvoice.length > 0) {
        throw new Error("Invoice untuk transaksi ini sudah ada");
      }

      // Generate invoice number
      const nomorInvoice = await generateInvoiceNumber();

      // Determine status based on payment status
      const status = transaksi[0].status_pembayaran === "LUNAS" ? "LUNAS" : "BELUM_LUNAS";

      // Create invoice using raw SQL
      const insertResult = await tx.$queryRaw`
        INSERT INTO invoice (
          nomor_invoice,
          tanggal_invoice,
          tanggal_jatuh_tempo,
          total,
          status,
          catatan,
          transaksi_id,
          cabang_id,
          pelanggan_id
        ) VALUES (
          ${nomorInvoice},
          NOW(),
          ${tanggalJatuhTempo ? new Date(tanggalJatuhTempo) : null},
          ${transaksi[0].total},
          ${status},
          ${catatan || null},
          ${transaksiId},
          ${transaksi[0].cabang_id},
          ${transaksi[0].pelanggan_id || null}
        )
        RETURNING *
      `;

      const newInvoice = insertResult[0];

      // Create audit log
      await createAuditLog(tx, {
        userId,
        userName,
        ipAddress,
        cabangId: transaksi[0].cabang_id,
        action: "CREATE",
        tableName: "invoice",
        recordId: newInvoice.id,
        newValues: {
          nomor_invoice: newInvoice.nomor_invoice,
          transaksi_id: newInvoice.transaksi_id,
          total: newInvoice.total,
          status: newInvoice.status,
        },
      });

      return newInvoice;
    });

    logger.info("Invoice created successfully", {
      invoiceId: result.id,
      nomorInvoice: result.nomor_invoice,
      transaksiId,
      userId,
    });

    return result;
  } catch (error) {
    logger.error("Error in createInvoice service:", error);
    throw error;
  }
};

/**
 * Update invoice with audit log
 */
const updateInvoice = async (id, data, userInfo = {}) => {
  const { tanggalJatuhTempo, status, catatan } = data;
  const { userId, userName, ipAddress } = userInfo;

  try {
    // Use transaction for both update and audit log
    const result = await prisma.$transaction(async (tx) => {
      // Get current invoice data for audit log
      const currentInvoice = await tx.$queryRaw`
        SELECT *
        FROM invoice
        WHERE id = ${id}::uuid
      `;

      if (!currentInvoice || currentInvoice.length === 0) {
        throw new Error("Invoice tidak ditemukan");
      }

      // Build update query dynamically
      const updates = [];
      const values = [];
      let paramIndex = 1;

      if (tanggalJatuhTempo !== undefined) {
        updates.push(`tanggal_jatuh_tempo = $${paramIndex}`);
        values.push(new Date(tanggalJatuhTempo));
        paramIndex++;
      }

      if (status !== undefined) {
        updates.push(`status = $${paramIndex}`);
        values.push(status);
        paramIndex++;
      }

      if (catatan !== undefined) {
        updates.push(`catatan = $${paramIndex}`);
        values.push(catatan);
        paramIndex++;
      }

      if (updates.length === 0) {
        throw new Error("No fields to update");
      }

      updates.push(`updated_at = NOW()`);

      const updateQuery = `
        UPDATE invoice
        SET ${updates.join(", ")}
        WHERE id = $${paramIndex}::uuid
        RETURNING *
      `;

      values.push(id);

      const updateResult = await tx.$queryRawUnsafe(updateQuery, ...values);
      const updatedInvoice = updateResult[0];

      // Create audit log
      await createAuditLog(tx, {
        userId,
        userName,
        ipAddress,
        cabangId: currentInvoice[0].cabang_id,
        action: "UPDATE",
        tableName: "invoice",
        recordId: id,
        oldValues: {
          nomor_invoice: currentInvoice[0].nomor_invoice,
          tanggal_jatuh_tempo: currentInvoice[0].tanggal_jatuh_tempo,
          status: currentInvoice[0].status,
          catatan: currentInvoice[0].catatan,
        },
        newValues: {
          nomor_invoice: updatedInvoice.nomor_invoice,
          tanggal_jatuh_tempo: updatedInvoice.tanggal_jatuh_tempo,
          status: updatedInvoice.status,
          catatan: updatedInvoice.catatan,
        },
      });

      return updatedInvoice;
    });

    logger.info("Invoice updated successfully", {
      invoiceId: id,
      userId,
    });

    return result;
  } catch (error) {
    logger.error("Error in updateInvoice service:", error);
    throw error;
  }
};

/**
 * Delete invoice with audit log
 */
const deleteInvoice = async (id, userInfo = {}) => {
  const { userId, userName, ipAddress } = userInfo;

  try {
    // Use transaction for both delete and audit log
    const result = await prisma.$transaction(async (tx) => {
      // Get invoice data before deletion for audit log
      const currentInvoice = await tx.$queryRaw`
        SELECT *
        FROM invoice
        WHERE id = ${id}::uuid
      `;

      if (!currentInvoice || currentInvoice.length === 0) {
        throw new Error("Invoice tidak ditemukan");
      }

      // Delete invoice
      await tx.$queryRaw`
        DELETE FROM invoice WHERE id = ${id}::uuid
      `;

      // Create audit log
      await createAuditLog(tx, {
        userId,
        userName,
        ipAddress,
        cabangId: currentInvoice[0].cabang_id,
        action: "DELETE",
        tableName: "invoice",
        recordId: id,
        oldValues: {
          nomor_invoice: currentInvoice[0].nomor_invoice,
          transaksi_id: currentInvoice[0].transaksi_id,
          total: currentInvoice[0].total,
          status: currentInvoice[0].status,
        },
      });

      return { id };
    });

    logger.info("Invoice deleted successfully", {
      invoiceId: id,
      userId,
    });

    return result;
  } catch (error) {
    logger.error("Error in deleteInvoice service:", error);
    throw error;
  }
};

module.exports = {
  getInvoiceList,
  getInvoiceById,
  getInvoiceWithDetails,
  createInvoice,
  updateInvoice,
  deleteInvoice,
};
