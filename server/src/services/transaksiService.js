const prisma = require("../config/db");
const { ResponseError } = require("../error/responseError");
// const { generateTransaksiNumber } = require("../utils/numberGenerator");
const qrisService = require("./qrisService");
// const taxService = require("./taxService");
const loyaltyService = require("./loyaltyService");
const {
  cacheSet,
  cacheGet,
  cacheDelete,
  createCacheKey,
  cacheOrFetch,
  cacheDeletePattern,
} = require("../utils/redisUtils");
const receiptService = require("./receiptService");

// Service untuk transaksi
const createTransaksi = async (data, auditInfo) => {
  try {
    // Validasi dasar
    if (!data.cabang_id) {
      throw new ResponseError(400, "Cabang ID harus diisi");
    }

    if (!data.jenis_transaksi) {
      throw new ResponseError(400, "Jenis transaksi harus diisi");
    }

    if (!data.tanggal) {
      data.tanggal = new Date();
    }

    if (
      !data.details ||
      !Array.isArray(data.details) ||
      data.details.length === 0
    ) {
      throw new ResponseError(
        400,
        "Detail transaksi harus berisi minimal satu produk"
      );
    }

    // Panggil stored procedure PostgreSQL
    const result = await prisma.$queryRaw`
      SELECT create_transaksi(
        ${data.cabang_id}::VARCHAR, 
        ${data.jenis_transaksi}::VARCHAR, 
        ${data.tanggal}::TIMESTAMP,
        ${data.pelanggan_id || null}::VARCHAR, 
        ${data.supplier_id || null}::VARCHAR, 
        ${data.shift_id || null}::VARCHAR,
        ${data.promo_id || null}::VARCHAR, 
        ${JSON.stringify(data.details)}::JSONB,
        ${data.biaya_tambahan || 0}::DECIMAL, 
        ${data.keterangan || null}::TEXT,
        ${
          data.customer_info ? JSON.stringify(data.customer_info) : null
        }::JSONB,
        ${auditInfo.userId}::VARCHAR, 
        ${auditInfo.ipAddress}::VARCHAR,
        ${auditInfo.userName}::VARCHAR,
        ${data.metode_pembayaran}::VARCHAR
      )
    `;

    const transactionId = result[0].create_transaksi;

    // Ambil data transaksi lengkap
    const completeTransaction = await prisma.transaksi.findUnique({
      where: { transaksi_id: transactionId },
      include: {
        transaksi_detail: {
          include: {
            produk: {
              include: {
                produkMaster: true,
              },
            },
          },
        },
        pelanggan: true,
        supplier: true,
        cabang: true,
        shift: true,
        promo: true,
      },
    });

    // Tambahkan customer info jika ada
    if (data.customer_info && !completeTransaction.pelanggan_id) {
      completeTransaction.guest_customer = data.customer_info;
    }

    // Update cache
    const cacheKey = createCacheKey("transaksi", completeTransaction.transaksi_id);
    await cacheSet(cacheKey, completeTransaction, 1000);

    // Invalidasi cache related
    await invalidateRelatedCache(completeTransaction);

    await invalidateTransaksiCache(completeTransaction.transaksi_id);

    return completeTransaction;
  } catch (error) {
    // PostgreSQL mengembalikan error dengan format tertentu, extract pesan error
    let errorMessage = error.message;
    const match = errorMessage.match(/ERROR:\s+(.+)/);
    if (match) {
      errorMessage = match[1];
    }

    throw new ResponseError(400, errorMessage);
  }
};

