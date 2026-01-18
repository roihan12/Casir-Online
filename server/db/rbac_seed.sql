-- SQL Insert untuk RBAC dan Menu Aplikasi

-- Roles
INSERT INTO roles (role_id, nama_role, deskripsi, created_at, updated_at, status)
VALUES 
('1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p', 'Super Admin', 'Akses penuh ke seluruh sistem', NOW(), NOW(), 'aktif'),
('2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q', 'Admin', 'Akses administratif ke sistem', NOW(), NOW(), 'aktif'),
('3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r', 'Kasir', 'Akses ke modul transaksi dan produk', NOW(), NOW(), 'aktif'),
('4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s', 'Manajer', 'Akses ke laporan dan manajemen', NOW(), NOW(), 'aktif'),
('5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t', 'Gudang', 'Akses ke modul inventori', NOW(), NOW(), 'aktif');

-- Permissions
INSERT INTO permissions (permission_id, name, description, module, action, created_at, updated_at)
VALUES
-- Dashboard
('p1-dash-read', 'dashboard.read', 'Melihat dashboard', 'dashboard', 'read', NOW(), NOW()),

-- User Management
('p2-user-create', 'user.create', 'Membuat pengguna baru', 'user', 'create', NOW(), NOW()),
('p3-user-read', 'user.read', 'Melihat data pengguna', 'user', 'read', NOW(), NOW()),
('p4-user-update', 'user.update', 'Mengubah data pengguna', 'user', 'update', NOW(), NOW()),
('p5-user-delete', 'user.delete', 'Menghapus pengguna', 'user', 'delete', NOW(), NOW()),

-- Role Management
('p6-role-create', 'role.create', 'Membuat role baru', 'role', 'create', NOW(), NOW()),
('p7-role-read', 'role.read', 'Melihat data role', 'role', 'read', NOW(), NOW()),
('p8-role-update', 'role.update', 'Mengubah data role', 'role', 'update', NOW(), NOW()),
('p9-role-delete', 'role.delete', 'Menghapus role', 'role', 'delete', NOW(), NOW()),

-- Produk Management
('p10-produk-create', 'produk.create', 'Membuat produk baru', 'produk', 'create', NOW(), NOW()),
('p11-produk-read', 'produk.read', 'Melihat data produk', 'produk', 'read', NOW(), NOW()),
('p12-produk-update', 'produk.update', 'Mengubah data produk', 'produk', 'update', NOW(), NOW()),
('p13-produk-delete', 'produk.delete', 'Menghapus produk', 'produk', 'delete', NOW(), NOW()),

-- Kategori Management
('p14-kategori-create', 'kategori.create', 'Membuat kategori baru', 'kategori', 'create', NOW(), NOW()),
('p15-kategori-read', 'kategori.read', 'Melihat data kategori', 'kategori', 'read', NOW(), NOW()),
('p16-kategori-update', 'kategori.update', 'Mengubah data kategori', 'kategori', 'update', NOW(), NOW()),
('p17-kategori-delete', 'kategori.delete', 'Menghapus kategori', 'kategori', 'delete', NOW(), NOW()),

-- Transaksi Management
('p18-transaksi-create', 'transaksi.create', 'Membuat transaksi baru', 'transaksi', 'create', NOW(), NOW()),
('p19-transaksi-read', 'transaksi.read', 'Melihat data transaksi', 'transaksi', 'read', NOW(), NOW()),
('p20-transaksi-update', 'transaksi.update', 'Mengubah data transaksi', 'transaksi', 'update', NOW(), NOW()),
('p21-transaksi-delete', 'transaksi.delete', 'Menghapus transaksi', 'transaksi', 'delete', NOW(), NOW()),

-- Laporan
('p22-laporan-read', 'laporan.read', 'Melihat laporan', 'laporan', 'read', NOW(), NOW()),

-- Cabang Management
('p23-cabang-create', 'cabang.create', 'Membuat cabang baru', 'cabang', 'create', NOW(), NOW()),
('p24-cabang-read', 'cabang.read', 'Melihat data cabang', 'cabang', 'read', NOW(), NOW()),
('p25-cabang-update', 'cabang.update', 'Mengubah data cabang', 'cabang', 'update', NOW(), NOW()),
('p26-cabang-delete', 'cabang.delete', 'Menghapus cabang', 'cabang', 'delete', NOW(), NOW()),

