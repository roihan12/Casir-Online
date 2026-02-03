const pelangganService = require("../services/pelangganService");

const createPelanggan = async (req, res, next) => {
  try {
    const pelangganData = req.body;

    const result = await pelangganService.createPelanggan(pelangganData, {
      userId: req.user.id,
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: "Pelanggan created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updatePelanggan = async (req, res, next) => {
  try {
    const result = await pelangganService.updatePelanggan(
      req.params.id,
      req.body,
      { userId: req.user.id, ipAddress: req.ip }
    );

    return res.status(200).json({
      success: true,
      message: "Pelanggan updated successfully",
      data: result,
    });
  } catch (error) {
   next(error);
  }
};

const deletePelanggan = async (req, res, next) => {
  try {
    const result = await pelangganService.deletePelanggan(req.params.id, {
      userId: req.user.id,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: "Pelanggan deleted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getAllPelanggan = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = "", cabang_id } = req.query;
    const result = await pelangganService.getAllPelanggan({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      cabang_id,
    });

    return res.status(200).json({
      success: true,
      message: "Get all pelanggan successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getPelangganById = async (req, res, next) => {
  try {
    const pelanggan = await pelangganService.getPelangganById(req.params.id);
    return res.status(200).json({
      success: true,
      message: "Get pelanggan by id successfully",
      data: pelanggan,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPelanggan,
  updatePelanggan,
  deletePelanggan,
  getAllPelanggan,
  getPelangganById,
};
