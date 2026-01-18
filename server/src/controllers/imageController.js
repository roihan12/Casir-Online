// controllers/imageController.js
const produkMasterService = require("../services/produkMasterService");

const uploadProdukImage = async (req, res) => {
  try {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "No image file uploaded",
      });
    }

    const result = await produkMasterService.uploadProdukImage(id, file);

    return res.status(201).json({
      success: true,
      message: "Image uploaded successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to upload image",
    });
  }
};

const setPrimaryImage = async (req, res) => {
  try {
    const { productId, imageId } = req.params;

    const result = await produkMasterService.setPrimaryImage(
      imageId,
      productId
    );

    return res.status(200).json({
      success: true,
      message: "Primary image set successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to set primary image",
    });
  }
};

const deleteImage = async (req, res) => {
  try {
    const { imageId } = req.params;

    await produkMasterService.deleteImage(imageId);

    return res.status(200).json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete image",
    });
  }
};

module.exports = {
  uploadProdukImage,
  setPrimaryImage,
  deleteImage,
};
