import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, DollarSign, FileText, User, Building2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import { useHutangById, usePembayaranHistory, useCreatePembayaran } from "../hooks/useHutangQueries";
import PembayaranHutangModal from "../components/PembayaranHutangModal";
import Spinner from '../../common/Spinner'

const HutangDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const { data: hutang, isLoading, error } = useHutangById(id);
  const { data: history } = usePembayaranHistory(id);
  const createPembayaran = useCreatePembayaran();

  const handlePayment = (paymentData) => {
    createPembayaran.mutate(
      { ...paymentData, hutang_id: id },
      {
        onSuccess: () => {
          setShowPaymentModal(false);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
      </div>
    );
  }

  if (error || !hutang?.data) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <p>{error?.message || "Hutang tidak ditemukan"}</p>
          </div>
        </div>
      </div>
    );
  }

  const h = hutang.data;
  const isPelanggan = h.jenisHutang === "pelanggan";
  const isLunas = h.statusHutang === "lunas";
  const persentaseBayar = h.persentaseBayar || 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Detail Hutang
            </h1>
            <p className="text-sm text-gray-500">{h.nomorReferensi}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isLunas && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Bayar Hutang
            </button>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            isLunas
              ? "bg-green-100 text-green-700"
              : h.statusHutang === "cancel"
              ? "bg-red-100 text-red-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {h.statusHutang === "lunas"
            ? "Lunas"
            : h.statusHutang === "cancel"
            ? "Dibatalkan"
            : "Aktif"}
        </span>
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
          {isPelanggan ? "Pelanggan" : "Supplier"}
        </span>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Hutang</p>
              <p className="text-2xl font-bold text-gray-900">
                Rp {h.jumlahTotal.toLocaleString("id-ID")}
              </p>
            </div>
            <DollarSign className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        {/* Dibayar */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Sudah Dibayar</p>
              <p className="text-2xl font-bold text-green-600">
                Rp {h.jumlahBayar.toLocaleString("id-ID")}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 font-semibold">{persentaseBayar}%</span>
            </div>
          </div>
        </div>

        {/* Sisa */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Sisa Hutang</p>
              <p className="text-2xl font-bold text-orange-600">
                Rp {h.sisaHutang.toLocaleString("id-ID")}
              </p>
            </div>
            <AlertCircle className="w-10 h-10 text-orange-500" />
          </div>
        </div>

        {/* Jatuh Tempo */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Jatuh Tempo</p>
              <p className="text-lg font-semibold text-gray-900">
                {format(new Date(h.jatuhTempo), "dd MMM yyyy", { locale: idLocale })}
              </p>
            </div>
            <Calendar className="w-10 h-10 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progress Pembayaran</span>
          <span className="text-sm font-semibold text-gray-900">{persentaseBayar}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${
              persentaseBayar >= 100
                ? "bg-green-500"
                : persentaseBayar >= 50
                ? "bg-blue-500"
                : "bg-yellow-500"
            }`}
            style={{ width: `${Math.min(persentaseBayar, 100)}%` }}
          />
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Entity Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Informasi {isPelanggan ? "Pelanggan" : "Supplier"}
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {isPelanggan ? (
                <User className="w-5 h-5 text-gray-400" />
              ) : (
                <Building2 className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <p className="text-sm text-gray-500">Nama</p>
                <p className="font-medium text-gray-900">
                  {isPelanggan
                    ? h.pelanggan?.namaPelanggan
                    : h.supplier?.namaSupplier}
                </p>
              </div>
            </div>
            {isPelanggan && h.pelanggan?.telepon && (
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 flex items-center justify-center text-gray-400">📞</span>
                <div>
                  <p className="text-sm text-gray-500">Telepon</p>
                  <p className="font-medium text-gray-900">{h.pelanggan.telepon}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Transaction Info */}
        {h.transaksi && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Informasi Transaksi
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Nomor Transaksi</p>
                  <p className="font-medium text-gray-900">{h.transaksi.nomor_transaksi}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 flex items-center justify-center text-gray-400">📅</span>
                <div>
                  <p className="text-sm text-gray-500">Tanggal</p>
                  <p className="font-medium text-gray-900">
                    {format(new Date(h.transaksi.tanggal), "dd MMM yyyy, HH:mm", {
                      locale: idLocale,
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 flex items-center justify-center text-gray-400">💰</span>
                <div>
                  <p className="text-sm text-gray-500">Total Transaksi</p>
                  <p className="font-medium text-gray-900">
                    Rp {h.transaksi.total.toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Riwayat Pembayaran ({history?.data?.length || 0})
          </h3>
        </div>
        <div className="p-6">
          {history?.data && history.data.length > 0 ? (
            <div className="space-y-4">
              {history.data.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600">✓</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          Rp {payment.jumlahBayar.toLocaleString("id-ID")}
                        </p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(payment.tanggalBayar), "dd MMM yyyy, HH:mm", {
                            locale: idLocale,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {payment.metodePembayaran}
                    </p>
                    <p className="text-xs text-gray-500">{payment.createdByUser?.namaLengkap}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">Belum ada pembayaran</p>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PembayaranHutangModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSubmit={handlePayment}
          hutang={h}
          isLoading={createPembayaran.isPending}
        />
      )}
    </div>
  );
};

export default HutangDetailPage;
