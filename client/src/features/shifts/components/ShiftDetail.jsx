import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  User,
  DollarSign,
  ShoppingCart,
  Calendar,
  Edit,
  AlertCircle,
  FileText,
  CheckCircle,
  Printer,
} from "lucide-react";
import { useCabang } from "@features/cabang/hooks/useCabang";
import { useShiftDetail } from "../hooks/useShiftQueries";
import Table from "@features/common/Table";
import CabangIndicator from "@features/cabang/components/CabangIndicator";
import formatCurrency from "@common/utils/formatCurrency";
import formatDate from "@common/utils/formatDate";
import formatTime from "@common/utils/formatTime";

const ShiftDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedCabang } = useCabang();
  
  const { data: shiftResponse, isLoading, isError } = useShiftDetail(id);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const shift = shiftResponse?.data;
  const transactions = shift?.transaksi || [];
  
  // Frontend pagination for transactions since backend doesn't support it for this nested relation yet
  const totalItems = transactions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedTransactions = transactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleCloseOrAdjust = () => {
    if (shift?.status === "dibuka") {
      navigate(`/shifts/close/${id}`);
    } else {
      // Adjust shift logic would go here
      navigate(`/shifts/adjust/${id}`);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleViewTransaction = (transaction) => {
    navigate(`/transactions/${transaction.transaksi_id}`);
  };

  const expectedCash = shift ? Number(shift.kasAwal) + (Number(shift.totalPendapatan) || 0) : 0;
  const actualCash = shift?.status === "dibuka" ? expectedCash : Number(shift?.kasAkhir || 0);
  const difference = actualCash - expectedCash;

  const transactionColumns = [
    {
      header: "No. Transaksi",
      accessor: "nomor_transaksi",
      cell: (row) => (
        <div className="flex items-center">
          <FileText size={16} className="mr-2 text-gray-500" />
          <span className="font-medium text-gray-700">{row.nomor_transaksi}</span>
        </div>
      ),
    },
    {
      header: "Waktu",
      accessor: "tanggal",
      cell: (row) => (
        <div className="flex items-center text-gray-600">
          <Clock size={16} className="mr-2 opacity-50" />
          <span>
            {formatDate(row.tanggal)} {formatTime(row.tanggal)}
          </span>
        </div>
      ),
    },
    {
      header: "Pelanggan",
      accessor: "pelanggan",
      cell: (row) => (
        <span>{row.pelanggan?.namaPelanggan || "Umum"}</span>
      ),
    },
    {
      header: "Total",
      accessor: "total",
      cell: (row) => (
        <span className="font-semibold text-gray-900">{formatCurrency(row.total)}</span>
      ),
    },
    {
      header: "Status",
      accessor: "status_pembayaran",
      cell: (row) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
          row.status_pembayaran === "LUNAS" 
            ? "bg-green-100 text-green-700" 
            : "bg-yellow-100 text-yellow-700"
        }`}>
          {row.status_pembayaran === "LUNAS" ? "Lunas" : "Draft"}
        </span>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (isError || !shift) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center">
          <AlertCircle className="h-5 w-5 mr-3" />
          <span>Gagal mengambil detail shift. Data mungkin tidak ada atau Anda tidak memiliki akses.</span>
        </div>
        <button onClick={handleBack} className="mt-4 flex items-center text-indigo-600 font-medium">
          <ArrowLeft size={16} className="mr-1" /> Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center">
          <button
            onClick={handleBack}
            className="mr-4 p-2.5 rounded-xl bg-white shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                Detail Shift #{shift.id.substring(0, 8)}
              </h1>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                shift.status === "dibuka" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
              }`}>
                {shift.status}
              </span>
            </div>
            <p className="text-gray-500 mt-1">{formatDate(shift.waktuMulai)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <CabangIndicator size="lg" />
          <button
             onClick={handlePrintReport}
             className="bg-white text-gray-700 border border-gray-200 px-4 py-2.5 rounded-xl flex items-center text-sm font-semibold hover:bg-gray-50 transition-all shadow-sm"
          >
            <Printer size={18} className="mr-2 text-gray-500" />
            Cetak
          </button>
          {shift.status !== "ditutup" && (
            <button
              onClick={handleCloseOrAdjust}
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl flex items-center text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              <Edit size={18} className="mr-2" />
              {shift.status === "dibuka" ? "Tutup Shift" : "Sesuaikan"}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Info Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-50 bg-gray-50/30">
            <h2 className="font-bold text-gray-800 flex items-center">
              <User size={18} className="mr-2 text-indigo-500" />
              Identitas & Waktu
            </h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Kasir Bertugas</label>
                <p className="text-lg font-semibold text-gray-900 mt-1">{shift.user?.namaLengkap || "N/A"}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cabang</label>
                <p className="text-gray-700 mt-1 font-medium">{selectedCabang?.namaCabang}</p>
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex gap-10">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Mulai</label>
                  <p className="text-gray-900 mt-1 font-semibold">{formatTime(shift.waktuMulai)}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Selesai</label>
                  <p className="text-gray-900 mt-1 font-semibold">
                    {shift.waktuSelesai ? formatTime(shift.waktuSelesai) : "--:--"}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Transaksi</label>
                <p className="text-lg font-bold text-indigo-600 mt-1">{shift.totalTransaksi || 0} Kali</p>
              </div>
            </div>
          </div>
        </div>

        {/* Cash Summary Card */}
        <div className="bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-100 text-white p-6 flex flex-col justify-between">
          <div>
            <h2 className="font-bold flex items-center mb-6 opacity-90">
              <DollarSign size={20} className="mr-2" />
              Ringkasan Kas
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center opacity-80 text-sm">
                <span>Kas Awal</span>
                <span className="font-semibold">{formatCurrency(shift.kasAwal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="opacity-80 text-sm">Total Penjualan</span>
                <span className="font-bold text-green-300">+{formatCurrency(shift.totalPendapatan || 0)}</span>
              </div>
              <div className="pt-4 border-t border-white/10 mt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider opacity-70">Harus Ada</span>
                  <span className="text-xl font-black">{formatCurrency(expectedCash)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 rounded-xl p-4 mt-6">
            <div className="flex justify-between items-center text-sm mb-1 opacity-80">
              <span>Aktual di Laci</span>
              <span className="font-bold">{formatCurrency(actualCash)}</span>
            </div>
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/10">
              <span className="font-bold">Selisih</span>
              <span className={`font-black text-lg ${difference === 0 ? "text-white" : difference > 0 ? "text-green-300" : "text-red-300"}`}>
                {difference > 0 ? "+" : ""}{formatCurrency(difference)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-50 flex items-center justify-between">
          <h2 className="font-bold text-gray-800 flex items-center">
            <ShoppingCart size={18} className="mr-2 text-indigo-500" />
            Daftar Transaksi Lunas
          </h2>
          <span className="text-xs font-bold bg-gray-100 text-gray-500 px-3 py-1 rounded-full">
            {totalItems} Transaksi
          </span>
        </div>
        <div className="p-0">
          <Table
            columns={transactionColumns}
            data={paginatedTransactions}
            isLoading={false}
            emptyMessage="Belum ada transaksi lunas di shift ini"
            onRowClick={handleViewTransaction}
            pagination={{
              totalItems,
              totalPages,
              currentPage,
              itemsPerPage,
              hasNextPage: currentPage < totalPages,
              hasPrevPage: currentPage > 1,
            }}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      {shift.keterangan && (
        <div className="mt-6 bg-gray-50 rounded-2xl p-6 border border-gray-100">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Catatan Shift</h3>
          <p className="text-gray-700 leading-relaxed italic">"{shift.keterangan}"</p>
        </div>
      )}
    </div>
  );
};

export default ShiftDetail;