// Service untuk transaksi dengan promo codes
const createTransaksiWithPromo = async (data, auditInfo) => {
  try {
    // Validasi dasar
    if (!data.cabang_id) {
      throw new ResponseError(400, "Cabang ID harus diisi");
    }

    if (!data.jenis_transaksi) {
      throw new ResponseError(400, "Jenis transaksi harus diisi");
    }

    if (!data.tanggal) {
      data.tanggal = new Date();
    }

    if (
      !data.details ||
      !Array.isArray(data.details) ||
      data.details.length === 0
    ) {
      throw new ResponseError(
        400,
        "Detail transaksi harus berisi minimal satu produk"
      );
    }

    // Validate promo_codes if provided
    if (data.promo_codes && !Array.isArray(data.promo_codes)) {
      throw new ResponseError(400, "Promo codes harus berupa array");
    }

    // Panggil stored procedure PostgreSQL dengan promo codes dan manual discount
    const result = await prisma.$queryRaw`
      SELECT create_transaksi_with_promo_and_discount(
        ${data.cabang_id}::VARCHAR,
        ${data.jenis_transaksi}::VARCHAR,
        ${data.tanggal}::TIMESTAMP,
        ${data.pelanggan_id || null}::VARCHAR,
        ${data.supplier_id || null}::VARCHAR,
        ${data.shift_id || null}::VARCHAR,
        ${JSON.stringify(data.details)}::JSONB,
        ${data.biaya_tambahan || 0}::FLOAT8,
        ${data.keterangan || null}::TEXT,
        ${
          data.customer_info ? JSON.stringify(data.customer_info) : null
        }::JSONB,
        ${auditInfo.userId}::VARCHAR,
        ${auditInfo.ipAddress}::VARCHAR,
        ${auditInfo.userName}::VARCHAR,
        ${data.promo_codes || null}::VARCHAR[],
        ${data.metode_pembayaran || null}::VARCHAR,
        ${data.tenor || null}::INTEGER,
        ${data.uang_muka || 0}::NUMERIC,
        ${data.manual_discount_persen || null}::NUMERIC,
        ${data.manual_discount_nominal || 0}::NUMERIC,
        ${data.manual_discount_alasan || null}::VARCHAR,
        ${data.loyalty_reward_id || null}::VARCHAR,
        ${data.loyalty_discount || 0}::NUMERIC,
        ${data.points_redeemed || 0}::INTEGER
      )
    `;

    const transactionResult = result[0].create_transaksi_with_promo_and_discount;

    // Ambil data transaksi lengkap dengan query raw
    const transactions = await prisma.$queryRaw`
      SELECT
        t.*,
        jsonb_agg(
          jsonb_build_object(
            'transaksi_detail_id', td.transaksi_detail_id,
            'transaksi_id', td.transaksi_id,
            'produk_id', td.produk_id,
            'jumlah', td.jumlah,
            'harga_satuan', td.harga_satuan,
            'total', td.total,
            'diskon', td.diskon_nominal,
            'created_at', td.created_at,
            'updated_at', td.updated_at,
            'produk', jsonb_build_object(
              'id', p.produk_id,
              'produk_master_id', p.produk_master_id,
              'cabang_id', p.cabang_id,
              'stok', p.stok,
              'harga_jual', p.harga_jual,
              'harga_grosir', p.harga_grosir,
              'produkMaster', jsonb_build_object(
                'id', pm.produk_master_id,
                'namaProduk', pm.nama_produk,
                'sku', pm.sku,
                'barcode', pm.barcode,
                'kategoriId', pm.kategori_id
              )
            )
          )
        ) as "transaksi_detail",
        jsonb_build_object(
          'id', pel.pelanggan_id,
          'namaPelanggan', pel.nama_pelanggan,
          'email', pel.email,
          'telepon', pel.telepon
        ) as "pelanggan",
        jsonb_build_object(
          'id', sup.supplier_id,
          'namaSupplier', sup.nama_supplier,
          'email', sup.email,
          'telepon', sup.telepon
        ) as "supplier",
        jsonb_build_object(
          'id', c.cabang_id,
          'namaCabang', c.nama_cabang,
          'alamat', c.alamat
        ) as "cabang",
        jsonb_build_object(
          'id', s.shift_id,
          'waktu_mulai', s.waktu_mulai,
          'waktu_selesai', s.waktu_selesai
        ) as "shift",
        jsonb_agg(
          jsonb_build_object(
            'transaksi_promo_id', tp.transaksi_promo_id,
            'transaksi_id', tp.transaksi_id,
            'promo_id', tp.promo_id,
            'total_diskon', tp.total_diskon,
            'promo', jsonb_build_object(
              'promo_id', pr.promo_id,
              'kode_promo', pr.kode_promo,
              'nama_promo', pr.nama_promo,
              'tipe_diskon', pr.tipe_diskon
            )
          )
        ) FILTER (WHERE tp.transaksi_promo_id IS NOT NULL) as "transaksi_promo"
      FROM transaksi t
      LEFT JOIN transaksi_detail td ON t.transaksi_id = td.transaksi_id
      LEFT JOIN produk p ON td.produk_id = p.produk_id
      LEFT JOIN produk_master pm ON p.produk_master_id = pm.produk_master_id
      LEFT JOIN pelanggan pel ON t.pelanggan_id = pel.pelanggan_id
      LEFT JOIN supplier sup ON t.supplier_id = sup.supplier_id
      LEFT JOIN cabang c ON t.cabang_id = c.cabang_id
      LEFT JOIN shift s ON t.shift_id = s.shift_id
      LEFT JOIN transaksi_promo tp ON t.transaksi_id = tp.transaksi_id
      LEFT JOIN promo_diskon pr ON tp.promo_id = pr.promo_id
      WHERE t.transaksi_id = ${transactionResult.transaksi_id}::VARCHAR
      GROUP BY t.transaksi_id, pel.pelanggan_id, sup.supplier_id, c.cabang_id, s.shift_id
    `;

    const completeTransaction = transactions[0];

    // Parse JSONB fields if needed
    if (completeTransaction.transaksi_detail && completeTransaction.transaksi_detail[0] === null) {
      completeTransaction.transaksi_detail = [];
    }
    if (completeTransaction.transaksi_promo && completeTransaction.transaksi_promo[0] === null) {
      completeTransaction.transaksi_promo = [];
    }

    // Tambahkan customer info jika ada
    if (data.customer_info && !completeTransaction.pelanggan_id) {
      completeTransaction.guest_customer = data.customer_info;
    }

    // Tambahkan info promo yang diterapkan
    completeTransaction.promo_summary = {
      promos_applied: transactionResult.promos_applied,
      total_diskon_promo: transactionResult.diskon_promo,
      promo_errors: transactionResult.promo_errors,
    };

    // Update cache
    const cacheKey = createCacheKey("transaksi", completeTransaction.transaksi_id);
    await cacheSet(cacheKey, completeTransaction, 1000);

    // Invalidasi cache related
    await invalidateRelatedCache(completeTransaction);

    await invalidateTransaksiCache(completeTransaction.transaksi_id);

    return completeTransaction;
  } catch (error) {
    // PostgreSQL mengembalikan error dengan format tertentu, extract pesan error
    let errorMessage = error.message;
    const match = errorMessage.match(/ERROR:\s+(.+)/);
    if (match) {
      errorMessage = match[1];
    }

    throw new ResponseError(400, errorMessage);
  }
};

// Service untuk mendapatkan detail transaksi
const getTransaksiById = async (transaksiId) => {
  const cacheKey = createCacheKey("transaksi", transaksiId);

  return await cacheOrFetch(
    cacheKey,
    async () => {
      const transaksi = await receiptService.getTransactionDataForReceipt(transaksiId);

      if (!transaksi) {
        throw new ResponseError(404, "Transaksi tidak ditemukan");
      }

      // Get loyalty points if customer exists
      if (transaksi.pelanggan_id) {
        const loyaltyInfo = await loyaltyService.getCustomerLoyaltyInfo(
          transaksi.pelanggan_id
        );
        transaksi.loyaltyInfo = loyaltyInfo;
      }

      return transaksi;
    },
    3600
  ); // Cache 1 jam
};

