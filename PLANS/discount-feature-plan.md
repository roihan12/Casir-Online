# Plan: Fitur Diskon Tambahan

## Overview
Mengembangkan fitur diskon tambahan di lain promo yang sudah ada, termasuk diskon otomatis, diskon grosir/bulk, dan diskon pelanggan spesifik.

## Current State
- ✅ Fitur Promo/Diskon dengan kode promo sudah ada
- ✅ Frontend promo management sudah ada
- ✅ Backend API untuk promo sudah ada
- ❌ Diskon otomatis tanpa kode (berdasarkan jumlah pembelian)
- ❌ Diskon grosir/bulk pricing
- ❌ Diskon pelanggan spesifik (tier-based)
- ❌ Flash sale / diskon waktu terbatas
- ❌ Diskon kombinasi (member + flash sale)

---

## Database Schema Changes

### 1. Model Baru: `DiskonOtomatis`

Diskon yang otomatis diterapkan tanpa perlu kode promo.

```prisma
model DiskonOtomatis {
  id                  String              @id @default(uuid()) @map("diskon_otomatis_id")
  namaDiskon          String              @map("nama_diskon") @db.VarChar(100)
  deskripsi           String?             @db.Text
  tipeDiskon          TipeDiskonOtomatis  @map("tipe_diskon")

  // Untuk tipe BULK_QTY
  minQty              Int?                @map("min_qty")
  diskonPersen       Decimal?            @map("diskon_persen") @db.Decimal(5,2)

  // Untuk tipe SPESIAL_DATE
  tanggalSpesial      Date?               @map("tanggal_spesial") @db.Date
  persenDiskon        Decimal?            @map("persen_diskon") @db.Decimal(5,2)

  // Untuk tipe MEMBER_TIER
  tierPelanggan       String?             @map("tier_pelanggan") @db.VarChar(50)

  // Untuk tipe FLASH_SALE
  waktuMulai          DateTime?           @map("waktu_mulai")
  waktuBerakhir       DateTime?           @map("waktu_berakhir")

  // Scope
  cabangId            String?             @map("cabang_id")
  kategoriId          String?             @map("kategori_id")
  produkId            String?             @map("produk_id")

  status              StatusDiskon        @default(AKTIF)
  deletedAt           DateTime?           @map("deleted_at")
  createdAt           DateTime            @default(now()) @map("created_at")
  updatedAt           DateTime            @updatedAt @map("updated_at")
  created_by          String?             @map("created_by") @db.VarChar(36)
  created_by_user_Id  String?             @map("created_by_user_id") @db.VarChar(36)
  updated_by          String?             @map("updated_by") @db.VarChar(36)
  updated_by_user_Id  String?             @map("updated_by_user_id") @db.VarChar(36)

  cabang              Cabang?             @relation(fields: [cabangId], references: [id])
  createdByUserId     User?               @relation("DiskonOtomatisCreatedBy", fields: [created_by_user_Id], references: [id])
  kategori            Kategori?           @relation(fields: [kategoriId], references: [id])
  produkMaster        ProdukMaster?       @relation(fields: [produkId], references: [id])
  updatedByUserId     User?               @relation("DiskonOtomatisUpdatedBy", fields: [updated_by_user_Id], references: [id])
  diskonProduk        DiskonProdukOtomatis[]

  @@map("diskon_otomatis")
}

enum TipeDiskonOtomatis {
  BULK_QTY          // Diskon berdasarkan jumlah pembelian (beli 10+ diskon 10%)
  SPESIAL_DATE      // Diskon tanggal spesial (hari raya, dll)
  MEMBER_TIER       // Diskon berdasarkan tier pelanggan (gold, silver, bronze)
  FLASH_SALE        // Diskon flash sale waktu terbatas
}

enum StatusDiskon {
  AKTIF
  TIDAK_AKTIF
  KADALUARSA
}
```

### 2. Model Baru: `DiskonProdukOtomatis`

Produk yang eligible untuk diskon otomatis (untuk scope kompleks).

```prisma
model DiskonProdukOtomatis {
  id                  String              @id @default(uuid()) @map("diskon_produk_otomatis_id")
  diskonOtomatisId    String              @map("diskon_otomatis_id")
  produkId            String              @map("produk_id")
  createdAt           DateTime            @default(now()) @map("created_at")

  diskonOtomatis      DiskonOtomatis      @relation(fields: [diskonOtomatisId], references: [id], onDelete: Cascade)
  produkMaster        ProdukMaster        @relation(fields: [produkId], references: [id])

  @@map("diskon_produk_otomatis")
}
```

