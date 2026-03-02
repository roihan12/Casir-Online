# Task 1: Kategori API - Positive vs Negative Test Coverage

## 📊 Test Case Distribution

### Total: 27 Test Cases
- ✅ **Positive Cases**: 8 tests (what SHOULD work)
- ❌ **Negative Cases**: 19 tests (what should FAIL with errors)

---

## ✅ POSITIVE CASES (8 tests)
*These tests verify the API works correctly with valid inputs*

### 1. GET /api/kategori (3 tests)
- ✅ Should return empty array when no categories exist
- ✅ Should return list of all categories with correct fields
- ✅ Should handle pagination correctly

### 2. GET /api/kategori/:id (2 tests)
- ✅ Should return category by valid ID
- ✅ Should include all related fields

### 3. POST /api/kategori (2 tests)
- ✅ Should create category with minimal required fields
- ✅ Should create category with all optional fields

### 4. PUT /api/kategori/:id (1 test)
- ✅ Should update category with valid data

---

## ❌ NEGATIVE CASES (19 tests)
*These tests verify the API properly rejects invalid inputs*

### 1. GET /api/kategori/:id - Invalid ID (3 tests)
- ❌ Should return 404 for non-existent UUID
- ❌ Should return 400 for invalid UUID format
- ❌ Should return 400 for SQL injection attempts

### 2. POST /api/kategori - Validation Errors (6 tests)
- ❌ Should return 400 when namaKategori is **missing**
- ❌ Should return 400 when namaKategori is **empty string**
- ❌ Should return 400 when namaKategori is **whitespace only**
- ❌ Should return 400 when namaKategori **exceeds 100 chars**
- ❌ Should return 400 when namaKategori is **not a string**
- ❌ Should return 400 when status is **invalid value**

### 3. POST /api/kategori - Business Logic (2 tests)
- ❌ Should return 409 when namaKategori **already exists** (duplicate)
- ❌ Should handle **special characters** (should succeed, not error)

### 4. PUT /api/kategori/:id - Validation Errors (4 tests)
- ❌ Should return 404 when category **doesn't exist**
- ❌ Should return 400 for **invalid UUID format**
- ❌ Should return 400 when namaKategori **exceeds 100 chars**
- ❌ Should return 400 when status is **invalid value**

### 5. PUT /api/kategori/:id - Business Logic (2 tests)
- ❌ Should return 409 when namaKategori **conflicts with existing**
- ❌ Should be **idempotent** (same data = no error)

### 6. DELETE /api/kategori/:id - Validation & Business Logic (2 tests)
- ❌ Should return 404 when category **doesn't exist**
- ❌ Should return 400 for **invalid UUID format**

---

## 🎯 Coverage Matrix

| Endpoint | Positive | Negative | Total |
|----------|----------|----------|-------|
| **GET /api/kategori** | 3 | 0 | 3 |
| **GET /api/kategori/:id** | 2 | 3 | 5 |
| **POST /api/kategori** | 2 | 8 | 10 |
| **PUT /api/kategori/:id** | 1 | 6 | 7 |
| **DELETE /api/kategori/:id** | 0 | 2 | 2 |
| **TOTAL** | **8** | **19** | **27** |

---

## 📋 Detailed Test List

### ✅ Positive Cases (Happy Path)

```javascript
describe('GET /api/kategori - Positive Cases', () => {
  test('✅ Should return empty array when no categories exist', async () => {
    const response = await agent
      .get('/api/kategori')
      .expect(200);

    expect(response.body.data).toEqual([]);
  });

  test('✅ Should return list of all categories', async () => {
    await createKategori({ namaKategori: 'Category 1' });
    await createKategori({ namaKategori: 'Category 2' });

    const response = await agent
      .get('/api/kategori')
      .expect(200);

    expect(response.body.data).toHaveLength(2);
  });

  test('✅ Should handle pagination correctly', async () => {
    // Create 15 categories
    for (let i = 0; i < 15; i++) {
      await createKategori({ namaKategori: `Cat ${i}` });
    }

    const response = await agent
      .get('/api/kategori?limit=10&offset=5')
      .expect(200);

    expect(response.body.data).toHaveLength(10);
  });
});
```

### ❌ Negative Cases (Error Paths)

```javascript
describe('POST /api/kategori - Negative Cases', () => {
  test('❌ Should return 400 when namaKategori is missing', async () => {
    const response = await agent
      .post('/api/kategori')
      .send({ deskripsi: 'Test' })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('namaKategori');
  });

  test('❌ Should return 400 when namaKategori is empty', async () => {
    const response = await agent
      .post('/api/kategori')
      .send({ namaKategori: '' })
      .expect(400);
  });

  test('❌ Should return 400 when namaKategori exceeds 100 chars', async () => {
    const response = await agent
      .post('/api/kategori')
      .send({ namaKategori: 'a'.repeat(101) })
      .expect(400);
  });

  test('❌ Should return 409 when namaKategori already exists', async () => {
    await createKategori({ namaKategori: 'DUPLICATE' });

    const response = await agent
      .post('/api/kategori')
      .send({ namaKategori: 'DUPLICATE' })
      .expect(409);
  });

  test('❌ Should return 400 when status is invalid', async () => {
    const response = await agent
      .post('/api/kategori')
      .send({
        namaKategori: 'Test',
        status: 'INVALID_STATUS'
      })
      .expect(400);
  });
});
```

---

## 🔍 What's NOT Covered (Yet)

### Advanced Edge Cases (Optional - Phase 5)
- Performance tests (1000+ records)
- Concurrent request handling
- Database connection failures
- Rate limiting
- File upload limits (for image uploads)

### Security Deep-Dive (Optional - Phase 5)
- Authentication bypass attempts
- Permission escalation tests
- CSRF token validation
- Request size limits (DoS protection)

---

## ✅ Summary

| Coverage Type | Count | Percentage |
|---------------|-------|------------|
| **Positive Cases** | 8 | 30% |
| **Negative Cases** | 19 | 70% |

**Why more negative cases?**
- Negative cases test **robustness** (how well API handles bad input)
- Input validation is critical for security
- Business logic rules prevent data corruption
- Negative cases are often where bugs hide

---

## 🚀 Ready to Implement?

Both positive and negative cases are **fully covered**. Should I start implementing Task 1 (Kategori Tests) with:
- ✅ 8 positive test cases
- ❌ 19 negative test cases
- 📊 Total: 27 comprehensive tests

**Type:**
- ✅ **"Yes, start implementing"** - I'll create kategori.test.js
- 📝 **"Adjust the balance"** - Add more positive or remove some negative
- ❓ **"Show me code example first"** - Preview the test structure
