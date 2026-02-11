// File: src/controllers/invoiceController.js
const ejs = require("ejs");
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const invoiceService = require("../services/invoiceService");
const { logger } = require("../utils/logger");

/**
 * @desc    Get list of invoices
 * @route   GET /api/invoices
 * @access  Private (admin_cabang, kasir, super_admin)
 */
exports.getInvoiceList = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      startDate,
      endDate,
      cabangId,
      status,
      search,
    } = req.query;

    const result = await invoiceService.getInvoiceList({
      page,
      limit,
      startDate,
      endDate,
      cabangId,
      status,
      search,
    });

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    logger.error("Error in getInvoiceList controller:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengambil daftar invoice",
      error: error.message,
    });
  }
};

/**
 * @desc    Get invoice by ID
 * @route   GET /api/invoices/:id
 * @access  Private (admin_cabang, kasir, super_admin)
 */
exports.getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;

    // Use getInvoiceWithDetails to include items and payments
    const invoice = await invoiceService.getInvoiceWithDetails(id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice tidak ditemukan",
      });
    }

    res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    logger.error("Error in getInvoiceById controller:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengambil detail invoice",
      error: error.message,
    });
  }
};

/**
 * @desc    Create new invoice from transaction
 * @route   POST /api/invoices
 * @access  Private (admin_cabang, kasir, super_admin)
 */
exports.createInvoice = async (req, res) => {
  try {
    const { transaksiId, tanggalJatuhTempo, catatan } = req.body;

    // Validate required fields
    if (!transaksiId) {
      return res.status(400).json({
        success: false,
        message: "transaksiId wajib diisi",
      });
    }

    // Extract user info for audit log
    const userInfo = {
      userId: req.user?.user_id || req.user?.id,
      userName: req.user?.username || req.user?.nama_lengkap,
      ipAddress: req.ip,
      cabangId: req.user?.cabang_id,
    };

    const invoice = await invoiceService.createInvoice({
      transaksiId,
      tanggalJatuhTempo,
      catatan,
    }, userInfo);

    res.status(201).json({
      success: true,
      message: "Invoice berhasil dibuat",
      data: invoice,
    });
  } catch (error) {
    logger.error("Error in createInvoice controller:", error);

    // Handle specific error messages
    if (error.message === "Transaksi tidak ditemukan") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === "Invoice untuk transaksi ini sudah ada") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat membuat invoice",
      error: error.message,
    });
  }
};

/**
 * @desc    Update invoice
 * @route   PUT /api/invoices/:id
 * @access  Private (admin_cabang, super_admin)
 */
exports.updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { tanggalJatuhTempo, status, catatan } = req.body;

    // Extract user info for audit log
    const userInfo = {
      userId: req.user?.user_id || req.user?.id,
      userName: req.user?.username || req.user?.nama_lengkap,
      ipAddress: req.ip,
    };

    const invoice = await invoiceService.updateInvoice(id, {
      tanggalJatuhTempo,
      status,
      catatan,
    }, userInfo);

    res.status(200).json({
      success: true,
      message: "Invoice berhasil diperbarui",
      data: invoice,
    });
  } catch (error) {
    logger.error("Error in updateInvoice controller:", error);

    if (error.message === "Invoice tidak ditemukan") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat memperbarui invoice",
      error: error.message,
    });
  }
};

/**
 * @desc    Delete invoice
 * @route   DELETE /api/invoices/:id
 * @access  Private (admin_cabang, super_admin)
 */
exports.deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    // Extract user info for audit log
    const userInfo = {
      userId: req.user?.user_id || req.user?.id,
      userName: req.user?.username || req.user?.nama_lengkap,
      ipAddress: req.ip,
    };

    await invoiceService.deleteInvoice(id, userInfo);

    res.status(200).json({
      success: true,
      message: "Invoice berhasil dihapus",
    });
  } catch (error) {
    logger.error("Error in deleteInvoice controller:", error);

    if (error.message === "Invoice tidak ditemukan") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat menghapus invoice",
      error: error.message,
    });
  }
};

/**
 * @desc    Send invoice via email
 * @route   POST /api/invoices/:id/send
 * @access  Private (admin_cabang, super_admin)
 */
