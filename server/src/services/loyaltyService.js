const prisma = require("../config/db");
const { withRls } = require("../config/db");
const { ResponseError } = require("../error/responseError");
const { sanitizeBigInt } = require("../utils/bigintSerializer");

// ================================================================
// CONFIG OPERATIONS
// ================================================================

const getLoyaltyConfig = async (cabangId = null) => {
  const query = `
    SELECT * FROM loyalty_config 
    WHERE (cabang_id = $1 OR cabang_id IS NULL)
    AND is_active = TRUE
    ORDER BY cabang_id NULLS LAST
    LIMIT 1
  `;
  const result = await prisma.$queryRawUnsafe(query, cabangId);
  return result[0] || {
    points_per_amount: 0.01,
    min_transaction_for_points: 10000,
    points_expiry_days: 365,
    is_active: true
  };
};

const updateLoyaltyConfig = async (configId, data, userId) => {
  const query = `
    UPDATE loyalty_config SET
      points_per_amount = $2,
      min_transaction_for_points = $3,
      points_expiry_days = $4,
      is_active = $5,
      updated_at = NOW(),
      updated_by = $6
    WHERE loyalty_config_id = $1
    RETURNING *
  `;
  const result = await prisma.$queryRawUnsafe(
    query,
    configId,
    data.points_per_amount,
    data.min_transaction_for_points,
    data.points_expiry_days,
    data.is_active,
    userId
  );
  return result[0];
};

const createLoyaltyConfig = async (data, userId) => {
  const query = `
    INSERT INTO loyalty_config (
      cabang_id, points_per_amount, min_transaction_for_points,
      points_expiry_days, is_active, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (cabang_id) DO UPDATE SET
      points_per_amount = $2,
      min_transaction_for_points = $3,
      points_expiry_days = $4,
      is_active = $5,
      updated_at = NOW(),
      updated_by = $6
    RETURNING *
  `;
  const result = await prisma.$queryRawUnsafe(
    query,
    data.cabang_id || null,
    data.points_per_amount || 0.01,
    data.min_transaction_for_points || 10000,
    data.points_expiry_days || 365,
    data.is_active !== false,
    userId
  );
  return result[0];
};

// ================================================================
// TIER OPERATIONS
// ================================================================

const getAllTiers = async () => {
  const query = `
    SELECT * FROM loyalty_tier 
    WHERE is_active = TRUE
    ORDER BY tier_order ASC
  `;
  const result = await prisma.$queryRawUnsafe(query);
  return result;
};

const getTierById = async (tierId) => {
  const query = `SELECT * FROM loyalty_tier WHERE loyalty_tier_id = $1`;
  const result = await prisma.$queryRawUnsafe(query, tierId);
  return result[0];
};

const createTier = async (data, userId) => {
  // Get max tier_order
  const maxOrderResult = await prisma.$queryRawUnsafe(
    `SELECT COALESCE(MAX(tier_order), 0) + 1 as next_order FROM loyalty_tier`
  );
  const nextOrder = maxOrderResult[0]?.next_order || 1;

  const query = `
    INSERT INTO loyalty_tier (
      name, min_points, max_points, discount_percent, benefits,
      color, icon, tier_order, is_active, created_by
    ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10)
    RETURNING *
  `;
  const result = await prisma.$queryRawUnsafe(
    query,
    data.name,
    data.min_points || 0,
    data.max_points || null,
    data.discount_percent || 0,
    JSON.stringify(data.benefits || []),
    data.color || '#6B7280',
    data.icon || 'star',
    data.tier_order || nextOrder,
    data.is_active !== false,
    userId
  );
  return result[0];
};

const updateTier = async (tierId, data, userId) => {
  const query = `
    UPDATE loyalty_tier SET
      name = COALESCE($2, name),
      min_points = COALESCE($3, min_points),
      max_points = $4,
      discount_percent = COALESCE($5, discount_percent),
      benefits = COALESCE($6::jsonb, benefits),
      color = COALESCE($7, color),
      icon = COALESCE($8, icon),
      tier_order = COALESCE($9, tier_order),
      is_active = COALESCE($10, is_active),
      updated_at = NOW(),
      updated_by = $11
    WHERE loyalty_tier_id = $1
    RETURNING *
  `;
  const result = await prisma.$queryRawUnsafe(
    query,
    tierId,
    data.name,
    data.min_points,
    data.max_points,
    data.discount_percent,
    data.benefits ? JSON.stringify(data.benefits) : null,
    data.color,
    data.icon,
    data.tier_order,
    data.is_active,
    userId
  );
  return result[0];
};

