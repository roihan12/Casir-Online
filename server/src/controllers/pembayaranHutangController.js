const pembayaranHutangService = require("../services/pembayaranHutangService");
const { ResponseError } = require("../error/responseError");
const { validate } = require("../validation/validation");
const {
  createPembayaranHutangValidation,
  getHutangListValidation,
} = require("../validation/transaksiValidation");

/**
 * Controller untuk membuat pembayaran hutang (cicilan / pelunasan)
 */
const createPembayaranHutang = async (req, res, next) => {
  try {
    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip || req.socket.remoteAddress,
      userName: req.user.username || req.user.namaLengkap,
    };

    const request = validate(createPembayaranHutangValidation, req.body);

    const result = await pembayaranHutangService.createPembayaranHutang(request, auditInfo);

    res.status(201).json({
      status: true,
      message: result.hutang.statusHutang === "lunas"
        ? "Hutang berhasil dilunasi"
        : "Pembayaran cicilan berhasil dicatat",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller untuk mendapatkan detail hutang
 */
const getHutangById = async (req, res, next) => {
  try {
    const hutangId = req.params.id;

    if (!hutangId) {
      throw new ResponseError(400, "ID hutang diperlukan");
    }

    const result = await pembayaranHutangService.getHutangById(hutangId);

    res.status(200).json({
      status: true,
      message: "Berhasil mendapatkan detail hutang",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller untuk mendapatkan daftar hutang dengan filter
 */
const getHutangList = async (req, res, next) => {
  try {
    const filters = validate(getHutangListValidation, {
      cabang_id: req.query.cabangId,
      jenis_hutang: req.query.jenisHutang,
      status_hutang: req.query.statusHutang,
      pelanggan_id: req.query.pelangganId,
      supplier_id: req.query.supplierId,
      tanggal_mulai: req.query.startDate,
      tanggal_akhir: req.query.endDate,
      jatuh_tempo_mulai: req.query.jatuhTempoStart,
      jatuh_tempo_akhir: req.query.jatuhTempoEnd,
      search: req.query.search,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
    });

    const result = await pembayaranHutangService.getHutangList(filters);

    res.status(200).json({
      status: true,
      message: "Berhasil mendapatkan daftar hutang",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller untuk mendapatkan summary hutang pelanggan/supplier
 */
const getHutangSummary = async (req, res, next) => {
  try {
    const { type, id } = req.params;

    if (!type || !id) {
      throw new ResponseError(400, "Type dan ID diperlukan");
    }

    if (type !== "pelanggan" && type !== "supplier") {
      throw new ResponseError(400, "Type harus 'pelanggan' atau 'supplier'");
    }

    const result = await pembayaranHutangService.getHutangSummary(type, id);

    res.status(200).json({
      status: true,
      message: "Berhasil mendapatkan summary hutang",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller untuk mendapatkan riwayat pembayaran hutang
 */
const getPembayaranHistory = async (req, res, next) => {
  try {
    const hutangId = req.params.id;

    if (!hutangId) {
      throw new ResponseError(400, "ID hutang diperlukan");
    }

    const result = await pembayaranHutangService.getPembayaranHistory(hutangId);

    res.status(200).json({
      status: true,
      message: "Berhasil mendapatkan riwayat pembayaran",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPembayaranHutang,
  getHutangById,
  getHutangList,
  getHutangSummary,
  getPembayaranHistory,
};
