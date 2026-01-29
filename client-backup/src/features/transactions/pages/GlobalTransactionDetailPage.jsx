import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  User,
  MapPin,
  CreditCard,
  Receipt,
  FileText,
  Clock,
  DollarSign,
  Printer,
  Download,
  ShoppingBag,
  Check,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCcw,
  Tag,
  Loader,
  CreditCard as CreditCardIcon,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import toast from "react-hot-toast";
import { useTransactionDetail } from "../hooks/useTransactions";
import KreditPaymentModal from "../../credit/components/KreditPaymentModal";
import formatDate from "@common/utils/formatDate";

// Formatter untuk uang
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

const GlobalTransactionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [kreditModalOpen, setKreditModalOpen] = useState(false);

  // Fetch transaction detail using React Query
  const {
    data: transaction,
    isLoading,
    error,
    refetch
  } = useTransactionDetail(id);

  // Handle error
  React.useEffect(() => {
    if (error) {
      console.error("Error fetching transaction detail:", error);
      toast.error("Gagal memuat detail transaksi");
    }
  }, [error]);

  // Transaction badge component
  const TransactionTypeBadge = ({ type }) => {
    let className;
    let icon;

    switch (type) {
      case "PENJUALAN":
        className = "text-blue-600 border-blue-600";
        icon = <ArrowUpCircle size={14} className="mr-1" />;
        break;
      case "PEMBELIAN":
        className = "text-indigo-600 border-indigo-600";
        icon = <ArrowDownCircle size={14} className="mr-1" />;
        break;
      case "RETUR_PENJUALAN":
        className = "text-amber-600 border-amber-600";
        icon = <RefreshCcw size={14} className="mr-1" />;
        break;
      case "RETUR_PEMBELIAN":
        className = "text-red-600 border-red-600";
        icon = <RefreshCcw size={14} className="mr-1" />;
        break;
      default:
        className = "text-gray-600 border-gray-600";
        icon = null;
    }

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${className}`}
      >
        {icon}
        {type.replace("_", " ")}
      </span>
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

  // Go back to transactions list
  const handleBack = () => {
    navigate("/transactions");
  };

  // Print receipt
  const handlePrintReceipt = () => {
    toast.success("Fitur cetak struk akan segera tersedia");
  };

  if (isLoading) {
    return (
      <div className="w-full p-6 flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center">
          <Loader className="animate-spin h-8 w-8 text-indigo-600" />
          <p className="mt-4 text-gray-600">Memuat data transaksi...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <button
          className="flex items-center text-indigo-600 hover:text-indigo-900"
          onClick={handleBack}
        >
          <ArrowLeft size={18} className="mr-1" />
          Kembali ke Daftar Transaksi
        </button>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="w-full p-6">
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
          Data transaksi tidak ditemukan
        </div>
        <button
          className="flex items-center text-indigo-600 hover:text-indigo-900"
          onClick={handleBack}
        >
          <ArrowLeft size={18} className="mr-1" />
          Kembali ke Daftar Transaksi
        </button>
      </div>
    );
  }

  console.log(transaction);


  // Use transaction data from API response
  const displayData = transaction;


  return (
    <div className="w-full p-6">
      {/* Dashboard Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-600">Detail informasi transaksi</p>
      </div>

      {/* Header Actions */}
      <div className="flex justify-between items-center mb-6">
        <button
          className="flex items-center text-gray-700 hover:text-gray-900 bg-white border border-gray-300 rounded-md px-4 py-2 text-sm"
          onClick={handleBack}
        >
          <ArrowLeft size={16} className="mr-2" />
          Kembali
        </button>

        <div className="flex space-x-2">
          <button
            className="flex items-center text-gray-700 hover:text-gray-900 bg-white border border-gray-300 rounded-md px-4 py-2 text-sm"
            onClick={handlePrintReceipt}
          >
            <Printer size={16} className="mr-2" />
            Cetak Struk
          </button>
          <button
            className="flex items-center text-gray-700 hover:text-gray-900 bg-white border border-gray-300 rounded-md px-4 py-2 text-sm"
            onClick={() =>
              toast.success("Fitur unduh PDF akan segera tersedia")
            }
          >
            <Download size={16} className="mr-2" />
            Unduh PDF
          </button>
          {/* Tampilkan tombol pembayaran kredit jika transaksi penjualan, belum lunas, dan memiliki pelanggan */}
          {displayData.jenis_transaksi?.includes("PENJUALAN") && 
           displayData.status_pembayaran !== "LUNAS" &&
           displayData.pelanggan && (
            <button
              className="flex items-center text-white bg-indigo-600 hover:bg-indigo-700 border border-indigo-600 rounded-md px-4 py-2 text-sm"
              onClick={() => setKreditModalOpen(true)}
            >
              <CreditCardIcon size={16} className="mr-2" />
              Pembayaran Kredit
            </button>
          )}
        </div>
      </div>

      {/* Transaction Header */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {displayData.nomor_transaksi}
              </h2>

              <div className="flex flex-wrap gap-2 mb-3">
                <TransactionTypeBadge type={displayData.jenis_transaksi} />
                <StatusBadge status={displayData.status_pembayaran} />
              </div>

              <div className="flex items-center mb-2 text-gray-600">
                <Calendar size={16} className="mr-2" />
                <span className="text-sm">
                  {formatDate(displayData.tanggal)}
                </span>
              </div>

              <div className="flex items-center mb-2 text-gray-600">
                <MapPin size={16} className="mr-2" />
                <span className="text-sm">
                  {displayData.cabang?.namaCabang || "Cabang tidak tersedia"}
                </span>
              </div>

              <div className="flex items-center text-gray-600">
                <User size={16} className="mr-2" />
                <span className="text-sm">
                  Kasir: {displayData.created_by || "Tidak tersedia"}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-start md:items-end">
              <div className="text-2xl font-bold text-indigo-600 mb-2">
                {formatCurrency(displayData.total)}
              </div>

              {displayData.status_pembayaran === "LUNAS" && (
                <div className="flex items-center mb-2 text-green-600">
                  <Check size={16} className="mr-2" />
                  <span className="text-sm">
                    Lunas pada{" "}
                    {formatDate(displayData.tanggal_lunas)}
                  </span>
                </div>
              )}

              <div className="flex items-center mb-2 text-gray-600">
                <CreditCard size={16} className="mr-2" />
                <span className="text-sm">
                  Metode:{" "}
                  {displayData.pembayaran?.[0]?.metode_pembayaran?.replace(
                    "_",
                    " "
                  ) || "Tidak tersedia"}
                </span>
              </div>

              {displayData.promo && (
                <div className="flex items-center text-gray-600">
                  <Tag size={16} className="mr-2" />
                  <span className="text-sm">
                    Promo: {displayData.promo.namaPromo || ""} 
                    {displayData.promo.kodePromo ? `(${displayData.promo.kodePromo})` : ""}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction Details */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-800">
                Detail Produk
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Produk
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Jumlah
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Harga
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Diskon
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayData.transaksi_detail?.map((item) => (
                    <tr key={item.transaksi_detail_id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.produk?.produkMaster?.namaProduk ||
                            "Produk tidak tersedia"}
                        </div>
                        <div className="text-xs text-gray-500">
                          SKU: {item.produk?.produkMaster?.sku || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {item.jumlah}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        {formatCurrency(item.harga_satuan)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        {item.diskon_nominal > 0
                          ? formatCurrency(item.diskon_nominal)
                          : item.diskon_persen > 0
                          ? `${item.diskon_persen}%`
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {displayData.keterangan && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">
                        Catatan:
                      </h4>
                      <p className="text-sm text-gray-600">
                        {displayData.keterangan}
                      </p>
                    </div>
                  )}
                </div>

                <div className="md:ml-auto md:max-w-xs">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Subtotal:</span>
                    <span className="text-sm text-gray-900">
                      {formatCurrency(displayData.subtotal)}
                    </span>
                  </div>

                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Diskon:</span>
                    <span className="text-sm text-red-600">
                      -{formatCurrency(displayData.diskon)}
                    </span>
                  </div>

                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Pajak:</span>
                    <span className="text-sm text-gray-900">
                      {formatCurrency(displayData.pajak)}
                    </span>
                  </div>

                  {displayData.biaya_tambahan > 0 && (
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">
                        Biaya Tambahan:
                      </span>
                      <span className="text-sm text-gray-900">
                        {formatCurrency(displayData.biaya_tambahan)}
                      </span>
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between font-medium">
                      <span className="text-sm text-gray-900">Total:</span>
                      <span className="text-sm text-gray-900">
                        {formatCurrency(displayData.total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          {/* Payment Information */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-800">
                Informasi Pembayaran
              </h3>
            </div>

            <div className="p-4">
              {displayData.pembayaran?.map((payment, index) => (
                <ul key={payment.pembayaran_id || index} className="space-y-4">
                  <li className="flex items-start">
                    <CreditCard
                      size={18}
                      className="text-gray-400 mt-0.5 mr-3 flex-shrink-0"
                    />
                    <div>
                      <div className="text-xs font-medium text-gray-500">
                        Metode Pembayaran
                      </div>
                      <div className="text-sm text-gray-900">
                        {payment.metode_pembayaran?.replace("_", " ") || "-"}
                      </div>
                    </div>
                  </li>

                  <li className="flex items-start">
                    <DollarSign
                      size={18}
                      className="text-gray-400 mt-0.5 mr-3 flex-shrink-0"
                    />
                    <div>
                      <div className="text-xs font-medium text-gray-500">
                        Jumlah Dibayar
                      </div>
                      <div className="text-sm text-gray-900">
                        {formatCurrency(payment.jumlah_bayar)}
                      </div>
                    </div>
                  </li>

                  {payment.jumlah_kembali > 0 && (
                    <li className="flex items-start">
                      <DollarSign
                        size={18}
                        className="text-gray-400 mt-0.5 mr-3 flex-shrink-0"
                      />
                      <div>
                        <div className="text-xs font-medium text-gray-500">
                          Kembalian
                        </div>
                        <div className="text-sm text-gray-900">
                          {formatCurrency(payment.jumlah_kembali)}
                        </div>
                      </div>
                    </li>
                  )}

                  <li className="flex items-start">
                    <Calendar
                      size={18}
                      className="text-gray-400 mt-0.5 mr-3 flex-shrink-0"
                    />
                    <div>
                      <div className="text-xs font-medium text-gray-500">
                        Tanggal Pembayaran
                      </div>
                      <div className="text-sm text-gray-900">
                        {formatDate(payment.tanggal_pembayaran)}
                      </div>
                    </div>
                  </li>

                  <li className="flex items-start">
                    <Check
                      size={18}
                      className="text-gray-400 mt-0.5 mr-3 flex-shrink-0"
                    />
                    <div>
                      <div className="text-xs font-medium text-gray-500">
                        Status
                      </div>
                      <div>
                        <span
                          className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                            payment.status === "SUKSES"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {payment.status}
                        </span>
                      </div>
                    </div>
                  </li>
                </ul>
              ))}
            </div>
          </div>

          {/* Customer Information */}
          {displayData.jenis_transaksi?.includes("PENJUALAN") &&
            displayData.pelanggan && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-800">
                    Informasi Pelanggan
                  </h3>
                </div>

                <div className="p-4">
                  <ul className="space-y-4">
                    <li className="flex items-start">
                      <User
                        size={18}
                        className="text-gray-400 mt-0.5 mr-3 flex-shrink-0"
                      />
                      <div>
                        <div className="text-xs font-medium text-gray-500">
                          Nama Pelanggan
                        </div>
                        <div className="text-sm text-gray-900">
                          {displayData.pelanggan?.namaPelanggan ||
                            "Pelanggan Umum"}
                        </div>
                      </div>
                    </li>

                    {displayData.pelanggan?.telepon && (
                      <li className="flex items-start">
                        <Receipt
                          size={18}
                          className="text-gray-400 mt-0.5 mr-3 flex-shrink-0"
                        />
                        <div>
                          <div className="text-xs font-medium text-gray-500">
                            Telepon
                          </div>
                          <div className="text-sm text-gray-900">
                            {displayData.pelanggan.telepon}
                          </div>
                        </div>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            )}

          {/* Supplier Information */}
          {displayData.jenis_transaksi.includes("PEMBELIAN") &&
            displayData.supplier && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-800">
                    Informasi Supplier
                  </h3>
                </div>

                <div className="p-4">
                  <ul className="space-y-4">
                    <li className="flex items-start">
                      
                  </li>

                  {displayData.pelanggan?.telepon && (
                    <li className="flex items-start">
                      <Receipt
                        size={18}
                        className="text-gray-400 mt-0.5 mr-3 flex-shrink-0"
                      />
                      <div>
                        <div className="text-xs font-medium text-gray-500">
                          Telepon
                        </div>
                        <div className="text-sm text-gray-900">
                          {displayData.pelanggan.telepon}
                        </div>
                      </div>
                    </li>
                  )}
                </ul>
              
            </div>
          </div>
          )}
        </div>

        {displayData.supplier && (
        <div className="lg:w-1/2 xl:w-1/3 p-4">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-800">
                Informasi Supplier
              </h3>
            </div>

            <div className="p-4">
              
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <ShoppingBag
                      size={18}
                      className="text-gray-400 mt-0.5 mr-3 flex-shrink-0"
                    />
                    <div>
                      <div className="text-xs font-medium text-gray-500">
                        Nama Supplier
                      </div>
                      <div className="text-sm text-gray-900">
                        {displayData.supplier?.namaSupplier || "Supplier tidak tersedia"}
                      </div>
                    </div>
                  </li>

                  {displayData.supplier?.telepon && (
                    <li className="flex items-start">
                      <Receipt
                        size={18}
                        className="text-gray-400 mt-0.5 mr-3 flex-shrink-0"
                      />
                      <div>
                        <div className="text-xs font-medium text-gray-500">
                          Telepon
                        </div>
                        <div className="text-sm text-gray-900">
                          {displayData.supplier.telepon}
                        </div>
                      </div>
                    </li>
                  )}
                </ul>
             
            </div>
          </div>
        </div>
         )}
      </div>
      
      {/* Kredit Payment Modal */}
      <KreditPaymentModal
        isOpen={kreditModalOpen}
        onClose={() => setKreditModalOpen(false)}
        transaksiId={id}
        onSuccess={() => {
          setKreditModalOpen(false);
          refetch();
          toast.success("Pembayaran kredit berhasil dibuat");
        }}
      />
    </div>
  );
};

export default GlobalTransactionDetail;

