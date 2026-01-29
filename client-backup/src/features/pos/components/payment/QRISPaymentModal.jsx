import React, { useState, useEffect, useRef } from "react";
import { X, QrCode, Loader2, Clock, CheckCircle2, XCircle } from "lucide-react";
import { formatCurrency } from "../../hooks/usePOSCart";
import posService from "@services/posService";
import { QRCodeSVG } from "qrcode.react";

const QRISPaymentModal = ({
  show,
  onClose,
  amount,
  transactionId, // Real transaction ID from database
  transactionNumber, // Transaction number like "TRX-20250128-001"
  onPaymentComplete,
  onPaymentFailed,
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [qrString, setQrString] = useState(null); // QR code string for rendering
  const [qrReferenceId, setQrReferenceId] = useState(null); // Midtrans order_id
  const [paymentStatus, setPaymentStatus] = useState("pending"); // pending, processing, success, failed, expired
  const [expiryTime, setExpiryTime] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const pollIntervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const isGeneratingRef = useRef(false); // Prevent duplicate generation calls
  const wasGeneratedRef = useRef(false); // Track if QRIS was already generated for this transaction

  // Generate QRIS QR code on mount
  useEffect(() => {
    if (show && amount && transactionId && !isGeneratingRef.current && !wasGeneratedRef.current) {
      isGeneratingRef.current = true;
      generateQRIS();
    }
    return () => {
      // Only cleanup when modal closes
      if (!show) {
        cleanup();
        wasGeneratedRef.current = false;
        isGeneratingRef.current = false;
      }
    };
  }, [show, amount, transactionId]);

  // Poll for payment status
  useEffect(() => {
    if (show && qrReferenceId && paymentStatus === "pending") {
      startPolling();
      startExpiryCountdown();
    }
    return () => {
      cleanup();
    };
  }, [show, qrReferenceId, paymentStatus]);

  const cleanup = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const generateQRIS = async () => {
    setPaymentStatus("processing");
    try {
      // Call QRIS service to generate QR code
      const response = await posService.generateQrisPayment({
        transaksi_id: transactionId,
        amount: amount,
      });

      console.log("QRIS response:", response);
      if (response.success && response.data?.qris_data) {
        const qrisData = response.data.qris_data;

        // Use qr_string if available, otherwise fall back to qris_url
        if (qrisData.qr_string) {
          setQrString(qrisData.qr_string);
        }

        setQrCodeUrl(qrisData.qris_url);
        setQrReferenceId(qrisData.reference_id);
        setExpiryTime(new Date(Date.now() + 5 * 60 * 1000)); // 5 minutes from now
        setPaymentStatus("pending");
        setTimeRemaining(5 * 60); // 5 minutes in seconds

        // Mark as generated successfully
        wasGeneratedRef.current = true;
        isGeneratingRef.current = false;
      } else {
        setPaymentStatus("failed");
        onPaymentFailed?.(response.message || "Failed to generate QRIS");
        isGeneratingRef.current = false;
      }
    } catch (error) {
      console.error("Error generating QRIS:", error);
      setPaymentStatus("failed");
      onPaymentFailed?.(error.response?.data?.message || "Failed to generate QRIS payment code");
      isGeneratingRef.current = false;
    }
  };

  const startPolling = () => {
    // Poll every 3 seconds
    pollIntervalRef.current = setInterval(async () => {
      try {
        const response = await posService.checkQrisStatus(qrReferenceId);

        if (response.success) {
          const status = response.data.status;

          if (status === "SUKSES" || status === "SUCCESS") {
            setPaymentStatus("success");
            cleanup();
            onPaymentComplete?.({
              referenceId: qrReferenceId,
              transactionId: transactionId,
              status: status,
              paymentTime: response.data.payment_time,
            });
          } else if (status === "GAGAL" || status === "FAILED" || status === "CANCELLED") {
            setPaymentStatus("failed");
            cleanup();
            onPaymentFailed?.("Payment failed or was cancelled");
          } else if (status === "EXPIRED") {
            setPaymentStatus("expired");
            cleanup();
            onPaymentFailed?.("Payment code has expired");
          }
        }
      } catch (error) {
        console.error("Error polling QRIS status:", error);
      }
    }, 3000);
  };

  const startExpiryCountdown = () => {
    // Update countdown every second
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setPaymentStatus("expired");
          cleanup();
          onPaymentFailed?.("Payment code has expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    timeoutRef.current = interval;
  };

  const handleCancelPayment = async () => {
    try {
      // Cancel the QRIS payment
      if (qrReferenceId) {
        await posService.cancelQrisPayment(qrReferenceId);
      }
    } catch (error) {
      console.error("Error cancelling QRIS payment:", error);
    } finally {
      cleanup();
      handleClose();
    }
  };

  const handleClose = () => {
    cleanup();
    setPaymentStatus("pending");
    setQrCodeUrl(null);
    setQrString(null);
    setQrReferenceId(null);
    setExpiryTime(null);
    setTimeRemaining(0);
    onClose();
  };

  const formatTimeRemaining = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <QrCode className="text-indigo-600" size={28} />
            QRIS Payment
          </h3>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            disabled={paymentStatus === "processing" || paymentStatus === "pending"}
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Payment Amount */}
        <div className="bg-indigo-50 rounded-lg p-4 mb-6 text-center">
          <p className="text-sm text-indigo-600 font-medium mb-1">Total Amount</p>
          <p className="text-3xl font-bold text-indigo-700">{formatCurrency(amount)}</p>
          {transactionNumber && (
            <p className="text-xs text-indigo-500 mt-1">{transactionNumber}</p>
          )}
        </div>

        {/* Payment Status Content */}
        {paymentStatus === "processing" && (
          <div className="text-center py-8">
            <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
            <p className="text-gray-600">Generating QR code...</p>
          </div>
        )}

        {paymentStatus === "pending" && (qrString || qrCodeUrl) && (
          <div>
            {/* QR Code */}
            <div className="flex justify-center mb-6">
              <div className="border-4 border-indigo-600 rounded-lg p-4 bg-white">
                {qrString ? (
                  <QRCodeSVG
                    value={qrString}
                    size={256}
                    level="M"
                    includeMargin={true}
                  />
                ) : (
                  <img src={qrCodeUrl} alt="QRIS QR Code" className="w-64 h-64" />
                )}
              </div>
            </div>

            {/* Instructions */}
            <div className="text-center mb-4">
              <p className="text-gray-700 font-medium mb-2">
                Scan the QR code using your mobile banking app or e-wallet
              </p>
              <p className="text-sm text-gray-500">
                Supported: GoPay, OVO, Dana, ShopeePay, LinkAja, and mobile banking apps
              </p>
            </div>

            {/* Expiry Countdown */}
            <div className="flex items-center justify-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <Clock className="text-yellow-600" size={20} />
              <div>
                <p className="text-sm text-yellow-800 font-medium">Expires in</p>
                <p className="text-2xl font-bold text-yellow-900">{formatTimeRemaining(timeRemaining)}</p>
              </div>
            </div>

            {/* Reference ID */}
            {qrReferenceId && (
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">Ref ID: {qrReferenceId}</p>
              </div>
            )}

            {/* Status indicator */}
            <div className="mt-6 flex items-center justify-center gap-2">
              <Loader2 className="animate-spin text-indigo-600" size={20} />
              <span className="text-indigo-600 font-medium">Waiting for payment...</span>
            </div>
          </div>
        )}

        {paymentStatus === "success" && (
          <div className="text-center py-8">
            <CheckCircle2 className="text-green-600 mx-auto mb-4" size={64} />
            <h4 className="text-2xl font-bold text-green-700 mb-2">Payment Successful!</h4>
            <p className="text-gray-600 mb-4">Your payment has been confirmed.</p>
            {qrReferenceId && (
              <p className="text-xs text-gray-500">Ref ID: {qrReferenceId}</p>
            )}
          </div>
        )}

        {paymentStatus === "failed" && (
          <div className="text-center py-8">
            <XCircle className="text-red-600 mx-auto mb-4" size={64} />
            <h4 className="text-2xl font-bold text-red-700 mb-2">Payment Failed</h4>
            <p className="text-gray-600 mb-4">The payment could not be processed.</p>
            <button
              onClick={generateQRIS}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
            >
              Try Again
            </button>
          </div>
        )}

        {paymentStatus === "expired" && (
          <div className="text-center py-8">
            <XCircle className="text-yellow-600 mx-auto mb-4" size={64} />
            <h4 className="text-2xl font-bold text-yellow-700 mb-2">Code Expired</h4>
            <p className="text-gray-600 mb-4">The QR code has expired.</p>
            <button
              onClick={generateQRIS}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
            >
              Generate New Code
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3 mt-6">
          <button
            onClick={handleCancelPayment}
            disabled={paymentStatus === "processing"}
            className={`flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium transition ${
              paymentStatus === "processing"
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "hover:bg-gray-50"
            }`}
          >
            Cancel Payment
          </button>
          {paymentStatus === "success" && (
            <button
              onClick={handleClose}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRISPaymentModal;
