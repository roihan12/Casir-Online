import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTrackOrder, useCabangInfo } from "../hooks/useCatalog";
import { FiSearch, FiPackage, FiPhone } from "react-icons/fi";
import toast from "react-hot-toast";

const TrackOrderPage = () => {
  const { cabangId } = useParams();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  
  const { data: cabangInfo, isLoading: isCabangLoading } = useCabangInfo(cabangId);
  const { mutate: trackOrder, isLoading } = useTrackOrder();

  const handleTrackOrder = (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      toast.error("Silakan masukkan Nomor Transaksi atau Nomor HP");
      return;
    }

    trackOrder({ cabangId, identifier }, {
      onSuccess: (res) => {
        const data = res.data;
        // Redirect to order status page
        navigate(`/catalog/${cabangId}/order/${data.transaksi_id}`);
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || "Pesanan tidak ditemukan");
      }
    });
  };

  if (isCabangLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Simple Header */}
      <header className="bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(`/catalog/${cabangId}`)}
            className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            ←
          </button>
          <div>
            <h1 className="text-xl font-bold font-outfit text-gray-900">
              {cabangInfo?.data?.namaCabang || "Katalog"}
            </h1>
            <p className="text-xs text-gray-500">Lacak Pesanan Anda</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:px-6 sm:py-8">
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-gray-100 text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiPackage className="w-10 h-10 text-primary" />
          </div>
          
          <h2 className="text-2xl font-bold font-outfit text-gray-900 mb-2">
            Lacak Status Pesanan
          </h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Masukkan Nomor Registrasi / Transaksi atau Nomor WhatsApp yang Anda gunakan saat memesan.
          </p>

          <form onSubmit={handleTrackOrder} className="max-w-md mx-auto">
            <div className="relative mb-6 text-left">
              <label className="block text-sm font-medium text-gray-700 mb-2 font-outfit">
                Nomor Pesanan / WhatsApp
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <FiSearch className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="Contoh: TRX-12345 atau 08123456789"
                  className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-gray-800"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !identifier.trim()}
              className="w-full bg-primary hover:bg-primary/90 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Mencari Pesanan...</span>
                </>
              ) : (
                <>
                  <span>Lacak Pesanan</span>
                  <FiSearch className="mt-0.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-gray-100 text-left flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-500">
              <FiPhone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 font-outfit text-sm">Masalah dengan pesanan Anda?</h3>
              <p className="text-sm text-gray-500 mt-1">
                Silakan hubungi kasir atau Admin cabang melalui jalur komunikasi WhatsApp resmi {cabangInfo?.data?.namaCabang}.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TrackOrderPage;