-- Supplier Management
('p27-supplier-create', 'supplier.create', 'Membuat supplier baru', 'supplier', 'create', NOW(), NOW()),
('p28-supplier-read', 'supplier.read', 'Melihat data supplier', 'supplier', 'read', NOW(), NOW()),
('p29-supplier-update', 'supplier.update', 'Mengubah data supplier', 'supplier', 'update', NOW(), NOW()),
('p30-supplier-delete', 'supplier.delete', 'Menghapus supplier', 'supplier', 'delete', NOW(), NOW()),

-- Pelanggan Management
('p31-pelanggan-create', 'pelanggan.create', 'Membuat pelanggan baru', 'pelanggan', 'create', NOW(), NOW()),
('p32-pelanggan-read', 'pelanggan.read', 'Melihat data pelanggan', 'pelanggan', 'read', NOW(), NOW()),
('p33-pelanggan-update', 'pelanggan.update', 'Mengubah data pelanggan', 'pelanggan', 'update', NOW(), NOW()),
('p34-pelanggan-delete', 'pelanggan.delete', 'Menghapus pelanggan', 'pelanggan', 'delete', NOW(), NOW()),

-- Promo Management
('p35-promo-create', 'promo.create', 'Membuat promo baru', 'promo', 'create', NOW(), NOW()),
('p36-promo-read', 'promo.read', 'Melihat data promo', 'promo', 'read', NOW(), NOW()),
('p37-promo-update', 'promo.update', 'Mengubah data promo', 'promo', 'update', NOW(), NOW()),
('p38-promo-delete', 'promo.delete', 'Menghapus promo', 'promo', 'delete', NOW(), NOW()),

-- Inventory Management
('p39-inventory-create', 'inventory.create', 'Membuat inventory baru', 'inventory', 'create', NOW(), NOW()),
('p40-inventory-read', 'inventory.read', 'Melihat data inventory', 'inventory', 'read', NOW(), NOW()),
('p41-inventory-update', 'inventory.update', 'Mengubah data inventory', 'inventory', 'update', NOW(), NOW()),
('p42-inventory-delete', 'inventory.delete', 'Menghapus inventory', 'inventory', 'delete', NOW(), NOW()),

-- Shift Management
('p43-shift-create', 'shift.create', 'Membuat shift baru', 'shift', 'create', NOW(), NOW()),
('p44-shift-read', 'shift.read', 'Melihat data shift', 'shift', 'read', NOW(), NOW()),
('p45-shift-update', 'shift.update', 'Mengubah data shift', 'shift', 'update', NOW(), NOW()),
('p46-shift-delete', 'shift.delete', 'Menghapus shift', 'shift', 'delete', NOW(), NOW()),

-- Loyalty Management
('p47-loyalty-create', 'loyalty.create', 'Membuat konfigurasi loyalty', 'loyalty', 'create', NOW(), NOW()),
('p48-loyalty-read', 'loyalty.read', 'Melihat data loyalty', 'loyalty', 'read', NOW(), NOW()),
('p49-loyalty-update', 'loyalty.update', 'Mengubah data loyalty', 'loyalty', 'update', NOW(), NOW()),
('p50-loyalty-delete', 'loyalty.delete', 'Menghapus loyalty', 'loyalty', 'delete', NOW(), NOW());

-- Role Permissions
-- Super Admin (semua permission)
INSERT INTO role_permissions (role_permission_id, role_id, permission_id, created_at, updated_at)
SELECT 
  uuid_generate_v4(), 
  '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p', 
  permission_id, 
  NOW(), 
  NOW()
FROM permissions;

-- Admin (sebagian besar permission kecuali beberapa yang sensitif)
INSERT INTO role_permissions (role_permission_id, role_id, permission_id, created_at, updated_at)
SELECT 
  uuid_generate_v4(), 
  '2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q', 
  permission_id, 
  NOW(), 
  NOW()
