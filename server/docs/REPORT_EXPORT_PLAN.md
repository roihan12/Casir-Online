  # Plan Implementasi Fitur Laporan dengan Export Data

## Ringkasan Eksekutif

Dokumen ini merencanakan implementasi lengkap fitur laporan dengan ekspor data untuk sistem POS Casir-Online. Fitur ini sudah sebagian diimplementasikan namun memerlukan penyelesaian untuk berfungsi penuh.

---

## Status Saat Ini

### ✅ Sudah Diimplementasikan (Backend)

| Komponen | File | Status |
|----------|------|--------|
| Export Routes | `server/src/routes/reportExportRoutes.js` | ✅ Selesai |
| Export Controller | `server/src/controllers/reportExportController.js` | ✅ Selesai |
| Export Service | `server/src/services/exportService.js` | ✅ Selesai |
| Validation Schema | `server/src/validation/reportExportValidation.js` | ✅ Selesai |
| Route Integration | `server/src/app.js:151` | ✅ Selesai |

### ✅ Sudah Diimplementasikan (Frontend)

| Komponen | File | Status |
|----------|------|--------|
| Export Component | `client-backup/src/features/reports/components/ExportDropdown.jsx` | ✅ Selesai |
| Export Hook | `client-backup/src/features/reports/hooks/useReports.js` | ✅ Selesai |
| Export Service | `client-backup/src/features/reports/services/reportService.js` | ✅ Selesai |
| Report Pages | `client-backup/src/features/reports/pages/*.jsx` | ⚠️ Menggunakan Mock Data |

### ❌ Belum Diimplementasikan / Perlu Perbaikan

| Masalah | Detail |
|---------|--------|
| **API Data Fetching** | Frontend menggunakan mock data, belum terhubung ke API real |
| **Service Dependencies** | `FinancialReportService` dan `InventoryReportService` perlu diverifikasi |
| **Data Display** | Halaman report menampilkan mock data, perlu integrasi API nyata |

---

## Arsitektur Solusi

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                              │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐      │
│  │ Report Pages │ ───▶ │ Export Comp. │ ───▶ │ useReports   │      │
│  │ (Sales,      │      │ (Export      │      │ Hook         │      │
│  │  Finance,    │      │  Dropdown)   │      │              │      │
│  │  Inventory,  │      └──────────────┘      └──────┬───────┘      │
│  │  Branch)     │                                    │              │
│  └──────┬───────┘                                    │              │
│         │                                             │              │
│         ▼                                             ▼              │
│  ┌─────────────────────────────────────────────────────────┐       │
│  │              reportService.exportReport()               │       │
│  └────────────────────────────┬────────────────────────────┘       │
└───────────────────────────────┼─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        BACKEND (Express)                             │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  /api/reports/export/{reportType}                            │  │
│  └───────────────────────────────┬──────────────────────────────┘  │
│                                  │                                  │
│                                  ▼                                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  reportExportController (export*Report methods)              │  │
│  └───────────────────────────────┬──────────────────────────────┘  │
│                                  │                                  │
│                                  ▼                                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Data Fetching Functions (get*ReportData)                    │  │
│  └───────────────────────────────┬──────────────────────────────┘  │
│                                  │                                  │
│                                  ▼                                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  ExportService (exportToExcel/PDF/CSV)                       │  │
│  └───────────────────────────────┬──────────────────────────────┘  │
│                                  │                                  │
│                                  ▼                                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Prisma (Database)                                           │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Rencana Implementasi

### Fase 1: Verifikasi Backend Service Dependencies

**Tujuan:** Memastikan semua service dependencies tersedia dan berfungsi.

| Tugas | File | Detail |
|-------|------|--------|
| 1.1 | `server/src/services/financialReportService.js` | Verifikasi method `getDetailedTransactions()` |
| 1.2 | `server/src/services/inventoryReportService.js` | Verifikasi ketersediaan dan implementasi |
| 1.3 | `server/src/services/exportService.js` | Verifikasi `getColumnsForReportType()` |

**Acceptance Criteria:**
- [ ] FinancialReportService.getDetailedTransactions() tersedia
- [ ] InventoryReportService terimplementasi dengan benar
- [ ] ExportService memiliki column definitions untuk semua report types

---

### Fase 2: Implementasi API Data Fetching untuk View (Non-Export)

**Tujuan:** Menambahkan API endpoints untuk data fetching non-export (untuk display di browser).

