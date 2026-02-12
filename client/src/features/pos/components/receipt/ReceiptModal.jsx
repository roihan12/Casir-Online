import React, { useState, useEffect } from "react";
import { FileText, X, Printer, Calendar, Clock, Send } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { useAuth } from "@features/auth/hooks/useAuth.js";
import { ReceiptFactory } from "./templates";
import { determineReceiptTemplate } from "./templates";
import api from "../../../../common/utils/api";
import toast from "react-hot-toast";

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
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [sendingWhatsapp, setSendingWhatsapp] = useState(false);

  // Initialize phone from customer data
  useEffect(() => {
    if (data?.customerInfo?.contact) {
      // Simple check if it looks like a phone number
      if (/^[\d+]+$/.test(data.customerInfo.contact)) {
         setWhatsappPhone(data.customerInfo.contact);
      }
    }
  }, [data]);

  const handleSendWhatsapp = async () => {
    if (!whatsappPhone && !showPhoneInput) {
        setShowPhoneInput(true);
        return;
    }

    if (!whatsappPhone) {
        toast.error("Nomor WhatsApp harus diisi");
        return;
    }

    try {
        setSendingWhatsapp(true);
        const transactionId = data.id || data.transaksi_id || data.transaction?.transaksi_id;
        
        await api.post('/receipt/whatsapp', {
            transaksiId: transactionId,
            phone: whatsappPhone
        });
        
        toast.success("Struk berhasil dikirim ke WhatsApp");
        setShowPhoneInput(false);
    } catch (error) {
        console.error("Failed to send WhatsApp:", error);
        toast.error(error.response?.data?.message || "Gagal mengirim WhatsApp");
    } finally {
        setSendingWhatsapp(false);
    }
  };

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

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex flex-col gap-3">
          {showPhoneInput && (
              <div className="flex gap-2 animate-fadeIn">
                  <input
                      type="text"
                      placeholder="Nomor WhatsApp (contoh: 08123...)"
                      value={whatsappPhone}
                      onChange={(e) => setWhatsappPhone(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                      autoFocus
                  />
                  <button 
                      onClick={() => setShowPhoneInput(false)}
                      className="p-2 text-gray-500 hover:text-gray-700 bg-gray-200 rounded-xl"
                  >
                      <X size={20} />
                  </button>
              </div>
          )}
          <div className="flex gap-3">
            <button
                onClick={handleSendWhatsapp}
                disabled={sendingWhatsapp}
                className="flex-1 py-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-100 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {sendingWhatsapp ? (
                    <span className="loading loading-spinner loading-sm"></span>
                ) : (
                    <FaWhatsapp size={22} />
                )}
                {showPhoneInput ? "KIRIM SEKARANG" : "KIRIM WHATSAPP"}
            </button>
            <button
                onClick={onPrint}
                className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 transition-all active:scale-95"
            >
                <Printer size={20} />
                CETAK
            </button>
          </div>
          <button
            onClick={onClose}
            className="w-full py-3 bg-white border border-gray-200 text-gray-500 rounded-2xl font-semibold hover:bg-gray-50 transition-all active:scale-95 text-sm"
          >
            TUTUP
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
