const prisma = require("../config/db");
const { ResponseError } = require("../error/responseError");

// Default tax config
const DEFAULT_TAX_CONFIG = {
  is_tax_enabled: false,
  tax_percentage: 0,
  tax_name: "PPN",
  tax_number: "",
  is_tax_included: false,
};

// Get tax configuration for a branch
const getTaxConfig = async (cabangId) => {
  // In real implementation, this would come from a tax_config table
  // For this example, we'll simulate getting it from cabang settings
  const cabang = await prisma.cabang.findUnique({
    where: { id: cabangId },
  });

  if (!cabang) {
    throw new ResponseError(404, "Cabang tidak ditemukan");
  }

  // Try to get tax config from database first
  const existingConfig = await prisma.taxConfig.findUnique({
    where: { cabang_id: cabangId },
  });

  // Return existing config if found, otherwise return default
  return existingConfig || DEFAULT_TAX_CONFIG;
};

// Update tax configuration for a branch
const updateTaxConfig = async (cabangId, taxConfig, auditInfo) => {
  // Destructure and validate tax config properties
  const {
    is_tax_enabled,
    tax_percentage,
    tax_name,
    tax_number,
    is_tax_included,
  } = taxConfig;

  // Additional validation
  if (tax_percentage < 0 || tax_percentage > 100) {
    throw new ResponseError(400, "Tax percentage must be between 0 and 100");
  }

  // Validate branch
  const cabang = await prisma.cabang.findUnique({
    where: { id: cabangId },
  });

  if (!cabang) {
    throw new ResponseError(404, "Cabang tidak ditemukan");
  }

  // Get existing config or use default
  const existingConfig =
    (await prisma.taxConfig.findUnique({
      where: { cabang_id: cabangId },
    })) || DEFAULT_TAX_CONFIG;

  // Create updated config
  const updatedConfig = {
    is_tax_enabled,
    tax_percentage,
    tax_name,
    tax_number,
    is_tax_included,
  };

  // Save to database using upsert (create if not exists, update if exists)
  const savedConfig = await prisma.taxConfig.upsert({
    where: { cabang_id: cabangId },
    update: updatedConfig,
    create: {
      cabang_id: cabangId,
      ...updatedConfig,
    },
  });

  // Log audit
  await prisma.auditLog.create({
    data: {
      user_id: auditInfo.userId,
      ip_address: auditInfo.ipAddress,
      action: "UPDATE_TAX_CONFIG",
      table_name: "tax_config",
      record_id: cabangId,
      old_values: JSON.stringify(existingConfig),
      new_values: JSON.stringify(updatedConfig),
    },
  });

  return savedConfig;
};

// Calculate tax for an amount
const calculateTax = async (amount, cabangId) => {
  const taxConfig = await getTaxConfig(cabangId);

  if (!taxConfig.is_tax_enabled) {
    return 0;
  }

  // Calculate tax amount and round to 2 decimal places
  const taxAmount =
    Math.round(((amount * taxConfig.tax_percentage) / 100) * 100) / 100;

  return taxAmount;
};


// Update tax configuration for multiple branches
const updateTaxConfigBulk = async (targetCabangIds, taxConfig, auditInfo) => {
  if (!targetCabangIds || targetCabangIds.length === 0) {
    throw new ResponseError(400, "Target branches are required");
  }

  // Validate tax config
  const {
    is_tax_enabled,
    tax_percentage,
    tax_name,
    tax_number,
    is_tax_included,
  } = taxConfig;

  if (tax_percentage < 0 || tax_percentage > 100) {
    throw new ResponseError(400, "Tax percentage must be between 0 and 100");
  }

  // Prepare updated config
  const updatedConfig = {
    is_tax_enabled,
    tax_percentage,
    tax_name,
    tax_number,
    is_tax_included,
  };

  const results = [];

  // Use transaction to ensure all updates succeed or fail together
  await prisma.$transaction(async (prisma) => {
    for (const cabangId of targetCabangIds) {
      // Check if branch exists
      const cabang = await prisma.cabang.findUnique({
        where: { id: cabangId },
      });

      if (!cabang) {
        // Skip invalid branches or throw error depending on requirement
        // For now we skip but log it
        console.warn(`Branch with ID ${cabangId} not found during bulk update`);
        continue;
      }

      // Get existing config for audit
      const existingConfig =
        (await prisma.taxConfig.findUnique({
          where: { cabang_id: cabangId },
        })) || DEFAULT_TAX_CONFIG;

      // Update or create config
      const savedConfig = await prisma.taxConfig.upsert({
        where: { cabang_id: cabangId },
        update: updatedConfig,
        create: {
          cabang_id: cabangId,
          ...updatedConfig,
        },
      });

      // Log audit
      await prisma.auditLog.create({
        data: {
          user_id: auditInfo.userId,
          ip_address: auditInfo.ipAddress,
          action: "BULK_UPDATE_TAX_CONFIG",
          table_name: "tax_config",
          record_id: cabangId,
          old_values: JSON.stringify(existingConfig),
          new_values: JSON.stringify(updatedConfig),
        },
      });

      results.push(savedConfig);
    }
  });

  return results;
};

module.exports = {
  getTaxConfig,
  updateTaxConfig,
  calculateTax,
  updateTaxConfigBulk,
};