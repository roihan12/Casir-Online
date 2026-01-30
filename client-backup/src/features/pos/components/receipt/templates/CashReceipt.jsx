import React from "react";
import BaseReceipt from "./BaseReceipt";
import formatCurrency from "@common/utils/formatCurrency";

/**
 * CashReceipt Component
 * Receipt for cash payments with change information
 *
 * Expected data structure (from backend API):
 * {
 *   paymentMethod: string,
 *   discount: number,
 *   promo: { hasPromo: boolean, totalDiskonPromo: number },
 *   payments: Array [{ amount, change, method }]
 * }
 */
const CashReceipt = ({ data }) => {
  const { paymentMethod, discount, promo, payments } = data;

  // Get the first payment info
  const payment = payments?.[0];
  const jumlahBayar = payment?.amount || 0;
  const kembalian = payment?.change || 0;

  // Calculate total discount including manual and promo
  const totalDiskon = (discount || 0) + (promo?.totalDiskonPromo || 0);

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
        <div className="border-t border-dashed border-gray-300 py-2 space-y-1">
          <div className="flex justify-between text-[11px]">
            <span>METODE:</span>
            <span className="font-bold uppercase">{paymentMethod || "TUNAI"}</span>
          </div>
          {jumlahBayar > 0 && (
            <div className="flex justify-between text-[11px]">
              <span>DIBAYAR:</span>
              <span className="text-green-600 font-semibold">
                {formatCurrency(jumlahBayar)}
              </span>
            </div>
          )}
          {kembalian > 0 && (
            <div className="flex justify-between text-[11px]">
              <span>KEMBALI:</span>
              <span className="font-bold">{formatCurrency(kembalian)}</span>
            </div>
          )}
        </div>
      )}
    />
  );
};

export default CashReceipt;
