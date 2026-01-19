-- ============================================================
-- PERMISSION-BASED SIDEBAR - FRESH SEED
-- Hapus data lama dan buat baru dari awal
-- ============================================================

-- ===========================================
-- 0. HAPUS DATA LAMA (CASCADE)
-- ===========================================

-- Hapus role_permissions dulu (foreign key ke permissions)
TRUNCATE TABLE role_permissions CASCADE;

-- Hapus permissions lama
TRUNCATE TABLE permissions CASCADE;

-- Hapus role_menu (akan di-deprecate)
TRUNCATE TABLE role_menu CASCADE;

-- ===========================================
-- 1. TAMBAH KOLOM required_permission KE MENU
-- ===========================================

ALTER TABLE menu ADD COLUMN IF NOT EXISTS required_permission VARCHAR(100);

-- ===========================================
-- 2. BUAT PERMISSIONS BARU (LENGKAP)
-- ===========================================

INSERT INTO permissions (permission_id, name, description, module, action, status, created_at, updated_at)
VALUES
-- ===== DASHBOARD =====
('perm-dashboard-read', 'dashboard.read', 'Melihat dashboard', 'dashboard', 'read', 'aktif', NOW(), NOW()),

-- ===== USER MANAGEMENT =====
('perm-user-create', 'user.create', 'Membuat user baru', 'user', 'create', 'aktif', NOW(), NOW()),
('perm-user-read', 'user.read', 'Melihat data user', 'user', 'read', 'aktif', NOW(), NOW()),
('perm-user-update', 'user.update', 'Mengubah data user', 'user', 'update', 'aktif', NOW(), NOW()),
('perm-user-delete', 'user.delete', 'Menghapus user', 'user', 'delete', 'aktif', NOW(), NOW()),

-- ===== ROLE MANAGEMENT =====
('perm-role-create', 'role.create', 'Membuat role baru', 'role', 'create', 'aktif', NOW(), NOW()),
('perm-role-read', 'role.read', 'Melihat data role', 'role', 'read', 'aktif', NOW(), NOW()),
('perm-role-update', 'role.update', 'Mengubah data role', 'role', 'update', 'aktif', NOW(), NOW()),
('perm-role-delete', 'role.delete', 'Menghapus role', 'role', 'delete', 'aktif', NOW(), NOW()),
('perm-role-manage', 'role.manage', 'Mengelola role & assignment', 'role', 'manage', 'aktif', NOW(), NOW()),

-- ===== CABANG MANAGEMENT =====
('perm-cabang-create', 'cabang.create', 'Membuat cabang baru', 'cabang', 'create', 'aktif', NOW(), NOW()),
('perm-cabang-read', 'cabang.read', 'Melihat data cabang', 'cabang', 'read', 'aktif', NOW(), NOW()),
('perm-cabang-update', 'cabang.update', 'Mengubah data cabang', 'cabang', 'update', 'aktif', NOW(), NOW()),
('perm-cabang-delete', 'cabang.delete', 'Menghapus cabang', 'cabang', 'delete', 'aktif', NOW(), NOW()),

-- ===== PRODUK MANAGEMENT =====
('perm-produk-create', 'produk.create', 'Membuat produk baru', 'produk', 'create', 'aktif', NOW(), NOW()),
('perm-produk-read', 'produk.read', 'Melihat data produk', 'produk', 'read', 'aktif', NOW(), NOW()),
('perm-produk-update', 'produk.update', 'Mengubah data produk', 'produk', 'update', 'aktif', NOW(), NOW()),
('perm-produk-delete', 'produk.delete', 'Menghapus produk', 'produk', 'delete', 'aktif', NOW(), NOW()),

-- ===== KATEGORI MANAGEMENT =====
('perm-kategori-create', 'kategori.create', 'Membuat kategori baru', 'kategori', 'create', 'aktif', NOW(), NOW()),
('perm-kategori-read', 'kategori.read', 'Melihat data kategori', 'kategori', 'read', 'aktif', NOW(), NOW()),
('perm-kategori-update', 'kategori.update', 'Mengubah data kategori', 'kategori', 'update', 'aktif', NOW(), NOW()),
('perm-kategori-delete', 'kategori.delete', 'Menghapus kategori', 'kategori', 'delete', 'aktif', NOW(), NOW()),

-- ===== PRODUK REQUEST =====
('perm-produk_request-create', 'produk_request.create', 'Membuat request produk', 'produk_request', 'create', 'aktif', NOW(), NOW()),
('perm-produk_request-read', 'produk_request.read', 'Melihat request produk', 'produk_request', 'read', 'aktif', NOW(), NOW()),
('perm-produk_request-update', 'produk_request.update', 'Mengubah request produk', 'produk_request', 'update', 'aktif', NOW(), NOW()),
('perm-produk_request-delete', 'produk_request.delete', 'Menghapus request produk', 'produk_request', 'delete', 'aktif', NOW(), NOW()),
('perm-produk_request-manage', 'produk_request.manage', 'Approve/reject request produk', 'produk_request', 'manage', 'aktif', NOW(), NOW()),

