const prisma = require("../config/db");
const { withRls } = require("../config/db");
const { ResponseError } = require("../error/responseError");
const fs = require("fs");
const path = require("path");
const ejs = require("ejs");
const puppeteer = require("puppeteer");
const qrcode = require("qrcode");
const nodemailer = require("nodemailer");
const whatsappService = require("./whatsappService");


/**
 * Update receipt configuration for a branch
 * @param {string} cabangId - Branch ID
 * @param {Object} request - Update data

/**
 * Get or create a receipt configuration for a branch
 * @param {string} cabangId - Branch ID
 * @returns {Promise<Object>} - Receipt configuration
 */
const getOrCreateReceiptConfig = async (cabangId) => {
  // Check if branch exists
  const cabang = await prisma.cabang.findUnique({
    where: { id: cabangId },
  });

  if (!cabang) {
    throw new ResponseError(404, "Cabang tidak ditemukan");
  }

  // Find existing receipt configuration
  let config = await prisma.receiptConfig.findFirst({
    where: { cabangId },
  });

  // If none exists, create default configuration
  if (!config) {
    config = await prisma.receiptConfig.create({
      data: {
        cabangId,
        headerText: `${cabang.namaCabang || "Toko Kami"}`,
        footerText: "Terima kasih telah berbelanja",
        showTaxDetails: true,
        showCashierName: true,
        printPaperWidth: 80, // 80mm default
        printAutomatically: false,
        thankYouMessage: "Terima kasih atas kunjungan Anda!",
        address: cabang.alamat || "",
        phoneNumber: cabang.telepon || "",
        showQrCode: true,
      },
    });
  }

  return config;
};

/**
 * Get transaction data formatted for receipt generation
 * @param {string} transaksiId - Transaction ID
 * @returns {Promise<Object>} - Formatted transaction data
 */
