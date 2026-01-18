const prisma = require("../config/db");
const {
  cacheGet,
  cacheSet,
  cacheDelete,
  cacheDeletePattern,
  createCacheKey,
  cacheOrFetch,
} = require("../utils/redisUtils");

// Konstanta untuk kunci cache
const CACHE_KEYS = {
  DASHBOARD: "user:dashboard",
  USER_STATS: "user:stats",
  ROLE_DISTRIBUTION: "user:roles:distribution",
  USERS_PER_CABANG: "user:per:cabang",
  RECENT_LOGINS: "user:recent:logins",
  USER_ACTIVITIES: "user:activities",
};

// TTL untuk cache (dalam detik)
const CACHE_TTL = {
  DASHBOARD: 3600, // 1 jam
  STATS: 1800, // 30 menit
  DISTRIBUTION: 3600, // 1 jam
  ACTIVITIES: 600, // 10 menit
};

/**
 * Mendapatkan statistik user (total, aktif, nonaktif)
 */
const getUserStats = async () => {
  const cacheKey = CACHE_KEYS.USER_STATS;

  return await cacheOrFetch(
    cacheKey,
    async () => {
      const totalUsers = await prisma.user.count({
        where: {
          deletedAt: null,
        },
      });

      const activeUsers = await prisma.user.count({
        where: {
          status: "aktif",
          deletedAt: null,
        },
      });

      const inactiveUsers = await prisma.user.count({
        where: {
          status: "nonaktif",
          deletedAt: null,
        },
      });

      return {
        totalUsers,
        activeUsers,
        inactiveUsers,
        activePercentage:
          totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0,
      };
    },
    CACHE_TTL.STATS
  );
};

/**
 * Mendapatkan jumlah user berdasarkan role
 */
const getUsersByRole = async () => {
  const cacheKey = createCacheKey(CACHE_KEYS.DASHBOARD, "users_by_role");

  return await cacheOrFetch(
    cacheKey,
    async () => {
      // Mendapatkan semua role
      const roles = await prisma.role.findMany();

      // Mencari role IDs
      const superAdminRoleId = roles.find((role) =>
        role.namaRole.toLowerCase().includes("super")
      )?.id;
      const adminRoleId = roles.find(
        (role) => role.namaRole.toLowerCase() === "admin_cabang"
      )?.id;
      const kasirRoleId = roles.find((role) =>
        role.namaRole.toLowerCase().includes("kasir")
      )?.id;

      // Hitung jumlah user dengan role tertentu
      const superAdminCount = superAdminRoleId
        ? await prisma.userRole.count({
            where: {
              roleId: superAdminRoleId,
              user: {
                deletedAt: null,
                status: "aktif",
              },
            },
          })
        : 0;

      const adminCount = adminRoleId
        ? await prisma.userRole.count({
            where: {
              roleId: adminRoleId,
              user: {
                deletedAt: null,
                status: "aktif",
              },
            },
          })
        : 0;

      const kasirCount = kasirRoleId
        ? await prisma.userRole.count({
            where: {
              roleId: kasirRoleId,
              user: {
                deletedAt: null,
                status: "aktif",
              },
            },
          })
        : 0;

      return {
        adminCount: adminCount + superAdminCount,
        superAdminCount,
        adminCabangCount: adminCount,
        kasirCount,
      };
    },
    CACHE_TTL.STATS
  );
};

/**
 * Mendapatkan distribusi role user
 */
const getRoleDistribution = async () => {
  const cacheKey = CACHE_KEYS.ROLE_DISTRIBUTION;

  return await cacheOrFetch(
    cacheKey,
    async () => {
      // Mendapatkan semua role
      const roles = await prisma.role.findMany();

      // Menghitung jumlah user untuk setiap role
      const distribution = await Promise.all(
        roles.map(async (role) => {
          const count = await prisma.userRole.count({
            where: {
              roleId: role.id,
              user: {
                deletedAt: null,
              },
            },
          });

          return {
            role: role.namaRole,
            roleId: role.id,
            count,
            percentage: 0, // Akan dihitung setelah mendapatkan total
          };
        })
      );

      // Menghitung total untuk persentase
      const total = distribution.reduce((sum, item) => sum + item.count, 0);

      // Mengupdate persentase
      return distribution.map((item) => ({
        ...item,
        percentage: total > 0 ? Math.round((item.count / total) * 100) : 0,
      }));
    },
    CACHE_TTL.DISTRIBUTION
  );
};