-- ===== PELANGGAN MANAGEMENT =====
('perm-pelanggan-create', 'pelanggan.create', 'Membuat pelanggan baru', 'pelanggan', 'create', 'aktif', NOW(), NOW()),
('perm-pelanggan-read', 'pelanggan.read', 'Melihat data pelanggan', 'pelanggan', 'read', 'aktif', NOW(), NOW()),
('perm-pelanggan-update', 'pelanggan.update', 'Mengubah data pelanggan', 'pelanggan', 'update', 'aktif', NOW(), NOW()),
('perm-pelanggan-delete', 'pelanggan.delete', 'Menghapus pelanggan', 'pelanggan', 'delete', 'aktif', NOW(), NOW()),

-- ===== SUPPLIER MANAGEMENT =====
('perm-supplier-create', 'supplier.create', 'Membuat supplier baru', 'supplier', 'create', 'aktif', NOW(), NOW()),
('perm-supplier-read', 'supplier.read', 'Melihat data supplier', 'supplier', 'read', 'aktif', NOW(), NOW()),
('perm-supplier-update', 'supplier.update', 'Mengubah data supplier', 'supplier', 'update', 'aktif', NOW(), NOW()),
('perm-supplier-delete', 'supplier.delete', 'Menghapus supplier', 'supplier', 'delete', 'aktif', NOW(), NOW()),

-- ===== TRANSAKSI MANAGEMENT =====
('perm-transaksi-create', 'transaksi.create', 'Membuat transaksi', 'transaksi', 'create', 'aktif', NOW(), NOW()),
('perm-transaksi-read', 'transaksi.read', 'Melihat data transaksi', 'transaksi', 'read', 'aktif', NOW(), NOW()),
('perm-transaksi-update', 'transaksi.update', 'Mengubah data transaksi', 'transaksi', 'update', 'aktif', NOW(), NOW()),
('perm-transaksi-delete', 'transaksi.delete', 'Menghapus transaksi', 'transaksi', 'delete', 'aktif', NOW(), NOW()),

-- ===== POS (Point of Sale) =====
('perm-pos-create', 'pos.create', 'Membuat transaksi POS', 'pos', 'create', 'aktif', NOW(), NOW()),
('perm-pos-read', 'pos.read', 'Mengakses Point of Sale', 'pos', 'read', 'aktif', NOW(), NOW()),

-- ===== INVOICE =====
('perm-invoice-create', 'invoice.create', 'Membuat invoice', 'invoice', 'create', 'aktif', NOW(), NOW()),
('perm-invoice-read', 'invoice.read', 'Melihat invoice', 'invoice', 'read', 'aktif', NOW(), NOW()),
('perm-invoice-update', 'invoice.update', 'Mengubah invoice', 'invoice', 'update', 'aktif', NOW(), NOW()),
('perm-invoice-delete', 'invoice.delete', 'Menghapus invoice', 'invoice', 'delete', 'aktif', NOW(), NOW()),

-- ===== PEMBAYARAN =====
('perm-pembayaran-create', 'pembayaran.create', 'Membuat pembayaran', 'pembayaran', 'create', 'aktif', NOW(), NOW()),
('perm-pembayaran-read', 'pembayaran.read', 'Melihat pembayaran', 'pembayaran', 'read', 'aktif', NOW(), NOW()),
('perm-pembayaran-update', 'pembayaran.update', 'Mengubah pembayaran', 'pembayaran', 'update', 'aktif', NOW(), NOW()),
('perm-pembayaran-delete', 'pembayaran.delete', 'Menghapus pembayaran', 'pembayaran', 'delete', 'aktif', NOW(), NOW()),

-- ===== RETUR =====
('perm-retur-create', 'retur.create', 'Membuat retur', 'retur', 'create', 'aktif', NOW(), NOW()),
('perm-retur-read', 'retur.read', 'Melihat retur', 'retur', 'read', 'aktif', NOW(), NOW()),
('perm-retur-update', 'retur.update', 'Mengubah retur', 'retur', 'update', 'aktif', NOW(), NOW()),
('perm-retur-delete', 'retur.delete', 'Menghapus retur', 'retur', 'delete', 'aktif', NOW(), NOW()),

-- ===== INVENTORY =====
('perm-inventory-create', 'inventory.create', 'Membuat data inventory', 'inventory', 'create', 'aktif', NOW(), NOW()),
('perm-inventory-read', 'inventory.read', 'Melihat data inventory', 'inventory', 'read', 'aktif', NOW(), NOW()),
('perm-inventory-update', 'inventory.update', 'Mengubah data inventory', 'inventory', 'update', 'aktif', NOW(), NOW()),
('perm-inventory-delete', 'inventory.delete', 'Menghapus data inventory', 'inventory', 'delete', 'aktif', NOW(), NOW()),

-- ===== STOCK TRANSFER =====
('perm-stock_transfer-create', 'stock_transfer.create', 'Membuat transfer stok', 'stock_transfer', 'create', 'aktif', NOW(), NOW()),
('perm-stock_transfer-read', 'stock_transfer.read', 'Melihat transfer stok', 'stock_transfer', 'read', 'aktif', NOW(), NOW()),
('perm-stock_transfer-update', 'stock_transfer.update', 'Mengubah transfer stok', 'stock_transfer', 'update', 'aktif', NOW(), NOW()),
('perm-stock_transfer-delete', 'stock_transfer.delete', 'Menghapus transfer stok', 'stock_transfer', 'delete', 'aktif', NOW(), NOW()),
('perm-stock_transfer-manage', 'stock_transfer.manage', 'Approve/reject transfer stok', 'stock_transfer', 'manage', 'aktif', NOW(), NOW()),

