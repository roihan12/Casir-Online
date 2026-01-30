import React from "react";
import { FileText, X, Printer, Calendar, Clock } from "lucide-react";
import { useAuth } from "@features/auth/hooks/useAuth.js";
import { ReceiptFactory } from "./templates";
import { determineReceiptTemplate } from "./templates";

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

  // Get template type for dynamic title
  const templateType = determineReceiptTemplate(data);
  const { transaction, payment, branch } = data;

  // Get receipt title based on template
  const getReceiptTitle = () => {
    const method = transaction?.metode_pembayaran || payment?.metode_pembayaran || payment?.method || "TUNAI";
    if (method === "KREDIT" || method === "TEMPO") return "Struk Kredit";
    if (method === "QRIS") return "Struk QRIS";
    if (method === "TRANSFER" || method === "TRANSFER_BANK") return "Struk Transfer";
    return "Struk Pembayaran";
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 text-green-600 rounded-xl">
              <FileText size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-800">{getReceiptTitle()}</h2>
              <p className="text-[10px] text-gray-500">{branch?.namaCabang || "CASIR Online"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-800 transition-colors">
            <X size={24} strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 no-scrollbar bg-gray-50">
          {/* Receipt Template - Dynamically selected based on payment method and promo */}
          <div id="receipt-content">
            <ReceiptFactory data={data} />
          </div>

          {/* Template Type Info (for debugging) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 text-center">
              <span className="text-[9px] text-gray-400 bg-gray-100 px-2 py-1 rounded">
                Template: {determineReceiptTemplate(data)}
              </span>
            </div>
          )}
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
