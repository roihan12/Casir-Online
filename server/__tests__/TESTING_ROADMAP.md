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

These are the simplest endpoints with basic CRUD operations and minimal dependencies.

| # | Task | Endpoints | Models | Complexity | Status |
|---|------|-----------|--------|------------|--------|
| 1 | **Kategori Tests** | GET /api/kategori<br>GET /api/kategori/:id<br>POST /api/kategori<br>PUT /api/kategori/:id<br>DELETE /api/kategori/:id | Kategori | ⭐ Easy | ✅ Done |
| 2 | **Supplier Tests** | GET /api/supplier<br>GET /api/supplier/:id<br>POST /api/supplier<br>PUT /api/supplier/:id<br>DELETE /api/supplier/:id | Supplier | ⭐ Easy | 📝 Todo |
| 3 | **Cabang Tests** | GET /api/cabang<br>GET /api/cabang/:id<br>POST /api/cabang<br>PUT /api/cabang/:id<br>DELETE /api/cabang/:id | Cabang | ⭐ Easy | 📝 Todo |

**Why these first?**
- Single model, no complex relations
- Simple CRUD operations
- Minimal business logic
- Already have factories created

---

### **PHASE 2: CRUD with One-to-Many Relations**
*Estimated time: 3-4 hours*

These endpoints involve parent-child relationships.

| # | Task | Endpoints | Models | Complexity | Status |
|---|------|-----------|--------|------------|--------|
| 4 | **ProdukMaster Tests** | GET /api/produk-master<br>GET /api/produk-master/:id<br>POST /api/produk-master<br>PUT /api/produk-master/:id<br>DELETE /api/produk-master/:id | ProdukMaster | ⭐⭐ Medium | 📝 Todo |
| 5 | **Pelanggan Tests** | GET /api/pelanggan<br>GET /api/pelanggan/:id<br>POST /api/pelanggan<br>PUT /api/pelanggan/:id<br>DELETE /api/pelanggan/:id | Pelanggan | ⭐⭐ Medium | 📝 Todo |
| 6 | **Shift Tests** | GET /api/shift<br>GET /api/shift/active<br>GET /api/shift/:id<br>POST /api/shift/open<br>POST /api/shift/close | Shift, User, Cabang | ⭐⭐ Medium | 📝 Todo |

**Why these second?**
- Have simple one-to-many relations (ProdukMaster → Produk, Pelanggan → Transaksi)
- Shift has relations to User and Cabang (already have factories)
- Slightly more business logic

---

### **PHASE 3: CRUD with Many-to-Many Relations**
*Estimated time: 4-5 hours*

These involve junction tables and more complex data setup.

| # | Task | Endpoints | Models | Complexity | Status |
|---|------|-----------|--------|------------|--------|
| 7 | **Produk Tests** | GET /api/produk<br>GET /api/produk/:id<br>POST /api/produk<br>PUT /api/produk/:id<br>DELETE /api/produk/:id | Produk, ProdukMaster, Cabang, Kategori | ⭐⭐⭐ Hard | 📝 Todo |
| 8 | **User Management Tests** | GET /api/user<br>GET /api/user/:id<br>POST /api/user<br>PUT /api/user/:id | User, Role, Cabang, UserRole | ⭐⭐⭐ Hard | 📝 Todo |
| 9 | **Role Management Tests** | GET /api/role<br>GET /api/role/:id<br>POST /api/role<br>PUT /api/role/:id | Role, Permission, RolePermission | ⭐⭐⭐ Hard | 📝 Todo |

**Why these third?**
- Complex many-to-many relations (UserRole, RolePermission)
- Produk has relations to ProdukMaster, Cabang, Kategori
- User has relations to Role, Cabang, Shift, etc.

---

### **PHASE 4: Business Logic & Transactions**
*Estimated time: 5-6 hours*

These involve business rules, calculations, and transaction flows.

| # | Task | Endpoints | Models | Complexity | Status |
|---|------|-----------|--------|------------|--------|
| 10 | **Transaksi Tests** | GET /api/transaksi<br>GET /api/transaksi/:id<br>POST /api/transaksi | Transaksi, TransaksiDetail, Pembayaran, Produk, Shift | ⭐⭐⭐⭐ Hard | 📝 Todo |
| 11 | **Checkout Tests** | POST /api/checkout | Cart, Transaksi, TransaksiDetail, Pembayaran | ⭐⭐⭐⭐ Hard | 📝 Todo |
| 12 | **Delivery Tests** | GET /api/delivery<br>PUT /api/delivery/:id | Transaksi, delivery_tracking, driver | ⭐⭐⭐ Hard | 📝 Todo |

