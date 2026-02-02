const transaksiService = require("../services/transaksiService");
const { ResponseError } = require("../error/responseError");
const { validate } = require("../validation/validation");
const {
  createTransaksiValidation,
  createPembayaranValidation,
  qrisPaymentValidation,
  updateQrisStatusValidation,
  getTransaksiListValidation,
  createKreditTransaksiValidation,
  previewDiscountValidation,
} = require("../validation/transaksiValidation");

// Controller untuk membuat transaksi baru
const createTransaksi = async (req, res, next) => {
  try {
    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip || req.socket.remoteAddress,
      userName: req.user.username,
    };
    const request = validate(createTransaksiValidation, req.body);

    const result = await transaksiService.createTransaksi(request, auditInfo);

    res.status(201).json({
      status: true,
      message: "Transaksi berhasil dibuat",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk membuat transaksi dengan promo codes
const createTransaksiWithPromo = async (req, res, next) => {
  try {
    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip || req.socket.remoteAddress,
      userName: req.user.username,
    };
    const request = validate(createTransaksiValidation, req.body);

    const result = await transaksiService.createTransaksiWithPromo(request, auditInfo);

    res.status(201).json({
      status: true,
      message: "Transaksi dengan promo berhasil dibuat",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk mendapatkan detail transaksi
const getTransaksiById = async (req, res, next) => {
  try {
    const transaksiId = req.params.id;

    if (!transaksiId) {
      throw new ResponseError(400, "ID transaksi diperlukan");
    }

    const result = await transaksiService.getTransaksiById(transaksiId);

    res.status(200).json({
      status: true,
      message: "Berhasil mendapatkan detail transaksi",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk mendapatkan daftar transaksi
const getTransaksiList = async (req, res, next) => {
  try {
    const filters = validate(getTransaksiListValidation, {
      cabang_id: req.query.cabangId,
      jenis_transaksi: req.query.jenisTransaksi,
      status_pembayaran: req.query.statusPembayaran,
      pelanggan_id: req.query.pelangganId,
      supplier_id: req.query.supplierId,
      user_id: req.query.userId,
      tanggal_mulai: req.query.startDate,
      tanggal_akhir: req.query.endDate,
      search: req.query.search,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
    });

    const result = await transaksiService.getTransaksiList(filters);

    res.status(200).json({
      status: true,
      message: "Berhasil mendapatkan daftar transaksi",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk menambahkan pembayaran
const addPembayaran = async (req, res, next) => {
  try {
    const request = validate(createPembayaranValidation, req.body);

    // Get user information for audit log
    const userId = req.user.id;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userName = req.user.namaLengkap;

    const result = await transaksiService.addPembayaran(request, {
      userId,
      ipAddress,
      userName,
    });

    res.status(200).json({
      status: true,
      message: "Pembayaran berhasil ditambahkan",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk membuat pembayaran QRIS
const createQrisPayment = async (req, res, next) => {
  try {
    const request = validate(qrisPaymentValidation, req.body);

    // Get user information for audit log
    const userId = req.user.id;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userName = req.user.namaLengkap;

    const result = await transaksiService.createQrisPayment(request, {
      userId,
      ipAddress,
      userName,
    });

    res.status(200).json({
      status: true,
      message: "Pembayaran QRIS berhasil dibuat",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk callback update status QRIS
const updateQrisStatus = async (req, res, next) => {
  try {
    const request = validate(updateQrisStatusValidation, req.body);

    const userId = req.user.id;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userName = req.user.namaLengkap;

    const result = await transaksiService.updateQrisPaymentStatus(request, {
      userId,
      ipAddress,
      userName,
    });

    res.status(200).json({
      status: true,
      message: "Status pembayaran QRIS berhasil diupdate",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk membatalkan transaksi
const cancelTransaksi = async (req, res, next) => {
  try {
    const transaksiId = req.params.id;
    const { alasan } = req.body;

    if (!alasan) {
      throw new ResponseError(400, "Alasan pembatalan diperlukan");
    }

    // Get user information for audit log
    const userId = req.user.id;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const result = await transaksiService.cancelTransaksi(transaksiId, alasan, {
      userId,
      ipAddress,
    });

    res.status(200).json({
      status: true,
      message: "Transaksi berhasil dibatalkan",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk laporan penjualan
const getSalesReport = async (req, res, next) => {
  try {
    const filters = {
      cabang_id: req.query.cabang_id,
      periode: req.query.periode || "daily",
      tanggal_mulai: req.query.tanggal_mulai,
      tanggal_akhir: req.query.tanggal_akhir,
      kasir_id: req.query.kasir_id,
      produk_id: req.query.produk_id,
      kategori_id: req.query.kategori_id,
      payment_method: req.query.payment_method,
      include_details: req.query.include_details === "true",
    };

    const result = await transaksiService.getSalesReport(filters);

    res.status(200).json({
      status: true,
      message: "Berhasil mendapatkan laporan penjualan",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk mendapatkan rekomendasi pembayaran kredit untuk transaksi
const getKreditPaymentRecommendation = async (req, res, next) => {
  try {
    const transaksiId = req.params.id;
    
    if (!transaksiId) {
      throw new ResponseError(400, "ID transaksi diperlukan");
    }
    
    const result = await transaksiService.getKreditPaymentRecommendation(transaksiId);
    
    res.status(200).json({
      status: true,
      message: "Berhasil mendapatkan rekomendasi pembayaran kredit",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk membuat transaksi kredit
const createKreditTransaction = async (req, res, next) => {
  try {
    const request = validate(createKreditTransaksiValidation, req.body);
    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip || req.socket.remoteAddress,
      userName: req.user.username,
    };
    
    const result = await transaksiService.createKreditTransaction(request, auditInfo);
    
    res.status(201).json({
      status: true,
      message: "Transaksi kredit berhasil dibuat",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk preview promo codes
const previewPromo = async (req, res, next) => {
  try {
    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip || req.socket.remoteAddress,
      userName: req.user.namaLengkap || req.user.username,
    };

    const result = await transaksiService.previewPromo(req.body, auditInfo);

    res.status(200).json({
      status: true,
      message: "Promo preview berhasil",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk preview semua diskon (promo + member + manual)
const previewAllDiscounts = async (req, res, next) => {
  try {
    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip || req.socket.remoteAddress,
      userName: req.user.namaLengkap || req.user.username,
    };

    const request = validate(previewDiscountValidation, req.body);

    const result = await transaksiService.previewAllDiscounts(request, auditInfo);

    res.status(200).json({
      status: true,
      message: "Discount preview berhasil",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTransaksi,
  createTransaksiWithPromo,
  getTransaksiById,
  getTransaksiList,
  addPembayaran,
  createQrisPayment,
  updateQrisStatus,
  cancelTransaksi,
  getSalesReport,
  getKreditPaymentRecommendation,
  createKreditTransaction,
  previewPromo,
  previewAllDiscounts,
};
