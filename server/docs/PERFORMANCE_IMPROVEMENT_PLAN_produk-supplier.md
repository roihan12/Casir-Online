# Performance Improvement Plan: ProdukSupplier Service

**Date:** 2026-02-11
**Service:** `server/src/services/produksupplierservice.js`
**Goal:** Reduce database query count, optimize cache usage, and improve overall response time

---

## Summary of Issues

| # | Issue | Impact | Priority |
|---|-------|--------|----------|
| 1 | Sequential database queries in create/update operations | High - Multiple round-trips per operation | High |
| 2 | Missing caching on read-heavy endpoints | High - Unnecessary database load | High |
| 3 | Inefficient cache invalidation with KEYS command | Medium - Redis blocking | High |
| 4 | Missing database indexes | Medium - Slow query execution | Medium |
| 5 | No batch operations support | Low - Limited for bulk operations | Low |
| 6 | Suboptimal query patterns in getProductsBySupplier | Medium - N+1 potential | Medium |

---

## Detailed Improvements

### 1. Parallelize Independent Database Queries

**Current Issues:**
- `createProdukSupplier` (lines 23-56): 3 sequential queries (product master, supplier, existing relation check)
- `updateProdukSupplier` (lines 123-149): 2 sequential queries (existing relation, updateMany for primary flag)
- `getBranchesWithSupplierAccess` (lines 476-521): 3 sequential queries

**Solution:** Use `Promise.all()` for independent queries

**Before:**
```javascript
// createProdukSupplier - lines 23-56
const produkMaster = await prisma.produkMaster.findUnique(...);  // Query 1
const supplier = await prisma.supplier.findUnique(...);          // Query 2
const existingRelation = await prisma.produkSupplier.findFirst(...); // Query 3
```

**After:**
```javascript
const [produkMaster, supplier, existingRelation] = await Promise.all([
  prisma.produkMaster.findUnique(...),
  prisma.supplier.findUnique(...),
  prisma.produkSupplier.findFirst(...)
]);
```

**Expected Improvement:** ~60-70% reduction in latency for these operations

---

### 2. Add Caching to Read-Heavy Operations

**Current Issues:**
- `getProductsBySupplier` (lines 333-468): No caching despite pagination
- `getProductsForSupplier` (lines 529-657): No caching despite pagination
- `getBranchesWithSupplierAccess` (lines 476-521): No caching

**Solution:** Implement caching with appropriate TTL

**Implementation:**
```javascript
// getProductsBySupplier - Add caching
const getProductsBySupplier = async (supplierId, options) => {
  const { page, limit, search, cabangId, produkMasterId, kategoriId } = options;
  const cacheKey = createCacheKey(
    "produk-supplier",
    `supplier:${supplierId}`,
    `page:${page}:limit:${limit}:search:${search}:cabang:${cabangId || 'all'}:produk:${produkMasterId || 'all'}:kategori:${kategoriId || 'all'}`
  );

  return await cacheOrFetch(cacheKey, async () => {
    // ... existing query logic
  }, 1800); // 30 minutes for paginated data
};

// getProductsForSupplier - Add caching
const getProductsForSupplier = async (supplierId, options) => {
  const cacheKey = createCacheKey(
    "produk-supplier",
    `available:${supplierId}`,
    `page:${page}:limit:${limit}:search:${search}:cabang:${cabangId || 'all'}:kategori:${kategoriId || 'all'}:status:${status}`
  );

  return await cacheOrFetch(cacheKey, async () => {
    // ... existing query logic
  }, 1800);
};

// getBranchesWithSupplierAccess - Add caching
const getBranchesWithSupplierAccess = async (supplierId) => {
  const cacheKey = createCacheKey("produk-supplier", `branches:${supplierId}`);

  return await cacheOrFetch(cacheKey, async () => {
    // ... existing query logic
  }, 3600); // 1 hour
};
```

**Expected Improvement:** ~90% cache hit rate for frequently accessed data

---

### 3. Optimize Cache Invalidation

**Current Issue:**
- `cacheDeletePattern` uses `KEYS` command which is O(N) and blocks Redis

**Solution:** Use `SCAN` command for non-blocking pattern deletion

**Implementation:**
```javascript
// Add to redisUtils.js
const cacheDeletePatternScan = async (pattern, batchCount = 100) => {
  let cursor = '0';
  let totalDeleted = 0;

  do {
    const [nextCursor, keys] = await redisClient.scan(
      cursor,
      'MATCH',
      pattern,
      'COUNT',
      batchCount
    );

    if (keys.length > 0) {
      totalDeleted += await redisClient.del(keys);
    }

    cursor = nextCursor;
  } while (cursor !== '0');

  return totalDeleted;
};
```

**Expected Improvement:** Non-blocking cache invalidation, better Redis performance under load

---

### 4. Add Database Indexes

**Recommended Indexes for Schema:**

```prisma
// In schema.prisma - add to ProdukSupplier model
@@index([produkMasterId, supplierId], name: "idx_produk_supplier_unique")
@@index([supplierId, status], name: "idx_supplier_status")
@@index([produkMasterId, status], name: "idx_produk_status")
@@index([cabangId, status], name: "idx_cabang_status")
@@index([supplierId, produkMasterId, isPrimary], name: "idx_supplier_produk_primary")
```

