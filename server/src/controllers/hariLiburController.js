const hariLiburService = require("../services/hariLiburService");
const { validate } = require("../validation/validation");
const {
  createHariLiburValidation,
  importHariLiburValidation,
  getHariLiburValidation,
  checkHariLiburValidation,
  hitungHariKerjaValidation,
  hariLiburIdValidation,
} = require("../validation/hariLiburValidation");

/**
 * Get holidays list
 */
const getHariLibur = async (req, res, next) => {
  try {
    const filters = validate(getHariLiburValidation, {
      tahun: req.query.tahun ? parseInt(req.query.tahun) : undefined,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
    });

    const result = await hariLiburService.getHariLibur(filters);

    res.status(200).json({
      success: true,
      message: "Holidays retrieved successfully",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a single holiday
 */
const createHariLibur = async (req, res, next) => {
  try {
    const request = validate(createHariLiburValidation, req.body);
    const result = await hariLiburService.createHariLibur(request);

    res.status(201).json({
      success: true,
      message: "Holiday created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk import holidays
 */
const importHariLibur = async (req, res, next) => {
  try {
    const request = validate(importHariLiburValidation, req.body);
    const result = await hariLiburService.importHariLibur(request);

    res.status(201).json({
      success: true,
      message: "Holidays imported successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a holiday
 */
const deleteHariLibur = async (req, res, next) => {
  try {
    const { id } = validate(hariLiburIdValidation, req.params);
    const result = await hariLiburService.deleteHariLibur(id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check if a date is a holiday
 */
const checkHariLibur = async (req, res, next) => {
  try {
    const { tanggal } = validate(checkHariLiburValidation, {
      tanggal: req.query.tanggal,
    });

    const result = await hariLiburService.checkHariLibur(tanggal);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate working days between two dates
 */
const hitungHariKerja = async (req, res, next) => {
  try {
    const { dari, sampai } = validate(hitungHariKerjaValidation, {
      dari: req.query.dari,
      sampai: req.query.sampai,
    });

    const result = await hariLiburService.hitungHariKerja(dari, sampai);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHariLibur,
  createHariLibur,
  importHariLibur,
  deleteHariLibur,
  checkHariLibur,
  hitungHariKerja,
};