/**
 * Mendapatkan jumlah user per cabang
 */
const getUsersPerCabang = async () => {
  const cacheKey = CACHE_KEYS.USERS_PER_CABANG;

  return await cacheOrFetch(
    cacheKey,
    async () => {
      // Mendapatkan semua cabang
      const cabangList = await prisma.cabang.findMany({
        where: {
          deletedAt: null,
          status: "aktif",
        },
      });

      // Menghitung jumlah user untuk setiap cabang
      const usersPerCabang = await Promise.all(
        cabangList.map(async (cabang) => {
          const count = await prisma.userCabang.count({
            where: {
              cabangId: cabang.id,
              user: {
                deletedAt: null,
                status: "aktif",
              },
            },
          });

          return {
            cabangId: cabang.id,
            namaCabang: cabang.namaCabang,
            userCount: count,
          };
        })
      );

      return usersPerCabang.sort((a, b) => b.userCount - a.userCount);
    },
    CACHE_TTL.DISTRIBUTION
  );
};

/**
 * Mendapatkan breakdown user per cabang berdasarkan role
 */
const getBreakdownUserPerCabang = async () => {
  const cacheKey = createCacheKey(CACHE_KEYS.DASHBOARD, "breakdown_per_cabang");

  return await cacheOrFetch(
    cacheKey,
    async () => {
      // Mendapatkan semua cabang
      const cabangList = await prisma.cabang.findMany({
        where: {
          deletedAt: null,
          status: "aktif",
        },
      });

      // Mendapatkan semua role
      const roles = await prisma.role.findMany();

      // Mencari role IDs
      const superAdminRoleId = roles.find((role) =>
        role.namaRole.toLowerCase().includes("super")
      )?.id;
      const adminRoleId = roles.find(
        (role) => role.namaRole.toLowerCase() === "admin"
      )?.id;
      const kasirRoleId = roles.find((role) =>
        role.namaRole.toLowerCase().includes("kasir")
      )?.id;

      // Menghitung breakdown per cabang
      const breakdown = await Promise.all(
        cabangList.map(async (cabang) => {
          const superAdminCount = superAdminRoleId
            ? await prisma.userRole.count({
                where: {
                  cabangId: cabang.id,
                  roleId: superAdminRoleId,
                  user: {
                    deletedAt: null,
                    status: "aktif",
                  },
                },
              })
            : 0;

          const adminCount = adminRoleId
            ? await prisma.userRole.count({
                where: {
                  cabangId: cabang.id,
                  roleId: adminRoleId,
                  user: {
                    deletedAt: null,
                    status: "aktif",
                  },
                },
              })
            : 0;

          const kasirCount = kasirRoleId
            ? await prisma.userRole.count({
                where: {
                  cabangId: cabang.id,
                  roleId: kasirRoleId,
                  user: {
                    deletedAt: null,
                    status: "aktif",
                  },
                },
              })
            : 0;

          return {
            cabangId: cabang.id,
            namaCabang: cabang.namaCabang,
            superAdmin: superAdminCount,
            admin: adminCount,
            kasir: kasirCount,
            total: superAdminCount + adminCount + kasirCount,
          };
        })
      );

      return breakdown;
    },
    CACHE_TTL.DISTRIBUTION
  );
};

/**
 * Mendapatkan login terbaru
 */