### 3. Model Baru: `DiskonGrosir`

Harga grosir berdasarkan jumlah pembelian (tiered pricing).

```prisma
model DiskonGrosir {
  id                  String              @id @default(uuid()) @map("diskon_grosir_id")
  namaDiskon          String              @map("nama_diskon") @db.VarChar(100)
  deskripsi           String?             @db.Text

  // Tier Configuration
  minQty1             Int                 @map("min_qty_1")
  diskonPersen1       Decimal             @map("diskon_persen_1") @db.Decimal(5,2)

  minQty2             Int?                @map("min_qty_2")
  diskonPersen2       Decimal?            @map("diskon_persen_2") @db.Decimal(5,2)

  minQty3             Int?                @map("min_qty_3")
  diskonPersen3       Decimal?            @map("diskon_persen_3") @db.Decimal(5,2)

  // Scope
  cabangId            String?             @map("cabang_id")
  kategoriId          String?             @map("kategori_id")
  produkId            String?             @map("produk_id")

  status              StatusDiskon        @default(AKTIF)
  tanggalMulai        Date?               @map("tanggal_mulai") @db.Date
  tanggalBerakhir     Date?               @map("tanggal_berakhir") @db.Date

  deletedAt           DateTime?           @map("deleted_at")
  createdAt           DateTime            @default(now()) @map("created_at")
  updatedAt           DateTime            @updatedAt @map("updated_at")
  created_by          String?             @map("created_by") @db.VarChar(36)
  created_by_user_Id  String?             @map("created_by_user_id") @db.VarChar(36)
  updated_by          String?             @map("updated_by") @db.VarChar(36)
  updated_by_user_Id  String?             @map("updated_by_user_id") @db.VarChar(36)

  cabang              Cabang?             @relation(fields: [cabangId], references: [id])
  createdByUserId     User?               @relation("DiskonGrosirCreatedBy", fields: [created_by_user_Id], references: [id])
  kategori            Kategori?           @relation(fields: [kategoriId], references: [id])
  produkMaster        ProdukMaster?       @relation(fields: [produkId], references: [id])
  updatedByUserId     User?               @relation("DiskonGrosirUpdatedBy", fields: [updated_by_user_Id], references: [id])

  @@map("diskon_grosir")
}
```

### 4. Update Model `Pelanggan`

Tambahkan field untuk tier pelanggan:

```prisma
model Pelanggan {
  // ... existing fields ...
  tierPelanggan        String?             @map("tier_pelanggan") @db.VarChar(50) // BRONZE, SILVER, GOLD, PLATINUM
  poinLoyalty          Int                 @default(0) @map("poin_loyalty")
  // ... existing fields ...
}
```

---

## API Endpoints

### Diskon Otomatis

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/api/diskon-otomatis` | `diskon:read` | Get all automatic discounts |
| GET | `/api/diskon-otomatis/:id` | `diskon:read` | Get automatic discount by ID |
| POST | `/api/diskon-otomatis` | `diskon:create` | Create automatic discount |
| PUT | `/api/diskon-otomatis/:id` | `diskon:update` | Update automatic discount |
| DELETE | `/api/diskon-otomatis/:id` | `diskon:delete` | Delete automatic discount |
| POST | `/api/diskon-otomatis/calculate` | `transaksi:create` | Calculate automatic discounts for cart |
| GET | `/api/diskon-otomatis/applicable/:cabangId` | `transaksi:create` | Get applicable automatic discounts |

### Diskon Grosir

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/api/diskon-grosir` | `diskon:read` | Get all bulk discounts |
| GET | `/api/diskon-grosir/:id` | `diskon:read` | Get bulk discount by ID |
| POST | `/api/diskon-grosir` | `diskon:create` | Create bulk discount |
| PUT | `/api/diskon-grosir/:id` | `diskon:update` | Update bulk discount |
| DELETE | `/api/diskon-grosir/:id` | `diskon:delete` | Delete bulk discount |
| POST | `/api/diskon-grosir/check-price` | `transaksi:create` | Check bulk pricing for products |

---

## Files to Create

### Backend

1. **`server/src/validation/diskonOtomatisValidation.js`**
   - `createDiskonOtomatisSchema`
   - `updateDiskonOtomatisSchema`
   - `calculateDiskonOtomatisSchema`

