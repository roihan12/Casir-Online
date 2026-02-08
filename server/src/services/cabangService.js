const prisma = require("../config/db");
const { ResponseError } = require("../error/responseError");
const { validate } = require("../validation/validation");
const {
  CreateCabangValidation,
  UpdateCabangValidation,
} = require("../validation/cabangValidation");
const { generateBranchId } = require("../utils/generateBranchId");
const {
  cacheSet,
  cacheGet,
  cacheDelete,
  createCacheKey,
  cacheOrFetch,
  cacheDeletePattern,
} = require("../utils/redisUtils");

// Fungsi baru untuk mendapatkan cabang berdasarkan userId
const getCabangByUserId = async (userId) => {
  const cacheKey = createCacheKey("user-cabang", userId);

  return await cacheOrFetch(
    cacheKey,
    async () => {
      const userCabang = await prisma.userCabang.findMany({
        where: {
          userId,
          cabang: {
            status: "aktif",
            deletedAt: null,
          },
        },
        include: {
          cabang: true,
        },
      });

      if (!userCabang || userCabang.length === 0) {
        return [];
      }

      return userCabang.map((uc) => uc.cabang);
    },
    3600
  ); // Cache selama 1 jam
};

const getAllCabang = async (userId, page = 1, limit = 10) => {
  // Pastikan page dan limit berupa integer
  const pageInt = parseInt(page, 10);
  const limitInt = parseInt(limit, 10);

  // Perbaiki pembentukan kunci cache dengan parameter yang tepat
  const cacheKey = createCacheKey(
    "cabang-list",
    userId,
    `page-${pageInt}`,
    `limit-${limitInt}`
  );

  return await cacheOrFetch(
    cacheKey,
    async () => {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          userRoles: {
            include: { role: true },
          },
        },
      });

      if (!user) {
        throw new ResponseError(404, "User not found");
      }

      const isSuperAdmin = user.userRoles.some(
        (ur) => ur.role.namaRole === "super_admin"
      );

      // Calculate offset for pagination
      const offset = (pageInt - 1) * limitInt;

      // Base query conditions
      const baseWhere = {
        deletedAt: null,
      };

      // Modify base conditions for non-super admin
      const whereCondition = isSuperAdmin
        ? baseWhere
        : {
            ...baseWhere,
            userCabang: {
              some: {
                userId: userId,
              },
            },
          };

      // Fetch total count
      const total = await prisma.cabang.count({
        where: whereCondition,
      });

      // Jika offset melebihi total, kembalikan data kosong
      if (offset >= total && total > 0) {
        return {
          data: [],
          pagination: {
            totalItems: total,
            totalPages: Math.ceil(total / limitInt),
            currentPage: pageInt,
            itemsPerPage: limitInt,
            hasNextPage: false,
            hasPrevPage: pageInt > 1,
          },
        };
      }

      // Fetch paginated results
      const cabangList = await prisma.cabang.findMany({
        where: whereCondition,
        skip: offset,
        take: limitInt,
        orderBy: {
          // Tambahkan pengurutan yang konsisten
          id: "asc",
        },
      });

      const totalPages = Math.ceil(total / limitInt);

      return {
        data: cabangList,
        pagination: {
          totalItems: total,
          totalPages,
          currentPage: pageInt,
          itemsPerPage: limitInt,
          hasNextPage: pageInt < totalPages,
          hasPrevPage: pageInt > 1,
        },
      };
    },
    3600 // Cache for 1 hour
  );
};

const getCabangById = async (cabangId) => {
  const cacheKey = createCacheKey("cabang", cabangId);

  return await cacheOrFetch(
    cacheKey,
    async () => {
      const cabang = await prisma.cabang.findUnique({
        where: { id: cabangId },
      });

      if (!cabang) {
        throw new ResponseError(404, "Branch not found");
      }

      return cabang;
    },
    3600
  ); // Cache selama 1 jam
};

const createCabang = async (cabangData) => {
  const cabangValid = validate(CreateCabangValidation, cabangData);
  const cabangID = await generateBranchId(cabangValid.namaCabang);

  const newCabang = await prisma.cabang.create({
    data: {
      id: cabangID,
      ...cabangValid,
    },
  });

  // Invalidasi cache daftar cabang
  await cacheDelete("cabang-list:*");

  // Simpan cabang baru ke cache
  const cacheKey = createCacheKey("cabang", newCabang.id);
  await cacheSet(cacheKey, newCabang, 3600);

  return newCabang;
};

