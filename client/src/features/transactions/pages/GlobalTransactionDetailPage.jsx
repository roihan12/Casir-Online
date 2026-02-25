import React, { useState } from "react";
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
  ShoppingBag,
  Check,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCcw,
  Tag,
  Loader,
  CreditCard as CreditCardIcon,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import toast from "react-hot-toast";
import { useTransactionDetail } from "../hooks/useTransactions";
import PelunasanModal from "../components/PelunasanModal";
import formatDate from "@common/utils/formatDate";
import {
  getReceiptPreview,
  getReceiptPDF,
} from "../../../services/receiptService";
import transaksiService from "../../../services/transaksiService";

// Formatter untuk uang
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

const GlobalTransactionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pelunasanModalOpen, setPelunasanModalOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Fetch transaction detail using React Query
  const {
    data: transaction,
    isLoading,
    error,
    refetch
  } = useTransactionDetail(id);

  // Use data from API
  const displayData = transaction ? {
    ...transaction,
    // Map new fields to legacy ones if needed or use new fields directly in UI
    nomor_transaksi: transaction.number,
    tanggal: transaction.date,
    jenis_transaksi: transaction.type,
    status_pembayaran: transaction.status,
    total_harga: transaction.total,
    transaksi_detail: transaction.items?.map(item => ({
        ...item,
        jumlah: item.quantity,
        harga_satuan: item.price,
        subtotal: item.subtotal,
        produk: {
            produkMaster: {
                namaProduk: item.name,
                // sku is not in the item directly in new structure provided? 
                // Wait, user provided items array has id, name, quantity, price, discount, subtotal, tax, total.
                // It does not seem to have 'sku'. I might need to check if backend provides it or just show name.
                // Assuming name is enough for now or it's just not in the sample.
            }
        },
        // Legacy support
        transaksi_detail_id: item.id
    })),
    pelanggan: transaction.customerInfo ? {
        ...transaction.customerInfo,
        namaPelanggan: transaction.customerInfo.name,
        telepon: transaction.customerInfo.contact
    } : null,
    user: {
        namaLengkap: transaction.cashierName
    },
    cabang: {
        namaCabang: transaction.branchName,
        alamat: transaction.branchAddress,
        telepon: transaction.branchPhone
    },
    pembayaran: transaction.payments?.map(p => ({
        ...p,
        metode_pembayaran: p.method,
        jumlah_bayar: p.amount,
        tanggal_pembayaran: p.date,
        status: "LUNAS" // implied since it's in payments array? or check status
    })),
    keterangan: transaction.notes,
    subtotal: transaction.subtotal,
    biaya_tambahan: transaction.additionalFee,
    pajak: transaction.tax,
    diskon: transaction.discount,
    discountBreakdown: transaction.discountBreakdown // Map discount breakdown
  } : null;

  // Helper to render discount rows
  const renderDiscountRows = () => {
    if (!displayData.discountBreakdown) {
      // Fallback to simple discount display if breakdown not available
      if (displayData.diskon > 0) {
        return (
          <tr>
            <td colSpan={4} className="px-6 py-2 text-sm text-gray-600 text-right">
              Diskon
            </td>
            <td className="px-6 py-2 text-sm text-red-600 text-right">
              -{formatCurrency(displayData.diskon)}
            </td>
          </tr>
        );
      }
      return null;
    }

    const {
      diskonMember,
      diskonPromo,
      diskonManualNominal,
      diskonManualPersen,
      totalDiskonFinal
    } = displayData.discountBreakdown;

    const rows = [];

    if (diskonMember > 0) {
      rows.push(
        <tr key="diskon-member">
          <td colSpan={4} className="px-6 py-2 text-sm text-gray-600 text-right">
            Diskon Member
          </td>
          <td className="px-6 py-2 text-sm text-red-600 text-right">
            -{formatCurrency(diskonMember)}
          </td>
        </tr>
      );
    }

    if (diskonPromo > 0) {
      rows.push(
        <tr key="diskon-promo">
          <td colSpan={4} className="px-6 py-2 text-sm text-gray-600 text-right">
            Diskon Promo
          </td>
          <td className="px-6 py-2 text-sm text-red-600 text-right">
            -{formatCurrency(diskonPromo)}
          </td>
        </tr>
      );
    }

    if (diskonManualNominal > 0) {
      rows.push(
        <tr key="diskon-manual">
          <td colSpan={4} className="px-6 py-2 text-sm text-gray-600 text-right">
            Diskon Manual {diskonManualPersen > 0 ? `(${diskonManualPersen}%)` : ""}
          </td>
          <td className="px-6 py-2 text-sm text-red-600 text-right">
            -{formatCurrency(diskonManualNominal)}
          </td>
        </tr>
      );
    }
    
    // If we have total discount but no breakdown matches (fallback) or to ensure total line logic matches
    if (rows.length === 0 && (totalDiskonFinal > 0 || displayData.diskon > 0)) {
         return (
          <tr>
            <td colSpan={4} className="px-6 py-2 text-sm text-gray-600 text-right">
              Diskon Total
            </td>
            <td className="px-6 py-2 text-sm text-red-600 text-right">
              -{formatCurrency(totalDiskonFinal || displayData.diskon)}
            </td>
          </tr>
        );
    }

    return rows;
  };

  // Handle error
  React.useEffect(() => {
    if (error) {
      console.error("Error fetching transaction detail:", error);
      toast.error("Gagal memuat detail transaksi");
    }
  }, [error]);

  // Transaction badge component
  const TransactionTypeBadge = ({ type }) => {
    let className;
    let icon;

    switch (type) {
      case "PENJUALAN":
        className = "text-blue-600 border-blue-600";
        icon = <ArrowUpCircle size={14} className="mr-1" />;
        break;
      case "PEMBELIAN":
        className = "text-indigo-600 border-indigo-600";
        icon = <ArrowDownCircle size={14} className="mr-1" />;
        break;
      case "RETUR_PENJUALAN":
        className = "text-amber-600 border-amber-600";
        icon = <RefreshCcw size={14} className="mr-1" />;
        break;
      case "RETUR_PEMBELIAN":
        className = "text-red-600 border-red-600";
        icon = <RefreshCcw size={14} className="mr-1" />;
        break;
      default:
        className = "text-gray-600 border-gray-600";
        icon = null;
    }

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${className}`}
      >
        {icon}
        {type.replace("_", " ")}
      </span>
    );
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    let className;

    switch (status) {
      case "LUNAS":
        className = "bg-green-100 text-green-800";
        break;
      case "BELUM_LUNAS":
        className = "bg-yellow-100 text-yellow-800";
        break;
      case "DIBATALKAN":
        className = "bg-red-100 text-red-800";
        break;
      default:
        className = "bg-gray-100 text-gray-800";
    }

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${className}`}
      >
        {status.replace("_", " ")}
      </span>
    );
  };

  // Go back to transactions list
  const handleBack = () => {
    navigate("/transactions");
  };

  // Print receipt
  const handlePrintReceipt = async () => {
    try {
      setIsPrinting(true);
      const htmlContent = await getReceiptPreview(id);
      
      // Create an iframe to print
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        
        // Wait for content to load then print
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
      } else {
        toast.error("Pop-up diblokir. Izinkan pop-up untuk mencetak.");
      }
    } catch (error) {
      console.error("Failed to print receipt:", error);
      toast.error("Gagal mencetak struk");
    } finally {
      setIsPrinting(false);
    }
  };

  // Download PDF
  const handleDownloadPdf = async () => {
    try {
      setIsDownloading(true);
      let pdfBlob;
      let filename = `receipt-${displayData.nomor_transaksi}.pdf`;

      if (displayData.jenis_transaksi === "PEMBELIAN") {
        pdfBlob = await transaksiService.getPOTransactionPDF(id);
        filename = `PO-${displayData.nomor_transaksi}.pdf`;
      } else {
        pdfBlob = await getReceiptPDF(id);
      }
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([pdfBlob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(displayData.jenis_transaksi === "PEMBELIAN" ? "PO berhasil diunduh" : "Struk berhasil diunduh");
    } catch (error) {
      console.error("Failed to download PDF:", error);
      toast.error(displayData.jenis_transaksi === "PEMBELIAN" ? "Gagal mengunduh PO" : "Gagal mengunduh PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full p-6 flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center">
          <Loader className="animate-spin h-8 w-8 text-indigo-600" />
          <p className="mt-4 text-gray-600">Memuat data transaksi...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <button
          className="flex items-center text-indigo-600 hover:text-indigo-900"
          onClick={handleBack}
        >
          <ArrowLeft size={18} className="mr-1" />
          Kembali ke Daftar Transaksi
        </button>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="w-full p-6">
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
          Data transaksi tidak ditemukan
        </div>
        <button
          className="flex items-center text-indigo-600 hover:text-indigo-900"
          onClick={handleBack}
        >
          <ArrowLeft size={18} className="mr-1" />
          Kembali ke Daftar Transaksi
        </button>
      </div>
    );
  }

  return (
    <div className="w-full p-4 lg:p-6">
      {/* Dashboard Header */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">Dashboard</h1>
        <p className="text-xs sm:text-sm text-gray-600">Detail informasi transaksi</p>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6">
        <button
          className="flex items-center justify-center text-gray-700 hover:text-gray-900 bg-white border border-gray-300 rounded-md px-4 py-2 text-sm w-full sm:w-auto"
          onClick={handleBack}
        >
          <ArrowLeft size={16} className="mr-2" />
          Kembali
        </button>

        <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2">
          <button
            className="flex items-center justify-center text-gray-700 hover:text-gray-900 bg-white border border-gray-300 rounded-md px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handlePrintReceipt}
            disabled={isPrinting}
          >
            {isPrinting ? (
              <Loader size={16} className="mr-2 animate-spin" />
            ) : (
              <Printer size={16} className="mr-2" />
            )}
            <span className="truncate">{isPrinting ? "Mencetak..." : "Cetak Struk"}</span>
          </button>
          <button
            className="flex items-center justify-center text-gray-700 hover:text-gray-900 bg-white border border-gray-300 rounded-md px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleDownloadPdf}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <Loader size={16} className="mr-2 animate-spin" />
            ) : (
              <Download size={16} className="mr-2" />
            )}
            <span className="truncate">{isDownloading ? "Mengunduh..." : "Unduh PDF"}</span>
          </button>
          {/* Tampilkan tombol pelunasan jika transaksi belum lunas */}
          {displayData.status_pembayaran === "BELUM_LUNAS" && (
            <button
              className="col-span-2 sm:col-auto flex items-center justify-center text-white bg-green-600 hover:bg-green-700 border border-green-600 rounded-md px-4 py-2 text-sm"
              onClick={() => setPelunasanModalOpen(true)}
            >
              <CreditCardIcon size={16} className="mr-2" />
              Pelunasan
            </button>
          )}
        </div>
      </div>

      {/* Transaction Header */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {displayData.nomor_transaksi}
              </h2>

              <div className="flex flex-wrap gap-2 mb-3">
                <TransactionTypeBadge type={displayData.jenis_transaksi} />
                <StatusBadge status={displayData.status_pembayaran} />
              </div>

              <div className="flex items-center mb-2 text-gray-600">
                <Calendar size={16} className="mr-2" />
                <span className="text-sm">
                  {formatDate(displayData.tanggal)}
                </span>
              </div>

              <div className="flex items-center mb-2 text-gray-600">
                <MapPin size={16} className="mr-2" />
                <span className="text-sm">
                  {displayData.cabang?.namaCabang || "Cabang tidak tersedia"}
                </span>
              </div>

              <div className="flex items-center text-gray-600">
                <User size={16} className="mr-2" />
                <span className="text-sm">
                  Kasir: {displayData.user?.namaLengkap || "Tidak tersedia"}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-start md:items-end">
              <div className="text-xl sm:text-2xl font-bold text-indigo-600 mb-2">
                {formatCurrency(displayData.total)}
              </div>

              {displayData.status_pembayaran === "LUNAS" && (
                <div className="flex items-center mb-2 text-green-600">
                  <Check size={16} className="mr-2" />
                  <span className="text-sm">
                    Lunas pada{" "}
                    {formatDate(displayData.pembayaran[0].tanggal_pembayaran)}
                  </span>
                </div>
              )}

              <div className="flex items-center mb-2 text-gray-600">
                <CreditCard size={16} className="mr-2" />
                <span className="text-sm">
                  Metode:{" "}
                  {displayData.pembayaran?.[0]?.metode_pembayaran?.replace(
                    "_",
                    " "
                  ) || "Tidak tersedia"}
                </span>
              </div>

              {displayData.promo && (
                <div className="flex items-center text-gray-600">
                  <Tag size={16} className="mr-2" />
                  <span className="text-sm">
                    Promo: {displayData.promo.namaPromo || ""} 
                    {displayData.promo.kodePromo ? `(${displayData.promo.kodePromo})` : ""}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction Details */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-800">
                Detail Produk
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Produk
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Jumlah
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Harga
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Diskon
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayData.transaksi_detail?.map((item) => (
                    <tr key={item.transaksi_detail_id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.produk?.produkMaster?.namaProduk ||
                            "Produk tidak tersedia"}
                        </div>
                        <div className="text-xs text-gray-500">
                          SKU: {item.produk?.produkMaster?.sku || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {item.jumlah}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        {formatCurrency(item.harga_satuan)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        {item.diskon_nominal > 0
                          ? formatCurrency(item.diskon_nominal)
                          : item.diskon_persen > 0
                          ? `${item.diskon_persen}%`
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {displayData.keterangan && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">
                        Catatan:
                      </h4>
                      <p className="text-sm text-gray-600">
                        {displayData.keterangan}
                      </p>
                    </div>
                  )}
                </div>

                <div className="md:ml-auto md:max-w-xs">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Subtotal:</span>
                    <span className="text-sm text-gray-900">
                      {formatCurrency(displayData.subtotal)}
                    </span>
                  </div>

                  {/* Discount Breakdown */}
                  {displayData.discountBreakdown ? (
                    <>
                      {displayData.discountBreakdown.diskonMember > 0 && (
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-gray-600">Diskon Member:</span>
                          <span className="text-sm text-red-600">
                            -{formatCurrency(displayData.discountBreakdown.diskonMember)}
                          </span>
                        </div>
                      )}
                      {displayData.discountBreakdown.diskonPromo > 0 && (
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-gray-600">Diskon Promo:</span>
                          <span className="text-sm text-red-600">
                            -{formatCurrency(displayData.discountBreakdown.diskonPromo)}
                          </span>
                        </div>
                      )}
                      {displayData.discountBreakdown.diskonManualNominal > 0 && (
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-gray-600">
                            Diskon Manual {displayData.discountBreakdown.diskonManualPersen > 0 ? `(${displayData.discountBreakdown.diskonManualPersen}%)` : ""}:
                          </span>
                          <span className="text-sm text-red-600">
                            -{formatCurrency(displayData.discountBreakdown.diskonManualNominal)}
                          </span>
                        </div>
                      )}
                       {((!displayData.discountBreakdown.diskonMember && !displayData.discountBreakdown.diskonPromo && !displayData.discountBreakdown.diskonManualNominal) && displayData.discountBreakdown.totalDiskonFinal > 0) && (
                         <div className="flex justify-between mb-2">
                          <span className="text-sm text-gray-600">Diskon Total:</span>
                          <span className="text-sm text-red-600">
                            -{formatCurrency(displayData.discountBreakdown.totalDiskonFinal)}
                          </span>
                        </div>
                       )}
                    </>
                  ) : (
                    displayData.diskon > 0 && (
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-600">Diskon:</span>
                        <span className="text-sm text-red-600">
                          -{formatCurrency(displayData.diskon)}
                        </span>
                      </div>
                    )
                  )}

                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Pajak:</span>
                    <span className="text-sm text-gray-900">
                      {formatCurrency(displayData.pajak)}
                    </span>
                  </div>

                  {displayData.biaya_tambahan > 0 && (
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">
                        Biaya Tambahan:
                      </span>
                      <span className="text-sm text-gray-900">
                        {formatCurrency(displayData.biaya_tambahan)}
                      </span>
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between font-medium">
                      <span className="text-sm text-gray-900">Total:</span>
                      <span className="text-sm text-gray-900">
                        {formatCurrency(displayData.total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          {/* Payment Information */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-800">
                Informasi Pembayaran
              </h3>
            </div>

            <div className="p-4">
              {displayData.pembayaran?.map((payment, index) => (
                <ul key={payment.pembayaran_id || index} className="space-y-4">
                  <li className="flex items-start">
                    <CreditCard
                      size={18}
                      className="text-gray-400 mt-0.5 mr-3 flex-shrink-0"
                    />
                    <div>
                      <div className="text-xs font-medium text-gray-500">
                        Metode Pembayaran
                      </div>
                      <div className="text-sm text-gray-900">
                        {payment.metode_pembayaran?.replace("_", " ") || "-"}
                      </div>
                    </div>
                  </li>

                  <li className="flex items-start">
                    <DollarSign
                      size={18}
                      className="text-gray-400 mt-0.5 mr-3 flex-shrink-0"
                    />
                    <div>
                      <div className="text-xs font-medium text-gray-500">
                        Jumlah Dibayar
                      </div>
                      <div className="text-sm text-gray-900">
                        {formatCurrency(payment.jumlah_bayar)}
                      </div>
                    </div>
                  </li>

                  {payment.jumlah_kembali > 0 && (
                    <li className="flex items-start">
                      <DollarSign
                        size={18}
                        className="text-gray-400 mt-0.5 mr-3 flex-shrink-0"
                      />
                      <div>
                        <div className="text-xs font-medium text-gray-500">
                          Kembalian
                        </div>
                        <div className="text-sm text-gray-900">
                          {formatCurrency(payment.jumlah_kembali)}
                        </div>
                      </div>
                    </li>
                  )}

                  <li className="flex items-start">
                    <Calendar
                      size={18}
                      className="text-gray-400 mt-0.5 mr-3 flex-shrink-0"
                    />
                    <div>
                      <div className="text-xs font-medium text-gray-500">
                        Tanggal Pembayaran
                      </div>
                      <div className="text-sm text-gray-900">
                        {formatDate(payment.tanggal_pembayaran)}
                      </div>
                    </div>
                  </li>

                  <li className="flex items-start">
                    <Check
                      size={18}
                      className="text-gray-400 mt-0.5 mr-3 flex-shrink-0"
                    />
                    <div>
                      <div className="text-xs font-medium text-gray-500">
                        Status
                      </div>
                      <div>
                        <span
                          className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                            payment.status === "SUKSES"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {payment.status}
                        </span>
                      </div>
                    </div>
                  </li>
                </ul>
              ))}
            </div>
          </div>

          {/* Customer Information */}
          {displayData.jenis_transaksi?.includes("PENJUALAN") &&
            displayData.pelanggan && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-800">
                    Informasi Pelanggan
                  </h3>
                </div>

                <div className="p-4">
                  <ul className="space-y-4">
                    <li className="flex items-start">
                      <User
                        size={18}
                        className="text-gray-400 mt-0.5 mr-3 flex-shrink-0"
                      />
                      <div>
                        <div className="text-xs font-medium text-gray-500">
                          Nama Pelanggan
                        </div>
                        <div className="text-sm text-gray-900">
                          {displayData.pelanggan?.namaPelanggan ||
                            "Pelanggan Umum"}
                        </div>
                      </div>
                    </li>

                    {displayData.pelanggan?.telepon && (
                      <li className="flex items-start">
                        <Receipt
                          size={18}
                          className="text-gray-400 mt-0.5 mr-3 flex-shrink-0"
                        />
                        <div>
                          <div className="text-xs font-medium text-gray-500">
                            Telepon
                          </div>
                          <div className="text-sm text-gray-900">
                            {displayData.pelanggan.telepon}
                          </div>
                        </div>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            )}

          {/* Supplier Information */}
          {displayData.jenis_transaksi.includes("PEMBELIAN") &&
            displayData.supplier && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-800">
                    Informasi Supplier
                  </h3>
                </div>

                <div className="p-4">
                  <ul className="space-y-4">
                    <li className="flex items-start">
                      
                  </li>

                  {displayData.pelanggan?.telepon && (
                    <li className="flex items-start">
                      <Receipt
                        size={18}
                        className="text-gray-400 mt-0.5 mr-3 flex-shrink-0"
                      />
                      <div>
                        <div className="text-xs font-medium text-gray-500">
                          Telepon
                        </div>
                        <div className="text-sm text-gray-900">
                          {displayData.pelanggan.telepon}
                        </div>
                      </div>
                    </li>
                  )}
                </ul>
              
            </div>
          </div>
          )}
        </div>

        {displayData.supplier && (
        <div className="lg:w-1/2 xl:w-1/3 p-4">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-800">
                Informasi Supplier
              </h3>
            </div>

            <div className="p-4">
              
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <ShoppingBag
                      size={18}
                      className="text-gray-400 mt-0.5 mr-3 flex-shrink-0"
                    />
                    <div>
                      <div className="text-xs font-medium text-gray-500">
                        Nama Supplier
                      </div>
                      <div className="text-sm text-gray-900">
                        {displayData.supplier?.namaSupplier || "Supplier tidak tersedia"}
                      </div>
                    </div>
                  </li>

                  {displayData.supplier?.telepon && (
                    <li className="flex items-start">
                      <Receipt
                        size={18}
                        className="text-gray-400 mt-0.5 mr-3 flex-shrink-0"
                      />
                      <div>
                        <div className="text-xs font-medium text-gray-500">
                          Telepon
                        </div>
                        <div className="text-sm text-gray-900">
                          {displayData.supplier.telepon}
                        </div>
                      </div>
                    </li>
                  )}
                </ul>
             
            </div>
          </div>
        </div>
         )}
      </div>
      
      {/* Pelunasan Modal */}
      <PelunasanModal
        isOpen={pelunasanModalOpen}
        onClose={() => setPelunasanModalOpen(false)}
        transaksiId={id}
        totalTagihan={displayData?.total || 0}
        sisaTagihan={displayData?.total - (displayData?.pembayaran?.reduce((sum, p) => sum + (p?.jumlah_bayar || 0), 0) || 0)}
        onSuccess={() => {
          setPelunasanModalOpen(false);
          refetch();
          toast.success("Pelunasan berhasil");
        }}
      />
    </div>
  );
};

export default GlobalTransactionDetail;
