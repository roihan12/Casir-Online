const penggajianService = require("../services/penggajianService");
const slipGajiService = require("../services/slipGajiService");
const { validate } = require("../validation/validation");
const {
  createKomponenGajiValidation,
  updateKomponenGajiValidation,
  getKomponenGajiValidation,
  komponenIdValidation,
  createTunjanganValidation,
  updateTunjanganValidation,
  getTunjanganValidation,
  tunjanganIdValidation,
  updateGajiPegawaiValidation,
  gajiPegawaiIdValidation,
  getRiwayatGajiValidation,
  generateSlipGajiValidation,
  getSlipGajiValidation,
  finalizeSlipValidation,
  slipIdValidation,
} = require("../validation/penggajianValidation");

// ===================================================================
// T-17: KOMPONEN GAJI CONTROLLERS
// ===================================================================

const createKomponenGaji = async (req, res, next) => {
  try {
    const request = validate(createKomponenGajiValidation, req.body);
    const auditInfo = { userId: req.user.id, ipAddress: req.ip || req.socket.remoteAddress };
    const result = await penggajianService.createKomponenGaji(request, auditInfo);

    res.status(201).json({ success: true, message: "Komponen gaji berhasil dibuat", data: result });
  } catch (error) {
    next(error);
  }
};

const getKomponenGaji = async (req, res, next) => {
  try {
    const filters = validate(getKomponenGajiValidation, {
      tipe: req.query.tipe,
      isActive: req.query.isActive === "true" ? true : req.query.isActive === "false" ? false : undefined,
      search: req.query.search,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
    });
    const result = await penggajianService.getKomponenGaji(filters);

    res.status(200).json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) {
    next(error);
  }
};

