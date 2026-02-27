-- ===========================================================================
-- ROW LEVEL SECURITY (RLS) - 10 Tabel Prioritas Kritis
-- 
-- Jalankan di Supabase SQL Editor atau psql:
-- psql <connection_string> -f enable_rls_critical.sql
--
-- URUTAN EKSEKUSI:
-- 1. Buat role app_user
-- 2. Grant permissions
-- 3. Buat helper function
-- 4. Enable RLS pada 10 tabel
-- 5. Buat policies
-- ===========================================================================

-- =============================================
-- STEP 1: Buat Dedicated Role (app_user)
-- =============================================
-- Cek apakah role sudah ada, buat jika belum
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user WITH LOGIN PASSWORD 'GANTI_PASSWORD_INI_DENGAN_PASSWORD_KUAT';
  END IF;
END
$$;

-- =============================================
-- STEP 2: Grant Permissions ke app_user
-- =============================================
-- Grant connect & usage
GRANT CONNECT ON DATABASE postgres TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;

-- Grant DML pada semua tabel existing
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;

-- Grant usage pada semua sequences (untuk auto-increment/uuid)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- Grant execute pada semua functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO app_user;

-- Auto-grant untuk tabel/sequence baru di masa depan
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO app_user;

-- =============================================
-- STEP 3: Helper Function
-- =============================================
-- Function untuk mendapatkan cabang_ids user saat ini
-- Dipanggil oleh RLS policies
CREATE OR REPLACE FUNCTION app_user_cabang_ids()
RETURNS TEXT[] AS $$
DECLARE
  raw_val TEXT;
BEGIN
  -- Ambil dari session variable yang di-set oleh Prisma middleware
  raw_val := current_setting('app.current_cabang_ids', true);
  
  -- Jika kosong/null, return array kosong (block semua)
  IF raw_val IS NULL OR raw_val = '' THEN
    RETURN ARRAY[]::TEXT[];
  END IF;
  
  -- Split comma-separated string jadi array
  RETURN string_to_array(raw_val, ',');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function untuk mendapatkan user_id saat ini
CREATE OR REPLACE FUNCTION app_current_user_id()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('app.current_user_id', true);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function untuk cek apakah user adalah super_admin
CREATE OR REPLACE FUNCTION app_is_super_admin()
RETURNS BOOLEAN AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 
    FROM user_roles ur
    JOIN roles r ON r.role_id = ur.role_id
    WHERE ur.user_id = current_setting('app.current_user_id', true)
      AND r.nama_role = 'super_admin'
  ) INTO is_admin;
  
  RETURN COALESCE(is_admin, false);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =============================================
-- STEP 4: Enable RLS pada 10 Tabel Kritis
-- =============================================
ALTER TABLE transaksi ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaksi_detail ENABLE ROW LEVEL SECURITY;
ALTER TABLE pembayaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE produk ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movement ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift ENABLE ROW LEVEL SECURITY;
ALTER TABLE hutang ENABLE ROW LEVEL SECURITY;
ALTER TABLE pembayaran_hutang ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_session ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 5: Buat Policies
-- =============================================

-- ----- 1. TRANSAKSI -----
-- Super admin bisa akses semua
CREATE POLICY "transaksi_super_admin_all" ON transaksi
  FOR ALL
  USING (app_is_super_admin());

-- User biasa hanya akses data cabang mereka
CREATE POLICY "transaksi_cabang_select" ON transaksi
  FOR SELECT
  USING (cabang_id = ANY(app_user_cabang_ids()));

CREATE POLICY "transaksi_cabang_insert" ON transaksi
  FOR INSERT
  WITH CHECK (cabang_id = ANY(app_user_cabang_ids()));

CREATE POLICY "transaksi_cabang_update" ON transaksi
  FOR UPDATE
  USING (cabang_id = ANY(app_user_cabang_ids()))
  WITH CHECK (cabang_id = ANY(app_user_cabang_ids()));

CREATE POLICY "transaksi_cabang_delete" ON transaksi
  FOR DELETE
  USING (cabang_id = ANY(app_user_cabang_ids()));


-- ----- 2. TRANSAKSI_DETAIL -----
CREATE POLICY "transaksi_detail_super_admin_all" ON transaksi_detail
  FOR ALL
  USING (app_is_super_admin());

CREATE POLICY "transaksi_detail_cabang_select" ON transaksi_detail
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM transaksi t
      WHERE t.transaksi_id = transaksi_detail.transaksi_id
        AND t.cabang_id = ANY(app_user_cabang_ids())
    )
  );

CREATE POLICY "transaksi_detail_cabang_insert" ON transaksi_detail
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM transaksi t
      WHERE t.transaksi_id = transaksi_detail.transaksi_id
        AND t.cabang_id = ANY(app_user_cabang_ids())
    )
  );

CREATE POLICY "transaksi_detail_cabang_update" ON transaksi_detail
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM transaksi t
      WHERE t.transaksi_id = transaksi_detail.transaksi_id
        AND t.cabang_id = ANY(app_user_cabang_ids())
    )
  );

