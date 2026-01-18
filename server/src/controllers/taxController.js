const taxService = require("../services/taxService");
const { ResponseError } = require("../error/responseError");
const { validate } = require("../validation/validation");
const { taxConfigSchema } = require("../validation/taxValidation");

// Get tax configuration for a branch
const getTaxConfig = async (req, res, next) => {
  try {
    const cabangId = req.params.cabangId;

    if (!cabangId) {
      throw new ResponseError(400, "cabangId is required");
    }

    const taxConfig = await taxService.getTaxConfig(cabangId);

    res.status(200).json({
      status: "success",
      data: taxConfig,
    });
  } catch (error) {
    next(error);
  }
};

// Update tax configuration for a branch
const updateTaxConfig = async (req, res, next) => {
  try {
    const cabangId = req.params.cabangId;

    if (!cabangId) {
      throw new ResponseError(400, "cabangId is required");
    }

    // Validate request body
    const taxConfig = validate(req.body, taxConfigSchema);

    // Add audit info
    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip,
    };

    const updatedConfig = await taxService.updateTaxConfig(
      cabangId,
      taxConfig,
      auditInfo
    );

    res.status(200).json({
      status: "success",
      data: updatedConfig,
      message: "Tax configuration updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Calculate tax for an amount
const calculateTax = async (req, res, next) => {
  try {
    const { amount, cabangId } = req.body;

    if (!amount || !cabangId) {
      throw new ResponseError(400, "amount and cabangId are required");
    }

    if (isNaN(amount) || amount < 0) {
      throw new ResponseError(400, "amount must be a positive number");
    }

    const taxAmount = await taxService.calculateTax(amount, cabangId);

    res.status(200).json({
      status: "success",
      data: {
        amount: parseFloat(amount),
        tax_amount: taxAmount,
        total_amount: parseFloat(amount) + taxAmount,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTaxConfig,
  updateTaxConfig,
  calculateTax,
};