-- ===== STOCK OPNAME =====
('perm-stock_opname-create', 'stock_opname.create', 'Membuat stock opname', 'stock_opname', 'create', 'aktif', NOW(), NOW()),
('perm-stock_opname-read', 'stock_opname.read', 'Melihat stock opname', 'stock_opname', 'read', 'aktif', NOW(), NOW()),
('perm-stock_opname-update', 'stock_opname.update', 'Mengubah stock opname', 'stock_opname', 'update', 'aktif', NOW(), NOW()),
('perm-stock_opname-delete', 'stock_opname.delete', 'Menghapus stock opname', 'stock_opname', 'delete', 'aktif', NOW(), NOW()),

-- ===== STOCK ADJUSTMENT =====
('perm-stock_adjustment-create', 'stock_adjustment.create', 'Membuat penyesuaian stok', 'stock_adjustment', 'create', 'aktif', NOW(), NOW()),
('perm-stock_adjustment-read', 'stock_adjustment.read', 'Melihat penyesuaian stok', 'stock_adjustment', 'read', 'aktif', NOW(), NOW()),
('perm-stock_adjustment-update', 'stock_adjustment.update', 'Mengubah penyesuaian stok', 'stock_adjustment', 'update', 'aktif', NOW(), NOW()),
('perm-stock_adjustment-delete', 'stock_adjustment.delete', 'Menghapus penyesuaian stok', 'stock_adjustment', 'delete', 'aktif', NOW(), NOW()),

-- ===== STOCK NOTIFICATION =====
('perm-stock_notification-read', 'stock_notification.read', 'Melihat notifikasi stok', 'stock_notification', 'read', 'aktif', NOW(), NOW()),

-- ===== HARGA MANAGEMENT =====
('perm-harga-read', 'harga.read', 'Melihat harga produk', 'harga', 'read', 'aktif', NOW(), NOW()),
('perm-harga-manage', 'harga.manage', 'Mengelola harga produk', 'harga', 'manage', 'aktif', NOW(), NOW()),

-- ===== BATCH MANAGEMENT =====
('perm-batch-read', 'batch.read', 'Melihat data batch', 'batch', 'read', 'aktif', NOW(), NOW()),
('perm-batch-manage', 'batch.manage', 'Mengelola batch produk', 'batch', 'manage', 'aktif', NOW(), NOW()),

-- ===== PEMBELIAN =====
('perm-pembelian-create', 'pembelian.create', 'Membuat pembelian', 'pembelian', 'create', 'aktif', NOW(), NOW()),
('perm-pembelian-read', 'pembelian.read', 'Melihat data pembelian', 'pembelian', 'read', 'aktif', NOW(), NOW()),
('perm-pembelian-update', 'pembelian.update', 'Mengubah data pembelian', 'pembelian', 'update', 'aktif', NOW(), NOW()),
('perm-pembelian-delete', 'pembelian.delete', 'Menghapus data pembelian', 'pembelian', 'delete', 'aktif', NOW(), NOW()),

-- ===== HUTANG =====
('perm-hutang-create', 'hutang.create', 'Membuat hutang', 'hutang', 'create', 'aktif', NOW(), NOW()),
('perm-hutang-read', 'hutang.read', 'Melihat data hutang', 'hutang', 'read', 'aktif', NOW(), NOW()),
('perm-hutang-update', 'hutang.update', 'Mengubah data hutang', 'hutang', 'update', 'aktif', NOW(), NOW()),
('perm-hutang-delete', 'hutang.delete', 'Menghapus hutang', 'hutang', 'delete', 'aktif', NOW(), NOW()),

-- ===== KREDIT =====
('perm-kredit-create', 'kredit.create', 'Membuat kredit pelanggan', 'kredit', 'create', 'aktif', NOW(), NOW()),
('perm-kredit-read', 'kredit.read', 'Melihat data kredit', 'kredit', 'read', 'aktif', NOW(), NOW()),
('perm-kredit-update', 'kredit.update', 'Mengubah data kredit', 'kredit', 'update', 'aktif', NOW(), NOW()),
('perm-kredit-delete', 'kredit.delete', 'Menghapus kredit', 'kredit', 'delete', 'aktif', NOW(), NOW()),
('perm-kredit_notification-read', 'kredit_notification.read', 'Melihat notifikasi kredit', 'kredit_notification', 'read', 'aktif', NOW(), NOW()),

-- ===== LOYALTY =====
('perm-loyalty-create', 'loyalty.create', 'Membuat program loyalty', 'loyalty', 'create', 'aktif', NOW(), NOW()),
('perm-loyalty-read', 'loyalty.read', 'Melihat data loyalty', 'loyalty', 'read', 'aktif', NOW(), NOW()),
('perm-loyalty-update', 'loyalty.update', 'Mengubah data loyalty', 'loyalty', 'update', 'aktif', NOW(), NOW()),
('perm-loyalty-delete', 'loyalty.delete', 'Menghapus loyalty', 'loyalty', 'delete', 'aktif', NOW(), NOW()),