const getRecentLogins = async () => {
  const cacheKey = CACHE_KEYS.RECENT_LOGINS;

  return await cacheOrFetch(
    cacheKey,
    async () => {
      const recentSessions = await prisma.userSession.findMany({
        take: 5, // Ambil 5 login terbaru
        orderBy: {
          createdAt: "desc", // Urutkan berdasarkan waktu terbaru
        },
        include: {
          user: {
            select: {
              id: true,
              namaLengkap: true,
              email: true,
              userRoles: {
                include: {
                  role: true,
                  cabang: true,
                },
              },
            },
          },
        },
      });

      // Format hasil untuk tampilan
      return recentSessions.map((session) => {
        const userRole = session.user?.userRoles[0]; // Ambil role pertama

        return {
          userId: session.user?.id,
          namaLengkap: session.user?.namaLengkap || "",
          email: session.user?.email || "",
          role: userRole?.role.namaRole || "",
          cabang: userRole?.cabang.namaCabang || "",
          cabangId: userRole?.cabang.id || "",
          loginTime: session.createdAt,
        };
      });
    },
    CACHE_TTL.ACTIVITIES
  );
};

/**
 * Mendapatkan data aktivitas user dari AuditLog
 */
const getUserActivities = async () => {
  const cacheKey = CACHE_KEYS.USER_ACTIVITIES;

  return await cacheOrFetch(
    cacheKey,
    async () => {
      // Mengambil aktivitas terbaru
      const recentActivities = await prisma.auditLog.findMany({
        take: 20,
        orderBy: {
          created_at: "desc", // Urutkan berdasarkan waktu terbaru
        },
        include: {
          user: {
            select: {
              id: true,
              namaLengkap: true,
              username: true,
              email: true,
            },
          },
        },
      });

      // Format hasil untuk dashboard
      return recentActivities.map((activity) => {
        return {
          id: activity.log_id,
          userId: activity.user_id,
          userName: activity.user?.namaLengkap || "Unknown",
          action: activity.action,
          tableName: activity.table_name,
          recordId: activity.record_id,
          timestamp: activity.created_at,
          ipAddress: activity.ip_address,
        };
      });
    },
    CACHE_TTL.ACTIVITIES
  );
};

/**
 * Mendapatkan statistik aktivitas user
 */
const getActivityStatistics = async () => {
  const cacheKey = createCacheKey(CACHE_KEYS.USER_ACTIVITIES, "stats");

  return await cacheOrFetch(
    cacheKey,
    async () => {
      // Tanggal untuk 7 hari terakhir
      const last7Days = new Date();
      last7Days.setDate(last7Days.getDate() - 7);

      // Hitung aktivitas per hari untuk 7 hari terakhir
      const dailyActivities = await prisma.$queryRaw`
        SELECT 
          DATE(created_at) as date, 
          COUNT(*) as count 
        FROM audit_log 
        WHERE created_at >= ${last7Days} 
        GROUP BY DATE(created_at) 
        ORDER BY date DESC
      `;

      // Hitung aktivitas per modul/tabel
      const moduleActivities = await prisma.$queryRaw`
        SELECT 
          table_name, 
          COUNT(*) as count,
          COUNT(DISTINCT user_id) as unique_users
        FROM audit_log 
        GROUP BY table_name 
        ORDER BY count DESC 
        LIMIT 10
      `;

      // Convert BigInt to Number in the results
      return {
        dailyActivities: dailyActivities.map((item) => ({
          date: item.date,
          count: Number(item.count),
        })),
        moduleActivities: moduleActivities.map((item) => ({
          table_name: item.table_name,
          count: Number(item.count),
          unique_users: Number(item.unique_users),
        })),
      };
    },
    CACHE_TTL.ACTIVITIES
  );
};

/**
 * Mendapatkan performa kasir berdasarkan transaksi
 */