const getKomponenGajiById = async (req, res, next) => {
  try {
    const { id } = validate(komponenIdValidation, req.params);
    const result = await penggajianService.getKomponenGajiById(id);

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const updateKomponenGaji = async (req, res, next) => {
  try {
    const { id } = validate(komponenIdValidation, req.params);
    const request = validate(updateKomponenGajiValidation, req.body);
    const auditInfo = { userId: req.user.id, ipAddress: req.ip || req.socket.remoteAddress };
    const result = await penggajianService.updateKomponenGaji(id, request, auditInfo);

    res.status(200).json({ success: true, message: "Komponen gaji berhasil diupdate", data: result });
  } catch (error) {
    next(error);
  }
};

const deleteKomponenGaji = async (req, res, next) => {
  try {
    const { id } = validate(komponenIdValidation, req.params);
    const auditInfo = { userId: req.user.id, ipAddress: req.ip || req.socket.remoteAddress };
    const result = await penggajianService.deleteKomponenGaji(id, auditInfo);

    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};

// ===================================================================
// T-18: TUNJANGAN PEGAWAI CONTROLLERS
// ===================================================================

const createTunjangan = async (req, res, next) => {
  try {
    const request = validate(createTunjanganValidation, req.body);
    const auditInfo = { userId: req.user.id, ipAddress: req.ip || req.socket.remoteAddress };
    const result = await penggajianService.createTunjangan(request, auditInfo);

    res.status(201).json({ success: true, message: "Tunjangan berhasil ditambahkan", data: result });
  } catch (error) {
    next(error);
  }
};

const getTunjangan = async (req, res, next) => {
  try {
    const filters = validate(getTunjanganValidation, {
      userId: req.query.userId,
      komponenId: req.query.komponenId,
      isActive: req.query.isActive === "true" ? true : req.query.isActive === "false" ? false : undefined,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
    });
    const result = await penggajianService.getTunjangan(filters);

    res.status(200).json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) {
    next(error);
  }
};

const updateTunjangan = async (req, res, next) => {
  try {
    const { id } = validate(tunjanganIdValidation, req.params);
    const request = validate(updateTunjanganValidation, req.body);
    const auditInfo = { userId: req.user.id, ipAddress: req.ip || req.socket.remoteAddress };
    const result = await penggajianService.updateTunjangan(id, request, auditInfo);

    res.status(200).json({ success: true, message: "Tunjangan berhasil diupdate", data: result });
  } catch (error) {
    next(error);
  }
};

const deleteTunjangan = async (req, res, next) => {
  try {
    const { id } = validate(tunjanganIdValidation, req.params);
    const auditInfo = { userId: req.user.id, ipAddress: req.ip || req.socket.remoteAddress };
    const result = await penggajianService.deleteTunjangan(id, auditInfo);

    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};

// ===================================================================
// T-19: GAJI PEGAWAI + RIWAYAT CONTROLLERS
// ===================================================================

const getGajiPegawai = async (req, res, next) => {
  try {
    const { userId } = validate(gajiPegawaiIdValidation, req.params);
    const result = await penggajianService.getGajiPegawai(userId);

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const updateGajiPegawai = async (req, res, next) => {
  try {
    const { userId } = validate(gajiPegawaiIdValidation, req.params);
    const request = validate(updateGajiPegawaiValidation, req.body);
    const auditInfo = { userId: req.user.id, ipAddress: req.ip || req.socket.remoteAddress };
    const result = await penggajianService.updateGajiPegawai(userId, request, auditInfo);

    res.status(200).json({ success: true, message: "Gaji pegawai berhasil diupdate", data: result });
  } catch (error) {
    next(error);
  }
};

const getRiwayatGaji = async (req, res, next) => {
  try {
    const { userId } = validate(gajiPegawaiIdValidation, req.params);
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
    };
    const result = await penggajianService.getRiwayatGaji(userId, filters);

    res.status(200).json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) {
    next(error);
  }
};

// ===================================================================
// T-20/T-21: SLIP GAJI CONTROLLERS
// ===================================================================

const generateSlipGaji = async (req, res, next) => {
  try {
    const request = validate(generateSlipGajiValidation, req.body);
    const auditInfo = { userId: req.user.id, ipAddress: req.ip || req.socket.remoteAddress };
    const result = await slipGajiService.generateSlipGaji(request, auditInfo);

    res.status(201).json({ success: true, message: "Slip gaji berhasil di-generate", data: result });
  } catch (error) {
    next(error);
  }
};

const getSlipGaji = async (req, res, next) => {
  try {
    const filters = validate(getSlipGajiValidation, {
      userId: req.query.userId,
      cabangId: req.query.cabangId,
      periode: req.query.periode,
      status: req.query.status,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
    });
    const result = await slipGajiService.getSlipGaji(filters);

    res.status(200).json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) {
    next(error);
  }
};

const getSlipGajiById = async (req, res, next) => {
  try {
    const { id } = validate(slipIdValidation, req.params);
    const result = await slipGajiService.getSlipGajiById(id);

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const finalizeSlipGaji = async (req, res, next) => {
  try {
    const { id } = validate(slipIdValidation, req.params);
    const request = validate(finalizeSlipValidation, req.body);
    const auditInfo = { userId: req.user.id, ipAddress: req.ip || req.socket.remoteAddress };
    const result = await slipGajiService.finalizeSlipGaji(id, request, auditInfo);

    res.status(200).json({ success: true, message: "Slip gaji berhasil di-finalize", data: result });
  } catch (error) {
    next(error);
  }
};

const batchFinalizeSlipGaji = async (req, res, next) => {
  try {
    const { periode, cabangId } = req.body;
    if (!periode || !cabangId) {
      return res.status(400).json({ success: false, message: "periode dan cabangId wajib diisi" });
    }
    const auditInfo = { userId: req.user.id, ipAddress: req.ip || req.socket.remoteAddress };
    const result = await slipGajiService.batchFinalizeSlipGaji(periode, cabangId, auditInfo);

    res.status(200).json({ success: true, message: "Batch finalize berhasil", data: result });
  } catch (error) {
    next(error);
  }
};

const deleteSlipGaji = async (req, res, next) => {
  try {
    const { id } = validate(slipIdValidation, req.params);
    const auditInfo = { userId: req.user.id, ipAddress: req.ip || req.socket.remoteAddress };
    const result = await slipGajiService.deleteSlipGaji(id, auditInfo);

    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};

const getMySlipGaji = async (req, res, next) => {
  try {
    const filters = {
      periode: req.query.periode,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 12,
    };
    const result = await slipGajiService.getMySlipGaji(req.user.id, filters);

    res.status(200).json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // T-17
  createKomponenGaji,
  getKomponenGaji,
  getKomponenGajiById,
  updateKomponenGaji,
  deleteKomponenGaji,
  // T-18
  createTunjangan,
  getTunjangan,
  updateTunjangan,
  deleteTunjangan,
  // T-19
  getGajiPegawai,
  updateGajiPegawai,
  getRiwayatGaji,
  // T-20/T-21
  generateSlipGaji,
  getSlipGaji,
  getSlipGajiById,
  finalizeSlipGaji,
  batchFinalizeSlipGaji,
  deleteSlipGaji,
  getMySlipGaji,
};