-- ===== LAPORAN =====
('perm-laporan-read', 'laporan.read', 'Melihat laporan', 'laporan', 'read', 'aktif', NOW(), NOW()),
('perm-laporan_keuangan-read', 'laporan_keuangan.read', 'Melihat laporan keuangan', 'laporan_keuangan', 'read', 'aktif', NOW(), NOW()),
('perm-laporan_cabang-read', 'laporan_cabang.read', 'Melihat performa cabang', 'laporan_cabang', 'read', 'aktif', NOW(), NOW()),

-- ===== PROMO & DISKON =====
('perm-promo-create', 'promo.create', 'Membuat promo', 'promo', 'create', 'aktif', NOW(), NOW()),
('perm-promo-read', 'promo.read', 'Melihat data promo', 'promo', 'read', 'aktif', NOW(), NOW()),
('perm-promo-update', 'promo.update', 'Mengubah data promo', 'promo', 'update', 'aktif', NOW(), NOW()),
('perm-promo-delete', 'promo.delete', 'Menghapus promo', 'promo', 'delete', 'aktif', NOW(), NOW()),

-- ===== SHIFT =====
('perm-shift-create', 'shift.create', 'Membuat/buka shift', 'shift', 'create', 'aktif', NOW(), NOW()),
('perm-shift-read', 'shift.read', 'Melihat data shift', 'shift', 'read', 'aktif', NOW(), NOW()),
('perm-shift-update', 'shift.update', 'Mengubah/tutup shift', 'shift', 'update', 'aktif', NOW(), NOW()),
('perm-shift-delete', 'shift.delete', 'Menghapus shift', 'shift', 'delete', 'aktif', NOW(), NOW()),

-- ===== MARKETING =====
('perm-marketing-create', 'marketing.create', 'Membuat campaign marketing', 'marketing', 'create', 'aktif', NOW(), NOW()),
('perm-marketing-read', 'marketing.read', 'Melihat data marketing', 'marketing', 'read', 'aktif', NOW(), NOW()),
('perm-marketing-update', 'marketing.update', 'Mengubah data marketing', 'marketing', 'update', 'aktif', NOW(), NOW()),
('perm-marketing-delete', 'marketing.delete', 'Menghapus marketing', 'marketing', 'delete', 'aktif', NOW(), NOW()),
('perm-marketing_broadcast-create', 'marketing_broadcast.create', 'Membuat broadcast marketing', 'marketing_broadcast', 'create', 'aktif', NOW(), NOW()),
('perm-marketing_broadcast-read', 'marketing_broadcast.read', 'Melihat broadcast marketing', 'marketing_broadcast', 'read', 'aktif', NOW(), NOW()),

-- ===== WHATSAPP =====
('perm-whatsapp-create', 'whatsapp.create', 'Membuat konfigurasi WhatsApp', 'whatsapp', 'create', 'aktif', NOW(), NOW()),
('perm-whatsapp-read', 'whatsapp.read', 'Melihat data WhatsApp', 'whatsapp', 'read', 'aktif', NOW(), NOW()),
('perm-whatsapp-update', 'whatsapp.update', 'Mengubah data WhatsApp', 'whatsapp', 'update', 'aktif', NOW(), NOW()),
('perm-whatsapp-delete', 'whatsapp.delete', 'Menghapus data WhatsApp', 'whatsapp', 'delete', 'aktif', NOW(), NOW()),
('perm-whatsapp-manage', 'whatsapp.manage', 'Mengelola WhatsApp Bot & AI', 'whatsapp', 'manage', 'aktif', NOW(), NOW()),

-- ===== SETTINGS =====
('perm-settings-read', 'settings.read', 'Melihat pengaturan', 'settings', 'read', 'aktif', NOW(), NOW()),
('perm-settings-manage', 'settings.manage', 'Mengelola pengaturan', 'settings', 'manage', 'aktif', NOW(), NOW()),
('perm-tax-read', 'tax.read', 'Melihat pengaturan pajak', 'tax', 'read', 'aktif', NOW(), NOW()),
('perm-tax-manage', 'tax.manage', 'Mengelola pengaturan pajak', 'tax', 'manage', 'aktif', NOW(), NOW()),
('perm-receipt-read', 'receipt.read', 'Melihat pengaturan struk', 'receipt', 'read', 'aktif', NOW(), NOW()),
('perm-receipt-manage', 'receipt.manage', 'Mengelola pengaturan struk', 'receipt', 'manage', 'aktif', NOW(), NOW()),
('perm-notification-read', 'notification.read', 'Melihat pengaturan notifikasi', 'notification', 'read', 'aktif', NOW(), NOW()),
('perm-notification-manage', 'notification.manage', 'Mengelola notifikasi', 'notification', 'manage', 'aktif', NOW(), NOW()),

-- ===== AUDIT =====
('perm-audit-read', 'audit.read', 'Melihat audit log', 'audit', 'read', 'aktif', NOW(), NOW());


-- ===========================================
-- 3. UPDATE MENU DENGAN MAPPING PERMISSION
-- ===========================================

-- Reset semua required_permission dulu
UPDATE menu SET required_permission = NULL;

