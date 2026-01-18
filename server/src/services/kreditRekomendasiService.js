const prisma = require("../config/db");
const { ResponseError } = require("../error/responseError");
const { cacheSet, cacheGet, cacheDelete, createCacheKey } = require("../utils/redisUtils");

/**
 * Calculate customer credit score based on transaction history
 * @param {string} pelangganId - Customer ID
 * @returns {Promise<number>} - Credit score (0-100)
 */
const calculateCreditScore = async (pelangganId) => {
  try {
    // Get customer transaction history
    const customerHistory = await prisma.transaksi.findMany({
      where: {
        pelanggan_id: pelangganId,
        status_pembayaran: { not: "DIBATALKAN" },
      },
      include: {
        pembayaran: true,
      },
    });

    if (!customerHistory || customerHistory.length === 0) {
      return 0; // No transaction history, default score is 0
    }

    // Get customer credit history
    const creditHistory = await prisma.kreditTransaksi.findMany({
      where: {
        kreditSetting: {
          pelangganId: pelangganId,
        },
      },
      include: {
        pembayaranKredit: true,
      },
    });

    // Calculate score components
    let score = 50; // Base score

    // 1. Transaction frequency (max +15 points)
    const transactionCount = customerHistory.length;
    if (transactionCount >= 20) score += 15;
    else if (transactionCount >= 10) score += 10;
    else if (transactionCount >= 5) score += 5;

    // 2. Transaction value (max +15 points)
    const totalValue = customerHistory.reduce(
      (sum, t) => sum + parseFloat(t.total_harga || 0),
      0
    );
    if (totalValue >= 10000000) score += 15;
    else if (totalValue >= 5000000) score += 10;
    else if (totalValue >= 1000000) score += 5;

    // 3. Payment history (max +20 points)
    // Check for late payments in regular transactions
    let latePayments = 0;
    customerHistory.forEach((transaction) => {
      if (transaction.pembayaran && transaction.pembayaran.length > 0) {
        const lastPayment = transaction.pembayaran.reduce((latest, payment) => {
          return new Date(payment.tanggal_pembayaran) > new Date(latest.tanggal_pembayaran)
            ? payment
            : latest;
        }, transaction.pembayaran[0]);

        // Check if payment was made after due date (assuming 7 days grace period)
        const transactionDate = new Date(transaction.tanggal);
        const dueDate = new Date(transactionDate);
        dueDate.setDate(dueDate.getDate() + 7);

        if (new Date(lastPayment.tanggal_pembayaran) > dueDate) {
          latePayments++;
        }
      }
    });

    // Check for late payments in credit transactions
    let lateCreditPayments = 0;
    creditHistory.forEach((credit) => {
      if (credit.pembayaranKredit && credit.pembayaranKredit.length > 0) {
        credit.pembayaranKredit.forEach((payment) => {
          const paymentDate = new Date(payment.tanggalBayar);
          const dueDate = new Date(credit.tanggalJatuhTempo);
          if (paymentDate > dueDate) {
            lateCreditPayments++;
          }
        });
      }
    });

    // Adjust score based on payment history
    if (latePayments === 0 && lateCreditPayments === 0) score += 20;
    else if (latePayments <= 1 && lateCreditPayments <= 1) score += 10;
    else if (latePayments <= 3 && lateCreditPayments <= 3) score += 5;
    else score -= 10; // Penalty for many late payments

    // 4. Credit utilization (max +10 points)
    if (creditHistory.length > 0) {
      const activeCreditCount = creditHistory.filter(
        (c) => c.statusKredit === "aktif"
      ).length;
      
      if (activeCreditCount === 0) score += 10;
      else if (activeCreditCount === 1) score += 5;
      else score -= 5; // Penalty for multiple active credits
    } else {
      score += 10; // No credit history is good for new credit
    }

    // 5. Customer age/loyalty (max +10 points)
    const customer = await prisma.pelanggan.findUnique({
      where: { id: pelangganId },
    });

    if (customer) {
      const registrationDate = new Date(customer.createdAt);
      const now = new Date();
      const monthsDiff = (now.getFullYear() - registrationDate.getFullYear()) * 12 +
        (now.getMonth() - registrationDate.getMonth());
      
      if (monthsDiff >= 24) score += 10;
      else if (monthsDiff >= 12) score += 5;
      else if (monthsDiff >= 6) score += 2;
    }

    // Ensure score is within 0-100 range
    return Math.max(0, Math.min(100, Math.round(score)));
  } catch (error) {
    console.error("Error calculating credit score:", error);
    return 0; // Default to 0 on error
  }
};