FROM permissions
WHERE name NOT IN ('role.delete', 'user.delete', 'cabang.delete');

-- Kasir (permission terkait transaksi dan produk)
INSERT INTO role_permissions (role_permission_id, role_id, permission_id, created_at, updated_at)
VALUES
(uuid_generate_v4(), '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r', 'p1-dash-read', NOW(), NOW()),
(uuid_generate_v4(), '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r', 'p11-produk-read', NOW(), NOW()),
(uuid_generate_v4(), '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r', 'p15-kategori-read', NOW(), NOW()),
(uuid_generate_v4(), '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r', 'p18-transaksi-create', NOW(), NOW()),
(uuid_generate_v4(), '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r', 'p19-transaksi-read', NOW(), NOW()),
(uuid_generate_v4(), '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r', 'p32-pelanggan-read', NOW(), NOW()),
(uuid_generate_v4(), '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r', 'p36-promo-read', NOW(), NOW()),
(uuid_generate_v4(), '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r', 'p40-inventory-read', NOW(), NOW()),
(uuid_generate_v4(), '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r', 'p43-shift-create', NOW(), NOW()),
(uuid_generate_v4(), '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r', 'p44-shift-read', NOW(), NOW()),
(uuid_generate_v4(), '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r', 'p48-loyalty-read', NOW(), NOW());

-- Manajer (permission terkait laporan dan manajemen)
INSERT INTO role_permissions (role_permission_id, role_id, permission_id, created_at, updated_at)
VALUES
(uuid_generate_v4(), '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s', 'p1-dash-read', NOW(), NOW()),
(uuid_generate_v4(), '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s', 'p3-user-read', NOW(), NOW()),
(uuid_generate_v4(), '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s', 'p7-role-read', NOW(), NOW()),
(uuid_generate_v4(), '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s', 'p11-produk-read', NOW(), NOW()),
(uuid_generate_v4(), '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s', 'p15-kategori-read', NOW(), NOW()),
(uuid_generate_v4(), '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s', 'p19-transaksi-read', NOW(), NOW()),
(uuid_generate_v4(), '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s', 'p22-laporan-read', NOW(), NOW()),
(uuid_generate_v4(), '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s', 'p24-cabang-read', NOW(), NOW()),
(uuid_generate_v4(), '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s', 'p28-supplier-read', NOW(), NOW()),
(uuid_generate_v4(), '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s', 'p32-pelanggan-read', NOW(), NOW()),
(uuid_generate_v4(), '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s', 'p36-promo-read', NOW(), NOW()),
(uuid_generate_v4(), '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s', 'p40-inventory-read', NOW(), NOW()),
(uuid_generate_v4(), '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s', 'p44-shift-read', NOW(), NOW()),
(uuid_generate_v4(), '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s', 'p48-loyalty-read', NOW(), NOW());

-- Gudang (permission terkait inventori)
INSERT INTO role_permissions (role_permission_id, role_id, permission_id, created_at, updated_at)
VALUES
(uuid_generate_v4(), '5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t', 'p1-dash-read', NOW(), NOW()),
(uuid_generate_v4(), '5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t', 'p10-produk-create', NOW(), NOW()),
(uuid_generate_v4(), '5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t', 'p11-produk-read', NOW(), NOW()),
(uuid_generate_v4(), '5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t', 'p12-produk-update', NOW(), NOW()),
(uuid_generate_v4(), '5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t', 'p15-kategori-read', NOW(), NOW()),
(uuid_generate_v4(), '5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t', 'p28-supplier-read', NOW(), NOW()),
(uuid_generate_v4(), '5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t', 'p39-inventory-create', NOW(), NOW()),
(uuid_generate_v4(), '5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t', 'p40-inventory-read', NOW(), NOW()),
(uuid_generate_v4(), '5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t', 'p41-inventory-update', NOW(), NOW());

