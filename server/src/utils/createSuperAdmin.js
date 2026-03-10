const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { logger } = require("./logger");

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    logger.info("Starting super admin user creation...");

    // 1. Create a "super_admin" role if it doesn't exist
    const superAdminRole = await prisma.role.upsert({
      where: { namaRole: "super_admin" },
      update: {},
      create: {
        namaRole: "super_admin",
        deskripsi: "Role dengan akses penuh ke seluruh fitur sistem",
      },
    });
    logger.info("Super Admin role created or found:", superAdminRole.id);

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
    logger.info("Pusat branch created or found:", pusatBranch.id);

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
    logger.info("Super admin user created or found:", superAdmin.id);

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
    logger.info("User-branch relationship created or found:", userCabang.id);

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
    logger.info("User-role relationship created or found:", userRole.id);

    logger.info("Super admin user setup completed successfully!");
    logger.info("-------------------------------------");
    logger.info("Login credentials:");
    logger.info("Username: superadmin");
    logger.info("Password: superadmin123");
    logger.info("-------------------------------------");
  } catch (error) {
    logger.error("Error creating super admin:", error);
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = { createSuperAdmin };
