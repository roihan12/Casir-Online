const cron = require("node-cron");
const dayjs = require("dayjs");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const whatsappService = require("../services/whatsappService");
const { logger } = require("../utils/logger");


/**
 * Check for employees who are late for their shift and haven't opened a shift yet.
 * We'll assume the standard rule: Check every hour during common shift start times.
 * This is a simulated logic since there's no strict 'jadwal_shift' table defined in standard schema.
 * We will check users who haven't opened a shift before 10 AM.
 */
const checkLateAttendance = async () => {
    logger.info('[HR-Alert] Running checkLateAttendance job...');
    try {
        const todayStr = dayjs().format("YYYY-MM-DD");
        const todayStart = dayjs().startOf('day').toDate();
        const todayEnd = dayjs().endOf('day').toDate();

        // Find all active branches with bot configs
        const configs = await prisma.botConfig.findMany({
            where: { isActive: true }
        });

        for (const config of configs) {
            // Find all cashiers for this branch
            const cashiers = await prisma.user.findMany({
                where: {
                    cabangId: config.cabangId,
                    roles: { some: { role: { namaRole: 'kasir' } } }
                }
            });

            const wService = new whatsappService();

            for (const cashier of cashiers) {
                // Check if cashier opened a shift today
                const shiftOpenToday = await prisma.shift.findFirst({
                    where: {
                        userId: cashier.id,
                        waktuMulai: {
                            gte: todayStart,
                            lte: todayEnd
                        }
                    }
                });

                if (!shiftOpenToday) {
                    // Send alert to the cashier
                    if (cashier.telepon || cashier.noHp) {
                        let phone = cashier.telepon || cashier.noHp;
                        let formattedPhone = phone.replace(/[^0-9]/g, '');
                        if (formattedPhone.startsWith('0')) formattedPhone = '62' + formattedPhone.slice(1);
                        if (!formattedPhone.endsWith('@s.whatsapp.net')) formattedPhone += '@s.whatsapp.net';

                        const alertMsg = `⚠️ *Peringatan Sistem* ⚠️\n\nHalo ${cashier.namaLengkap},\n\nSistem mendeteksi Anda belum melakukan absensi/buka shift hari ini (${todayStr}). Harap segera buka shift di sistem Kasir Online agar transaksi dapat berjalan.\n\n_Pesan Otomatis dari HR System_`;
                        
                        try {
                            await wService.sendMessage(formattedPhone, alertMsg, config.deviceId);
                            logger.info(`[HR-Alert] Sent late attendance warning to ${cashier.namaLengkap}`);
                        } catch (err) {
                            logger.error(`[HR-Alert] Failed to send to ${cashier.namaLengkap}: ${err.message}`);
                        }
                    }

                    // Optional: CC to Manager
                }
            }
        }
    } catch (error) {
        logger.error('[HR-Alert] Error in checkLateAttendance:', error);
    }
};

/**
 * Initialize HR Scheduler
 */
const setupHRScheduler = () => {
  // Check every day at 10:00 AM if cashiers haven't opened shift
  cron.schedule("0 10 * * *", checkLateAttendance);
  logger.info('[HR-Alert] Scheduler peringatan absensi berhasil diatur (10:00 AM)');
};

module.exports = {
  setupHRScheduler,
  checkLateAttendance
};
