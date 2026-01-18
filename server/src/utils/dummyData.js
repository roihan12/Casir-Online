const { faker } = require("@faker-js/faker");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const { generateBranchId } = require("./generateBranchId");
const ExcelJS = require("exceljs");
const path = require("path");
const crypto = require("crypto");
const { create } = require("domain");

class DummyDataGenerator {
  constructor() {
    this.prisma = new PrismaClient();
    this.faker = faker;
  }

  // Generate hashed password
  async generateHashedPassword(password = "password123") {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  // Generate dummy branches
  async generateBranches(count = 5) {
    const branches = [];
    const usedIds = new Set();

    for (let i = 0; i < count; i++) {
      let cabangName = `${this.faker.location.city()}`;
      let cabangId;

      // Ensure unique branch ID
      do {
        cabangId = await generateBranchId(cabangName);
      } while (usedIds.has(cabangId));

      usedIds.add(cabangId);

      branches.push({
        id: cabangId,
        namaCabang: cabangName,
        alamat: this.faker.location.streetAddress(),
        telepon: this.faker.phone.number({ style: "national" }),
        latitude: parseFloat(
          this.faker.location.latitude({ max: 10, min: -10 })
        ),
        longitude: parseFloat(
          this.faker.location.longitude({ max: 10, min: -10 })
        ),
        radiusGeofence: this.faker.number.int({ min: 10, max: 100 }),
        status: "aktif",
      });
    }
    return branches;
  }

  // Generate dummy users with roles and hashed passwords
  async generateUsers(branches, roleRecords, count = 20) {
    const roles = roleRecords.map((role) => role.id);
    const users = [];
    const userRoles = [];
    const userBranches = [];
    const usedUserIds = new Set();
    const usedUsernames = new Set();

    // Helper function to truncate strings
    const truncate = (str, maxLength) => {
      return str.length > maxLength ? str.substring(0, maxLength) : str;
    };

    // Helper function to generate unique username
    const generateUniqueUsername = (baseUsername, maxLength = 50) => {
      let username = truncate(baseUsername, maxLength);
      let counter = 1;
      while (usedUsernames.has(username)) {
        const counterSuffix = counter.toString();
        username = truncate(
          `${baseUsername.substring(
            0,
            maxLength - counterSuffix.length
          )}${counterSuffix}`,
          maxLength
        );
        counter++;
      }
      return username;
    };

    // Predefined users for easy login
    const predefinedUsers = [
      {
        username: "superadmin",
        roleId: roleRecords.find((role) => role.namaRole === "super_admin")?.id,
        name: "Super Administrator",
      },
      {
        username: "admincabang",
        roleId: roleRecords.find((role) => role.namaRole === "admin_cabang")
          ?.id,
        name: "Branch Admin",
      },
      {
        username: "kasir",
        roleId: roleRecords.find((role) => role.namaRole === "kasir")?.id,
        name: "Cashier",
      },
    ];

    // Generate predefined users first
    for (const predUser of predefinedUsers) {
      let userId = this.faker.string.uuid().substring(0, 36);
      while (usedUserIds.has(userId)) {
        userId = this.faker.string.uuid().substring(0, 36);
      }
      usedUserIds.add(userId);

      const username = generateUniqueUsername(predUser.username);
      usedUsernames.add(username);

      const branch = this.faker.helpers.arrayElement(branches);
      const hashedPassword = await this.generateHashedPassword(
        predUser.username
      );

      users.push({
        id: userId,
        username: username,
        password: hashedPassword,
        namaLengkap: truncate(predUser.name, 100),
        email: truncate(`${username}@example.com`, 100),
        telepon: truncate(this.faker.phone.number(), 20),
        status: "aktif",
      });

      userRoles.push({
        id: this.faker.string.uuid().substring(0, 36),
        userId,
        roleId: predUser.roleId,
        cabangId: branch.id,
      });

      userBranches.push({
        id: this.faker.string.uuid().substring(0, 36),
        userId,
        cabangId: branch.id,
        isPrimary: true,
      });
    }

    // Generate additional random users
    for (let i = 0; i < count; i++) {
      let userId = this.faker.string.uuid().substring(0, 36);
      while (usedUserIds.has(userId)) {
        userId = this.faker.string.uuid().substring(0, 36);
      }
      usedUserIds.add(userId);

      const roleId = this.faker.helpers.arrayElement(roles);
      const branch = this.faker.helpers.arrayElement(branches);
      const hashedPassword = await this.generateHashedPassword();

      // Generate unique username
      let baseUsername = this.faker.internet.displayName();
      const username = generateUniqueUsername(baseUsername);
      usedUsernames.add(username);

      // Create user
      users.push({
        id: userId,
        username: username,
        password: hashedPassword,
        namaLengkap: truncate(this.faker.person.fullName(), 100),
        email: truncate(this.faker.internet.email(), 100),
        telepon: truncate(this.faker.phone.number(), 20),
        status: "aktif",
      });

      // Assign role
      userRoles.push({
        id: this.faker.string.uuid().substring(0, 36),
        userId,
        roleId: roleId,
        cabangId: branch.id,
      });

      // Assign primary branch
      userBranches.push({
        id: this.faker.string.uuid().substring(0, 36),
        userId,
        cabangId: branch.id,
        isPrimary: true,
      });
    }

    return { users, userRoles, userBranches };
  }

  // Read products from Excel file
  async readProductsFromExcel(filePath) {
    console.log("📊 Reading products from Excel...");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const worksheet = workbook.getWorksheet(1); // Get the first worksheet
    const products = [];

    // Get header row to find column indexes
    const headerRow = worksheet.getRow(1);
    const headers = {};

    // Create a mapping of column names to column indexes
    headerRow.eachCell((cell, colNumber) => {
      headers[cell.value] = colNumber;
    });

    // Skip header row and read data
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header row

      // Only proceed if we have the required columns
      if (headers["KODE_BARANG"]) {
        products.push({
          kode_barang: row.getCell(headers["KODE_BARANG"]).value || "",
          kode_barcode: headers["KODE_BARCODE"]
            ? row.getCell(headers["KODE_BARCODE"]).value || ""
            : "",
          kode_barcode_2: headers["KODE_BARCODE_2"]
            ? row.getCell(headers["KODE_BARCODE_2"]).value || ""
            : "",
          kode_barcode_3: headers["KODE_BARCODE_3"]
            ? row.getCell(headers["KODE_BARCODE_3"]).value || ""
            : "",
          nama: headers["NAMA"] ? row.getCell(headers["NAMA"]).value || "" : "",
          kategori: headers["KATEGORI"]
            ? row.getCell(headers["KATEGORI"]).value || ""
            : "",
          sub_kategori: headers["SUB_KATEGORI"]
            ? row.getCell(headers["SUB_KATEGORI"]).value || ""
            : "",
          supplier: headers["SUPPLIER"]
            ? row.getCell(headers["SUPPLIER"]).value || ""
            : "",
          tanggal_beli: headers["TANGGAL_BELI"]
            ? row.getCell(headers["TANGGAL_BELI"]).value || null
            : null,
          isi: headers["ISI"] ? row.getCell(headers["ISI"]).value || 1 : 1,
          isi_satuan_3: headers["ISI_SATUAN_3"]
            ? row.getCell(headers["ISI_SATUAN_3"]).value || 1
            : 1,
          satuan_1: headers["SATUAN_1"]
            ? row.getCell(headers["SATUAN_1"]).value || "pcs"
            : "pcs",
          satuan_2: headers["SATUAN_2"]
            ? row.getCell(headers["SATUAN_2"]).value || ""
            : "",
          satuan_3: headers["SATUAN_3"]
            ? row.getCell(headers["SATUAN_3"]).value || ""
            : "",
          stok_toko: headers["TOKO"]
            ? row.getCell(headers["TOKO"]).value || 0
            : 0,
          stok_gudang: headers["GUDANG"]
            ? row.getCell(headers["GUDANG"]).value || 0
            : 0,
          hpp: headers["HPP"] ? row.getCell(headers["HPP"]).value || 0 : 0,
          harga_toko_1: headers["HARGA_TOKO_1"]
            ? row.getCell(headers["HARGA_TOKO_1"]).value || 0
            : 0,
          harga_toko_2: headers["HARGA_TOKO_2"]
            ? row.getCell(headers["HARGA_TOKO_2"]).value || 0
            : 0,
          harga_toko_3: headers["HARGA_TOKO_3"]
            ? row.getCell(headers["HARGA_TOKO_3"]).value || 0
            : 0,
          harga_partai_1: headers["HARGA_PARTAI_1"]
            ? row.getCell(headers["HARGA_PARTAI_1"]).value || 0
            : 0,
          harga_partai_2: headers["HARGA_PARTAI_2"]
            ? row.getCell(headers["HARGA_PARTAI_2"]).value || 0
            : 0,
          harga_partai_3: headers["HARGA_PARTAI_3"]
            ? row.getCell(headers["HARGA_PARTAI_3"]).value || 0
            : 0,
          harga_cabang_1: headers["HARGA_CABANG_1"]
            ? row.getCell(headers["HARGA_CABANG_1"]).value || 0
            : 0,
          harga_cabang_2: headers["HARGA_CABANG_2"]
            ? row.getCell(headers["HARGA_CABANG_2"]).value || 0
            : 0,
          harga_cabang_3: headers["HARGA_CABANG_3"]
            ? row.getCell(headers["HARGA_CABANG_3"]).value || 0
            : 0,
          lokasi: headers["LOKASI"]
            ? row.getCell(headers["LOKASI"]).value || ""
            : "",
          ukuran: headers["UKURAN"]
            ? row.getCell(headers["UKURAN"]).value || ""
            : "",
          warna: headers["WARNA"]
            ? row.getCell(headers["WARNA"]).value || ""
            : "",
          nama_2: headers["NAMA_2"]
            ? row.getCell(headers["NAMA_2"]).value || ""
            : "",
          nama_3: headers["NAMA_3"]
            ? row.getCell(headers["NAMA_3"]).value || ""
            : "",
          stok_min: headers["STOK_MIN"]
            ? row.getCell(headers["STOK_MIN"]).value || 0
            : 0,
          stok_max: headers["STOK_MAX"]
            ? row.getCell(headers["STOK_MAX"]).value || 0
            : 0,
        });
      }
    });

