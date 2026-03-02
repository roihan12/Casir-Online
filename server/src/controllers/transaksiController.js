const transaksiService = require("../services/transaksiService");
const { ResponseError } = require("../error/responseError");
const { validate } = require("../validation/validation");
const {
  createTransaksiValidation,
  createPembayaranValidation,
  qrisPaymentValidation,
  updateQrisStatusValidation,
  getTransaksiListValidation,
  createKreditTransaksiValidation,
  previewDiscountValidation,
  updateOnlineOrderStatusValidation,
} = require("../validation/transaksiValidation");

// Controller untuk membuat transaksi baru
const createTransaksi = async (req, res, next) => {
  try {
    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip || req.socket.remoteAddress,
      userName: req.user.username,
    };
    const request = validate(createTransaksiValidation, req.body);

    const result = await transaksiService.createTransaksi(request, auditInfo);

    res.status(201).json({
      status: true,
      message: "Transaksi berhasil dibuat",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk membuat transaksi dengan promo codes
const createTransaksiWithPromo = async (req, res, next) => {
  try {
    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip || req.socket.remoteAddress,
      userName: req.user.username,
    };
    const request = validate(createTransaksiValidation, req.body);

    const result = await transaksiService.createTransaksiWithPromo(request, auditInfo);

    res.status(201).json({
      status: true,
      message: "Transaksi dengan promo berhasil dibuat",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk mendapatkan detail transaksi
const getTransaksiById = async (req, res, next) => {
  try {
    const transaksiId = req.params.id;

    if (!transaksiId) {
      throw new ResponseError(400, "ID transaksi diperlukan");
    }

    const result = await transaksiService.getTransaksiById(transaksiId);

    res.status(200).json({
      status: true,
      message: "Berhasil mendapatkan detail transaksi",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk mendapatkan daftar transaksi
const getTransaksiList = async (req, res, next) => {
  try {
    const filters = validate(getTransaksiListValidation, {
      cabang_id: req.query.cabangId,
      jenis_transaksi: req.query.jenisTransaksi,
      status_pembayaran: req.query.statusPembayaran,
      pelanggan_id: req.query.pelangganId,
      supplier_id: req.query.supplierId,
      user_id: req.query.userId,
      tanggal_mulai: req.query.startDate,
      tanggal_akhir: req.query.endDate,
      search: req.query.search,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
    });

    const result = await transaksiService.getTransaksiList(filters);

    res.status(200).json({
      status: true,
      message: "Berhasil mendapatkan daftar transaksi",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk menambahkan pembayaran
const addPembayaran = async (req, res, next) => {
  try {
    const request = validate(createPembayaranValidation, req.body);

    // Get user information for audit log
    const userId = req.user.id;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userName = req.user.namaLengkap;

    const result = await transaksiService.addPembayaran(request, {
      userId,
      ipAddress,
      userName,
    });

    res.status(200).json({
      status: true,
      message: "Pembayaran berhasil ditambahkan",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk membuat pembayaran QRIS
const createQrisPayment = async (req, res, next) => {
  try {
    const request = validate(qrisPaymentValidation, req.body);

    // Get user information for audit log
    const userId = req.user.id;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userName = req.user.namaLengkap;

    const result = await transaksiService.createQrisPayment(request, {
      userId,
      ipAddress,
      userName,
    });

    res.status(200).json({
      status: true,
      message: "Pembayaran QRIS berhasil dibuat",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk callback update status QRIS
const updateQrisStatus = async (req, res, next) => {
  try {
    const request = validate(updateQrisStatusValidation, req.body);

    const userId = req.user.id;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userName = req.user.namaLengkap;

    const result = await transaksiService.updateQrisPaymentStatus(request, {
      userId,
      ipAddress,
      userName,
    });

    res.status(200).json({
      status: true,
      message: "Status pembayaran QRIS berhasil diupdate",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk membatalkan transaksi
const cancelTransaksi = async (req, res, next) => {
  try {
    const transaksiId = req.params.id;
    const { alasan } = req.body;

    if (!alasan) {
      throw new ResponseError(400, "Alasan pembatalan diperlukan");
    }

    // Get user information for audit log
    const userId = req.user.id;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const result = await transaksiService.cancelTransaksi(transaksiId, alasan, {
      userId,
      ipAddress,
    });

    res.status(200).json({
      status: true,
      message: "Transaksi berhasil dibatalkan",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk laporan penjualan
const getSalesReport = async (req, res, next) => {
  try {
    const filters = {
      cabang_id: req.query.cabang_id,
      periode: req.query.periode || "daily",
      tanggal_mulai: req.query.tanggal_mulai,
      tanggal_akhir: req.query.tanggal_akhir,
      kasir_id: req.query.kasir_id,
      produk_id: req.query.produk_id,
      kategori_id: req.query.kategori_id,
      payment_method: req.query.payment_method,
      include_details: req.query.include_details === "true",
    };

    const result = await transaksiService.getSalesReport(filters);

    res.status(200).json({
      status: true,
      message: "Berhasil mendapatkan laporan penjualan",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk mendapatkan rekomendasi pembayaran kredit untuk transaksi
const getKreditPaymentRecommendation = async (req, res, next) => {
  try {
    const transaksiId = req.params.id;
    
    if (!transaksiId) {
      throw new ResponseError(400, "ID transaksi diperlukan");
    }
    
    const result = await transaksiService.getKreditPaymentRecommendation(transaksiId);
    
    res.status(200).json({
      status: true,
      message: "Berhasil mendapatkan rekomendasi pembayaran kredit",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk membuat transaksi kredit
const createKreditTransaction = async (req, res, next) => {
  try {
    const request = validate(createKreditTransaksiValidation, req.body);
    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip || req.socket.remoteAddress,
      userName: req.user.username,
    };
    
    const result = await transaksiService.createKreditTransaction(request, auditInfo);
    
    res.status(201).json({
      status: true,
      message: "Transaksi kredit berhasil dibuat",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk preview promo codes
const previewPromo = async (req, res, next) => {
  try {
    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip || req.socket.remoteAddress,
      userName: req.user.namaLengkap || req.user.username,
    };

    const result = await transaksiService.previewPromo(req.body, auditInfo);

    res.status(200).json({
      status: true,
      message: "Promo preview berhasil",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk preview semua diskon (promo + member + manual)
const previewAllDiscounts = async (req, res, next) => {
  try {
    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip || req.socket.remoteAddress,
      userName: req.user.namaLengkap || req.user.username,
    };

    const request = validate(previewDiscountValidation, req.body);

    const result = await transaksiService.previewAllDiscounts(request, auditInfo);

    res.status(200).json({
      status: true,
      message: "Discount preview berhasil",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};



// Controller untuk generate PDF Retur
const generateReturnPdf = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!id) {
       throw new ResponseError(400, "ID Retur diperlukan");
    }

    // Reuse existing service to get details
    const returnData = await transaksiService.getTransaksiById(id);
    
    if (!returnData) {
      throw new ResponseError(404, "Data retur tidak ditemukan");
    }

    // Get Original Transaction if exists (usually stored in keterangan or we can search by ref)
    // The current service might not link it directly as a relation in Prisma schema depending on implementation
    // But let's check if we can parse it from keterangan "Transaksi Asli: xxx" if not explicitly linked
    // Or we rely on what's available.
    
    // Prepare template data
    // Helper to format date
    const formatDate = (date) => {
      if (!date) return '-';
      return new Date(date).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const formatCurrency = (val) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      }).format(val || 0);
    };

    // Determine party (Customer or Supplier)
    let party = null;
    if (returnData.type === 'RETUR_PENJUALAN' && returnData.customerInfo) {
        party = {
            nama: returnData.customerInfo.nama || returnData.customerInfo.namaPelanggan || returnData.customerInfo.name,
            alamat: returnData.customerInfo.alamat || '-',
            telepon: returnData.customerInfo.telepon || returnData.customerInfo.phone || '-'
        };
    } else if (returnData.type === 'RETUR_PEMBELIAN' && returnData.supplierInfo) {
        party = {
            nama: returnData.supplierInfo.nama || returnData.supplierInfo.namaSupplier || returnData.supplierInfo.name,
            alamat: returnData.supplierInfo.alamat || '-',
            telepon: returnData.supplierInfo.telepon || '-'
        };
    }

    console.log("RETURN DATA", returnData)

    // Map items
    const items = returnData.items.map(item => ({
        namaProduk: item.name,
        sku: item.sku || '-',
        jumlah: item.quantity,
        hargaSatuan: item.price,
        subtotal: item.subtotal,
        kondisi: 'Baik', // Default
        alasan: item.alasan || null // If stored in detailed field
    }));

    // Map payments
    const payments = returnData.payments.map(payment => ({
        metode: payment.method.replace('_', ' '),
        jumlah: payment.amount, 
        tanggal: payment.date
    }));
    
    // Try to find original transaction info from text
    // Example Keterangan: "Alasan: test | Transaksi Asli: TRX-123 | ..."
    let originalTransaction = null;
    if (returnData.notes && returnData.notes.includes('Transaksi Asli:')) {
        const parts = returnData.notes.split('|');
        const refPart = parts.find(p => p.trim().startsWith('Transaksi Asli:'));
        if (refPart) {
            const refNo = refPart.split(':')[1].trim();
            originalTransaction = { nomor_transaksi: refNo, tanggal: null };
        }
    }

    // Template Data Object
    const templateData = {
        language: 'id',
        returnData,
        party,
        items,
        payments,
        originalTransaction,
        formatDate,
        formatCurrency
    };

    const path = require('path');
    const fs = require('fs');
    const ejs = require('ejs');
    const puppeteer = require('puppeteer');
    
    const templatePath = path.join(__dirname, "../../templates/return_template.ejs");
    
    if (!fs.existsSync(templatePath)) {
        throw new ResponseError(500, "Template retur tidak ditemukan");
    }

    const html = await ejs.renderFile(templatePath, templateData);

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    try {
        const page = await browser.newPage();
        await page.setContent(html);
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
        });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="return-${returnData.nomor_transaksi}.pdf"`);
        
        return res.send(Buffer.from(pdfBuffer));
    } finally {
        await browser.close();
    }
  } catch (error) {
    next(error);
  }
};

// Controller untuk generate Template PO
const generatePOTemplate = async (req, res, next) => {
  try {
    const { cabangId } = req.query;
    let cabangName = '';
    let cabangAddress = '';
    
    // Get cabang info if provided
    if (cabangId) {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      const cabang = await prisma.cabang.findUnique({
        where: { id: cabangId }
      });
      if (cabang) {
        cabangName = cabang.namaCabang;
        cabangAddress = cabang.alamat || '';
      }
    }

    const path = require('path');
    const fs = require('fs');
    const ejs = require('ejs');
    const puppeteer = require('puppeteer');
    
    const templatePath = path.join(__dirname, "../../templates/po_template.ejs");
    
    if (!fs.existsSync(templatePath)) {
        throw new ResponseError(500, "Template PO tidak ditemukan");
    }

    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const tanggalHariIni = new Date().toLocaleDateString('id-ID', options);

    const html = await ejs.renderFile(templatePath, {
      cabangName,
      cabangAddress,
      tanggalHariIni
    });

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    try {
        const page = await browser.newPage();
        await page.setContent(html);
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
        });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Template_PO_${Date.now()}.pdf"`);
        
        return res.send(Buffer.from(pdfBuffer));
    } finally {
        await browser.close();
    }
  } catch (error) {
    next(error);
  }
};

// Controller untuk generate PDF PO dari Transaksi
const generatePOFromTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!id) {
       throw new ResponseError(400, "ID Transaksi diperlukan");
    }

    // Reuse existing service to get details
    const transaction = await transaksiService.getTransaksiById(id);
    
    if (!transaction || transaction.type !== 'PEMBELIAN') {
      throw new ResponseError(404, "Data transaksi pembelian tidak ditemukan");
    }

    const path = require('path');
    const fs = require('fs');
    const ejs = require('ejs');
    const puppeteer = require('puppeteer');
    
    const templatePath = path.join(__dirname, "../../templates/po_transaction_template.ejs");
    
    if (!fs.existsSync(templatePath)) {
        throw new ResponseError(500, "Template PO Transaksi tidak ditemukan");
    }

    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const tanggalHariIni = new Date(transaction.date).toLocaleDateString('id-ID', options);

    // Map necessary fields
    const formatCurrency = (val) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      }).format(val || 0);
    };

    const items = transaction.items.map(item => ({
        namaProduk: item.name,
        sku: item.sku || '-',
        jumlah: item.quantity,
        hargaSatuan: item.price,
        subtotal: item.subtotal,
    }));

    console.log(transaction);

    const html = await ejs.renderFile(templatePath, {
      cabangName: transaction.branchName || 'Cabang',
      cabangAddress: transaction.branchAddress || '',
      tanggalHariIni,
      supplierName: transaction.supplierInfo?.name || transaction.supplierInfo?.namaSupplier || '',
      supplierAddress: transaction.supplierInfo?.alamat || '-',
      supplierPhone: transaction.supplierInfo?.contact || transaction.supplierInfo?.telepon || '-',
      transaction: {
         nomor_transaksi: transaction.number,
         kasir: transaction.cashierName,
         subtotal: transaction.subtotal,
         diskon: transaction.discount,
         pajak: transaction.tax,
         biaya_tambahan: transaction.additionalFee,
         total: transaction.total,
         keterangan: transaction.notes,
         status_pembayaran: transaction.status,
      },
      items,
      formatCurrency
    });

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    try {
        const page = await browser.newPage();
        await page.setContent(html);
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
        });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="PO-${transaction.number}.pdf"`);
        
        return res.send(Buffer.from(pdfBuffer));
    } finally {
        await browser.close();
    }
  } catch (error) {
    next(error);
  }
};

// Controller untuk update status order online oleh Admin
const updateOnlineOrderStatus = async (req, res, next) => {
  try {
    const transaksiId = req.params.id;
    const request = validate(updateOnlineOrderStatusValidation, req.body);
    
    // Ensure the params ID matches the body ID
    if (transaksiId !== request.transaksi_id) {
       throw new ResponseError(400, "ID Transaksi pada URL dan Body tidak cocok");
    }

    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip || req.socket.remoteAddress,
      userName: req.user.username,
    };

    const result = await transaksiService.updateOnlineOrderStatus(transaksiId, request, auditInfo);

    res.status(200).json({
      status: true,
      message: `Status order online berhasil diupdate menjadi ${request.order_status}`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTransaksi,
  createTransaksiWithPromo,
  getTransaksiById,
  getTransaksiList,
  addPembayaran,
  createQrisPayment,
  updateQrisStatus,
  cancelTransaksi,
  getSalesReport,
  getKreditPaymentRecommendation,
  createKreditTransaction,
  previewPromo,
  previewAllDiscounts,
  generateReturnPdf,
  generatePOTemplate,
  generatePOFromTransaction,
  updateOnlineOrderStatus,
};

