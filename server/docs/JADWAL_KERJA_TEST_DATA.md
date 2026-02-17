# Jadwal Kerja (Work Schedule) Test Data & Examples

This document contains test data and examples for creating work schedules via API.

## Prerequisites

1. **Master shifts must be created first:**
   ```bash
   node scripts/seedMasterShift.js
   ```

2. **You need valid data:**
   - `userId` - User ID from your database
   - `cabangId` - Branch ID from your database
   - `shiftId` - Master shift ID (from previous step)

---

## API Endpoints Reference

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/jadwal` | List jadwal (filter: userId, cabangId, tanggal) |
| `POST` | `/api/jadwal` | Buat jadwal 1 hari |
| `POST` | `/api/jadwal/generate` | Generate jadwal bulk (range tanggal) |
| `GET` | `/api/jadwal/:id` | Detail satu jadwal |
| `PUT` | `/api/jadwal/:id` | Update jadwal |
| `DELETE` | `/api/jadwal/:id` | Hapus jadwal |

---

## Scenario 1: Create Single Day Schedule (Shift)

### Request:
```bash
curl -b cookies.txt -X POST "http://localhost:3000/api/jadwal" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid-here",
    "cabangId": "cabang-uuid-here",
    "tanggal": "2025-02-17",
    "tipeJadwal": "shift",
    "shiftId": "shift-1-uuid-here"
  }'
```

### Expected Response:
```json
{
  "success": true,
  "message": "Schedule created successfully",
  "data": {
    "id": "jadwal-uuid",
    "userId": "user-uuid",
    "cabangId": "cabang-uuid",
    "tanggalMulai": "2025-02-17T00:00:00.000Z",
    "tanggalSelesai": "2025-02-17T00:00:00.000Z",
    "jamMasuk": "06:00",
    "jamKeluar": "14:00",
    "tipe_jadwal": "shift",
    "shift_id": "shift-1-uuid",
    "master_shift": {
      "id": "shift-1-uuid",
      "namaShift": "Shift 1 - Pagi"
    }
  }
}
```

---

## Scenario 2: Create Single Day Schedule (Reguler)

### Request:
```bash
curl -b cookies.txt -X POST "http://localhost:3000/api/jadwal" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid-here",
    "cabangId": "cabang-uuid-here",
    "tanggal": "2025-02-17",
    "tipeJadwal": "reguler",
    "jamMasukOverride": "08:30",
    "jamKeluarOverride": "17:30",
    "keterangan": "Jam fleksibel hari ini"
  }'
```

### Expected Response:
```json
{
  "success": true,
  "message": "Schedule created successfully",
  "data": {
    "id": "jadwal-uuid",
    "jamMasuk": "08:30",
    "jamKeluar": "17:30",
    "tipe_jadwal": "reguler",
    "keterangan": "Jam fleksibel hari ini"
  }
}
```

---

## Scenario 3: Create Single Day Schedule (Libur)

### Request:
```bash
curl -b cookies.txt -X POST "http://localhost:3000/api/jadwal" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid-here",
    "cabangId": "cabang-uuid-here",
    "tanggal": "2025-02-17",
    "tipeJadwal": "libur",
    "keterangan": "Hari libur nasional"
  }'
```

---

## Scenario 4: Create Single Day Schedule (WFH)

### Request:
```bash
curl -b cookies.txt -X POST "http://localhost:3000/api/jadwal" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid-here",
    "cabangId": "cabang-uuid-here",
    "tanggal": "2025-02-17",
    "tipeJadwal": "wfh",
    "keterangan": "Work from home"
  }'
```

---

## Scenario 5: Bulk Generate Schedules (Monthly)

### Generate for Multiple Users:
```bash
curl -b cookies.txt -X POST "http://localhost:3000/api/jadwal/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": [
      "user-uuid-1",
      "user-uuid-2",
      "user-uuid-3"
    ],
    "cabangId": "cabang-uuid-here",
    "shiftId": "shift-1-uuid-here",
    "tanggalMulai": "2025-02-01",
    "tanggalSelesai": "2025-02-28",
    "hariKerja": ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"],
    "tipeJadwal": "shift",
    "skipExisting": true
  }'
```

### Expected Response:
```json
{
  "success": true,
  "message": "Schedules generated successfully",
  "data": {
    "totalGenerated": 60,
    "skipped": 5,
    "usersProcessed": 3,
    "dateRange": {
      "start": "2025-02-01",
      "end": "2025-02-28"
    }
  }
}
```

### Explanation:
- Generates schedules for 3 users
- Date range: Feb 1 - Feb 28, 2025
- Only on weekdays (Senin-Jumat)
- Shift 1 (06:00 - 14:00)
- Skips existing schedules (doesn't overwrite)
- Total: 3 users × ~20 working days = ~60 schedules

---

## Scenario 6: Bulk Generate with Different Shifts

### Generate Shift 3 (Malam/Overnight):
```bash
curl -b cookies.txt -X POST "http://localhost:3000/api/jadwal/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": ["user-uuid-security-1", "user-uuid-security-2"],
    "cabangId": "cabang-uuid-here",
    "shiftId": "shift-3-uuid-here",
    "tanggalMulai": "2025-02-01",
    "tanggalSelesai": "2025-02-28",
    "hariKerja": ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"],
    "tipeJadwal": "shift",
    "skipExisting": true
  }'