/**
 * Determine credit limit based on customer score and transaction history
 * @param {string} pelangganId - Customer ID
 * @param {number} creditScore - Customer credit score
 * @returns {Promise<number>} - Recommended credit limit
 */
const determineCreditLimit = async (pelangganId, creditScore) => {
  try {
    // Get customer transaction history for average transaction value
    const transactions = await prisma.transaksi.findMany({
      where: {
        pelanggan_id: pelangganId,
        status_pembayaran: { not: "DIBATALKAN" },
      },
      orderBy: {
        tanggal: "desc",
      },
      take: 10, // Consider last 10 transactions
    });

    // Calculate average transaction value
    let avgTransactionValue = 0;
    if (transactions.length > 0) {
      const totalValue = transactions.reduce(
        (sum, t) => sum + parseFloat(t.total_harga || 0),
        0
      );
      avgTransactionValue = totalValue / transactions.length;
    }

    // Base limit calculation based on credit score
    let baseLimit = 0;
    if (creditScore >= 90) baseLimit = 10000000;
    else if (creditScore >= 80) baseLimit = 5000000;
    else if (creditScore >= 70) baseLimit = 3000000;
    else if (creditScore >= 60) baseLimit = 2000000;
    else if (creditScore >= 50) baseLimit = 1000000;
    else if (creditScore >= 40) baseLimit = 500000;
    else baseLimit = 0; // Below 40 score, no credit

    // Adjust limit based on average transaction value (up to 3x avg value)
    const transactionBasedLimit = avgTransactionValue * 3;
    
    // Take the lower of the two limits for safety
    const recommendedLimit = Math.min(baseLimit, transactionBasedLimit);
    
    // Ensure minimum limit if score qualifies
    return creditScore >= 40 ? Math.max(recommendedLimit, 500000) : 0;
  } catch (error) {
    console.error("Error determining credit limit:", error);
    return 0;
  }
};

/**
 * Generate payment options based on customer score and credit limit
 * @param {number} creditScore - Customer credit score
 * @param {number} creditLimit - Recommended credit limit
 * @returns {Array} - Array of payment options
 */
const generatePaymentOptions = (creditScore, creditLimit) => {
  const options = [];

  // Only generate options if credit score is sufficient
  if (creditScore < 40 || creditLimit <= 0) {
    return options;
  }

  // Base interest rates based on credit score
  let baseInterestRate = 0;
  if (creditScore < 50) baseInterestRate = 5;
  else if (creditScore < 70) baseInterestRate = 3;
  else if (creditScore < 90) baseInterestRate = 2;
  else baseInterestRate = 1;

  // Admin fee based on credit limit
  const adminFee = Math.min(50000, creditLimit * 0.01);

  // Option 1: Short term (7 days)
  if (creditScore >= 40) {
    options.push({
      jangkaWaktu: 7,
      jumlahCicilan: 1,
      minimumBayar: creditLimit * 1.0, // Full payment
      bungaPerBulan: 0, // No interest for short term
      biayaAdmin: adminFee * 0.5, // Half admin fee for short term
    });
  }

  // Option 2: Medium term (14 days)
  if (creditScore >= 50) {
    options.push({
      jangkaWaktu: 14,
      jumlahCicilan: 1,
      minimumBayar: creditLimit * 1.0, // Full payment
      bungaPerBulan: baseInterestRate * 0.5, // Half interest rate
      biayaAdmin: adminFee * 0.75, // 75% admin fee
    });
  }

  // Option 3: Long term (30 days)
  if (creditScore >= 60) {
    options.push({
      jangkaWaktu: 30,
      jumlahCicilan: 1,
      minimumBayar: creditLimit * 1.0, // Full payment
      bungaPerBulan: baseInterestRate,
      biayaAdmin: adminFee,
    });
  }

  // Option 4: Installment (2 payments over 30 days)
  if (creditScore >= 70) {
    options.push({
      jangkaWaktu: 30,
      jumlahCicilan: 2,
      minimumBayar: creditLimit * 0.5, // 50% minimum payment
      bungaPerBulan: baseInterestRate * 1.2, // 20% higher interest for installment
      biayaAdmin: adminFee * 1.2, // 20% higher admin fee
    });
  }

  // Option 5: Installment (3 payments over 60 days)
  if (creditScore >= 80) {
    options.push({
      jangkaWaktu: 60,
      jumlahCicilan: 3,
      minimumBayar: creditLimit * 0.33, // 33% minimum payment
      bungaPerBulan: baseInterestRate * 1.5, // 50% higher interest
      biayaAdmin: adminFee * 1.5, // 50% higher admin fee
    });
  }

  // Option 6: Installment (4 payments over 90 days)
  if (creditScore >= 90) {
    options.push({
      jangkaWaktu: 90,
      jumlahCicilan: 4,
      minimumBayar: creditLimit * 0.25, // 25% minimum payment
      bungaPerBulan: baseInterestRate * 2, // Double interest
      biayaAdmin: adminFee * 2, // Double admin fee
    });
  }

  return options;
};

