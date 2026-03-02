import bcrypt from 'bcrypt';
import { getPrisma } from '../helpers/testSetup';

/**
 * Create a test Cabang
 * @param {Object} overrides - Override default values
 * @param {import('@prisma/client').PrismaClient} prismaOverride - Optional prisma client
 * @returns {Promise<Cabang>}
 */
export const createCabang = async (overrides = {}, prismaOverride = null) => {
  const prisma = prismaOverride || getPrisma();

  const defaultData = {
    id: `cabang-${Date.now()}`, // Cabang.id has no @default(), must provide manually
    namaCabang: `Test Cabang ${Date.now()}`,
    alamat: 'Jl. Test No. 123',
    telepon: '08123456789',
    status: 'aktif',
  };

  return prisma.cabang.create({
    data: { ...defaultData, ...overrides },
  });
};

/**
 * Create a test Role
 * @param {Object} overrides - Override default values
 * @param {import('@prisma/client').PrismaClient} prismaOverride - Optional prisma client
 * @returns {Promise<Role>}
 */
export const createRole = async (overrides = {}, prismaOverride = null) => {
  const prisma = prismaOverride || getPrisma();

  const defaultData = {
    namaRole: `ROLE-${Date.now()}`,
    deskripsi: 'Test Role',
    displayName: 'Test Role',
    status: 'aktif',
  };

  return prisma.role.create({
    data: { ...defaultData, ...overrides },
  });
};

/**
 * Create a test User with Role and Cabang
 * @param {Object} userOverrides - Override user default values
 * @param {Object} roleOverrides - Override role default values
 * @param {Object} cabangOverrides - Override cabang default values
 * @param {import('@prisma/client').PrismaClient} prismaOverride - Optional prisma client
 * @returns {Promise<{user: User, role: Role, cabang: Cabang, plainPassword: string}>}
 */
export const createUserWithRole = async (
  userOverrides = {},
  roleOverrides = {},
  cabangOverrides = {},
  prismaOverride = null
) => {
  const prisma = prismaOverride || getPrisma();
  const plainPassword = userOverrides.password || 'password123';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  // 1. Create Cabang
  const cabang = await createCabang(cabangOverrides, prisma);

  // 2. Create Role
  const role = await createRole(roleOverrides, prisma);

  // 3. Create User
  const userDefaultData = {
    namaLengkap: 'Test User',
    username: `testuser_${Date.now()}`,
    email: `testuser_${Date.now()}@example.com`,
    password: hashedPassword,
    status: 'aktif',
  };

  const user = await prisma.user.create({
    data: { ...userDefaultData, ...userOverrides },
  });

  // 4. Create UserRole junction table
  await prisma.userRole.create({
    data: {
      userId: user.id,
      roleId: role.id,
      cabangId: cabang.id,
    },
  });

  return { user, role, cabang, plainPassword };
};

/**
 * Create a test Pelanggan (Customer)
 * @param {Object} overrides - Override default values
 * @returns {Promise<Pelanggan>}
 */
export const createPelanggan = async (overrides = {}) => {
  const prisma = getPrisma();

  const defaultData = {
    namaPelanggan: `Test Customer ${Date.now()}`,
    email: `customer_${Date.now()}@example.com`,
    telepon: '08123456789',
    alamat: 'Jl. Customer No. 456',
    poin: 0, // Not poinLoyalty
    status: 'aktif',
  };

  return prisma.pelanggan.create({
    data: { ...defaultData, ...overrides },
  });
};

/**
 * Create a test Supplier
 * @param {Object} overrides - Override default values
 * @returns {Promise<Supplier>}
 */
export const createSupplier = async (overrides = {}) => {
  const prisma = getPrisma();

  const defaultData = {
    namaSupplier: `Test Supplier ${Date.now()}`,
    kontak: 'Supplier Contact',
    telepon: '081234567890',
    email: `supplier_${Date.now()}@example.com`,
    alamat: 'Jl. Supplier No. 789',
    status: 'aktif',
  };

  return prisma.supplier.create({
    data: { ...defaultData, ...overrides },
  });
};