-- Menu
  INSERT INTO menu (menu_id, menu_name, path, icon, parent_id, order_index, is_active, created_at, updated_at)
  VALUES
  -- Main Menus
  ('m1-dashboard', 'Dashboard', '/dashboard', 'dashboard', NULL, 1, true, NOW(), NOW()),
  ('m2-transaksi', 'Transaksi', '/transaksi', 'shopping_cart', NULL, 2, true, NOW(), NOW()),
  ('m3-produk', 'Produk', '/produk', 'inventory_2', NULL, 3, true, NOW(), NOW()),
  ('m4-pelanggan', 'Pelanggan', '/pelanggan', 'people', NULL, 4, true, NOW(), NOW()),
  ('m5-laporan', 'Laporan', '/laporan', 'assessment', NULL, 5, true, NOW(), NOW()),
  ('m6-pengaturan', 'Pengaturan', '/pengaturan', 'settings', NULL, 6, true, NOW(), NOW()),
  ('m7-inventory', 'Inventory', '/inventory', 'inventory', NULL, 7, true, NOW(), NOW()),

  -- Sub Menus - Produk
  ('m3-1-daftar', 'Daftar Produk', '/produk/daftar', 'list', 'm3-produk', 1, true, NOW(), NOW()),
  ('m3-2-kategori', 'Kategori', '/produk/kategori', 'category', 'm3-produk', 2, true, NOW(), NOW()),
  ('m3-3-supplier', 'Supplier', '/produk/supplier', 'local_shipping', 'm3-produk', 3, true, NOW(), NOW()),

  -- Sub Menus - Laporan
  ('m5-1-penjualan', 'Laporan Penjualan', '/laporan/penjualan', 'bar_chart', 'm5-laporan', 1, true, NOW(), NOW()),
  ('m5-2-stok', 'Laporan Stok', '/laporan/stok', 'inventory', 'm5-laporan', 2, true, NOW(), NOW()),
  ('m5-3-keuangan', 'Laporan Keuangan', '/laporan/keuangan', 'account_balance', 'm5-laporan', 3, true, NOW(), NOW()),

  -- Sub Menus - Pengaturan
  ('m6-1-pengguna', 'Pengguna', '/pengaturan/pengguna', 'person', 'm6-pengaturan', 1, true, NOW(), NOW()),
  ('m6-2-role', 'Role & Permissions', '/pengaturan/role', 'admin_panel_settings', 'm6-pengaturan', 2, true, NOW(), NOW()),
  ('m6-3-cabang', 'Cabang', '/pengaturan/cabang', 'store', 'm6-pengaturan', 3, true, NOW(), NOW()),
  ('m6-4-promo', 'Promo & Diskon', '/pengaturan/promo', 'local_offer', 'm6-pengaturan', 4, true, NOW(), NOW()),
  ('m6-5-shift', 'Shift', '/pengaturan/shift', 'schedule', 'm6-pengaturan', 5, true, NOW(), NOW()),
  ('m6-6-loyalty', 'Program Loyalty', '/pengaturan/loyalty', 'card_membership', 'm6-pengaturan', 6, true, NOW(), NOW()),

  -- Sub Menus - Inventory
  ('m7-1-stok', 'Stok Barang', '/inventory/stok', 'inventory_2', 'm7-inventory', 1, true, NOW(), NOW()),
  ('m7-2-transfer', 'Transfer Stok', '/inventory/transfer', 'swap_horiz', 'm7-inventory', 2, true, NOW(), NOW()),
  ('m7-3-penyesuaian', 'Penyesuaian Stok', '/inventory/penyesuaian', 'published_with_changes', 'm7-inventory', 3, true, NOW(), NOW());

  -- Role Menu
  -- Super Admin (akses ke semua menu)
  INSERT INTO role_menu (role_menu_id, role_id, menu_id, can_view, can_create, can_edit, can_delete, created_at, updated_at)
  SELECT 
    uuid_generate_v4(), 
    '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p', 
    menu_id, 
    true, 
    true, 
    true, 
    true, 
    NOW(), 
    NOW()
  FROM menu;

  -- Admin (akses ke sebagian besar menu)
  INSERT INTO role_menu (role_menu_id, role_id, menu_id, can_view, can_create, can_edit, can_delete, created_at, updated_at)
  SELECT 
    uuid_generate_v4(), 
    '2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q', 
    menu_id, 
    true, 
    true, 
    true, 
    true, 
    NOW(), 
    NOW()
  FROM menu;

  -- Kasir (akses ke menu transaksi dan produk)
  INSERT INTO role_menu (role_menu_id, role_id, menu_id, can_view, can_create, can_edit, can_delete, created_at, updated_at)
  VALUES
  (uuid_generate_v4(), '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r', 'm1-dashboard', true, false, false, false, NOW(), NOW()),
  (uuid_generate_v4(), '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r', 'm2-transaksi', true, true, false, false, NOW(), NOW()),
  (uuid_generate_v4(), '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r', 'm3-produk', true, false, false, false, NOW(), NOW()),
  (uuid_generate_v4(), '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r', 'm3-1-daftar', true, false, false, false, NOW(), NOW()),
  (uuid_generate_v4(), '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r', 'm4-pelanggan', true, false, false, false, NOW(), NOW()),
  (uuid_generate_v4(), '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r', 'm6-5-shift', true, true, false, false, NOW(), NOW());

  -- Manajer (akses ke menu laporan dan pengaturan)
  INSERT INTO role_menu (role_menu_id, role_id, menu_id, can_view, can_create, can_edit, can_delete, created_at, updated_at)
  VALUES
  (uuid_generate_v4(), '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s', 'm1-dashboard', true, false, false, false, NOW(), NOW()),
  (uuid_generate_v4(), '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s', 'm3-produk', true, false, false, false, NOW(), NOW()),
  (uuid_generate_v4(), '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s', 'm3-1-daftar', true, false, false, false, NOW(), NOW()),
  (uuid_generate_v4(), '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s', 'm3-2-kategori', true, false, false, false, NOW(), NOW()),
  (uuid_generate_v4(), '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s', 'm3-3-supplier', true, false, false, false, NOW(), NOW()),
  (uuid_generate_v4(), '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s', 'm4-pelanggan', true, false, false, false, NOW(), NOW()),
  (uuid_generate_v4(), '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s', 'm5-laporan', true, false, false, false, NOW(), NOW()),
  (uuid_generate_v4(), '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s', 'm5-1-penjualan', true, false, false, false, NOW(), NOW()),
  (uuid_generate_v4(), '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s', 'm5-2-stok', true, false, false, false, NOW(), NOW()),
  (uuid_generate_v4(), '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s', 'm5-3-keuangan', true, false, false, false, NOW(), NOW()),
  (uuid_generate_v4(), '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s', 'm6-4-promo', true, false, false, false, NOW(), NOW()),
  (uuid_generate_v4(), '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s', 'm6-5-shift', true, false, false, false, NOW(), NOW()),
  (uuid_generate_v4(), '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s', 'm6-6-loyalty', true, false, false, false, NOW(), NOW()),
  (uuid_generate_v4(), '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s', 'm7-1-stok', true, false, false, false, NOW(), NOW());

  -- Gudang (akses ke menu inventory)
  INSERT INTO role_menu (role_menu_id, role_id, menu_id, can_view, can_create, can_edit, can_delete, created_at, updated_at)
  VALUES
  (uuid_generate_v4(), '5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t', 'm1-dashboard', true, false, false, false, NOW(), NOW()),
  (uuid_generate_v4(), '5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t', 'm3-produk', true, true, true, false, NOW(), NOW()),
  (uuid_generate_v4(), '5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t', 'm3-1-daftar', true, true, true, false, NOW(), NOW()),
  (uuid_generate_v4(), '5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t', 'm3-2-kategori', true, false, false, false, NOW(), NOW()),
  (uuid_generate_v4(), '5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t', 'm3-3-supplier', true, false, false, false, NOW(), NOW()),
  (uuid_generate_v4(), '5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t', 'm7-inventory', true, true, true, false, NOW(), NOW()),
  (uuid_generate_v4(), '5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t', 'm7-1-stok', true, true, true, false, NOW(), NOW()),
  (uuid_generate_v4(), '5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t', 'm7-2-transfer', true, true, true, false, NOW(), NOW()),
  (uuid_generate_v4(), '5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t', 'm7-3-penyesuaian', true, true, true, false, NOW(), NOW());