/**
 * Create a credit recommendation for a customer
 * @param {Object} data - Recommendation data
 * @param {Object} auditInfo - Audit information
 * @returns {Promise<Object>} - Created recommendation
 */
const createKreditRekomendasi = async (data, auditInfo) => {
  const { pelangganId } = data;

  if (!pelangganId) {
    throw new ResponseError(400, "ID Pelanggan harus diisi");
  }

  // Check if customer exists
  const customer = await prisma.pelanggan.findUnique({
    where: { id: pelangganId },
  });

  if (!customer) {
    throw new ResponseError(404, "Pelanggan tidak ditemukan");
  }

  // Calculate credit score
  const creditScore = await calculateCreditScore(pelangganId);
  
  // Determine credit limit
  const creditLimit = await determineCreditLimit(pelangganId, creditScore);
  
  // Generate payment options
  const paymentOptions = generatePaymentOptions(creditScore, creditLimit);

  // Create recommendation in database
  const recommendation = await prisma.kreditRekomendasi.create({
    data: {
      pelangganId,
      skorKredit: creditScore,
      limitKredit: creditLimit,
      tenorMaksimal: creditScore >= 90 ? 90 : creditScore >= 80 ? 60 : creditScore >= 60 ? 30 : 14,
      statusPersetujuan: "pending",
      keterangan: `Rekomendasi kredit otomatis berdasarkan skor ${creditScore}/100`,
      created_by_user_Id: auditInfo.userId,
      created_by: auditInfo.userName,
    },
  });

  // Create payment options in database
  if (paymentOptions.length > 0) {
    await prisma.opsiPembayaranKredit.createMany({
      data: paymentOptions.map(option => ({
        ...option,
        rekomendasiId: recommendation.id,
      })),
    });
  }

  // Get complete recommendation with options
  const completeRecommendation = await prisma.kreditRekomendasi.findUnique({
    where: { id: recommendation.id },
    include: {
      pelanggan: true,
      opsiPembayaran: true,
    },
  });

  return completeRecommendation;
};

/**
 * Get credit recommendation by ID
 * @param {string} id - Recommendation ID
 * @returns {Promise<Object>} - Recommendation details
 */
const getKreditRekomendasiById = async (id) => {
  const cacheKey = createCacheKey("kredit-rekomendasi", id);
  
  // Try to get from cache first
  const cachedData = await cacheGet(cacheKey);
  if (cachedData) {
    return JSON.parse(cachedData);
  }
  
  // Get from database if not in cache
  const recommendation = await prisma.kreditRekomendasi.findUnique({
    where: { id },
    include: {
      pelanggan: true,
      opsiPembayaran: true,
      approvedBy: {
        select: {
          id: true,
          namaLengkap: true,
        },
      },
    },
  });

  if (!recommendation) {
    throw new ResponseError(404, "Rekomendasi kredit tidak ditemukan");
  }

  // Cache the result
  await cacheSet(cacheKey, JSON.stringify(recommendation), 3600); // Cache for 1 hour
  
  return recommendation;
};

/**
 * Get credit recommendations for a customer
 * @param {string} pelangganId - Customer ID
 * @returns {Promise<Array>} - List of recommendations
 */