const updateCabang = async (cabangId, cabangData) => {
  const cabangValid = validate(UpdateCabangValidation, cabangData);

  const cabang = await prisma.cabang.findUnique({
    where: { id: cabangId },
  });

  if (!cabang) {
    throw new ResponseError(404, "Branch not found");
  }

  const updatedCabang = await prisma.cabang.update({
    where: { id: cabangId },
    data: cabangValid,
  });

  // Update cache cabang
  const cacheKey = createCacheKey("cabang", cabangId);
  await cacheSet(cacheKey, updatedCabang, 3600);

  // Invalidasi cache daftar cabang
  await cacheDeletePattern("cabang-list:*");

  // Invalidasi cache relasi user-cabang
  await cacheDeletePattern("user-cabang:*");

  return updatedCabang;
};

const deleteCabang = async (cabangId) => {
  const cabang = await prisma.cabang.findUnique({
    where: { id: cabangId },
  });

  if (!cabang) {
    throw new ResponseError(404, "Branch not found");
  }

  const deletedCabang = await prisma.cabang.update({
    where: { id: cabangId },
    data: {
      status: "nonaktif",
      deletedAt: new Date(),
    },
  });

  // Hapus cache cabang
  const cacheKey = createCacheKey("cabang", cabangId);
  await cacheDelete(cacheKey);

  // Invalidasi cache daftar cabang
  await cacheDeletePattern("cabang-list:*");

  // Invalidasi cache relasi user-cabang
  await cacheDeletePattern("user-cabang:*");

  return deletedCabang;
};

/**
 * Get map overview data for all branches
 * Includes today's transactions, active shifts, and computed last_activity_at
 */
const getMapOverview = async (userId) => {
  const cacheKey = createCacheKey("cabang-map-overview");

  return await cacheOrFetch(
    cacheKey,
    async () => {
      // Get start of today
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const branches = await prisma.cabang.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          namaCabang: true,
          alamat: true,
          latitude: true,
          longitude: true,
          status: true,
          // Get today's transactions
          Transaksi: {
            select: {
              transaksi_id: true,
              total: true,
              created_at: true,
            },
            where: {
              deleted_at: null,
              tanggal: { gte: startOfToday },
            },
            orderBy: { created_at: "desc" },
          },
          // Get active shifts
          shifts: {
            select: {
              id: true,
              waktuMulai: true,
              status: true,
            },
            where: {
              status: "dibuka",
              deletedAt: null,
            },
            take: 1,
          },
          // Get low stock products count
          produk: {
            where: {
              deletedAt: null,
              stok: { lte: prisma.produk.fields.minStok },
            },
            select: { id: true },
          },
        },
      });

      // Transform data for map view
      return branches.map((branch) => {
        const todayTransactions = branch.Transaksi || [];
        const latestTransaction = todayTransactions[0];
        const activeShift = branch.shifts[0];
        const lowStockCount = branch.produk?.length || 0;

        // Calculate today's revenue
        const todayRevenue = todayTransactions.reduce(
          (sum, t) => sum + (parseFloat(t.total) || 0),
          0
        );

        // Compute last activity timestamp
        const lastActivityAt =
          latestTransaction?.created_at ||
          activeShift?.waktuMulai ||
          null;

        return {
          branch_id: branch.id,
          name: branch.namaCabang,
          alamat: branch.alamat,
          lat: branch.latitude ? parseFloat(branch.latitude) : null,
          lng: branch.longitude ? parseFloat(branch.longitude) : null,
          status: branch.status === "aktif" ? "ACTIVE" : "INACTIVE",
          today_transaction_count: todayTransactions.length,
          today_revenue: todayRevenue,
          alert_count: lowStockCount,
          has_active_shift: !!activeShift,
          last_activity_at: lastActivityAt,
        };
      });
    },
    180 // Cache for 3 minutes
  );
};

module.exports = {
  getAllCabang,
  getCabangById,
  createCabang,
  updateCabang,
  deleteCabang,
  getCabangByUserId,
  getMapOverview,
};
