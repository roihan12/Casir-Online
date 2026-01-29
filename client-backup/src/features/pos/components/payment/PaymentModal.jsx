import React, { useState, useEffect } from "react";
import { X, CreditCard, DollarSign, Calendar, Check, Loader2, QrCode, Wallet, Landmark, FileText } from "lucide-react";
import { formatCurrency } from "../../hooks/usePOSCart";
import QRISPaymentModal from "./QRISPaymentModal";
import { useCreateTransaction } from "@features/transactions/hooks/usePosQueries";
import toast from "react-hot-toast";

const PaymentModal = ({
  show,
  onClose,
  totalAmount,
  subtotal,
  discountAmount,
  tax,
  onProcessPayment,
  loading = false,
  // Transaction data for QRIS
  transactionData,
  cart,
  saleMode,
  customer,
  currentBranch,
  activeShiftId,
}) => {
  const [paymentMethod, setPaymentMethod] = useState("TUNAI");
  const [amountPaid, setAmountPaid] = useState(totalAmount);
  const [dateOfSupply, setDateOfSupply] = useState("");
  const [multiPay, setMultiPay] = useState(false);
  const [paymentReceived, setPaymentReceived] = useState(0);
  const [postPayAmount, setPostPayAmount] = useState(0);
  const [showQRISModal, setShowQRISModal] = useState(false);

  // State for QRIS transaction
  const [qrisTransaction, setQrisTransaction] = useState(null);
  const [isCreatingQrisTransaction, setIsCreatingQrisTransaction] = useState(false);

  const createTransactionMutation = useCreateTransaction();

  useEffect(() => {
    setAmountPaid(totalAmount);
  }, [totalAmount]);

  const remaining = totalAmount - paymentReceived - postPayAmount;
  const isPaymentComplete = paymentReceived + postPayAmount >= totalAmount;

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    
    // Auto-fill amount based on method
    if (method === "KREDIT_PELANGGAN") {
      setPostPayAmount(totalAmount);
      setPaymentReceived(0);
      setAmountPaid(0);
    } else {
      setPostPayAmount(0);
      setPaymentReceived(totalAmount);
      setAmountPaid(totalAmount);
    }
  };

  const handleQRISPayment = async () => {
    if (!transactionData) {
      toast.error("Transaction data is missing");
      return;
    }

    setIsCreatingQrisTransaction(true);
    try {
      // Step 1: Create transaction first with PENDING status
      const result = await createTransactionMutation.mutateAsync({
        ...transactionData,
        keterangan: `${transactionData.keterangan || ""} via QRIS`,
      });

      setQrisTransaction(result);
      setShowQRISModal(true);
    } catch (error) {
      console.error("Error creating QRIS transaction:", error);
      toast.error(error.response?.data?.message || "Failed to create transaction");
    } finally {
      setIsCreatingQrisTransaction(false);
    }
  };

  const handleQRISComplete = (paymentData) => {
    setShowQRISModal(false);

    // Call the parent's processPayment with QRIS data
    // This will add the payment record and show receipt
    onProcessPayment({
      paymentMethod: "QRIS",
      amountPaid: totalAmount,
      postPayAmount: 0,
      dateOfSupply,
      multiPay: false,
      qrisData: paymentData,
      transactionId: qrisTransaction?.transaksi_id,
      transactionNumber: qrisTransaction?.nomor_transaksi,
    });
  };

  const handleQRISFailed = (error) => {
    setShowQRISModal(false);
    console.error("QRIS Payment Failed:", error);

    // If transaction was created but payment failed, inform user
    if (qrisTransaction) {
      toast.error(`QRIS Payment Failed: ${error}. Transaction created but payment pending.`);
    } else {
      toast.error(`QRIS Payment Failed: ${error}`);
    }
  };

  const handleCompleteSale = () => {
    if (!isPaymentComplete) {
      return;
    }

    onProcessPayment({
      paymentMethod,
      amountPaid: paymentReceived,
      postPayAmount,
      dateOfSupply,
      multiPay,
    });
  };

  const handleClose = () => {
    setPaymentMethod("TUNAI");
    setAmountPaid(totalAmount);
    setDateOfSupply("");
    setMultiPay(false);
    setPaymentReceived(0);
    setPostPayAmount(0);
    setQrisTransaction(null);
    onClose();
  };

  if (!show) return null;

  return (
    <>
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">Selesaikan Pembayaran</h3>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            disabled={loading || isCreatingQrisTransaction}
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Payment Summary */}
        <div className="mb-6 bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between font-medium text-lg mb-2">
            <span className="text-gray-600">Total Tagihan:</span>
            <span className="text-indigo-600 font-bold">{formatCurrency(totalAmount)}</span>
          </div>

          <div className="text-sm text-gray-500 mb-4">
            Subtotal: {formatCurrency(subtotal)} |
            Diskon: -{formatCurrency(discountAmount)} |
            Pajak: {formatCurrency(tax)}
          </div>

          {/* Payment Received */}
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Diterima:</span>
            <span className="text-green-600 font-medium">{formatCurrency(paymentReceived + postPayAmount)}</span>
          </div>

          {/* Remaining */}
          <div className={`flex justify-between items-center font-semibold ${remaining > 0 ? 'text-red-500' : 'text-green-600'}`}>
            <span>Sisa:</span>
            <span>{formatCurrency(Math.abs(remaining))}</span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <button
            className={`flex flex-col items-center justify-center py-4 rounded-lg border-2 transition ${
              paymentMethod === "TUNAI"
                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => handlePaymentMethodChange("TUNAI")}
            disabled={loading || isCreatingQrisTransaction}
          >
            <DollarSign size={24} className="mb-2" />
            <span className="font-medium text-xs text-center">Tunai</span>
          </button>

          <button
            className={`flex flex-col items-center justify-center py-4 rounded-lg border-2 transition ${
              paymentMethod === "KARTU_DEBIT"
                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => handlePaymentMethodChange("KARTU_DEBIT")}
            disabled={loading || isCreatingQrisTransaction}
          >
            <CreditCard size={24} className="mb-2" />
            <span className="font-medium text-xs text-center">Debit</span>
          </button>

          <button
            className={`flex flex-col items-center justify-center py-4 rounded-lg border-2 transition ${
              paymentMethod === "KARTU_KREDIT"
                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => handlePaymentMethodChange("KARTU_KREDIT")}
            disabled={loading || isCreatingQrisTransaction}
          >
            <CreditCard size={24} className="mb-2" />
            <span className="font-medium text-xs text-center">Kredit</span>
          </button>

           <button
            onClick={handleQRISPayment}
            disabled={loading || isCreatingQrisTransaction}
            className="flex flex-col items-center justify-center py-4 rounded-lg border-2 border-purple-600 bg-purple-50 text-purple-700 hover:bg-purple-100 transition relative"
          >
            {isCreatingQrisTransaction ? (
              <Loader2 size={20} className="animate-spin mb-2" />
            ) : (
              <QrCode size={24} className="mb-2" />
            )}
            <span className="font-medium text-xs text-center">QRIS</span>
          </button>

          <button
            className={`flex flex-col items-center justify-center py-4 rounded-lg border-2 transition ${
              paymentMethod === "TRANSFER"
                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => handlePaymentMethodChange("TRANSFER")}
            disabled={loading || isCreatingQrisTransaction}
          >
            <Landmark size={24} className="mb-2" />
            <span className="font-medium text-xs text-center">Transfer</span>
          </button>

          <button
            className={`flex flex-col items-center justify-center py-4 rounded-lg border-2 transition ${
              paymentMethod === "E_WALLET"
                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => handlePaymentMethodChange("E_WALLET")}
            disabled={loading || isCreatingQrisTransaction}
          >
            <Wallet size={24} className="mb-2" />
            <span className="font-medium text-xs text-center">E-Wallet</span>
          </button>

          <button
            className={`flex flex-col items-center justify-center py-4 rounded-lg border-2 transition ${
              paymentMethod === "KREDIT_PELANGGAN"
                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => handlePaymentMethodChange("KREDIT_PELANGGAN")}
            disabled={loading || isCreatingQrisTransaction}
          >
            <FileText size={24} className="mb-2" />
            <span className="font-medium text-xs text-center">Tempo</span>
          </button>
        </div>

        {/* Payment Details */}
        {(paymentMethod === "KARTU_DEBIT" || paymentMethod === "KARTU_KREDIT") && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Detail {paymentMethod === "KARTU_DEBIT" ? "Debit" : "Credit"} Card
            </label>
            <input
              type="text"
              placeholder="Nomor Kartu"
              className="w-full px-4 py-3 border rounded-lg mb-3"
              disabled={loading || isCreatingQrisTransaction}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="MM/YY"
                className="px-4 py-3 border rounded-lg"
                disabled={loading || isCreatingQrisTransaction}
              />
              <input
                type="text"
                placeholder="CVV"
                className="px-4 py-3 border rounded-lg"
                disabled={loading || isCreatingQrisTransaction}
              />
            </div>
          </div>
        )}

        {(paymentMethod === "TRANSFER") && (
             <div className="mb-6">
             <label className="block text-sm font-medium text-gray-700 mb-2">
               Informasi Transfer
             </label>
             <input
               type="text"
               placeholder="Nomor Referensi / Bukti Transfer"
               className="w-full px-4 py-3 border rounded-lg mb-3"
               disabled={loading || isCreatingQrisTransaction}
             />
           </div>
        )}

        {(paymentMethod === "E_WALLET") && (
             <div className="mb-6">
             <label className="block text-sm font-medium text-gray-700 mb-2">
               Informasi E-Wallet
             </label>
             <select className="w-full px-4 py-3 border rounded-lg mb-3" disabled={loading || isCreatingQrisTransaction}>
                <option value="GOPAY">GoPay</option>
                <option value="OVO">OVO</option>
                <option value="DANA">DANA</option>
                <option value="SHOPEEPAY">ShopeePay</option>
                <option value="LINKAJA">LinkAja</option>
             </select>
             <input
               type="text"
               placeholder="Nomor Referensi"
               className="w-full px-4 py-3 border rounded-lg mb-3"
               disabled={loading || isCreatingQrisTransaction}
             />
           </div>
        )}

        {paymentMethod === "TUNAI" && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jumlah Tunai
            </label>
            <input
              type="number"
              value={amountPaid}
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 0;
                setAmountPaid(value);
                setPaymentReceived(value);
              }}
              placeholder="Masukkan jumlah tunai"
              className="w-full px-4 py-3 border rounded-lg text-lg font-semibold"
              disabled={loading || isCreatingQrisTransaction}
            />
            {amountPaid > totalAmount && (
              <p className="text-green-600 mt-2 font-medium">
                Kembalian: {formatCurrency(amountPaid - totalAmount)}
              </p>
            )}
          </div>
        )}

        {paymentMethod === "KREDIT_PELANGGAN" && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jumlah Piutang / Tempo
            </label>
            <input
              type="number"
              value={postPayAmount}
              onChange={(e) => setPostPayAmount(parseFloat(e.target.value) || 0)}
              placeholder="Masukkan jumlah piutang"
              className="w-full px-4 py-3 border rounded-lg text-lg font-semibold"
              disabled={loading || isCreatingQrisTransaction}
            />
          </div>
        )}

        {/* Date of Supply */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tanggal Transaksi
          </label>
          <div className="relative">
            <input
              type="date"
              value={dateOfSupply}
              onChange={(e) => setDateOfSupply(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg pr-10"
              disabled={loading || isCreatingQrisTransaction}
            />
            <Calendar size={18} className="absolute right-3 top-3.5 text-gray-400" />
          </div>
        </div>

        {/* Multi-Pay Toggle */}
        <div className="mb-6 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Multi-Pembayaran (Split Bill)</span>
          <button
            onClick={() => setMultiPay(!multiPay)}
            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
              multiPay ? "bg-indigo-600" : "bg-gray-300"
            }`}
            disabled={loading || isCreatingQrisTransaction}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                multiPay ? "translate-x-8" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleClose}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
            disabled={loading || isCreatingQrisTransaction}
          >
            Batal
          </button>
          <button
            onClick={handleCompleteSale}
            disabled={!isPaymentComplete || loading || isCreatingQrisTransaction}
            className={`flex-1 px-6 py-3 rounded-lg font-medium flex items-center justify-center space-x-2 transition ${
              isPaymentComplete && !loading && !isCreatingQrisTransaction
                ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <Check size={20} />
                <span>Bayar {formatCurrency(totalAmount)}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>

    {/* QRIS Payment Modal */}
    {showQRISModal && qrisTransaction && (
      <QRISPaymentModal
        show={showQRISModal}
        onClose={() => setShowQRISModal(false)}
        amount={totalAmount}
        transactionId={qrisTransaction.transaksi_id}
        transactionNumber={qrisTransaction.nomor_transaksi}
        onPaymentComplete={handleQRISComplete}
        onPaymentFailed={handleQRISFailed}
      />
    )}
    </>
  );
};

export default PaymentModal;
