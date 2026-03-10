const cron = require("node-cron");
const dayjs = require("dayjs");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const whatsappService = require("../services/whatsappService");
const { logger } = require("../utils/logger");


// Helper to format currency/points
const formatNumber = (amount) => {
    return new Intl.NumberFormat('id-ID').format(amount);
};

// Helper for sending messages
const sendBirthdayWish = async (phone, message, cabangId) => {
    try {
        if (!phone) return false;

        let formattedPhone = phone.replace(/[^0-9]/g, '');
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '62' + formattedPhone.substring(1);
        }

        const botConfig = await prisma.botConfig.findFirst({
            where: {
                cabangId: cabangId,
                isActive: true
            }
        });

        if (!botConfig) {
            logger.warn(`[BirthdayReminder] No active BotConfig found for branch ${cabangId}. Skipping whatsapp message.`);
            return false;
        }

        const wService = new whatsappService();
        const response = await wService.sendMessage(`${formattedPhone}@s.whatsapp.net`, message, botConfig.deviceId);
        logger.info(`[BirthdayReminder] Sent to ${formattedPhone}`);
        return true;
    } catch (error) {
        logger.error(`[BirthdayReminder] Failed to send message to ${phone}:`, error.message);
        return false;
    }
};

/**
 * Check for customers whose birthday is today
 */
const checkBirthdayAndGiveReward = async () => {
    logger.info('[BirthdayReminder] Running checkBirthdayAndGiveReward job...');
    try {
        const today = new Date();
        const currentMonth = today.getMonth() + 1; // 1-12
        const currentDay = today.getDate(); // 1-31

        // Use raw query to extract month and day from tanggalLahir easily
        // Assumes PostgreSQL or similar that supports EXTRACT
        const result = await prisma.$queryRaw`
            SELECT id, "namaPelanggan", telepon, "tanggalLahir", cabang_id 
            FROM "Pelanggan" 
            WHERE EXTRACT(MONTH FROM "tanggalLahir") = ${currentMonth} 
            AND EXTRACT(DAY FROM "tanggalLahir") = ${currentDay}
        `;

        // If queryRaw is not supported (e.g., using sqlite locally), fallback:
        /*
        const allPelanggan = await prisma.pelanggan.findMany({
            where: { tanggalLahir: { not: null } }
        });
        const result = allPelanggan.filter(p => {
             const bd = new Date(p.tanggalLahir);
             return bd.getMonth() + 1 === currentMonth && bd.getDate() === currentDay;
        });
        */

        const rewardsConfig = {
            rewardPoints: 100, // example points
            messageTemplate: "Kabar gembira! Di hari ulang tahun ini, kami memberikan kado spesial *{points} Poin Loyalty* untuk Kakak.\n\nSimpan pesannya, jangan lupa mampir, dan dapatkan kejutan menarik dari kami! 🥳🎁"
        };


        for (const pelanggan of result) {
            if (pelanggan.telepon) {
                // Get Branch Name
                const cabang = await prisma.cabang.findUnique({ where: { id: pelanggan.cabang_id } });
                const branchNameStr = cabang ? cabang.namaCabang : "Toko Kami";

                // Give Reward Points (if loyalty point table exists)
                let pointsAddedInfo = "";
                
                try {
                    // Try adding loyalty points, wrap in transaction
                    await prisma.$transaction(async (tx) => {
                        const existingPoints = await tx.loyaltyPoint.findFirst({
                            where: { pelangganId: pelanggan.id }
                        });

                        if (existingPoints) {
                            await tx.loyaltyPoint.update({
                                where: { id: existingPoints.id },
                                data: { saldoPoin: existingPoints.saldoPoin + rewardsConfig.rewardPoints }
                            });
                        } else {
                            await tx.loyaltyPoint.create({
                                data: {
                                    pelangganId: pelanggan.id,
                                    saldoPoin: rewardsConfig.rewardPoints,
                                    totalDidapat: rewardsConfig.rewardPoints,
                                    totalDipakai: 0
                                }
                            });
                        }

                        // Create History
                        await tx.loyaltyPointHistory.create({
                            data: {
                                pelangganId: pelanggan.id,
                                transaksiId: null, // Just a reward, no transaction
                                jumlahPoin: rewardsConfig.rewardPoints,
                                jenisTransaksi: 'dapat',
                                sumberPoin: 'manual_adjustment',
                                statusPoin: 'aktif',
                                tanggalKadaluarsa: dayjs().add(1, 'year').toDate(),
                                keterangan: 'Reward Ulang Tahun!',
                                userId: null,
                            }
                        });
                    });

                    pointsAddedInfo = rewardsConfig.messageTemplate.replace('{points}', formatNumber(rewardsConfig.rewardPoints));

                } catch (pointError) {
                   logger.error(`[BirthdayReminder] Failed to add points for ${pelanggan.namaPelanggan}:`, pointError.message);
                   // Just fallback to generic greeting if no points
                   pointsAddedInfo = "Semoga panjang umur, sehat selalu, dan dilapangkan rezekinya. Amin. 🥳🎂";
                }
                
                const message = `🎉 *SELAMAT ULANG TAHUN Kak ${pelanggan.namaPelanggan}!* 🎉\n\n` +
                              pointsAddedInfo + `\n\n` +
                              `Salam hangat,\n*${branchNameStr}*`;
                    
                await sendBirthdayWish(pelanggan.telepon, message, pelanggan.cabang_id);
            }
        }
    } catch (error) {
        logger.error('[BirthdayReminder] Error in checkBirthdayAndGiveReward:', error);
    }
};

/**
 * Mengatur jadwal tugas otomatis terkait ulang tahun
 */
const setupBirthdayReminderScheduler = () => {
  // Jalankan pembuatan ucapan ulang tahun setiap hari pukul 09:00 pagi
  cron.schedule("0 9 * * *", checkBirthdayAndGiveReward);
  logger.info('[BirthdayReminder] Scheduler ucapan ulang tahun berhasil diatur (09:00 AM)');
};

module.exports = {
  setupBirthdayReminderScheduler,
  checkBirthdayAndGiveReward
};
