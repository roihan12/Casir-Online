-- ========================================
-- Driver Role, Permissions, Menu & Module
-- ========================================

-- 1. Create Driver Role
INSERT INTO roles (role_id, nama_role, deskripsi, created_at, updated_at, status)
VALUES ('6f7g8h9i-0j1k-2l3m-4n5o-6p7q8r9s0t1u', 'Driver', 'Akses pengiriman dan tugas delivery', NOW(), NOW(), 'aktif')
ON CONFLICT (role_id) DO NOTHING;

-- 2. Create Driver Module Permissions
INSERT INTO permissions (permission_id, name, description, module, action, created_at, updated_at)
VALUES
-- Delivery module (driver-specific)
('p-delivery-read',    'delivery.read',    'Melihat tugas pengiriman',       'delivery', 'read',    NOW(), NOW()),
('p-delivery-update',  'delivery.update',  'Update status pengiriman',       'delivery', 'update',  NOW(), NOW()),
('p-delivery-location','delivery.location','Kirim lokasi live',              'delivery', 'location',NOW(), NOW()),
('p-delivery-cod',     'delivery.cod',     'Terima pembayaran COD',          'delivery', 'cod',     NOW(), NOW()),
-- Driver management (admin)
('p-driver-create',    'driver.create',    'Membuat driver baru',            'driver', 'create',    NOW(), NOW()),
('p-driver-read',      'driver.read',      'Melihat data driver',            'driver', 'read',      NOW(), NOW()),
('p-driver-update',    'driver.update',    'Mengubah data driver',           'driver', 'update',    NOW(), NOW()),
('p-driver-delete',    'driver.delete',    'Menghapus driver',               'driver', 'delete',    NOW(), NOW())
ON CONFLICT (permission_id) DO NOTHING;

-- 3. Assign permissions to Driver role
INSERT INTO role_permissions (role_permission_id, role_id, permission_id, created_at, updated_at)
VALUES
-- Driver gets: delivery read/update/location/cod  
(gen_random_uuid(), '6f7g8h9i-0j1k-2l3m-4n5o-6p7q8r9s0t1u', 'p-delivery-read',     NOW(), NOW()),
(gen_random_uuid(), '6f7g8h9i-0j1k-2l3m-4n5o-6p7q8r9s0t1u', 'p-delivery-update',   NOW(), NOW()),
(gen_random_uuid(), '6f7g8h9i-0j1k-2l3m-4n5o-6p7q8r9s0t1u', 'p-delivery-location', NOW(), NOW()),
(gen_random_uuid(), '6f7g8h9i-0j1k-2l3m-4n5o-6p7q8r9s0t1u', 'p-delivery-cod',      NOW(), NOW())
ON CONFLICT DO NOTHING;

-- 4. Also give delivery + driver permissions to Super Admin (all) and Admin
INSERT INTO role_permissions (role_permission_id, role_id, permission_id, created_at, updated_at)
SELECT gen_random_uuid(), r.role_id, p.permission_id, NOW(), NOW()
FROM (SELECT role_id FROM roles WHERE nama_role IN ('Super Admin')) r
CROSS JOIN (SELECT permission_id FROM permissions WHERE module IN ('delivery', 'driver')) p
ON CONFLICT DO NOTHING;

-- Admin gets delivery management + driver CRUD
INSERT INTO role_permissions (role_permission_id, role_id, permission_id, created_at, updated_at)
SELECT gen_random_uuid(), r.role_id, p.permission_id, NOW(), NOW()
FROM (SELECT role_id FROM roles WHERE nama_role = 'Admin') r
CROSS JOIN (SELECT permission_id FROM permissions WHERE module IN ('delivery', 'driver')) p
ON CONFLICT DO NOTHING;

-- 5. Create Menu entries for Delivery
INSERT INTO menu (menu_id, menu_name, path, icon, parent_id, order_index, is_active, created_at, updated_at)
VALUES
('m-delivery', 'Delivery', NULL, 'truck', NULL, 15, true, NOW(), NOW()),
('m-delivery-dashboard', 'Dashboard Delivery', '/delivery', 'package', 'm-delivery', 1, true, NOW(), NOW()),
('m-delivery-drivers', 'Kelola Driver', '/delivery/drivers', 'users', 'm-delivery', 2, true, NOW(), NOW()),
('m-delivery-tasks', 'Tugas Saya', '/delivery/my-tasks', 'navigation', 'm-delivery', 3, true, NOW(), NOW())
ON CONFLICT (menu_id) DO NOTHING;

-- 6. Assign menu to roles
-- Super Admin & Admin: all delivery menus
INSERT INTO role_menu (role_menu_id, role_id, menu_id, can_view, can_create, can_edit, can_delete, created_at, updated_at)
SELECT gen_random_uuid(), r.role_id, m.menu_id, true, true, true, true, NOW(), NOW()
FROM (SELECT role_id FROM roles WHERE nama_role IN ('Super Admin', 'Admin')) r
CROSS JOIN (SELECT menu_id FROM menu WHERE menu_id LIKE 'm-delivery%') m
ON CONFLICT DO NOTHING;

-- Driver: only my-tasks menu (view only)
INSERT INTO role_menu (role_menu_id, role_id, menu_id, can_view, can_create, can_edit, can_delete, created_at, updated_at)
VALUES
(gen_random_uuid(), '6f7g8h9i-0j1k-2l3m-4n5o-6p7q8r9s0t1u', 'm-delivery', true, false, false, false, NOW(), NOW()),
(gen_random_uuid(), '6f7g8h9i-0j1k-2l3m-4n5o-6p7q8r9s0t1u', 'm-delivery-tasks', true, false, true, false, NOW(), NOW())
ON CONFLICT DO NOTHING;