-- Global Admin Menus (menu-001 s/d menu-013)
UPDATE menu SET required_permission = 'dashboard.read' WHERE menu_id = 'menu-001';
UPDATE menu SET required_permission = 'cabang.read' WHERE menu_id = 'menu-002';
UPDATE menu SET required_permission = 'user.read' WHERE menu_id = 'menu-003';
UPDATE menu SET required_permission = 'produk.read' WHERE menu_id = 'menu-004';
UPDATE menu SET required_permission = 'pelanggan.read' WHERE menu_id = 'menu-005';
UPDATE menu SET required_permission = 'supplier.read' WHERE menu_id = 'menu-006';
UPDATE menu SET required_permission = 'inventory.read' WHERE menu_id = 'menu-007';
UPDATE menu SET required_permission = 'transaksi.read' WHERE menu_id = 'menu-008';
UPDATE menu SET required_permission = 'laporan.read' WHERE menu_id = 'menu-009';
UPDATE menu SET required_permission = 'promo.read' WHERE menu_id = 'menu-010';
UPDATE menu SET required_permission = 'marketing.read' WHERE menu_id = 'menu-011';
UPDATE menu SET required_permission = 'whatsapp.read' WHERE menu_id = 'menu-012';
UPDATE menu SET required_permission = 'settings.read' WHERE menu_id = 'menu-013';

-- User Management Sub-Menus (menu-003-XXX)
UPDATE menu SET required_permission = 'user.read' WHERE menu_id = 'menu-003-001';
UPDATE menu SET required_permission = 'role.read' WHERE menu_id = 'menu-003-002';
UPDATE menu SET required_permission = 'role.read' WHERE menu_id = 'menu-003-003';
UPDATE menu SET required_permission = 'role.manage' WHERE menu_id = 'menu-003-004';

-- Product Management Sub-Menus (menu-004-XXX)
UPDATE menu SET required_permission = 'produk.read' WHERE menu_id = 'menu-004-001';
UPDATE menu SET required_permission = 'produk.read' WHERE menu_id = 'menu-004-002';
UPDATE menu SET required_permission = 'kategori.read' WHERE menu_id = 'menu-004-003';
UPDATE menu SET required_permission = 'produk_request.read' WHERE menu_id = 'menu-004-004';

-- Customer Management Sub-Menus (menu-005-XXX)
UPDATE menu SET required_permission = 'pelanggan.read' WHERE menu_id = 'menu-005-001';
UPDATE menu SET required_permission = 'pelanggan.read' WHERE menu_id = 'menu-005-002';
UPDATE menu SET required_permission = 'loyalty.read' WHERE menu_id = 'menu-005-003';
UPDATE menu SET required_permission = 'kredit.read' WHERE menu_id = 'menu-005-004';

-- Supplier Management Sub-Menus (menu-006-XXX)
UPDATE menu SET required_permission = 'supplier.read' WHERE menu_id = 'menu-006-001';
UPDATE menu SET required_permission = 'pembelian.read' WHERE menu_id = 'menu-006-002';

-- Inventory Sub-Menus (menu-007-XXX)
UPDATE menu SET required_permission = 'inventory.read' WHERE menu_id = 'menu-007-001';
UPDATE menu SET required_permission = 'inventory.read' WHERE menu_id = 'menu-007-002';
UPDATE menu SET required_permission = 'inventory.read' WHERE menu_id = 'menu-007-003';
UPDATE menu SET required_permission = 'stock_opname.read' WHERE menu_id = 'menu-007-004';
UPDATE menu SET required_permission = 'stock_transfer.read' WHERE menu_id = 'menu-007-005';
UPDATE menu SET required_permission = 'harga.manage' WHERE menu_id = 'menu-007-006';
UPDATE menu SET required_permission = 'batch.manage' WHERE menu_id = 'menu-007-007';
UPDATE menu SET required_permission = 'stock_notification.read' WHERE menu_id = 'menu-007-008';
UPDATE menu SET required_permission = 'stock_adjustment.read' WHERE menu_id = 'menu-007-009';
UPDATE menu SET required_permission = 'stock_transfer.manage' WHERE menu_id = 'menu-007-010';

-- Transaction Sub-Menus (menu-008-XXX)
UPDATE menu SET required_permission = 'pos.read' WHERE menu_id = 'menu-008-001';
UPDATE menu SET required_permission = 'pembayaran.read' WHERE menu_id = 'menu-008-002';
UPDATE menu SET required_permission = 'transaksi.read' WHERE menu_id = 'menu-008-003';
UPDATE menu SET required_permission = 'invoice.read' WHERE menu_id = 'menu-008-004';
UPDATE menu SET required_permission = 'retur.read' WHERE menu_id = 'menu-008-005';
UPDATE menu SET required_permission = 'kredit_notification.read' WHERE menu_id = 'menu-008-006';

-- Report Sub-Menus (menu-009-XXX)
UPDATE menu SET required_permission = 'laporan.read' WHERE menu_id = 'menu-009-001';
UPDATE menu SET required_permission = 'laporan_keuangan.read' WHERE menu_id = 'menu-009-002';
UPDATE menu SET required_permission = 'laporan.read' WHERE menu_id = 'menu-009-003';
UPDATE menu SET required_permission = 'laporan_cabang.read' WHERE menu_id = 'menu-009-004';
UPDATE menu SET required_permission = 'hutang.read' WHERE menu_id = 'menu-009-005';
UPDATE menu SET required_permission = 'kredit.read' WHERE menu_id = 'menu-009-006';
UPDATE menu SET required_permission = 'shift.read' WHERE menu_id = 'menu-009-007';

-- Promo Sub-Menus (menu-010-XXX)
UPDATE menu SET required_permission = 'promo.read' WHERE menu_id = 'menu-010-001';
UPDATE menu SET required_permission = 'promo.read' WHERE menu_id = 'menu-010-002';

