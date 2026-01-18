const kategoriService = require("../services/kategoriService");

const getAllKategori = async (req, res, next) => {
  try {
    const kategoriList = await kategoriService.getAllKategori();

    return res.status(200).json({
      success: true,
      data: kategoriList,
    });
  } catch (error) {
    next(error);
  }
};

const getKategoriById = async (req, res, next) => {
  try {
    const { kategoriId } = req.params;
    const kategori = await kategoriService.getKategoriById(kategoriId);

    if (!kategori) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: kategori,
    });
  } catch (error) {
    next(error);
  }
};

const createKategori = async (req, res, next) => {
  try {
    const kategoriData = req.body;
    const newKategori = await kategoriService.createKategori(kategoriData);

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: newKategori,
    });
  } catch (error) {
    next(error);
  }
};

const updateKategori = async (req, res, next) => {
  try {
    const { kategoriId } = req.params;
    const categoryData = req.body;

    const updatedCategory = await kategoriService.updateKategori(
      kategoriId,
      categoryData
    );

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: updatedCategory,
    });
  } catch (error) {
    next(error);
  }
};

const deleteKategori = async (req, res, next) => {
  try {
    const { kategoriId } = req.params;

    await kategoriService.deleteKategori(kategoriId);

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllKategori,
  getKategoriById,
  createKategori,
  updateKategori,
  deleteKategori,
};
