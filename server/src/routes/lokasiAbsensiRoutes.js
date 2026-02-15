const express = require("express");
const router = express.Router();
const {
  createLocation,
  updateLocation,
  deleteLocation,
  getLocationById,
  getLocations,
  assignUserToLocation,
  unassignUserFromLocation,
  getLocationUsers,
  getUserLocations
} = require("../services/lokasiAbsensiService");
const { authenticate } = require("../middleware/authMiddleware");
const Joi = require("joi");
const { validate } = require("../validation/validation");

/**
 * Validation schemas
 */
const createLocationValidation = Joi.object({
  nama: Joi.string().min(3).max(100).required(),
  alamat: Joi.string().min(5).max(255).required(),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  radius: Joi.number().min(1).max(1000).required(),
  cabangId: Joi.string().required(),
  minFaceMatchScore: Joi.number().min(0).max(1).default(0.6).optional(),
  isRequireAssignment: Joi.boolean().default(false).optional(),
  requireFaceRecognition: Joi.boolean().default(false).optional(),
  isActive: Joi.boolean().default(true).optional()
});

const updateLocationValidation = Joi.object({
  nama: Joi.string().min(3).max(100).optional(),
  alamat: Joi.string().min(5).max(255).optional(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  radius: Joi.number().min(1).max(1000).optional(),
  isRequireAssignment: Joi.boolean().optional(),
  requireFaceRecognition: Joi.boolean().optional(),
  isActive: Joi.boolean().optional()
});

const assignUserValidation = Joi.object({
  userId: Joi.string().uuid().required(),
  lokasiAbsensiId: Joi.string().uuid().required(),
  isDefault: Joi.boolean().default(false).optional()
});

/**
 * Attendance Location Routes
 * Base path: /api/attendance-locations
 */

// Get all locations (with filters)
router.get("/", authenticate, async (req, res, next) => {
  try {
    const filters = {
      cabangId: req.query.cabangId || req.user?.cabangId,
      isActive: req.query.isActive,
      search: req.query.search
    };

    const result = await getLocations(filters);
    return res.status(200).json({
      status: true,
      message: "Locations retrieved",
      data: result,
    });

  } catch (error) {
    next(error);
  }
});

// Get locations for current user
router.get("/my-locations", authenticate, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const cabangId = req.user?.cabangId;

    const result = await getUserLocations(userId, cabangId);
    return res.status(200).json({
      status: true,
      message: "User locations retrieved",
      data: result,
    });

  } catch (error) {
    next(error);
  }
});

// Get location by ID
router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const result = await getLocationById(req.params.id);
    return res.status(200).json({
      status: true,
      message: "Location retrieved",
      data: result,
    });

  } catch (error) {
    next(error);
  }
});

// Get users assigned to a location
router.get("/:id/users", authenticate, async (req, res, next) => {
  try {
    const result = await getLocationUsers(req.params.id);
    return res.status(200).json({
      status: true,
      message: "Location users retrieved",
      data: result,
    });

  } catch (error) {
    next(error);
  }
});

// Create new location
router.post("/", authenticate, async (req, res, next) => {
  try {
    const validatedData = await validate(createLocationValidation, req.body);
    const result = await createLocation(validatedData);
    return res.status(201).json({
      status: true,
      message: "Location created successfully",
      data: result,
    });

  } catch (error) {
    next(error);
  }
});

// Update location
router.put("/:id", authenticate, async (req, res, next) => {
  try {
    const validatedData = await validate(updateLocationValidation, req.body);
    const result = await updateLocation(req.params.id, validatedData);
    return res.status(200).json({
      status: true,
      message: "Location updated successfully",
      data: result,
    });

  } catch (error) {
    next(error);
  }
});

// Delete location
router.delete("/:id", authenticate, async (req, res, next) => {
  try {
    const result = await deleteLocation(req.params.id);
    return res.status(200).json({
      status: true,
      message: "Location deleted successfully",
      data: result,
    });

  } catch (error) {
    next(error);
  }
});

// Assign user to location
router.post("/assign", authenticate, async (req, res, next) => {
  try {
    const validatedData = await validate(assignUserValidation, req.body);
    const result = await assignUserToLocation(validatedData);
    return res.status(201).json({
      status: true,
      message: "User assigned to location successfully",
      data: result,
    });

  } catch (error) {
    next(error);
  }
});

// Unassign user from location
router.post("/unassign", authenticate, async (req, res, next) => {
  try {
    const validatedData = await validate(assignUserValidation, req.body);
    const result = await unassignUserFromLocation(validatedData.userId, validatedData.lokasiAbsensiId);
    return res.status(200).json({
      status: true,
      message: "User unassigned from location successfully",
      data: result,
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
