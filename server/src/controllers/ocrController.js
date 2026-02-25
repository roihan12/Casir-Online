const ocrService = require("../services/ocrService");
const invoiceMappingService = require("../services/invoiceMappingService");
const { ResponseError } = require("../error/responseError");

const extractInvoice = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ResponseError(400, "Tidak ada gambar yang diunggah");
    }

    const fileBuffer = req.file.buffer;
    const mimeType = req.file.mimetype;

    const extractedData = await ocrService.extractInvoiceOCR(fileBuffer, mimeType);

    res.status(200).json({
      status: true,
      message: "Berhasil mengekstrak data invoice dari gambar",
      data: extractedData,
    });
  } catch (error) {
    next(error);
  }
};

const mapInvoice = async (req, res, next) => {
  try {
    const ocrData = req.body.ocrData;
    const { cabangId } = req.user; // Ambil dari token login

    if (!ocrData) {
      throw new ResponseError(400, "Data OCR tidak valid");
    }

    const mappedData = await invoiceMappingService.mapInvoiceData(ocrData, cabangId);

    res.status(200).json({
      status: true,
      message: "Berhasil memetakan data invoice",
      data: mappedData,
    });
  } catch (error) {
    next(error);
  }
};

const saveInvoiceMapping = async (req, res, next) => {
  try {
    const { supplierId, produkMasterId, namaInvoiceProduk, hargaBeli } = req.body;
    const { userId, cabangId } = req.user; // Ambil dari token login

    if (!supplierId || !produkMasterId || !namaInvoiceProduk) {
      throw new ResponseError(400, "Data request tidak lengkap");
    }

    const mapping = await invoiceMappingService.saveMapping(
      supplierId,
      produkMasterId,
      namaInvoiceProduk,
      hargaBeli,
      userId,
      cabangId
    );

    res.status(200).json({
      status: true,
      message: "Berhasil menyimpan mapping produk",
      data: mapping,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  extractInvoice,
  mapInvoice,
  saveInvoiceMapping,
};
