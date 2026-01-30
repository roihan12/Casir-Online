import React, { useState, useEffect } from "react";
import BaseReceipt from "./BaseReceipt";
import formatCurrency from "@common/utils/formatCurrency";
import { QrCode, Clock } from "lucide-react";

/**
 * QrisReceipt Component
 * Receipt for QRIS payments with QR code and reference info
 *
 * Expected data structure (from backend API):
 * {
 *   paymentMethod: string,
 *   discount: number,
 *   promo: { hasPromo: boolean, totalDiskonPromo: number },
 *   payments: Array [{
 *     qris: { qrCode: string, refId: string },
 *     reference: string,
 *     status: string,
 *     expiry_time: string
 *   }]
 * }
 */
const QrisReceipt = ({ data }) => {
  const { discount, promo, payments } = data;
  const [qrImage, setQrImage] = useState(null);

  // Get the first payment (QRIS payment)
  const payment = payments?.[0];
  const qrisData = payment?.qris;

  // Generate QR code from payment info
  useEffect(() => {
    const generateQR = async () => {
      const qrData = qrisData?.qrCode || payment?.bukti_bayar_url;
      if (qrData) {
        try {
          // If it's a URL, fetch the image
          if (qrData.startsWith('http')) {
            setQrImage(qrData);
          } else if (!qrData.startsWith('data:')) {
            // If it's base64 data without prefix, add it
            setQrImage(`data:image/png;base64,${qrData}`);
          } else {
            setQrImage(qrData);
          }
        } catch (error) {
          console.error('Failed to load QR:', error);
        }
      }
    };
    generateQR();
  }, [qrisData, payment]);

  const formatExpiryTime = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const refId = qrisData?.refId || payment?.reference;

  return (
    <BaseReceipt
      data={data}
      renderExtraSection={() => (
        <>
          {/* Manual Discount */}
          {discount > 0 && (
            <div className="flex justify-between text-red-600 text-[11px]">
              <span>DISKON MANUAL:</span>
              <span>-{formatCurrency(discount)}</span>
            </div>
          )}
          {/* Promo Discount */}
          {promo?.hasPromo && promo?.totalDiskonPromo > 0 && (
            <div className="flex justify-between text-green-600 text-[11px]">
              <span>DISKON PROMO:</span>
              <span>-{formatCurrency(promo.totalDiskonPromo)}</span>
            </div>
          )}
        </>
      )}
      renderPaymentSection={() => (
        <>
          {/* QRIS Payment Info */}
          <div className="border-t border-dashed border-gray-300 py-2 space-y-1">
            <div className="flex justify-between text-[11px]">
              <span>METODE:</span>
              <span className="font-bold uppercase text-blue-600">QRIS</span>
            </div>

            {refId && (
              <div className="flex justify-between text-[11px]">
                <span>REF ID:</span>
                <span className="font-mono text-[10px]">{refId.slice(-12)}</span>
              </div>
            )}

            {/* Payment Status */}
            <div className="flex justify-center py-2">
              <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                payment?.status === 'SUKSES' || payment?.status === 'LUNAS'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {payment?.status || 'PENDING'}
              </div>
            </div>

            {/* QR Code Display */}
            {qrImage && (
              <div className="flex flex-col items-center py-3">
                <div className="w-32 h-32 border-2 border-gray-300 rounded-lg flex items-center justify-center bg-white overflow-hidden">
                  <img
                    src={qrImage}
                    alt="QRIS QR Code"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = `
                        <div class="text-center p-2">
                          <QrCode size={40} class="mx-auto text-gray-300 mb-1" />
                          <p class="text-[8px] text-gray-400">Scan QRIS</p>
                        </div>
                      `;
                    }}
                  />
                </div>
                <p className="text-[9px] text-gray-500 mt-2 text-center">
                  Scan QR code untuk pembayaran
                </p>
              </div>
            )}

            {/* Expiry Time (if pending) */}
            {payment?.expiry_time && payment?.status !== 'SUKSES' && payment?.status !== 'LUNAS' && (
              <div className="flex items-center justify-center gap-1 text-[10px] text-yellow-600 py-1">
                <Clock size={10} />
                <span>Berlaku hingga: {formatExpiryTime(payment.expiry_time)}</span>
              </div>
            )}
          </div>

          {/* QRIS Instructions */}
          <div className="text-center text-[9px] text-gray-500 italic py-1">
            <p>1. Buka aplikasi e-wallet atau m-banking</p>
            <p>2. Pilih menu "Scan QRIS"</p>
            <p>3. Scan kode QR di atas</p>
            <p>4. Konfirmasi pembayaran</p>
          </div>
        </>
      )}
    />
  );
};

export default QrisReceipt;
