# Fitur Promo & Diskon POS - Ringkasan Implementasi

## Status: ✅ SELESAI (Refactored)

---

## Arsitektur Flow

### 1. Frontend (PromoSection.jsx)
```
User Input Promo Code
       ↓
Call Preview API POST /api/transaksi/preview-promo
       ↓
Backend: apply_multiple_promos() function
       ↓
Return: applicable_promos, total_discount, errors
       ↓
Tampilkan hasil di UI (applied promos / errors)
```

### 2. Saat Transaksi (posService.js)
```
User klik "Bayar"
       ↓
Check: promo_codes.length > 0?
       ↓ YES
Use: POST /api/transaksi/create-with-promo
       ↓
Backend: create_transaksi_with_promo() function
       ↓
Return: transaksi with promos_applied, promo_errors
```

---

## API Endpoints

| Endpoint | Method | Deskripsi |
|----------|--------|-----------|
| `/api/transaksi/preview-promo` | POST | Preview/validasi promo tanpa buat transaksi |
| `/api/transaksi/create-with-promo` | POST | Buat transaksi dengan promo codes |

---

## File yang Dibuat/Dimodifikasi

### Backend

| File | Status | Deskripsi |
|------|--------|----------|
| `server/src/sql/apply_multiple_promos.sql` | ✅ Baru | Validasi & hitung diskon multiple promos |
| `server/src/services/transaksiService.js` | ✅ Update | Tambah `createTransaksiWithPromo()` |
| `server/src/controllers/transaksiController.js` | ✅ Update | Tambah controller `createTransaksiWithPromo()` |
| `server/src/routes/transaksiRoutes.js` | ✅ Update | Tambah route `POST /create-with-promo` |
| `server/src/routes/promoPreviewRoutes.js` | ✅ Baru | Route untuk preview promo |
| `server/src/app.js` | ✅ Update | Register preview promo route |

### Frontend

| File | Status | Deskripsi |
|------|--------|----------|
| `client-backup/src/services/posService.js` | ✅ Update | Otomatis gunakan `/create-with-promo` jika ada promo_codes |
| `client-backup/src/features/pos/components/cart/PromoSection.jsx` | ✅ Baru | Komponen UI untuk input & display promo |
| `client-backup/src/features/pos/components/cart/CartSection.jsx` | ✅ Update | Integrasikan PromoSection & tampilkan diskon |
| `client-backup/src/features/pos/pages/POSPage.jsx` | ✅ Update | State management untuk promo & pass ke CartSection |

---

## Flow Penggunaan (User Journey)

### 1. Di POS Page
```
1. User tambah produk ke cart
2. Cart menampilkan subtotal
3. User input promo code di PromoSection
4. Klik "Apply"
```

### 2. Validasi Promo
```
Frontend: POST /api/transaksi/preview-promo
{
  "promo_codes": ["PROMO123"],
  "cabang_id": "cabang-001",
  "pelanggan_id": "pelanggan-001",
  "subtotal": 100000,
  "metode_pembayaran": "TUNAI"
}

Backend: apply_multiple_promos()
- Check: Promo exists & active
- Check: Date range (tanggal_mulai - tanggal_berakhir)
- Check: Usage limits (total & per user)
- Check: Min pembelian
- Check: Branch scope
- Check: Product/Kategori scope
- Check: Payment method rules
- Check: Day/Time restrictions
- Hitung diskon

Response:
{
  "applicable_promos": [{
    "promo_id": "...",
    "kode_promo": "PROMO123",
    "nama_promo": "Diskon 50%",
    "tipe_diskon": "PERSENTASE",
    "discount": 50000
  }],
  "total_discount": 50000,
  "errors": []
}
```

### 3. Display di UI
```
✅ PROMO123 Applied
   Diskon 50% - Rp 50.000

Subtotal:     Rp 100.000
Diskon Promo:  -Rp 50.000  ← Otomatis muncul
Pajak:        Rp 10.000
Total:        Rp 60.000
```