2. **`server/src/services/diskonOtomatisService.js`**
   - `createDiskonOtomatis()`
   - `updateDiskonOtomatis()`
   - `deleteDiskonOtomatis()`
   - `getAllDiskonOtomatis()`
   - `getDiskonOtomatisById()`
   - `getApplicableDiskonOtomatis()` - Get applicable auto discounts
   - `calculateDiskonOtomatis()` - Calculate auto discount for cart

3. **`server/src/controllers/diskonOtomatisController.js`**
   - Request handlers for all endpoints

4. **`server/src/routes/diskonOtomatisRoutes.js`**
   - Route definitions with middleware

5. **`server/src/validation/diskonGrosirValidation.js`**
   - `createDiskonGrosirSchema`
   - `updateDiskonGrosirSchema`

6. **`server/src/services/diskonGrosirService.js`**
   - CRUD for diskon grosir
   - `checkBulkPrice()` - Check bulk pricing for products
   - `calculateBulkDiscount()` - Calculate bulk discount

7. **`server/src/controllers/diskonGrosirController.js`**
   - Request handlers

8. **`server/src/routes/diskonGrosirRoutes.js`**
   - Route definitions

### Frontend

1. **`client-backup/src/services/diskonOtomatisService.js`**
   - API service functions

2. **`client-backup/src/services/diskonGrosirService.js`**
   - API service functions

3. **`client-backup/src/features/diskon-otomatis/pages/DiskonOtomatisManagementPage.jsx`**
   - List and manage automatic discounts

4. **`client-backup/src/features/diskon-otomatis/components/DiskonOtomatisForm.jsx`**
   - Create/edit automatic discount form

5. **`client-backup/src/features/diskon-grosir/pages/DiskonGrosirManagementPage.jsx`**
   - List and manage bulk discounts

6. **`client-backup/src/features/diskon-grosir/components/DiskonGrosirForm.jsx`**
   - Create/edit bulk discount form with tier configuration

---

## Implementation Priority

### Phase 1: Diskon Otomatis Basic (Week 1)
1. Database migration untuk `diskon_otomatis`
2. CRUD API untuk diskon otomatis
3. Frontend management untuk diskon otomatis
4. Integration dengan POS untuk auto-apply diskon

### Phase 2: Diskon Grosir (Week 2)
1. Database migration untuk `diskon_grosir`
2. CRUD API untuk diskon grosir
3. Frontend management untuk diskon grosir
4. Integration dengan POS untuk tiered pricing

### Phase 3: Diskon Spesial & Flash Sale (Week 3)
1. Implementasi flash sale dengan timer
2. Implementasi diskon tanggal spesial
3. Notifikasi flash sale ke pelanggan
4. Banner flash sale di frontend

### Phase 4: Member Tier Discount (Week 4)
1. Update pelanggan model dengan tier
2. API untuk manajemen tier pelanggan
3. Diskon otomatis berdasarkan tier
4. Frontend untuk manajemen tier

---

## Key Features

### 1. Diskon Otomatis Berdasarkan Jumlah (Bulk Quantity)
- Beli 10+ produk: diskon 5%
- Beli 50+ produk: diskon 10%
- Beli 100+ produk: diskon 15%

### 2. Diskon Flash Sale
- Waktu terbatas (misal: 12.00 - 14.00)
- Diskon persentase tinggi (misal: 50%)
- Auto-apply di POS
- Countdown timer di frontend

### 3. Diskon Member Tier
- Bronze: 0% discount
- Silver: 5% discount
- Gold: 10% discount
- Platinum: 15% discount

### 4. Diskon Tanggal Spesial
- Hari Raya (Idul Fitri, Natal, dll)
- Ulang Tahun Toko
- Event Khusus

---

## Validation Rules

### Diskon Otomatis
- `namaDiskon`: Required, max 100 chars
- `tipeDiskon`: Required, enum value
- `minQty`: Required for BULK_QTY
- `diskonPersen`: Required, 0-100
- `waktuMulai`: Required for FLASH_SALE
- `waktuBerakhir`: Required for FLASH_SALE, harus > waktuMulai
- `cabangId`: Optional, nullable
- `kategoriId`: Optional, nullable
- `produkId`: Optional, nullable

