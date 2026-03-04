# Testing Roadmap - Easy Tasks First

## Overview
This document outlines the testing tasks ordered from **easiest to most complex**. Each task builds on the previous ones and uses the established testing infrastructure.

---

## ✅ COMPLETED

### Phase 0: Test Infrastructure Setup
- [x] Test database setup with Testcontainers
- [x] Test factories for common models
- [x] Auth integration tests (login, logout)
- [x] Schema reference guide

---

## 📋 TESTING TASK LIST (Ordered by Complexity)

### **PHASE 1: Simple CRUD (No Relations, Minimal Permissions)**
*Estimated time: 2-3 hours*

| # | Task | Models | Complexity | Status |
|---|------|--------|------------|--------|
| 1 | **Kategori Tests** | Kategori | ⭐ Easy | ✅ Done |
| 2 | **Supplier Tests** | Supplier | ⭐ Easy | ✅ Done |
| 3 | **Cabang Tests** | Cabang | ⭐ Easy | ✅ Done |

---

### **PHASE 2: CRUD with One-to-Many Relations**
*Estimated time: 3-4 hours*

| # | Task | Models | Complexity | Status |
|---|------|--------|------------|--------|
| 4 | **ProdukMaster Tests** | ProdukMaster, Kategori | ⭐⭐ Medium | ✅ Done |
| 5 | **Pelanggan Tests** | Pelanggan, Cabang | ⭐⭐ Medium | ✅ Done |
| 6 | **Shift Tests** | Shift, User, Cabang | ⭐⭐ Medium | ✅ Done |

---

### **PHASE 3: CRUD with Many-to-Many Relations**
*Estimated time: 4-5 hours*

| # | Task | Models | Complexity | Status |
|---|------|--------|------------|--------|
| 7 | **Produk Tests** | Produk, ProdukMaster, Cabang, Kategori | ⭐⭐⭐ Hard | ✅ Done |
| 8 | **User Management Tests** | User, Role, Cabang, UserRole | ⭐⭐⭐ Hard | ✅ Done |
| 9 | **Role Management Tests** | Role, Permission, RolePermission | ⭐⭐⭐ Hard | ✅ Done |

---

### **PHASE 4: Business Logic & Transactions**
*Estimated time: 5-6 hours*

| # | Task | Models | Complexity | Status |
|---|------|--------|------------|--------|
| 10 | **Transaksi Tests** | Transaksi, TransaksiDetail, Pembayaran, Produk | ⭐⭐⭐⭐ Hard | ✅ Done |
| 11 | **Checkout Tests** | Cart, Transaksi, Pembayaran (Public) | ⭐⭐⭐⭐ Hard | ✅ Done |
| 12 | **Delivery Tests** | Transaksi, DeliveryTracking, Driver | ⭐⭐⭐ Hard | ✅ Done |

---

### **PHASE 5: Advanced Features**
*Estimated time: 6-8 hours*

| # | Task | Features | Complexity | Status |
|---|------|----------|------------|--------|
| 13 | **Catalog Tests** | Product listing, search, filter, pagination | ⭐⭐⭐⭐ Hard | 📝 Todo |
| 14 | **Promo & Discount Tests** | Promo calculation, validation | ⭐⭐⭐⭐ Hard | 📝 Todo |
| 15 | **Report Tests** | Aggregation, grouping, complex queries | ⭐⭐⭐⭐⭐ Expert | 📝 Todo |
| 16 | **Absensi Tests** | Face recognition, location verification | ⭐⭐⭐⭐⭐ Expert | 📝 Todo |

---

## 📊 Progress Tracking

- [x] Phase 1: Simple CRUD (3/3) ✅
- [x] Phase 2: One-to-Many (3/3) ✅
- [x] Phase 3: Many-to-Many (3/3) ✅
- [x] Phase 4: Business Logic (3/3) ✅
- [ ] Phase 5: Advanced (0/4)

**Total Progress:** 12/16 tasks completed (75%)

---

## 📁 Test Files Summary

| Test File | Tests | Coverage |
|-----------|-------|----------|
| `auth.test.js` | ~12 | Login, logout, session |
| `kategori.test.js` | ~29 | CRUD + validation + auth |
| `supplier.test.js` | ~17 | CRUD + validation + auth |
| `cabang.test.js` | ~27 | CRUD + access middleware + auth |
| `produkMaster.test.js` | ~30 | CRUD + validation + auth |
| `pelanggan.test.js` | ~28 | CRUD + validation + auth |
| `shift.test.js` | ~53 | Open/close/adjust + auth |
| `produk.test.js` | ~18 | CRUD + stock + validation + auth |
| `user.test.js` | ~20 | CRUD + status + password + auth |
| `role.test.js` | ~17 | CRUD + clone + auth |
| `transaksi.test.js` | ~15 | Create + list + cancel + auth |
| `checkout.test.js` | ~16 | PICKUP/DELIVERY + business rules |
| `delivery.test.js` | ~12 | Orders + assign + tracking + auth |

**Total: ~294 tests**

---

## 🛠️ Testing Guidelines

### For Each Test File:

1. **Use Factories:**
   ```javascript
   import { createKategori, createCabang } from '../factories/userFactory';
   import { createUserWithModulePermissions } from '../helpers/permissionSetup';
   ```

2. **Test Pattern:**
   - `beforeEach` → Clean database with `clearTestDb()`
   - Positive test cases (valid data ✅)
   - Negative test cases (invalid data, validation ❌)
   - Auth/permission checks (401, 403)

3. **Authentication:**
   ```javascript
   const result = await createUserWithModulePermissions('module', {}, prisma);
   await agent.post('/api/auth/login').send({
     username: result.user.username,
     password: result.plainPassword,
   });
   ```