/**
 * Create a test Shift
 * @param {Object} overrides - Override default values
 * @returns {Promise<Shift>}
 */
export const createShift = async (overrides = {}) => {
  const prisma = getPrisma();

  // Shift requires userId and cabangId, so create those first
  const { user, cabang } = await createUserWithRole();

  const defaultData = {
    userId: user.id,
    cabangId: cabang.id,
    waktuMulai: new Date(), // DateTime field, not string
    kasAwal: 0, // Required Decimal field
    status: 'aktif', // ShiftStatus enum
    nama_shift: 'Test Shift', // Optional, snake_case
  };

  return prisma.shift.create({
    data: { ...defaultData, ...overrides },
  });
};

/**
 * Create a test Kategori
 * @param {Object} overrides - Override default values
 * @param {import('@prisma/client').PrismaClient} prismaOverride - Optional prisma client
 * @returns {Promise<Kategori>}
 */
export const createKategori = async (overrides = {}, prismaOverride = null) => {
  const prisma = prismaOverride || getPrisma();

  const defaultData = {
    namaKategori: `Test Kategori ${Date.now()}`,
    deskripsi: 'Test Kategori Description',
    status: 'aktif',
  };

  return prisma.kategori.create({
    data: { ...defaultData, ...overrides },
  });
};

/**
 * Create a test ProdukMaster
 * @param {Object} overrides - Override default values
 * @returns {Promise<ProdukMaster>}
 */
export const createProdukMaster = async (overrides = {}) => {
  const prisma = getPrisma();

  const defaultData = {
    namaProduk: `Test Produk ${Date.now()}`,
    sku: `SKU-${Date.now()}`,
    deskripsi: 'Test Product Description',
    satuan: 'pcs',
    status: 'aktif',
  };

  return prisma.produkMaster.create({
    data: { ...defaultData, ...overrides },
  });
};

/**
 * Create a test Produk with related entities
 * @param {Object} produkOverrides - Override produk default values
 * @param {Object} cabangOverrides - Override cabang default values
 * @returns {Promise<{produk: Produk, cabang: Cabang}>}
 */
export const createProduk = async (produkOverrides = {}, cabangOverrides = {}) => {
  const prisma = getPrisma();

  const cabang = await createCabang(cabangOverrides);
  const produkMaster = await createProdukMaster();

  const defaultData = {
    produkMasterId: produkMaster.id,
    cabangId: cabang.id,
    hargaJual: 10000,
    hargaBeli: 8000,
    stok: 100,
    status: 'aktif',
  };

  const produk = await prisma.produk.create({
    data: { ...defaultData, ...produkOverrides },
  });

  return { produk, cabang, produkMaster };
};

/**
 * Create a test Transaksi with basic data
 * @param {Object} overrides - Override default values
 * @returns {Promise<Transaksi>}
 */
export const createTransaksi = async (overrides = {}) => {
  const prisma = getPrisma();
  const { user, cabang } = await createUserWithRole();

  const defaultData = {
    nomor_transaksi: `TRX-${Date.now()}`, // snake_case, no @map() in schema
    tanggal: new Date(),
    cabang_id: cabang.id, // snake_case, no @map() in schema
    subtotal: 10000,
    diskon: 0,
    pajak: 1000,
    biaya_tambahan: 0, // snake_case, no @map() in schema
    total: 11000,
    status_pembayaran: 'lunas', // snake_case, no @map() in schema
    jenis_transaksi: 'jual', // snake_case, no @map() in schema
    created_by_user_Id: user.id, // Note: capital 'I' in schema
    order_source: 'POS', // snake_case, no @map() in schema
    order_type: 'PICKUP', // snake_case, no @map() in schema
    order_status: 'COMPLETED', // snake_case, no @map() in schema
  };

  return prisma.transaksi.create({
    data: { ...defaultData, ...overrides },
  });
};
