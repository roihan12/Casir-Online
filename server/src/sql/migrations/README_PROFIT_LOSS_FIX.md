# Profit Loss Materialized View Fix

**Date:** 2026-02-06  
**Issue:** Double-counting in expense calculations due to ROLLUP placement

---

## 🐛 **Problem Identified**

The original `mv_profit_loss_report` had **ROLLUP** applied in the `expense_details` CTE, which caused double-counting when aggregating expenses:

```sql
-- OLD (WRONG):
expense_details AS (
  ...
  GROUP BY ROLLUP(t.cabang_id), period_month, expense_category  -- ❌ Creates 'all' rows early
),
expense_summary AS (
  SELECT cabang_id, period_month, sum(total_expense) AS total_expenses
  FROM expense_details
  GROUP BY cabang_id, period_month  -- ❌ Sums both specific + 'all' rows
)
```

This resulted in **expenses being counted twice** for `cabang_id='all'` queries.

---

## ✅ **Solution**

1. **Remove ROLLUP from `expense_details`** - only group actual data
2. **Apply ROLLUP in `expense_summary`** - aggregate once at summary level
3. **Change pattern matching to ILIKE** - case-insensitive matching

```sql
-- NEW (CORRECT):
expense_details AS (
  SELECT t.cabang_id,  -- ✅ No ROLLUP, no COALESCE
    ...
    CASE
      WHEN t.keterangan ILIKE '%gaji%' THEN 'Gaji Karyawan'  -- ✅ Case-insensitive
      ...
    END AS expense_category,
    sum(...) AS total_expense
  FROM ...
  GROUP BY t.cabang_id, period_month, expense_category  -- ✅ No ROLLUP
),
expense_summary AS (
  SELECT COALESCE(cabang_id, 'all') AS cabang_id,
    period_month,
    sum(total_expense) AS total_expenses
  FROM expense_details
  GROUP BY ROLLUP(cabang_id), period_month  -- ✅ ROLLUP only here
)
```

---

## 🚀 **How to Apply**

### **Step 1: Backup (Optional but Recommended)**

```sql
-- Create backup of current data
CREATE TABLE mv_profit_loss_report_backup AS
SELECT * FROM mv_profit_loss_report;
```

### **Step 2: Run Migration**

**Option A: Via psql**
```bash
psql -U your_user -d your_database -f fix_profit_loss_view.sql
```

**Option B: Via Database Client**
Copy and paste `fix_profit_loss_view.sql` content into your database client and execute.

**Option C: Via Node.js Script**
```bash
cd server/src/sql/migrations
node -e "
const { exec } = require('child_process');
const connStr = process.env.DATABASE_URL;
exec('psql ' + connStr + ' -f fix_profit_loss_view.sql', (err, stdout, stderr) => {
  console.log(stdout);
  if (err) console.error(stderr);
});
"
```

### **Step 3: Verify Fix**

Run verification script:
```bash
psql -U your_user -d your_database -f verify_profit_loss_fix.sql
```

**Check critical test results:**
- ✅ Test 2 should return **0 rows** (no double-counting)
- ✅ Test 5 should return **0** (no NULL periods)
- ✅ Test 7 should return **0 rows** (no invalid margins)
- ✅ Summary test should show `'PASSED: No double-counting'`

---

## 📊 **Expected Impact**

### **Before Fix:**
```
cabang_id='all' for Jan 2026:
  total_operating_expenses: 10,000,000  (WRONG - counted twice)
```

### **After Fix:**
```
cabang_id='all' for Jan 2026:
  total_operating_expenses: 5,000,000   (CORRECT - counted once)
```

**Net Profit will increase** because expenses are no longer double-counted.

---

## ⚠️ **Important Notes**

1. **Dependent Views:** If you have other views/reports that depend on `mv_profit_loss_report`, they will be dropped with CASCADE and need to be recreated.

2. **View Refresh:** Remember to schedule regular refreshes:
   ```sql
   -- Manual refresh:
   REFRESH MATERIALIZED VIEW CONCURRENTLY mv_profit_loss_report;
   
   -- Or set up cron job / scheduled task
   ```

3. **API Cache:** Clear Redis cache for profit loss endpoints after migration:
   ```bash
   redis-cli KEYS "financial:profit-loss*" | xargs redis-cli DEL
   ```

4. **Frontend:** No changes needed in frontend code - API response structure remains the same.

---

## 🔄 **Rollback Plan**

If issues occur, restore from backup:

```sql
-- Drop fixed view
DROP MATERIALIZED VIEW mv_profit_loss_report CASCADE;

-- Restore from backup
CREATE MATERIALIZED VIEW mv_profit_loss_report AS
SELECT * FROM mv_profit_loss_report_backup;

-- Recreate indexes
CREATE INDEX idx_mv_profit_loss_cabang_id ON mv_profit_loss_report(cabang_id);
CREATE INDEX idx_mv_profit_loss_period ON mv_profit_loss_report(period_month);
CREATE UNIQUE INDEX idx_mv_profit_loss_unique ON mv_profit_loss_report(cabang_id, period_month);
```

---

## 📝 **Checklist**

- [ ] Backup current data (optional)
- [ ] Run `fix_profit_loss_view.sql`
- [ ] Run `verify_profit_loss_fix.sql`
- [ ] Check all tests pass
- [ ] Clear Redis cache for profit-loss endpoints
- [ ] Test profit loss report in UI
- [ ] Monitor for any errors in logs
- [ ] Document completion date

---

## 📧 **Questions?**

If you encounter issues:
1. Check database logs for errors
2. Verify user has permissions to DROP/CREATE materialized views
3. Ensure no active queries are using the view during migration
4. Check that all referenced tables exist (`transaksi`, `transaksi_detail`, `produk`)
