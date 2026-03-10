const cron = require("node-cron");
const prisma = require("../config/db");
const { logger } = require("../utils/logger");


const generateRekapHarian = async () => {
  logger.info('[Absensi-Scheduler] Running generateRekapHarian job...');
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cabangs = await prisma.cabang.findMany();

    for (const cabang of cabangs) {
      const absensis = await prisma.absensiPegawai.findMany({
        where: {
          cabangId: cabang.id,
          tanggalAbsensi: today
        }
      });

      let hadir = 0, terlambat = 0, alpha = 0, izin = 0, cuti = 0, wfh = 0;

      absensis.forEach(a => {
        if (a.status_kehadiran === 'hadir') hadir++;
        if (a.status_kehadiran === 'hadir_terlambat') terlambat++;
        if (a.status_kehadiran === 'alpha') alpha++;
        if (a.status_kehadiran === 'izin_sakit' || a.status_kehadiran === 'izin_keperluan') izin++;
        if (a.status_kehadiran === 'cuti') cuti++;
        if (a.status_kehadiran === 'wfh') wfh++;
      });

      await prisma.rekap_absensi_harian.upsert({
        where: {
          rekap_absensi_harian_cabang_tanggal_unique: {
            cabang_id: cabang.id,
            tanggal: today
          }
        },
        update: {
          total_karyawan: absensis.length, // approximation or query total user in cabang
          total_hadir: hadir + terlambat + wfh,
          total_terlambat: terlambat,
          total_alpha: alpha,
          total_izin: izin,
          total_cuti: cuti,
          total_wfh: wfh,
          updated_at: new Date()
        },
        create: {
          cabang_id: cabang.id,
          tanggal: today,
          total_karyawan: absensis.length,
          total_hadir: hadir + terlambat + wfh,
          total_terlambat: terlambat,
          total_alpha: alpha,
          total_izin: izin,
          total_cuti: cuti,
          total_wfh: wfh,
        }
      });
    }
  } catch (error) {
    logger.error('[Absensi-Scheduler] Error in generateRekapHarian:', error);
  }
};

const alertBelumAbsen = async () => {
  logger.info('[Absensi-Scheduler] Running alertBelumAbsen job...');
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Dapatkan pengguna yang harusnya kerja ttp belum absen
    const jadwals = await prisma.jadwalKerja.findMany({
      where: {
        tanggalMulai: { lte: today },
        tanggalSelesai: { gte: today },
      },
      include: {
        user: true
      }
    });

    for (const jadwal of jadwals) {
      const absen = await prisma.absensiPegawai.findFirst({
        where: {
          userId: jadwal.userId,
          tanggalAbsensi: today
        }
      });

      if (!absen) {
        // Send notification dynamically (email, in-app, or WA)
        // Here we create in-app notification context
        await prisma.notifikasi.create({
          data: {
            user_id: jadwal.userId,
            judul: 'Pengingat Absensi',
            pesan: 'Anda belum melakukan absensi hari ini. Silakan absen masuk sekarang!',
            tipe: 'peringatan',
            is_read: false
          }
        });
      }
    }
  } catch (error) {
    logger.error('[Absensi-Scheduler] Error in alertBelumAbsen:', error);
  }
};

const generateKuotaCuti = async () => {
  logger.info('[Absensi-Scheduler] Running generateKuotaCuti job...');
  try {
    const currentYear = new Date().getFullYear();
    const activeUsers = await prisma.user.findMany({
      where: {
        isActive: true
      }
    });

    for (const user of activeUsers) {
      await prisma.kuotaCuti.upsert({
        where: {
          user_id_tahun_unique: {
            userId: user.id,
            tahun: currentYear
          }
        },
        update: {},
        create: {
          userId: user.id,
          tahun: currentYear,
          kuota_tahunan: 12, // Default standard
          kuota_diambil: 0,
          kuota_pending: 0,
          kuota_sisa: 12,
        }
      });
    }
  } catch (error) {
    logger.error('[Absensi-Scheduler] Error in generateKuotaCuti:', error);
  }
};

const generateSlipGajiDraft = async () => {
  logger.info('[Absensi-Scheduler] Running generateSlipGajiDraft job...');
  try {
    const now = new Date();
    // Generate untuk bulan ini
    let month = now.getMonth() + 1;
    let year = now.getFullYear();

    const periodeStr = `${year}-${month.toString().padStart(2, '0')}`;
    
    // Get all active users
    const activeUsers = await prisma.user.findMany({
      where: { isActive: true },
      include: {
        userCabang: true
      }
    });

    for (const user of activeUsers) {
      if (user.userCabang.length > 0) {
        const primaryCabang = user.userCabang[0].cabangId;

        // Check if draft already exists
        const existingSlip = await prisma.slip_gaji.findFirst({
          where: {
            user_id: user.id,
            periode: periodeStr
          }
        });

        if (!existingSlip) {
          await prisma.slip_gaji.create({
            data: {
              user_id: user.id,
              cabang_id: primaryCabang,
              periode: periodeStr,
              status: 'draft',
              gaji_pokok: 0, // Should be fetched from riwayat_gaji_pegawai if available
              gaji_bersih: 0
            }
          });
        }
      }
    }
    logger.info(`[Absensi-Scheduler] Draft created for ${periodeStr}`);
  } catch (error) {
    logger.error('[Absensi-Scheduler] Error in generateSlipGajiDraft:', error);
  }
};

const setupAbsensiScheduler = () => {
  // 1. Refresh Rekap Harian (hourly) -- Run at minute 0 past every hour
  cron.schedule("0 * * * *", generateRekapHarian);

  // 2. Alert Belum Absen (09:30 AM on weekdays Monday to Friday)
  cron.schedule("30 9 * * 1-5", alertBelumAbsen);

  // 3. Generate Kuota Cuti (annually at midnight on Jan 1)
  cron.schedule("0 0 1 1 *", generateKuotaCuti);

  // 4. Generate Slip Gaji Draft (monthly on the 25th at 5:00 AM)
  cron.schedule("0 5 25 * *", generateSlipGajiDraft);

  logger.info('[Absensi-Scheduler] Setup completed');
};

module.exports = {
  setupAbsensiScheduler,
  generateRekapHarian,
  alertBelumAbsen,
  generateKuotaCuti,
  generateSlipGajiDraft
};