const deleteTier = async (tierId) => {
  const query = `
    UPDATE loyalty_tier SET is_active = FALSE, updated_at = NOW()
    WHERE loyalty_tier_id = $1
    RETURNING *
  `;
  const result = await prisma.$queryRawUnsafe(query, tierId);
  return result[0];
};

// ================================================================
// REWARD OPERATIONS
// ================================================================

const getAllRewards = async (onlyActive = true) => {
  let query = `SELECT * FROM loyalty_reward`;
  if (onlyActive) {
    query += ` WHERE is_active = TRUE`;
  }
  query += ` ORDER BY points_required ASC`;
  const result = await prisma.$queryRawUnsafe(query);
  return result;
};

const getRewardById = async (rewardId) => {
  const query = `SELECT * FROM loyalty_reward WHERE loyalty_reward_id = $1`;
  const result = await prisma.$queryRawUnsafe(query, rewardId);
  return result[0];
};

const createReward = async (data, userId) => {
  const query = `
    INSERT INTO loyalty_reward (
      name, description, points_required, reward_type, reward_value,
      produk_master_id, max_redeem_per_customer, total_stock,
      valid_from, valid_until, min_tier_id, is_active, created_by
    ) VALUES ($1, $2, $3, $4::loyalty_reward_type, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *
  `;
  const result = await prisma.$queryRawUnsafe(
    query,
    data.name,
    data.description || null,
    data.points_required,
    data.reward_type || 'DISCOUNT',
    data.reward_value,
    data.produk_master_id || null,
    data.max_redeem_per_customer || null,
    data.total_stock || null,
    data.valid_from || null,
    data.valid_until || null,
    data.min_tier_id || null,
    data.is_active !== false,
    userId
  );
  return result[0];
};

const updateReward = async (rewardId, data, userId) => {
  const query = `
    UPDATE loyalty_reward SET
      name = COALESCE($2, name),
      description = COALESCE($3, description),
      points_required = COALESCE($4, points_required),
      reward_type = COALESCE($5::loyalty_reward_type, reward_type),
      reward_value = COALESCE($6, reward_value),
      max_redeem_per_customer = $7,
      total_stock = $8,
      valid_from = $9,
      valid_until = $10,
      min_tier_id = $11,
      is_active = COALESCE($12, is_active),
      updated_at = NOW(),
      updated_by = $13
    WHERE loyalty_reward_id = $1
    RETURNING *
  `;
  const result = await prisma.$queryRawUnsafe(
    query,
    rewardId,
    data.name,
    data.description,
    data.points_required,
    data.reward_type,
    data.reward_value,
    data.max_redeem_per_customer,
    data.total_stock,
    data.valid_from,
    data.valid_until,
    data.min_tier_id,
    data.is_active,
    userId
  );
  return result[0];
};

const deleteReward = async (rewardId) => {
  const query = `
    UPDATE loyalty_reward SET is_active = FALSE, updated_at = NOW()
    WHERE loyalty_reward_id = $1
    RETURNING *
  `;
  const result = await prisma.$queryRawUnsafe(query, rewardId);
  return result[0];
};

// ================================================================
// CUSTOMER LOYALTY OPERATIONS
// ================================================================

const getCustomerLoyaltyInfo = async (pelangganId) => {
  const query = `SELECT * FROM get_customer_loyalty_info($1)`;
  const result = await prisma.$queryRawUnsafe(query, pelangganId);
  return result[0]?.get_customer_loyalty_info;
};

const getAvailableRewards = async (pelangganId) => {
  const query = `SELECT * FROM get_available_rewards($1)`;
  const result = await prisma.$queryRawUnsafe(query, pelangganId);
  return result[0]?.get_available_rewards;
};

const redeemReward = async (pelangganId, rewardId, transaksiId, userId) => {
  const query = `SELECT * FROM redeem_loyalty_reward($1, $2, $3, $4)`;
  const result = await prisma.$queryRawUnsafe(
    query,
    pelangganId,
    rewardId,
    transaksiId,
    userId
  );
  return result[0]?.redeem_loyalty_reward;
};

