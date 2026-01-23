import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Search,
  Check,
  Loader,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { useTransactionsList } from "../../transactions/hooks/useTransactions";
import { useCreateInvoice } from "../hooks/useInvoices";
import { useCabang } from "../../../features/cabang/hooks/useCabang";

// Formatter untuk uang
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

const InvoiceCreate = () => {
  const navigate = useNavigate();
  const { selectedCabang } = useCabang();

  // State untuk form
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  // State untuk pencarian transaksi
  const [filters, setFilters] = useState({
    startDate: dayjs().subtract(30, "day"),
    endDate: dayjs(),
    cabangId: selectedCabang?.id || "all",
    jenisTransaksi: "PENJUALAN", // Hanya transaksi penjualan yang bisa dibuatkan invoice
    statusPembayaran: "all",
    search: "",
  });

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Fetch transactions using React Query
  const {
    data: transactionsData,
    isLoading: isLoadingTransactions,
    error: transactionsError
  } = useTransactionsList(filters, page, rowsPerPage);

  // Create invoice mutation
  const {
    mutate: createInvoice,
    isLoading: isCreatingInvoice
  } = useCreateInvoice();

  // Extract data from query results
  const transactions = transactionsData?.data || [];
  const pagination = transactionsData?.pagination || {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  };

  // Handle error
  React.useEffect(() => {
    if (transactionsError) {
      toast.error("Gagal memuat data transaksi");
      console.error("Error fetching transactions:", transactionsError);
    }
  }, [transactionsError]);

  // Handle filter changes
  const handleFilterChange = (name, value) => {
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  // Apply filters
  const applyFilters = () => {
    setPage(0); // Reset to first page when applying filters
    // React Query will automatically refetch when dependencies change
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      startDate: dayjs().subtract(30, "day"),
      endDate: dayjs(),
      cabangId: selectedCabang?.id || "all",
      jenisTransaksi: "PENJUALAN",
      statusPembayaran: "all",
      search: "",
    });
    setPage(0);
  };

  // Select transaction
  const handleSelectTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    // Set default due date to 30 days from transaction date
    const transactionDate = dayjs(transaction.tanggal);
    setDueDate(transactionDate.add(30, "day").format("YYYY-MM-DD"));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedTransaction) {
      toast.error("Pilih transaksi terlebih dahulu");
      return;
    }

    createInvoice(
      {
        transaksiId: selectedTransaction.transaksi_id,
        tanggalJatuhTempo: dueDate,
        catatan: notes,
      },
      {
        onSuccess: (data) => {
          toast.success("Invoice berhasil dibuat");
          navigate(`/superadmin/invoices/${data.data.id}`);
        },
        onError: (error) => {
          console.error("Error creating invoice:", error);
          toast.error(error.response?.data?.message || "Gagal membuat invoice");
        },
      }
    );
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    let className;

    switch (status) {
      case "LUNAS":
        className = "bg-green-100 text-green-800";
        break;
      case "BELUM_LUNAS":
        className = "bg-yellow-100 text-yellow-800";
        break;
      case "DIBATALKAN":
        className = "bg-red-100 text-red-800";
        break;
      default:
        className = "bg-gray-100 text-gray-800";
    }

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${className}`}
      >
        {status.replace("_", " ")}
      </span>
    );
  };

  return (
    <div className="w-full p-6">
      <div className="flex justify-between mb-6">
        <button
          onClick={() => navigate("/superadmin/invoices")}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </button>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Buat Invoice Baru</h1>
          <p className="mt-1 text-sm text-gray-500">
            Pilih transaksi penjualan untuk membuat invoice baru
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Transaction Selection */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-800">
                  Pilih Transaksi
                </h2>
              </div>
              <div className="p-4">
                {/* Search and Filters */}
                <div className="mb-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Cari nomor transaksi atau pelanggan..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange("search", e.target.value)}
                      className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {/* Date Range */}
                  <div>
                    <label
                      htmlFor="startDate"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Tanggal Mulai
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="date"
                        id="startDate"
                        value={filters.startDate.format("YYYY-MM-DD")}
                        onChange={(e) =>
                          handleFilterChange("startDate", dayjs(e.target.value))
                        }
                        className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="endDate"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Tanggal Akhir
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="date"
                        id="endDate"
                        value={filters.endDate.format("YYYY-MM-DD")}
                        onChange={(e) =>
                          handleFilterChange("endDate", dayjs(e.target.value))
                        }
                        className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  {/* Status Pembayaran */}
                  <div>
                    <label
                      htmlFor="statusPembayaran"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Status Pembayaran
                    </label>
                    <select
                      id="statusPembayaran"
                      value={filters.statusPembayaran}
                      onChange={(e) =>
                        handleFilterChange("statusPembayaran", e.target.value)
                      }
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="all">Semua Status</option>
                      <option value="LUNAS">Lunas</option>
                      <option value="BELUM_LUNAS">Belum Lunas</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 mb-4">
                  <button
                    onClick={applyFilters}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Terapkan Filter
                  </button>
                  <button
                    onClick={resetFilters}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Reset
                  </button>
                </div>

                {/* Transactions Table */}
                <div className="overflow-x-auto border rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Nomor Transaksi
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Tanggal
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Pelanggan
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Total
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Status
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {isLoadingTransactions ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-4 text-center">
                            <div className="flex justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
                            </div>
                            <p className="mt-2 text-sm text-gray-500">
                              Memuat data transaksi...
                            </p>
                          </td>
                        </tr>
                      ) : transactions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-4 text-center">
                            <p className="text-sm text-gray-500">
                              Tidak ada transaksi yang ditemukan
                            </p>
                          </td>
                        </tr>
                      ) : (
                        transactions.map((transaction) => (
                          <tr
                            key={transaction.transaksi_id}
                            className={`hover:bg-gray-50 cursor-pointer ${
                              selectedTransaction?.transaksi_id ===
                              transaction.transaksi_id
                                ? "bg-indigo-50"
                                : ""
                            }`}
                            onClick={() => handleSelectTransaction(transaction)}
                          >
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {transaction.nomor_transaksi}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {format(
                                new Date(transaction.tanggal),
                                "dd MMM yyyy",
                                {
                                  locale: id,
                                }
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {transaction.pelanggan?.namaPelanggan ||
                                "Pelanggan Umum"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                              {formatCurrency(transaction.total)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              <StatusBadge
                                status={transaction.status_pembayaran}
                              />
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectTransaction(transaction);
                                }}
                                className={`inline-flex items-center px-2 py-1 border ${
                                  selectedTransaction?.transaksi_id ===
                                  transaction.transaksi_id
                                    ? "border-indigo-500 text-indigo-500"
                                    : "border-gray-300 text-gray-700"
                                } rounded-md text-xs`}
                              >
                                {selectedTransaction?.transaksi_id ===
                                transaction.transaksi_id ? (
                                  <>
                                    <Check className="h-3 w-3 mr-1" />
                                    Terpilih
                                  </>
                                ) : (
                                  "Pilih"
                                )}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setPage(old => Math.max(0, old - 1))}
                      disabled={page === 0 || isLoadingTransactions}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-500">
                      Page {page + 1} of {pagination.totalPages || 1}
                    </span>
                    <button
                      onClick={() => setPage(old => old + 1)}
                      disabled={page + 1 >= pagination.totalPages || isLoadingTransactions}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                  <div className="text-sm text-gray-500">
                    Menampilkan {transactions.length} dari {pagination.total || 0} transaksi
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-800">
                  Detail Invoice
                </h2>
              </div>
              <div className="p-4">
                <form onSubmit={handleSubmit}>
                  {selectedTransaction ? (
                    <>
                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">
                          Transaksi Terpilih
                        </h3>
                        <div className="bg-gray-50 p-3 rounded-md">
                          <p className="text-sm font-medium text-gray-900">
                            {selectedTransaction.nomor_transaksi}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {format(
                              new Date(selectedTransaction.tanggal),
                              "dd MMMM yyyy",
                              {
                                locale: id,
                              }
                            )}
                          </p>
                          <p className="text-sm text-gray-700 mt-1">
                            {selectedTransaction.pelanggan?.namaPelanggan ||
                              "Pelanggan Umum"}
                          </p>
                          <p className="text-sm font-medium text-gray-900 mt-1">
                            {formatCurrency(selectedTransaction.total)}
                          </p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <label
                          htmlFor="dueDate"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Tanggal Jatuh Tempo
                        </label>
                        <input
                          type="date"
                          id="dueDate"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          required
                        />
                      </div>

                      <div className="mb-4">
                        <label
                          htmlFor="notes"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Catatan
                        </label>
                        <textarea
                          id="notes"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={4}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="Tambahkan catatan untuk invoice ini (opsional)"
                        />
                      </div>

                      <div className="mt-6">
                        <button
                          type="submit"
                          disabled={isCreatingInvoice}
                          className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                          {isCreatingInvoice ? (
                            <>
                              <Loader className="animate-spin h-4 w-4 mr-2" />
                              Membuat Invoice...
                            </>
                          ) : (
                            "Buat Invoice"
                          )}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="py-6 text-center">
                      <AlertTriangle className="mx-auto h-10 w-10 text-yellow-400" />
                      <p className="mt-2 text-sm text-gray-500">
                        Pilih transaksi terlebih dahulu untuk membuat invoice
                      </p>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceCreate;
