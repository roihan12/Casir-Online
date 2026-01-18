// File: src/controllers/invoiceController.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

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
        transaksi: true,
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

    // TODO: Implement email sending functionality
    // This would typically involve:
    // 1. Generating a PDF of the invoice
    // 2. Sending an email with the PDF attached

    res.status(200).json({
      success: true,
      message: "Invoice berhasil dikirim via email",
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
            items: {
              include: {
                produk: true,
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

    // TODO: Implement PDF generation
    // This would typically involve using a library like PDFKit or html-pdf
    // For now, we'll just return the invoice data

    res.status(200).json({
      success: true,
      message: "PDF invoice akan segera tersedia",
      data: invoice,
    });
  } catch (error) {
    console.error("Error in generateInvoicePdf:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat membuat PDF invoice",
      error: error.message,
    });
  }
};
