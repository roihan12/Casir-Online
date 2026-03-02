# Schema Column Reference for Tests

> Quick reference for commonly used models in tests. Always check `schema.prisma` for the complete schema.

## Core Models

### User (`user` table)
```javascript
{
  id: string,                    // @default(uuid()) @map("user_id")
  username: string,              // unique
  password: string,
  namaLengkap: string,           // @map("nama_lengkap") - NOT "name"
  email: string,
  telepon: string?,              // optional
  avatarUrl: string?,            // @map("avatar_url") - optional
  status: 'aktif' | 'nonaktif',  // UserStatus enum - NOT "isActive" boolean
  deletedAt: DateTime?,          // @map("deleted_at") - optional
  createdAt: DateTime,           // @default(now()) @map("created_at")
  updatedAt: DateTime,           // @updatedAt @map("updated_at")
  lastLogin: DateTime?,          // @map("last_login") - optional
  // ... other audit fields
}
```

### Role (`roles` table)
```javascript
{
  id: string,                    // @default(uuid()) @map("role_id")
  namaRole: string,              // unique @map("nama_role") - NOT "name"
  deskripsi: string?,            // optional - NOT "description"
  displayName: string,           // @map("display_name") - default("")
  status: string,                // default("aktif")
  isSystem: boolean,             // @map("is_system") - default(false)
  createdAt: DateTime,           // @map("created_at")
  updatedAt: DateTime,           // @map("updated_at")
}
```

### Cabang (`cabang` table)
```javascript
{
  id: string,                    // @map("cabang_id")
  namaCabang: string,            // @map("nama_cabang")
  alamat: string?,               // optional
  telepon: string?,              // optional
  latitude: decimal?,            // optional
  longitude: decimal?,           // optional
  radiusGeofence: number?,       // @map("radius_geofence") - optional
  status: 'aktif' | 'nonaktif',  // CabangStatus enum
  createdAt: DateTime,           // @map("created_at")
  updatedAt: DateTime,           // @map("updated_at")
}
```

### UserRole (`user_roles` table) - Junction Table
```javascript
{
  id: string,                    // @default(uuid()) @map("user_role_id")
  userId: string,                // @map("user_id")
  roleId: string,                // @map("role_id")
  cabangId: string,              // @map("cabang_id") - REQUIRED
  createdAt: DateTime,           // @map("created_at")
  updatedAt: DateTime,           // @map("updated_at")
  assignedAt: DateTime,          // @map("assigned_at")
  assignedBy: string?,           // @map("assigned_by") - optional
}
```

## Product Models

### ProdukMaster (`produk_master` table)
```javascript
{
  id: string,                    // @default(uuid()) @map("produk_master_id")
  namaProduk: string,            // @map("nama_produk")
  sku: string,                   // unique
  deskripsi: string?,
  satuan: string?,
  status: string,
  // ... other fields
}
```

### Produk (`produk` table)
```javascript
{
  id: string,                    // @default(uuid()) @map("produk_id")
  produkMasterId: string,        // @map("produk_master_id")
  cabangId: string,              // @map("cabang_id")
  hargaJual: decimal,            // @map("harga_jual")
  hargaBeli: decimal,            // @map("harga_beli")
  stok: number,
  status: string,
  // ... other fields
}
```

### Kategori (`kategori` table)
```javascript
{
  id: string,                    // @default(uuid()) @map("kategori_id")
  namaKategori: string,          // @map("nama_kategori") - NOT "name"
  deskripsi: string?,
  status: string,
  // ... other fields
}
```

## Transaction Models

