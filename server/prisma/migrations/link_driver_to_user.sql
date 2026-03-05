-- ========================================
-- Link Driver table to User table
-- ========================================

-- 1. Add user_id column to driver table (nullable, optional link)
ALTER TABLE driver ADD COLUMN IF NOT EXISTS user_id VARCHAR(36) REFERENCES "user"(user_id) ON DELETE SET NULL;

-- 2. Create index for user_id
CREATE INDEX IF NOT EXISTS idx_driver_user_id ON driver(user_id);

-- 3. Add unique constraint so one user can only be one driver
ALTER TABLE driver ADD CONSTRAINT driver_user_id_unique UNIQUE (user_id);