    console.log(`📚 Read ${products.length} products from Excel file`);
    return products;
  }

  // Generate categories from Excel data
  async generateCategoriesFromExcel(excelProducts) {
    console.log("🏷️ Generating categories from Excel data...");

    // Extract unique categories
    const uniqueCategories = [
      ...new Set(excelProducts.map((p) => p.kategori)),
    ].filter(Boolean);

    // Create category objects
    const categories = uniqueCategories.map((category) => ({
      id: crypto.randomUUID(),
      namaKategori: category,
      deskripsi: `Products in the ${category} category`,
      status: "aktif",
    }));

    console.log(`📦 Generated ${categories.length} categories from Excel data`);
    return categories;
  }

  // Generate suppliers from Excel data
  async generateSuppliersFromExcel(excelProducts, branches) {
    console.log("🧑‍💼 Generating suppliers from Excel data...");

    // Extract unique suppliers
    const uniqueSuppliers = [
      ...new Set(excelProducts.map((p) => p.supplier)),
    ].filter(Boolean);

    // Create supplier objects
    const suppliers = uniqueSuppliers.map((supplier) => {
      // Select a random branch for this supplier
      const branch = this.faker.helpers.arrayElement(branches);

      return {
        id: crypto.randomUUID(),
        namaSupplier: supplier,
        alamat: this.faker.location.streetAddress(),
        telepon: this.faker.phone.number({ style: "national" }),
        email: this.faker.internet.email({
          firstName: supplier.split(" ")[0],
          lastName: "company",
        }),
        npwp: this.faker.string.numeric(15),
        picNama: this.faker.person.fullName(),
        picKontak: this.faker.phone.number({ style: "national" }),
        status: "aktif",
        cabang_id: branch.id,
      };
    });

    console.log(`🏢 Generated ${suppliers.length} suppliers from Excel data`);
    return suppliers;
  }

  // Generate product masters and products from Excel data in batches
  async generateProductsFromExcel(
    excelProducts,
    categories,
    branches,
    suppliers,
    batchSize = 5000
  ) {
    console.log("🚚 Generating products from Excel data in batches...");

    // Create a category map for quick lookups
    const categoryMap = {};
    categories.forEach((cat) => {
      categoryMap[cat.namaKategori] = cat.id;
    });

    // Create a supplier map for quick lookups
    const supplierMap = {};
    suppliers.forEach((sup) => {
      supplierMap[sup.namaSupplier] = sup.id;
    });

    // Default category ID for products without a category
    const defaultCategoryId = categories.length > 0 ? categories[0].id : null;

    const productMasters = [];
    const products = [];
    const produkSuppliers = [];

    // Process in batches
    const totalProducts = excelProducts.length;
    const totalBatches = Math.ceil(totalProducts / batchSize);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const start = batchIndex * batchSize;
      const end = Math.min(start + batchSize, totalProducts);

      console.log(
        `⏳ Processing batch ${batchIndex + 1}/${totalBatches} (${start} to ${
          end - 1
        })`
      );

      const batchProducts = excelProducts.slice(start, end);

      // Process each product in the batch
      for (const excelProduct of batchProducts) {
        // Generate product master
        const masterId = crypto.randomUUID();

        // Find or set default category ID
        let kategoriId = null;
        if (excelProduct.kategori && categoryMap[excelProduct.kategori]) {
          kategoriId = categoryMap[excelProduct.kategori];
        } else {
          kategoriId = defaultCategoryId;
        }

        productMasters.push({
          id: masterId,
          namaProduk:
            excelProduct.nama ||
            `Product-${crypto.randomUUID().substring(0, 8)}`,
          sku: excelProduct.kode_barang || "",
          barcode: excelProduct.kode_barcode || "",
          deskripsi: `${excelProduct.nama || ""} - ${
            excelProduct.nama_2 || ""
          }`.trim(),
          kategoriId,
          isi: parseInt(excelProduct.isi) || 1,
          brand: excelProduct.supplier || "",
          satuan: excelProduct.satuan_1 || "pcs",
          berat: 1.0, // Default value
          isManagedStock: true,
          hasExpired: false,
          status: "aktif",
        });

        // Create products for each branch
        for (const branch of branches) {
          products.push({
            id: crypto.randomUUID(),
            produkMasterId: masterId,
            cabangId: branch.id,
            hargaBeli: parseFloat(excelProduct.hpp) || 0,
            hargaJual: parseFloat(excelProduct.harga_toko_1) || 0,
            hargaGrosir: parseFloat(excelProduct.harga_partai_1) || 0,
            stok: this.faker.number.int({ min: 0, max: 500 }),
            minStok: parseInt(excelProduct.stok_min) || 10,
            maxStok: parseInt(excelProduct.stok_max) || 100,
            status: "tersedia",
          });
        }

        // Create ProdukSupplier relationship if supplier exists
        if (excelProduct.supplier && supplierMap[excelProduct.supplier]) {
          const supplierId = supplierMap[excelProduct.supplier];

          // Choose a random branch for the product-supplier relationship
          const branch = this.faker.helpers.arrayElement(branches);

          produkSuppliers.push({
            id: crypto.randomUUID(),
            produkMasterId: masterId,
            supplierId: supplierId,
            isPrimary: true, // This is the primary supplier as it comes from Excel
            hargaBeli: parseFloat(excelProduct.hpp) || 0,
            minPembelian: this.faker.number.int({ min: 5, max: 20 }),
            leadTime: this.faker.number.int({ min: 1, max: 14 }),
            kodeProdukSupplier:
              excelProduct.kode_barang ||
              this.faker.string.alphanumeric(10).toUpperCase(),
            status: "aktif",
            cabangId: branch.id,
          });
        }
      }
    }

    console.log(
      `✅ Generated ${productMasters.length} product masters, ${products.length} branch products, and ${produkSuppliers.length} product-supplier relationships`
    );
    return { productMasters, products, produkSuppliers };
  }

  // Generate dummy product categories (using faker)
  async generateCategories(count = 10) {
    const categories = [];
    const usedCategories = new Set();

    while (categories.length < count) {
      const namaKategori = this.faker.commerce.department();

      // Check if this category name has already been used
      if (!usedCategories.has(namaKategori)) {
        categories.push({
          id: this.faker.string.uuid(),
          namaKategori: namaKategori,
          deskripsi: this.faker.commerce.productDescription(),
          status: "aktif",
        });

        // Add the category name to the set of used names
        usedCategories.add(namaKategori);
      }
    }

    return categories;
  }

  // Generate dummy suppliers (using faker)
  async generateSuppliers(branches, count = 10) {
    const suppliers = [];
    const usedSupplierNames = new Set();

    while (suppliers.length < count) {
      const companyName = this.faker.company.name();

      // Check if this supplier name has already been used
      if (!usedSupplierNames.has(companyName)) {
        // Select a random branch for this supplier
        const branch = this.faker.helpers.arrayElement(branches);

        suppliers.push({
          id: this.faker.string.uuid(),
          namaSupplier: companyName,
          alamat: this.faker.location.streetAddress(),
          telepon: this.faker.phone.number({ style: "national" }),
          email: this.faker.internet.email({
            firstName: companyName.split(" ")[0],
            lastName: "company",
          }),
          npwp: this.faker.string.numeric(15),
          picNama: this.faker.person.fullName(),
          picKontak: this.faker.phone.number({ style: "national" }),
          status: "aktif",
          cabang_id: branch.id,
        });

        // Add the supplier name to the set of used names
        usedSupplierNames.add(companyName);
      }
    }

    return suppliers;
  }

  // Generate dummy ProdukSupplier relationships (using faker)
  async generateProdukSuppliers(suppliers, productMasters, branches) {
    const produkSuppliers = [];
    // We'll create relationships for 70% of products
    const productsToUse = this.faker.helpers.arrayElements(
      productMasters,
      Math.ceil(productMasters.length * 0.7)
    );

    for (const product of productsToUse) {
      // How many suppliers for this product? (1-3)
      const supplierCount = this.faker.number.int({
        min: 1,
        max: Math.min(3, suppliers.length),
      });
      const selectedSuppliers = this.faker.helpers.arrayElements(
        suppliers,
        supplierCount
      );

      // First supplier is primary
      const primarySupplier = selectedSuppliers[0];

      // Create a record for each supplier
      for (let i = 0; i < selectedSuppliers.length; i++) {
        const supplier = selectedSuppliers[i];
        const branch = this.faker.helpers.arrayElement(branches);

        produkSuppliers.push({
          id: this.faker.string.uuid(),
          produkMasterId: product.id,
          supplierId: supplier.id,
          isPrimary: i === 0, // First supplier is primary
          hargaBeli: parseFloat(
            this.faker.commerce.price({ min: 1000, max: 50000 })
          ),
          minPembelian: this.faker.number.int({ min: 5, max: 50 }),
          leadTime: this.faker.number.int({ min: 1, max: 14 }),
          kodeProdukSupplier: this.faker.string.alphanumeric(10).toUpperCase(),
          status: "aktif",
          cabangId: branch.id,
        });
      }
    }

    return produkSuppliers;
  }

  // Generate dummy product masters (using faker)
  async generateProductMasters(categories, count = 100) {
    const productMasters = [];
    for (let i = 0; i < count; i++) {
      const category = this.faker.helpers.arrayElement(categories);
      productMasters.push({
        id: this.faker.string.uuid(),
        namaProduk: this.faker.commerce.productName(),
        sku: this.faker.string.alphanumeric(10),
        barcode: this.faker.string.numeric(13),
        deskripsi: this.faker.commerce.productDescription(),
        kategoriId: category.id,
        brand: this.faker.company.name(),
        satuan: this.faker.helpers.arrayElement(["pcs", "kg", "pack", "box"]),
        berat: parseFloat(this.faker.commerce.price({ min: 0.1, max: 10 })),
        isManagedStock: this.faker.datatype.boolean(),
        hasExpired: this.faker.datatype.boolean(),
        status: "aktif",
      });
    }
    return productMasters;
  }

  // Generate dummy products for branches (using faker)
  async generateProducts(branches, productMasters, count = 200) {
    const products = [];
    for (let i = 0; i < count; i++) {
      const branch = this.faker.helpers.arrayElement(branches);
      const productMaster = this.faker.helpers.arrayElement(productMasters);

      products.push({
        id: this.faker.string.uuid(),
        produkMasterId: productMaster.id,
        cabangId: branch.id,
        hargaBeli: parseFloat(
          this.faker.commerce.price({ min: 1000, max: 50000 })
        ),
        hargaJual: parseFloat(
          this.faker.commerce.price({ min: 5000, max: 100000 })
        ),
        hargaGrosir: parseFloat(
          this.faker.commerce.price({ min: 3000, max: 75000 })
        ),
        stok: this.faker.number.int({ min: 0, max: 500 }),
        minStok: this.faker.number.int({ min: 10, max: 50 }),
        maxStok: this.faker.number.int({ min: 100, max: 1000 }),
        status: "tersedia",
      });
    }
    return products;
  }

  // Generate dummy transactions
  async generateTransactions(branches, users, products, count = 200) {
    const transactions = [];
    const transactionDetails = [];

    for (let i = 0; i < count; i++) {
      const branch = this.faker.helpers.arrayElement(branches);
      const user = this.faker.helpers.arrayElement(users);
      const transactionId = this.faker.string.uuid();

      // Create transaction
      const subtotal = this.faker.number.float({ min: 50000, max: 1000000 });
      const diskon = this.faker.number.float({ min: 0, max: subtotal * 0.2 });
      const pajak = subtotal * 0.1;
      const biayaKirim = this.faker.number.float({ min: 1000, max: 5000 });

      const transaction = {
        transaksi_id: transactionId,
        cabang_id: branch.id,
        nomor_transaksi: `INV-${this.faker.string.alphanumeric(8)}`,
        jenis_transaksi: "PENJUALAN",
        tanggal: this.faker.date.recent({ days: 30 }),
        created_by_user_Id: user.id,
        created_by: user.namaLengkap,
        subtotal,
        diskon,
        pajak,
        total: subtotal - diskon + pajak + biayaKirim,
        biaya_tambahan: biayaKirim,
        status_pembayaran: "LUNAS",
      };
      transactions.push(transaction);

      // Create transaction details
      const detailCount = this.faker.number.int({ min: 1, max: 5 });
      for (let j = 0; j < detailCount; j++) {
        const product = this.faker.helpers.arrayElement(products);
        const quantity = this.faker.number.int({ min: 1, max: 10 });

        transactionDetails.push({
          transaksi_id: transactionId,
          produk_id: product.id,
          jumlah: quantity,
          harga_satuan: product.hargaJual,
          diskon_persen: this.faker.number.float({ min: 0, max: 20 }),
          diskon_nominal: this.faker.number.float({ min: 0, max: 50000 }),
          subtotal: product.hargaJual * quantity,
          pajak_persen: 10,
          total: product.hargaJual * quantity * 1.1,
        });
      }
    }

    return { transactions, transactionDetails };
  }

  // Generate base permissions
  generateBasePermissions() {
    const modules = [
      "cabang",
      "user",
      "produk_master",
      "produk",
      "role",
      "permission",
      "menu",
      "kategori",
      "supplier",
      "pelanggan",
      "inventory",
      "stock_transfer",
      "shift",
      "transaksi",
      "invoice",
      "notification",
      "produk_request",
      "dashboard",
    ];
    const actions = ["create", "read", "update", "delete"];
    const permissions = [];

    modules.forEach((module) => {
      actions.forEach((action) => {
        permissions.push({
          id: crypto.randomUUID(),
          name: `${module}:${action}`,
          module: module,
          action: action,
          description: `Can ${action} ${module}`,
          status: "aktif",
        });
      });
    });

    // Special manage permission
    modules.forEach((module) => {
      permissions.push({
        id: crypto.randomUUID(),
        name: `${module}:manage`,
        module: module,
        action: "manage",
        description: `Can manage everything in ${module}`,
        status: "aktif",
      });
    });

    return permissions;
  }

  // Main method to generate all dummy data
  async generateDummyData(useExcel = true, excelFilePath = null) {
    try {
      // Start transaction
      const result = await this.prisma.$transaction(
        async (tx) => {
          // Generate roles
          const roleData = [
            { id: crypto.randomUUID(), namaRole: "super_admin", displayName: "Super Administrator", deskripsi: "Super Administrator", is_system: true },
            { id: crypto.randomUUID(), namaRole: "admin_cabang", displayName: "Branch Admin", deskripsi: "Branch Administrator", is_system: true },
            { id: crypto.randomUUID(), namaRole: "kasir", displayName: "Cashier", deskripsi: "Cashier", is_system: true },
          ];

          await tx.role.createMany({ data: roleData });
          const existingRoles = await tx.role.findMany();

          // Generate permissions
          const permissions = this.generateBasePermissions();
          await tx.permission.createMany({ data: permissions });
          const existingPermissions = await tx.permission.findMany();

          // Assign permissions to roles
          const rolePermissions = [];
          const superAdmin = existingRoles.find((r) => r.namaRole === "super_admin");
          const adminCabang = existingRoles.find((r) => r.namaRole === "admin_cabang");
          const kasir = existingRoles.find((r) => r.namaRole === "kasir");

          existingPermissions.forEach((perm) => {
            // Super Admin gets everything
            rolePermissions.push({
              id: crypto.randomUUID(),
              roleId: superAdmin.id,
              permissionId: perm.id,
            });

            // Admin Cabang gets read/create/update on most modules
            if (
              !["role", "permission"].includes(perm.module) &&
              ["read", "create", "update"].includes(perm.action)
            ) {
              rolePermissions.push({
                id: crypto.randomUUID(),
                roleId: adminCabang.id,
                permissionId: perm.id,
              });
            }

            // Kasir gets limited permissions
            const kasirModules = ["transaksi", "invoice", "pelanggan", "produk", "shift", "inventory"];
            if (
              kasirModules.includes(perm.module) &&
              ["read", "create"].includes(perm.action)
            ) {
              rolePermissions.push({
                id: crypto.randomUUID(),
                roleId: kasir.id,
                permissionId: perm.id,
              });
            }
          });

          await tx.rolePermission.createMany({ data: rolePermissions });

          // Generate branches
          const branches = await this.generateBranches();
          console.log("🏢 Generated branches:", branches.length);

          // Generate users
          const { users, userRoles, userBranches } = await this.generateUsers(
            branches,
            existingRoles
          );
          console.log("👥 Generated users:", users.length);

          let categories, productMasters, products, suppliers, produkSuppliers;

          // Either generate products from Excel or use faker
          if (useExcel && excelFilePath) {
            console.log(`🔍 Using Excel data from: ${excelFilePath}`);

            // Read products from Excel
            const excelProducts = await this.readProductsFromExcel(
              excelFilePath
            );

            // Generate categories from Excel data
            categories = await this.generateCategoriesFromExcel(excelProducts);

            // Generate suppliers from Excel data
            suppliers = await this.generateSuppliersFromExcel(
              excelProducts,
              branches
            );

            // Generate product masters and products in batches
            const productData = await this.generateProductsFromExcel(
              excelProducts,
              categories,
              branches,
              suppliers
            );
            productMasters = productData.productMasters;
            products = productData.products;
            produkSuppliers = productData.produkSuppliers;
          } else {
            console.log("🎲 Using faker to generate product data");
            categories = await this.generateCategories();
            suppliers = await this.generateSuppliers(branches, 10); // Generate 10 suppliers with faker
            productMasters = await this.generateProductMasters(categories);
            products = await this.generateProducts(branches, productMasters);
            produkSuppliers = await this.generateProdukSuppliers(
              suppliers,
              productMasters,
              branches
            );
          }

          console.log("📦 Generated categories:", categories.length);
          console.log("🏢 Generated suppliers:", suppliers.length);
          console.log("📦 Generated product masters:", productMasters.length);
          console.log("📦 Generated branch products:", products.length);
          console.log(
            "🔗 Generated product-supplier relationships:",
            produkSuppliers.length
          );

          // Generate transactions
          const { transactions, transactionDetails } =
            await this.generateTransactions(branches, users, products);
          console.log("💰 Generated transactions:", transactions.length);

          // Bulk insert data
          await tx.cabang.createMany({ data: branches });
          await tx.user.createMany({ data: users });
          await tx.userRole.createMany({ data: userRoles });
          await tx.userCabang.createMany({ data: userBranches });
          await tx.kategori.createMany({ data: categories });
          await tx.supplier.createMany({ data: suppliers });
          await tx.produkMaster.createMany({ data: productMasters });
          await tx.produk.createMany({ data: products });
          await tx.produkSupplier.createMany({ data: produkSuppliers });
          await tx.transaksi.createMany({ data: transactions });
          await tx.transaksiDetail.createMany({ data: transactionDetails });

          return {
            branches,
            users,
            categories,
            suppliers,
            productMasters,
            products,
            produkSuppliers,
            transactions,
            transactionDetails,
          };
        },
        {
          maxWait: 10000, // 10 seconds max wait to connect to prisma
          timeout: 120000, // 2 minutes timeout for large data processing
        }
      );

      console.log("✅ Dummy data generated successfully");
      console.log("\n📋 Predefined User Credentials:");
      console.log("1. Super Admin:");
      console.log("   Username: superadmin");
      console.log("   Password: superadmin");
      console.log("2. Branch Admin:");
      console.log("   Username: admincabang");
      console.log("   Password: admincabang");
      console.log("3. Cashier:");
      console.log("   Username: kasir");
      console.log("   Password: kasir");

      return result;
    } catch (error) {
      console.error("❌ Error generating dummy data:", error);
      throw error;
    }
  }
}

// Export the generator
module.exports = DummyDataGenerator;