-- Sample User
INSERT INTO "user" (user_id, username, password, nama_lengkap, email, telepon, status, created_at, updated_at)
VALUES
('u1-superadmin', 'superadmin', '$2a$10$xLJLvbCjG9xnRxvnlLn1t.sCUCYNlixVzuuGn3/JM9wJHUKsUGnxy', 'Super Administrator', 'superadmin@example.com', '081234567890', 'aktif', NOW(), NOW()),
('u2-admin', 'admin', '$2a$10$xLJLvbCjG9xnRxvnlLn1t.sCUCYNlixVzuuGn3/JM9wJHUKsUGnxy', 'Administrator', 'admin@example.com', '081234567891', 'aktif', NOW(), NOW()),
('u3-kasir', 'kasir', '$2a$10$xLJLvbCjG9xnRxvnlLn1t.sCUCYNlixVzuuGn3/JM9wJHUKsUGnxy', 'Kasir', 'kasir@example.com', '081234567892', 'aktif', NOW(), NOW()),
('u4-manajer', 'manajer', '$2a$10$xLJLvbCjG9xnRxvnlLn1t.sCUCYNlixVzuuGn3/JM9wJHUKsUGnxy', 'Manajer', 'manajer@example.com', '081234567893', 'aktif', NOW(), NOW()),
('u5-gudang', 'gudang', '$2a$10$xLJLvbCjG9xnRxvnlLn1t.sCUCYNlixVzuuGn3/JM9wJHUKsUGnxy', 'Staff Gudang', 'gudang@example.com', '081234567894', 'aktif', NOW(), NOW());