### 4. Klik Bayar
```
Frontend: POST /api/transaksi/create-with-promo
{
  "promo_codes": ["PROMO123"],
  ...other transaction data
}

Backend: create_transaksi_with_promo()
1. Validate promos again
2. Create transaksi
3. Create transaksi_promo records
4. Update promo_diskon.current_usage
5. Create voucher_usage (jika ada pelanggan)
6. Return transaksi with promos_applied

Response:
{
  "transaksi_id": "...",
  "total": 60000,
  "promos_applied": [...],
  "promo_errors": [...]  // jika ada promo yang gagal
}
```

---

## Cara Test

### 1. Deploy Database Function
```bash
psql -U postgres -d casir_online
\i server/src/sql/apply_multiple_promos.sql
```

### 2. Restart Server Backend
```bash
cd server
npm run dev
```

### 3. Test Promo Preview
```bash
# Request
curl -X POST http://localhost:3000/api/transaksi/preview-promo \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "promo_codes": ["TESTPROMO"],
    "cabang_id": "cabang-001",
    "pelanggan_id": null,
    "subtotal": 100000,
    "metode_pembayaran": "TUNAI"
  }'
```

### 4. Buat Data Promo (Test)
```sql
INSERT INTO promo_diskon (
  promo_id, nama_promo, kode_promo, tipe_diskon, nilai_diskon,
  min_pembelian, tanggal_mulai, tanggal_berakhir, status, cabang_id
) VALUES (
  gen_random_uuid(),
  'Diskon Test',
  'TESTPROMO',
  'PERSENTASE',
  50,
  50000,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days',
  'aktif',
  'cabang-001'
);
```

---

## Promo Rules yang Didukung

| Rule | Tipe | Deskripsi |
|------|------|-----------|
| MIN_QTY | Quantity | Minimum jumlah item |
| MIN_NOMINAL | Nominal | Minimum pembelian |
| HARI_TERTENTU | Array hari | Promo hanya hari tertentu |
| JAM_TERTENTU | Array jam | Promo hanya jam tertentu |
| PELANGGAN_SEGMEN | Array segmen | Promo hanya segmen pelanggan tertentu |
| METODE_PEMBAYARAN | Array method | Promo hanya metode pembayaran tertentu |
| FIRST_TIME_BUYER | Boolean | Promo hanya pembeli pertama |

---

## Tipe Diskon yang Didukung

| Tipe | Deskripsi |
|------|-----------|
| PERSENTASE | Diskon persentase dari subtotal/item |
| NOMINAL | Diskon nominal tetap |
| BUY_X_GET_Y | Beli X dapat Y (bundling) |
| HARGA_SPESIAL | Harga khusus |
| CASHBACK | Cashback |
| VOUCHER | Voucher code |

---

## Error Handling

### Frontend
- Duplicate promo code → "Promo already applied"
- Invalid promo → Show error message
- API error → "Failed to validate promo"

### Backend
- Promo not found → "Kode promo tidak ditemukan atau tidak aktif"
- Expired → "Promo sudah berakhir"
- Usage limit → "Batas penggunaan promo sudah tercapai"
- Min purchase → "Minimum pembelian belum tercapai"

---

## Keputusan Implementasi

**Flow yang dipilih:** Opsi A - Validasi Preview

**Alasan:**
1. ✅ UX lebih baik - user tahu error sebelum bayar
2. ✅ Konsisten dengan e-commerce standard
3. ✅ Real-time feedback
4. ✅ Tidak mengorbankan flow transaksi yang sudah ada

---

## Next Steps untuk Testing

1. ✅ Deploy database function `apply_multiple_promos`
2. ✅ Backend API sudah siap
3. ✅ Frontend sudah terintegrasi
4. ⏳ Test dengan data promo asli
5. ⏳ Test flow multi-promo (lebih dari 1 promo)
