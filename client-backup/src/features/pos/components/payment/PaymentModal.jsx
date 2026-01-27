import React, { useState, useEffect } from "react";
import { X, CreditCard, DollarSign, Calendar, Check, Loader2 } from "lucide-react";
import { formatCurrency } from "../../hooks/usePOSCart";

const PaymentModal = ({
  show,
  onClose,
  totalAmount,
  subtotal,
  discountAmount,
  tax,
  onProcessPayment,
  loading = false,
}) => {
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amountPaid, setAmountPaid] = useState(totalAmount);
  const [dateOfSupply, setDateOfSupply] = useState("");
  const [multiPay, setMultiPay] = useState(false);
  const [paymentReceived, setPaymentReceived] = useState(0);
  const [postPayAmount, setPostPayAmount] = useState(0);

  useEffect(() => {
    setAmountPaid(totalAmount);
  }, [totalAmount]);

  const remaining = totalAmount - paymentReceived - postPayAmount;
  const isPaymentComplete = paymentReceived + postPayAmount >= totalAmount;

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
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
    setPaymentMethod("cash");
    setAmountPaid(totalAmount);
    setDateOfSupply("");
    setMultiPay(false);
    setPaymentReceived(0);
    setPostPayAmount(0);
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">Complete The Sale</h3>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            disabled={loading}
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Payment Summary */}
        <div className="mb-6 bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between font-medium text-lg mb-2">
            <span className="text-gray-600">Total to Pay:</span>
            <span className="text-indigo-600 font-bold">{formatCurrency(totalAmount)}</span>
          </div>
          
          <div className="text-sm text-gray-500 mb-4">
            Subtotal: {formatCurrency(subtotal)} | 
            Discount: -{formatCurrency(discountAmount)} | 
            Tax: {formatCurrency(tax)}
          </div>

          {/* Payment Received */}
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Payment Received:</span>
            <span className="text-green-600 font-medium">{formatCurrency(paymentReceived + postPayAmount)}</span>
          </div>

          {/* Remaining */}
          <div className={`flex justify-between items-center font-semibold ${remaining > 0 ? 'text-red-500' : 'text-green-600'}`}>
            <span>Remaining:</span>
            <span>{formatCurrency(Math.abs(remaining))}</span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button
            className={`flex flex-col items-center justify-center py-4 rounded-lg border-2 transition ${
              paymentMethod === "credit_card"
                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => handlePaymentMethodChange("credit_card")}
            disabled={loading}
          >
            <CreditCard size={28} className="mb-2" />
            <span className="font-medium">Credit Card</span>
          </button>

          <button
            className={`flex flex-col items-center justify-center py-4 rounded-lg border-2 transition ${
              paymentMethod === "cash"
                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => handlePaymentMethodChange("cash")}
            disabled={loading}
          >
            <DollarSign size={28} className="mb-2" />
            <span className="font-medium">Cash</span>
          </button>

          <button
            className={`flex flex-col items-center justify-center py-4 rounded-lg border-2 transition ${
              paymentMethod === "post_pay"
                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => handlePaymentMethodChange("post_pay")}
            disabled={loading}
          >
            <Calendar size={28} className="mb-2" />
            <span className="font-medium">Post Pay</span>
          </button>
        </div>

        {/* Payment Details */}
        {paymentMethod === "credit_card" && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Credit Card Details
            </label>
            <input
              type="text"
              placeholder="Card Number"
              className="w-full px-4 py-3 border rounded-lg mb-3"
              disabled={loading}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="MM/YY"
                className="px-4 py-3 border rounded-lg"
                disabled={loading}
              />
              <input
                type="text"
                placeholder="CVV"
                className="px-4 py-3 border rounded-lg"
                disabled={loading}
              />
            </div>
          </div>
        )}

        {paymentMethod === "cash" && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cash Amount
            </label>
            <input
              type="number"
              value={amountPaid}
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 0;
                setAmountPaid(value);
                setPaymentReceived(value);
              }}
              placeholder="Enter cash amount"
              className="w-full px-4 py-3 border rounded-lg text-lg font-semibold"
              disabled={loading}
            />
            {amountPaid > totalAmount && (
              <p className="text-green-600 mt-2 font-medium">
                Change: {formatCurrency(amountPaid - totalAmount)}
              </p>
            )}
          </div>
        )}

        {paymentMethod === "post_pay" && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Post Pay Amount
            </label>
            <input
              type="number"
              value={postPayAmount}
              onChange={(e) => setPostPayAmount(parseFloat(e.target.value) || 0)}
              placeholder="Enter post pay amount"
              className="w-full px-4 py-3 border rounded-lg text-lg font-semibold"
              disabled={loading}
            />
          </div>
        )}

        {/* Date of Supply */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date of Supply
          </label>
          <div className="relative">
            <input
              type="date"
              value={dateOfSupply}
              onChange={(e) => setDateOfSupply(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg pr-10"
              disabled={loading}
            />
            <Calendar size={18} className="absolute right-3 top-3.5 text-gray-400" />
          </div>
        </div>

        {/* Multi-Pay Toggle */}
        <div className="mb-6 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Multi-Pay</span>
          <button
            onClick={() => setMultiPay(!multiPay)}
            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
              multiPay ? "bg-indigo-600" : "bg-gray-300"
            }`}
            disabled={loading}
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
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleCompleteSale}
            disabled={!isPaymentComplete || loading}
            className={`flex-1 px-6 py-3 rounded-lg font-medium flex items-center justify-center space-x-2 transition ${
              isPaymentComplete && !loading
                ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Check size={20} />
                <span>Pay {formatCurrency(totalAmount)}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;