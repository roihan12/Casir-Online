const cabangService = require("../services/cabangService");
const { logger } = require("../utils/logger");


const getAllCabang = async (req, res, next) => {
  try {
    const { user } = req;
    const pageXOffset = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    logger.info(pageXOffset, limit);
    
    const cabangList = await cabangService.getAllCabang(user.id, pageXOffset, limit);

    return res.status(200).json({
      success: true,
      data: cabangList.data,
      pagination: cabangList.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getCabangByUserId = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user.id;
    const cabangList = await cabangService.getCabangByUserId(userId);

    return res.status(200).json({
      success: true,
      data: cabangList,
    });
  } catch (error) {
    next(error);
  }
};

const getCabangById = async (req, res, next) => {
  try {
    const { cabangId } = req.params;
    const cabang = await cabangService.getCabangById(cabangId);

    if (!cabang) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: cabang,
    });
  } catch (error) {
    next(error);
  }
};

const createCabang = async (req, res, next) => {
  try {
    const cabangData = req.body;
    const newCabang = await cabangService.createCabang(cabangData);

    return res.status(201).json({
      success: true,
      message: "Branch created successfully",
      data: newCabang,
    });
  } catch (error) {
    next(error);
  }
};

const updateCabang = async (req, res, next) => {
  try {
    const { cabangId } = req.params;
    const cabangData = req.body;

    const updatedCabang = await cabangService.updateCabang(
      cabangId,
      cabangData
    );

    return res.status(200).json({
      success: true,
      message: "Branch updated successfully",
      data: updatedCabang,
    });
  } catch (error) {
    next(error);
  }
};

const deleteCabang = async (req, res, next) => {
  try {
    const { cabangId } = req.params;

    await cabangService.deleteCabang(cabangId);

    return res.status(200).json({
      success: true,
      message: "Branch deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const getMapOverview = async (req, res, next) => {
  try {
    const { user } = req;
    const mapData = await cabangService.getMapOverview(user.id);

    return res.status(200).json({
      success: true,
      data: mapData,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCabang,
  getCabangById,
  createCabang,
  updateCabang,
  deleteCabang,
  getCabangByUserId,
  getMapOverview,
};
