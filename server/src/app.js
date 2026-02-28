const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const { errorMiddleware } = require("./middleware/errorMiddleware");

// Import routes
const authRoutes = require("./routes/authRoutes");
const cabangRoutes = require("./routes/cabangRoutes");
const userRoutes = require("./routes/userRoutes");
const produkMasterRoutes = require("./routes/produkMasterRoutes");
const produkRoutes = require("./routes/produkRoutes");
const roleRoutes = require("./routes/roleRoutes");
const permissionRoutes = require("./routes/permissionRoutes");
const menuRoutes = require("./routes/menuRoutes");
const menuViewRoutes = require("./routes/menuViewRoutes");
const kategoriRoutes = require("./routes/kategoriRoutes");
const userRoleCabangRoutes = require("./routes/userRoleCabangRoutes");
const supplierRoutes = require("./routes/supplierRoutes");
const pelangganRoutes = require("./routes/pelangganRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const stockTransferRoutes = require("./routes/stockTransferRoutes");
const shiftRoutes = require("./routes/shiftRoutes");
const transaksiRoutes = require("./routes/transaksiRoutes");
const receiptRoutes = require("./routes/receiptRoutes");
const qrisRoutes = require("./routes/qrisRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const inventoryBatchRoutes = require("./routes/inventoryBatchRoutes");
const inventoryReportRoutes = require("./routes/inventoryReportRoutes");
const taxRoutes = require("./routes/taxRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const produkRequestRoutes = require("./routes/produkRequestRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const kasirRoutes = require("./routes/kasirRoutes");
const userDashboardRoutes = require("./routes/userDashboardRoutes");
const userAvatarRoutes = require("./routes/userAvatarRoutes");
const productDashboardRoutes = require("./routes/productDashboardRoutes");
const productMasterDashboardRoutes = require("./routes/productMasterDashboardRoutes");
const transactionDashboardRoutes = require("./routes/transactionDashboardRoutes");
const inventoryDashboardRoutes = require("./routes/inventoryDashboardRoutes");
const operationalHoursRoutes = require("./routes/operationalHoursRoutes");
const produkSupplierRoutes = require("./routes/produkSupplierRoutes");
const financialReportRoutes = require("./routes/financialReportRoutes");
const kreditRekomendasiRoutes = require("./routes/kreditRekomendasiRoutes");
const kreditNotifikasiRoutes = require("./routes/kreditNotifikasiRoutes");
const pembayaranHutangRoutes = require("./routes/pembayaranHutangRoutes");
const promoPreviewRoutes = require("./routes/promoPreviewRoutes");
const promoRoutes = require("./routes/promoRoutes");
const discountConfigRoutes = require("./routes/discountConfigRoutes");
const loyaltyRoutes = require("./routes/loyaltyRoutes");
const whatsappRoutes = require('./routes/whatsappRoutes');
const broadcastRoutes = require("./routes/broadcastRoutes");
const reportRoutes = require("./routes/reportRoutes");
const reportExportRoutes = require("./routes/reportExportRoutes");
const shiftReportRoutes = require("./routes/shiftReportRoutes");
const transactionReportRoutes = require("./routes/transactionReportRoutes");
const customerReportRoutes = require("./routes/customerReportRoutes");
const promoReportRoutes = require("./routes/promoReportRoutes");
const auditRoutes = require("./routes/auditRoutes");
const absensiRoutes = require("./routes/absensiRoutes");
const lokasiAbsensiRoutes = require("./routes/lokasiAbsensiRoutes");
const masterShiftRoutes = require("./routes/masterShiftRoutes");
const jadwalRoutes = require("./routes/jadwalRoutes");
const koreksiAbsensiRoutes = require("./routes/koreksiAbsensiRoutes");
const reguRoutes = require("./routes/reguRoutes");
const hariLiburRoutes = require("./routes/hariLiburRoutes");
const izinRoutes = require("./routes/izinRoutes");
const kuotaCutiRoutes = require("./routes/kuotaCutiRoutes");
const penggajianRoutes = require("./routes/penggajianRoutes");
const importProdukMasterRoutes = require("./routes/importProdukMasterRoutes");
const importProdukRoutes = require("./routes/importProdukRoutes");
const ocrRoutes = require("./routes/ocrRoutes");
const userNotificationRoutes = require("./routes/userNotificationRoutes");
const catalogRoutes = require("./routes/catalogRoutes");
const checkoutRoutes = require("./routes/checkoutRoutes");
const paymentWebhookRoutes = require("./routes/paymentWebhookRoutes");
const driverRoutes = require("./routes/driverRoutes");
const deliveryRoutes = require("./routes/deliveryRoutes");


const {
  setupNotificationScheduler,
} = require("./schedulers/notificationScheduler");
const {
  setupKreditNotifikasiScheduler,
} = require("./schedulers/kreditNotifikasiScheduler");
const {
  setupOrderExpiryScheduler,
} = require("./schedulers/orderExpiryScheduler");

if (process.env.ENABLE_SCHEDULERS === "true") {
  setupNotificationScheduler();
  setupKreditNotifikasiScheduler();
  setupOrderExpiryScheduler();
}

let corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (/^https:\/\/localhost:\d+$/.test(origin) || 
        /^https:\/\/127\.0\.0\.1:\d+$/.test(origin) || 
        /^https:\/\/192\.168\.\d+\.\d+:\d+$/.test(origin)) {
      return callback(null, true);
    }
    // Set production origins here
    // if (origin === 'https://yourproductiondomain.com') return callback(null, true);
    
    callback(new Error('Not allowed by CORS'));
  }, // Mendukung regex untuk URL development termasuk jaringan lokal
  credentials: true,
};

// Initialize express app
const app = express();
app.use(cors(corsOptions));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  next();
});