### Transaksi (`transaksi` table)
```javascript
{
  transaksi_id: string,          // @id @default(uuid())
  cabang_id: string?,            // optional
  nomor_transaksi: string,       // unique
  tanggal: DateTime,
  pelanggan_id: string?,         // optional
  supplier_id: string?,          // optional
  shift_id: string?,             // optional
  promo_id: string?,             // optional
  subtotal: decimal,
  diskon: decimal,
  pajak: decimal,
  biaya_tambahan: decimal,       // @map("biaya tambahan")
  total: decimal,
  jenis_transaksi: string,
  status_pembayaran: string,     // @map("status_pembayaran")
  order_source: string,          // @map("order_source") - default("POS")
  order_type: string,            // @map("order_type") - default("PICKUP")
  order_status: string,          // @map("order_status") - default("COMPLETED")
  delivery_status: string?,      // @map("delivery_status") - optional
  delivery_fee: decimal?,        // @map("delivery_fee") - optional
  // ... other fields
}
```

### TransaksiDetail (`transaksi_detail` table)
```javascript
{
  id: string,                    // @default(uuid()) @map("detail_id")
  transaksi_id: string,          // @map("transaksi_id")
  produk_id: string,             // @map("produk_id")
  jumlah: number,
  harga_satuan: decimal,         // @map("harga_satuan")
  diskon: decimal,
  subtotal: decimal,
  // ... other fields
}
```

### Pembayaran (`pembayaran` table)
```javascript
{
  pembayaran_id: string,         // @id @default(uuid())
  transaksi_id: string,          // @map("transaksi_id")
  metode_pembayaran: string,     // @map("metode_pembayaran")
  jumlah: decimal,
  status: string,
  // ... other fields
}
```

## Common Patterns

### Creating a User with Role
```javascript
// 1. Create Cabang first (required for UserRole)
const cabang = await prisma.cabang.create({
  data: {
    namaCabang: 'Test Cabang',
    alamat: 'Jl. Test No. 123',
    status: 'aktif',
  },
});

// 2. Create Role
const role = await prisma.role.create({
  data: {
    namaRole: 'KASIR',  // NOT "name"
    deskripsi: 'Kasir Role',
    displayName: 'Kasir',
  },
});

// 3. Create User
const hashedPassword = await bcrypt.hash('password123', 10);
const user = await prisma.user.create({
  data: {
    namaLengkap: 'Test User',  // NOT "name"
    username: 'testuser',
    email: 'test@example.com',
    password: hashedPassword,
    status: 'aktif',  // UserStatus enum, NOT boolean isActive
  },
});

// 4. Create UserRole junction (REQUIRED!)
await prisma.userRole.create({
  data: {
    userId: user.id,
    roleId: role.id,
    cabangId: cabang.id,  // REQUIRED
  },
});
```

### Common Mistakes to Avoid

❌ **WRONG:**
```javascript
await prisma.role.create({
  data: {
    name: 'KASIR',  // ❌ Should be namaRole
    description: 'Test',  // ❌ Should be deskripsi
  },
});

await prisma.user.create({
  data: {
    name: 'Test',  // ❌ Should be namaLengkap
    isActive: true,  // ❌ Should be status: 'aktif'
    roleId: role.id,  // ❌ No direct relation, use UserRole junction table
  },
});
```

✅ **CORRECT:**
```javascript
await prisma.role.create({
  data: {
    namaRole: 'KASIR',
    deskripsi: 'Test',
  },
});

await prisma.user.create({
  data: {
    namaLengkap: 'Test',
    status: 'aktif',
  },
});

// Then create UserRole junction
await prisma.userRole.create({
  data: {
    userId: user.id,
    roleId: role.id,
    cabangId: cabang.id,  // Required
  },
});
```

## Testing Best Practices

1. **Always use factories** - Use the factory functions in `factories/userFactory.js`
2. **Clean between tests** - Use `beforeEach` with `clearTestDb()`
3. **Use descriptive data** - Include timestamps to avoid unique constraint violations
4. **Test edge cases** - Test with null values, invalid data, etc.
5. **Use transactions** - For complex test setups, use Prisma transactions
6. **Don't hardcode IDs** - Always use the returned IDs from created records
7. **Use unique values** - Use `Date.now()` to ensure uniqueness in test data
