const kreditRekomendasiService = require("../services/kreditRekomendasiService");
const { ResponseError } = require("../error/responseError");
const { validate } = require("../validation/validation");
const {
  createKreditRekomendasiValidation,
  approveKreditRekomendasiValidation,
  getKreditRekomendasiListValidation,
} = require("../validation/kreditRekomendasiValidation");

// Controller untuk membuat rekomendasi kredit
const createKreditRekomendasi = async (req, res, next) => {
  try {
    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip || req.socket.remoteAddress,
      userName: req.user.username,
    };
    
    const request = validate(createKreditRekomendasiValidation, req.body);
    
    const result = await kreditRekomendasiService.createKreditRekomendasi(request, auditInfo);
    
    res.status(201).json({
      status: true,
      message: "Rekomendasi kredit berhasil dibuat",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk mendapatkan rekomendasi kredit berdasarkan ID
const getKreditRekomendasiById = async (req, res, next) => {
  try {
    const rekomendasiId = req.params.id;
    
    if (!rekomendasiId) {
      throw new ResponseError(400, "ID rekomendasi diperlukan");
    }
    
    const result = await kreditRekomendasiService.getKreditRekomendasiById(rekomendasiId);
    
    res.status(200).json({
      status: true,
      message: "Berhasil mendapatkan detail rekomendasi kredit",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk mendapatkan rekomendasi kredit berdasarkan pelanggan
const getKreditRekomendasiByPelanggan = async (req, res, next) => {
  try {
    const pelangganId = req.params.pelangganId;
    
    if (!pelangganId) {
      throw new ResponseError(400, "ID pelanggan diperlukan");
    }
    
    const result = await kreditRekomendasiService.getKreditRekomendasiByPelanggan(pelangganId);
    
    res.status(200).json({
      status: true,
      message: "Berhasil mendapatkan rekomendasi kredit pelanggan",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk menyetujui atau menolak rekomendasi kredit
const approveKreditRekomendasi = async (req, res, next) => {
  try {
    const rekomendasiId = req.params.id;
    
    if (!rekomendasiId) {
      throw new ResponseError(400, "ID rekomendasi diperlukan");
    }
    
    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip || req.socket.remoteAddress,
      userName: req.user.username,
    };
    
    const request = validate(approveKreditRekomendasiValidation, req.body);
    
    const result = await kreditRekomendasiService.approveKreditRekomendasi(
      rekomendasiId,
      request,
      auditInfo
    );
    
    res.status(200).json({
      status: true,
      message: `Rekomendasi kredit berhasil ${request.statusPersetujuan === "disetujui" ? "disetujui" : "ditolak"}`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk mendapatkan daftar rekomendasi kredit dengan filter
const getKreditRekomendasiList = async (req, res, next) => {
  try {
    const filters = validate(getKreditRekomendasiListValidation, {
      cabangId: req.query.cabangId,
      statusPersetujuan: req.query.statusPersetujuan,
      minSkorKredit: req.query.minSkorKredit,
      maxSkorKredit: req.query.maxSkorKredit,
      search: req.query.search,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
    });
    
    const result = await kreditRekomendasiService.getKreditRekomendasiList(filters);
    
    res.status(200).json({
      status: true,
      message: "Berhasil mendapatkan daftar rekomendasi kredit",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk mendapatkan skor kredit pelanggan
const getCustomerCreditScore = async (req, res, next) => {
  try {
    const pelangganId = req.params.pelangganId;
    
    if (!pelangganId) {
      throw new ResponseError(400, "ID pelanggan diperlukan");
    }
    
    const creditScore = await kreditRekomendasiService.calculateCreditScore(pelangganId);
    const creditLimit = await kreditRekomendasiService.determineCreditLimit(pelangganId, creditScore);
    const paymentOptions = kreditRekomendasiService.generatePaymentOptions(creditScore, creditLimit);
    
    res.status(200).json({
      status: true,
      message: "Berhasil mendapatkan skor kredit pelanggan",
      data: {
        pelangganId,
        skorKredit: creditScore,
        limitKredit: creditLimit,
        opsiPembayaran: paymentOptions,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createKreditRekomendasi,
  getKreditRekomendasiById,
  getKreditRekomendasiByPelanggan,
  approveKreditRekomendasi,
  getKreditRekomendasiList,
  getCustomerCreditScore,
};
