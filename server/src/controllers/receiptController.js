
const receiptService = require("../services/receiptService");
const { ResponseError } = require("../error/responseError");
const { validate } = require("../validation/validation");
const {
  emailReceiptValidation,
  updateReceiptConfigValidation,
} = require("../validation/receiptValidation");

/**
 * Controller to get receipt preview
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 * @returns {Promise<void>}
 */
const getReceiptPreview = async (req, res, next) => {
  try {
    const transaksiId = req.params.transaksiId;
    const format = req.query.format || "html"; // "html" or "pdf"
    const paperType = req.query.paperType || "thermal"; // "thermal" or "a4"
    const paperWidth =
      parseInt(req.query.paperWidth) || (paperType === "thermal" ? 80 : 210);
    const language = req.query.language || "id";

    if (!transaksiId) {
      throw new ResponseError(400, "transaksiId diperlukan");
    }

    const result = await receiptService.getReceiptPreview(transaksiId, {
      format,
      paperType,
      paperWidth,
      language,
    });

    // Set response headers based on format
    res.setHeader("Content-Type", result.contentType);

    if (format === "pdf") {
      res.setHeader(
        "Content-Disposition",
        `inline; filename="receipt-${transaksiId}.pdf"`
      );
      return res.send(result.pdf);
    } else {
      return res.send(result.html);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to get receipt configuration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 * @returns {Promise<void>}
 */
const getReceiptConfig = async (req, res, next) => {
  try {
    const cabangId = req.params.cabangId;

    if (!cabangId) {
      throw new ResponseError(400, "cabangId diperlukan");
    }

    const result = await receiptService.getOrCreateReceiptConfig(cabangId);

    res.status(200).json({
      status: true,
      message: "Konfigurasi cetak struk berhasil diambil",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to update receipt configuration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 * @returns {Promise<void>}
 */
const updateReceiptConfig = async (req, res, next) => {
  try {
    const cabangId = req.params.cabangId;
    const request = validate(updateReceiptConfigValidation, req.body);

    if (!cabangId) {
      throw new ResponseError(400, "cabangId diperlukan");
    }

    const result = await receiptService.updateReceiptConfig(cabangId, request);

    res.status(200).json({
      status: true,
      message: "Konfigurasi cetak struk berhasil diperbarui",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to send receipt by email
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 * @returns {Promise<void>}
 */
const sendReceiptByEmail = async (req, res, next) => {
  try {
    const request = validate(emailReceiptValidation, req.body);

    // Get user information for audit log
    const userId = req.user?.id || "system";
    const ipAddress = req.ip || req.socket.remoteAddress || "unknown";

    const result = await receiptService.sendReceiptByEmail(request, {
      userId,
      ipAddress,
    });

    res.status(200).json({
      status: true,
      message: "Struk berhasil dikirim via email",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to get transaction data for receipt (JSON format)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 * @returns {Promise<void>}
 */
const getTransactionData = async (req, res, next) => {
  try {
    const transaksiId = req.params.transaksiId;

    if (!transaksiId) {
      throw new ResponseError(400, "transaksiId diperlukan");
    }

    const data = await receiptService.getTransactionDataForReceipt(transaksiId);

    res.status(200).json({
      status: true,
      message: "Data struk berhasil diambil",
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to send receipt by WhatsApp
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 * @returns {Promise<void>}
 */
const sendReceiptByWhatsapp = async (req, res, next) => {
  try {
    // Basic validation
    const { transaksiId, phone, message } = req.body;
    if (!transaksiId || !phone) {
        throw new ResponseError(400, "transaksiId dan phone diperlukan");
    }

    // Get user information for audit log
    const userId = req.user?.id || "system";
    const ipAddress = req.ip || req.socket.remoteAddress || "unknown";

    const result = await receiptService.sendReceiptByWhatsapp({
        transaksiId,
        phone,
        message
    }, {
      userId,
      ipAddress,
    });

    res.status(200).json({
      status: true,
      message: "Struk berhasil dikirim via WhatsApp",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReceiptPreview,
  getReceiptConfig,
  updateReceiptConfig,
  sendReceiptByEmail,
  sendReceiptByWhatsapp,
  getTransactionData,
};
