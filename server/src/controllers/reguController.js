const reguService = require("../services/reguService");
const { validate } = require("../validation/validation");
const {
  createReguSchema,
  updateReguSchema,
  getReguSchema,
  addReguMemberSchema,
  removeReguMemberSchema,
  getReguMemberSchema,
  moveReguMemberSchema,
} = require("../validation/reguValidation");

/**
 * List semua regu dengan filter & pagination
 */
const getRegu = async (req, res, next) => {
  try {
    const validatedQuery = validate(getReguSchema, req.query);
    const result = await reguService.getRegu(validatedQuery);
    res.json({
      success: true,
      message: "Data regu berhasil diambil",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Buat regu baru
 */
const createRegu = async (req, res, next) => {
  try {

    const validatedBody = validate(createReguSchema, req.body);

    const result = await reguService.createRegu(validatedBody, req.user.id);
    res.status(201).json({
      success: true,
      message: "Regu berhasil dibuat",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Detail regu beserta anggota
 */
const getReguById = async (req, res, next) => {
  try {
    const result = await reguService.getReguById(req.params.reguId);
    res.json({
      success: true,
      message: "Detail regu berhasil diambil",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update nama/keterangan regu
 */
const updateRegu = async (req, res, next) => {
  try {

    const auditInfo = {
      userId: req.user.id,
      username: req.user.username,
    };
    const validatedBody = validate(updateReguSchema, req.body);
    const result = await reguService.updateRegu(
      req.params.reguId,
      validatedBody,
      auditInfo
    );
    res.json({
      success: true,
      message: "Regu berhasil diupdate",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Soft delete regu
 */
const deleteRegu = async (req, res, next) => {
  try {
    const auditInfo = {
      userId: req.user.id,
      username: req.user.username,
    };
    const result = await reguService.deleteRegu(req.params.reguId, auditInfo);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * List anggota regu dengan pagination
 */
const getReguMembers = async (req, res, next) => {
  try {
    const validatedQuery = validate(getReguMemberSchema, req.query);
    const result = await reguService.getReguMembers(
      req.params.reguId,
      validatedQuery
    );
    res.json({
      success: true,
      message: "Daftar anggota regu berhasil diambil",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Tambah anggota ke regu (bulk)
 */
const addReguMember = async (req, res, next) => {
  try {
    const auditInfo = {
      userId: req.user.id,
      username: req.user.username,
    };
    const validatedBody = validate(addReguMemberSchema, req.body);
    const result = await reguService.addReguMember(
      req.params.reguId,
      validatedBody,
      auditInfo
    );
    res.status(201).json({
      success: true,
      message: `${result.addedCount} anggota berhasil ditambahkan ke regu ${result.namaRegu}`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Hapus anggota dari regu (bulk)
 */
const removeReguMember = async (req, res, next) => {
  try {
    const auditInfo = {
      userId: req.user.id,
      username: req.user.username,
    };
    const validatedBody = validate(removeReguMemberSchema, req.body);
    const result = await reguService.removeReguMember(
      req.params.reguId,
      validatedBody,
      auditInfo
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Pindah anggota dari regu A ke regu B
 */
const moveReguMember = async (req, res, next) => {
  try {
    const auditInfo = {
      userId: req.user.id,
      username: req.user.username,
    };
    const validatedBody = validate(moveReguMemberSchema, req.body);
    const result = await reguService.moveReguMember(validatedBody, auditInfo);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRegu,
  createRegu,
  getReguById,
  updateRegu,
  deleteRegu,
  getReguMembers,
  addReguMember,
  removeReguMember,
  moveReguMember,
};