-- Marketing Sub-Menus (menu-011-XXX)
UPDATE menu SET required_permission = 'marketing.read' WHERE menu_id = 'menu-011-001';
UPDATE menu SET required_permission = 'marketing_broadcast.read' WHERE menu_id = 'menu-011-002';
UPDATE menu SET required_permission = 'marketing.read' WHERE menu_id = 'menu-011-003';
UPDATE menu SET required_permission = 'marketing.read' WHERE menu_id = 'menu-011-004';

-- WhatsApp Sub-Menus (menu-012-XXX)
UPDATE menu SET required_permission = 'whatsapp.manage' WHERE menu_id = 'menu-012-001';
UPDATE menu SET required_permission = 'whatsapp.read' WHERE menu_id = 'menu-012-002';
UPDATE menu SET required_permission = 'whatsapp.read' WHERE menu_id = 'menu-012-003';
UPDATE menu SET required_permission = 'whatsapp.read' WHERE menu_id = 'menu-012-004';
UPDATE menu SET required_permission = 'whatsapp.read' WHERE menu_id = 'menu-012-005';
UPDATE menu SET required_permission = 'whatsapp.read' WHERE menu_id = 'menu-012-006';
UPDATE menu SET required_permission = 'whatsapp.manage' WHERE menu_id = 'menu-012-007';

-- Settings Sub-Menus (menu-013-XXX)
UPDATE menu SET required_permission = 'user.read' WHERE menu_id = 'menu-013-001';
UPDATE menu SET required_permission = 'role.read' WHERE menu_id = 'menu-013-002';
UPDATE menu SET required_permission = 'cabang.read' WHERE menu_id = 'menu-013-003';
UPDATE menu SET required_permission = 'promo.read' WHERE menu_id = 'menu-013-004';
UPDATE menu SET required_permission = 'shift.read' WHERE menu_id = 'menu-013-005';
UPDATE menu SET required_permission = 'loyalty.read' WHERE menu_id = 'menu-013-006';
UPDATE menu SET required_permission = 'tax.manage' WHERE menu_id = 'menu-013-007';
UPDATE menu SET required_permission = 'receipt.manage' WHERE menu_id = 'menu-013-008';
UPDATE menu SET required_permission = 'notification.manage' WHERE menu_id = 'menu-013-009';
UPDATE menu SET required_permission = 'audit.read' WHERE menu_id = 'menu-013-010';

-- Branch Level Menus (menu-014 s/d menu-024)
UPDATE menu SET required_permission = 'produk.read' WHERE menu_id = 'menu-014';
UPDATE menu SET required_permission = 'pelanggan.read' WHERE menu_id = 'menu-015';
UPDATE menu SET required_permission = 'shift.read' WHERE menu_id = 'menu-016';
UPDATE menu SET required_permission = 'transaksi.read' WHERE menu_id = 'menu-017';
UPDATE menu SET required_permission = 'laporan.read' WHERE menu_id = 'menu-018';
UPDATE menu SET required_permission = 'supplier.read' WHERE menu_id = 'menu-019';
UPDATE menu SET required_permission = 'inventory.read' WHERE menu_id = 'menu-020';
UPDATE menu SET required_permission = 'promo.read' WHERE menu_id = 'menu-021';
UPDATE menu SET required_permission = 'marketing.read' WHERE menu_id = 'menu-022';
UPDATE menu SET required_permission = 'whatsapp.read' WHERE menu_id = 'menu-023';
UPDATE menu SET required_permission = 'settings.read' WHERE menu_id = 'menu-024';

-- Branch Sub-Menus (menu-014-XXX s/d menu-024-XXX)
UPDATE menu SET required_permission = 'produk.read' WHERE menu_id = 'menu-014-001';
UPDATE menu SET required_permission = 'produk.read' WHERE menu_id = 'menu-014-002';
UPDATE menu SET required_permission = 'kategori.read' WHERE menu_id = 'menu-014-003';
UPDATE menu SET required_permission = 'produk_request.read' WHERE menu_id = 'menu-014-004';

UPDATE menu SET required_permission = 'pelanggan.read' WHERE menu_id = 'menu-015-001';
UPDATE menu SET required_permission = 'loyalty.read' WHERE menu_id = 'menu-015-002';
UPDATE menu SET required_permission = 'kredit.read' WHERE menu_id = 'menu-015-003';

UPDATE menu SET required_permission = 'shift.read' WHERE menu_id = 'menu-016-001';
UPDATE menu SET required_permission = 'shift.read' WHERE menu_id = 'menu-016-002';

UPDATE menu SET required_permission = 'pos.read' WHERE menu_id = 'menu-017-001';
UPDATE menu SET required_permission = 'transaksi.read' WHERE menu_id = 'menu-017-002';
UPDATE menu SET required_permission = 'invoice.read' WHERE menu_id = 'menu-017-003';
UPDATE menu SET required_permission = 'retur.read' WHERE menu_id = 'menu-017-004';

