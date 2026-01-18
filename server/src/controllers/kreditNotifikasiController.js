const { ResponseError } = require("../error/responseError");
const kreditNotifikasiService = require("../services/kreditNotifikasiService");
const { validate } = require("../validation/validation");
const kreditNotifikasiValidation = require("../validation/kreditNotifikasiValidation");

/**
 * Membuat notifikasi kredit baru
 * @param {Object} req - Request Express
 * @param {Object} res - Response Express
 * @param {Function} next - Next middleware
 */
const createKreditNotifikasi = async (req, res, next) => {
  try {
    const user = req.user;
    const request = validate(
      kreditNotifikasiValidation.createKreditNotifikasiValidation,
      req.body
    );

    const result = await kreditNotifikasiService.createKreditNotifikasi(
      request
    );

    res.status(201).json({
      status: true,
      message: "Notifikasi kredit berhasil dibuat",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mengirim notifikasi kredit
 * @param {Object} req - Request Express
 * @param {Object} res - Response Express
 * @param {Function} next - Next middleware
 */
const sendKreditNotifikasi = async (req, res, next) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const result = await kreditNotifikasiService.sendKreditNotifikasi(id);

    res.status(200).json({
      status: true,
      message: "Notifikasi kredit berhasil dikirim",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mendapatkan daftar notifikasi kredit
 * @param {Object} req - Request Express
 * @param {Object} res - Response Express
 * @param {Function} next - Next middleware
 */
const getKreditNotifikasi = async (req, res, next) => {
  try {
    const user = req.user;
    const filters = {
      kreditTransaksiId: req.query.kreditTransaksiId,
      pelangganId: req.query.pelangganId,
      jenisNotifikasi: req.query.jenisNotifikasi,
      statusNotifikasi: req.query.statusNotifikasi,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      page: req.query.page || 1,
      limit: req.query.limit || 10,
      sortBy: req.query.sortBy || "createdAt",
      sortOrder: req.query.sortOrder || "desc",
    };

    const result = await kreditNotifikasiService.getKreditNotifikasi(filters);

    res.status(200).json({
      status: true,
      message: "Daftar notifikasi kredit berhasil diambil",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Menandai notifikasi kredit telah dibaca
 * @param {Object} req - Request Express
 * @param {Object} res - Response Express
 * @param {Function} next - Next middleware
 */
const markNotifikasiRead = async (req, res, next) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const result = await kreditNotifikasiService.markNotifikasiRead(id);

    res.status(200).json({
      status: true,
      message: "Notifikasi kredit berhasil ditandai telah dibaca",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Membatalkan notifikasi kredit
 * @param {Object} req - Request Express
 * @param {Object} res - Response Express
 * @param {Function} next - Next middleware
 */
const cancelKreditNotifikasi = async (req, res, next) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const result = await kreditNotifikasiService.cancelKreditNotifikasi(id);

    res.status(200).json({
      status: true,
      message: "Notifikasi kredit berhasil dibatalkan",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Membuat notifikasi pengingat pembayaran kredit otomatis
 * @param {Object} req - Request Express
 * @param {Object} res - Response Express
 * @param {Function} next - Next middleware
 */
const createPaymentReminderNotifications = async (req, res, next) => {
  try {
    const user = req.user;
    const options = {
      daysBefore: req.body.daysBefore || 3,
      daysAfter: req.body.daysAfter || 1,
      metodePengiriman: req.body.metodePengiriman || [
        "EMAIL",
        "APP_NOTIFICATION",
      ],
    };

    const result =
      await kreditNotifikasiService.createPaymentReminderNotifications(options);

    res.status(200).json({
      status: true,
      message: `${result.length} notifikasi pengingat pembayaran kredit berhasil dibuat`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mengirim semua notifikasi kredit yang belum dikirim
 * @param {Object} req - Request Express
 * @param {Object} res - Response Express
 * @param {Function} next - Next middleware
 */
const sendPendingNotifications = async (req, res, next) => {
  try {
    const user = req.user;

    const result = await kreditNotifikasiService.sendPendingNotifications();

    res.status(200).json({
      status: true,
      message: `${result.length} notifikasi kredit berhasil dikirim`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createKreditNotifikasi,
  sendKreditNotifikasi,
  getKreditNotifikasi,
  markNotifikasiRead,
  cancelKreditNotifikasi,
  createPaymentReminderNotifications,
  sendPendingNotifications,
};
