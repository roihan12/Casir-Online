# Struk Pembayaran Berbeda Berdasarkan Metode - Ringkasan Implementasi

## Status: ✅ SELESAI

---

## Arsitektur yang Diimplementasikan

### Pattern: Factory Pattern + HOC (Higher-Order Component)

```
ReceiptFactory
    ↓
determineReceiptTemplate(data)
    ↓
┌───────────────┬───────────────┬───────────────┐
│ CashReceipt   │ CreditReceipt │ QrisReceipt   │
│               │               │               │
│ (TUNAI)       │ (KREDIT)      │ (QRIS)        │
└───────────────┴───────────────┴───────────────┘
        ↓               ↓               ↓
   withPromo()    withPromo()    withPromo()
        ↓               ↓               ↓
   CashReceipt    CreditReceipt   QrisReceipt
   with Promo     with Promo      with Promo
```

---

## Komponen yang Dibuat

### Backend (Server)

**File:** `server/src/services/receiptService.js`

#### Perubahan:
1. **Updated `getTransactionDataForReceipt()`**
   - Added `transaksi_promo` with promo details
   - Added `cicilanKredit` with credit/installment info
   - Added `qris` info in payment data
   - Added `templateType` determination

2. **New Function: `determineReceiptTemplate()`**
   ```javascript
   determineReceiptTemplate(paymentMethod, hasPromo, isCredit)
   ```
   Returns template type based on:
   - Payment method (TUNAI, KREDIT, QRIS, TRANSFER)
   - Has promo or not
   - Is credit transaction or not

#### Template Types:
| Template Type | Kondisi |
|--------------|----------|
| `cash` | TUNAI, no promo |
| `cash_with_promo` | TUNAI, with promo |
| `credit` | KREDIT, no promo |
| `credit_with_promo` | KREDIT, with promo |
| `qris` | QRIS, no promo |
| `qris_with_promo` | QRIS, with promo |
| `transfer` | TRANSFER, no promo |
| `transfer_with_promo` | TRANSFER, with promo |

---

### Frontend (Client)

#### Struktur Direktori:
```
client-backup/src/features/pos/components/receipt/
├── templates/
│   ├── BaseReceipt.jsx          # Base component
│   ├── CashReceipt.jsx          # Cash receipt
│   ├── CreditReceipt.jsx        # Credit receipt
│   ├── QrisReceipt.jsx          # QRIS receipt
│   ├── PromoDecorator.jsx       # HOC for promo
│   ├── ReceiptFactory.jsx       # Factory selector
│   └── index.js                # Exports
└── ReceiptModal.jsx            # Updated modal
```

---

## Detail Komponen

### 1. BaseReceipt.jsx
**Purpose:** Base component dengan common sections

**Sections:**
- Header (logo, nama cabang, alamat)
- Transaction Info (TRX ID, waktu, kasir, pelanggan)
- Items List (nama produk, qty, harga)
- Summary (subtotal, pajak, total)
- Payment Section (customizable via props)
- Footer (terima kasih)

**Props:**
- `data` - Transaction data
- `renderPaymentSection()` - Custom payment section
- `renderExtraSection()` - Custom extra section (discounts)
- `children` - Additional content

### 2. CashReceipt.jsx
**Purpose:** Struk untuk pembayaran TUNAI

**Features:**
- Display manual discount (if any)
- Display promo discount (if any)
- Payment method: TUNAI
- Show "DIBAYAR" (amount paid)
- Show "KEMBALI" (change)

### 3. CreditReceipt.jsx
**Purpose:** Struk untuk pembayaran KREDIT/TEMPO

**Features:**
- Display manual & promo discounts
- Payment method: KREDIT/TEMPO
- Show "Info Pembayaran Kredit" section:
  - Uang Muka (DP)
  - Tenor (jumlah cicilan)
  - Cicilan per bulan
  - Jatuh tempo
  - Sisa pembayaran
  - Status (AKTIF/LUNAS)
- Show jadwal pembayaran (if available)

### 4. QrisReceipt.jsx
**Purpose:** Struk untuk pembayaran QRIS

**Features:**
- Display manual & promo discounts
- Payment method: QRIS
- Show REF ID
- Show payment status (PENDING/SUKSES/LUNAS)
- Display QR code image
- Show expiry time (if pending)
- QRIS instructions (1-2-3 steps)

### 5. PromoDecorator.jsx (HOC)
**Purpose:** Add promo section to any receipt type

**Usage:**
```javascript
const CashReceiptWithPromo = withPromo(CashReceipt);
```

**What it does:**
- Wraps receipt component
- Adds green header showing "Promo Berlaku"
- Lists all applied promos with:
  - Kode promo
  - Nama promo
  - Diskon amount
- Shows total discount

### 6. ReceiptFactory.jsx
**Purpose:** Select appropriate template based on transaction data

**Function:**
```javascript
determineReceiptTemplate(data) // Returns template type string
getReceiptComponent(templateType) // Returns React component
ReceiptFactory({ data }) // Renders appropriate component
```

---

## Cara Menggunakan

