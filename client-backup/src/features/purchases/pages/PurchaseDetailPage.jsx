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
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-md">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700">
            Gagal memuat data transaksi: {error.message || "Terjadi kesalahan"}
          </span>
        </div>
      </div>
    );
  }

  const transaction = transactionData?.data;
  if (!transaction) {
    return (
      <div className="p-4 bg-yellow-50 rounded-md">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
          <span className="text-yellow-700">
            Data transaksi tidak ditemukan
          </span>
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

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="mr-4 p-2 rounded-full bg-white shadow-sm hover:bg-gray-50"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              Detail Transaksi Pembelian
            </h1>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handlePrintReceipt}
              className="px-3 py-2 inline-flex items-center border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Printer className="h-4 w-4 mr-2" />
              Cetak
            </button>
            <button
              onClick={handleDownloadReceipt}
              className="px-3 py-2 inline-flex items-center border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Unduh PDF
            </button>
            {transaction.supplier?.email && (
              <button
                onClick={handleSendReceiptEmail}
                disabled={emailReceiptMutation.isLoading}
                className="px-3 py-2 inline-flex items-center border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Mail className="h-4 w-4 mr-2" />
                {emailReceiptMutation.isLoading ? "Mengirim..." : "Email"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status Banner */}
      <div
        className={`mb-6 rounded-md p-4 ${
          isCancelled ? "bg-red-50" : isPaid ? "bg-green-50" : "bg-yellow-50"
        }`}
      >
        <div className="flex">
          <div className="flex-shrink-0">
            {isCancelled ? (
              <XCircle className="h-5 w-5 text-red-400" />
            ) : isPaid ? (
              <CheckCircle className="h-5 w-5 text-green-400" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            )}
          </div>
          <div className="ml-3">
            <h3
              className={`text-sm font-medium ${
                isCancelled
                  ? "text-red-800"
                  : isPaid
                  ? "text-green-800"
                  : "text-yellow-800"
              }`}
            >
              {isCancelled
                ? "Transaksi Dibatalkan"
                : isPaid
                ? "Transaksi Lunas"
                : "Menunggu Pembayaran"}
            </h3>
            <div
              className={`mt-2 text-sm ${
                isCancelled
                  ? "text-red-700"
                  : isPaid
                  ? "text-green-700"
                  : "text-yellow-700"
              }`}
            >
              {isCancelled ? (
                <p>Transaksi ini telah dibatalkan.</p>
              ) : isPaid ? (
                <p>
                  Pembayaran telah lunas pada{" "}
                  {formatDate(transaction.tanggal_lunas)}.
                </p>
              ) : (
                <p>Transaksi ini belum dibayar atau belum lunas.</p>
              )}
            </div>
            {!isPaid && !isCancelled && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentForm(true)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <CreditCard className="h-4 w-4 mr-1" />
                  Tambah Pembayaran
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Informasi Transaksi
              </h2>
            </div>
            <div className="p-6">
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Nomor Transaksi
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 font-medium">
                    {transaction.nomor_transaksi}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Tanggal</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDate(transaction.tanggal)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Cabang</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {transaction.cabang?.namaCabang || "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Dibuat Oleh
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {transaction.createdByUser?.namaLengkap || "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Supplier
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 flex items-center">
                    <Truck className="h-4 w-4 mr-1 text-gray-400" />
                    {transaction.supplier?.namaSupplier || "-"}
                    {transaction.supplier && (
                      <button
                        className="ml-1 text-indigo-600 hover:text-indigo-800"
                        onClick={() =>
                          navigate(
                            `/superadmin/suppliers/${transaction.supplier.id}`
                          )
                        }
                      >
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Status Pembayaran
                  </dt>
                  <dd className="mt-1 text-sm">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isCancelled
                          ? "bg-red-100 text-red-800"
                          : isPaid
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {isCancelled
                        ? "Dibatalkan"
                        : isPaid
                        ? "Lunas"
                        : "Belum Lunas"}
                    </span>
                  </dd>
                </div>
                {transaction.keterangan && (
                  <div className="col-span-2">
                    <dt className="text-sm font-medium text-gray-500">
                      Keterangan
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {transaction.keterangan}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Products */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Produk</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produk
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jumlah
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Harga Satuan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transaction.transaksi_detail?.map((detail) => (
                    <tr key={detail.transaksi_detail_id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {detail.produk?.produkMaster?.namaProduk ||
                            "Produk tidak tersedia"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {detail.produk?.produkMaster?.sku || ""}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {detail.jumlah}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(detail.harga_satuan)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {formatCurrency(detail.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <th
                      colSpan="3"
                      className="px-6 py-3 text-right text-sm font-medium text-gray-500"
                    >
                      Subtotal
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                      {formatCurrency(transaction.subtotal)}
                    </th>
                  </tr>
                  {transaction.biaya_tambahan > 0 && (
                    <tr>
                      <th
                        colSpan="3"
                        className="px-6 py-3 text-right text-sm font-medium text-gray-500"
                      >
                        Biaya Tambahan
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                        {formatCurrency(transaction.biaya_tambahan)}
                      </th>
                    </tr>
                  )}
                  <tr>
                    <th
                      colSpan="3"
                      className="px-6 py-3 text-right text-sm font-medium text-gray-900"
                    >
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                      {formatCurrency(transaction.total)}
                    </th>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Payments & Actions */}
        <div className="space-y-6">
          {/* Payments */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Pembayaran</h2>
              {!isPaid && !isCancelled && (
                <button
                  type="button"
                  onClick={() => setShowPaymentForm(true)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Tambah
                </button>
              )}
            </div>
            <div className="p-6">
              {transaction.pembayaran && transaction.pembayaran.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {transaction.pembayaran.map((payment) => (
                    <li key={payment.pembayaran_id} className="py-3">
                      <div className="flex justify-between text-sm">
                        <div className="font-medium text-gray-900">
                          {payment.metode_pembayaran.replace("_", " ")}
                          {payment.provider && ` - ${payment.provider}`}
                        </div>
                        <div className="font-medium text-gray-900">
                          {formatCurrency(payment.jumlah_bayar)}
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <div>{formatDate(payment.tanggal_pembayaran)}</div>
                        <div>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              payment.status === "SUCCESS"
                                ? "bg-green-100 text-green-800"
                                : payment.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {payment.status === "SUCCESS"
                              ? "Sukses"
                              : payment.status === "PENDING"
                              ? "Pending"
                              : "Gagal"}
                          </span>
                        </div>
                      </div>
                      {payment.keterangan && (
                        <div className="text-xs text-gray-500 mt-1">
                          {payment.keterangan}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-4">
                  <FileText className="mx-auto h-8 w-8 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Belum ada pembayaran
                  </h3>
                  {!isCancelled && (
                    <p className="mt-1 text-sm text-gray-500">
                      Tambahkan pembayaran untuk transaksi ini.
                    </p>
                  )}
                </div>
              )}

              {/* Total paid & remaining */}
              {transaction.pembayaran && transaction.pembayaran.length > 0 && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">
                        Total Dibayar
                      </dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {formatCurrency(
                          transaction.pembayaran
                            .filter((p) => p.status === "SUCCESS")
                            .reduce(
                              (sum, p) => sum + parseFloat(p.jumlah_bayar),
                              0
                            )
                        )}
                      </dd>
                    </div>
                    {!isPaid && !isCancelled && (
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">
                          Sisa
                        </dt>
                        <dd className="text-sm font-medium text-red-600">
                          {formatCurrency(
                            parseFloat(transaction.total) -
                              transaction.pembayaran
                                .filter((p) => p.status === "SUCCESS")
                                .reduce(
                                  (sum, p) => sum + parseFloat(p.jumlah_bayar),
                                  0
                                )
                          )}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {canBeCancelled && (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Tindakan</h2>
              </div>
              <div className="p-6">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <XCircle className="h-5 w-5 mr-2" />
                  Batalkan Transaksi
                </button>
              </div>
            </div>
          )}
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
