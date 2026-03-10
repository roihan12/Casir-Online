const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const whatsappService = require('./whatsappService');
const dayjs = require('dayjs');
const { logger } = require("../utils/logger");


// Helper to format currency
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
};

// Helper for sending messages
const sendReminder = async (phone, message, cabangId) => {
    try {
        if (!phone) return false;

        // Ensure phone number format is correct (starts with 62)
        let formattedPhone = phone.replace(/[^0-9]/g, '');
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '62' + formattedPhone.substring(1);
        }

        // Get bot config for the branch
        const botConfig = await prisma.botConfig.findFirst({
            where: {
                cabangId: cabangId,
                isActive: true
            }
        });

        if (!botConfig) {
            logger.warn(`[BillingReminder] No active BotConfig found for branch ${cabangId}. Skipping whatsapp message.`);
            return false;
        }

        // We use the first connected device if device_id is required, 
        // or just let the whatsapp service use the default configured logic
        const response = await whatsappService.sendMessage(`${formattedPhone}@s.whatsapp.net`, message, botConfig.deviceId);
        logger.info(`[BillingReminder] Sent to ${formattedPhone}:`, response);
        return true;
    } catch (error) {
        logger.error(`[BillingReminder] Failed to send message to ${phone}:`, error.message);
        return false;
    }
};


/**
 * Check for Hutang (Debt) nearing due date
 */
const checkHutangJatuhTempo = async () => {
    logger.info('[BillingReminder] Running checkHutangJatuhTempo job...');
    try {
        const today = dayjs().startOf('day');
        // Define targets: Today, Tomorrow (H-1), and 3 Days from now (H-3)
        const targets = [
            today.toDate(),
            today.add(1, 'day').toDate(),
            today.add(3, 'day').toDate(),
        ];

        // We'll search for Hutang where jatuhTempo is exactly on those target days
        for (const targetDate of targets) {
            const startOfDay = dayjs(targetDate).startOf('day').toDate();
            const endOfDay = dayjs(targetDate).endOf('day').toDate();

            const hutangs = await prisma.hutang.findMany({
                where: {
                    statusHutang: 'aktif',
                    sisaHutang: { gt: 0 },
                    jatuhTempo: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                },
                include: {
                    pelanggan: true,
                    cabang: true
                }
            });

            for (const hutang of hutangs) {
                // If the debtor is a customer and they have a phone number
                if (hutang.pelanggan && hutang.pelanggan.telepon) {
                    const daysDiff = dayjs(targetDate).diff(today, 'day');
                    let timeWarning = '';
                    if (daysDiff === 0) timeWarning = 'HARI INI';
                    else if (daysDiff === 1) timeWarning = 'BESOK';
                    else timeWarning = `dalam ${daysDiff} hari`;

                    const message = `Halo Kak ${hutang.pelanggan.namaPelanggan},\n\n` +
                                  `Ini adalah pengingat otomatis dari *${hutang.cabang.namaCabang}*.\n` +
                                  `Tagihan dengan nomor referensi *${hutang.nomorReferensi}* akan jatuh tempo ${timeWarning} (${dayjs(hutang.jatuhTempo).format('DD MMM YYYY')}).\n\n` +
                                  `Sisa tagihan yang harus dibayar: *${formatCurrency(hutang.sisaHutang)}*.\n\n` +
                                  `Mohon abaikan pesan ini jika pembayaran sudah dilakukan. Terima kasih 🙏`;
                    
                    await sendReminder(hutang.pelanggan.telepon, message, hutang.cabangId);
                }
            }
        }
    } catch (error) {
        logger.error('[BillingReminder] Error in checkHutangJatuhTempo:', error);
    }
};

/**
 * Check for Kredit (Installments) nearing due date
 */
const checkKreditJatuhTempo = async () => {
    logger.info('[BillingReminder] Running checkKreditJatuhTempo job...');
    try {
        const today = dayjs().startOf('day');
        const startOfToday = today.toDate();
        // Since credit installments are usually monthly, we check for "KreditNotifikasi" that need to be sent
        // Specifically Notification records that haven't been sent yet for upcoming due dates

        const notifikasis = await prisma.kreditNotifikasi.findMany({
            where: {
                statusNotifikasi: 'belum_dikirim',
                tanggalJatuhTempo: {
                    lte: today.add(3, 'day').toDate() // within the next 3 days
                }
            },
            include: {
                pelanggan: true,
                kreditTransaksi: {
                    include: {
                        kreditSetting: true
                    }
                }
            }
        });

        for (const notif of notifikasis) {
             if (notif.pelanggan && notif.pelanggan.telepon) {
                const isLate = dayjs(notif.tanggalJatuhTempo).isBefore(today);
                const daysDiff = Math.abs(dayjs(notif.tanggalJatuhTempo).diff(today, 'day'));
                
                let timeWarning = '';
                if (dayjs(notif.tanggalJatuhTempo).isSame(today, 'day')) {
                    timeWarning = 'HARI INI';
                } else if (isLate) {
                    timeWarning = `TELAH LEWAT ${daysDiff} hari`;
                } else {
                    timeWarning = `dalam ${daysDiff} hari`;
                }

                // Temporary logic: get branch somehow (KreditSetting belongs to customer, which has a branch_id)
                const cabangId = notif.pelanggan.cabang_id; 
                // Note: branch name might not be retrieved here unless we include it, fallback to generic
                const storeName = "Toko Kami"; 

                const message = `Halo Kak ${notif.pelanggan.namaPelanggan},\n\n` +
                              `Ini adalah pengingat otomatis.\n` +
                              `Angsuran ke-${notif.angsuranKe} Anda akan jatuh tempo ${timeWarning} (${dayjs(notif.tanggalJatuhTempo).format('DD MMM YYYY')}).\n\n` +
                              `Jumlah tagihan: *${formatCurrency(notif.jumlahTagihan)}*.\n\n` +
                              `Mohon abaikan pesan ini jika pembayaran sudah dilakukan. Terima kasih 🙏`;
                
                const sent = await sendReminder(notif.pelanggan.telepon, message, cabangId);

                // Update notification status if successfully sent
                if (sent) {
                     await prisma.kreditNotifikasi.update({
                         where: { id: notif.id },
                         data: { 
                             statusNotifikasi: 'terkirim',
                             tanggalKirim: new Date()
                         }
                     });
                }
             }
        }
    } catch (error) {
        logger.error('[BillingReminder] Error in checkKreditJatuhTempo:', error);
    }
};

/**
 * Initialize all cron jobs
 */
const initCronJobs = () => {
    logger.info('[BillingReminder] Initializing cron jobs...');
    
    // Run every day at 08:00 AM (server time/local time)
    // 0 8 * * *
    cron.schedule('0 8 * * *', async () => {
        logger.info('[BillingReminder] Triggering daily billing check (08:00 AM)');
        await checkHutangJatuhTempo();
        await checkKreditJatuhTempo();
    });

    logger.info('[BillingReminder] Cron jobs initialized. Scheduled for 08:00 daily.');
};

module.exports = {
    initCronJobs,
    checkHutangJatuhTempo,
    checkKreditJatuhTempo,
    sendReminder // Exported for manual trigger/webhook usage
};
