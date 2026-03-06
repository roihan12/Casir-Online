const prisma = require("../config/db");
const { ResponseError } = require("../error/responseError");

const getHariIni = async (cabangId, reqDate) => {
  const targetDate = reqDate ? new Date(reqDate) : new Date();
  targetDate.setHours(0, 0, 0, 0);

  const rekap = await prisma.rekap_absensi_harian.findFirst({
    where: {
      cabang_id: cabangId,
      tanggal: targetDate,
    },
  });

  if (!rekap) {
    return {
      totalKaryawan: 0,
      totalHadir: 0,
      totalTerlambat: 0,
      totalAlpha: 0,
      totalIzin: 0,
      totalCuti: 0,
      totalWfh: 0,
    };
  }

  return {
    totalKaryawan: rekap.total_karyawan,
    totalHadir: rekap.total_hadir,
    totalTerlambat: rekap.total_terlambat,
    totalAlpha: rekap.total_alpha,
    totalIzin: rekap.total_izin,
    totalCuti: rekap.total_cuti,
    totalWfh: rekap.total_wfh,
  };
};

const getBelumAbsen = async (cabangId, reqDate) => {
  const targetDate = reqDate ? new Date(reqDate) : new Date();
  targetDate.setHours(0, 0, 0, 0);

  // 1. Dapatkan semua jadwal kerja hr ini untuk cabang tersebut
  // 2. Dapatkan absensi hari ini 
  // 3. Filter user dr jadwal yg blm ada di absensi

  const jadwalHariIni = await prisma.jadwalKerja.findMany({
    where: {
      cabangId: cabangId,
      tanggalMulai: { lte: targetDate },
      tanggalSelesai: { gte: targetDate },
    },
    include: {
      user: {
        select: {
          id: true,
          namaLengkap: true,
          avatarUrl: true
        }
      }
    }
  });

  const absensiHariIni = await prisma.absensiPegawai.findMany({
    where: {
      cabangId: cabangId,
      tanggalAbsensi: targetDate,
    },
    select: {
      userId: true,
    },
  });

  const absensiUserIds = absensiHariIni.map((a) => a.userId);

  const belumAbsen = jadwalHariIni
    .filter((j) => !absensiUserIds.includes(j.userId))
    .map((j) => j.user);

  // remove duplicate users (if any user has split schedules)
  const uniqueBelumAbsen = Array.from(new Set(belumAbsen.map((u) => u.id))).map(
    (id) => belumAbsen.find((u) => u.id === id)
  );

  return uniqueBelumAbsen;
};

const getTren = async (cabangId, periode) => {
  // periode = 'bulan' or 'minggu'
  const today = new Date();
  const startDate = new Date();
  
  if (periode === 'minggu') {
    startDate.setDate(today.getDate() - 7);
  } else {
    startDate.setDate(today.getDate() - 30);
  }
  startDate.setHours(0, 0, 0, 0);

  const data = await prisma.rekap_absensi_harian.findMany({
    where: {
      cabang_id: cabangId,
      tanggal: {
        gte: startDate,
        lte: today,
      },
    },
    orderBy: {
      tanggal: 'asc',
    },
    select: {
      tanggal: true,
      total_hadir: true,
      total_izin: true,
      total_alpha: true,
    }
  });

  return data.map(d => ({
    tanggal: d.tanggal.toISOString().split('T')[0],
    hadir: d.total_hadir,
    izin: d.total_izin,
    alpha: d.total_alpha
  }));
};

const getTopTerlambat = async (cabangId, month, year) => {
  const targetMonth = month || new Date().getMonth() + 1;
  const targetYear = year || new Date().getFullYear();

  const startDate = new Date(`${targetYear}-${targetMonth.toString().padStart(2, '0')}-01T00:00:00.000Z`);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);

  const topTerlambat = await prisma.absensiPegawai.groupBy({
    by: ['userId'],
    where: {
      cabangId: cabangId,
      tanggalAbsensi: {
        gte: startDate,
        lt: endDate,
      },
      status_kehadiran: 'hadir_terlambat',
    },
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc'
      }
    },
    take: 10,
  });

  // Get user details
  const result = await Promise.all(
    topTerlambat.map(async (item) => {
      const user = await prisma.user.findUnique({
        where: { id: item.userId },
        select: { namaLengkap: true, avatarUrl: true },
      });
      return {
        userId: item.userId,
        nama: user?.namaLengkap,
        avatar: user?.avatarUrl,
        totalTerlambat: item._count.id,
      };
    })
  );

  return result;
};

const getRekapLembur = async (cabangId, month, year) => {
  const targetMonth = month || new Date().getMonth() + 1;
  const targetYear = year || new Date().getFullYear();

  const startDate = new Date(`${targetYear}-${targetMonth.toString().padStart(2, '0')}-01T00:00:00.000Z`);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);

  const lemburList = await prisma.absensiPegawai.findMany({
    where: {
      cabangId: cabangId,
      tanggalAbsensi: {
        gte: startDate,
        lt: endDate,
      },
      isLembur: true,
    },
    select: {
      userId: true,
      jamLembur: true,
      user: {
        select: {
          id: true,
          namaLengkap: true,
          avatarUrl: true
        }
      }
    }
  });

  // Aggregate by user
  const grouped = {};
  lemburList.forEach(item => {
    if (!grouped[item.userId]) {
      grouped[item.userId] = {
        userId: item.userId,
        nama: item.user?.namaLengkap,
        avatar: item.user?.avatarUrl,
        totalJamLembur: 0
      };
    }
    grouped[item.userId].totalJamLembur += Number(item.jamLembur || 0);
  });

  const result = Object.values(grouped).sort((a, b) => b.totalJamLembur - a.totalJamLembur);
  
  const totalJamKeseluruhan = result.reduce((acc, curr) => acc + curr.totalJamLembur, 0);

  return {
    rekapBulanan: result,
    totalJamLembur: totalJamKeseluruhan
  };
};

const getPendingApproval = async (cabangId) => {
  // Pending izin
  const pendingIzin = await prisma.izinCuti.count({
    where: {
      user: {
        userCabang: {
          some: { cabangId }
        }
      },
      status: 'pending',
    }
  });

  const pendingKoreksi = await prisma.koreksiAbsensi.count({
    where: {
      absensi: {
        cabangId: cabangId
      },
      status: 'pending'
    }
  });

  return {
    pendingIzin,
    pendingKoreksi,
    totalPending: pendingIzin + pendingKoreksi
  };
};

module.exports = {
  getHariIni,
  getBelumAbsen,
  getTren,
  getTopTerlambat,
  getRekapLembur,
  getPendingApproval,
};
