# Database Environment Configuration Guide

## 📊 Overview

Casir-Online menggunakan 3 environment database yang terpisah:
1. **Development** - Local development dengan database nyata
2. **Testing** - Automated tests dengan Testcontainers
3. **Production** - Production database (Supabase/PostgreSQL)

---

## 🔄 Cara Kerja

### 1. Development Environment (`npm run dev`)

**File:** `server/.env`

```bash
DATABASE_URL="postgresql://app_user.xxx:password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://app_user.xxx:password@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

**Usage:**
- Saat menjalankan `npm run dev`
- Menggunakan database Supabase development
- Data persisten (tidak hilang saat restart)

### 2. Test Environment (`npm test`)

**File:** `server/.env.test`

```bash
NODE_ENV=test
DATABASE_URL="postgresql://test:test@localhost:5432/test"  # Akan di-override
```

**Alur:**
1. Vitest memuat `.env.test`
2. `globalSetup.js` dijalankan:
   ```javascript
   const url = await startTestDb();
   process.env.DATABASE_URL = url;  // ✅ Override DATABASE_URL
   ```
3. Testcontainers membuat PostgreSQL container baru
4. Semua test menggunakan database terisolasi
5. Setelah test selesai, container dihancurkan

**Keuntungan:**
- ✅ Test terisolasi dari database development
- ✅ Test dapat berjalan paralel
- ✅ Database bersih setiap kali test
- ✅ Tidak ada polusi data

### 3. Production Environment (`bash scripts/deploy.sh`)

**File:** `.env.production`

```bash
NODE_ENV=production
DATABASE_URL="postgresql://app_user.xxx:casir-online123@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://app_user.xxx:casir-online123@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

**Usage:**
- Saat deployment dengan Docker
- Menggunakan database production
- Data persisten dan di-backup

---

## 🎯 Perbedaan Utama

| Aspect | Development | Testing | Production |
|--------|-------------|---------|------------|
| **Database** | Supabase Dev | Testcontainers | Supabase Prod |
| **Isolation** | Shared | Isolated per test | Shared |
| **Data** | Persistent | Temporary | Persistent |
| **URL Source** | `.env` | `.env.test` + override | `.env.production` |
| **Migrations** | Manual `prisma migrate dev` | Auto di setup test | `prisma migrate deploy` |
| **Seeding** | Manual | Auto di setup test | Manual/Backup |

---

## 🔧 Implementation Details

### Test Setup Flow

```
npm test
    ↓
Vitest loads .env.test
    ↓
globalSetup.js runs
    ↓
startTestDb() creates PostgreSQL container
    ↓
process.env.DATABASE_URL = "postgresql://testcontainers:xxxx@localhost:5432/test"
    ↓
All tests use testcontainers database
    ↓
Tests finish
    ↓
stopTestDb() destroys container
```

### Deploy Setup Flow

```
deploy.sh
    ↓
Loads .env.production
    ↓
NODE_ENV=production
    ↓
Docker starts with DATABASE_URL from .env.production
    ↓
Prisma runs migrations against production database
    ↓
Application connects to production database
```

---

## 📝 Best Practices

### ✅ DO's:

1. **Gunakan `.env.test` untuk testing**
   - Isolated database
   - Mock external services
   - Faster test execution

2. **Override DATABASE_URL di test setup**
   ```javascript
   // __tests__/globalSetup.js
   process.env.DATABASE_URL = testcontainersUrl;
   ```

3. **Gunakan environment variables untuk switch**
   ```javascript
   const isTest = process.env.NODE_ENV === 'test';
   const isProd = process.env.NODE_ENV === 'production';
   ```

4. **Validasi environment saat startup**
   ```javascript
   if (!process.env.DATABASE_URL) {
     throw new Error('DATABASE_URL is required');
   }
   ```

### ❌ DON'Ts:

1. **JANGAN gunakan database development untuk testing**
   - Data pollution
   - Slow test execution
   - Race conditions

2. **JANGAN hardcode database URL**
   ```javascript
   // ❌ BAD
   const dbUrl = 'postgresql://user:pass@host:5432/db';

   // ✅ GOOD
   const dbUrl = process.env.DATABASE_URL;
   ```

3. **JANGAN commit .env files**
   - Gunakan .env.example sebagai template
   - Add .env ke .gitignore

---

## 🚀 Quick Reference

### Running Tests

```bash
# Server tests (with testcontainers)
cd server
npm test
# → Uses .env.test + testcontainers database

# Server tests with coverage
npm run test:coverage
# → Uses .env.test + testcontainers database

# Run specific test file
npm test -- auth.test.js
# → Uses .env.test + testcontainers database
```

### Running Development

```bash
# Development with Supabase
cd server
npm run dev
# → Uses .env (Supabase development database)

# Run migrations (development)
npx prisma migrate dev
# → Applies to .env DATABASE_URL
```

### Deploy Production

```bash
# Deploy to production
bash scripts/deploy.sh
# → Uses .env.production (Supabase production database)

# Manual deployment
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
# → Uses .env.production
```

---

## 🔍 Troubleshooting

### Problem: Tests still use development database

**Solution:**
1. Check if `.env.test` exists
2. Verify `globalSetup.js` is running
3. Check logs for "Testcontainers" messages

```bash
# Should see:
# [GlobalSetup] Memulai Testcontainers (hanya dijalankan sekali)...
# [testDbManager] Starting PostgreSQL test container...
```

### Problem: Deploy uses wrong database

**Solution:**
1. Verify `.env.production` DATABASE_URL
2. Check NODE_ENV=production
3. Verify Docker is using correct env file:

```bash
# Check env in container
docker compose -f docker-compose.prod.yml exec server env | grep DATABASE_URL
```

### Problem: Migrations run on wrong database

**Solution:**
```bash
# Development migrations
cd server
NODE_ENV=development npx prisma migrate dev

# Production migrations
NODE_ENV=production npx prisma migrate deploy

# Test migrations (handled by testcontainers)
# Automatically managed by testDbManager.js
```

---

## 📚 Related Files

| File | Purpose |
|------|---------|
| `server/.env` | Development environment |
| `server/.env.test` | Test environment |
| `.env.production` | Production environment |
| `server/__tests__/globalSetup.js` | Test setup with testcontainers |
| `server/__tests__/utils/testDbManager.js` | Database manager for tests |
| `server/prisma/schema.prisma` | Prisma schema |
| `scripts/deploy.sh` | Production deployment script |

---

## 💡 Advanced Tips

### 1. Multiple Test Databases

Untuk test paralel dengan database berbeda:

```javascript
// __tests__/globalSetup.js
export async function setup() {
  const testDb1 = await startTestDb(); // Database 1
  const testDb2 = await startTestDb(); // Database 2

  process.env.DATABASE_URL = testDb1;
  process.env.DATABASE_URL_2 = testDb2;
}
```

### 2. Test Data Seeding

```javascript
// __tests__/utils/testDbManager.js
export async function seedTestDb(databaseUrl) {
  const prisma = new PrismaClient({
    datasources: { url: databaseUrl }
  });

  await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test User'
    }
  });
}
```

### 3. Environment-Specific Config

```javascript
// src/config/database.js
const isTest = process.env.NODE_ENV === 'test';
const isProd = process.env.NODE_ENV === 'production';

export const dbConfig = {
  url: process.env.DATABASE_URL,
  log: isTest ? ['query', 'error', 'warn'] : ['error'],
};
```

---

*Last Updated: 2025-03-09*
