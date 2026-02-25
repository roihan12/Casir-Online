const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fuzz = require('fuzzball');
const { ResponseError } = require("../error/responseError");

/**
 * Memetakan data hasil OCR dengan database
 * @param {Object} ocrData Data JSON hasil dari ocrService
 * @param {String} cabangId ID Cabang untuk scope pencarian produk
 * @returns {Object} Data hasil mapping dengan status tiap item
 */
const mapInvoiceData = async (ocrData, cabangId) => {
  if (!ocrData) {
    throw new ResponseError(400, "Data OCR tidak valid");
  }

  const { supplierName, tanggal, totalBayar, items } = ocrData;
  let supplierData = null;
  let supplierStatus = 'UNMAPPED'; // MAPPED, UNMAPPED (NEW_SUPPLIER)

  // 1. Identifikasi Supplier
  if (supplierName) {
    // Cari supplier berdasarkan nama (exact atau case-insensitive)
    const existingSupplier = await prisma.supplier.findFirst({
      where: {
        namaSupplier: {
          contains: supplierName,
          mode: 'insensitive'
        },
        status: 'aktif',
        deletedAt: null
      }
    });

    if (existingSupplier) {
      supplierData = existingSupplier;
      supplierStatus = 'MAPPED';
    } else {
      // Fuzzy search supplier jika belum ketemu dengan nama exact
      const allSuppliers = await prisma.supplier.findMany({
        where: { status: 'aktif', deletedAt: null },
        select: { id: true, namaSupplier: true }
      });
      
      if (allSuppliers.length > 0) {
        const supplierChoices = allSuppliers.map(s => s.namaSupplier);
        const bestMatch = fuzz.extract(supplierName, supplierChoices, { limit: 1 })[0];
        
        // bestMatch format: [matchedString, score, index]
        if (bestMatch && bestMatch[1] > 80) { // Threshold 80% untuk otomatis map supplier
          supplierData = allSuppliers[bestMatch[2]];
          supplierStatus = 'MAPPED';
        }
      }
    }
  }

  // Siapkan data produk master untuk fuzzy matching
  const allProdukMaster = await prisma.produkMaster.findMany({
    where: { status: 'aktif', deletedAt: null },
    select: { id: true, namaProduk: true, sku: true }
  });
  const produkChoices = allProdukMaster.map(p => p.namaProduk);

  // 2. Identifikasi Produk
  const mappedItems = [];
  
  if (items && items.length > 0) {
    for (const item of items) {
      let itemStatus = 'UNMAPPED';
      let mappedProduct = null;
      let suggestions = [];

      // Jika supplier terdeteksi, cek tabel mapping ProdukSupplier
      if (supplierData) {
        const existingMapping = await prisma.produkSupplier.findFirst({
          where: {
            supplierId: supplierData.id,
            kodeProdukSupplier: item.namaProduk,
            status: 'aktif'
          },
          include: {
            produkMaster: {
              select: { id: true, namaProduk: true, sku: true }
            }
          }
        });

        if (existingMapping) {
          itemStatus = 'MAPPED';
          mappedProduct = existingMapping.produkMaster;
        }
      }

      // Jika belum ter-map, lakukan Fuzzy Matching ke ProdukMaster
      if (itemStatus === 'UNMAPPED' && item.namaProduk && allProdukMaster.length > 0) {
        const fuzzyResults = fuzz.extract(item.namaProduk, produkChoices, { limit: 3 });
        
        // fuzzyResults format: [[string, score, index], ...]
        for (const result of fuzzyResults) {
          const score = result[1];
          const matchedProduk = allProdukMaster[result[2]];

          if (score === 100) {
            // Level 1: Exact Match
            // Kita bisa langsung anggap ini mapped, tapi untuk keamanan lebih baik tetap MAPPED_SUGGESTION
            // agar bisa disave mappingnya nanti
            itemStatus = 'SUGGESTED';
            suggestions.push({
              produk: matchedProduk,
              score: score,
              matchLevel: 'EXACT'
            });
          } else if (score >= 60) {
            // Level 2: Fuzzy Match
            itemStatus = 'SUGGESTED';
            suggestions.push({
              produk: matchedProduk,
              score: score,
              matchLevel: 'FUZZY'
            });
          }
        }
        
        // Urutkan suggestions berdasarkan score tertinggi
        suggestions.sort((a, b) => b.score - a.score);
      }

      mappedItems.push({
        rawInvoiceName: item.namaProduk,
        rawQuantity: item.quantity,
        rawHargaSatuan: item.hargaSatuan,
        rawSubtotal: item.subtotal,
        status: itemStatus, // MAPPED, SUGGESTED, UNMAPPED
        mappedProduct: mappedProduct,
        suggestions: suggestions
      });
    }
  }

  return {
    rawSupplierName: supplierName,
    tanggal: tanggal,
    totalBayar: totalBayar,
    supplierInfo: {
      status: supplierStatus,
      data: supplierData
    },
    items: mappedItems
  };
};

/**
 * Menyimpan mapping manual dari user ke database ProdukSupplier
 */
const saveMapping = async (supplierId, produkMasterId, namaInvoiceProduk, hargaBeli, userId, cabangId) => {
  // Cek apakah produk master ada
  const produkMaster = await prisma.produkMaster.findUnique({
    where: { id: produkMasterId }
  });

  if (!produkMaster) {
    throw new ResponseError(404, "Produk master internal tidak ditemukan");
  }

  // Upsert mapping ProdukSupplier
  const existingMapping = await prisma.produkSupplier.findFirst({
    where: {
      supplierId: supplierId,
      produkMasterId: produkMasterId,
      kodeProdukSupplier: namaInvoiceProduk
    }
  });

  if (existingMapping) {
    return existingMapping; // Sudah ada
  }

  const newMapping = await prisma.produkSupplier.create({
    data: {
      produkMasterId,
      supplierId,
      kodeProdukSupplier: namaInvoiceProduk,
      hargaBeli: hargaBeli || 0,
      isPrimary: false,
      status: 'aktif',
      cabangId: cabangId,
      created_by_user_Id: userId,
      updated_by_user_Id: userId
    }
  });

  return newMapping;
};

module.exports = {
  mapInvoiceData,
  saveMapping
};