exports.sendInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, message } = req.body;

    // Get invoice with full details
    const invoice = await invoiceService.getInvoiceWithDetails(id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice tidak ditemukan",
      });
    }

    // Use provided email or customer email
    const recipientEmail = email || invoice.pelanggan?.email;

    if (!recipientEmail) {
      return res.status(400).json({
        success: false,
        message: "Email penerima harus disediakan",
      });
    }

    // Generate PDF using the existing generateInvoicePdf logic
    const templatePath = path.join(__dirname, "../../templates/invoice_template.ejs");

    // Ensure template exists
    if (!fs.existsSync(templatePath)) {
      return res.status(500).json({
        success: false,
        message: "Template invoice tidak ditemukan",
      });
    }

    // Prepare items for template
    const items = invoice.items.map((item) => ({
      namaProduk: item.namaProduk,
      sku: item.sku,
      jumlah: item.jumlah,
      hargaSatuan: parseFloat(item.hargaSatuan),
      diskonNominal: parseFloat(item.diskonNominal || 0),
      subtotal: parseFloat(item.subtotal),
    }));

    // Prepare payments for template
    const payments = (invoice.payments || [])
      .filter((payment) => payment.status === "SUKSES")
      .map((payment) => ({
        metodePembayaran: payment.metodePembayaran,
        provider: payment.provider,
        jumlahBayar: parseFloat(payment.jumlahBayar),
        jumlahKembali: parseFloat(payment.jumlahKembali),
        nomorReferensi: payment.nomorReferensi,
      }));

    // Prepare template data
    const templateData = {
      language: 'id',
      invoice: invoice,
      branch: invoice.cabang,
      customer: invoice.pelanggan,
      transaksi: invoice.transaksi,
      items,
      payments,
      formatCurrency: (amount) => {
        return new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          minimumFractionDigits: 0,
        }).format(amount);
      },
      formatDate: (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString("id-ID", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      },
    };

    // Render template to HTML
    const html = await ejs.renderFile(templatePath, templateData);

    // Generate PDF from HTML
    let browser;
    let pdfBuffer;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      const page = await browser.newPage();
      await page.setContent(html);

      pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm',
        },
        printBackground: true,
      });
    } finally {
      if (browser) {
        await browser.close();
      }
    }

    // Render email template
    const emailTemplatePath = path.join(__dirname, "../../templates/emails/invoice_email.ejs");
    const emailTemplateData = {
      ...templateData,
      companyName: 'Casir Online POS',
      formatDate: (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString("id-ID", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      },
    };

    const emailHtml = await ejs.renderFile(emailTemplatePath, emailTemplateData);

    // Create transporter
    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.example.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER || "user@example.com",
        pass: process.env.SMTP_PASS || "password",
      },
    });

    // Send email
    const mailOptions = {
      from: process.env.SMTP_FROM || `"${invoice.cabang.namaCabang}" <noreply@casir-online.com>`,
      to: recipientEmail,
      subject: `Invoice ${invoice.nomor_invoice} - ${invoice.cabang.namaCabang}`,
      html: emailHtml,
      attachments: [
        {
          filename: `invoice-${invoice.nomor_invoice}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    logger.info("Invoice sent successfully", {
      invoiceId: id,
      email: recipientEmail,
    });

    res.status(200).json({
      success: true,
      message: "Invoice berhasil dikirim via email",
      data: {
        email: recipientEmail,
        invoiceNumber: invoice.nomor_invoice,
      },
    });
  } catch (error) {
    logger.error("Error in sendInvoice controller:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengirim invoice",
      error: error.message,
    });
  }
};

/**
 * @desc    Generate invoice PDF
 * @route   GET /api/invoices/:id/pdf
 * @access  Private (admin_cabang, kasir, super_admin)
 */
exports.generateInvoicePdf = async (req, res) => {
  try {
    const { id } = req.params;

    // Get invoice with full details
    const invoice = await invoiceService.getInvoiceWithDetails(id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice tidak ditemukan",
      });
    }

    // Determine template path
    const templatePath = path.join(__dirname, "../../templates/invoice_template.ejs");

    // Ensure template exists
    if (!fs.existsSync(templatePath)) {
      return res.status(500).json({
        success: false,
        message: "Template invoice tidak ditemukan",
      });
    }

    // Prepare items for template
    const items = invoice.items.map((item) => ({
      namaProduk: item.namaProduk,
      sku: item.sku,
      jumlah: item.jumlah,
      hargaSatuan: parseFloat(item.hargaSatuan),
      diskonNominal: parseFloat(item.diskonNominal || 0),
      subtotal: parseFloat(item.subtotal),
    }));

    // Prepare payments for template
    const payments = (invoice.payments || [])
      .filter((payment) => payment.status === "SUKSES")
      .map((payment) => ({
        metodePembayaran: payment.metodePembayaran,
        provider: payment.provider,
        jumlahBayar: parseFloat(payment.jumlahBayar),
        jumlahKembali: parseFloat(payment.jumlahKembali),
        nomorReferensi: payment.nomorReferensi,
      }));

    // Prepare template data
    const templateData = {
      language: 'id',
      invoice: invoice,
      branch: invoice.cabang,
      customer: invoice.pelanggan,
      transaksi: invoice.transaksi,
      items,
      payments,
      formatCurrency: (amount) => {
        return new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          minimumFractionDigits: 0,
        }).format(amount);
      },
      formatDate: (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString("id-ID", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      },
    };

    // Render template to HTML
    const html = await ejs.renderFile(templatePath, templateData);

    // Generate PDF from HTML
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      const page = await browser.newPage();
      await page.setContent(html);

      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm',
        },
        printBackground: true,
      });

      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="invoice-${invoice.nomor_invoice}.pdf"`);

      return res.send(Buffer.from(pdfBuffer));
    } catch (error) {
      logger.error("Error generating PDF:", error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  } catch (error) {
    logger.error("Error in generateInvoicePdf controller:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat membuat PDF invoice",
      error: error.message,
    });
  }
};