CREATE POLICY "transaksi_detail_cabang_delete" ON transaksi_detail
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM transaksi t
      WHERE t.transaksi_id = transaksi_detail.transaksi_id
        AND t.cabang_id = ANY(app_user_cabang_ids())
    )
  );


-- ----- 3. PEMBAYARAN -----
CREATE POLICY "pembayaran_super_admin_all" ON pembayaran
  FOR ALL
  USING (app_is_super_admin());

CREATE POLICY "pembayaran_cabang_select" ON pembayaran
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM transaksi t
      WHERE t.transaksi_id = pembayaran.transaksi_id
        AND t.cabang_id = ANY(app_user_cabang_ids())
    )
  );

CREATE POLICY "pembayaran_cabang_insert" ON pembayaran
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM transaksi t
      WHERE t.transaksi_id = pembayaran.transaksi_id
        AND t.cabang_id = ANY(app_user_cabang_ids())
    )
  );

CREATE POLICY "pembayaran_cabang_update" ON pembayaran
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM transaksi t
      WHERE t.transaksi_id = pembayaran.transaksi_id
        AND t.cabang_id = ANY(app_user_cabang_ids())
    )
  );

CREATE POLICY "pembayaran_cabang_delete" ON pembayaran
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM transaksi t
      WHERE t.transaksi_id = pembayaran.transaksi_id
        AND t.cabang_id = ANY(app_user_cabang_ids())
    )
  );


-- ----- 4. PRODUK -----
CREATE POLICY "produk_super_admin_all" ON produk
  FOR ALL
  USING (app_is_super_admin());

CREATE POLICY "produk_cabang_select" ON produk
  FOR SELECT
  USING (cabang_id = ANY(app_user_cabang_ids()));

CREATE POLICY "produk_cabang_insert" ON produk
  FOR INSERT
  WITH CHECK (cabang_id = ANY(app_user_cabang_ids()));

CREATE POLICY "produk_cabang_update" ON produk
  FOR UPDATE
  USING (cabang_id = ANY(app_user_cabang_ids()))
  WITH CHECK (cabang_id = ANY(app_user_cabang_ids()));

CREATE POLICY "produk_cabang_delete" ON produk
  FOR DELETE
  USING (cabang_id = ANY(app_user_cabang_ids()));


-- ----- 5. INVENTORY_MOVEMENT -----
CREATE POLICY "inventory_movement_super_admin_all" ON inventory_movement
  FOR ALL
  USING (app_is_super_admin());

CREATE POLICY "inventory_movement_cabang_select" ON inventory_movement
  FOR SELECT
  USING (cabang_id = ANY(app_user_cabang_ids()));

CREATE POLICY "inventory_movement_cabang_insert" ON inventory_movement
  FOR INSERT
  WITH CHECK (cabang_id = ANY(app_user_cabang_ids()));

CREATE POLICY "inventory_movement_cabang_update" ON inventory_movement
  FOR UPDATE
  USING (cabang_id = ANY(app_user_cabang_ids()))
  WITH CHECK (cabang_id = ANY(app_user_cabang_ids()));

CREATE POLICY "inventory_movement_cabang_delete" ON inventory_movement
  FOR DELETE
  USING (cabang_id = ANY(app_user_cabang_ids()));


-- ----- 6. SHIFT -----
CREATE POLICY "shift_super_admin_all" ON shift
  FOR ALL
  USING (app_is_super_admin());

CREATE POLICY "shift_cabang_select" ON shift
  FOR SELECT
  USING (cabang_id = ANY(app_user_cabang_ids()));

CREATE POLICY "shift_cabang_insert" ON shift
  FOR INSERT
  WITH CHECK (cabang_id = ANY(app_user_cabang_ids()));

CREATE POLICY "shift_cabang_update" ON shift
  FOR UPDATE
  USING (cabang_id = ANY(app_user_cabang_ids()))
  WITH CHECK (cabang_id = ANY(app_user_cabang_ids()));

CREATE POLICY "shift_cabang_delete" ON shift
  FOR DELETE
  USING (cabang_id = ANY(app_user_cabang_ids()));


-- ----- 7. HUTANG -----
CREATE POLICY "hutang_super_admin_all" ON hutang
  FOR ALL
  USING (app_is_super_admin());

CREATE POLICY "hutang_cabang_select" ON hutang
  FOR SELECT
  USING (cabang_id = ANY(app_user_cabang_ids()));

CREATE POLICY "hutang_cabang_insert" ON hutang
  FOR INSERT
  WITH CHECK (cabang_id = ANY(app_user_cabang_ids()));

CREATE POLICY "hutang_cabang_update" ON hutang
  FOR UPDATE
  USING (cabang_id = ANY(app_user_cabang_ids()))
  WITH CHECK (cabang_id = ANY(app_user_cabang_ids()));

CREATE POLICY "hutang_cabang_delete" ON hutang
  FOR DELETE
  USING (cabang_id = ANY(app_user_cabang_ids()));


