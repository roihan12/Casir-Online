-- SQL Insert untuk User dengan password yang sudah di-hash
-- Password default untuk semua user: password123

-- Sample User dengan password yang sudah di-hash menggunakan bcrypt
INSERT INTO "user" (user_id, username, password, nama_lengkap, email, telepon, status, created_at, updated_at)
VALUES
('u1-superadmin', 'superadmin', '$2a$10$xLJLvbCjG9xnRxvnlLn1t.sCUCYNlixVzuuGn3/JM9wJHUKsUGnxy', 'Super Administrator', 'superadmin@example.com', '081234567890', 'aktif', NOW(), NOW()),
('u2-admin', 'admin', '$2a$10$xLJLvbCjG9xnRxvnlLn1t.sCUCYNlixVzuuGn3/JM9wJHUKsUGnxy', 'Administrator', 'admin@example.com', '081234567891', 'aktif', NOW(), NOW()),
('u3-kasir', 'kasir', '$2a$10$xLJLvbCjG9xnRxvnlLn1t.sCUCYNlixVzuuGn3/JM9wJHUKsUGnxy', 'Kasir', 'kasir@example.com', '081234567892', 'aktif', NOW(), NOW()),
('u4-manajer', 'manajer', '$2a$10$xLJLvbCjG9xnRxvnlLn1t.sCUCYNlixVzuuGn3/JM9wJHUKsUGnxy', 'Manajer', 'manajer@example.com', '081234567893', 'aktif', NOW(), NOW()),
('u5-gudang', 'gudang', '$2a$10$xLJLvbCjG9xnRxvnlLn1t.sCUCYNlixVzuuGn3/JM9wJHUKsUGnxy', 'Staff Gudang', 'gudang@example.com', '081234567894', 'aktif', NOW(), NOW());

-- Catatan: Password yang digunakan adalah 'password123' yang sudah di-hash dengan bcrypt
-- Hash: $2a$10$xLJLvbCjG9xnRxvnlLn1t.sCUCYNlixVzuuGn3/JM9wJHUKsUGnxy