const produkRequestService = require("../services/produkRequestService");
const { validate } = require("../middleware/validationMiddleware");
const {
  createProdukRequestValidation,
  updateProdukRequestValidation,
  processRequestValidation,
  queryProdukRequestValidation,
} = require("../validation/produkRequestValidation");

// Get all product requests with filtering
const getAllProdukRequests = async (req, res, next) => {
  try {
    const { search, cabangId, requestType, status, prioritas, page, limit } =
      req.query;

    const result = await produkRequestService.getAllProdukRequests({
      search,
      cabangId,
      requestType,
      status,
      prioritas,
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

// Get a product request by ID
const getProdukRequestById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const produkRequest = await produkRequestService.getProdukRequestById(id);

    if (!produkRequest) {
      return res.status(404).json({
        success: false,
        message: "Product request not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: produkRequest,
    });
  } catch (error) {
    next(error);
  }
};

// Create a new product request
const createProdukRequest = async (req, res, next) => {
  try {
    const requestData = req.body;
    const files = req.files || [];

    const newProdukRequest = await produkRequestService.createProdukRequest(
      requestData,
      files,
      { userId: req.user.id, ipAddress: req.ip }
    );

    return res.status(201).json({
      success: true,
      message: "Product request created successfully",
      data: newProdukRequest,
    });
  } catch (error) {
    next(error);
  }
};

// Submit a product request (change from draft to submitted)
const submitProdukRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    const submittedRequest = await produkRequestService.submitProdukRequest(
      id,
      { userId: req.user.id, ipAddress: req.ip }
    );

    return res.status(200).json({
      success: true,
      message: "Product request submitted successfully",
      data: submittedRequest,
    });
  } catch (error) {
    next(error);
  }
};

// Update an existing product request
const updateProdukRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const requestData = req.body;
    const files = req.files || [];

    // Check if request exists
    const existingRequest = await produkRequestService.getProdukRequestById(id);
    if (!existingRequest) {
      return res.status(404).json({
        success: false,
        message: "Product request not found",
      });
    }

    const updatedRequest = await produkRequestService.updateProdukRequest(
      id,
      requestData,
      files,
      { userId: req.user.id, ipAddress: req.ip }
    );

    return res.status(200).json({
      success: true,
      message: "Product request updated successfully",
      data: updatedRequest,
    });
  } catch (error) {
    next(error);
  }
};

// Process a request (approve or reject)
const processRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isApproved, catatan } = req.body;

    const processedRequest = await produkRequestService.processRequest(id, {
      isApproved,
      catatan,
      userId: req.user.id,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: isApproved
        ? "Request approved successfully"
        : "Request rejected",
      data: processedRequest,
    });
  } catch (error) {
    next(error);
  }
};

// Mark a product request as completed
const completeProdukRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    const completedRequest = await produkRequestService.completeProdukRequest(
      id,
      { userId: req.user.id, ipAddress: req.ip }
    );

    return res.status(200).json({
      success: true,
      message: "Product request marked as completed",
      data: completedRequest,
    });
  } catch (error) {
    next(error);
  }
};

// Delete a product request
const deleteProdukRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    await produkRequestService.deleteProdukRequest(id, {
      userId: req.user.id,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: "Product request deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Delete an attachment
const deleteRequestAttachment = async (req, res, next) => {
  try {
    const { attachmentId } = req.params;

    await produkRequestService.deleteRequestAttachment(attachmentId, {
      userId: req.user.id,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: "Attachment deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Get analytics for product requests
const getProdukRequestAnalytics = async (req, res, next) => {
  try {
    const { cabangId, period } = req.query;

    const analytics = await produkRequestService.getProdukRequestAnalytics(
      cabangId,
      period
    );

    return res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllProdukRequests,
  getProdukRequestById,
  createProdukRequest: [
    validate(createProdukRequestValidation),
    createProdukRequest,
  ],
  submitProdukRequest,
  updateProdukRequest: [
    validate(updateProdukRequestValidation),
    updateProdukRequest,
  ],
  processRequest: [validate(processRequestValidation), processRequest],
  completeProdukRequest,
  deleteProdukRequest,
  deleteRequestAttachment,
  getProdukRequestAnalytics,
};