-- ----- 8. PEMBAYARAN_HUTANG -----
CREATE POLICY "pembayaran_hutang_super_admin_all" ON pembayaran_hutang
  FOR ALL
  USING (app_is_super_admin());

CREATE POLICY "pembayaran_hutang_cabang_select" ON pembayaran_hutang
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM hutang h
      WHERE h.hutang_id = pembayaran_hutang.hutang_id
        AND h.cabang_id = ANY(app_user_cabang_ids())
    )
  );

CREATE POLICY "pembayaran_hutang_cabang_insert" ON pembayaran_hutang
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hutang h
      WHERE h.hutang_id = pembayaran_hutang.hutang_id
        AND h.cabang_id = ANY(app_user_cabang_ids())
    )
  );

CREATE POLICY "pembayaran_hutang_cabang_update" ON pembayaran_hutang
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM hutang h
      WHERE h.hutang_id = pembayaran_hutang.hutang_id
        AND h.cabang_id = ANY(app_user_cabang_ids())
    )
  );

CREATE POLICY "pembayaran_hutang_cabang_delete" ON pembayaran_hutang
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM hutang h
      WHERE h.hutang_id = pembayaran_hutang.hutang_id
        AND h.cabang_id = ANY(app_user_cabang_ids())
    )
  );


-- ----- 9. USER -----
-- LOGIN BYPASS: Izinkan SELECT saat belum ada context (proses login)
-- Saat login, app.current_user_id belum di-set, jadi harus diizinkan
CREATE POLICY "user_login_bypass" ON "user"
  FOR SELECT
  USING (
    COALESCE(current_setting('app.current_user_id', true), '') = ''
  );

-- Super admin bisa akses semua user
CREATE POLICY "user_super_admin_all" ON "user"
  FOR ALL
  USING (app_is_super_admin());

-- User bisa lihat dirinya sendiri
CREATE POLICY "user_self_select" ON "user"
  FOR SELECT
  USING (user_id = app_current_user_id());

-- User bisa lihat user lain di cabang yang sama
CREATE POLICY "user_same_cabang_select" ON "user"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_cabang uc
      WHERE uc.user_id = "user".user_id
        AND uc.cabang_id = ANY(app_user_cabang_ids())
    )
  );

-- User bisa update data sendiri
CREATE POLICY "user_self_update" ON "user"
  FOR UPDATE
  USING (user_id = app_current_user_id())
  WITH CHECK (user_id = app_current_user_id());


-- ----- 10. USER_SESSION -----
-- LOGIN BYPASS: Izinkan semua operasi saat belum ada context (proses login/logout)
-- Saat login: perlu CREATE session, saat auth middleware: perlu SELECT session
CREATE POLICY "user_session_login_bypass" ON user_session
  FOR ALL
  USING (
    COALESCE(current_setting('app.current_user_id', true), '') = ''
  );

CREATE POLICY "user_session_super_admin_all" ON user_session
  FOR ALL
  USING (app_is_super_admin());

-- User hanya bisa lihat sesi milik sendiri
CREATE POLICY "user_session_self_select" ON user_session
  FOR SELECT
  USING (user_id = app_current_user_id());

-- User hanya bisa insert sesi milik sendiri
CREATE POLICY "user_session_self_insert" ON user_session
  FOR INSERT
  WITH CHECK (user_id = app_current_user_id());

-- User hanya bisa update sesi milik sendiri
CREATE POLICY "user_session_self_update" ON user_session
  FOR UPDATE
  USING (user_id = app_current_user_id());

-- User hanya bisa delete sesi milik sendiri
CREATE POLICY "user_session_self_delete" ON user_session
  FOR DELETE
  USING (user_id = app_current_user_id());


-- =============================================
-- STEP 6: Index untuk Performa RLS
-- =============================================
-- Index pada user_cabang untuk mempercepat lookup cabang_ids
CREATE INDEX IF NOT EXISTS idx_user_cabang_user_id ON user_cabang (user_id);
CREATE INDEX IF NOT EXISTS idx_user_cabang_cabang_id ON user_cabang (cabang_id);
CREATE INDEX IF NOT EXISTS idx_user_cabang_composite ON user_cabang (user_id, cabang_id);

-- Index pada user_roles untuk mempercepat cek super_admin
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles (role_id);

-- =============================================
-- VERIFIKASI
-- =============================================
-- Cek tabel mana yang sudah RLS enabled:
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' AND rowsecurity = true;

-- Cek policies yang sudah dibuat:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE schemaname = 'public';

-- ===========================================================================
-- SELESAI!
-- 
-- LANGKAH SELANJUTNYA:
-- 1. Update .env: ganti DATABASE_URL dan DIRECT_URL dengan role app_user
--    contoh: postgresql://app_user:PASSWORD@host:port/postgres
-- 2. Restart server
-- 3. Test: Login sebagai user cabang A, akses transaksi → hanya tampil data cabang A
-- ===========================================================================
