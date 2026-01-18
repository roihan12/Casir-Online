const produkMasterService = require("../services/produkMasterService");
const { validate } = require("../middleware/validationMiddleware");
const {
  CreateProdukMasterValidation,
  UpdateProdukMasterValidation,
} = require("../validation/produkMasterValidation");

const getAllProdukMaster = async (req, res, next) => {
  try {
    const { search, kategoriId, status, page, limit } = req.query;

    const result = await produkMasterService.getAllProdukMaster({
      search,
      kategoriId,
      status,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

const getProdukMasterById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const produkMaster = await produkMasterService.getProdukMasterById(id);

    if (!produkMaster) {
      return res.status(404).json({
        success: false,
        message: "Master product not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: produkMaster,
    });
  } catch (error) {
    next(error);
  }
};

const createProdukMaster = async (req, res, next) => {
  try {
    const produkData = req.body;
    const images = req.files;

    // Check if SKU already exists
    const existingSku = await produkMasterService.getProdukMasterBySku(
      produkData.sku
    );
    if (existingSku) {
      return res.status(400).json({
        success: false,
        message: "SKU already exists",
      });
    }

    const newProdukMaster = await produkMasterService.createProdukMaster(
      produkData,
      images,
      { userId: req.user.id, ipAddress: req.ip }
    );

    return res.status(201).json({
      success: true,
      message: "Master product created successfully",
      data: newProdukMaster,
    });
  } catch (error) {
    next(error);
  }
};

const updateProdukMaster = async (req, res, next) => {
  try {
    const { id } = req.params;
    const produkData = req.body;
    const images = req.files;

    // Check if product exists
    const existingProduct = await produkMasterService.getProdukMasterById(id);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Master product not found",
      });
    }

    // If SKU is being updated, check if it already exists
    if (produkData.sku && produkData.sku !== existingProduct.sku) {
      const existingSku = await produkMasterService.getProdukMasterBySku(
        produkData.sku
      );
      if (existingSku) {
        return res.status(400).json({
          success: false,
          message: "SKU already exists",
        });
      }
    }

    const updatedProdukMaster = await produkMasterService.updateProdukMaster(
      id,
      produkData,
      images,
      { userId: req.user.id, ipAddress: req.ip }
    );

    return res.status(200).json({
      success: true,
      message: "Master product updated successfully",
      data: updatedProdukMaster,
    });
  } catch (error) {
    next(error);
  }
};

const deleteProdukMaster = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const existingProduct = await produkMasterService.getProdukMasterById(id);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Master product not found",
      });
    }

    await produkMasterService.deleteProdukMaster(id, {
      userId: req.user.id,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: "Master product deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const uploadProdukImages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const images = req.files;

    const newProdukMaster = await produkMasterService.uploadProdukImages(
      id,
      images,
      { userId: req.user.id, ipAddress: req.ip }
    );

    return res.status(201).json({
      success: true,
      message: "Master product images created successfully",
      data: newProdukMaster,
    });
  } catch (error) {
    next(error);
  }
};

const deleteProdukMasterImages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { imageId } = req.params;

    // Check if product exists
    const existingProduct = await produkMasterService.getProdukMasterById(id);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Master product not found",
      });
    }

    await produkMasterService.deleteProdukImage(imageId);

    return res.status(200).json({
      success: true,
      message: "Master product images deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllProdukMaster,
  getProdukMasterById,
  createProdukMaster: [
    validate(CreateProdukMasterValidation),
    createProdukMaster,
  ],
  updateProdukMaster: [
    validate(UpdateProdukMasterValidation),
    updateProdukMaster,
  ],
  deleteProdukMaster,
  uploadProdukImages,
  deleteProdukMasterImages,
};
