const prisma = require("../config/db");
const { ResponseError } = require("../error/responseError");
const fs = require("fs");
const path = require("path");
const ejs = require("ejs");
const puppeteer = require("puppeteer");
const qrcode = require("qrcode");
const nodemailer = require("nodemailer");


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
  // Get complete transaction data
  const transaksi = await prisma.transaksi.findUnique({
    where: { transaksi_id: transaksiId },
    include: {
      transaksi_detail: {
        include: {
          produk: {
            include: {
              produkMaster: true,
            },
          },
        },
      },
      pembayaran: true,
      pelanggan: true,
      supplier: true,
      cabang: true,
      user: {
        select: {
          id: true,
          namaLengkap: true,
        },
      },
      shift: true,
      promo: true,
    },
  });

  if (!transaksi) {
    throw new ResponseError(404, "Transaksi tidak ditemukan");
  }

  // Get receipt configuration for branch
  const receiptConfig = await getOrCreateReceiptConfig(transaksi.cabang_id);

  // Format payment data
  const payments = transaksi.pembayaran
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
    }));

  // Format items
  const items = transaksi.transaksi_detail.map((detail) => ({
    name: detail.produk.produkMaster.namaProduk,
    quantity: detail.jumlah,
    price: parseFloat(detail.harga_satuan),
    discount: parseFloat(detail.diskon_nominal),
    discountPercentage: parseFloat(detail.diskon_persen),
    subtotal: parseFloat(detail.subtotal),
    tax: parseFloat(detail.subtotal) * (parseFloat(detail.pajak_persen) / 100),
    total: parseFloat(detail.total),
  }));

  // Format additional data
  const customerInfo = transaksi.pelanggan
    ? {
        id: transaksi.pelanggan.id,
        name: transaksi.pelanggan.namaPelanggan,
        contact: transaksi.pelanggan.telepon || transaksi.pelanggan.email,
        points: transaksi.pelanggan.poin || 0,
      }
    : null;

  // Format transaction data
  const transactionData = {
    id: transaksi.transaksi_id,
    number: transaksi.nomor_transaksi,
    date: transaksi.tanggal,
    type: transaksi.jenis_transaksi,
    status: transaksi.status_pembayaran,
    subtotal: parseFloat(transaksi.subtotal),
    discount: parseFloat(transaksi.diskon),
    tax: parseFloat(transaksi.pajak),
    additionalFee: parseFloat(transaksi.biaya_tambahan),
    total: parseFloat(transaksi.total),
    notes: transaksi.keterangan,
    items,
    payments,
    customerInfo,
    cashierName: transaksi.user?.namaLengkap || "Admin",
    branchName: transaksi.cabang?.namaCabang || "Toko",
    branchAddress: transaksi.cabang?.alamat || receiptConfig.address || "",
    branchPhone: transaksi.cabang?.telepon || receiptConfig.phoneNumber || "",
    receiptConfig,
  };

  return transactionData;
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
    pdf: pdfBuffer,
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

module.exports = {
  getOrCreateReceiptConfig,
  getTransactionDataForReceipt,
  generateReceiptHtml,
  generatePdfFromHtml,
  getReceiptPreview,
  sendReceiptByEmail,
  updateReceiptConfig,
  handlePaymentReceipt
};