UPDATE menu SET required_permission = 'laporan.read' WHERE menu_id = 'menu-018-001';
UPDATE menu SET required_permission = 'laporan.read' WHERE menu_id = 'menu-018-002';
UPDATE menu SET required_permission = 'pembayaran.read' WHERE menu_id = 'menu-018-003';
UPDATE menu SET required_permission = 'laporan.read' WHERE menu_id = 'menu-018-004';
UPDATE menu SET required_permission = 'hutang.read' WHERE menu_id = 'menu-018-005';
UPDATE menu SET required_permission = 'laporan_keuangan.read' WHERE menu_id = 'menu-018-006';

UPDATE menu SET required_permission = 'supplier.read' WHERE menu_id = 'menu-019-001';
UPDATE menu SET required_permission = 'supplier.read' WHERE menu_id = 'menu-019-002';
UPDATE menu SET required_permission = 'pembelian.read' WHERE menu_id = 'menu-019-003';
UPDATE menu SET required_permission = 'hutang.read' WHERE menu_id = 'menu-019-004';

UPDATE menu SET required_permission = 'inventory.read' WHERE menu_id = 'menu-020-001';
UPDATE menu SET required_permission = 'stock_transfer.read' WHERE menu_id = 'menu-020-002';
UPDATE menu SET required_permission = 'stock_adjustment.read' WHERE menu_id = 'menu-020-003';
UPDATE menu SET required_permission = 'stock_notification.read' WHERE menu_id = 'menu-020-004';
UPDATE menu SET required_permission = 'stock_adjustment.read' WHERE menu_id = 'menu-020-005';

UPDATE menu SET required_permission = 'promo.read' WHERE menu_id = 'menu-021-001';
UPDATE menu SET required_permission = 'promo.read' WHERE menu_id = 'menu-021-002';

UPDATE menu SET required_permission = 'marketing.read' WHERE menu_id = 'menu-022-001';
UPDATE menu SET required_permission = 'marketing.read' WHERE menu_id = 'menu-022-002';

UPDATE menu SET required_permission = 'whatsapp.read' WHERE menu_id = 'menu-023-001';
UPDATE menu SET required_permission = 'whatsapp.read' WHERE menu_id = 'menu-023-002';
UPDATE menu SET required_permission = 'whatsapp.manage' WHERE menu_id = 'menu-023-003';

UPDATE menu SET required_permission = 'tax.manage' WHERE menu_id = 'menu-024-001';
UPDATE menu SET required_permission = 'receipt.manage' WHERE menu_id = 'menu-024-002';
UPDATE menu SET required_permission = 'promo.read' WHERE menu_id = 'menu-024-003';
UPDATE menu SET required_permission = 'shift.read' WHERE menu_id = 'menu-024-004';
UPDATE menu SET required_permission = 'loyalty.read' WHERE menu_id = 'menu-024-005';

-- Kasir Level Menus (menu-025 s/d menu-029)
UPDATE menu SET required_permission = 'pos.read' WHERE menu_id = 'menu-025';
UPDATE menu SET required_permission = 'pelanggan.read' WHERE menu_id = 'menu-026';
UPDATE menu SET required_permission = 'shift.read' WHERE menu_id = 'menu-027';
UPDATE menu SET required_permission = 'transaksi.read' WHERE menu_id = 'menu-028';
UPDATE menu SET required_permission = 'promo.read' WHERE menu_id = 'menu-029';

-- Kasir Sub-Menus
UPDATE menu SET required_permission = 'pelanggan.read' WHERE menu_id = 'menu-026-001';
UPDATE menu SET required_permission = 'pelanggan.create' WHERE menu_id = 'menu-026-002';
UPDATE menu SET required_permission = 'shift.create' WHERE menu_id = 'menu-027-001';
UPDATE menu SET required_permission = 'shift.update' WHERE menu_id = 'menu-027-002';


-- ===========================================
-- 4. ASSIGN PERMISSIONS TO ROLES
-- ===========================================

-- SUPER ADMIN: Semua permissions
INSERT INTO role_permissions (role_permission_id, role_id, permission_id, created_at, updated_at)
SELECT 
  gen_random_uuid(), 
  (SELECT role_id FROM roles WHERE nama_role = 'Super Admin' LIMIT 1), 
  permission_id, 
  NOW(), 
  NOW()
FROM permissions;

-- ADMIN: Semua kecuali manage-level tertentu
INSERT INTO role_permissions (role_permission_id, role_id, permission_id, created_at, updated_at)
SELECT 
  gen_random_uuid(), 
  (SELECT role_id FROM roles WHERE nama_role = 'Admin' LIMIT 1), 
  permission_id, 
  NOW(), 
  NOW()
FROM permissions
WHERE name NOT IN ('user.delete', 'role.delete', 'cabang.delete', 'audit.read');

-- KASIR: Permissions untuk kasir
INSERT INTO role_permissions (role_permission_id, role_id, permission_id, created_at, updated_at)
SELECT 
  gen_random_uuid(), 
  (SELECT role_id FROM roles WHERE nama_role = 'Kasir' LIMIT 1), 
  permission_id, 
  NOW(), 
  NOW()
FROM permissions
WHERE name IN (
  'dashboard.read',
  'pos.read', 'pos.create',
  'transaksi.create', 'transaksi.read',
  'pelanggan.read', 'pelanggan.create',
  'produk.read',
  'kategori.read',
  'promo.read',
  'shift.create', 'shift.read', 'shift.update',
  'pembayaran.create', 'pembayaran.read',
  'loyalty.read'
);

