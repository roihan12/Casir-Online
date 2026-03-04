# Phase 5 — Advanced Integration Tests: Transaksi, Promo, Checkout, Midtrans

## Goal

Enhance and create comprehensive integration tests for the most complex business modules, with edge cases and Midtrans simulation. Also fix failing checkout tests from Phase 4.

## Key Findings from Research

1. **Checkout failures**: `checkoutService.createOnlineOrder()` uses `basePrisma.$transaction` with [withCheckoutRls()](file:///c:/Users/Roihan%20Sori/OneDrive/Documents/Project%20Team/Casir-Online/server/src/services/checkoutService.js#10-22) — the test environment's Prisma client may differ from `basePrisma`. Need to ensure the test DB URL is picked up by `basePrisma`.
2. **Midtrans signature**: `SHA512(order_id + status_code + gross_amount + ServerKey)` — fully simulatable in tests by setting `MIDTRANS_SERVER_KEY` env var.
3. **Promo types**: 6 discount types (PERSENTASE, NOMINAL, BUY_X_GET_Y, HARGA_SPESIAL, CASHBACK, VOUCHER), scope types, usage limits.

---

## Proposed Changes

### 1. Fix Checkout Tests (Bug Fix)

#### [MODIFY] [checkout.test.js](file:///c:/Users/Roihan%20Sori/OneDrive/Documents/Project%20Team/Casir-Online/server/__tests__/integration/checkout.test.js)

- The checkout service imports `basePrisma` from [db.js](file:///c:/Users/Roihan%20Sori/OneDrive/Documents/Project%20Team/Casir-Online/server/src/config/db.js) for RLS operations
- `basePrisma` uses `DATABASE_URL` which the test setup already sets to the Testcontainers URL
- Root cause: [db.js](file:///c:/Users/Roihan%20Sori/OneDrive/Documents/Project%20Team/Casir-Online/server/src/config/db.js) likely caches `basePrisma` at module load before test setup sets `DATABASE_URL`
- **Fix**: Import app **after** test DB setup in `beforeAll`, and ensure [db.js](file:///c:/Users/Roihan%20Sori/OneDrive/Documents/Project%20Team/Casir-Online/server/src/config/db.js) re-reads `DATABASE_URL`
- Add `cabangId` query param to [getOrderStatus](file:///c:/Users/Roihan%20Sori/OneDrive/Documents/Project%20Team/Casir-Online/server/src/services/checkoutService.js#448-588) calls (required by service)
- Test all 3 payment methods: COD, PAY_AT_STORE, PAYMENT_LINK

---

### 2. Enhanced Transaksi Tests

#### [MODIFY] [transaksi.test.js](file:///c:/Users/Roihan%20Sori/OneDrive/Documents/Project%20Team/Casir-Online/server/__tests__/integration/transaksi.test.js)

Add edge cases:
- **Positive**: Create PEMBELIAN, RETUR_PENJUALAN, RETUR_PEMBELIAN types
- **Positive**: Multiple payment methods (TUNAI, TRANSFER, QRIS, E_WALLET)
- **Positive**: Transaction with discount (manual_discount_persen, manual_discount_nominal)
- **Positive**: Transaction list filtering (by date range, status, jenis_transaksi)
- **Negative**: Insufficient stock scenario
- **Negative**: Invalid produk_id in details
- **Edge**: Transaction with 0 biaya_tambahan
- **Edge**: Multiple items in single transaction

---

### 3. Transaksi with Promo Tests (NEW)

#### [NEW] [transaksiPromo.test.js](file:///c:/Users/Roihan%20Sori/OneDrive/Documents/Project%20Team/Casir-Online/server/__tests__/integration/transaksiPromo.test.js)

Tests for `POST /api/transaksi/create-with-promo`:
- **Positive**: Create transaction with valid promo code
- **Positive**: Create transaction with multiple promo codes  
- **Positive**: Preview discounts before creating transaction (`POST /api/transaksi/preview-discount`)
- **Negative**: Invalid promo code
- **Negative**: Expired promo code
- **Negative**: Promo with minimum purchase not met
- **Edge**: Promo with usage limit reached

---

### 4. Promo CRUD Tests (NEW)

#### [NEW] [promo.test.js](file:///c:/Users/Roihan%20Sori/OneDrive/Documents/Project%20Team/Casir-Online/server/__tests__/integration/promo.test.js)

Full CRUD for promo management + verification:
- **Positive**: Create promo (PERSENTASE, NOMINAL, BUY_X_GET_Y types)
- **Positive**: Update promo, change status, get stats
- **Positive**: Verify promo code, verify multiple codes
- **Positive**: Get eligible promos for cabang
- **Negative**: Duplicate kodePromo, invalid tipeDiskon, missing required fields
- **Auth**: Permission checks (promo:create, promo:read, etc.)

---

### 5. Midtrans Webhook Simulation Tests (NEW)

#### [NEW] [midtransWebhook.test.js](file:///c:/Users/Roihan%20Sori/OneDrive/Documents/Project%20Team/Casir-Online/server/__tests__/integration/midtransWebhook.test.js)

Simulate Midtrans webhook callbacks:
- **Setup**: Set `MIDTRANS_SERVER_KEY` in test env, compute SHA512 signature
- **Positive**: Valid signature with settlement status → payment success, stock decremented
- **Positive**: Valid signature with capture status → payment success
- **Positive**: Idempotency — sending same webhook twice returns OK
- **Negative**: Invalid/missing signature → 401
- **Negative**: Missing required fields (order_id, status_code, gross_amount) → 400
- **Negative**: Non-existent order_id → 200 (ok, per Midtrans best practice)
- **Edge**: Payment for already-cancelled order → no state change

> [!IMPORTANT]
> The Midtrans webhook should ALWAYS return 200 to prevent retry loops, even on errors. Tests verify this behavior.

---

## Verification Plan

### Automated Tests
```bash
# Run only the new/modified test files
npx vitest run __tests__/integration/transaksi.test.js
npx vitest run __tests__/integration/checkout.test.js
npx vitest run __tests__/integration/transaksiPromo.test.js
npx vitest run __tests__/integration/promo.test.js
npx vitest run __tests__/integration/midtransWebhook.test.js
```

### Expected Results
- All checkout tests pass (after RLS fix)
- Transaksi edge cases validate business rules
- Promo discount calculations are correct
- Midtrans webhook signature validation works
- Idempotent webhook handling verified