```

---

## Scenario 7: Get Schedules (with Filters)

### Get all schedules for a user:
```bash
curl -b cookies.txt "http://localhost:3000/api/jadwal?userId=user-uuid-here"
```

### Get schedules for date range:
```bash
curl -b cookies.txt "http://localhost:3000/api/jadwal?tanggalMulai=2025-02-01&tanggalSelesai=2025-02-28"
```

### Get schedules for a branch:
```bash
curl -b cookies.txt "http://localhost:3000/api/jadwal?cabangId=cabang-uuid-here"
```

### Get schedules by type:
```bash
curl -b cookies.txt "http://localhost:3000/api/jadwal?tipeJadwal=shift"
```

### Paginated results:
```bash
curl -b cookies.txt "http://localhost:3000/api/jadwal?page=1&limit=50"
```

---

## Scenario 8: Get Single Schedule

### Request:
```bash
curl -b cookies.txt "http://localhost:3000/api/jadwal/jadwal-uuid-here"
```

### Expected Response:
```json
{
  "success": true,
  "message": "Schedule retrieved successfully",
  "data": {
    "id": "jadwal-uuid",
    "userId": "user-uuid",
    "cabangId": "cabang-uuid",
    "tanggalMulai": "2025-02-17T00:00:00.000Z",
    "jamMasuk": "06:00",
    "jamKeluar": "14:00",
    "hariKerja": ["Senin"],
    "tipe_jadwal": "shift",
    "keterangan": null,
    "createdAt": "2025-02-15T10:00:00.000Z",
    "user": {
      "id": "user-uuid",
      "namaLengkap": "Budi Santoso",
      "email": "budi@example.com"
    },
    "cabang": {
      "id": "cabang-uuid",
      "namaCabang": "Cabang Jakarta Pusat"
    },
    "master_shift": {
      "id": "shift-uuid",
      "namaShift": "Shift 1 - Pagi",
      "toleransiTerlambat": 15,
      "isOvernight": false
    }
  }
}
```

---

## Scenario 9: Update Existing Schedule

### Change from Shift 1 to Shift 2:
```bash
curl -b cookies.txt -X PUT "http://localhost:3000/api/jadwal/jadwal-uuid-here" \
  -H "Content-Type: application/json" \
  -d '{
    "tipeJadwal": "shift",
    "shiftId": "shift-2-uuid-here"
  }'
```

### Change to regular hours with custom time:
```bash
curl -b cookies.txt -X PUT "http://localhost:3000/api/jadwal/jadwal-uuid-here" \
  -H "Content-Type: application/json" \
  -d '{
    "tipeJadwal": "reguler",
    "jamMasukOverride": "09:00",
    "jamKeluarOverride": "18:00",
    "keterangan": "Overtime hari ini"
  }'
```

### Add keterangan:
```bash
curl -b cookies.txt -X PUT "http://localhost:3000/api/jadwal/jadwal-uuid-here" \
  -H "Content-Type: application/json" \
  -d '{
    "keterangan": "Diganti ke shift sore karena ada event"
  }'
```

---

## Scenario 10: Delete Schedule

### Request:
```bash
curl -b cookies.txt -X DELETE "http://localhost:3000/api/jadwal/jadwal-uuid-here"
```

### Expected Response:
```json
{
  "success": true,
  "message": "Schedule deleted successfully",
  "data": {
    "success": true,
    "message": "Schedule deleted successfully"
  }
}
```

---

## Complete Test Data Set

### Step 1: Get Your UUIDs

First, get the IDs you need:

```bash
# Get cabang ID
curl -b cookies.txt "http://localhost:3000/api/cabang"

# Get users
curl -b cookies.txt "http://localhost:3000/api/users"

# Get master shifts
curl -b cookies.txt "http://localhost:3000/api/master-shifts"
```

### Step 2: Create Test Schedules

#### Schedule Set 1: Regular Office Staff (5 people, weekday mornings)
```bash
curl -b cookies.txt -X POST "http://localhost:3000/api/jadwal/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": [
      "replace-with-user-uuid-1",
      "replace-with-user-uuid-2",
      "replace-with-user-uuid-3",
      "replace-with-user-uuid-4",
      "replace-with-user-uuid-5"
    ],
    "cabangId": "replace-with-cabang-uuid",
    "shiftId": "replace-with-reguler-shift-uuid",
    "tanggalMulai": "2025-02-01",
    "tanggalSelesai": "2025-02-28",
    "hariKerja": ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"],
    "tipeJadwal": "shift",
    "skipExisting": true
  }'
