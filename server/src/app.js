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

const {
  setupNotificationScheduler,
} = require("./schedulers/notificationScheduler");
const {
  setupKreditNotifikasiScheduler,
} = require("./schedulers/kreditNotifikasiScheduler");

if (process.env.ENABLE_SCHEDULERS === "true") {
  setupNotificationScheduler();
  setupKreditNotifikasiScheduler();
}

let corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
  ], // Tambahkan semua URL development
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

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
app.use("/api/financial-report", financialReportRoutes);
app.use("/api/kredit-rekomendasi", kreditRekomendasiRoutes);
app.use("/api/kredit-notifikasi", kreditNotifikasiRoutes);
app.use("/api/hutang", pembayaranHutangRoutes);
app.use("/api/transaksi", promoPreviewRoutes);
app.use("/api/promos", promoRoutes);
app.use("/api/discount-config", discountConfigRoutes);
app.use("/api/loyalty", loyaltyRoutes);

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
