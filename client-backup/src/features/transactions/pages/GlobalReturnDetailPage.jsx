import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
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
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import toast from "react-hot-toast";

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

  const [returnData, setReturnData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch return detail
  useEffect(() => {
    const fetchReturnDetail = async () => {
      try {
        setLoading(true);
        // Uncomment this when API is ready
        // const response = await axios.get(`/api/transactions/returns/${id}`);
        // setReturnData(response.data);

        // For demo using dummy data
        setTimeout(() => {
          setReturnData(dummyReturnData);
          setLoading(false);
        }, 700);
      } catch (err) {
        console.error("Error fetching return detail:", err);
        setError("Gagal memuat detail retur. Silakan coba lagi.");
        setLoading(false);
        toast.error("Gagal memuat detail retur");
      }
    };

    fetchReturnDetail();
  }, [id]);

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
    navigate("/superadmin/transactions/returns");
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

  // Dummy data for demo
  const dummyReturnData = {
    transaksi_id: id,
    nomor_transaksi: `RTR-${Math.floor(10000000 + Math.random() * 90000000)}`,
    jenis_transaksi: "RETUR_PENJUALAN",
    tanggal: new Date().toISOString(),
    tanggal_selesai: new Date().toISOString(),
    cabang: {
      id: "cbg123",
      namaCabang: "Cabang Pusat",
    },
    pelanggan: {
      id: "cst123",
      namaPelanggan: "John Doe",
      telepon: "081234567890",
    },
    user: {
      id: "usr123",
      namaLengkap: "Admin Kasir",
    },
    transaksi_asli: {
      transaksi_id: "tr001",
      nomor_transaksi: "TRX-20230401001",
      tanggal: new Date(
        new Date().setDate(new Date().getDate() - 5)
      ).toISOString(),
    },
    alasan_retur: "Produk rusak dan tidak berfungsi dengan baik",
    subtotal: 200000,
    biaya_tambahan: 0,
    total: 200000,
    status_pembayaran: "LUNAS",
    keterangan: "Pengembalian dana tunai",
    return_detail: [
      {
        return_detail_id: "rd123",
        produk: {
          id: "prod123",
          produkMaster: {
            namaProduk: "Kemeja Denim",
            sku: "KD001",
            barcode: "8997123456789",
          },
        },
        jumlah: 1,
        harga_satuan: 150000,
        alasan: "Ukuran tidak sesuai",
        kondisi: "Baik",
        subtotal: 150000,
      },
      {
        return_detail_id: "rd124",
        produk: {
          id: "prod124",
          produkMaster: {
            namaProduk: "Kaos Katun",
            sku: "KK001",
            barcode: "8997123456790",
          },
        },
        jumlah: 1,
        harga_satuan: 50000,
        alasan: "Warna tidak sesuai pesanan",
        kondisi: "Baik",
        subtotal: 50000,
      },
    ],
    refund: {
      refund_id: "ref123",
      metode_refund: "TUNAI",
      jumlah_refund: 200000,
      tanggal_refund: new Date().toISOString(),
      status: "SELESAI",
    },
  };

  // Use data from API or dummy
  const displayData = returnData || dummyReturnData;

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
            className="flex items-center text-white bg-indigo-600 hover:bg-indigo-700 rounded-md px-4 py-2 text-sm"
            onClick={() =>
              toast.success(
                "Fitur unduh tanda terima retur akan segera tersedia"
              )
            }
          >
            <Download size={16} className="mr-2" />
            Unduh PDF
          </button>
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
                        locale: id,
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
                    {displayData.alasan_retur || "-"}
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
                              locale: id,
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
                  Informasi Refund
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">
                      Metode: {displayData.refund?.metode_refund || "-"}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Jumlah:{" "}
                      {formatCurrency(displayData.refund?.jumlah_refund || 0)}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Status: {displayData.refund?.status || "-"}
                    </p>
                    {displayData.refund?.tanggal_refund && (
                      <p className="text-sm text-gray-600 mt-1">
                        Tanggal:{" "}
                        {format(
                          new Date(displayData.refund.tanggal_refund),
                          "dd MMM yyyy",
                          { locale: id }
                        )}
                      </p>
                    )}
                  </div>
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
              {displayData.return_detail?.map((item) => (
                <tr key={item.return_detail_id}>
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
                      locale: id,
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
                  Refund Diproses
                </div>
                <div className="mt-1 text-sm text-gray-500">
                  {displayData.refund?.tanggal_refund
                    ? format(
                        new Date(displayData.refund.tanggal_refund),
                        "dd MMMM yyyy, HH:mm",
                        {
                          locale: id,
                        }
                      )
                    : "-"}
                </div>
                <div className="mt-1 text-sm text-gray-500">
                  {`Metode: ${
                    displayData.refund?.metode_refund || "-"
                  }, Jumlah: ${formatCurrency(
                    displayData.refund?.jumlah_refund || 0
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
                      locale: id,
                    }
                  )}
                </div>
                <div className="mt-1 text-sm text-gray-500">
                  {`Alasan: ${displayData.alasan_retur || "-"}`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalReturnDetail;
