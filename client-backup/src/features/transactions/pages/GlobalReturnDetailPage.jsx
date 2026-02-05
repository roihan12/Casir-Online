import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  User,
  MapPin,
  Receipt,
  FileText,
  Clock,
  Printer,
  Download,
  RefreshCcw,
  Loader,
  CheckCircle,
  XCircle,
  AlertCircle,
  Package,
  DollarSign,
  CreditCard as CreditCardIcon,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import toast from "react-hot-toast";
import { useReturById } from "../hooks/useReturQueries";
import PelunasanModal from "../components/PelunasanModal";

// Formatter untuk uang
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

const GlobalReturnDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pelunasanModalOpen, setPelunasanModalOpen] = useState(false);

  // Fetch return detail using React Query
  const {
    data: returnData,
    isLoading: loading,
    error,
    refetch,
  } = useReturById(id);

  // Return type badge component
  const ReturnTypeBadge = ({ type }) => {
    let className;
    let icon;

    switch (type) {
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
        {type.replace("RETUR_", "").replace("_", " ")}
      </span>
    );
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    let className;
    let icon;

    switch (status) {
      case "LUNAS":
        className = "bg-green-100 text-green-800";
        icon = <CheckCircle size={14} className="mr-1" />;
        break;
      case "BELUM_LUNAS":
        className = "bg-yellow-100 text-yellow-800";
        icon = <AlertCircle size={14} className="mr-1" />;
        break;
      case "DIBATALKAN":
        className = "bg-red-100 text-red-800";
        icon = <XCircle size={14} className="mr-1" />;
        break;
      default:
        className = "bg-gray-100 text-gray-800";
        icon = null;
    }

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${className}`}
      >
        {icon}
        {status.replace("_", " ")}
      </span>
    );
  };

  // Go back to returns list
  const handleBack = () => {
    navigate("/returns");
  };

  // Print receipt
  const handlePrintReceipt = () => {
    toast.success("Fitur cetak tanda terima retur akan segera tersedia");
  };

  if (loading) {
    return (
      <div className="w-full p-6 flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center">
          <Loader className="animate-spin h-8 w-8 text-indigo-600" />
          <p className="mt-4 text-gray-600">Memuat data retur...</p>
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
          Kembali ke Daftar Retur
        </button>
      </div>
    );
  }

  if (!returnData) {
    return (
      <div className="w-full p-6">
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
          Data retur tidak ditemukan
        </div>
        <button
          className="flex items-center text-indigo-600 hover:text-indigo-900"
          onClick={handleBack}
        >
          <ArrowLeft size={18} className="mr-1" />
          Kembali ke Daftar Retur
        </button>
      </div>
    );
  }

  // Use data from API
  const displayData = returnData ? {
    ...returnData,
    // Map new fields to legacy ones for compatibility
    nomor_transaksi: returnData.number,
    tanggal: returnData.date,
    jenis_transaksi: returnData.type,
    status_pembayaran: returnData.status,
    total: returnData.total,
    keterangan: returnData.notes,
    cabang: {
        namaCabang: returnData.branchName,
        alamat: returnData.branchAddress,
        telepon: returnData.branchPhone
    },
    user: {
        namaLengkap: returnData.cashierName
    },
    pelanggan: returnData.customerInfo ? {
        ...returnData.customerInfo,
        namaPelanggan: returnData.customerInfo.name,
        telepon: returnData.customerInfo.contact
    } : null,
    supplier: returnData.supplierInfo ? { // Assuming supplierInfo might exist for RETUR_PEMBELIAN
        ...returnData.supplierInfo,
        namaSupplier: returnData.supplierInfo.name,
        telepon: returnData.supplierInfo.contact
    } : null,
    transaksi_detail: returnData.items?.map(item => ({
        ...item,
        jumlah: item.quantity,
        harga_satuan: item.price,
        subtotal: item.subtotal,
        produk: {
            produkMaster: {
                namaProduk: item.name
            }
        },
        transaksi_detail_id: item.id
    })),
    pembayaran: returnData.payments?.map(p => ({
        ...p,
        pembayaran_id: p.id,
        metode_pembayaran: p.method,
        jumlah_bayar: p.amount,
        tanggal_pembayaran: p.date,
        status: "LUNAS" // Formatted payments are successful
    }))
  } : null;

  return (
    <div className="w-full p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Detail Retur</h1>
        <p className="text-sm text-gray-600">
          Informasi lengkap transaksi retur
        </p>
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
            Cetak
          </button>
          <button
            className="flex items-center text-gray-700 hover:text-gray-900 bg-white border border-gray-300 rounded-md px-4 py-2 text-sm"
            onClick={() =>
              toast.success(
                "Fitur unduh tanda terima retur akan segera tersedia"
              )
            }
          >
            <Download size={16} className="mr-2" />
            Unduh PDF
          </button>
          {/* Tampilkan tombol pelunasan jika retur belum lunas */}
          {displayData.status_pembayaran === "BELUM_LUNAS" && (
            <button
              className="flex items-center text-white bg-green-600 hover:bg-green-700 rounded-md px-4 py-2 text-sm"
              onClick={() => setPelunasanModalOpen(true)}
            >
              <CreditCardIcon size={16} className="mr-2" />
              Pelunasan
            </button>
          )}
        </div>
      </div>

      {/* Return Info Card */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-800">Informasi Retur</h2>
          <div className="flex items-center space-x-3">
            <ReturnTypeBadge type={displayData.jenis_transaksi} />
            <StatusBadge status={displayData.status_pembayaran} />
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Nomor Retur
                  </p>
                  <p className="mt-1 text-sm text-gray-900">
                    {displayData.nomor_transaksi}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Tanggal Retur
                  </p>
                  <p className="mt-1 text-sm text-gray-900 flex items-center">
                    <Calendar size={14} className="mr-1 text-gray-400" />
                    {format(
                      new Date(displayData.tanggal),
                      "dd MMMM yyyy, HH:mm",
                      {
                        locale: localeId,
                      }
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Cabang</p>
                  <p className="mt-1 text-sm text-gray-900 flex items-center">
                    <MapPin size={14} className="mr-1 text-gray-400" />
                    {displayData.cabang?.namaCabang || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Petugas</p>
                  <p className="mt-1 text-sm text-gray-900 flex items-center">
                    <User size={14} className="mr-1 text-gray-400" />
                    {displayData.user?.namaLengkap || "-"}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-sm font-medium text-gray-500">
                  Alasan Retur
                </p>
                <div className="mt-1 p-2 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-900">
                    {displayData.keterangan || "-"}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-sm font-medium text-gray-500">Catatan</p>
                <div className="mt-1 p-2 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-900">
                    {displayData.keterangan || "-"}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t md:border-t-0 md:border-l border-gray-200 md:pl-6 pt-6 md:pt-0">
              <p className="text-sm font-medium text-gray-500 mb-4">
                Informasi Transaksi Asli
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500">
                      Nomor Transaksi
                    </p>
                    <p className="mt-1 text-sm text-indigo-600 font-medium">
                      {displayData.transaksi_asli?.nomor_transaksi || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">
                      Tanggal Transaksi
                    </p>
                    <p className="mt-1 text-sm text-gray-900">
                      {displayData.transaksi_asli?.tanggal
                        ? format(
                            new Date(displayData.transaksi_asli.tanggal),
                            "dd MMM yyyy",
                            {
                              locale: localeId,
                            }
                          )
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-sm font-medium text-gray-500 mb-4">
                  {displayData.jenis_transaksi === "RETUR_PENJUALAN"
                    ? "Informasi Pelanggan"
                    : "Informasi Supplier"}
                </p>

                <div className="bg-gray-50 p-4 rounded-lg">
                  {displayData.jenis_transaksi === "RETUR_PENJUALAN" ? (
                    <div>
                      <p className="text-sm font-medium">
                        {displayData.pelanggan?.namaPelanggan ||
                          "Pelanggan Umum"}
                      </p>
                      {displayData.pelanggan?.telepon && (
                        <p className="text-sm text-gray-600 mt-1">
                          Telepon: {displayData.pelanggan.telepon}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium">
                        {displayData.supplier?.namaSupplier || "-"}
                      </p>
                      {displayData.supplier?.telepon && (
                        <p className="text-sm text-gray-600 mt-1">
                          Telepon: {displayData.supplier.telepon}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <p className="text-sm font-medium text-gray-500 mb-4">
                  Informasi Pembayaran
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {displayData.pembayaran?.length > 0 ? (
                    displayData.pembayaran.map((payment, index) => (
                      <div key={payment.pembayaran_id || index} className="mb-2 last:mb-0">
                        <p className="text-sm font-medium">
                          Metode: {payment.metode_pembayaran?.replace("_", " ") || "-"}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Jumlah: {formatCurrency(payment.jumlah_bayar || 0)}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Status: {payment.status || "-"}
                        </p>
                        {payment.tanggal_pembayaran && (
                          <p className="text-sm text-gray-600 mt-1">
                            Tanggal:{" "}
                            {format(
                              new Date(payment.tanggal_pembayaran),
                              "dd MMM yyyy",
                              { locale: localeId }
                            )}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">Belum ada pembayaran</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Item Return Details */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">
            Detail Item Retur
          </h2>
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
                  SKU
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
                  Harga Satuan
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Subtotal
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Alasan
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Kondisi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayData.transaksi_detail?.map((item) => (
                <tr key={item.transaksi_detail_id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center">
                        <Package className="h-6 w-6 text-gray-500" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {item.produk?.produkMaster?.namaProduk || "-"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    {item.produk?.produkMaster?.sku || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                    {item.jumlah}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatCurrency(item.harga_satuan)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                    {formatCurrency(item.subtotal)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.alasan || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${
                        item.kondisi === "Baik"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {item.kondisi || "-"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-4 text-sm text-gray-700 text-right font-medium"
                >
                  Total
                </td>
                <td className="px-6 py-4 text-right text-sm text-gray-900 font-bold">
                  {formatCurrency(displayData.total)}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Return Timeline (can be added later) */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Timeline Retur</h2>
        </div>
        <div className="p-6">
          <div className="flex flex-col space-y-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-900">
                  Transaksi Retur Selesai
                </div>
                <div className="mt-1 text-sm text-gray-500">
                  {format(
                    new Date(
                      displayData.tanggal_selesai || displayData.tanggal
                    ),
                    "dd MMMM yyyy, HH:mm",
                    {
                      locale: localeId,
                    }
                  )}
                </div>
              </div>
            </div>

            <div className="flex">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-indigo-600" />
                </div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-900">
                  Pembayaran {displayData.status_pembayaran === "LUNAS" ? "Lunas" : "Pending"}
                </div>
                <div className="mt-1 text-sm text-gray-500">
                  {displayData.pembayaran?.[0]?.tanggal_pembayaran
                    ? format(
                        new Date(displayData.pembayaran[0].tanggal_pembayaran),
                        "dd MMMM yyyy, HH:mm",
                        {
                          locale: localeId,
                        }
                      )
                    : "-"}
                </div>
                <div className="mt-1 text-sm text-gray-500">
                  {`Metode: ${
                    displayData.pembayaran?.[0]?.metode_pembayaran?.replace("_", " ") || "-"
                  }, Jumlah: ${formatCurrency(
                    displayData.pembayaran?.[0]?.jumlah_bayar || 0
                  )}`}
                </div>
              </div>
            </div>

            <div className="flex">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <RefreshCcw className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-900">
                  Permintaan Retur Dibuat
                </div>
                <div className="mt-1 text-sm text-gray-500">
                  {format(
                    new Date(displayData.tanggal),
                    "dd MMMM yyyy, HH:mm",
                    {
                      locale: localeId,
                    }
                  )}
                </div>
                <div className="mt-1 text-sm text-gray-500">
                  {`Alasan: ${displayData.keterangan || "-"}`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pelunasan Modal */}
      <PelunasanModal
        isOpen={pelunasanModalOpen}
        onClose={() => setPelunasanModalOpen(false)}
        transaksiId={id}
        totalTagihan={displayData?.total || 0}
        sisaTagihan={displayData?.total - (displayData?.pembayaran?.reduce((sum, p) => sum + (p?.jumlah_bayar || 0), 0) || 0)}
        onSuccess={() => {
          setPelunasanModalOpen(false);
          refetch();
          toast.success("Pelunasan berhasil dibuat");
        }}
      />
    </div>
  );
};

export default GlobalReturnDetail;
