import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  User,
  DollarSign,
  ShoppingCart,
  Calendar,
  Edit,
  CheckCircle,
  AlertCircle,
  FileText,
  Printer,
} from "lucide-react";
import { useCabang } from "../../features/cabang/hooks/useCabang";
import api from "../../services/api";
import Table from "../../features/common/Table";
import CabangIndicator from "../../features/cabang/components/CabangIndicator";
import formatCurrency from "../../utils/formatCurrency";
import formatDate from "../../utils/formatDate";
import formatTime from "../../utils/formatTime";

const ShiftDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedCabang } = useCabang();
  const [shift, setShift] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination for transactions
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Cash summary
  const [cashSummary, setCashSummary] = useState({
    expected: 0,
    actual: 0,
    difference: 0,
  });

  const fetchShiftDetail = async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      const [shiftResponse, transactionsResponse] = await Promise.all([
        api.get(`/shifts/${id}`),
        api.get(`/shifts/${id}/transactions`, {
          params: {
            page: pagination.currentPage,
            limit: pagination.itemsPerPage,
          },
        }),
      ]);

      setShift(shiftResponse.data.data);
      setTransactions(transactionsResponse.data.data);
      setPagination({
        totalItems: transactionsResponse.data.meta.totalItems,
        totalPages: transactionsResponse.data.meta.totalPages,
        currentPage: transactionsResponse.data.meta.currentPage,
        itemsPerPage: transactionsResponse.data.meta.itemsPerPage,
        hasNextPage: transactionsResponse.data.meta.hasNextPage,
        hasPrevPage: transactionsResponse.data.meta.hasPrevPage,
      });

      // Calculate cash summary
      if (shiftResponse.data.data) {
        const shiftData = shiftResponse.data.data;
        const expected = shiftData.kasAwal + (shiftData.totalPendapatan || 0);
        const actual = shiftData.kasAkhir || expected;
        setCashSummary({
          expected,
          actual,
          difference: actual - expected,
        });
      }

      setError(null);
    } catch (err) {
      console.error("Error fetching shift detail:", err);
      setError("Gagal mengambil detail shift. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShiftDetail();
  }, [id, pagination.currentPage]);

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, currentPage: newPage });
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleAdjustShift = () => {
    // Navigate to shift adjustment page - this would be implemented
    console.log("Adjust shift:", id);
  };

  const handlePrintReport = () => {
    // Print shift report - this would be implemented
    console.log("Print shift report for:", id);
  };

  const handleViewTransaction = (transaction) => {
    // Navigate to transaction detail page - this would be implemented
    console.log("View transaction:", transaction.transaksi_id);
  };

  const transactionColumns = [
    {
      header: "No. Transaksi",
      accessor: "nomor_transaksi",
      cell: (row) => (
        <div className="flex items-center">
          <FileText size={16} className="mr-2 text-gray-500" />
          <span>{row.nomor_transaksi}</span>
        </div>
      ),
    },
    {
      header: "Waktu",
      accessor: "tanggal",
      cell: (row) => (
        <div className="flex items-center">
          <Clock size={16} className="mr-2 text-gray-500" />
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
        <div className="flex items-center">
          <User size={16} className="mr-2 text-gray-500" />
          <span>{row.pelanggan?.namaPelanggan || "Umum"}</span>
        </div>
      ),
    },
    {
      header: "Total",
      accessor: "total",
      cell: (row) => (
        <div className="flex items-center">
          <DollarSign size={16} className="mr-2 text-indigo-500" />
          <span>{formatCurrency(row.total)}</span>
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status_pembayaran",
      cell: (row) => {
        let statusColor = "gray";
        let Icon = AlertCircle;

        switch (row.status_pembayaran) {
          case "LUNAS":
            statusColor = "green";
            Icon = CheckCircle;
            break;
          case "BELUM_LUNAS":
            statusColor = "yellow";
            Icon = AlertCircle;
            break;
          case "DIBATALKAN":
            statusColor = "red";
            Icon = AlertCircle;
            break;
        }

        return (
          <div className="flex items-center">
            <Icon size={16} className={`mr-2 text-${statusColor}-500`} />
            <span className={`text-${statusColor}-700`}>
              {row.status_pembayaran === "LUNAS"
                ? "Lunas"
                : row.status_pembayaran === "BELUM_LUNAS"
                ? "Belum Lunas"
                : row.status_pembayaran === "DIBATALKAN"
                ? "Dibatalkan"
                : "Tidak diketahui"}
            </span>
          </div>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
        <button
          onClick={handleBack}
          className="mt-4 flex items-center text-indigo-600 hover:text-indigo-800"
        >
          <ArrowLeft size={16} className="mr-1" />
          Kembali
        </button>
      </div>
    );
  }

  if (!shift) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
          <div className="flex">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>Shift tidak ditemukan</span>
          </div>
        </div>
        <button
          onClick={handleBack}
          className="mt-4 flex items-center text-indigo-600 hover:text-indigo-800"
        >
          <ArrowLeft size={16} className="mr-1" />
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={handleBack}
            className="mr-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">
              Detail Shift #{shift.id.substring(0, 8)}
            </h1>
            <p className="text-sm text-gray-500">
              {formatDate(shift.waktuMulai)}
            </p>
          </div>
        </div>
        <CabangIndicator size="lg" />
      </div>

      {/* Shift Info Card */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center">
            <Calendar size={18} className="text-indigo-500 mr-2" />
            <h2 className="text-lg font-medium">Informasi Shift</h2>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handlePrintReport}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              <Printer size={16} className="mr-1" />
              Cetak Laporan
            </button>

            {shift.status !== "ditutup" && (
              <button
                onClick={handleAdjustShift}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                <Edit size={16} className="mr-1" />
                {shift.status === "dibuka" ? "Tutup Shift" : "Sesuaikan Shift"}
              </button>
            )}
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Kasir
                  </h3>
                  <p className="text-base flex items-center">
                    <User size={16} className="mr-2 text-gray-500" />
                    {shift.user?.namaLengkap || "Tidak tersedia"}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Waktu Mulai
                  </h3>
                  <p className="text-base flex items-center">
                    <Clock size={16} className="mr-2 text-green-500" />
                    {formatDate(shift.waktuMulai)}{" "}
                    {formatTime(shift.waktuMulai)}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Waktu Selesai
                  </h3>
                  <p className="text-base flex items-center">
                    <Clock size={16} className="mr-2 text-red-500" />
                    {shift.waktuSelesai
                      ? `${formatDate(shift.waktuSelesai)} ${formatTime(
                          shift.waktuSelesai
                        )}`
                      : "Belum selesai"}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Status
                  </h3>
                  <p
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${
                      shift.status === "dibuka"
                        ? "bg-green-100 text-green-800"
                        : shift.status === "ditutup"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-orange-100 text-orange-800"
                    }`}
                  >
                    {shift.status === "dibuka"
                      ? "Dibuka"
                      : shift.status === "ditutup"
                      ? "Ditutup"
                      : shift.status === "disesuaikan"
                      ? "Disesuaikan"
                      : "Tidak diketahui"}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Total Transaksi
                  </h3>
                  <p className="text-base flex items-center">
                    <ShoppingCart size={16} className="mr-2 text-indigo-500" />
                    {shift.totalTransaksi || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-l border-gray-200 pl-6">
              <h3 className="font-medium text-gray-700 mb-4">Ringkasan Kas</h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Kas Awal</span>
                  <span className="font-medium">
                    {formatCurrency(shift.kasAwal)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Pendapatan</span>
                  <span className="font-medium text-green-600">
                    +{formatCurrency(shift.totalPendapatan || 0)}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="text-gray-600">Total Kas Seharusnya</span>
                  <span className="font-medium">
                    {formatCurrency(cashSummary.expected)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Kas Akhir Aktual</span>
                  <span className="font-medium">
                    {formatCurrency(cashSummary.actual)}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="text-gray-600">Selisih</span>
                  <span
                    className={`font-medium ${
                      cashSummary.difference > 0
                        ? "text-green-600"
                        : cashSummary.difference < 0
                        ? "text-red-600"
                        : ""
                    }`}
                  >
                    {cashSummary.difference > 0 ? "+" : ""}
                    {formatCurrency(cashSummary.difference)}
                  </span>
                </div>
              </div>

              {shift.keterangan && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Keterangan
                  </h3>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {shift.keterangan}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center">
            <ShoppingCart size={18} className="text-indigo-500 mr-2" />
            <h2 className="text-lg font-medium">Transaksi Selama Shift</h2>
          </div>
        </div>

        <div className="p-4">
          <Table
            columns={transactionColumns}
            data={transactions}
            isLoading={false}
            emptyMessage="Tidak ada transaksi selama shift ini"
            onRowClick={handleViewTransaction}
            pagination={pagination}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
};

export default ShiftDetail;