### 1. Backend - Get Receipt Data

```javascript
const receiptData = await receiptService.getTransactionDataForReceipt(transaksiId);
```

**Response structure:**
```javascript
{
  id: "trx-001",
  number: "TRX-2026-0001",
  date: "2026-01-31T10:30:00Z",
  paymentMethod: "TUNAI", // or "KREDIT", "QRIS", "TRANSFER"
  status: "LUNAS",
  subtotal: 50000,
  discount: 0,
  tax: 4050,
  total: 44550,
  items: [...],
  payments: [...],
  customerInfo: {...},
  branchName: "Jakarta Pusat",
  branchAddress: "Jl. Sudirman No. 1",
  cashierName: "John Doe",
  receiptConfig: {...},
  // NEW FIELDS
  promo: {
    hasPromo: true,
    promosApplied: [
      {
        promoId: "promo-001",
        kodePromo: "MINUMAN15",
        namaPromo: "Diskon Minuman 15%",
        tipeDiskon: "PERSENTASE",
        diskonAmount: 4500
      }
    ],
    totalDiskonPromo: 4500
  },
  credit: {
    isCredit: false,
    // OR if credit:
    tenor: 3,
    uangMuka: 10000,
    sisaPembayaran: 30500,
    cicilanPerBulan: 13500,
    tanggalJatuhTempo: "2026-02-28",
    status: "AKTIF"
  },
  templateType: "cash_with_promo" // Auto-determined
}
```

### 2. Frontend - Render Receipt

```javascript
import { ReceiptFactory } from "./templates";

// In your component
<ReceiptFactory data={receiptData} />
```

Or use specific component:
```javascript
import { CashReceipt, CreditReceipt, QrisReceipt } from "./templates";
import { withPromo } from "./templates";

const CashReceiptWithPromo = withPromo(CashReceipt);

<CashReceiptWithPromo data={receiptData} />
```

---

## Contoh Tampilan Struk

### 1. Struk TUNAI dengan Promo
```
╔══════════════════════════════════════╗
║        CASIR ONLINE                  ║
║        Jakarta Pusat                 ║
╠══════════════════════════════════════╣
║ TRX ID:     TRX-0001AB               ║
║ WAKTU:      31/01/26 10:30          ║
║ KASIR:      JOHN                     ║
║ PELANGGAN:  BUDI SANTOSO            ║
╠══════════════════════════════════════╣
║ KOPI SUSU              2x  30.000    ║
║ ROTI BAKAR             1x  20.000    ║
╠══════════════════════════════════════╣
║ ✓ Promo Berlaku              -4.500 ║
║   MINUMAN15 - Diskon Minuman 15%    ║
╠══════════════════════════════════════╣
║ SUBTOTAL:                 50.000    ║
║ DISKON PROMO:             -4.500    ║
║ PAJAK (10%):               4.550    ║
║ TOTAL:                    50.050    ║
╠══════════════════════════════════════╣
║ METODE:                   TUNAI     ║
║ DIBAYAR:                  60.000    ║
║ KEMBALI:                  9.950     ║
╠══════════════════════════════════════╣
║      Terima Kasih                   ║
║   Powered by CASIR Online           ║
╚══════════════════════════════════════╝
```

### 2. Struk KREDIT
```
╔══════════════════════════════════════╗
║        CASIR ONLINE                  ║
╠══════════════════════════════════════╣
║ ... (items & summary section) ...    ║
╠══════════════════════════════════════╣
║ ☺ Info Pembayaran Kredit            ║
║ METODE:                   KREDIT    ║
║ UANG MUKA:                10.000    ║
║ TENOR:                    3x Cicilan║
║ CICILAN/BULAN:            13.500    ║
║ JATUH TEMPO:              28/02/26  ║
║ SISA PEMBAYARAN:          30.500    ║
║ STATUS:                   AKTIF     ║
╠══════════════════════════════════════╣
║ Jadwal Pembayaran:                 ║
║ 15/02/26                  13.500    ║
║ 15/03/26                  13.500    ║
║ 15/04/26                  13.500    ║
╠══════════════════════════════════════╣
║      Terima Kasih                   ║
╚══════════════════════════════════════╝
```

### 3. Struk QRIS
```
╔══════════════════════════════════════╗
║        CASIR ONLINE                  ║
╠══════════════════════════════════════╣
║ ... (items & summary section) ...    ║
╠══════════════════════════════════════╣
║ METODE:                   QRIS      ║
║ REF ID:                  QR-1234AB  ║
║            [PENDING]                  ║
║                                      ║
║       ┌─────────────────┐            ║
║       │   [QR CODE]     │            ║
║       │                 │            ║
║       └─────────────────┘            ║
║   Scan QR code untuk pembayaran      ║
║                                      ║
║   ⏰ Berlaku hingga: 31/01/26 10:45  ║
╠══════════════════════════════════════╣
║ 1. Buka aplikasi e-wallet            ║
║ 2. Pilih menu "Scan QRIS"           ║
║ 3. Scan kode QR di atas             ║
║ 4. Konfirmasi pembayaran            ║
╠══════════════════════════════════════╣
║      Terima Kasih                   ║
╚══════════════════════════════════════╝
```

