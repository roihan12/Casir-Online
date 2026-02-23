const {
  previewImportProduk,
  importProduk,
  generateProdukTemplate,
} = require("../services/importProdukService");

/**
 * GET /api/import/produk/template
 * Download template Excel untuk import Produk
 */
const downloadTemplate = async (req, res, next) => {
  try {
    const buffer = await generateProdukTemplate();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="template_produk_${Date.now()}.xlsx"`
    );
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/import/produk/preview
 * Validasi & preview data produk sebelum import
 * Body: { cabangId }
 */
const previewImport = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "File tidak ditemukan. Harap upload file Excel atau CSV.",
      });
    }

    const { cabangId } = req.body;
    if (!cabangId) {
      return res.status(400).json({
        success: false,
        message: "cabangId wajib diisi",
      });
    }

    const result = await previewImportProduk(
      req.file.buffer,
      req.file.mimetype,
      cabangId
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
 * POST /api/import/produk
 * Proses import Produk untuk satu cabang
 * Body: { cabangId }
 */
const importData = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "File tidak ditemukan. Harap upload file Excel atau CSV.",
      });
    }

    const { cabangId } = req.body;
    if (!cabangId) {
      return res.status(400).json({
        success: false,
        message: "cabangId wajib diisi",
      });
    }

    const userId = req.user?.id || null;
    const userName = req.user?.username || req.user?.namaLengkap || "system";
    const ipAddress = req.ip;

    const result = await importProduk(req.file.buffer, req.file.mimetype, cabangId, {
      userId,
      userName,
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