const getPointsHistory = async (pelangganId, limit = 50, offset = 0) => {
  const query = `
    SELECT 
      lph.*,
      t.nomor_transaksi,
      lr.name as reward_name
    FROM loyalty_point_history lph
    LEFT JOIN transaksi t ON t.transaksi_id = lph.transaksi_id
    LEFT JOIN loyalty_reward lr ON lr.loyalty_reward_id = lph.reward_id
    WHERE lph.pelanggan_id = $1
    ORDER BY lph.created_at DESC
    LIMIT $2 OFFSET $3
  `;
  const result = await prisma.$queryRawUnsafe(query, pelangganId, limit, offset);
  
  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total FROM loyalty_point_history WHERE pelanggan_id = $1
  `;
  const countResult = await prisma.$queryRawUnsafe(countQuery, pelangganId);
  
  return {
    data: result,
    total: parseInt(countResult[0]?.total || 0),
    limit,
    offset
  };
};

// ================================================================
// STATISTICS
// ================================================================

const getLoyaltyStats = async (cabangId = null) => {
  // Total members with points
  let membersQuery = `
    SELECT 
      CAST(COUNT(*) FILTER (WHERE poin > 0) as int) as active_members,
      CAST(COUNT(*) as int) as total_customers,
      CAST(SUM(COALESCE(poin, 0)) as int) as total_points_balance,
      CAST(SUM(COALESCE(lifetime_points, 0)) as int) as total_points_earned
    FROM pelanggan
    WHERE status = 'aktif'
  `;
  if (cabangId) {
    membersQuery += ` AND cabang_id = '${cabangId}'`;
  }
  
  // Tier distribution
  const tierQuery = `
    SELECT 
      lt.name as tier_name,
      lt.color,
      CAST(COUNT(p.pelanggan_id) as int) as member_count
    FROM loyalty_tier lt
    LEFT JOIN pelanggan p ON p.loyalty_tier_id = lt.loyalty_tier_id AND p.status = 'aktif'
    WHERE lt.is_active = TRUE
    GROUP BY lt.loyalty_tier_id, lt.name, lt.color, lt.tier_order
    ORDER BY lt.tier_order
  `;
  
  // Points activity this month
  const activityQuery = `
    SELECT 
      CAST(SUM(CASE WHEN type = 'EARN' THEN point_didapatkan ELSE 0 END) as int) as points_earned,
      CAST(SUM(CASE WHEN type = 'REDEEM' THEN ABS(point_didapatkan ) ELSE 0 END) as int) as points_redeemed,
      CAST(COUNT(CASE WHEN type = 'EARN' THEN 1 END) as int) as earn_transactions,
      CAST(COUNT(CASE WHEN type = 'REDEEM' THEN 1 END) as int) as redeem_transactions
    FROM loyalty_point_history
    WHERE created_at >= date_trunc('month', CURRENT_DATE)
  `;
  
  // Top redeemed rewards
  const topRewardsQuery = `
    SELECT 
      lr.name,
      lr.points_required,
      lr.reward_value,
      CAST(lr.current_redeemed as int) as total_redeemed
    FROM loyalty_reward lr
    WHERE lr.is_active = TRUE
    ORDER BY lr.current_redeemed DESC
    LIMIT 5
  `;

  const [members, tiers, activity, topRewards] = await withRls((tx) => 
    Promise.all([
      tx.$queryRawUnsafe(membersQuery),
      tx.$queryRawUnsafe(tierQuery),
      tx.$queryRawUnsafe(activityQuery),
      tx.$queryRawUnsafe(topRewardsQuery)
    ])
  );

  console.log(members);
  console.log(tiers);
  console.log(activity);
  console.log(topRewards);

  return {
    members: members[0],
    tier_distribution: tiers,
    monthly_activity: activity[0],
    top_rewards: topRewards
  };
};

module.exports = {
  // Config
  getLoyaltyConfig,
  updateLoyaltyConfig,
  createLoyaltyConfig,
  // Tiers
  getAllTiers,
  getTierById,
  createTier,
  updateTier,
  deleteTier,
  // Rewards
  getAllRewards,
  getRewardById,
  createReward,
  updateReward,
  deleteReward,
  // Customer
  getCustomerLoyaltyInfo,
  getAvailableRewards,
  redeemReward,
  getPointsHistory,
  // Stats
  getLoyaltyStats
};
