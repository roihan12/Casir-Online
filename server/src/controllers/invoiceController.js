// File: src/controllers/invoiceController.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const ejs = require("ejs");
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

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

    // Build filter object
    const filter = {};

    // Add date range filter if provided
    if (startDate && endDate) {
      filter.tanggalInvoice = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Add cabang filter if provided
    if (cabangId) {
      filter.cabangId = cabangId;
    }

    // Add status filter if provided
    if (status) {
      filter.status = status;
    }

    // Add search filter if provided
    if (search) {
      filter.OR = [
        { nomorInvoice: { contains: search, mode: "insensitive" } },
        { transaksi: { nomorTransaksi: { contains: search, mode: "insensitive" } } },
        { pelanggan: { namaPelanggan: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Get total count for pagination
    const total = await prisma.invoice.count({
      where: filter,
    });

    // Get invoices with pagination
    const invoices = await prisma.invoice.findMany({
      where: filter,
      include: {
        transaksi: {
          select: {
            nomorTransaksi: true,
            jenisTransaksi: true,
            tanggal: true,
            statusPembayaran: true,
          },
        },
        cabang: {
          select: {
            namaCabang: true,
          },
        },
        pelanggan: {
          select: {
            namaPelanggan: true,
            telepon: true,
            email: true,
          },
        },
      },
      orderBy: {
        tanggalInvoice: "desc",
      },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    });

    res.status(200).json({
      success: true,
      data: invoices,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error in getInvoiceList:", error);
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

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        transaksi: {
          include: {
            items: true,
            pembayaran: true,
          },
        },
        cabang: {
          select: {
            namaCabang: true,
            alamat: true,
            telepon: true,
            email: true,
          },
        },
        pelanggan: {
          select: {
            namaPelanggan: true,
            alamat: true,
            telepon: true,
            email: true,
          },
        },
      },
    });

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
    console.error("Error in getInvoiceById:", error);
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

    // Check if transaction exists
    const transaksi = await prisma.transaksi.findUnique({
      where: { id: transaksiId },
      include: {
        cabang: true,
        pelanggan: true,
      },
    });

    if (!transaksi) {
      return res.status(404).json({
        success: false,
        message: "Transaksi tidak ditemukan",
      });
    }

    // Check if invoice already exists for this transaction
    const existingInvoice = await prisma.invoice.findFirst({
      where: { transaksiId },
    });

    if (existingInvoice) {
      return res.status(400).json({
        success: false,
        message: "Invoice untuk transaksi ini sudah ada",
      });
    }

    // Generate invoice number
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    
    // Get count of invoices for today to generate sequence
    const todayInvoices = await prisma.invoice.count({
      where: {
        tanggalInvoice: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lte: new Date(date.setHours(23, 59, 59, 999)),
        },
      },
    });
    
    const sequence = (todayInvoices + 1).toString().padStart(3, "0");
    const nomorInvoice = `INV-${year}${month}${day}-${sequence}`;

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        nomorInvoice,
        tanggalInvoice: new Date(),
        tanggalJatuhTempo: tanggalJatuhTempo ? new Date(tanggalJatuhTempo) : null,
        total: transaksi.total,
        status: transaksi.statusPembayaran === "LUNAS" ? "LUNAS" : "BELUM_LUNAS",
        catatan,
        transaksi: {
          connect: { id: transaksiId },
        },
        cabang: {
          connect: { id: transaksi.cabangId },
        },
        pelanggan: transaksi.pelangganId
          ? {
              connect: { id: transaksi.pelangganId },
            }
          : undefined,
      },
    });

    res.status(201).json({
      success: true,
      message: "Invoice berhasil dibuat",
      data: invoice,
    });
  } catch (error) {
    console.error("Error in createInvoice:", error);
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

    // Check if invoice exists
    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice tidak ditemukan",
      });
    }

    // Update invoice
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        tanggalJatuhTempo: tanggalJatuhTempo ? new Date(tanggalJatuhTempo) : undefined,
        status: status || undefined,
        catatan: catatan !== undefined ? catatan : undefined,
      },
    });

    res.status(200).json({
      success: true,
      message: "Invoice berhasil diperbarui",
      data: updatedInvoice,
    });
  } catch (error) {
    console.error("Error in updateInvoice:", error);
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

    // Check if invoice exists
    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice tidak ditemukan",
      });
    }

    // Delete invoice
    await prisma.invoice.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: "Invoice berhasil dihapus",
    });
  } catch (error) {
    console.error("Error in deleteInvoice:", error);
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

    // Check if invoice exists
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        transaksi: {
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
          },
        },
        cabang: true,
        pelanggan: true,
      },
    });

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
    const items = invoice.transaksi.transaksi_detail.map((detail) => ({
      namaProduk: detail.produk.produkMaster.namaProduk,
      sku: detail.produk.produkMaster.sku,
      jumlah: detail.jumlah,
      hargaSatuan: parseFloat(detail.harga_satuan),
      diskonNominal: parseFloat(detail.diskon_nominal || 0),
      subtotal: parseFloat(detail.subtotal),
    }));

    // Prepare payments for template
    const payments = invoice.transaksi.pembayaran
      .filter((payment) => payment.status === "SUKSES")
      .map((payment) => ({
        metodePembayaran: payment.metode_pembayaran,
        provider: payment.provider,
        jumlahBayar: parseFloat(payment.jumlah_bayar),
        jumlahKembali: parseFloat(payment.jumlah_kembali),
        nomorReferensi: payment.nomor_referensi,
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
      subject: `Invoice ${invoice.nomorInvoice} - ${invoice.cabang.namaCabang}`,
      html: emailHtml,
      attachments: [
        {
          filename: `invoice-${invoice.nomorInvoice}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: "Invoice berhasil dikirim via email",
      data: {
        email: recipientEmail,
        invoiceNumber: invoice.nomorInvoice,
      },
    });
  } catch (error) {
    console.error("Error in sendInvoice:", error);
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

    // Check if invoice exists
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        transaksi: {
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
          },
        },
        cabang: true,
        pelanggan: true,
      },
    });

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
    const items = invoice.transaksi.transaksi_detail.map((detail) => ({
      namaProduk: detail.produk.produkMaster.namaProduk,
      sku: detail.produk.produkMaster.sku,
      jumlah: detail.jumlah,
      hargaSatuan: parseFloat(detail.harga_satuan),
      diskonNominal: parseFloat(detail.diskon_nominal || 0),
      subtotal: parseFloat(detail.subtotal),
    }));

    // Prepare payments for template
    const payments = invoice.transaksi.pembayaran
      .filter((payment) => payment.status === "SUKSES")
      .map((payment) => ({
        metodePembayaran: payment.metode_pembayaran,
        provider: payment.provider,
        jumlahBayar: parseFloat(payment.jumlah_bayar),
        jumlahKembali: parseFloat(payment.jumlah_kembali),
        nomorReferensi: payment.nomor_referensi,
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
      res.setHeader('Content-Disposition', `inline; filename="invoice-${invoice.nomorInvoice}.pdf"`);

      return res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating PDF:", error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  } catch (error) {
    console.error("Error in generateInvoicePdf:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat membuat PDF invoice",
      error: error.message,
    });
  }
};