-- MANAJER: Permissions untuk manajer
INSERT INTO role_permissions (role_permission_id, role_id, permission_id, created_at, updated_at)
SELECT 
  gen_random_uuid(), 
  (SELECT role_id FROM roles WHERE nama_role = 'Manajer' LIMIT 1), 
  permission_id, 
  NOW(), 
  NOW()
FROM permissions
WHERE name IN (
  'dashboard.read',
  'user.read',
  'role.read',
  'produk.read', 'produk.update',
  'kategori.read',
  'pelanggan.read',
  'supplier.read',
  'transaksi.read',
  'laporan.read', 'laporan_keuangan.read', 'laporan_cabang.read',
  'inventory.read',
  'stock_transfer.read',
  'stock_opname.read',
  'shift.read',
  'promo.read',
  'loyalty.read',
  'marketing.read',
  'hutang.read',
  'kredit.read'
);

-- GUDANG: Permissions untuk gudang
INSERT INTO role_permissions (role_permission_id, role_id, permission_id, created_at, updated_at)
SELECT 
  gen_random_uuid(), 
  (SELECT role_id FROM roles WHERE nama_role = 'Gudang' LIMIT 1), 
  permission_id, 
  NOW(), 
  NOW()
FROM permissions
WHERE name IN (
  'dashboard.read',
  'produk.read', 'produk.create', 'produk.update',
  'kategori.read',
  'supplier.read',
  'inventory.read', 'inventory.create', 'inventory.update',
  'stock_transfer.read', 'stock_transfer.create', 'stock_transfer.update',
  'stock_opname.read', 'stock_opname.create', 'stock_opname.update',
  'stock_adjustment.read', 'stock_adjustment.create', 'stock_adjustment.update',
  'stock_notification.read',
  'pembelian.read', 'pembelian.create'
);


-- ===========================================
-- 5. BUAT VIEW PERMISSION-BASED SIDEBAR
-- ===========================================

DROP VIEW IF EXISTS vw_permission_sidebar_navigation;

CREATE OR REPLACE VIEW vw_permission_sidebar_navigation AS
WITH user_permission_names AS (
    SELECT DISTINCT
        r.role_id,
        CONCAT(p.module, '.', p.action) AS permission_name
    FROM roles r
    JOIN role_permissions rp ON r.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.permission_id
    WHERE r.status = 'aktif' AND p.status = 'aktif'
),
accessible_menus AS (
    -- Menus that match the role's permissions
    SELECT DISTINCT
        upn.role_id,
        m.menu_id,
        m.menu_name,
        m.path,
        m.icon,
        m.parent_id,
        m.order_index,
        m.is_active,
        m.required_permission
    FROM user_permission_names upn
    JOIN menu m ON m.required_permission = upn.permission_name
    WHERE m.is_active = true
    
    UNION
    
    -- Parent menus that have accessible children
    SELECT DISTINCT
        upn.role_id,
        parent.menu_id,
        parent.menu_name,
        parent.path,
        parent.icon,
        parent.parent_id,
        parent.order_index,
        parent.is_active,
        parent.required_permission
    FROM user_permission_names upn
    JOIN menu child ON child.required_permission = upn.permission_name
    JOIN menu parent ON child.parent_id = parent.menu_id
    WHERE parent.is_active = true
),
parent_menus AS (
    SELECT DISTINCT
        am.role_id,
        am.menu_id,
        am.menu_name,
        am.path,
        am.icon,
        am.order_index
    FROM accessible_menus am
    WHERE am.parent_id IS NULL
)
SELECT 
    pm.role_id,
    pm.menu_id AS parent_id,
    pm.menu_name AS parent_name,
    pm.path AS parent_path,
    pm.icon AS parent_icon,
    pm.order_index AS parent_order,
    cm.menu_id AS child_id,
    cm.menu_name AS child_name,
    cm.path AS child_path,
    cm.icon AS child_icon,
    cm.order_index AS child_order,
    true AS has_view_permission
FROM parent_menus pm
LEFT JOIN accessible_menus cm ON pm.role_id = cm.role_id AND pm.menu_id = cm.parent_id
ORDER BY pm.role_id, pm.order_index, pm.menu_name, cm.order_index, cm.menu_name;


-- ===========================================
-- 6. BUAT INDEX UNTUK PERFORMA
-- ===========================================

CREATE INDEX IF NOT EXISTS idx_menu_required_permission ON menu(required_permission);
CREATE INDEX IF NOT EXISTS idx_menu_parent_id ON menu(parent_id);
CREATE INDEX IF NOT EXISTS idx_menu_is_active ON menu(is_active);
CREATE INDEX IF NOT EXISTS idx_permissions_module_action ON permissions(module, action);
CREATE INDEX IF NOT EXISTS idx_permissions_name ON permissions(name);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);


-- ===========================================
-- 7. VERIFIKASI
-- ===========================================

-- Cek jumlah permissions
SELECT 'Total Permissions' as label, COUNT(*) as count FROM permissions;

-- Cek jumlah menu dengan permission
SELECT 'Menus with Permission' as label, COUNT(*) as count FROM menu WHERE required_permission IS NOT NULL;

-- Cek role permissions
SELECT r.nama_role, COUNT(rp.role_permission_id) as permission_count 
FROM roles r 
LEFT JOIN role_permissions rp ON r.role_id = rp.role_id 
GROUP BY r.nama_role 
ORDER BY permission_count DESC;