### Diskon Grosir
- `namaDiskon`: Required, max 100 chars
- `minQty1`: Required, min 1
- `diskonPersen1`: Required, 0-100
- `minQty2`: Optional, must > minQty1 if provided
- `diskonPersen2`: Optional, must > diskonPersen1 if provided
- `minQty3`: Optional, must > minQty2 if provided
- `diskonPersen3`: Optional, must > diskonPersen2 if provided

---

## Business Logic Examples

### Apply Automatic Discount in Transaction

```javascript
// Service: applyAutomaticDiscounts
async function applyAutomaticDiscounts(cart, cabangId, pelangganId) {
  const applicableDiscounts = [];

  // 1. Get all active auto discounts
  const diskonOtomatis = await getApplicableDiskonOtomatis(cabangId);

  // 2. Check BULK_QTY discounts
  diskonOtomatis
    .filter(d => d.tipe_diskon === 'BULK_QTY')
    .forEach(diskon => {
      cart.items.forEach(item => {
        if (item.quantity >= diskon.min_qty) {
          applicableDiscounts.push({
            type: 'BULK_QTY',
            diskon: diskon,
            amount: calculateDiscount(item, diskon)
          });
        }
      });
    });

  // 3. Check FLASH_SALE discounts
  const now = new Date();
  diskonOtomatis
    .filter(d => d.tipe_diskon === 'FLASH_SALE')
    .filter(d => now >= d.waktu_mulai && now <= d.waktu_berakhir)
    .forEach(diskon => {
      applicableDiscounts.push({
        type: 'FLASH_SALE',
        diskon: diskon,
        amount: calculateFlashSaleDiscount(cart, diskon)
      });
    });

  // 4. Check MEMBER_TIER discounts
  if (pelangganId) {
    const pelanggan = await getPelanggan(pelangganId);
    const memberDiscount = diskonOtomatis
      .filter(d => d.tipe_diskon === 'MEMBER_TIER')
      .find(d => d.tier_pelanggan === pelanggan.tier_pelanggan);

    if (memberDiscount) {
      applicableDiscounts.push({
        type: 'MEMBER_TIER',
        diskon: memberDiscount,
        amount: cart.subtotal * (memberDiscount.persen_diskon / 100)
      });
    }
  }

  // 5. Apply best discount (or all non-conflicting discounts)
  return applyBestDiscount(applicableDiscounts);
}
```

### Check Bulk Pricing

```javascript
// Service: checkBulkPrice
async function checkBulkPrice(produkId, quantity, cabangId) {
  const diskonGrosir = await prisma.$queryRaw`
    SELECT * FROM diskon_grosir
    WHERE status = 'AKTIF'
    AND deleted_at IS NULL
    AND (tanggal_mulai IS NULL OR tanggal_mulai <= CURRENT_DATE)
    AND (tanggal_berakhir IS NULL OR tanggal_berakhir >= CURRENT_DATE)
    AND (
      (produk_id = ${produkId}::VARCHAR)
      OR (kategori_id IN (SELECT kategori_id FROM produk_master WHERE produk_master_id = ${produkId}::VARCHAR))
      OR (cabang_id IS NULL OR cabang_id = ${cabangId}::VARCHAR)
    )
    ORDER BY
      CASE
        WHEN ${quantity}::INT >= min_qty_3 THEN 3
        WHEN ${quantity}::INT >= min_qty_2 THEN 2
        WHEN ${quantity}::INT >= min_qty_1 THEN 1
        ELSE 0
      END DESC
    LIMIT 1
  `;

  if (diskonGrosir.length === 0) return null;

  const diskon = diskonGrosir[0];
  let discountPercent = 0;

  if (quantity >= diskon.min_qty_3 && diskon.diskon_persen_3) {
    discountPercent = parseFloat(diskon.diskon_persen_3);
  } else if (quantity >= diskon.min_qty_2 && diskon.diskon_persen_2) {
    discountPercent = parseFloat(diskon.diskon_persen_2);
  } else if (quantity >= diskon.min_qty_1) {
    discountPercent = parseFloat(diskon.diskon_persen_1);
  }

  return {
    diskonId: diskon.diskon_grosir_id,
    namaDiskon: diskon.nama_diskon,
    tier: getTier(quantity, diskon),
    discountPercent,
    originalPrice,
    discountedPrice: originalPrice * (1 - discountPercent / 100)
  };
}
```

---

## UI/UX Considerations