-- Sample Cabang
INSERT INTO cabang (cabang_id, nama_cabang, alamat, telepon, status, created_at, updated_at)
VALUES
('c1-pusat', 'Cabang Pusat', 'Jl. Utama No. 1, Jakarta', '021-1234567', 'aktif', NOW(), NOW()),
('c2-cabang1', 'Cabang 1', 'Jl. Raya No. 10, Bandung', '022-1234567', 'aktif', NOW(), NOW()),
('c3-cabang2', 'Cabang 2', 'Jl. Besar No. 5, Surabaya', '031-1234567', 'aktif', NOW(), NOW());

-- User Cabang
INSERT INTO user_cabang (user_cabang_id, user_id, cabang_id, is_primary, created_at, updated_at)
VALUES
(uuid_generate_v4(), 'u1-superadmin', 'c1-pusat', true, NOW(), NOW()),
(uuid_generate_v4(), 'u2-admin', 'c1-pusat', true, NOW(), NOW()),
(uuid_generate_v4(), 'u3-kasir', 'c1-pusat', true, NOW(), NOW()),
(uuid_generate_v4(), 'u4-manajer', 'c1-pusat', true, NOW(), NOW()),
(uuid_generate_v4(), 'u5-gudang', 'c1-pusat', true, NOW(), NOW()),
(uuid_generate_v4(), 'u1-superadmin', 'c2-cabang1', false, NOW(), NOW()),
(uuid_generate_v4(), 'u1-superadmin', 'c3-cabang2', false, NOW(), NOW());

-- User Role
INSERT INTO user_roles (user_role_id, user_id, role_id, cabang_id, created_at, updated_at)
VALUES
(uuid_generate_v4(), 'u1-superadmin', '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p', 'c1-pusat', NOW(), NOW()),
(uuid_generate_v4(), 'u2-admin', '2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q', 'c1-pusat', NOW(), NOW()),
(uuid_generate_v4(), 'u3-kasir', '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r', 'c1-pusat', NOW(), NOW()),
(uuid_generate_v4(), 'u4-manajer', '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s', 'c1-pusat', NOW(), NOW()),
(uuid_generate_v4(), 'u5-gudang', '5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t', 'c1-pusat', NOW(), NOW()),
(uuid_generate_v4(), 'u1-superadmin', '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p', 'c2-cabang1', NOW(), NOW()),
(uuid_generate_v4(), 'u1-superadmin', '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p', 'c3-cabang2', NOW(), NOW());