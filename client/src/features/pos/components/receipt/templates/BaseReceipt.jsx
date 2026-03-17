import React from "react";
import formatCurrency from "@common/utils/formatCurrency";

/**
 * BaseReceipt Component
 * Base receipt template with common sections (header, items, footer)
 *
 * Expected data structure (from backend API):
 * {
 *   id: string,
 *   number: string,
 *   date: string,
 *   type: string,
 *   paymentMethod: string,
 *   status: string,
 *   subtotal: number,
 *   discount: number,
 *   tax: number,
 *   additionalFee: number,
 *   total: number,
 *   notes: string,
 *   items: Array,
 *   payments: Array,
 *   customerInfo: Object | null,
 *   cashierName: string,
 *   branchName: string,
 *   branchAddress: string,
 *   branchPhone: string,
 *   receiptConfig: Object,
 *   promo: Object,
 *   credit: Object,
 *   templateType: string
 * }
 */
const BaseReceipt = ({
  data,
  renderPaymentSection,
  renderExtraSection,
  children,
}) => {
  const {
    id,
    number,
    date,
    items,
    payments,
    customerInfo,
    cashierName,
    branchName,
    branchAddress,
    branchPhone,
    subtotal,
    tax,
    total,
    discount,
    additionalFee,
    notes,
  } = data;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="bg-white p-4 shadow-[0_0_40px_rgba(0,0,0,0.05)] border border-gray-100 rounded-lg mx-auto max-w-[320px] text-gray-800 font-mono text-[13px]">
      {/* Header */}
      <div className="text-center mb-4 space-y-1">
        <h2 className="font-black text-lg uppercase tracking-wider">CASIR Online</h2>
        <h3 className="font-black text-base uppercase tracking-wider">
          {branchName || "CASIR Online"}
        </h3>
        {branchAddress && (
          <p className="text-[11px] leading-tight">{branchAddress}</p>
        )}
        {branchPhone && <p className="text-[11px]">Telp: {branchPhone}</p>}
      </div>

      {/* Transaction Info */}
      <div className="border-t border-dashed border-gray-300 py-2 space-y-1">
        <div className="flex justify-between">
          <span className="text-[11px]">TRX ID:</span>
          <span className="font-bold text-[11px]">
            {(number || id || "")?.toUpperCase()}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[11px]">WAKTU:</span>
          <span className="text-[11px]">{formatDate(date || new Date())}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[11px]">KASIR:</span>
          <span className="uppercase text-[11px]">
            {cashierName?.split(" ")?.[0] || "ADMIN"}
          </span>
        </div>
        {customerInfo && (
          <div className="flex justify-between">
            <span className="text-[11px]">PELANGGAN:</span>
            <span className="uppercase text-[11px] truncate max-w-[120px]">
              {customerInfo?.name || "UMUM"}
            </span>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="border-t border-dashed border-gray-300 py-2 space-y-2">
        {items?.map((item, index) => (
          <div key={item.id || index}>
            <div className="flex justify-between mb-0.5 font-bold">
              <span className="uppercase text-[12px]">{item.name}</span>
              <span className="text-[12px]">
                {formatCurrency(item.price * item.quantity)}
              </span>
            </div>
            <div className="flex justify-between text-[10px] opacity-70">
              <span>
                {formatCurrency(item.price)} x {item.quantity}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Section */}
      <div className="border-t-2 border-dashed border-gray-800 py-2 space-y-1">
        <div className="flex justify-between text-[11px]">
          <span>SUBTOTAL:</span>
          <span>{formatCurrency(subtotal || 0)}</span>
        </div>
        {renderExtraSection?.()}
        {tax > 0 && (
          <div className="flex justify-between text-[11px]">
            <span>PAJAK:</span>
            <span>{formatCurrency(tax || 0)}</span>
          </div>
        )}
        {additionalFee > 0 && (
          <div className="flex justify-between text-[11px]">
            <span>BIAYA LAIN:</span>
            <span>{formatCurrency(additionalFee || 0)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-black pt-2 border-t border-gray-200">
          <span>TOTAL:</span>
          <span>{formatCurrency(total || 0)}</span>
        </div>
      </div>

      {/* Payment Section (customizable by child components) */}
      {renderPaymentSection?.()}

      {/* Footer */}
      <div className="text-center mt-4 pt-2 border-t border-dashed border-gray-300">
        <p className="font-bold mb-1 uppercase tracking-widest text-[10px]">Terima Kasih</p>
        <p className="text-[9px] opacity-50 italic">Powered by CASIR Online</p>
      </div>

      {children}
    </div>
  );
};

export default BaseReceipt;