### Diskon Otomatis Management
- Table view dengan sorting dan filtering
- Status badge (Aktif/Tidak Aktif/Kadaluarsa)
- Quick action buttons (Edit, Delete, Toggle Status)
- Preview tab untuk melihat dampak diskon

### Diskon Grosir Form
- Visual tier configuration (1, 2, 3 tiers)
- Real-time price preview
- Product/category selector
- Branch selector

### Flash Sale Banner
- Countdown timer
- Progress bar (stok terjual/total stok)
- "Claim" button untuk pelanggan

---

## Testing Checklist

- [ ] Create diskon otomatis (all types)
- [ ] Update diskon otomatis
- [ ] Delete diskon otomatis (soft delete)
- [ ] Apply BULK_QTY discount di POS
- [ ] Apply FLASH_SALE discount di POS
- [ ] Apply MEMBER_TIER discount di POS
- [ ] Create diskon grosir with tiered pricing
- [ ] Check bulk price untuk produk
- [ ] Apply bulk discount di POS
- [ ] Test diskon kombinasi (multiple discounts)
- [ ] Test expired discounts (tidak apply)
- [ ] Test permission checks

---

## Migration SQL

```sql
-- Create table diskon_otomatis
CREATE TABLE diskon_otomatis (
  diskon_otomatis_id VARCHAR(36) PRIMARY KEY,
  nama_diskon VARCHAR(100) NOT NULL,
  deskripsi TEXT,
  tipe_diskon VARCHAR(50) NOT NULL,
  min_qty INTEGER,
  diskon_persen NUMERIC(5,2),
  tanggal_spesial DATE,
  persen_diskon NUMERIC(5,2),
  tier_pelanggan VARCHAR(50),
  waktu_mulai TIMESTAMP,
  waktu_berakhir TIMESTAMP,
  cabang_id VARCHAR(36),
  kategori_id VARCHAR(36),
  produk_id VARCHAR(36),
  status VARCHAR(50) DEFAULT 'AKTIF',
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP,
  created_by VARCHAR(36),
  created_by_user_id VARCHAR(36),
  updated_by VARCHAR(36),
  updated_by_user_id VARCHAR(36),
  CONSTRAINT fk_diskon_otomatis_cabang FOREIGN KEY (cabang_id) REFERENCES cabang(cabang_id),
  CONSTRAINT fk_diskon_otomatis_kategori FOREIGN KEY (kategori_id) REFERENCES kategori(kategori_id),
  CONSTRAINT fk_diskon_otomatis_produk FOREIGN KEY (produk_id) REFERENCES produk_master(produk_master_id)
);

-- Create table diskon_grosir
CREATE TABLE diskon_grosir (
  diskon_grosir_id VARCHAR(36) PRIMARY KEY,
  nama_diskon VARCHAR(100) NOT NULL,
  deskripsi TEXT,
  min_qty_1 INTEGER NOT NULL,
  diskon_persen_1 NUMERIC(5,2) NOT NULL,
  min_qty_2 INTEGER,
  diskon_persen_2 NUMERIC(5,2),
  min_qty_3 INTEGER,
  diskon_persen_3 NUMERIC(5,2),
  cabang_id VARCHAR(36),
  kategori_id VARCHAR(36),
  produk_id VARCHAR(36),
  status VARCHAR(50) DEFAULT 'AKTIF',
  tanggal_mulai DATE,
  tanggal_berakhir DATE,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP,
  created_by VARCHAR(36),
  created_by_user_id VARCHAR(36),
  updated_by VARCHAR(36),
  updated_by_user_id VARCHAR(36),
  CONSTRAINT fk_diskon_grosir_cabang FOREIGN KEY (cabang_id) REFERENCES cabang(cabang_id),
  CONSTRAINT fk_diskon_grosir_kategori FOREIGN KEY (kategori_id) REFERENCES kategori(kategori_id),
  CONSTRAINT fk_diskon_grosir_produk FOREIGN KEY (produk_id) REFERENCES produk_master(produk_master_id)
);

-- Add tier_pelanggan to pelanggan table
ALTER TABLE pelanggan ADD COLUMN tier_pelanggan VARCHAR(50);
ALTER TABLE pelanggan ADD COLUMN poin_loyalty INTEGER DEFAULT 0;
```

---

## Next Steps

1. Review dan approve plan ini
2. Buat database migration
3. Implementasi backend API (Phase 1)
4. Implementasi frontend (Phase 1)
5. Testing integration
6. Lanjut ke Phase 2
