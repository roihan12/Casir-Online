-- ===========================================================================
-- Dashboard Performance Indexes
-- Meningkatkan kecepatan query dashboard dari >5 detik ke <1.5 detik
-- 
-- Jalankan sekali di database Supabase/PostgreSQL:
-- psql <connection_string> -f dashboard_performance_indexes.sql
-- ===========================================================================

-- 1. Composite index utama untuk tabel transaksi
--    Dipakai di hampir semua query dashboard:
--    jenis_transaksi = 'PENJUALAN' AND status_pembayaran = 'LUNAS' AND tanggal >= X
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transaksi_dashboard_filter
  ON transaksi (cabang_id, jenis_transaksi, status_pembayaran, tanggal DESC);

-- 2. Index tanpa cabang_id untuk query superadmin (all branches)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transaksi_sales_date
  ON transaksi (jenis_transaksi, status_pembayaran, tanggal DESC);

-- 3. Index untuk soft-delete filter (deleted_at IS NULL sering dipakai)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transaksi_deleted_at
  ON transaksi (deleted_at)
  WHERE deleted_at IS NULL;

-- 4. Index untuk expiring stock query di fetchCriticalAlerts
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_movement_expired_date
  ON inventory_movement (cabang_id, expired_date)
  WHERE expired_date IS NOT NULL;

-- 5. Index untuk unread notifications count
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stock_notification_unread
  ON stock_notification (cabang_id, is_read)
  WHERE is_read = false;

-- 6. Index untuk transaksi_detail groupBy product performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transaksi_detail_produk_id
  ON transaksi_detail (produk_id, transaksi_id);

-- 7. Index untuk pembayaran groupBy dashboard (payment methods)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pembayaran_metode_transaksi
  ON pembayaran (metode_pembayaran, transaksi_id);

-- 8. Index untuk user_session (active users query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_session_expired_at
  ON user_session (expired_at)
  WHERE expired_at > NOW();

-- ===========================================================================
-- Verifikasi: Lihat semua index yang dibuat
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'transaksi'
--   AND indexname LIKE 'idx_transaksi%';
-- ===========================================================================
