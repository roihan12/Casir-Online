const express = require("express");
const { authenticate } = require("../middleware/authMiddleware");
const kreditNotifikasiController = require("../controllers/kreditNotifikasiController");
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Kredit Notifikasi
 *   description: API untuk mengelola notifikasi kredit
 */

/**
 * @swagger
 * /api/kredit-notifikasi:
 *   post:
 *     summary: Membuat notifikasi kredit baru
 *     tags: [Kredit Notifikasi]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - kreditTransaksiId
 *               - pelangganId
 *               - angsuranKe
 *               - jumlahTagihan
 *               - tanggalJatuhTempo
 *               - jenisNotifikasi
 *               - metodePengiriman
 *             properties:
 *               kreditTransaksiId:
 *                 type: string
 *               pelangganId:
 *                 type: string
 *               angsuranKe:
 *                 type: integer
 *               jumlahTagihan:
 *                 type: number
 *               tanggalJatuhTempo:
 *                 type: string
 *                 format: date
 *               jenisNotifikasi:
 *                 type: string
 *                 enum: [PENGINGAT_SEBELUM_JATUH_TEMPO, PENGINGAT_HARI_JATUH_TEMPO, PENGINGAT_SETELAH_JATUH_TEMPO, PEMBAYARAN_TERLAMBAT, PEMBAYARAN_BERHASIL, KREDIT_LUNAS]
 *               metodePengiriman:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [EMAIL, SMS, WHATSAPP, APP_NOTIFICATION]
 *               pesanNotifikasi:
 *                 type: string
 *     responses:
 *       201:
 *         description: Notifikasi kredit berhasil dibuat
 *       400:
 *         description: Data tidak valid
 *       401:
 *         description: Tidak terautentikasi
 *       500:
 *         description: Terjadi kesalahan server
 */
router.post(
  "/",
  authenticate,
  kreditNotifikasiController.createKreditNotifikasi
);

/**
 * @swagger
 * /api/kredit-notifikasi:
 *   get:
 *     summary: Mendapatkan daftar notifikasi kredit
 *     tags: [Kredit Notifikasi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: kreditTransaksiId
 *         schema:
 *           type: string
 *       - in: query
 *         name: pelangganId
 *         schema:
 *           type: string
 *       - in: query
 *         name: jenisNotifikasi
 *         schema:
 *           type: string
 *       - in: query
 *         name: statusNotifikasi
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Daftar notifikasi kredit berhasil diambil
 *       401:
 *         description: Tidak terautentikasi
 *       500:
 *         description: Terjadi kesalahan server
 */
router.get("/", authenticate, kreditNotifikasiController.getKreditNotifikasi);

/**
 * @swagger
 * /api/kredit-notifikasi/{id}/send:
 *   post:
 *     summary: Mengirim notifikasi kredit
 *     tags: [Kredit Notifikasi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notifikasi kredit berhasil dikirim
 *       401:
 *         description: Tidak terautentikasi
 *       404:
 *         description: Notifikasi kredit tidak ditemukan
 *       500:
 *         description: Terjadi kesalahan server
 */
router.post(
  "/:id/send",
  authenticate,
  kreditNotifikasiController.sendKreditNotifikasi
);

/**
 * @swagger
 * /api/kredit-notifikasi/{id}/read:
 *   patch:
 *     summary: Menandai notifikasi kredit telah dibaca
 *     tags: [Kredit Notifikasi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notifikasi kredit berhasil ditandai telah dibaca
 *       401:
 *         description: Tidak terautentikasi
 *       404:
 *         description: Notifikasi kredit tidak ditemukan
 *       500:
 *         description: Terjadi kesalahan server
 */
router.patch(
  "/:id/read",
  authenticate,
  kreditNotifikasiController.markNotifikasiRead
);

/**
 * @swagger
 * /api/kredit-notifikasi/{id}/cancel:
 *   patch:
 *     summary: Membatalkan notifikasi kredit
 *     tags: [Kredit Notifikasi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notifikasi kredit berhasil dibatalkan
 *       400:
 *         description: Notifikasi yang sudah dikirim tidak dapat dibatalkan
 *       401:
 *         description: Tidak terautentikasi
 *       404:
 *         description: Notifikasi kredit tidak ditemukan
 *       500:
 *         description: Terjadi kesalahan server
 */
router.patch(
  "/:id/cancel",
  authenticate,
  kreditNotifikasiController.cancelKreditNotifikasi
);

/**
 * @swagger
 * /api/kredit-notifikasi/create-reminders:
 *   post:
 *     summary: Membuat notifikasi pengingat pembayaran kredit otomatis
 *     tags: [Kredit Notifikasi]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               daysBefore:
 *                 type: integer
 *                 default: 3
 *               daysAfter:
 *                 type: integer
 *                 default: 1
 *               metodePengiriman:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [EMAIL, SMS, WHATSAPP, APP_NOTIFICATION]
 *                 default: [EMAIL, APP_NOTIFICATION]
 *     responses:
 *       200:
 *         description: Notifikasi pengingat pembayaran kredit berhasil dibuat
 *       401:
 *         description: Tidak terautentikasi
 *       500:
 *         description: Terjadi kesalahan server
 */
router.post(
  "/create-reminders",
  authenticate,
  kreditNotifikasiController.createPaymentReminderNotifications
);

/**
 * @swagger
 * /api/kredit-notifikasi/send-pending:
 *   post:
 *     summary: Mengirim semua notifikasi kredit yang belum dikirim
 *     tags: [Kredit Notifikasi]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notifikasi kredit berhasil dikirim
 *       401:
 *         description: Tidak terautentikasi
 *       500:
 *         description: Terjadi kesalahan server
 */
router.post(
  "/send-pending",
  authenticate,
  kreditNotifikasiController.sendPendingNotifications
);

module.exports = router;