const getKreditRekomendasiByPelanggan = async (pelangganId) => {
  const cacheKey = createCacheKey("kredit-rekomendasi-pelanggan", pelangganId);
  
  // Try to get from cache first
  const cachedData = await cacheGet(cacheKey);
  if (cachedData) {
    return JSON.parse(cachedData);
  }
  
  // Get from database if not in cache
  const recommendations = await prisma.kreditRekomendasi.findMany({
    where: { 
      pelangganId,
      statusPersetujuan: { not: "ditolak" }, // Exclude rejected recommendations
    },
    include: {
      opsiPembayaran: true,
      approvedBy: {
        select: {
          id: true,
          namaLengkap: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Cache the result
  await cacheSet(cacheKey, JSON.stringify(recommendations), 3600); // Cache for 1 hour
  
  return recommendations;
};

/**
 * Approve or reject a credit recommendation
 * @param {string} id - Recommendation ID
 * @param {Object} data - Approval data
 * @param {Object} auditInfo - Audit information
 * @returns {Promise<Object>} - Updated recommendation
 */
const approveKreditRekomendasi = async (id, data, auditInfo) => {
  const { statusPersetujuan, keterangan } = data;
  
  if (!statusPersetujuan) {
    throw new ResponseError(400, "Status persetujuan harus diisi");
  }
  
  // Get recommendation
  const recommendation = await prisma.kreditRekomendasi.findUnique({
    where: { id },
  });
  
  if (!recommendation) {
    throw new ResponseError(404, "Rekomendasi kredit tidak ditemukan");
  }
  
  // Update recommendation
  const updatedRecommendation = await prisma.kreditRekomendasi.update({
    where: { id },
    data: {
      statusPersetujuan,
      keterangan: keterangan || recommendation.keterangan,
      disetujuiOleh: auditInfo.userId,
      tanggalDisetujui: new Date(),
      updated_by_user_Id: auditInfo.userId,
      updated_by: auditInfo.userName,
    },
    include: {
      pelanggan: true,
      opsiPembayaran: true,
      approvedBy: {
        select: {
          id: true,
          namaLengkap: true,
        },
      },
    },
  });
  
  // If approved, create credit setting
  if (statusPersetujuan === "disetujui") {
    await prisma.kreditSetting.create({
      data: {
        pelangganId: recommendation.pelangganId,
        limitKredit: recommendation.limitKredit,
        tenorMaksimal: recommendation.tenorMaksimal,
        bungaPerBulan: recommendation.bungaPerBulan,
        biayaAdmin: recommendation.biayaAdmin,
        statusKredit: "aktif",
        disetujuiOleh: auditInfo.userId,
        tanggalDisetujui: new Date(),
        created_by_user_Id: auditInfo.userId,
        created_by: auditInfo.userName,
      },
    });
  }
  
  // Clear cache
  const cacheKey = createCacheKey("kredit-rekomendasi", id);
  await cacheDelete(cacheKey);
  
  const pelangganCacheKey = createCacheKey("kredit-rekomendasi-pelanggan", recommendation.pelangganId);
  await cacheDelete(pelangganCacheKey);
  
  return updatedRecommendation;
};

/**
 * Get all credit recommendations with filters
 * @param {Object} filters - Filter parameters
 * @returns {Promise<Object>} - Recommendations and pagination info
 */
const getKreditRekomendasiList = async (filters) => {
  const {
    cabangId,
    statusPersetujuan,
    minSkorKredit,
    maxSkorKredit,
    search,
    page = 1,
    limit = 10,
  } = filters;
  
  const skip = (page - 1) * limit;
  
  // Build where clause
  const where = {};
  
  if (cabangId) {
    where.pelanggan = {
      cabangId,
    };
  }
  
  if (statusPersetujuan) {
    where.statusPersetujuan = statusPersetujuan;
  }
  
  if (minSkorKredit !== undefined) {
    where.skorKredit = {
      ...where.skorKredit,
      gte: parseInt(minSkorKredit),
    };
  }
  
  if (maxSkorKredit !== undefined) {
    where.skorKredit = {
      ...where.skorKredit,
      lte: parseInt(maxSkorKredit),
    };
  }
  
  if (search) {
    where.pelanggan = {
      ...where.pelanggan,
      OR: [
        { nama: { contains: search, mode: "insensitive" } },
        { telepon: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    };
  }
  
  // Get total count
  const totalCount = await prisma.kreditRekomendasi.count({ where });
  
  // Get recommendations
  const recommendations = await prisma.kreditRekomendasi.findMany({
    where,
    include: {
      pelanggan: true,
      opsiPembayaran: true,
      approvedBy: {
        select: {
          id: true,
          namaLengkap: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take: limit,
  });
  
  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / limit);
  
  return {
    data: recommendations,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages,
    },
  };
};

module.exports = {
  calculateCreditScore,
  determineCreditLimit,
  generatePaymentOptions,
  createKreditRekomendasi,
  getKreditRekomendasiById,
  getKreditRekomendasiByPelanggan,
  approveKreditRekomendasi,
  getKreditRekomendasiList,
};