const getUserPerformance = async () => {
  const cacheKey = createCacheKey(CACHE_KEYS.DASHBOARD, "user_performance");

  return await cacheOrFetch(
    cacheKey,
    async () => {
      // Cari role kasir
      const kasirRole = await prisma.role.findFirst({
        where: {
          namaRole: {
            contains: "kasir",
          },
        },
      });

      if (!kasirRole) {
        return {
          kasirTopTransaksi: [],
          rataRataTransaksi: 0,
          rataRataWaktu: 0,
        };
      }

      // Dapatkan semua user dengan role kasir
      const kasirUsers = await prisma.userRole.findMany({
        where: {
          roleId: kasirRole.id,
          user: {
            status: "aktif",
            deletedAt: null,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              namaLengkap: true,
              email: true,
              status: true,
            },
          },
          cabang: {
            select: {
              id: true,
              namaCabang: true,
            },
          },
        },
      });

      if (kasirUsers.length === 0) {
        return {
          kasirTopTransaksi: [],
          rataRataTransaksi: 0,
          rataRataWaktu: 0,
        };
      }

      // Ambil data transaksi untuk setiap kasir dalam 30 hari terakhir
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const kasirPerformance = await Promise.all(
        kasirUsers.map(async (kasirRole) => {
          const userId = kasirRole.user.id;
          const kasirTransaksi = await prisma.transaksi.findMany({
            where: {
              created_by_user_Id: userId,
              tanggal: {
                gte: thirtyDaysAgo,
              },
            },
            select: {
              transaksi_id: true,
              total: true,
              tanggal: true,
              created_at: true,
            },
          });

          // Hitung rata-rata waktu transaksi (dalam menit)
          let totalWaktu = 0;
          kasirTransaksi.forEach((transaksi) => {
            const createdDate = new Date(transaksi.created_at);
            const tanggalDate = new Date(transaksi.tanggal);
            const diffMinutes =
              Math.abs(tanggalDate - createdDate) / (1000 * 60);
            totalWaktu += diffMinutes;
          });

          const avgWaktu =
            kasirTransaksi.length > 0 ? totalWaktu / kasirTransaksi.length : 0;

          // Hitung total transaksi dan rata-rata nilai transaksi
          const totalNilaiTransaksi = kasirTransaksi.reduce(
            (sum, t) => sum + parseFloat(t.total),
            0
          );
          const avgNilaiTransaksi =
            kasirTransaksi.length > 0
              ? totalNilaiTransaksi / kasirTransaksi.length
              : 0;

          return {
            userId: userId,
            namaKasir: kasirRole.user.namaLengkap,
            username: kasirRole.user.username,
            cabangId: kasirRole.cabang.id,
            namaCabang: kasirRole.cabang.namaCabang,
            jumlahTransaksi: kasirTransaksi.length,
            nilaiTransaksi: totalNilaiTransaksi,
            avgNilaiTransaksi: avgNilaiTransaksi,
            avgWaktuTransaksi: avgWaktu,
          };
        })
      );

      // Urutkan berdasarkan jumlah transaksi
      const sortedByTransaksi = [...kasirPerformance].sort(
        (a, b) => b.jumlahTransaksi - a.jumlahTransaksi
      );

      // Hitung rata-rata transaksi per kasir
      const totalTransaksi = kasirPerformance.reduce(
        (sum, k) => sum + k.jumlahTransaksi,
        0
      );
      const rataRataTransaksi =
        kasirPerformance.length > 0
          ? totalTransaksi / kasirPerformance.length
          : 0;

      // Hitung rata-rata waktu transaksi
      const totalAvgWaktu = kasirPerformance.reduce(
        (sum, k) => sum + k.avgWaktuTransaksi,
        0
      );
      const rataRataWaktu =
        kasirPerformance.length > 0
          ? totalAvgWaktu / kasirPerformance.length
          : 0;

      return {
        kasirTopTransaksi: sortedByTransaksi.slice(0, 5), // Ambil 5 kasir teratas
        rataRataTransaksi: parseFloat(rataRataTransaksi.toFixed(1)),
        rataRataWaktu: parseFloat(rataRataWaktu.toFixed(1)),
      };
    },
    CACHE_TTL.STATS
  );
};

/**
 * Mendapatkan admin cabang teraktif
 */
