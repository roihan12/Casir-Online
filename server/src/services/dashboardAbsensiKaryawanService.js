const prisma = require("../config/db");

const getMe = async (userId, targetDate) => {
  const date = targetDate ? new Date(targetDate) : new Date();
  date.setHours(0, 0, 0, 0);

  const absensiHariIni = await prisma.absensiPegawai.findFirst({
    where: {
      userId: userId,
      tanggalAbsensi: date,
    },
  });

  const jadwalHariIni = await prisma.jadwalKerja.findFirst({
    where: {
      userId: userId,
      tanggalMulai: { lte: date },
      tanggalSelesai: { gte: date },
    },
  });

  return {
    sudahAbsen: !!absensiHariIni,
    waktuMasuk: absensiHariIni?.waktuMasuk || null,
    waktuKeluar: absensiHariIni?.waktuKeluar || null,
    jadwalMasuk: jadwalHariIni?.jamMasuk || null,
    statusKehadiran: absensiHariIni?.status_kehadiran || null,
  };
};

const getRekapBulan = async (userId, month, year) => {
  const targetMonth = month || new Date().getMonth() + 1;
  const targetYear = year || new Date().getFullYear();

  const startDate = new Date(`${targetYear}-${targetMonth.toString().padStart(2, '0')}-01T00:00:00.000Z`);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);

  const absensiList = await prisma.absensiPegawai.findMany({
    where: {
      userId: userId,
      tanggalAbsensi: {
        gte: startDate,
        lt: endDate,
      },
    },
  });

  const rekap = {
    totalHadir: 0,
    totalIzin: 0,
    totalAlpha: 0,
    totalTerlambat: 0,
  };

  absensiList.forEach((absensi) => {
    if (['hadir', 'hadir_terlambat', 'hadir_pulang_cepat'].includes(absensi.status_kehadiran)) {
      rekap.totalHadir++;
    }
    if (absensi.status_kehadiran === 'hadir_terlambat') {
      rekap.totalTerlambat++;
    }
    if (['izin_sakit', 'izin_keperluan'].includes(absensi.status_kehadiran)) {
      rekap.totalIzin++;
    }
    if (absensi.status_kehadiran === 'alpha') {
      rekap.totalAlpha++;
    }
  });

  return rekap;
};

const getSaldoCuti = async (userId, year) => {
  const targetYear = year || new Date().getFullYear();

  const kuotaCuti = await prisma.kuotaCuti.findFirst({
    where: {
      userId: userId,
      tahun: targetYear,
    },
  });

  if (!kuotaCuti) {
    return {
      kuotaTahunan: 0,
      kuotaTerpakai: 0,
      sisaKuota: 0,
    };
  }

  // we assume the schema has these fields or similar.
  // if not exactly matched, this is an approximation depending on real prisma schema fields for kuotaCuti.
  return {
    kuotaTahunan: kuotaCuti.kuota_tahunan || 12,
    kuotaDiambil: kuotaCuti.kuota_diambil || 0,
    kuotaPending: kuotaCuti.kuota_pending || 0,
    kuotaSisa: kuotaCuti.kuota_sisa || 0,
  };
};

const getSlipTerbaru = async (userId) => {
  const latestSlip = await prisma.slipGaji.findFirst({
    where: {
      user_id: userId,
      status: { in: ['final', 'terbayar'] }
    },
    orderBy: {
      periode: 'desc',
    },
    // include: { slipGajiDetail: true } if need components
  });

  if (!latestSlip) return null;

  return {
    slipId: latestSlip.slip_id,
    periode: latestSlip.periode,
    gajiBersih: latestSlip.gaji_bersih,
    status: latestSlip.status,
  };
};

const getJadwalMingguIni = async (userId, targetDate) => {
  const startOfWeek = targetDate ? new Date(targetDate) : new Date();
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  const jadwal = await prisma.jadwalKerja.findMany({
    where: {
      userId: userId,
      tanggalMulai: { lte: endOfWeek },
      tanggalSelesai: { gte: startOfWeek },
    },
    orderBy: {
      tanggalMulai: 'asc',
    },
  });

  // Since JadwalKerja in Casir-Online uses tanggalMulai / tanggalSelesai to represent a period
  // We will just return the valid records
  return jadwal;
};

module.exports = {
  getMe,
  getRekapBulan,
  getSaldoCuti,
  getSlipTerbaru,
  getJadwalMingguIni,
};
