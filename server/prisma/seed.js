#!/usr/bin/env node
const { PrismaClient } = require("@prisma/client");
const DummyDataGenerator = require("../src/utils/dummyData");
const path = require("path");

async function seedDatabase() {
  const prisma = new PrismaClient();

  try {
    console.log("🌱 Starting database seeding...");

    // Clear existing data (be careful in production!)
    console.log("🧹 Clearing existing data...");
    
    // Most dependent tables first
    await prisma.contentAnalytics.deleteMany();
    await prisma.marketingContent.deleteMany();
    await prisma.marketingChannel.deleteMany();
    await prisma.campaignAnalytics.deleteMany();
    await prisma.customerCampaignInteraction.deleteMany();
    await prisma.marketingCampaign.deleteMany();
    
    await prisma.kreditNotifikasi.deleteMany();
    await prisma.pembayaranKredit.deleteMany();
    await prisma.kreditTransaksi.deleteMany();
    await prisma.kreditSetting.deleteMany();
    await prisma.kreditRekomendasi.deleteMany();
    await prisma.kreditNotifikasi.deleteMany();
    
    await prisma.pembayaranHutang.deleteMany();
    await prisma.hutang.deleteMany();
    
    await prisma.loyaltyPointHistory.deleteMany();
    await prisma.stockNotification.deleteMany();
    await prisma.notificationConfig.deleteMany();
    await prisma.receiptConfig.deleteMany();
    await prisma.taxConfig.deleteMany();
    await prisma.auditLog.deleteMany();
    
    await prisma.pembayaran.deleteMany();
    await prisma.transaksiDetail.deleteMany();
    await prisma.transaksi.deleteMany();
    
    await prisma.inventoryMovement.deleteMany();
    await prisma.stockTransferDetail.deleteMany();
    await prisma.stockTransfer.deleteMany();
    
    await prisma.produkRequestAttachment.deleteMany();
    await prisma.produkRequestItem.deleteMany();
    await prisma.produkRequest.deleteMany();
    
    await prisma.produkSupplier.deleteMany();
    await prisma.produkPriceHistory.deleteMany();
    await prisma.produkImage.deleteMany();
    await prisma.produk.deleteMany();
    await prisma.produkMaster.deleteMany();
    
    await prisma.userSession.deleteMany();
    await prisma.userRole.deleteMany();
    await prisma.userCabang.deleteMany();
    await prisma.rolePermission.deleteMany();
    await prisma.permission.deleteMany();
    await prisma.roleMenu.deleteMany();
    
    await prisma.promoDiskon.deleteMany();
    await prisma.kategori.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.pelanggan.deleteMany();
    
    await prisma.shift.deleteMany();
    await prisma.absensiPegawai.deleteMany();
    await prisma.jadwalKerja.deleteMany();
    await prisma.operationalHours.deleteMany();
    await prisma.lokasiAbsensi.deleteMany();
    await prisma.botOrder.deleteMany();
    await prisma.botSession.deleteMany();
    await prisma.botConfig.deleteMany();
    
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();
    await prisma.cabang.deleteMany();

    console.log("🚀 Generating dummy data...");
    const generator = new DummyDataGenerator();

    // Set the path to your Excel file
    const excelFilePath = path.join(__dirname, "../data_product2.xlsx");

    // Generate dummy data using Excel file for products
    const dummyData = await generator.generateDummyData(true, excelFilePath);

    console.log("✅ Seeding complete!");
    console.log("Summary:");
    console.log(`- Branches: ${dummyData.branches.length}`);
    console.log(`- Users: ${dummyData.users.length}`);
    console.log(`- Categories: ${dummyData.categories.length}`);
    console.log(`- Product Masters: ${dummyData.productMasters.length}`);
    console.log(`- Products: ${dummyData.products.length}`);
    console.log(`- Transactions: ${dummyData.transactions.length}`);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase();
