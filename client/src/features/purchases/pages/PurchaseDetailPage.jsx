import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Printer,
  FileText,
  XCircle,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Download,
  Mail,
  Truck,
  Plus,
  Calendar,
  Hash,
  User,
  DollarSign
} from "lucide-react";
import { toast } from "react-hot-toast";
import { formatCurrency, formatDate } from "../../../common/utils/format";
import transaksiService from "../../../services/transaksiService";
import Spinner from "../../../features/common/Spinner";
import PaymentForm from "../../transactions/components/PaymentForm";
import CancelTransactionModal from "../../transactions/components/CancelTransactionModal";

const PurchaseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Fetch transaction data
  const {
    data: transactionData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["transaction", id],
    queryFn: () => transaksiService.getTransaksiById(id),
  });

  // Handle transaction cancellation
  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }) =>
      transaksiService.cancelTransaksi(id, reason),
    onSuccess: () => {
      toast.success("Transaksi pembelian berhasil dibatalkan");
      queryClient.invalidateQueries(["transaction", id]);
      setShowCancelModal(false);
    },
    onError: (error) => {
      toast.error(
        `Gagal membatalkan transaksi: ${error.message || "Terjadi kesalahan"}`
      );
    },
  });

  // Handle email receipt
  const emailReceiptMutation = useMutation({
    mutationFn: ({ id, email }) => transaksiService.emailReceipt(id, email),
    onSuccess: () => {
      toast.success("Bukti pembelian berhasil dikirim via email");
    },
    onError: (error) => {
      toast.error(
        `Gagal mengirim email: ${error.message || "Terjadi kesalahan"}`
      );
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Spinner size="lg" />
        <span className="ml-3 text-gray-600">Memuat detail transaksi...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex justify-center">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-red-100 max-w-lg w-full text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Gagal Memuat Data</h3>
          <p className="text-gray-500 mb-6">
            {error.message || "Terjadi kesalahan saat mengambil data transaksi."}
          </p>
          <button
             onClick={() => navigate(-1)}
             className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
          >
             Kembali
          </button>
        </div>
      </div>
    );
  }

  const transaction = transactionData?.data;
  if (!transaction) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex justify-center">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-yellow-100 max-w-lg w-full text-center">
           <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
             <AlertTriangle className="h-8 w-8 text-yellow-500" />
           </div>
           <h3 className="text-xl font-bold text-gray-900 mb-2">Transaksi Tidak Ditemukan</h3>
           <p className="text-gray-500 mb-6">
             Data transaksi yang Anda cari tidak tersedia atau telah dihapus.
           </p>
           <button
              onClick={() => navigate("/purchases")}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
           >
              Kembali ke Daftar Pembelian
           </button>
        </div>
      </div>
    );
  }

  const handlePrintReceipt = () => {
    // Implement receipt printing logic
    window.open(`/print/receipt/${id}`, "_blank");
  };

  const handleDownloadReceipt = async () => {
    try {
      const response = await transaksiService.getTransaksiReceipt(id);
      // Create a download link for PDF
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `receipt-${transaction.nomor_transaksi}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast.error("Gagal mengunduh bukti pembelian");
    }
  };

  const handleSendReceiptEmail = () => {
    const email = transaction.supplier?.email;
    if (!email) {
      toast.error("Email supplier tidak tersedia");
      return;
    }

    emailReceiptMutation.mutate({ id, email });
  };

  const isPaid = transaction.status_pembayaran === "LUNAS";
  const isCancelled = transaction.status_pembayaran === "DIBATALKAN";
  const canBeCancelled = !isPaid && !isCancelled;

  // Calculate remaining balance
  const totalPaid = transaction.pembayaran
     ? transaction.pembayaran
         .filter((p) => p.status === "SUCCESS")
         .reduce((sum, p) => sum + parseFloat(p.jumlah_bayar), 0)
     : 0;
  
  const remainingAttributes = parseFloat(transaction.total) - totalPaid;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header with Background */}
      <div className="bg-indigo-600 text-white pb-24 pt-8">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-start">
               <div>
                  <button
                     onClick={() => navigate(-1)}
                     className="flex items-center text-indigo-100 hover:text-white mb-6 transition-colors"
                  >
                     <ArrowLeft className="h-4 w-4 mr-1" />
                     <span>Kembali</span>
                  </button>
                  <h1 className="text-3xl font-bold">
                     Detail Pembelian
                  </h1>
                  <p className="text-indigo-100 mt-2 flex items-center">
                     <span className="opacity-80">No. Transaksi:</span> 
                     <span className="font-mono ml-2 bg-indigo-500 px-2 py-0.5 rounded text-sm">{transaction.nomor_transaksi}</span>
                  </p>
               </div>
               
               <div className="flex space-x-2">
                  <button
                     onClick={handlePrintReceipt}
                     className="px-3 py-2 bg-indigo-500 hover:bg-indigo-400 rounded-lg text-sm font-medium transition-colors flex items-center"
                     title="Cetak Struk"
                  >
                     <Printer className="h-4 w-4 mr-2" />
                     Cetak
                  </button>
                  <button
                     onClick={handleDownloadReceipt}
                     className="px-3 py-2 bg-indigo-500 hover:bg-indigo-400 rounded-lg text-sm font-medium transition-colors flex items-center"
                     title="Unduh PDF"
                  >
                     <Download className="h-4 w-4 mr-2" />
                     Unduh
                  </button>
               </div>
            </div>
         </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16">
         {/* Status Cards */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Payment Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
               <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                  isPaid ? "bg-green-100 text-green-600" : 
                  isCancelled ? "bg-red-100 text-red-600" : 
                  "bg-orange-100 text-orange-600"
               }`}>
                  {isPaid ? <CheckCircle size={24} /> : 
                   isCancelled ? <XCircle size={24} /> : 
                   <DollarSign size={24} />}
               </div>
               <div>
                  <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Status Pembayaran</p>
                  <p className={`text-lg font-bold ${
                     isPaid ? "text-green-700" : 
                     isCancelled ? "text-red-700" : 
                     "text-orange-700"
                  }`}>
                     {isCancelled ? "DIBATALKAN" : isPaid ? "LUNAS" : "BELUM LUNAS"}
                  </p>
               </div>
            </div>
            
            {/* Supplier Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
               <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-4">
                  <Truck size={24} />
               </div>
               <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Supplier</p>
                  <p className="text-lg font-bold text-gray-900 truncate">
                     {transaction.supplier?.namaSupplier || "-"}
                  </p>
                  {transaction.supplier && (
                     <button 
                        onClick={() => navigate(`/suppliers/${transaction.supplier.id}`)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center mt-0.5"
                     >
                        Detail Supplier <ExternalLink size={10} className="ml-1" />
                     </button>
                  )}
               </div>
            </div>

            {/* Date Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
               <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mr-4">
                  <Calendar size={24} />
               </div>
               <div>
                  <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Tanggal Transaksi</p>
                  <p className="text-lg font-bold text-gray-900">
                     {formatDate(transaction.tanggal)}
                  </p>
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Transaction Details */}
            <div className="lg:col-span-2 space-y-8">
               
               {/* Product List */}
               <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                     <h2 className="text-lg font-bold text-gray-900 flex items-center">
                        <Hash className="h-5 w-5 mr-2 text-gray-500" />
                        Rincian Produk
                     </h2>
                  </div>
                  <div className="overflow-x-auto">
                     <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50/50">
                           <tr>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                 Produk
                              </th>
                              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                 Qty
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                 Harga Satuan
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                 Total
                              </th>
                           </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                           {transaction.transaksi_detail?.map((detail) => (
                              <tr key={detail.transaksi_detail_id} className="hover:bg-gray-50 transition-colors">
                                 <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-bold text-gray-900">
                                       {detail.produk?.produkMaster?.namaProduk || "Produk tidak tersedia"}
                                    </div>
                                    <div className="text-xs text-gray-500 font-mono mt-0.5">
                                       {detail.produk?.produkMaster?.sku || "SKU: -"}
                                    </div>
                                 </td>
                                 <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 font-bold text-xs">
                                       {detail.jumlah}
                                    </span>
                                 </td>
                                 <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600">
                                    {formatCurrency(detail.harga_satuan)}
                                 </td>
                                 <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                                    {formatCurrency(detail.subtotal)}
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                        <tfoot className="bg-gray-50/50">
                           <tr>
                              <td colSpan="3" className="px-6 py-4 text-right text-sm font-medium text-gray-500">
                                 Subtotal
                              </td>
                              <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                 {formatCurrency(transaction.subtotal)}
                              </td>
                           </tr>
                           {transaction.biaya_tambahan > 0 && (
                              <tr>
                                 <td colSpan="3" className="px-6 py-2 text-right text-sm font-medium text-gray-500">
                                    Biaya Tambahan
                                 </td>
                                 <td className="px-6 py-2 text-right text-sm font-medium text-gray-900">
                                    {formatCurrency(transaction.biaya_tambahan)}
                                 </td>
                              </tr>
                           )}
                           <tr className="bg-indigo-50 border-t border-indigo-100">
                              <td colSpan="3" className="px-6 py-4 text-right text-base font-bold text-indigo-900">
                                 Total Pembelian
                              </td>
                              <td className="px-6 py-4 text-right text-xl font-bold text-indigo-700">
                                 {formatCurrency(transaction.total)}
                              </td>
                           </tr>
                        </tfoot>
                     </table>
                  </div>
               </div>

               {/* Additional Information */}
               <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-6">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 border-b border-gray-100 pb-2">
                     Informasi Tambahan
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <p className="text-xs text-gray-500 font-medium uppercase mb-1">Dibuat Oleh</p>
                        <div className="flex items-center">
                           <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 mr-2">
                              <User size={14} />
                           </div>
                           <p className="text-sm font-medium text-gray-900">{transaction.createdByUser?.namaLengkap || "System"}</p>
                        </div>
                     </div>
                     <div>
                        <p className="text-xs text-gray-500 font-medium uppercase mb-1">Cabang</p>
                        <p className="text-sm font-medium text-gray-900">{transaction.cabang?.namaCabang || "-"}</p>
                     </div>
                     <div className="md:col-span-2">
                        <p className="text-xs text-gray-500 font-medium uppercase mb-1">Catatan</p>
                        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 italic border border-gray-200">
                           {transaction.keterangan || "Tidak ada catatan"}
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Right Column: Payments & Actions */}
            <div className="space-y-8">
               {/* Payment Summary */}
               <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                     <h2 className="text-lg font-bold text-gray-900 flex items-center">
                        <CreditCard className="h-5 w-5 mr-2 text-gray-500" />
                        Pembayaran
                     </h2>
                  </div>
                  
                  <div className="p-6">
                     <div className="mb-6 space-y-3">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                           <span className="text-sm text-gray-600">Total Tagihan</span>
                           <span className="font-bold text-gray-900">{formatCurrency(transaction.total)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-100">
                           <span className="text-sm text-green-700">Sudah Dibayar</span>
                           <span className="font-bold text-green-700">{formatCurrency(totalPaid)}</span>
                        </div>
                        {!isPaid && !isCancelled && (
                           <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100 animate-pulse">
                              <span className="text-sm text-red-700 font-medium">Sisa Tagihan</span>
                              <span className="font-bold text-red-700">{formatCurrency(remainingAttributes)}</span>
                           </div>
                        )}
                     </div>

                     <div className="space-y-4">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Riwayat Pembayaran</h4>
                        {transaction.pembayaran && transaction.pembayaran.length > 0 ? (
                           <div className="space-y-3">
                              {transaction.pembayaran.map((payment) => (
                                 <div key={payment.pembayaran_id} className="relative pl-4 border-l-2 border-gray-200">
                                    <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                                    <div className="flex justify-between items-start">
                                       <span className="text-sm font-medium text-gray-900">{formatCurrency(payment.jumlah_bayar)}</span>
                                       <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                                          payment.status === "SUCCESS" ? "bg-green-100 text-green-700" :
                                          payment.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                                          "bg-red-100 text-red-700"
                                       }`}>
                                          {payment.status}
                                       </span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                       {formatDate(payment.tanggal_pembayaran)} • {payment.metode_pembayaran.replace("_", " ")}
                                    </div>
                                 </div>
                              ))}
                           </div>
                        ) : (
                           <div className="text-center py-4 text-sm text-gray-400 italic">
                              Belum ada riwayat pembayaran
                           </div>
                        )}
                     </div>

                     {!isPaid && !isCancelled && (
                        <div className="mt-8">
                           <button
                              type="button"
                              onClick={() => setShowPaymentForm(true)}
                              className="w-full flex justify-center items-center px-4 py-3 border border-transparent text-sm font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5"
                           >
                              <Plus className="h-5 w-5 mr-2" />
                              Tambah Pembayaran
                           </button>
                        </div>
                     )}
                  </div>
               </div>

               {/* Actions Card */}
               {canBeCancelled && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                     <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
                        Tindakan Lainnya
                     </h3>
                     <button
                        type="button"
                        onClick={() => setShowCancelModal(true)}
                        className="w-full flex justify-center items-center px-4 py-3 border border-red-200 text-sm font-medium rounded-xl text-red-600 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                     >
                        <XCircle className="h-5 w-5 mr-2" />
                        Batalkan Transaksi
                     </button>
                     <p className="text-xs text-gray-500 mt-3 text-center">
                        Tindakan ini tidak dapat dibatalkan setelah dikonfirmasi.
                     </p>
                  </div>
               )}
            </div>
         </div>
      </div>

      {/* Payment Form Modal */}
      {showPaymentForm && (
        <PaymentForm
          transactionId={id}
          totalAmount={transaction.total}
          onClose={() => setShowPaymentForm(false)}
          onSuccess={() => {
            setShowPaymentForm(false);
            queryClient.invalidateQueries(["transaction", id]);
          }}
        />
      )}

      {/* Cancel Transaction Modal */}
      {showCancelModal && (
        <CancelTransactionModal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          onConfirm={(reason) => {
            cancelMutation.mutate({ id, reason });
          }}
          isLoading={cancelMutation.isLoading}
        />
      )}
    </div>
  );
};

export default PurchaseDetail;