| Tugas | Endpoint | Method | Detail |
|-------|----------|--------|--------|
| 2.1 | `/api/reports/sales` | GET | Data laporan penjualan dengan pagination |
| 2.2 | `/api/reports/sales/summary` | GET | Ringkasan penjualan (total, rata-rata, dll) |
| 2.3 | `/api/reports/sales/products` | GET | Produk terlaris |
| 2.4 | `/api/reports/sales/categories` | GET | Penjualan per kategori |
| 2.5 | `/api/reports/financial/dashboard` | GET | Dashboard keuangan (sudah ada?) |
| 2.6 | `/api/reports/financial/summary` | GET | Ringkasan keuangan |
| 2.7 | `/api/reports/financial/transactions` | GET | Transaksi keuangan |
| 2.8 | `/api/reports/inventory/dashboard` | GET | Dashboard inventori |
| 2.9 | `/api/reports/inventory/movements` | GET | Pergerakan stok |
| 2.10 | `/api/reports/branch` | GET | Perbandingan cabang |

**Acceptance Criteria:**
- [ ] Semua endpoint terdaftar di `app.js`
- [ ] Controller dan service terimplementasi
- [ ] Response format konsisten dengan frontend expectation
- [ ] Support pagination dan filtering

---

### Fase 3: Frontend Integration - Mengganti Mock Data

**Tujuan:** Menghubungkan frontend ke API real dan menghapus mock data.

| Tugas | File | Detail |
|-------|------|--------|
| 3.1 | `SalesReport.jsx` | Ganti mock data dengan `useSalesReport` hook |
| 3.2 | `FinanceReport.jsx` | Integrasikan `useFinancialReport` dan `useFinancialSummary` |
| 3.3 | `InventoryReport.jsx` | Integrasikan `useInventoryReport` hook |
| 3.4 | `BranchReport.jsx` | Integrasikan `useBranchReport` hook |
| 3.5 | Error handling | Tambahkan proper error handling dan loading states |
| 3.6 | Empty states | Tambahkan UI untuk data kosong |

**Acceptance Criteria:**
- [ ] Tidak ada mock data yang digunakan
- [ ] Data diambil dari API real
- [ ] Loading indicator ditampilkan saat fetching
- [ ] Error ditampilkan dengan jelas
- [ ] Export button berfungsi dengan data real

---

### Fase 4: Testing & Validation

**Tujuan:** Memastikan semua fitur berfungsi dengan benar.

| Tugas | Detail |
|-------|--------|
| 4.1 | Test export Excel untuk semua jenis laporan |
| 4.2 | Test export PDF untuk semua jenis laporan |
| 4.3 | Test export CSV untuk semua jenis laporan |
| 4.4 | Test filter tanggal dan cabang |
| 4.5 | Test dengan data kosong |
| 4.6 | Test dengan dataset besar |
| 4.7 | Verifikasi permissions middleware |

---

## Detail Implementasi

### A. Struktur Folder

```
server/src/
├── routes/
│   └── reportExportRoutes.js          ✅ Sudah ada
├── controllers/
│   └── reportExportController.js      ✅ Sudah ada
├── services/
│   ├── exportService.js               ✅ Sudah ada
│   ├── financialReportService.js      ⚠️ Perlu verifikasi
│   └── inventoryReportService.js      ⚠️ Perlu verifikasi
├── validation/
│   └── reportExportValidation.js      ✅ Sudah ada
└── middleware/
    ├── authMiddleware.js              ✅ Sudah ada
    └── permissionMiddleware.js        ✅ Sudah ada

client-backup/src/features/reports/
├── pages/
│   ├── index.jsx                      ✅ Sudah ada
│   ├── SalesReport.jsx                ⚠️ Menggunakan mock data
│   ├── FinanceReport.jsx              ⚠️ Menggunakan mock data
│   ├── InventoryReport.jsx            ⚠️ Menggunakan mock data
│   └── BranchReport.jsx               ⚠️ Menggunakan mock data
├── components/
│   ├── ExportDropdown.jsx             ✅ Sudah ada
│   └── ReportComponents.jsx           ✅ Sudah ada
├── hooks/
│   └── useReports.js                  ✅ Sudah ada
└── services/
    └── reportService.js               ✅ Sudah ada
```

### B. API Endpoints

#### Export Endpoints (Sudah Ada)

```
GET /api/reports/export/sales?format=excel&startDate=2024-01-01&endDate=2024-01-31&cabangId=all
GET /api/reports/export/financial?format=pdf&startDate=2024-01-01&endDate=2024-01-31&cabangId=all
GET /api/reports/export/inventory?format=csv&startDate=2024-01-01&endDate=2024-01-31&cabangId=all
GET /api/reports/export/branch?format=excel&startDate=2024-01-01&endDate=2024-01-31
```

#### View Endpoints (Perlu Ditambahkan)

```
GET /api/reports/sales?startDate=2024-01-01&endDate=2024-01-31&cabangId=all&viewType=daily&page=1&limit=50
GET /api/reports/sales/summary?startDate=2024-01-01&endDate=2024-01-31&cabangId=all
GET /api/reports/sales/products?startDate=2024-01-01&endDate=2024-01-31&cabangId=all&limit=10
GET /api/reports/sales/categories?startDate=2024-01-01&endDate=2024-01-31&cabangId=all
GET /api/reports/branch?startDate=2024-01-01&endDate=2024-01-31
```

