const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    console.log("Starting super admin user creation...");

    // 1. Create a "super_admin" role if it doesn't exist
    const superAdminRole = await prisma.role.upsert({
      where: { namaRole: "super_admin" },
      update: {},
      create: {
        namaRole: "super_admin",
        deskripsi: "Role dengan akses penuh ke seluruh fitur sistem",
      },
    });
    console.log("Super Admin role created or found:", superAdminRole.id);

    // 2. Create a default "Pusat" branch if it doesn't exist
    const pusatBranch = await prisma.cabang.upsert({
      where: {
        id:
          process.env.PUSAT_BRANCH_ID || "00000000-0000-0000-0000-000000000001",
      },
      update: {},
      create: {
        id:
          process.env.PUSAT_BRANCH_ID || "00000000-0000-0000-0000-000000000001",
        namaCabang: "Kantor Pusat",
        alamat: "Alamat Kantor Pusat",
        telepon: "021-12345678",
        status: "aktif",
      },
    });
    console.log("Pusat branch created or found:", pusatBranch.id);

    // 3. Create the super admin user
    const hashedPassword = await bcrypt.hash("superadmin123", 10);

    const superAdmin = await prisma.user.upsert({
      where: { username: "superadmin" },
      update: {},
      create: {
        username: "superadmin",
        password: hashedPassword,
        namaLengkap: "Super Administrator",
        email: "superadmin@example.com",
        telepon: "08123456789",
        status: "aktif",
      },
    });
    console.log("Super admin user created or found:", superAdmin.id);

    // 4. Link the user to the branch (UserCabang)
    const userCabang = await prisma.userCabang.upsert({
      where: {
        id:
          process.env.USER_CABANG_ID || "00000000-0000-0000-0000-000000000001",
      },
      update: {
        isPrimary: true,
      },
      create: {
        id:
          process.env.USER_CABANG_ID || "00000000-0000-0000-0000-000000000001",
        userId: superAdmin.id,
        cabangId: pusatBranch.id,
        isPrimary: true,
      },
    });
    console.log("User-branch relationship created or found:", userCabang.id);

    // 5. Assign the Super Admin role to the user (UserRole)
    const userRole = await prisma.userRole.upsert({
      where: {
        id: process.env.USER_ROLE_ID || "00000000-0000-0000-0000-000000000001",
      },
      update: {},
      create: {
        id: process.env.USER_ROLE_ID || "00000000-0000-0000-0000-000000000001",
        userId: superAdmin.id,
        roleId: superAdminRole.id,
        cabangId: pusatBranch.id,
      },
    });
    console.log("User-role relationship created or found:", userRole.id);

    console.log("Super admin user setup completed successfully!");
    console.log("-------------------------------------");
    console.log("Login credentials:");
    console.log("Username: superadmin");
    console.log("Password: superadmin123");
    console.log("-------------------------------------");
  } catch (error) {
    console.error("Error creating super admin:", error);
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = { createSuperAdmin };
