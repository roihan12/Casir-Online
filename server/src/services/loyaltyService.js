const prisma = require("../config/db");
const { ResponseError } = require("../error/responseError");

// Point calculation constants
const POINTS_PER_AMOUNT = 0.01; // 1 point per 100 currency units
const MIN_AMOUNT_FOR_POINTS = 10000; // Minimum purchase amount to earn points

// Add points from transaction
const addPointsFromTransaction = async (
  pelangganId,
  transaksiId,
  amount,
  auditInfo
) => {
  // Check if customer exists
  const pelanggan = await prisma.pelanggan.findUnique({
    where: { id: pelangganId },
  });

  if (!pelanggan) {
    throw new ResponseError(404, "Pelanggan tidak ditemukan");
  }

  // Only add points if amount exceeds minimum
  if (amount < MIN_AMOUNT_FOR_POINTS) {
    return { poin: 0, total: pelanggan.poin || 0 };
  }

  // Calculate points to add (rounded down)
  const pointsToAdd = Math.floor(amount * POINTS_PER_AMOUNT);

  // Update customer points
  const updatedPelanggan = await prisma.pelanggan.update({
    where: { id: pelangganId },
    data: {
      poin: {
        increment: pointsToAdd,
      },
    },
  });

  // In a real implementation, you would log this to a points_history table
  // We'll add audit log for now
  await prisma.auditLog.create({
    data: {
      user_id: auditInfo.userId,
      ip_address: auditInfo.ipAddress,
      action: "ADD_LOYALTY_POINTS",
      table_name: "pelanggan",
      record_id: pelangganId,
      old_values: JSON.stringify({ poin: pelanggan.poin || 0 }),
      new_values: JSON.stringify({
        poin: updatedPelanggan.poin,
        added: pointsToAdd,
        transaksi_id: transaksiId,
      }),
    },
  });

  return {
    poin: pointsToAdd,
    total: updatedPelanggan.poin,
  };
};

// Reverse points from transaction (used when canceling transaction)
const reversePointsFromTransaction = async (
  pelangganId,
  transaksiId,
  reason,
  auditInfo
) => {
  // This is a simplified implementation
  // In a real app, you would look up the exact points awarded for the transaction from history

  // Get transaction amount
  const transaksi = await prisma.transaksi.findUnique({
    where: { transaksi_id: transaksiId },
  });

  if (!transaksi) {
    throw new ResponseError(404, "Transaksi tidak ditemukan");
  }

  // Check if customer exists
  const pelanggan = await prisma.pelanggan.findUnique({
    where: { id: pelangganId },
  });

  if (!pelanggan) {
    throw new ResponseError(404, "Pelanggan tidak ditemukan");
  }

  // Calculate points to reverse
  const pointsToReverse = Math.floor(
    Number(transaksi.total) * POINTS_PER_AMOUNT
  );

  // Don't reverse if transaction was too small to earn points
  if (transaksi.total < MIN_AMOUNT_FOR_POINTS) {
    return { poin: 0, total: pelanggan.poin || 0 };
  }

  // Update customer points (don't let it go below 0)
  const newPoints = Math.max(0, (pelanggan.poin || 0) - pointsToReverse);

  const updatedPelanggan = await prisma.pelanggan.update({
    where: { id: pelangganId },
    data: {
      poin: newPoints,
    },
  });

  // Log the reversal
  await prisma.auditLog.create({
    data: {
      user_id: auditInfo.userId,
      ip_address: auditInfo.ipAddress,
      action: "REVERSE_LOYALTY_POINTS",
      table_name: "pelanggan",
      record_id: pelangganId,
      old_values: JSON.stringify({ poin: pelanggan.poin || 0 }),
      new_values: JSON.stringify({
        poin: updatedPelanggan.poin,
        reversed: pointsToReverse,
        transaksi_id: transaksiId,
        reason,
      }),
    },
  });

  return {
    poin: -pointsToReverse,
    total: updatedPelanggan.poin,
  };
};

// Get customer loyalty info
const getCustomerLoyaltyInfo = async (pelangganId) => {
  // Check if customer exists
  const pelanggan = await prisma.pelanggan.findUnique({
    where: { id: pelangganId },
  });

  if (!pelanggan) {
    throw new ResponseError(404, "Pelanggan tidak ditemukan");
  }

  // In a real implementation, you would get more detailed loyalty info
  // including transaction history, points history, available rewards, etc.

  // Calculate customer tier based on points
  let tier = "Regular";
  if (pelanggan.poin >= 1000) tier = "Silver";
  if (pelanggan.poin >= 5000) tier = "Gold";
  if (pelanggan.poin >= 10000) tier = "Platinum";

  return {
    customer_id: pelanggan.id,
    points: pelanggan.poin || 0,
    tier,
    points_expiry: null, // In a real app, you might track point expiration
    membership_since: pelanggan.createdAt,
    // You could add available rewards, etc.
  };
};

// Redeem points for a reward
const redeemPoints = async (
  pelangganId,
  rewardId,
  pointsRequired,
  auditInfo
) => {
  // Check if customer exists and has enough points
  const pelanggan = await prisma.pelanggan.findUnique({
    where: { id: pelangganId },
  });

  if (!pelanggan) {
    throw new ResponseError(404, "Pelanggan tidak ditemukan");
  }

  if ((pelanggan.poin || 0) < pointsRequired) {
    throw new ResponseError(400, "Poin tidak mencukupi");
  }

  // In a real implementation, you would validate the reward exists
  // and confirm the points required matches the reward

  // Update customer points
  const updatedPelanggan = await prisma.pelanggan.update({
    where: { id: pelangganId },
    data: {
      poin: {
        decrement: pointsRequired,
      },
    },
  });

  // Log the redemption
  await prisma.auditLog.create({
    data: {
      user_id: auditInfo.userId,
      ip_address: auditInfo.ipAddress,
      action: "REDEEM_LOYALTY_POINTS",
      table_name: "pelanggan",
      record_id: pelangganId,
      old_values: JSON.stringify({ poin: pelanggan.poin || 0 }),
      new_values: JSON.stringify({
        poin: updatedPelanggan.poin,
        redeemed: pointsRequired,
        reward_id: rewardId,
      }),
    },
  });

  return {
    success: true,
    points_redeemed: pointsRequired,
    remaining_points: updatedPelanggan.poin,
    reward_id: rewardId,
    // In a real app, you would include reward details
  };
};

module.exports = {
  addPointsFromTransaction,
  reversePointsFromTransaction,
  getCustomerLoyaltyInfo,
  redeemPoints,
};