const getTransactionDataForReceipt = async (transaksiId) => {
  // Get complete transaction data with all related info using raw query
  const result = await withRls(tx => tx.$queryRaw`
     SELECT
  t.transaksi_id,
  t.nomor_transaksi,
  t.tanggal,
  t.jenis_transaksi,
  t.status_pembayaran,
  t.subtotal,
  t.diskon,
  t.pajak,
  t.biaya_tambahan,
  t.total,
  t.keterangan,
  t.cabang_id,
  t.pelanggan_id,
  t.supplier_id,
  t.created_by,
  t.shift_id,
  -- Discount breakdown
  t.diskon_member,
  t.diskon_manual_persen,
  t.diskon_manual_nominal,
  t.diskon_manual_alasan,
  t.total_diskon_final,
  pb.metode_pembayaran,
  -- Cabang data
  c.nama_cabang as "cabang_nama",
  c.alamat as "cabang_alamat",
  c.telepon as "cabang_telepon",
  -- Pelanggan data
  p.pelanggan_id,
  p.nama_pelanggan as "pelanggan_nama",
  p.telepon as "pelanggan_telepon",
  p.email as "pelanggan_email",
  p.poin as "pelanggan_poin",
  -- Created by user
  u."user_id",
  u.nama_lengkap as "user_nama",
  -- Shift data
  s.shift_id as "shift_id",
--  s.nama as "shift_nama",
  -- Kredit Transaksi data (single row)
  kt.kredit_transaksi_id as "kredit_id",
  kt.jumlah_kredit,
  kt.tenor as "durasi_bulan",
  kt.bunga,
  kt.biaya_admin,
  kt.total_bayar as "kredit_total_pembayaran",
  kt.angsuran_per_bulan,
  kt.tanggal_mulai as "kredit_tanggal_mulai",
  kt.tanggal_jatuh_tempo as "kredit_tanggal_jatuh_tempo",
  kt."statusKredit" as "kredit_status"
FROM transaksi t
left join pembayaran pb on t.transaksi_id = pb.transaksi_id 	
LEFT JOIN cabang c ON t.cabang_id = c.cabang_id
LEFT JOIN pelanggan p ON t.pelanggan_id = p.pelanggan_id
LEFT JOIN "user" u ON t.created_by_user_id = u.user_id 
LEFT JOIN shift s ON t.shift_id = s.shift_id
LEFT JOIN kredit_transaksi kt ON t.transaksi_id = kt.transaksi_id
WHERE t.transaksi_id = ${transaksiId}
LIMIT 1
  `);

  if (!result || result.length === 0) {
    throw new ResponseError(404, "Transaksi tidak ditemukan");
  }

  const transaksi = result[0];

  // Get transaction details with products
  const details = await withRls(tx => tx.$queryRaw`
    SELECT
      td."transaksi_detail_id",
      td.jumlah,
      td.harga_satuan,
      td.diskon_nominal,
      td.diskon_persen,
      td.subtotal,
      td.pajak_persen,
      td.total,
      prod.produk_id,
      pm."nama_produk" as "produk_nama"
    FROM transaksi_detail td
    LEFT JOIN produk prod ON td.produk_id = prod.produk_id
    LEFT JOIN produk_master pm ON prod.produk_master_id = pm.produk_master_id
    WHERE td.transaksi_id = ${transaksiId}
  `);

  // Get payments
  const payments = await withRls(tx => tx.$queryRaw`
    SELECT
      p."pembayaran_id",
      p.metode_pembayaran,
      p.provider,
      p.nomor_referensi,
      p.jumlah_bayar,
      p.jumlah_kembali,
      p.tanggal_pembayaran,
      p.status,
      p."bukti_bayar_url"
    FROM pembayaran p
    WHERE p.transaksi_id = ${transaksiId}::VARCHAR
  `);

  // Get transaction promos
  const promos = await withRls(tx => tx.$queryRaw`
    SELECT
      tp.transaksi_id,
      tp.promo_id,
      tp.total_diskon,
      pr.kode_promo,
      pr.nama_promo,
      pr.tipe_diskon
    FROM transaksi_promo tp
    LEFT JOIN promo_diskon pr ON tp.promo_id = pr.promo_id 
    WHERE tp.transaksi_id = ${transaksiId}
  `);

  // Build transaksi object from raw query results
  const transaksiObj = {
    transaksi_id: transaksi.transaksi_id,
    nomor_transaksi: transaksi.nomor_transaksi,
    tanggal: transaksi.tanggal,
    jenis_transaksi: transaksi.jenis_transaksi,
    metode_pembayaran: transaksi.metode_pembayaran,
    status_pembayaran: transaksi.status_pembayaran,
    subtotal: transaksi.subtotal,
    diskon: transaksi.diskon,
    pajak: transaksi.pajak,
    biaya_tambahan: transaksi.biaya_tambahan,
    total: transaksi.total,
    keterangan: transaksi.keterangan,
    cabang_id: transaksi.cabang_id,
    pelanggan_id: transaksi.pelanggan_id,
    supplier_id: transaksi.supplier_id,
    created_by: transaksi.created_by,
    shift_id: transaksi.shift_id,
    // Discount breakdown
    diskon_member: transaksi.diskon_member,
    diskon_manual_persen: transaksi.diskon_manual_persen,
    diskon_manual_nominal: transaksi.diskon_manual_nominal,
    diskon_manual_alasan: transaksi.diskon_manual_alasan,
    total_diskon_final: transaksi.total_diskon_final,
    // Related objects
    cabang: {
      id: transaksi.cabang_id,
      namaCabang: transaksi.cabang_nama,
      alamat: transaksi.cabang_alamat,
      telepon: transaksi.cabang_telepon,
    },
    pelanggan: transaksi.pelanggan_id ? {
      id: transaksi.pelanggan_id,
      namaPelanggan: transaksi.pelanggan_nama,
      telepon: transaksi.pelanggan_telepon,
      email: transaksi.pelanggan_email,
      poin: transaksi.pelanggan_poin,
    } : null,
    createdByUser: transaksi.user_id ? {
      id: transaksi.user_id,
      namaLengkap: transaksi.user_nama,
    } : null,
    shift: transaksi.shift_id ? {
      shift_id: transaksi.shift_id,
      nama: transaksi.shift_nama,
    } : null,
    transaksi_detail: details.map(d => ({
      transaksi_detail_id: d.transaksi_detail_id,
      jumlah: d.jumlah,
      harga_satuan: d.harga_satuan,
      diskon_nominal: d.diskon_nominal,
      diskon_persen: d.diskon_persen,
      subtotal: d.subtotal,
      pajak_persen: d.pajak_persen,
      total: d.total,
      produk: {
        id: d.produk_id,
        produkMaster: {
          namaProduk: d.produk_nama,
        },
      },
    })),
    pembayaran: payments,
    transaksi_promo: promos.map(p => ({
      transaksi_id: p.transaksi_id,
      promo_id: p.promo_id,
      total_diskon: p.total_diskon,
      promo: {
        kode_promo: p.kode_promo,
        nama_promo: p.nama_promo,
        tipe_diskon: p.tipe_diskon,
      },
    })),
    cicilanKredit: transaksi.cicilan_id ? {
      id: transaksi.cicilan_id,
      jumlah_cicilan: transaksi.jumlah_cicilan,
      durasi_bulan: transaksi.durasi_bulan,
      bunga_persen: transaksi.bunga_persen,
      biaya_admin: transaksi.biaya_admin,
      uang_muka: transaksi.uang_muka,
      sisa_pembayaran: transaksi.sisa_pembayaran,
      total_pembayaran: transaksi.cicilan_total_pembayaran,
      tanggal_mulai: transaksi.cicilan_tanggal_mulai,
      tanggal_jatuh_tempo: transaksi.cicilan_tanggal_jatuh_tempo,
      status: transaksi.cicilan_status,
    } : null,
  };

  // Get receipt configuration for branch
  const receiptConfig = await getOrCreateReceiptConfig(transaksiObj.cabang_id);

  // Format payment data
  const formattedPayments = transaksiObj.pembayaran
    .filter((payment) => payment.status === "SUKSES")
    .map((payment) => ({
      id: payment.pembayaran_id,
      method: payment.metode_pembayaran,
      provider: payment.provider,
      reference: payment.nomor_referensi,
      amount: parseFloat(payment.jumlah_bayar),
      change: parseFloat(payment.jumlah_kembali),
      netAmount:
        parseFloat(payment.jumlah_bayar) - parseFloat(payment.jumlah_kembali),
      date: payment.tanggal_pembayaran,
      // QRIS specific info
      qris: payment.metode_pembayaran === "QRIS" ? {
        qrCode: payment.bukti_bayar_url,
        refId: payment.nomor_referensi,
      } : null,
    }));

  // Get primary payment method
  const paymentMethod = transaksiObj.metode_pembayaran || (formattedPayments[0]?.method) || "TUNAI";

  // Format items
  const items = transaksiObj.transaksi_detail.map((detail) => ({
    id: detail.transaksi_detail_id,
    name: detail.produk.produkMaster.namaProduk,
    quantity: detail.jumlah,
    price: parseFloat(detail.harga_satuan),
    discount: parseFloat(detail.diskon_nominal),
    discountPercentage: parseFloat(detail.diskon_persen),
    subtotal: parseFloat(detail.subtotal),
    tax: parseFloat(detail.subtotal) * (parseFloat(detail.pajak_persen) / 100),
    total: parseFloat(detail.total),
  }));

  // Format promo data
  const promoData = transaksiObj.transaksi_promo && transaksiObj.transaksi_promo.length > 0
    ? {
        hasPromo: true,
        promosApplied: transaksiObj.transaksi_promo.map((tp) => ({
          promoId: tp.promo_id,
          kodePromo: tp.promo.kode_promo,
          namaPromo: tp.promo.nama_promo,
          tipeDiskon: tp.promo.tipe_diskon,
          diskonAmount: parseFloat(tp.total_diskon),
        })),
        totalDiskonPromo: transaksiObj.transaksi_promo.reduce(
          (sum, tp) => sum + parseFloat(tp.total_diskon),
          0
        ),
      }
    : { hasPromo: false, promosApplied: [], totalDiskonPromo: 0 };

  // Format credit data (if applicable)
  const creditData = transaksiObj.cicilanKredit ? {
    isCredit: true,
    tenor: transaksiObj.cicilanKredit.jumlah_cicilan,
    durasiBulan: transaksiObj.cicilanKredit.durasi_bulan,
    bungaPersen: transaksiObj.cicilanKredit.bunga_persen,
    biayaAdmin: parseFloat(transaksiObj.cicilanKredit.biaya_admin),
    uangMuka: parseFloat(transaksiObj.cicilanKredit.uang_muka),
    sisaPembayaran: parseFloat(transaksiObj.cicilanKredit.sisa_pembayaran),
    cicilanPerBulan: parseFloat(transaksiObj.cicilanKredit.total_pembayaran) / transaksiObj.cicilanKredit.jumlah_cicilan,
    tanggalMulai: transaksiObj.cicilanKredit.tanggal_mulai,
    tanggalJatuhTempo: transaksiObj.cicilanKredit.tanggal_jatuh_tempo,
    status: transaksiObj.cicilanKredit.status,
  } : { isCredit: false };

  // Format additional data
  const customerInfo = transaksiObj.pelanggan
    ? {
        id: transaksiObj.pelanggan.id,
        name: transaksiObj.pelanggan.namaPelanggan,
        contact: transaksiObj.pelanggan.telepon || transaksiObj.pelanggan.email,
        points: transaksiObj.pelanggan.poin || 0,
      }
    : null;

  // Determine receipt template type
  const templateType = determineReceiptTemplate(paymentMethod, promoData.hasPromo, creditData.isCredit);

  // Format transaction data
  const transactionData = {
    id: transaksiObj.transaksi_id,
    number: transaksiObj.nomor_transaksi,
    date: transaksiObj.tanggal,
    type: transaksiObj.jenis_transaksi,
    paymentMethod,
    status: transaksiObj.status_pembayaran,
    subtotal: parseFloat(transaksiObj.subtotal),
    discount: parseFloat(transaksiObj.diskon),
    tax: parseFloat(transaksiObj.pajak),
    additionalFee: parseFloat(transaksiObj.biaya_tambahan),
    total: parseFloat(transaksiObj.total),
    notes: transaksiObj.keterangan,
    items,
    payments: formattedPayments,
    customerInfo,
    cashierName: transaksiObj.createdByUser?.namaLengkap || "Admin",
    branchName: transaksiObj.cabang?.namaCabang || "Toko",
    branchAddress: transaksiObj.cabang?.alamat || receiptConfig.address || "",
    branchPhone: transaksiObj.cabang?.telepon || receiptConfig.phoneNumber || "",
    receiptConfig,
    // Additional data for different receipt types
    promo: promoData,
    credit: creditData,
    templateType,
    // Discount breakdown for receipt display
    discountBreakdown: {
      diskonItem: parseFloat(transaksiObj.diskon) || 0,
      diskonMember: parseFloat(transaksiObj.diskon_member) || 0,
      diskonManualPersen: parseFloat(transaksiObj.diskon_manual_persen) || null,
      diskonManualNominal: parseFloat(transaksiObj.diskon_manual_nominal) || 0,
      diskonManualAlasan: transaksiObj.diskon_manual_alasan || null,
      diskonPromo: promoData.totalDiskonPromo || 0,
      totalDiskonFinal: parseFloat(transaksiObj.total_diskon_final) || 0,
    },
  };

  return transactionData;
};