**Why these fourth?**
- Complex business logic (calculations, inventory updates)
- Multiple related entities
- Transaction integrity important
- May need to mock external services

---

### **PHASE 5: Advanced Features**
*Estimated time: 6-8 hours*

Complex features with external integrations, file uploads, real-time updates.

| # | Task | Endpoints | Features | Complexity | Status |
|---|------|-----------|-----------|------------|--------|
| 13 | **Catalog Tests** | GET /api/catalog/* | Product listing, search, filter, pagination | ⭐⭐⭐⭐ Hard | 📝 Todo |
| 14 | **Promo & Discount Tests** | POST /api/promo<br>GET /api/promo/:id | Promo calculation, validation | ⭐⭐⭐⭐ Hard | 📝 Todo |
| 15 | **Report Tests** | GET /api/report/* | Aggregation, grouping, complex queries | ⭐⭐⭐⭐⭐ Expert | 📝 Todo |
| 16 | **Absensi Tests** | POST /api/absensi/clock-in<br>POST /api/absensi/clock-out | Face recognition, location verification | ⭐⭐⭐⭐⭐ Expert | 📝 Todo |

**Why these last?**
- May require mocking external services (face recognition, maps)
- Complex calculations and aggregations
- File uploads handling
- Real-time features

---

## 🎯 RECOMMENDED STARTING POINT

### Task 2: Supplier API Tests

**Why start here?**
1. Simplest CRUD operations (similar to Kategori)
2. Single model (Supplier)
3. Need to use or create `createSupplier()` factory
4. No complex relations
5. Clear input validation
6. Minimal business logic

**Test cases needed:**
```text
GET /api/supplier
  ✓ Should return empty array when no suppliers
  ✓ Should return list of suppliers
  ✓ Should handle pagination

GET /api/supplier/:id
  ✓ Should return supplier by ID
  ✓ Should return 404 for non-existent ID
  ✓ Should validate ID format

POST /api/supplier
  ✓ Should create supplier with valid data
  ✓ Should validate required fields
  ✓ Should validate field constraints

PUT /api/supplier/:id
  ✓ Should update supplier with valid data
  ✓ Should return 404 for non-existent ID

DELETE /api/supplier/:id
  ✓ Should delete supplier
  ✓ Should return 404 for non-existent ID
  ✓ Should handle supplier with related products
```

---

## 📊 Progress Tracking

- [ ] Phase 1: Simple CRUD (1/3)
- [ ] Phase 2: One-to-Many (0/3)
- [ ] Phase 3: Many-to-Many (0/3)
- [ ] Phase 4: Business Logic (0/3)
- [ ] Phase 5: Advanced (0/4)

**Total Progress:** 2/16 tasks completed (12.5%)

---

## 🛠️ Testing Guidelines

### For Each Test File:

1. **File Structure:**
   ```
   __tests__/
   ├── integration/
   │   ├── kategori.test.js      ← New
   │   ├── supplier.test.js       ← New
   │   ├── cabang.test.js         ← New
   │   └── ...
   ```

2. **Use Factories:**
   ```javascript
   import { createKategori } from '../factories/userFactory';
   ```

3. **Test Pattern:**
   - `beforeEach` - Clean database
   - Positive test cases (valid data)
   - Negative test cases (invalid data, duplicates)
   - Edge cases (missing fields, wrong types)
   - Permission checks (if applicable)

4. **Authentication:**
   ```javascript
   // For protected routes
   const { user, plainPassword } = await createUserWithRole();
   const loginRes = await agent
     .post('/api/auth/login')
     .send({ username: user.username, password: plainPassword });

   // Now agent has auth cookies
   ```

5. **Cleanup:**
   - Always clean up test data
   - Use `clearTestDb()` in beforeEach
   - Don't share data between tests

---

## ✅ Approval Required

Before I start implementing, please confirm:

1. **Start with Task 2 (Supplier Tests)?** ✅
2. **Use the same testing pattern as kategori.test.js?** ✅
3. **Create `createSupplier()` factory function if not already available?** ✅
4. **Include both positive and negative test cases?** ✅
5. **Add permission testing for supplier module?** ✅

---

**Next Step:** Once approved, I'll create `supplier.test.js` as Task 2.