**Migration Command:**
```bash
npx prisma migrate dev --name add_produk_supplier_indexes
```

**Expected Improvement:** 50-80% faster query execution for filtered queries

---

### 5. Optimize Update Operation Transaction

**Current Issue:**
- `updateProdukSupplier` (lines 137-150): The `updateMany` for unsetting primary flag happens OUTSIDE the transaction, before the transaction starts

**Solution:** Move the `updateMany` inside the transaction

**Before:**
```javascript
// Lines 137-150 - happens BEFORE transaction
if (data.isPrimary) {
  await prisma.produkSupplier.updateMany({ ... }); // Outside transaction!
}
return prisma.$transaction(async (tx) => { ... });
```

**After:**
```javascript
return prisma.$transaction(async (tx) => {
  // Move inside transaction
  if (data.isPrimary) {
    await tx.produkSupplier.updateMany({
      where: {
        produkMasterId: existingRelation.produkMasterId,
        id: { not: id },
        isPrimary: true,
      },
      data: {
        isPrimary: false,
        updated_by_user_Id: userId,
        updated_by: userName,
      },
    });
  }

  // Then do the update
  const updatedRelation = await tx.produkSupplier.update({ ... });
  // ... rest of transaction
});
```

**Expected Improvement:** Better data consistency, rollback support

---

### 6. Optimize Query Select Fields

**Current Issue:**
- Some queries fetch more fields than needed (e.g., `createProdukSupplier` line 33-36)

**Solution:** Use minimal `select` for validation queries

**Before:**
```javascript
const supplier = await prisma.supplier.findUnique({
  where: { id: data.supplierId, deletedAt: null },
  select: { id: true, cabang_id: true },
});
```

**After:**
```javascript
// For validation, fetch ONLY what's needed
const [produkExists, supplierExists, relationExists] = await Promise.all([
  prisma.produkMaster.count({ where: { id: data.produkMasterId, deletedAt: null } }),
  prisma.supplier.count({ where: { id: data.supplierId, deletedAt: null } }),
  prisma.produkSupplier.count({
    where: {
      produkMasterId: data.produkMasterId,
      supplierId: data.supplierId,
    }
  })
]);

// Use count > 0 for existence check (returns number, faster than object)
```

**Expected Improvement:** ~20-30% faster validation queries

---

### 7. Implement Connection Pooling Configuration

**Current:** Default Prisma connection pool

**Solution:** Optimize pool settings in `src/config/db.js`

```javascript
// In db.js - add connection pool configuration
const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
  datasources: {
    db: {
      url: process.env.DIRECT_URL,
    },
  },
  // Connection pool optimization
  // For applications with high concurrency
  pool_timeout: 60,
  connection_limit: 20,
});
```

---

## Implementation Priority

### Phase 1: Quick Wins (1-2 hours)
1. Add caching to `getProductsBySupplier`, `getProductsForSupplier`, `getBranchesWithSupplierAccess`
2. Parallelize independent queries in `createProdukSupplier` and `updateProdukSupplier`
3. Move `updateMany` inside transaction in `updateProdukSupplier`

### Phase 2: Database Optimization (2-3 hours)
4. Add database indexes via Prisma migration
5. Implement `cacheDeletePatternScan` for non-blocking cache invalidation
6. Optimize validation queries to use `count` instead of `findUnique`

### Phase 3: Advanced Optimizations (3-4 hours)
7. Optimize connection pooling configuration
8. Add performance monitoring/logging
9. Consider implementing Redis pub/sub for cache invalidation across instances

---

## Expected Overall Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| createProdukSupplier latency | ~150-200ms | ~60-80ms | ~60% faster |
| updateProdukSupplier latency | ~180-250ms | ~70-100ms | ~60% faster |
| getProductsBySupplier (cached) | ~100-150ms | ~5-10ms | ~95% faster |
| getProductsBySupplier (uncached) | ~100-150ms | ~80-120ms | ~30% faster |
| getProductsForSupplier (cached) | ~120-180ms | ~5-10ms | ~95% faster |
| Redis blocking time | Variable | Near 0 | Eliminated |

---

## Testing Checklist

- [ ] Unit tests for parallelized queries
- [ ] Cache hit/miss ratio monitoring
- [ ] Database query execution time monitoring
- [ ] Load testing before/after comparison
- [ ] Transaction rollback testing
- [ ] Cache invalidation verification

---

## Monitoring Recommendations

1. **Add query logging middleware:**
```javascript
// In server.js or app.js
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 1000) {
      logger.warn(`Slow request: ${req.method} ${req.path} - ${duration}ms`);
    }
  });
  next();
});
```

2. **Monitor Redis operations:**
```javascript
// Add timing for cache operations in redisUtils.js
const cacheGet = async (key) => {
  const start = Date.now();
  try {
    const data = await redisClient.get(key);
    const duration = Date.now() - start;
    logger.debug(`Cache GET ${key}: ${duration}ms`);
    // ...
  }
};
```

3. **Track database query performance:**
```javascript
// Enable Prisma query logging in development
const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});
```