### C. Dependencies Backend

Pastikan package berikut terinstall:

```json
{
  "exceljs": "^4.3.0",      // Excel export
  "pdfkit": "^0.13.0",      // PDF export
  "zod": "^3.22.0"          // Validation
}
```

---

## Checklist Implementasi

### Backend

- [ ] **Fase 1: Verifikasi Service**
  - [ ] Verifikasi `FinancialReportService.getDetailedTransactions()`
  - [ ] Verifikasi `InventoryReportService`
  - [ ] Verifikasi `ExportService.getColumnsForReportType()`

- [ ] **Fase 2: Implementasi View Endpoints**
  - [ ] Buat `reportRoutes.js` untuk view endpoints
  - [ ] Implementasi `reportController.js` dengan semua method
  - [ ] Daftarkan routes di `app.js`
  - [ ] Tambahkan validation schemas

- [ ] **Fase 3: Testing Backend**
  - [ ] Test semua endpoint dengan Postman/Thunder Client
  - [ ] Test dengan berbagai filter combinations
  - [ ] Test error handling

### Frontend

- [ ] **Fase 4: Update Report Pages**
  - [ ] Update `SalesReport.jsx` - gunakan `useSalesReport` hook
  - [ ] Update `FinanceReport.jsx` - gunakan `useFinancialReport` hook
  - [ ] Update `InventoryReport.jsx` - gunakan `useInventoryReport` hook
  - [ ] Update `BranchReport.jsx` - gunakan `useBranchReport` hook

- [ ] **Fase 5: Update Service Layer**
  - [ ] Update `reportService.js` untuk endpoint view yang baru
  - [ ] Pastikan response format konsisten

- [ ] **Fase 6: Testing Frontend**
  - [ ] Test semua halaman report
  - [ ] Test export functionality
  - [ ] Test error handling
  - [ ] Test dengan data kosong

---

## Contoh Implementation

### 1. Backend: reportRoutes.js (Baru)

```javascript
const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const { hasPermission } = require("../middleware/permissionMiddleware");
const { authenticate } = require("../middleware/authMiddleware");

router.use(authenticate);

// Sales Report Routes
router.get("/sales", hasPermission(["report:read"]), reportController.getSalesReport);
router.get("/sales/summary", hasPermission(["report:read"]), reportController.getSalesSummary);
router.get("/sales/products", hasPermission(["report:read"]), reportController.getTopProducts);
router.get("/sales/categories", hasPermission(["report:read"]), reportController.getSalesByCategory);

// Branch Comparison Route
router.get("/branch", hasPermission(["report:read"]), reportController.getBranchComparison);

module.exports = router;
```

### 2. Backend: reportController.js (Baru - sebagian)

```javascript
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getSalesReport = async (req, res, next) => {
  try {
    const { startDate, endDate, cabangId, viewType, page = 1, limit = 50 } = req.query;

    // Implement query logic here...
    const transactions = await prisma.transaksi.findMany({
      where: {
        jenis_transaksi: "PENJUALAN",
        tanggal: {
          gte: new Date(startDate),
          lte: new Date(endDate + "T23:59:59.999Z"),
        },
        ...(cabangId && cabangId !== "all" ? { cabang_id: cabangId } : {}),
        deleted_at: null,
      },
      include: {
        cabang: true,
        pelanggan: true,
      },
      orderBy: { tanggal: "desc" },
      skip: (page - 1) * limit,
      take: parseInt(limit),
    });

    res.json({
      success: true,
      data: transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: transactions.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSalesReport, /* ... other methods */ };
```

### 3. Frontend: Update SalesReport.jsx

```javascript
// Hapus mock data generation functions
// Gunakan hook yang sudah ada

const SalesReport = () => {
  // ... state declarations

  const exportParams = useMemo(() => {
    const formatDate = (date) => {
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };
    return {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      cabangId: cabangFilter,
    };
  }, [startDate, endDate, cabangFilter]);

  // Gunakan hook untuk fetch data
  const { data: salesData, isLoading: loadingSales } = useSalesReport(exportParams);
  const { data: summaryData } = useSalesSummary(exportParams);

  // ... rest of component
};
```

---

## Priority Order

1. **HIGH** - Verifikasi service dependencies (FinancialReportService, InventoryReportService)
2. **HIGH** - Implement view API endpoints untuk Sales Report
3. **MEDIUM** - Update frontend SalesReport untuk menggunakan API real
4. **MEDIUM** - Implement view API endpoints untuk laporan lainnya
5. **MEDIUM** - Update frontend untuk laporan lainnya
6. **LOW** - Testing dan validation comprehensif

---

## Notes

- Export functionality sudah berfungsi sepenuhnya
- Yang perlu dikerjakan adalah API untuk view/display data
- Pastikan timezone handling konsisten antara frontend dan backend
- Pertimbangkan caching untuk report yang sering diakses
- Untuk dataset besar, pertimbangkan async export dengan notification
