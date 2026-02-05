import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  User,
  MapPin,
  CreditCard,
  Receipt,
  FileText,
  Clock,
  DollarSign,
  Printer,
  Download,
  Mail,
  ShoppingBag,
  Check,
  AlertTriangle,
  X,
  Loader,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import toast from "react-hot-toast";
import { useInvoiceDetail, useGenerateInvoicePdf, useSendInvoice } from "../hooks/useInvoices";

// Formatter untuk uang
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Fetch invoice detail using React Query
  const {
    data: invoiceData,
    isLoading,
    error
  } = useInvoiceDetail(id);

  // PDF generation query
  const {
    refetch: generatePdf,
    isLoading: isGeneratingPdf,
    data: pdfData
  } = useGenerateInvoicePdf(id);

  // Send invoice mutation
  const {
    mutate: sendInvoice,
    isLoading: isSendingInvoice
  } = useSendInvoice();

  // Extract invoice from query result and map snake_case to camelCase
  const invoice = invoiceData?.data ? {
    id: invoiceData.data.id,
    nomorInvoice: invoiceData.data.nomor_invoice,
    tanggalInvoice: invoiceData.data.tanggal_invoice,
    tanggalJatuhTempo: invoiceData.data.tanggal_jatuh_tempo,
    total: invoiceData.data.total,
    status: invoiceData.data.status,
    catatan: invoiceData.data.catatan,
    transaksiId: invoiceData.data.transaksi_id,
    cabangId: invoiceData.data.cabang_id,
    pelangganId: invoiceData.data.pelanggan_id,
    createdAt: invoiceData.data.created_at,
    updatedAt: invoiceData.data.updated_at,
    // Map items if available
    items: invoiceData.data.items?.map(item => ({
      transaksiDetailId: item.transaksiDetailId,
      namaProduk: item.namaProduk,
      sku: item.sku,
      jumlah: item.jumlah,
      hargaSatuan: item.hargaSatuan,
      diskonNominal: item.diskonNominal,
      subtotal: item.subtotal,
    })) || [],
    // Map payments if available
    payments: invoiceData.data.payments?.map(payment => ({
      pembayaranId: payment.pembayaranId,
      metodePembayaran: payment.metodePembayaran,
      provider: payment.provider,
      jumlahBayar: payment.jumlahBayar,
      jumlahKembali: payment.jumlahKembali,
      nomorReferensi: payment.nomorReferensi,
      status: payment.status,
    })) || [],
    transaksi: invoiceData.data.transaksi ? {
      transaksiId: invoiceData.data.transaksi.transaksi_id,
      nomorTransaksi: invoiceData.data.transaksi.nomorTransaksi,
      jenisTransaksi: invoiceData.data.transaksi.jenisTransaksi,
      tanggal: invoiceData.data.transaksi.tanggal,
      subtotal: invoiceData.data.transaksi.subtotal,
      diskon: invoiceData.data.transaksi.diskon,
      pajak: invoiceData.data.transaksi.pajak,
      biayaTambahan: invoiceData.data.transaksi.biayaTambahan,
      total: invoiceData.data.transaksi.total,
      statusPembayaran: invoiceData.data.transaksi.statusPembayaran,
      keterangan: invoiceData.data.transaksi.keterangan,
    } : null,
    cabang: invoiceData.data.cabang ? {
      id: invoiceData.data.cabang.id,
      namaCabang: invoiceData.data.cabang.namaCabang,
      alamat: invoiceData.data.cabang.alamat,
      telepon: invoiceData.data.cabang.telepon,
      email: invoiceData.data.cabang.email,
    } : null,
    pelanggan: invoiceData.data.pelanggan ? {
      id: invoiceData.data.pelanggan.id,
      namaPelanggan: invoiceData.data.pelanggan.namaPelanggan,
      alamat: invoiceData.data.pelanggan.alamat,
      telepon: invoiceData.data.pelanggan.telepon,
      email: invoiceData.data.pelanggan.email,
    } : null,
  } : null;

  // Handle error
  React.useEffect(() => {
    if (error) {
      console.error("Error fetching invoice detail:", error);
      toast.error("Gagal memuat detail invoice");
    }
  }, [error]);

  // Handle PDF generation
  React.useEffect(() => {
    if (pdfData && !isGeneratingPdf) {
      // Create a download link for the PDF
      const url = window.URL.createObjectURL(new Blob([pdfData]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${invoice?.nomorInvoice || 'download'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  }, [pdfData, isGeneratingPdf, invoice]);

  // Status badge component
  const StatusBadge = ({ status }) => {
    let className;
    let icon;

    switch (status) {
      case "LUNAS":
        className = "bg-green-100 text-green-800";
        icon = <Check size={14} className="mr-1" />;
        break;
      case "BELUM_LUNAS":
        className = "bg-yellow-100 text-yellow-800";
        icon = <Clock size={14} className="mr-1" />;
        break;
      case "JATUH_TEMPO":
        className = "bg-red-100 text-red-800";
        icon = <AlertTriangle size={14} className="mr-1" />;
        break;
      case "DIBATALKAN":
        className = "bg-gray-100 text-gray-800";
        icon = <X size={14} className="mr-1" />;
        break;
      default:
        className = "bg-gray-100 text-gray-800";
        icon = null;
    }

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${className}`}
      >
        {icon}
        {status.replace("_", " ")}
      </span>
    );
  };

  // Go back to invoices list
  const handleBack = () => {
    navigate("/invoices");
  };

  // Handle download PDF
  const handleDownloadPdf = () => {
    generatePdf();
  };

  // Handle send invoice via email
  const handleSendInvoice = () => {
    if (!invoice?.pelanggan?.email) {
      toast.error("Pelanggan tidak memiliki alamat email");
      return;
    }

    sendInvoice(
      {
        id: invoice.id,
        email: invoice.pelanggan.email,
        message: "Berikut adalah invoice untuk transaksi Anda."
      },
      {
        onSuccess: () => {
          toast.success("Invoice berhasil dikirim via email");
        },
        onError: (error) => {
          console.error("Error sending invoice:", error);
          toast.error("Gagal mengirim invoice");
        }
      }
    );
  };

  // Handle print invoice
  const handlePrintInvoice = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="w-full p-6 flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center">
          <Loader className="animate-spin h-8 w-8 text-indigo-600" />
          <p className="mt-4 text-gray-600">Memuat data invoice...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                Gagal memuat detail invoice. Silakan coba lagi.
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={handleBack}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </button>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="w-full p-6">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Invoice tidak ditemukan.
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={handleBack}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </button>
      </div>
    );
  }

  // Format display data
  const displayData = {
    ...invoice,
    tanggalInvoice: format(new Date(invoice.tanggalInvoice), "dd MMMM yyyy", {
      locale: idLocale,
    }),
    tanggalJatuhTempo: invoice.tanggalJatuhTempo
      ? format(new Date(invoice.tanggalJatuhTempo), "dd MMMM yyyy", {
          locale: idLocale,
        })
      : "-",
    tanggalTransaksi: invoice.transaksi?.tanggal
      ? format(new Date(invoice.transaksi.tanggal), "dd MMMM yyyy", {
          locale: idLocale,
        })
      : "-",
  };

  return (
    <div className="w-full p-6 print:p-0">
      {/* Back button and actions - hidden when printing */}
      <div className="flex justify-between mb-6 print:hidden">
        <button
          onClick={handleBack}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </button>

        <div className="flex space-x-2">
          <button
            onClick={handlePrintInvoice}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <Printer className="h-4 w-4 mr-2" />
            Cetak
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isGeneratingPdf ? (
              <Loader className="animate-spin h-4 w-4 mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Download PDF
          </button>
          <button
            onClick={handleSendInvoice}
            disabled={isSendingInvoice || !invoice?.pelanggan?.email}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isSendingInvoice ? (
              <Loader className="animate-spin h-4 w-4 mr-2" />
            ) : (
              <Mail className="h-4 w-4 mr-2" />
            )}
            Kirim Email
          </button>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="bg-white rounded-lg shadow print:shadow-none max-w-4xl mx-auto">
        {/* Invoice Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">INVOICE</h1>
              <p className="text-gray-600">{displayData.nomorInvoice}</p>
            </div>
            <StatusBadge status={displayData.status} />
          </div>
        </div>

        {/* Invoice Details */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Company Info */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">Dari</h2>
              <p className="text-gray-800 font-medium">
                {displayData.cabang?.namaCabang || "Casir Online"}
              </p>
              <p className="text-gray-600 mt-1">
                {displayData.cabang?.alamat || ""}
              </p>
              <p className="text-gray-600">
                {displayData.cabang?.telepon || ""}
              </p>
              <p className="text-gray-600">
                {displayData.cabang?.email || ""}
              </p>
            </div>

            {/* Customer Info */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">Kepada</h2>
              <p className="text-gray-800 font-medium">
                {displayData.pelanggan?.namaPelanggan || "Pelanggan Umum"}
              </p>
              <p className="text-gray-600 mt-1">
                {displayData.pelanggan?.alamat || ""}
              </p>
              <p className="text-gray-600">
                {displayData.pelanggan?.telepon || ""}
              </p>
              <p className="text-gray-600">
                {displayData.pelanggan?.email || ""}
              </p>
            </div>
          </div>

          {/* Invoice Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Tanggal Invoice</p>
              <p className="text-gray-800 font-medium">
                {displayData.tanggalInvoice}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Tanggal Jatuh Tempo</p>
              <p className="text-gray-800 font-medium">
                {displayData.tanggalJatuhTempo}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Nomor Transaksi</p>
              <p className="text-gray-800 font-medium">
                {displayData.transaksi?.nomorTransaksi || "-"}
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Detail Item
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produk
                    </th>
                    <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Harga
                    </th>
                    <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jumlah
                    </th>
                    <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Diskon
                    </th>
                    <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayData.items?.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {item.namaProduk || "Produk"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {formatCurrency(item.hargaSatuan)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {item.jumlah}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {formatCurrency(item.diskonNominal || 0)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                        {formatCurrency(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td
                      colSpan="4"
                      className="px-4 py-3 text-sm text-gray-900 text-right font-medium"
                    >
                      Subtotal
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                      {formatCurrency(
                        displayData.items?.reduce(
                          (sum, item) => sum + item.subtotal,
                          0
                        ) || 0
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td
                      colSpan="4"
                      className="px-4 py-3 text-sm text-gray-900 text-right font-medium"
                    >
                      Pajak
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                      {formatCurrency(displayData.transaksi?.pajak || 0)}
                    </td>
                  </tr>
                  <tr>
                    <td
                      colSpan="4"
                      className="px-4 py-3 text-sm text-gray-900 text-right font-bold"
                    >
                      Total
                    </td>
                    <td className="px-4 py-3 text-lg text-gray-900 text-right font-bold">
                      {formatCurrency(displayData.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Payment Info */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Informasi Pembayaran
            </h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Status Pembayaran</p>
                  <p className="text-gray-800 font-medium">
                    <StatusBadge status={displayData.status} />
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Metode Pembayaran</p>
                  <p className="text-gray-800 font-medium">
                    {displayData.payments?.[0]?.metodePembayaran ||
                      displayData.transaksi?.pembayaran?.[0]?.metodePembayaran ||
                      "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {displayData.catatan && (
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                Catatan
              </h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-800">{displayData.catatan}</p>
              </div>
            </div>
          )}

          {/* Thank You Note */}
          <div className="text-center mt-8 border-t border-gray-200 pt-8">
            <p className="text-gray-600">
              Terima kasih atas kepercayaan Anda berbelanja di{" "}
              {displayData.cabang?.namaCabang || "Casir Online"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetail;