/**
 * Determine receipt template type based on payment method and promo
 * @param {string} paymentMethod - Payment method
 * @param {boolean} hasPromo - Has promo discount
 * @param {boolean} isCredit - Is credit transaction
 * @returns {string} - Template type
 */
const determineReceiptTemplate = (paymentMethod, hasPromo, isCredit) => {
  if (isCredit || paymentMethod === "KREDIT") {
    return hasPromo ? "credit_with_promo" : "credit";
  }
  if (paymentMethod === "QRIS") {
    return hasPromo ? "qris_with_promo" : "qris";
  }
  if (paymentMethod === "TRANSFER" || paymentMethod === "TRANSFER_BANK") {
    return hasPromo ? "transfer_with_promo" : "transfer";
  }
  // Default: cash payment
  return hasPromo ? "cash_with_promo" : "cash";
};

/**
 * Generate HTML for a receipt
 * @param {Object} transactionData - Formatted transaction data
 * @param {Object} options - Receipt generation options
 * @returns {Promise<string>} - HTML content
 */
const generateReceiptHtml = async (transactionData, options = {}) => {
  const {
    language = "id",
    includeHeader = true,
    includeFooter = true,
    includeLogo = true,
    paperWidth = 80,
    paperType = "thermal", // "thermal" or "a4"
  } = options;

  // Determine template based on type
  let templatePath;
  if (paperType === "thermal") {
    console.log("thermal" , path.join(__dirname, "../../templates/thermal_receipt.ejs"));
    templatePath = path.join(__dirname, "../../templates/thermal_receipt.ejs");
  } else {
    templatePath = path.join(__dirname, "../../templates/a4_receipt.ejs");
  }

  // Ensure template exists
  if (!fs.existsSync(templatePath)) {
    // Use default template if file not found
    templatePath = path.join(__dirname, "../../templates/default_receipt.ejs");

    // If still not found, throw error
    if (!fs.existsSync(templatePath)) {
      throw new ResponseError(500, "Template struk tidak ditemukan");
    }
  }

  // Generate QR code if needed
  let qrCodeData = null;
  if (transactionData.receiptConfig.showQrCode !== false) {
    try {
      const qrData =
        `${transactionData.branchName}\n` +
        `No: ${transactionData.number}\n` +
        `Date: ${new Date(transactionData.date).toLocaleDateString()}\n` +
        `Total: ${transactionData.total}`;

      qrCodeData = await qrcode.toDataURL(qrData);
    } catch (error) {
      console.error("Failed to generate QR code:", error);
    }
  }

  // Add data for template
  const templateData = {
    ...transactionData,
    qrCode: qrCodeData,
    options: {
      language,
      includeHeader,
      includeFooter,
      includeLogo,
      paperWidth,
    },
    formatCurrency: (amount) => {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(amount);
    },
    formatDate: (date) => {
      return new Date(date).toLocaleDateString(
        language === "id" ? "id-ID" : "en-US",
        {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      );
    },
    translations: {
      id: {
        receipt: "Struk Pembayaran",
        date: "Tanggal",
        cashier: "Kasir",
        customer: "Pelanggan",
        item: "Item",
        qty: "Jml",
        price: "Harga",
        subtotal: "Subtotal",
        discount: "Diskon",
        tax: "Pajak",
        total: "Total",
        payment: "Pembayaran",
        change: "Kembalian",
        thankYou: "Terima kasih telah berbelanja",
      },
      en: {
        receipt: "Payment Receipt",
        date: "Date",
        cashier: "Cashier",
        customer: "Customer",
        item: "Item",
        qty: "Qty",
        price: "Price",
        subtotal: "Subtotal",
        discount: "Discount",
        tax: "Tax",
        total: "Total",
        payment: "Payment",
        change: "Change",
        thankYou: "Thank you for shopping",
      },
    },
  };

  // Render template to HTML
  try {
    const html = await ejs.renderFile(templatePath, templateData);
    return html;
  } catch (error) {
    console.error("Error rendering template:", error);
    throw new ResponseError(500, `Error rendering template: ${error.message}`);
  }
};

/**
 * Generate PDF from HTML
 * @param {string} html - HTML content
 * @param {Object} options - PDF generation options
 * @returns {Promise<Buffer>} - PDF buffer
 */
const generatePdfFromHtml = async (html, options = {}) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(html);

    // Set PDF options
    const pdfOptions = {
      format: options.paperType === "thermal" ? undefined : "A4",
      width:
        options.paperType === "thermal" ? `${options.paperWidth}mm` : undefined,
      height: options.paperType === "thermal" ? undefined : undefined,
      margin: {
        top: "10mm",
        right: "10mm",
        bottom: "10mm",
        left: "10mm",
      },
      printBackground: true,
    };

    const pdfBuffer = await page.pdf(pdfOptions);
    return pdfBuffer;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new ResponseError(500, `Error generating PDF: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

/**
 * Get receipt preview in HTML or PDF format
 * @param {string} transaksiId - Transaction ID
 * @param {Object} options - Preview options
 * @returns {Promise<Object>} - Preview data
 */
const getReceiptPreview = async (transaksiId, options = {}) => {
  const {
    format = "html", // "html" or "pdf"
    paperType = "thermal", // "thermal" or "a4"
    paperWidth = paperType === "thermal" ? 80 : 210,
    language = "id",
  } = options;

  // Get transaction data
  const transactionData = await getTransactionDataForReceipt(transaksiId);

  // Generate HTML
  const html = await generateReceiptHtml(transactionData, {
    language,
    includeHeader: true,
    includeFooter: true,
    includeLogo: true,
    paperWidth,
    paperType,
  });

  // If HTML format, return directly
  if (format === "html") {
    return {
      html,
      contentType: "text/html",
    };
  }

  // If PDF format, generate PDF
  const pdfBuffer = await generatePdfFromHtml(html, { paperWidth, paperType });

  return {
    pdf: Buffer.from(pdfBuffer),
    contentType: "application/pdf",
  };
};

/**
 * Send receipt by email
 * @param {Object} data - Email data
 * @param {Object} auditInfo - Audit information
 * @returns {Promise<Object>} - Result
 */
const sendReceiptByEmail = async (data, auditInfo) => {
  const { transaksiId, email, subject, message, format = "pdf" } = data;

  // Validate email
  if (!email) {
    throw new ResponseError(400, "Email penerima harus diisi");
  }

  // Get transaction data
  const transactionData = await getTransactionDataForReceipt(transaksiId);

  // Generate receipt in HTML format
  const html = await generateReceiptHtml(transactionData, {
    language: "id",
    includeHeader: true,
    includeFooter: true,
    includeLogo: true,
    paperWidth: format === "pdf" ? 210 : 80,
    paperType: format === "pdf" ? "a4" : "thermal",
  });

  // Setup email transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.example.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER || "user@example.com",
      pass: process.env.SMTP_PASS || "password",
    },
  });

  // Prepare email content
  const emailSubject =
    subject ||
    `Struk Pembelian ${transactionData.branchName} - ${transactionData.number}`;
  const emailMessage =
    message ||
    `Terima kasih telah berbelanja di ${transactionData.branchName}. Terlampir struk pembelian Anda.`;

  try {
    let mailOptions;

    if (format === "pdf") {
      // Generate PDF
      const pdfBuffer = await generatePdfFromHtml(html, {
        paperWidth: 210,
        paperType: "a4",
      });

      // Prepare email with PDF attachment
      mailOptions = {
        from:
          process.env.SMTP_FROM ||
          `"${transactionData.branchName}" <pos@example.com>`,
        to: email,
        subject: emailSubject,
        text: emailMessage,
        attachments: [
          {
            filename: `receipt-${transactionData.number}.pdf`,
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ],
      };
    } else {
      // Send as HTML email
      mailOptions = {
        from:
          process.env.SMTP_FROM ||
          `"${transactionData.branchName}" <pos@example.com>`,
        to: email,
        subject: emailSubject,
        text: emailMessage,
        html, // Use receipt HTML directly
      };
    }

    // Send email
    const info = await transporter.sendMail(mailOptions);

    // Add audit log
    await prisma.auditLog.create({
      data: {
        user_id: auditInfo.userId,
        ip_address: auditInfo.ipAddress,
        action: "EMAIL_RECEIPT",
        table_name: "transaksi",
        record_id: transaksiId,
        new_values: JSON.stringify({
          email,
          format,
          messageId: info.messageId,
        }),
      },
    });

    return {
      success: true,
      message: `Receipt sent to ${email}`,
      format,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("Failed to send email:", error);
    throw new ResponseError(500, `Failed to send email: ${error.message}`);
  }
};

/**
 * Update receipt configuration
 * @param {string} cabangId - Branch ID
 * @param {Object} configData - Configuration data
 * @returns {Promise<Object>} - Updated configuration
 */
const updateReceiptConfig = async (cabangId, configData) => {
  // Check if branch exists
  const cabang = await prisma.cabang.findUnique({
    where: { id: cabangId },
  });

  if (!cabang) {
    throw new ResponseError(404, "Cabang tidak ditemukan");
  }

  // Get existing config or create if not exists
  let existingConfig = await prisma.receiptConfig.findFirst({
    where: { cabangId },
  });

  if (!existingConfig) {
    // Create default config first
    existingConfig = await getOrCreateReceiptConfig(cabangId);
  }

  // Update config with new data
  const updatedConfig = await prisma.receiptConfig.update({
    where: { id: existingConfig.id },
    data: configData,
  });

  return updatedConfig;
};



const handlePaymentReceipt = async (transaksiId, options = {}, auditInfo = {}) => {
  const {
    format = "pdf",
    paperType = "thermal",
    paperWidth = 80,
    language = "id",
    sendEmail = false,
    emailAddress = null,
    printAutomatically = false,
  } = options;

  // Get transaction data
  const transactionData = await getTransactionDataForReceipt(transaksiId);
  
  // Check if transaction is fully paid
  if (transactionData.status !== "LUNAS") {
    // Still generate receipt but mark as not final
    transactionData.isPartialPayment = true;
  }

  // Generate receipt in requested format
  const result = await getReceiptPreview(transaksiId, {
    format,
    paperType,
    paperWidth,
    language,
  });

  // Send email if requested
  if (sendEmail && emailAddress) {
    try {
      await sendReceiptByEmail({
        transaksiId,
        email: emailAddress,
        subject: `Struk Pembelian ${transactionData.branchName} - ${transactionData.number}`,
        format,
      }, auditInfo || { userId: "SYSTEM", ipAddress: "0.0.0.0" });
    } catch (error) {
      console.error("Failed to send receipt email:", error);
      // Continue execution even if email fails
    }
  }

  // Add audit log for receipt generation
  await prisma.auditLog.create({
    data: {
      user_id: auditInfo.userId,
      ip_address: auditInfo.ipAddress || "0.0.0.0",
      action: "GENERATE_RECEIPT",
      table_name: "transaksi",
      record_id: transaksiId,
      new_values: JSON.stringify({
        format,
        paperType,
        printAutomatically,
        sendEmail,
      }),
    },
  });

  // Return receipt data
  return {
    transactionId: transaksiId,
    transactionNumber: transactionData.number,
    receiptData: result,
    format,
    printAutomatically,
    isPartialPayment: transactionData.isPartialPayment,
  };
};

/**
 * Send receipt by WhatsApp
 * @param {Object} data - WhatsApp data
 * @param {Object} auditInfo - Audit information
 * @returns {Promise<Object>} - Result
 */
const sendReceiptByWhatsapp = async (data, auditInfo) => {
  const { transaksiId, phone, message } = data;

  if (!phone) {
    throw new ResponseError(400, "Nomor WhatsApp penerima harus diisi");
  }

  // Get transaction data
  const transactionData = await getTransactionDataForReceipt(transaksiId);

  // Generate receipt in PDF format (Thermal optimized for phone view)
  const html = await generateReceiptHtml(transactionData, {
    language: "id",
    includeHeader: true,
    includeFooter: true,
    includeLogo: true,
    paperWidth: 80,
    paperType: "thermal",
  });

  const pdfBuffer = await generatePdfFromHtml(html, {
    paperWidth: 80,
    paperType: "thermal",
  });

  // Prepare caption
  const caption = message || `*Struk Pembelian*\n${transactionData.branchName}\nNo: ${transactionData.number}\nTanggal: ${new Date(transactionData.date).toLocaleDateString('id-ID')}\nTotal: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(transactionData.total)}\n\nTerima kasih telah berbelanja!`;

  try {
    // Send PDF via WhatsApp
    // Normalize phone
    let formattedPhone = phone.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) formattedPhone = '62' + formattedPhone.slice(1);
    if (!formattedPhone.endsWith('@s.whatsapp.net')) formattedPhone += '@s.whatsapp.net';


    const result = await whatsappService.sendFile(
        formattedPhone,
        Buffer.from(pdfBuffer),
        `receipt-${transactionData.number}.pdf`,
        "cd6666df-b821-4c90-b619-056179af5e62", // deviceId - use default
        { caption }
    );

    console.log("result", result);

    // Add audit log
    await prisma.auditLog.create({
      data: {
        user_id: auditInfo.userId,
        ip_address: auditInfo.ipAddress,
        action: "WHATSAPP_RECEIPT",
        table_name: "transaksi",
        record_id: transaksiId,
        new_values: JSON.stringify({
           phone,
           messageId: result?.id || 'sent'
        }),
      },
    });

    return {
      success: true,
      message: `Struk berhasil dikirim ke ${phone}`,
    };
  } catch (error) {
    console.error("Failed to send WhatsApp receipt:", error);
    throw new ResponseError(500, `Gagal mengirim WhatsApp: ${error.message}`);
  }
};

module.exports = {
  getOrCreateReceiptConfig,
  getTransactionDataForReceipt,
  determineReceiptTemplate,
  generateReceiptHtml,
  generatePdfFromHtml,
  getReceiptPreview,
  sendReceiptByEmail,
  sendReceiptByWhatsapp,
  updateReceiptConfig,
  handlePaymentReceipt
};