```

#### Schedule Set 2: Operations Team - Shift 1 (3 people, all week)
```bash
curl -b cookies.txt -X POST "http://localhost:3000/api/jadwal/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": [
      "replace-with-user-uuid-6",
      "replace-with-user-uuid-7",
      "replace-with-user-uuid-8"
    ],
    "cabangId": "replace-with-cabang-uuid",
    "shiftId": "replace-with-shift-1-uuid",
    "tanggalMulai": "2025-02-01",
    "tanggalSelesai": "2025-02-28",
    "hariKerja": ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"],
    "tipeJadwal": "shift",
    "skipExisting": true
  }'
```

#### Schedule Set 3: Security Team - Shift 3 Overnight (2 people, all week)
```bash
curl -b cookies.txt -X POST "http://localhost:3000/api/jadwal/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": [
      "replace-with-user-uuid-9",
      "replace-with-user-uuid-10"
    ],
    "cabangId": "replace-with-cabang-uuid",
    "shiftId": "replace-with-shift-3-uuid",
    "tanggalMulai": "2025-02-01",
    "tanggalSelesai": "2025-02-28",
    "hariKerja": ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"],
    "tipeJadwal": "shift",
    "skipExisting": true
  }'
```

---

## Common Validation Rules

### Tipe Jadwal: `shift`
- ✅ `shiftId` required
- ✅ `jamMasukOverride`, `jamKeluarOverride` ignored (from master shift)

### Tipe Jadwal: `reguler`
- ✅ `jamMasukOverride` required
- ✅ `jamKeluarOverride` required
- ✅ `shiftId` ignored

### Tipe Jadwal: `libur` or `wfh`
- ✅ No time fields needed
- ✅ `keterangan` recommended

### General Rules:
- ✅ Max 1 schedule per user per day (unique constraint)
- ✅ `tanggal` format: `YYYY-MM-DD`
- ✅ Time format: `HH:MM` (24-hour)
- ✅ Max date range: 1 year (366 days)

---

## Error Scenarios

### Error: Duplicate Schedule
```json
{
  "error": "Schedule already exists for this user on 2025-02-17"
}
```
**Solution:** Use `skipExisting: true` in bulk generation, or delete existing schedule first.

### Error: Shift Not Found
```json
{
  "error": "Shift not found or inactive"
}
```
**Solution:** Verify `shiftId` exists and is active: `GET /api/master-shifts`

### Error: User Not Found
```json
{
  "error": "User not found"
}
```
**Solution:** Verify `userId` exists in database

### Error: Date Range Too Large
```json
{
  "error": "Date range cannot exceed 1 year"
}
```
**Solution:** Use smaller date ranges (max 366 days)

---

## Quick Reference: Hari Kerja Values

| Nilai | English |
|-------|---------|
| `"Senin"` | Monday |
| `"Selasa"` | Tuesday |
| `"Rabu"` | Wednesday |
| `"Kamis"` | Thursday |
| `"Jumat"` | Friday |
| `"Sabtu"` | Saturday |
| `"Minggu"` | Sunday |

---

## Testing Checklist

- [ ] Create single day schedule (shift type)
- [ ] Create single day schedule (reguler type)
- [ ] Create single day schedule (libur)
- [ ] Bulk generate for 1 month (multiple users)
- [ ] Bulk generate with date range filter
- [ ] Try creating duplicate (should fail gracefully)
- [ ] Update existing schedule
- [ ] Get schedules with filters
- [ ] Delete schedule
- [ ] Verify schedules affect attendance (clock-in/out)

---

## Post-Test Verification

### Check created schedules:
```bash
# Count schedules for a user
curl -b cookies.txt "http://localhost:3000/api/jadwal?userId=user-uuid"

# Count all schedules in a month
curl -b cookies.txt "http://localhost:3000/api/jadwal?tanggalMulai=2025-02-01&tanggalSelesai=2025-02-28" | jq '.pagination.total'

# Get schedules by shift type
curl -b cookies.txt "http://localhost:3000/api/jadwal?shiftId=shift-1-uuid"
```

### Verify in attendance flow:
When users clock in/out with active schedules:
1. Clock in should use shift's `toleransiTerlambat`
2. Clock out should calculate overtime based on shift hours
3. Status should reflect schedule-based logic

---

## Notes

- **Schedule Priority:** Schedules are the source of truth for attendance calculations
- **Override Values:** When `tipeJadwal = "reguler"`, custom times override master shift
- **Soft Delete:** Deleted schedules are permanently removed (no soft delete)
- **Performance:** Bulk generation is optimized for 50 users × 30 days in < 5 seconds

---

## Cleanup Test Data

### Delete all schedules for a date range:
```sql
-- Direct database cleanup (use with caution)
DELETE FROM jadwal_kerja
WHERE tanggal_mulai >= '2025-02-01'
  AND tanggal_mulai <= '2025-02-28';
```

### Or delete via API (one by one):
```bash
# Get all schedules first
curl -b cookies.txt "http://localhost:3000/api/jadwal?tanggalMulai=2025-02-01&tanggalSelesai=2025-02-28&limit=100" | jq '.data[].id'

# Then delete each ID
curl -b cookies.txt -X DELETE "http://localhost:3000/api/jadwal/jadwal-uuid-here"
```