const getActiveAdminCabang = async () => {
  const cacheKey = createCacheKey(CACHE_KEYS.DASHBOARD, "admin_cabang_aktif");

  return await cacheOrFetch(
    cacheKey,
    async () => {
      // Cari role admin cabang
      const adminCabangRole = await prisma.role.findFirst({
        where: {
          namaRole: {
            contains: "admin",
            not: {
              contains: "super",
            },
          },
        },
      });

      if (!adminCabangRole) {
        return [];
      }

      // Dapatkan semua user dengan role admin cabang
      const adminUsers = await prisma.userRole.findMany({
        where: {
          roleId: adminCabangRole.id,
          user: {
            status: "aktif",
            deletedAt: null,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              namaLengkap: true,
              email: true,
              status: true,
            },
          },
          cabang: {
            select: {
              id: true,
              namaCabang: true,
            },
          },
        },
      });

      if (adminUsers.length === 0) {
        return [];
      }

      // Ambil data audit log untuk aktivitas admin dalam 30 hari terakhir
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const adminActivity = await Promise.all(
        adminUsers.map(async (adminRole) => {
          const userId = adminRole.user.id;

          // Hitung jumlah aktivitas dari audit log
          const logCount = await prisma.auditLog.count({
            where: {
              user_id: userId,
              created_at: {
                gte: thirtyDaysAgo,
              },
            },
          });

          // Ambil aktivitas terakhir
          const lastActivity = await prisma.auditLog.findFirst({
            where: {
              user_id: userId,
            },
            orderBy: {
              created_at: "desc",
            },
          });

          return {
            userId: userId,
            namaAdmin: adminRole.user.namaLengkap,
            username: adminRole.user.username,
            cabangId: adminRole.cabang.id,
            namaCabang: adminRole.cabang.namaCabang,
            jumlahAktivitas: logCount,
            lastActivityTime: lastActivity?.created_at || null,
          };
        })
      );

      // Urutkan berdasarkan jumlah aktivitas
      return adminActivity
        .sort((a, b) => b.jumlahAktivitas - a.jumlahAktivitas)
        .slice(0, 5); // Ambil 5 admin teratas
    },
    CACHE_TTL.STATS
  );
};

/**
 * Mendapatkan semua data untuk dashboard user
 */
const getUserDashboardData = async () => {
  const cacheKey = CACHE_KEYS.DASHBOARD;

  return await cacheOrFetch(
    cacheKey,
    async () => {
      const [
        userStats,
        usersByRole,
        roleDistribution,
        usersPerCabang,
        breakdownUserPerCabang,
        recentLogins,
        userActivities,
        activityStatistics,
        userPerformance,
        activeAdminCabang,
      ] = await Promise.all([
        getUserStats(),
        getUsersByRole(),
        getRoleDistribution(),
        getUsersPerCabang(),
        getBreakdownUserPerCabang(),
        getRecentLogins(),
        getUserActivities(),
        getActivityStatistics(),
        getUserPerformance(),
        getActiveAdminCabang(),
      ]);

      return {
        userStats,
        usersByRole,
        roleDistribution,
        usersPerCabang,
        breakdownUserPerCabang,
        recentLogins,
        activities: {
          recentActivities: userActivities,
          statistics: activityStatistics,
        },
        userPerformance,
        activeAdminCabang,
      };
    },
    CACHE_TTL.DASHBOARD
  );
};

/**
 * Menghapus cache dashboard ketika ada perubahan data user
 */
const invalidateUserCache = async () => {
  await Promise.all([
    cacheDeletePattern(`${CACHE_KEYS.DASHBOARD}*`),
    cacheDeletePattern(`${CACHE_KEYS.USER_STATS}*`),
    cacheDeletePattern(`${CACHE_KEYS.ROLE_DISTRIBUTION}*`),
    cacheDeletePattern(`${CACHE_KEYS.USERS_PER_CABANG}*`),
    cacheDeletePattern(`${CACHE_KEYS.RECENT_LOGINS}*`),
  ]);
};

module.exports = {
  getUserDashboardData,
  getUserStats,
  getUsersByRole,
  getRoleDistribution,
  getUsersPerCabang,
  getBreakdownUserPerCabang,
  getRecentLogins,
  getUserActivities,
  getActivityStatistics,
  getUserPerformance,
  getActiveAdminCabang,
  invalidateUserCache,
};
