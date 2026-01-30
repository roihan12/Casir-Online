import React from "react";
import BaseReceipt from "./BaseReceipt";
import formatCurrency from "@common/utils/formatCurrency";
import { Calendar } from "lucide-react";

/**
 * CreditReceipt Component
 * Receipt for credit/installment payments with schedule
 *
 * Expected data structure (from backend API):
 * {
 *   paymentMethod: string,
 *   discount: number,
 *   promo: { hasPromo: boolean, totalDiskonPromo: number },
 *   credit: {
 *     isCredit: boolean,
 *     tenor: number,
 *     uangMuka: number,
 *     sisaPembayaran: number,
 *     cicilanPerBulan: number,
 *     tanggalJatuhTempo: string,
 *     status: string
 *   },
 *   payments: Array
 * }
 */
const CreditReceipt = ({ data }) => {
  const { paymentMethod, discount, promo, credit, payments } = data;

  const formatDateOnly = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  // Get the first payment (DP/down payment)
  const payment = payments?.[0];
  const dpAmount = payment?.amount || 0;

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
      renderPaymentSection={() => {
        if (!credit?.isCredit) {
          // Fallback to regular payment section
          return (
            <div className="border-t border-dashed border-gray-300 py-2 space-y-1">
              <div className="flex justify-between text-[11px]">
                <span>METODE:</span>
                <span className="font-bold uppercase">{paymentMethod || "KREDIT"}</span>
              </div>
              {dpAmount > 0 && (
                <div className="flex justify-between text-[11px]">
                  <span>DP DIBAYAR:</span>
                  <span className="text-green-600 font-semibold">
                    {formatCurrency(dpAmount)}
                  </span>
                </div>
              )}
            </div>
          );
        }

        return (
          <>
            {/* Credit Payment Info */}
            <div className="border-t-2 border-dashed border-orange-300 bg-orange-50 py-2 space-y-1">
              <div className="text-center text-[10px] font-bold text-orange-600 uppercase mb-2">
                Info Pembayaran Kredit
              </div>

              <div className="flex justify-between text-[11px]">
                <span>METODE:</span>
                <span className="font-bold uppercase">{paymentMethod || "KREDIT / TEMPO"}</span>
              </div>

              {credit.uangMuka > 0 && (
                <div className="flex justify-between text-[11px]">
                  <span>UANG MUKA:</span>
                  <span className="text-green-600 font-semibold">
                    {formatCurrency(credit.uangMuka)}
                  </span>
                </div>
              )}

              {credit.tenor && (
                <>
                  <div className="flex justify-between text-[11px]">
                    <span>TENOR:</span>
                    <span className="font-semibold">{credit.tenor}x Cicilan</span>
                  </div>
                  {credit.cicilanPerBulan > 0 && (
                    <div className="flex justify-between text-[11px]">
                      <span>CICILAN/BULAN:</span>
                      <span className="font-semibold">
                        {formatCurrency(credit.cicilanPerBulan)}
                      </span>
                    </div>
                  )}
                </>
              )}

              {credit.tanggalJatuhTempo && (
                <div className="flex justify-between items-center text-[11px]">
                  <span className="flex items-center gap-1">
                    <Calendar size={10} />
                    JATUH TEMPO:
                  </span>
                  <span className="font-bold text-orange-700">
                    {formatDateOnly(credit.tanggalJatuhTempo)}
                  </span>
                </div>
              )}

              {credit.sisaPembayaran > 0 && (
                <div className="flex justify-between text-[11px]">
                  <span>SISA PEMBAYARAN:</span>
                  <span className="font-bold text-red-600">
                    {formatCurrency(credit.sisaPembayaran)}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-[11px]">
                <span>STATUS:</span>
                <span className={`font-semibold ${
                  credit.status === 'LUNAS' || credit.status === 'lunas'
                    ? 'text-green-600'
                    : 'text-orange-600'
                }`}>
                  {(credit.status || 'AKTIF').toUpperCase()}
                </span>
              </div>
            </div>

            {/* Installment Schedule (if available) */}
            {credit.jadwalPembayaran && credit.jadwalPembayaran.length > 0 && (
              <div className="border-t border-dashed border-gray-300 py-2">
                <div className="text-[10px] font-bold text-gray-700 uppercase mb-2 text-center">
                  Jadwal Pembayaran
                </div>
                <div className="space-y-1">
                  {credit.jadwalPembayaran.map((jadwal, idx) => (
                    <div key={idx} className="flex justify-between text-[10px]">
                      <span>{formatDateOnly(jadwal.tanggal)}</span>
                      <span className="font-semibold">{formatCurrency(jadwal.jumlah)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        );
      }}
    />
  );
};

export default CreditReceipt;