---

## Keuntungan Implementasi

### 1. **Separation of Concerns**
- Setiap tipe pembayaran memiliki komponen terpisah
- Mudah mengubah template tanpa affect lain
- Base component mengurangi duplikasi kode

### 2. **Extensibility**
- Mudah menambah tipe pembayaran baru
- Tinggal buat komponen baru, daftarkan di factory
- Promo decorator reusable untuk semua tipe

### 3. **Maintainability**
- Factory pattern memudahkan selection logic
- HOC pattern untuk cross-cutting concerns (promo)
- Single source of truth untuk template selection

### 4. **User Experience**
- Struk sesuai dengan metode pembayaran
- Informasi yang relevan ditampilkan
- Tidak ada informasi yang tidak perlu

---

## Testing

### Test Scenarios:

1. **TUNAI tanpa promo** → `CashReceipt`
2. **TUNAI dengan promo** → `CashReceipt` + `PromoDecorator`
3. **KREDIT tanpa promo** → `CreditReceipt`
4. **KREDIT dengan promo** → `CreditReceipt` + `PromoDecorator`
5. **QRIS tanpa promo** → `QrisReceipt`
6. **QRIS dengan promo** → `QrisReceipt` + `PromoDecorator`

### Data Format untuk Testing:

```javascript
// Cash with promo
const data = {
  transaction: {
    transaksi_id: "trx-001",
    tanggal: new Date(),
    metode_pembayaran: "TUNAI",
    subtotal: 50000,
    total: 45500,
  },
  items: [{ name: "Kopi", quantity: 2, price: 15000 }],
  branch: { namaCabang: "Jakarta", alamat: "Jl. Sudirman" },
  cashierName: "John Doe",
  payment: { metode_pembayaran: "TUNAI", jumlah_bayar: 60000, jumlah_kembali: 14500 },
  promo: {
    hasPromo: true,
    promosApplied: [{ kodePromo: "DISKON10", namaPromo: "Diskon 10%", diskonAmount: 5000 }],
    totalDiskonPromo: 5000
  }
};
```

---

## Next Steps (Optional Enhancements)

1. **Thermal Printer Support**
   - CSS `@media print` untuk 58mm / 80mm
   - Optimasi font sizes untuk thermal

2. **PDF Generation**
   - Server-side PDF with puppeteer
   - Client-side PDF with jsPDF

3. **Email Receipt**
   - Send receipt as email attachment
   - HTML email with inline styles

4. **Custom Templates per Branch**
   - Branch can customize header/footer
   - Add logo, messages, etc.

5. **Multi-language Support**
   - Indonesian (default)
   - English option

---

## Troubleshooting

### Issue: Template tidak berubah
**Solution:** Cek data structure yang diterima. Pastikan field-field berikut ada:
- `transaction.metode_pembayaran`
- `payment.metode_pembayaran` (fallback)
- `promo.hasPromo`
- `credit.isCredit`

### Issue: Promo tidak muncul
**Solution:** Pastikan `promo.promosApplied` array ada isinya. Bukan hanya `hasPromo: true`.

### Issue: QR Code tidak muncul
**Solution:** Cek `payment.qris.qrCode` atau `payment.bukti_bayar_url`. Pastikan URL valid atau base64 data.

---

## Dependencies

**Backend:**
- prisma (already installed)
- qrcode (already installed)

**Frontend:**
- lucide-react (already installed)
- react (already installed)

---

## Summary Files Modified/Created

### Backend
- ✅ `server/src/services/receiptService.js` (Modified)

### Frontend
- ✅ `client-backup/src/features/pos/components/receipt/templates/BaseReceipt.jsx` (New)
- ✅ `client-backup/src/features/pos/components/receipt/templates/CashReceipt.jsx` (New)
- ✅ `client-backup/src/features/pos/components/receipt/templates/CreditReceipt.jsx` (New)
- ✅ `client-backup/src/features/pos/components/receipt/templates/QrisReceipt.jsx` (New)
- ✅ `client-backup/src/features/pos/components/receipt/templates/PromoDecorator.jsx` (New)
- ✅ `client-backup/src/features/pos/components/receipt/templates/ReceiptFactory.jsx` (New)
- ✅ `client-backup/src/features/pos/components/receipt/templates/index.js` (New)
- ✅ `client-backup/src/features/pos/components/receipt/ReceiptModal.jsx` (Modified)


const transaksi = await prisma.transaksi.findUnique({
    where: { transaksi_id: transaksiId },
    include: {
      transaksi_detail: {
        include: {
          produk: {
            include: {
              produkMaster: true,
            },
          },
        },
      },
      pembayaran: true,
      pelanggan: true,
      supplier: true,
      cabang: true,
      createdByUser: {
        select: {
          id: true,
          namaLengkap: true,
        },
      },
      shift: true,
      transaksi_promo: {
        include: {
          promo: true,
        },
      },
      cicilanKredit: true,
    },
  });