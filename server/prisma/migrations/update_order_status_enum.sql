-- Migration: Update order_status from enum to VARCHAR(20) with expanded CHECK constraint
-- The old OrderStatus enum only had: pending, confirmed, processing, completed, cancelled, failed
-- The application now uses uppercase statuses: PENDING, CONFIRMED, PROCESSING, READY, 
-- ON_DELIVERY, COMPLETED, CANCELLED, FAILED

-- Step 1: Drop the old constraint if it exists
ALTER TABLE transaksi DROP CONSTRAINT IF EXISTS transaksi_order_status_check;

-- Step 2: Convert column from enum to VARCHAR(20) if it's still an enum
DO $$
BEGIN
  -- Check if column is using the OrderStatus enum type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transaksi' 
    AND column_name = 'order_status' 
    AND udt_name = 'OrderStatus'
  ) THEN
    ALTER TABLE transaksi 
      ALTER COLUMN order_status TYPE VARCHAR(20) USING order_status::text;
  END IF;
END $$;

-- Step 3: Update existing lowercase values to uppercase
UPDATE transaksi SET order_status = UPPER(order_status) 
WHERE order_status != UPPER(order_status);

-- Step 4: Set proper default
ALTER TABLE transaksi 
  ALTER COLUMN order_status SET DEFAULT 'COMPLETED';

-- Step 5: Add new CHECK constraint with all valid statuses
ALTER TABLE transaksi 
  ADD CONSTRAINT transaksi_order_status_check 
  CHECK (order_status IN (
    'PENDING', 
    'CONFIRMED', 
    'PROCESSING', 
    'READY', 
    'ON_DELIVERY', 
    'COMPLETED', 
    'CANCELLED', 
    'FAILED'
  ));
