const {
  previewImportProdukMaster,
  importProdukMaster,
  generateProdukMasterTemplate,
} = require("../services/importProdukMasterService");

/**
 * GET /api/import/produk-master/template
 * Download template Excel untuk import ProdukMaster
 */
const downloadTemplate = async (req, res, next) => {
  try {
    const buffer = await generateProdukMasterTemplate();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="template_produk_master_${Date.now()}.xlsx"`
    );
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/import/produk-master/preview
 * Validasi & preview data tanpa menyimpan ke DB
 */
const previewImport = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "File tidak ditemukan. Harap upload file Excel atau CSV.",
      });
    }

    const result = await previewImportProdukMaster(
      req.file.buffer,
      req.file.mimetype
    );

    res.status(200).json({
      success: true,
      message: "Preview berhasil dibuat",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/import/produk-master
 * Proses import data ProdukMaster dari file
 */
const importData = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "File tidak ditemukan. Harap upload file Excel atau CSV.",
      });
    }

    const { userId, ipAddress } = req.user
      ? { userId: req.user.id, ipAddress: req.ip }
      : { userId: null, ipAddress: req.ip };

    const result = await importProdukMaster(req.file.buffer, req.file.mimetype, {
      userId,
      ipAddress,
    });

    const hasErrors = result.gagal > 0;
    res.status(hasErrors ? 207 : 200).json({
      success: true,
      message: `Import selesai: ${result.berhasil} berhasil, ${result.dilewati} dilewati, ${result.gagal} gagal`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  downloadTemplate,
  previewImport,
  importData,
};