// Service untuk mendapatkan daftar transaksi dengan filter
const getTransaksiList = async (filters) => {
  const {
    cabang_id,
    jenis_transaksi,
    status_pembayaran,
    pelanggan_id,
    supplier_id,
    user_id,
    tanggal_mulai,
    tanggal_akhir,
    search,
    page = 1,
    limit = 10,
  } = filters;

  // Buat cache key berdasarkan filter
  const cacheKey = createCacheKey(
    "transaksi-list",
    `cabang:${cabang_id || "-"}-jenis:${jenis_transaksi || "-"}-status:${
      status_pembayaran || "-"
    }-pelanggan:${pelanggan_id || "-"}-supplier:${supplier_id || "-"}-user:${
      user_id || "-"
    }-start:${tanggal_mulai || "-"}-end:${tanggal_akhir || "-"}-search:${
      search || "-"
    }-page:${page}-limit:${limit}`
  );

  return await cacheOrFetch(
    cacheKey,
    async () => {
      const skip = (page - 1) * limit;

      // Membuat kondisi filter
      const where = {};

      if (cabang_id) where.cabang_id = cabang_id;
      if (jenis_transaksi) {
        if (Array.isArray(jenis_transaksi)) {
          where.jenis_transaksi = { in: jenis_transaksi };
        } else {
          where.jenis_transaksi = jenis_transaksi;
        }
      }
      if (status_pembayaran) where.status_pembayaran = status_pembayaran;
      if (pelanggan_id) where.pelanggan_id = pelanggan_id;
      if (supplier_id) where.supplier_id = supplier_id;
      if (user_id) where.user_id = user_id;

      // Filter deleted
      where.deleted_at = null;

      // Filter by date range
      if (tanggal_mulai || tanggal_akhir) {
        where.tanggal = {};
        if (tanggal_mulai) where.tanggal.gte = new Date(tanggal_mulai);
        if (tanggal_akhir) where.tanggal.lte = new Date(tanggal_akhir);
      }

      // Search by nomor transaksi or keterangan
      if (search) {
        where.OR = [
          { nomor_transaksi: { contains: search, mode: "insensitive" } },
          { keterangan: { contains: search, mode: "insensitive" } },
        ];
      }

      // Get total count
      const totalCount = await prisma.transaksi.count({ where });

      // Get data with pagination
      const transaksi = await prisma.transaksi.findMany({
        where,
        include: {
          pelanggan: {
            select: {
              id: true,
              namaPelanggan: true,
            },
          },
          supplier: {
            select: {
              id: true,
              namaSupplier: true,
            },
          },
          cabang: {
            select: {
              id: true,
              namaCabang: true,
            },
          },
          pembayaran: true,
          _count: {
            select: {
              transaksi_detail: true,
            },
          },
        },
        orderBy: {
          tanggal: "desc",
        },
        skip,
        take: limit,
      });

      // Calculate pagination
      const totalPages = Math.ceil(totalCount / limit);

      return {
        data: transaksi,
        pagination: {
          totalItems: totalCount,
          totalPages,
          currentPage: parseInt(page),
          itemsPerPage: parseInt(limit),
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    },
    300
  ); // Cache 5 menit
};

// Service untuk menambahkan pembayaran
const addPembayaran = async (data, auditInfo) => {
  const {
    transaksi_id,
    metode_pembayaran,
    provider,
    nomor_referensi,
    jumlah_bayar,
    tanggal_pembayaran,
    bukti_bayar_url,
    keterangan,
    generate_receipt,
  } = data;

  try {
    // Call the PostgreSQL function which returns a JSON result
    const result = await prisma.$queryRaw`
      SELECT add_pembayaran(
        ${transaksi_id}::VARCHAR,
        ${metode_pembayaran}::VARCHAR,
        ${provider}::VARCHAR,
        ${nomor_referensi}::VARCHAR,
        ${jumlah_bayar}::DECIMAL(15,2),
        ${tanggal_pembayaran ? new Date(tanggal_pembayaran) : null}::TIMESTAMP,
        ${bukti_bayar_url}::VARCHAR,
        ${keterangan}::TEXT,
        ${auditInfo.userId}::VARCHAR,
        ${auditInfo.ipAddress}::VARCHAR,
        ${auditInfo.userName}::VARCHAR
      ) as transaction_data;
    `;

    // Extract the result
    const transactionData = result[0]?.transaction_data;


    // Invalidate related cache
    await invalidateRelatedCache(transactionData);

    console.log("cabang_id", transactionData.cabang_id);

    // Get branch receipt configuration
    const receiptConfig = await prisma.receiptConfig.findFirst({
      where: { cabangId: transactionData.transaction.cabang_id },
    });

    // Return transaction data with receipt if generated

    console.log(transactionData);
    return {
      transactionData,
      receipt: receiptConfig,
    };
  } catch (error) {
    // Handle specific PostgreSQL exceptions
    if (error.message.includes("Transaksi tidak ditemukan")) {
      throw new ResponseError(404, "Transaksi tidak ditemukan");
    } else if (error.message.includes("Jumlah pembayaran tidak mencukupi")) {
      throw new ResponseError(400, `Jumlah pembayaran tidak mencukupi ${error.message}`);
    } else if (error.message.includes("Transaksi sudah dibayar lunas")) {
      throw new ResponseError(400, "Transaksi sudah dibayar lunas");
    }
    // Re-throw other errors
    throw error;
  }
};

// Service untuk pembayaran QRIS
const createQrisPayment = async (data, auditInfo) => {
  const { transaksi_id, amount, description } = data;

  // Cek transaksi
  const transaksi = await prisma.transaksi.findUnique({
    where: { transaksi_id },
    include: {
      pembayaran: {
        where: {
          metode_pembayaran: "QRIS",
          status: "PENDING",
        },
        orderBy: {
          created_at: "desc",
        },
        take: 1,
      },
      cabang: true,
      transaksi_detail: {
        include: {
          produk: {
            include: {
              produkMaster: {
                select: {
                  namaProduk: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!transaksi) {
    throw new ResponseError(404, "Transaksi tidak ditemukan");
  }

  if (transaksi.status_pembayaran === "LUNAS") {
    throw new ResponseError(400, "Transaksi sudah lunas");
  }

  if (transaksi.status_pembayaran === "DIBATALKAN") {
    throw new ResponseError(400, "Transaksi sudah dibatalkan");
  }

  console.log(transaksi.transaksi_detail);

  // Check if there's already a pending QRIS payment for this transaction
  if (transaksi.pembayaran && transaksi.pembayaran.length > 0) {
    const existingPayment = transaksi.pembayaran[0];

    // If the payment was created recently (within 15 minutes), return it instead of creating a new one
    const paymentAge = Date.now() - new Date(existingPayment.created_at).getTime();
    if (paymentAge < 15 * 60 * 1000 && existingPayment.bukti_bayar_url) {
      console.log("Returning existing QRIS payment for transaction:", transaksi.nomor_transaksi);
      return {
        pembayaran: existingPayment,
        qris_data: {
          qris_url: existingPayment.bukti_bayar_url,
          qris_code: existingPayment.nomor_referensi,
          reference_id: existingPayment.nomor_referensi,
          expiry_time: new Date(new Date(existingPayment.created_at).getTime() + 15 * 60 * 1000),
        },
      };
    }
  }

  // Generate QRIS code from payment gateway
  const qrisResponse = await qrisService.generateQrisCode({
    amount,
    external_id: transaksi.nomor_transaksi,
    description: description || `Pembayaran ${transaksi.nomor_transaksi}`,
    customer_name: transaksi.pelanggan?.namaPelanggan || "Customer",
    store_name: transaksi.cabang?.namaCabang || "Store",
    customer_email: transaksi.pelanggan?.email || "n9K3M@example.com",
    customer_phone: transaksi.pelanggan?.telepon || "081234567890",
    order_items: transaksi.transaksi_detail.map((detail) => ({
      id: detail.produk_id.toString(),
      name: detail.produk.produkMaster.namaProduk,
      quantity: detail.jumlah,
      price: detail.harga_satuan,
    })),
  });

  // Create payment record with PENDING status
  const pembayaran = await prisma.pembayaran.create({
    data: {
      transaksi_id,
      metode_pembayaran: "QRIS",
      provider: "QRIS_GATEWAY",
      nomor_referensi: qrisResponse.reference_id,
      jumlah_bayar: amount,
      jumlah_kembali: 0,
      tanggal_pembayaran: new Date(),
      bukti_bayar_url: qrisResponse.qris_url,
      created_by_user_Id: auditInfo.userId,
      updated_by_user_Id: auditInfo.userId,
      created_by: auditInfo.userName,
      updated_by: auditInfo.userName,
      status: "PENDING",
      keterangan: description || `Pembayaran QRIS ${transaksi.nomor_transaksi}`,
    },
  });

  // Tambahkan log audit
  await prisma.auditLog.create({
    data: {
      user_id: auditInfo.userId,
      created_by: auditInfo.userName,
      ip_address: auditInfo.ipAddress,
      action: "CREATE_QRIS_PAYMENT",
      table_name: "pembayaran",
      record_id: pembayaran.pembayaran_id,
      new_values: JSON.stringify({
        pembayaran,
        qris_data: qrisResponse,
      }),
    },
  });

  // Return payment data with QRIS info
  return {
    pembayaran,
    qris_data: {
      qris_url: qrisResponse.qris_url,
      qris_code: qrisResponse.qris_code,
      reference_id: qrisResponse.reference_id,
      qr_string: qrisResponse.qr_string,
      expiry_time: qrisResponse.expiry_time,
    },
  };
};

// Service untuk update status QRIS payment (callback)
const updateQrisPaymentStatus = async (data, auditInfo) => {
  const { payment_id, payment_status, reference_id } = data;

  // Cek pembayaran
  const pembayaran = await prisma.pembayaran.findFirst({
    where: {
      nomor_referensi: reference_id,
    },
    include: {
      transaksi: true,
    },
  });

  if (!pembayaran) {
    throw new ResponseError(404, "Pembayaran tidak ditemukan");
  }

  // Lakukan transaksi database
  const result = await prisma.$transaction(async (prisma) => {
    // Update status pembayaran
    const updatedPayment = await prisma.pembayaran.update({
      where: { pembayaran_id: pembayaran.pembayaran_id },
      data: {
        status: payment_status,
        keterangan:
          pembayaran.keterangan +
          ` | Update: ${payment_status} at ${new Date().toISOString()}`,
      },
    });

    // Update status transaksi jika payment sukses
    if (payment_status === "SUKSES") {
      // Hitung total yang sudah dibayar
      const allPayments = await prisma.pembayaran.findMany({
        where: {
          transaksi_id: pembayaran.transaksi_id,
          status: "SUKSES",
        },
      });

      const totalDibayar = allPayments.reduce((acc, payment) => {
        return acc + (payment.jumlah_bayar - payment.jumlah_kembali);
      }, 0);

      // Update status transaksi jika pembayaran cukup
      if (totalDibayar >= pembayaran.transaksi.total) {
        await prisma.transaksi.update({
          where: { transaksi_id: pembayaran.transaksi_id },
          data: {
            status_pembayaran: "LUNAS",
          },
        });
      }
    }

    // Tambahkan log audit
    await prisma.auditLog.create({
      data: {
        user_id: auditInfo.userId,
        created_by: auditInfo.userName,
        ip_address: auditInfo.ipAddress,
        action: "UPDATE_QRIS_PAYMENT",
        table_name: "pembayaran",
        record_id: pembayaran.pembayaran_id,
        old_values: JSON.stringify({ status: pembayaran.status }),
        new_values: JSON.stringify({ status: payment_status }),
      },
    });

    return updatedPayment;
  });

  return result;
};

// Service untuk membatalkan transaksi
const cancelTransaksi = async (transaksiId, alasanBatal, auditInfo) => {
  // Cek transaksi
  const transaksi = await prisma.transaksi.findUnique({
    where: { transaksi_id: transaksiId },
    include: {
      transaksi_detail: {
        include: {
          produk: true,
        },
      },
      pembayaran: true,
    },
  });

  if (!transaksi) {
    throw new ResponseError(404, "Transaksi tidak ditemukan");
  }

  if (transaksi.status_pembayaran === "DIBATALKAN") {
    throw new ResponseError(400, "Transaksi sudah dibatalkan");
  }

  // Cek jika ada pembayaran berhasil, jangan izinkan pembatalan
  const successPayments = transaksi.pembayaran.filter(
    (p) => p.status === "SUKSES"
  );
  if (successPayments.length > 0 && transaksi.jenis_transaksi === "PENJUALAN") {
    throw new ResponseError(
      400,
      "Transaksi dengan pembayaran berhasil tidak dapat dibatalkan"
    );
  }

  // Lakukan transaksi database
  const result = await prisma.$transaction(async (prisma) => {
    // Generate reference for inventory adjustment
    const referenceId = `CANCEL-${transaksi.nomor_transaksi}`;

    // Kembalikan stok untuk transaksi penjualan atau pengurangan stok untuk pembelian
    for (const detail of transaksi.transaksi_detail) {
      if (
        transaksi.jenis_transaksi === "PENJUALAN" ||
        transaksi.jenis_transaksi === "RETUR_PEMBELIAN"
      ) {
        // Kembalikan stok untuk penjualan yang dibatalkan
        await prisma.produk.update({
          where: { id: detail.produk_id },
          data: { stok: { increment: detail.jumlah } },
        });

        // Catat pergerakan inventaris (positif karena mengembalikan stok)
        await prisma.inventoryMovement.create({
          data: {
            produkId: detail.produk_id,
            cabangId: transaksi.cabang_id,
            referenceId,
            referenceType: "adjustment",
            quantity: detail.jumlah,
            batchNumber: detail.batch_number,
            expiredDate: detail.expired_date,
            keterangan: `Pembatalan ${transaksi.jenis_transaksi} #${transaksi.nomor_transaksi}: ${alasanBatal}`,
            userId: auditInfo.userId,
          },
        });
      } else if (
        transaksi.jenis_transaksi === "PEMBELIAN" ||
        transaksi.jenis_transaksi === "RETUR_PENJUALAN"
      ) {
        // Kurangi stok untuk pembelian yang dibatalkan
        await prisma.produk.update({
          where: { id: detail.produk_id },
          data: { stok: { decrement: detail.jumlah } },
        });

        // Catat pergerakan inventaris (negatif karena mengurangi stok)
        await prisma.inventoryMovement.create({
          data: {
            produkId: detail.produk_id,
            cabangId: transaksi.cabang_id,
            referenceId,
            referenceType: "adjustment",
            quantity: -detail.jumlah,
            batchNumber: detail.batch_number,
            expiredDate: detail.expired_date,
            keterangan: `Pembatalan ${transaksi.jenis_transaksi} #${transaksi.nomor_transaksi}: ${alasanBatal}`,
            userId: auditInfo.userId,
          },
        });
      }
    }

    // Update status transaksi menjadi dibatalkan
    const updatedTransaksi = await prisma.transaksi.update({
      where: { transaksi_id: transaksiId },
      data: {
        status_pembayaran: "DIBATALKAN",
        keterangan: transaksi.keterangan
          ? `${transaksi.keterangan} | Dibatalkan: ${alasanBatal}`
          : `Dibatalkan: ${alasanBatal}`,
      },
    });

    // Cancel any pending payments
    for (const payment of transaksi.pembayaran) {
      if (payment.status === "PENDING") {
        await prisma.pembayaran.update({
          where: { pembayaran_id: payment.pembayaran_id },
          data: {
            status: "GAGAL",
            keterangan: payment.keterangan
              ? `${payment.keterangan} | Dibatalkan: ${alasanBatal}`
              : `Dibatalkan: ${alasanBatal}`,
          },
        });
      }
    }

    // If customer received loyalty points, reverse them
    if (transaksi.pelanggan_id && transaksi.jenis_transaksi === "PENJUALAN") {
      await loyaltyService.reversePointsFromTransaction(
        transaksi.pelanggan_id,
        transaksiId,
        `Pembatalan transaksi: ${alasanBatal}`,
        auditInfo
      );
    }

    // Tambahkan log audit
    await prisma.auditLog.create({
      data: {
        user_id: auditInfo.userId,
        created_by: auditInfo.userName,
        ip_address: auditInfo.ipAddress,
        action: "CANCEL_TRANSAKSI",
        table_name: "transaksi",
        record_id: transaksiId,
        old_values: JSON.stringify({
          status_pembayaran: transaksi.status_pembayaran,
        }),
        new_values: JSON.stringify({
          status_pembayaran: "DIBATALKAN",
          alasan: alasanBatal,
        }),
      },
    });

    // Get updated transaction
    return await prisma.transaksi.findUnique({
      where: { transaksi_id: transaksiId },
      include: {
        transaksi_detail: {
          include: {
            produk: {
              include: {
                produkMaster: true,
              },
            },
          },
        },
        pembayaran: true,
        pelanggan: true,
        supplier: true,
        cabang: true,
      },
    });
  });

  return result;
};

// Service untuk laporan penjualan
const getSalesReport = async (filters) => {
  const {
    cabang_id,
    periode, // daily, weekly, monthly, yearly, custom
    tanggal_mulai,
    tanggal_akhir,
    kasir_id,
    produk_id,
    kategori_id,
    payment_method,
    include_details,
  } = filters;

  // Setup date range based on period
  let startDate, endDate;
  const now = new Date();

  if (tanggal_mulai && tanggal_akhir) {
    startDate = new Date(tanggal_mulai);
    endDate = new Date(tanggal_akhir);
  } else {
    switch (periode) {
      case "daily":
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date(now.setHours(23, 59, 59, 999));
        break;
      case "weekly":
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
        startDate = new Date(now.setDate(diff));
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "monthly":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        endDate = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59,
          999
        );
        break;
      case "yearly":
        startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      default:
        // Default to last 30 days
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
    }
  }

  // Build query conditions
  const where = {
    jenis_transaksi: "PENJUALAN",
    status_pembayaran: { not: "DIBATALKAN" },
    tanggal: {
      gte: startDate,
      lte: endDate,
    },
    deleted_at: null,
  };

  if (cabang_id) {
    where.cabang_id = cabang_id;
  }

  if (kasir_id) {
    where.user_id = kasir_id;
  }

  // Get transactions
  const transactions = await prisma.transaksi.findMany({
    where,
    include: {
      transaksi_detail: include_details
        ? {
            include: {
              produk: {
                include: {
                  produkMaster: true,
                },
              },
            },
          }
        : false,
      pembayaran: true,
      pelanggan: true,
      cabang: true,
    },
    orderBy: {
      tanggal: "asc",
    },
  });

  // Filter by payment method if specified
  let filteredTransactions = transactions;
  if (payment_method) {
    filteredTransactions = transactions.filter((trans) => {
      return trans.pembayaran.some(
        (payment) =>
          payment.metode_pembayaran === payment_method &&
          payment.status === "SUKSES"
      );
    });
  }

  // Filter by product or category if specified
  if ((produk_id || kategori_id) && include_details) {
    filteredTransactions = transactions.filter((trans) => {
      return trans.transaksi_detail.some((detail) => {
        if (produk_id) {
          return detail.produk_id === produk_id;
        }
        if (kategori_id) {
          return detail.produk.produkMaster.kategoriId === kategori_id;
        }
        return false;
      });
    });
  }

  // Generate summary
  const summary = {
    total_transactions: filteredTransactions.length,
    total_sales: filteredTransactions.reduce(
      (sum, trans) => sum + Number(trans.total),
      0
    ),
    total_tax: filteredTransactions.reduce(
      (sum, trans) => sum + Number(trans.pajak),
      0
    ),
    total_discount: filteredTransactions.reduce(
      (sum, trans) => sum + Number(trans.diskon),
      0
    ),
    average_transaction_value:
      filteredTransactions.length > 0
        ? filteredTransactions.reduce(
            (sum, trans) => sum + Number(trans.total),
            0
          ) / filteredTransactions.length
        : 0,
    payment_methods: {},
    period: {
      start_date: startDate,
      end_date: endDate,
      periode: periode,
    },
  };

  // Calculate payment method totals
  filteredTransactions.forEach((trans) => {
    trans.pembayaran
      .filter((payment) => payment.status === "SUKSES")
      .forEach((payment) => {
        const method = payment.metode_pembayaran;
        if (!summary.payment_methods[method]) {
          summary.payment_methods[method] = 0;
        }
        summary.payment_methods[method] +=
          Number(payment.jumlah_bayar) - Number(payment.jumlah_kembali);
      });
  });

  // Generate product sales data if requested
  let productSales = [];
  if (include_details) {
    const productMap = new Map();

    filteredTransactions.forEach((trans) => {
      trans.transaksi_detail.forEach((detail) => {
        const produkId = detail.produk.produkMaster.id;
        const produkName = detail.produk.produkMaster.namaProduk;
        const kategoriId = detail.produk.produkMaster.kategoriId;

        if (!productMap.has(produkId)) {
          productMap.set(produkId, {
            produk_id: produkId,
            produk_name: produkName,
            kategori_id: kategoriId,
            quantity: 0,
            total_sales: 0,
          });
        }

        const product = productMap.get(produkId);
        product.quantity += detail.jumlah;
        product.total_sales += Number(detail.total);
      });
    });

    productSales = Array.from(productMap.values()).sort(
      (a, b) => b.total_sales - a.total_sales
    );
  }

  return {
    summary,
    transactions: include_details
      ? filteredTransactions
      : filteredTransactions.map((t) => ({
          transaksi_id: t.transaksi_id,
          nomor_transaksi: t.nomor_transaksi,
          tanggal: t.tanggal,
          total: t.total,
          status_pembayaran: t.status_pembayaran,
          pelanggan: t.pelanggan,
          user: t.user,
        })),
    product_sales: include_details ? productSales : undefined,
  };
};

const invalidateRelatedCache = async (transaksi) => {
  // Invalidasi daftar transaksi
  await cacheDeletePattern("transaksi-list:*");

  // Invalidasi cache shift terkait
  if (transaksi.shift_id) {
    await cacheDelete(createCacheKey("shift", transaksi.shift_id));
    await cacheDelete(
      createCacheKey(
        "active-shift",
        `${transaksi.user_id}:${transaksi.cabang_id}`
      )
    );
  }

  // Invalidasi cache pelanggan terkait
  if (transaksi.pelanggan_id) {
    await cacheDelete(`loyalty-info:${transaksi.pelanggan_id}`);
    await cacheDelete(`customer:${transaksi.pelanggan_id}`);
  }

  // Invalidasi cache untuk produk yang terlibat dalam transaksi
  if (transaksi.transaksi_detail && transaksi.transaksi_detail.length > 0) {
    for (const detail of transaksi.transaksi_detail) {
      if (detail.produk_id) {
        await cacheDelete(createCacheKey("produk", detail.produk_id));
      }
    }

    // Invalidasi cache produk stok rendah
    await cacheDeletePattern(`low-stock-products:${transaksi.cabang_id}:*`);
  }

  // Invalidasi cache laporan penjualan
  await cacheDeletePattern("sales-report:*");

  // Invalidasi cache dashboard
  await cacheDeletePattern("dashboard:*");
};

// Tambahkan fungsi untuk invalidasi cache transaksi
const invalidateTransaksiCache = async (transaksiId = null) => {
  if (transaksiId) {
    await cacheDelete(createCacheKey("transaksi", transaksiId));
  } else {
    await cacheDeletePattern("transaksi:*");
    await cacheDeletePattern("transaksi-list:*");
  }

  // Invalidasi cache laporan terkait
  await cacheDeletePattern("sales-report:*");
  await cacheDeletePattern("shift-report:*");
  await cacheDeletePattern("dashboard:*");
};

// Service untuk preview/validasi promo codes tanpa membuat transaksi
const previewPromo = async (data, auditInfo) => {
  try {
    const { promo_codes, cabang_id, pelanggan_id, subtotal, metode_pembayaran, details } = data;

    // Validate required fields
    if (!promo_codes || !Array.isArray(promo_codes) || promo_codes.length === 0) {
      throw new ResponseError(400, "Promo codes harus diisi");
    }

    if (!cabang_id) {
      throw new ResponseError(400, "Cabang ID harus diisi");
    }

    if (!subtotal || subtotal <= 0) {
      throw new ResponseError(400, "Subtotal harus diisi");
    }

    // Call apply_multiple_promos database function
    // Include cart items (details) for product-specific promo validation
    const result = await prisma.$queryRaw`
      SELECT apply_multiple_promos(
        ${promo_codes}::VARCHAR[],
        ${cabang_id}::VARCHAR,
        ${pelanggan_id || null}::VARCHAR,
        ${details ? JSON.stringify(details) : '[]'}::JSONB,
        ${subtotal}::NUMERIC,
        ${metode_pembayaran || null}::VARCHAR
      ) as result
    `;

    const promoResult = result[0]?.result;

    return {
      applicable_promos: promoResult?.applicable_promos || [],
      total_discount: parseFloat(promoResult?.total_discount || 0),
      errors: promoResult?.errors || [],
    };
  } catch (error) {
    if (error instanceof ResponseError) {
      throw error;
    }
    throw new ResponseError(500, `Gagal memvalidasi promo: ${error.message}`);
  }
};

// Service untuk preview semua diskon (promo + member + manual + loyalty)
const previewAllDiscounts = async (data, auditInfo) => {
  try {
    const {
      cabang_id,
      pelanggan_id,
      subtotal,
      promo_codes,
      manual_discount_persen,
      manual_discount_nominal,
      manual_discount_alasan,
      metode_pembayaran,
      details,
      // Loyalty reward input
      loyalty_discount = 0,
      loyalty_reward_name = null,
      points_redeemed = 0
    } = data;

    // Validate required fields
    if (!cabang_id) {
      throw new ResponseError(400, "Cabang ID harus diisi");
    }

    if (!subtotal || subtotal <= 0) {
      throw new ResponseError(400, "Subtotal harus diisi");
    }

    // First, validate manual discount if provided
    if ((manual_discount_persen && manual_discount_persen > 0) ||
        (manual_discount_nominal && manual_discount_nominal > 0)) {

      const hasPromo = promo_codes && promo_codes.length > 0;

      const manualValidation = await prisma.$queryRaw`
        SELECT validate_manual_discount(
          ${manual_discount_persen || null}::NUMERIC,
          ${manual_discount_nominal || 0}::NUMERIC,
          ${subtotal}::NUMERIC,
          ${cabang_id}::VARCHAR,
          ${hasPromo}::BOOLEAN
        ) as result
      `;

      const validationResult = manualValidation[0]?.result;
      if (!validationResult?.is_valid) {
        const errorMsg = validationResult?.errors?.map(e => {
          if (typeof e === 'string') return e;
          return JSON.stringify(e);
        }).join(', ') || 'Manual discount tidak valid';
        throw new ResponseError(400, errorMsg);
      }
    }

    // Calculate promo discount if promo codes are provided
    let promoDiscount = 0;
    let promoErrors = [];

    if (promo_codes && promo_codes.length > 0) {
      try {
        const promoResult = await prisma.$queryRaw`
          SELECT apply_multiple_promos(
            ${promo_codes}::VARCHAR[],
            ${cabang_id}::VARCHAR,
            ${pelanggan_id || null}::VARCHAR,
            ${details ? JSON.stringify(details) : '[]'}::JSONB,
            ${subtotal}::NUMERIC,
            ${metode_pembayaran || null}::VARCHAR
          ) as result
        `;

        const result = promoResult[0]?.result;
        promoDiscount = parseFloat(result?.total_discount || 0);
        promoErrors = result?.errors || [];
      } catch (error) {
        // If promo validation fails, continue without promo discount
        promoErrors = [error.message];
      }
    }

    // Apply all discounts using apply_all_discounts function
    const hasPromo = promo_codes && promo_codes.length > 0;

    const result = await prisma.$queryRaw`
      SELECT apply_all_discounts(
        ${pelanggan_id || null}::VARCHAR,
        ${subtotal}::NUMERIC,
        ${cabang_id}::VARCHAR,
        ${manual_discount_persen || null}::NUMERIC,
        ${manual_discount_nominal || 0}::NUMERIC,
        ${manual_discount_alasan || null}::VARCHAR,
        ${hasPromo}::BOOLEAN,
        ${promoDiscount}::NUMERIC
      ) as result
    `;

    const discountResult = result[0]?.result;

    // Add loyalty discount to breakdown if provided
    const loyaltyDiscountValue = parseFloat(loyalty_discount) || 0;
    let updatedBreakdown = discountResult?.breakdown || [];
    
    if (loyaltyDiscountValue > 0) {
      updatedBreakdown = [
        ...updatedBreakdown,
        {
          tipe: 'LOYALTY_REWARD',
          amount: loyaltyDiscountValue,
          reward_name: loyalty_reward_name,
          points_redeemed: points_redeemed
        }
      ];
    }

    // Calculate new total discount including loyalty
    const totalDiscountWithLoyalty = parseFloat(discountResult?.total_discount || 0) + loyaltyDiscountValue;

    // Return the breakdown with loyalty discount and promo errors
    return {
      ...discountResult,
      total_discount: totalDiscountWithLoyalty,
      discount_loyalty: loyaltyDiscountValue,
      loyalty_reward_name: loyalty_reward_name,
      points_redeemed: points_redeemed,
      breakdown: updatedBreakdown,
      promo_errors: promoErrors,
    };
  } catch (error) {
    if (error instanceof ResponseError) {
      throw error;
    }
    throw new ResponseError(500, `Gagal mempreview diskon: ${error.message}`);
  }
};

// Service untuk mendapatkan rekomendasi pembayaran kredit untuk transaksi
const getKreditPaymentRecommendation = async (transaksiId) => {
  try {
    // Cek apakah transaksi ada
    const transaksi = await getTransaksiById(transaksiId);
    
    if (!transaksi) {
      throw new ResponseError(404, "Transaksi tidak ditemukan");
    }
    
    // Cek apakah transaksi sudah lunas
    if (transaksi.status_pembayaran === "LUNAS") {
      throw new ResponseError(400, "Transaksi sudah lunas, tidak dapat diproses untuk kredit");
    }
    
    // Cek apakah transaksi memiliki pelanggan
    if (!transaksi.pelanggan_id) {
      throw new ResponseError(400, "Transaksi harus memiliki pelanggan untuk rekomendasi kredit");
    }
    
    // Ambil data pelanggan dan riwayat transaksi untuk perhitungan kredit
    const pelangganId = transaksi.pelanggan_id;
    const kreditRekomendasiService = require('./kreditRekomendasiService');
    
    // Ambil skor kredit pelanggan
    const creditScore = await kreditRekomendasiService.calculateCustomerCreditScore(pelangganId);
    
    // Tentukan batas kredit berdasarkan skor
    const creditLimit = await kreditRekomendasiService.determineCreditLimit(pelangganId, creditScore);
    
    // Cek apakah nilai transaksi dalam batas kredit
    const totalTransaksi = parseFloat(transaksi.total_harga);
    if (totalTransaksi > creditLimit) {
      throw new ResponseError(400, `Nilai transaksi (${totalTransaksi}) melebihi batas kredit yang diizinkan (${creditLimit}). Silakan kurangi jumlah atau gunakan metode pembayaran lain.`);
    }
    
    // Generate opsi pembayaran kredit
    const paymentOptions = await kreditRekomendasiService.generatePaymentOptions(totalTransaksi, creditScore);
    
    // Buat rekomendasi kredit
    const kreditRekomendasi = await kreditRekomendasiService.createKreditRekomendasi({
      pelangganId,
      transaksiId,
      creditScore,
      creditLimit,
      totalAmount: totalTransaksi,
      paymentOptions
    });
    
    return {
      transaksi_id: transaksiId,
      pelanggan_id: pelangganId,
      credit_score: creditScore,
      credit_limit: creditLimit,
      total_transaksi: totalTransaksi,
      rekomendasi_id: kreditRekomendasi.id,
      opsi_pembayaran: paymentOptions
    };
  } catch (error) {
    if (error instanceof ResponseError) {
      throw error;
    }
    throw new ResponseError(500, `Gagal mendapatkan rekomendasi pembayaran kredit: ${error.message}`);
  }
};

// Service untuk membuat transaksi kredit
const createKreditTransaction = async (data, auditInfo) => {
  try {
    // Validasi data
    if (!data.transaksi_id) {
      throw new ResponseError(400, "ID transaksi diperlukan");
    }
    
    if (!data.rekomendasi_id) {
      throw new ResponseError(400, "ID rekomendasi kredit diperlukan");
    }
    
    if (!data.opsi_pembayaran_id) {
      throw new ResponseError(400, "ID opsi pembayaran diperlukan");
    }
    
    // Ambil transaksi
    const transaksi = await getTransaksiById(data.transaksi_id);
    if (!transaksi) {
      throw new ResponseError(404, "Transaksi tidak ditemukan");
    }
    
    // Ambil rekomendasi kredit
    const kreditRekomendasiService = require('./kreditRekomendasiService');
    const rekomendasi = await kreditRekomendasiService.getKreditRekomendasiById(data.rekomendasi_id);
    
    if (!rekomendasi) {
      throw new ResponseError(404, "Rekomendasi kredit tidak ditemukan");
    }
    
    // Cek status persetujuan
    if (rekomendasi.status_persetujuan !== "disetujui") {
      throw new ResponseError(400, "Rekomendasi kredit belum disetujui");
    }
    
    // Ambil opsi pembayaran
    const opsiPembayaran = rekomendasi.opsiPembayaranKredit.find(
      opsi => opsi.id === data.opsi_pembayaran_id
    );
    
    if (!opsiPembayaran) {
      throw new ResponseError(404, "Opsi pembayaran tidak ditemukan");
    }
    
    // Update transaksi dengan metode pembayaran kredit
    const updatedTransaksi = await prisma.transaksi.update({
      where: { transaksi_id: data.transaksi_id },
      data: {
        metode_pembayaran: "KREDIT",
        status_pembayaran: "SEBAGIAN", // Karena kredit dianggap sebagian dibayar
        keterangan: `${transaksi.keterangan || ''} [Kredit: ${opsiPembayaran.jumlah_cicilan}x cicilan, tenor ${opsiPembayaran.durasi_bulan} bulan]`.trim(),
        updatedAt: new Date(),
        updatedBy: auditInfo.userId,
      }
    });
    
    // Buat pembayaran awal jika ada uang muka
    let pembayaranAwal = null;
    if (data.uang_muka && parseFloat(data.uang_muka) > 0) {
      pembayaranAwal = await addPembayaran({
        transaksi_id: data.transaksi_id,
        jumlah_pembayaran: parseFloat(data.uang_muka),
        metode_pembayaran: data.metode_pembayaran_dp || "TUNAI",
        keterangan: "Uang muka pembayaran kredit",
        tanggal_pembayaran: new Date()
      }, auditInfo);
    }
    
    // Buat entri cicilan kredit di database
    const cicilanKredit = await prisma.cicilanKredit.create({
      data: {
        transaksi_id: data.transaksi_id,
        kredit_rekomendasi_id: data.rekomendasi_id,
        opsi_pembayaran_id: data.opsi_pembayaran_id,
        jumlah_cicilan: opsiPembayaran.jumlah_cicilan,
        durasi_bulan: opsiPembayaran.durasi_bulan,
        bunga_persen: opsiPembayaran.bunga_persen,
        biaya_admin: opsiPembayaran.biaya_admin,
        total_pembayaran: opsiPembayaran.total_pembayaran,
        uang_muka: data.uang_muka || 0,
        sisa_pembayaran: parseFloat(opsiPembayaran.total_pembayaran) - (parseFloat(data.uang_muka) || 0),
        tanggal_mulai: new Date(),
        tanggal_jatuh_tempo: new Date(new Date().setMonth(new Date().getMonth() + opsiPembayaran.durasi_bulan)),
        status: "AKTIF",
        createdAt: new Date(),
        createdBy: auditInfo.userId,
        updatedAt: new Date(),
        updatedBy: auditInfo.userId,
      }
    });
    
    // Invalidasi cache
    await invalidateTransaksiCache(data.transaksi_id);
    
    // Return hasil
    return {
      transaksi: await getTransaksiById(data.transaksi_id),
      kredit_rekomendasi: rekomendasi,
      opsi_pembayaran: opsiPembayaran,
      cicilan_kredit: cicilanKredit,
      pembayaran_awal: pembayaranAwal
    };
  } catch (error) {
    if (error instanceof ResponseError) {
      throw error;
    }
    throw new ResponseError(500, `Gagal membuat transaksi kredit: ${error.message}`);
  }
};

module.exports = {
  createTransaksi,
  createTransaksiWithPromo,
  getTransaksiById,
  getTransaksiList,
  addPembayaran,
  createQrisPayment,
  updateQrisPaymentStatus,
  cancelTransaksi,
  getSalesReport,
  getKreditPaymentRecommendation,
  createKreditTransaction,
  previewPromo,
  previewAllDiscounts,
  invalidateTransaksiCache,
};
