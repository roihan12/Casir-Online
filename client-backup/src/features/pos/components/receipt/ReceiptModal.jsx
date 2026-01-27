import React from "react";
import { FileText, X, Printer } from "lucide-react";
import { useAuth } from "@features/auth/hooks/useAuth.js";

// Utility function to format currency
const formatCurrency = (amount) => {
  const numAmount = parseFloat(amount) || 0;
  return `Rp${numAmount.toLocaleString("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

const ReceiptModal = ({ show, onClose, data, onPrint }) => {
  if (!show || !data) return null;

  const { user } = useAuth();
  const { transaction, payment, items, customer, branch } = data;

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 text-green-600 rounded-xl">
              <FileText size={22} strokeWidth={2.5} />
            </div>
            <h2 className="text-lg font-black text-gray-800">Struk Pembayaran</h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-800 transition-colors">
            <X size={24} strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
          {/* Virtual Receipt Paper */}
          <div id="receipt-content" className="bg-white p-6 shadow-[0_0_40px_rgba(0,0,0,0.05)] border border-gray-100 rounded-lg mx-auto max-w-[320px] text-gray-800 font-mono text-[13px]">
            {/* Header */}
            <div className="text-center mb-6 space-y-1">
              <h3 className="font-black text-lg uppercase tracking-wider">{branch?.namaCabang || "CASIR Online"}</h3>
              {branch?.alamat && <p className="leading-tight">{branch.alamat}</p>}
              {branch?.telepon && <p>Telp: {branch.telepon}</p>}
            </div>

            <div className="border-t border-dashed border-gray-300 py-3 space-y-1">
              <div className="flex justify-between">
                <span>TRX ID:</span>
                <span className="font-bold">{transaction?.id?.slice(-8).toUpperCase() || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span>WAKTU:</span>
                <span>{formatDate(transaction?.tanggal || new Date())}</span>
              </div>
              <div className="flex justify-between">
                <span>KASIR:</span>
                <span className="uppercase">{user?.name?.split(' ')[0] || "ADMIN"}</span>
              </div>
              <div className="flex justify-between">
                <span>MEMBER:</span>
                <span className="uppercase truncate max-w-[120px]">{customer?.name || customer?.namaPelanggan || "UMUM"}</span>
              </div>
            </div>

            {/* Items */}
            <div className="border-t border-dashed border-gray-300 py-3 space-y-3">
              {items?.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between mb-0.5 font-bold">
                    <span className="uppercase">{item.name}</span>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] opacity-70">
                    <span>{formatCurrency(item.price)} x {item.quantity}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t-2 border-dashed border-gray-800 py-3 space-y-1.5">
              <div className="flex justify-between">
                <span>SUBTOTAL:</span>
                <span>{formatCurrency(transaction?.subtotal || 0)}</span>
              </div>
              {transaction?.discount_amount > 0 && (
                <div className="flex justify-between text-indigo-600">
                  <span>DISKON:</span>
                  <span>-{formatCurrency(transaction?.discount_amount || 0)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>PAJAK (10%):</span>
                <span>{formatCurrency(transaction?.tax_amount || 0)}</span>
              </div>
              <div className="flex justify-between text-lg font-black pt-2 border-t border-gray-200">
                <span>TOTAL:</span>
                <span>{formatCurrency(transaction?.total_amount || 0)}</span>
              </div>
            </div>

            {/* Payments */}
            <div className="border-t border-dashed border-gray-300 py-3 space-y-1">
              <div className="flex justify-between">
                <span>METODE:</span>
                <span className="font-bold uppercase">{payment?.metode_pembayaran || "TUNAI"}</span>
              </div>
              <div className="flex justify-between">
                <span>BAYAR:</span>
                <span>{formatCurrency(payment?.jumlah_bayar || 0)}</span>
              </div>
              {payment?.jumlah_kembali > 0 && (
                <div className="flex justify-between">
                  <span>KEMBALI:</span>
                  <span className="font-bold">{formatCurrency(payment?.jumlah_kembali || 0)}</span>
                </div>
              )}
            </div>

            <div className="text-center mt-8 pt-4 border-t border-dashed border-gray-300">
              <p className="font-bold mb-1 uppercase tracking-widest text-[11px]">Terima Kasih</p>
              <p className="text-[10px] opacity-50 italic">Powered by CASIR Online</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-4">
          <button
            onClick={onPrint}
            className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-lg shadow-indigo-200 transition-all active:scale-95"
          >
            <Printer size={20} />
            CETAK STRUK
          </button>
          <button
            onClick={onClose}
            className="px-6 py-4 bg-white border border-gray-200 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition-all active:scale-95"
          >
            SELESAI
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