// Apply middleware
app.use(cookieParser());
app.use(helmet());

// Raw body parser for webhook signature verification
// Must be before express.json() to capture raw body
app.use('/api/whatsapp/webhook',
  bodyParser.json({
    verify: (req, res, buf) => {
      // Store raw body for HMAC signature verification
      req.rawBody = buf.toString('utf8');
    }
  })
);

// Regular JSON parser for other routes
// Increase limit for face recognition photos (base64 can be large)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(morgan("combined"));

// Apply rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 400, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes",
});
app.use("/api/", limiter);

// Apply routes
app.use("/api/auth", authRoutes);
app.use("/api/cabang", cabangRoutes);
app.use("/api/users", userRoutes);
app.use("/api/produk-master", produkMasterRoutes);
app.use("/api/produk", produkRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/menus", menuRoutes);
app.use("/api/menu-view", menuViewRoutes);
app.use("/api/kategori", kategoriRoutes);
app.use("/api/user-management", userRoleCabangRoutes);
app.use("/api/supplier", supplierRoutes);
app.use("/api/pelanggan", pelangganRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/stock-transfers", stockTransferRoutes);
app.use("/api/shifts", shiftRoutes);
app.use("/api/transaksi", transaksiRoutes);
app.use("/api/receipt", receiptRoutes);
app.use("/api/qris", qrisRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/inventory-batch", inventoryBatchRoutes);
app.use("/api/inventory-report", inventoryReportRoutes);
app.use("/api/tax", taxRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/user-notifications", userNotificationRoutes);
app.use("/api/produk-request", produkRequestRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/kasir", kasirRoutes);
app.use("/api/user-dashboard", userDashboardRoutes);
app.use("/api/user-avatar", userAvatarRoutes);
app.use("/api/product-dashboard", productDashboardRoutes);
app.use("/api/product-master-dashboard", productMasterDashboardRoutes);
app.use("/api/transaction-dashboard", transactionDashboardRoutes);
app.use("/api/inventory-dashboard", inventoryDashboardRoutes);
app.use("/api/operational-hours", operationalHoursRoutes);
app.use("/api/produk-supplier", produkSupplierRoutes);
app.use("/api/financial", financialReportRoutes);
app.use("/api/kredit-rekomendasi", kreditRekomendasiRoutes);
app.use("/api/kredit-notifikasi", kreditNotifikasiRoutes);
app.use("/api/hutang", pembayaranHutangRoutes);
app.use("/api/transaksi", promoPreviewRoutes);
app.use("/api/promos", promoRoutes);
app.use("/api/discount-config", discountConfigRoutes);
app.use("/api/loyalty", loyaltyRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/reports/export", reportExportRoutes);
app.use("/api/reports/shift", shiftReportRoutes);
app.use("/api/reports/transactions", transactionReportRoutes);
app.use("/api/reports/customer", customerReportRoutes);
app.use("/api/reports/promo", promoReportRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/broadcast", broadcastRoutes);
app.use("/api/audit-logs", auditRoutes);
app.use("/api/attendance", absensiRoutes);
app.use("/api/attendance-locations", lokasiAbsensiRoutes);
app.use("/api/master-shifts", masterShiftRoutes);
app.use("/api/jadwal", jadwalRoutes);
app.use("/api/koreksi-absensi", koreksiAbsensiRoutes);
app.use("/api/regu", reguRoutes);
app.use("/api/hari-libur", hariLiburRoutes);
app.use("/api/izin-cuti", izinRoutes);
app.use("/api/kuota-cuti", kuotaCutiRoutes);
app.use("/api/penggajian", penggajianRoutes);
app.use("/api/import/produk-master", importProdukMasterRoutes);
app.use("/api/import/produk", importProdukRoutes);
app.use("/api/ocr", ocrRoutes);

// Public routes (no auth required)
app.use("/api/catalog", catalogRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/payment/webhook", paymentWebhookRoutes);

// Authenticated routes for driver & delivery
app.use("/api/drivers", driverRoutes);
app.use("/api/delivery", deliveryRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

// Error handler
app.use(errorMiddleware);

module.exports = app;
