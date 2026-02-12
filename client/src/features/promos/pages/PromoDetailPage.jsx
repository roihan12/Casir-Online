import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft,
  Edit,
  Trash2,
  Tag,
  Calendar,
  Users,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  Percent,
  DollarSign,
  ShoppingBag,
  Package,
  Store,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { format } from "date-fns";
import promoService from "../../../services/promoService";

const PromoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [promo, setPromo] = useState(null);
  const [stats, setStats] = useState(null);
  const [eligibleProducts, setEligibleProducts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch promo details
        const promoResponse = await promoService.getPromoById(id);
        setPromo(promoResponse.data);

        // Fetch promo stats
        try {
          const statsResponse = await promoService.getPromoStats(id);
          setStats(statsResponse.data);
        } catch (statsError) {
          console.error("Error fetching stats:", statsError);
        }

        // Fetch eligible products
        try {
          const productsResponse = await promoService.getEligibleProducts(id);
          setEligibleProducts(productsResponse.data);
        } catch (productsError) {
          console.error("Error fetching eligible products:", productsError);
        }
      } catch (error) {
        console.error("Error fetching promo details:", error);
        toast.error(error.response?.data?.message || "Gagal memuat detail promo");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Handle delete
  const handleDelete = async () => {
    try {
      await promoService.deletePromo(id);
      toast.success("Promo berhasil dihapus");
      navigate("/promos");
    } catch (error) {
      console.error("Error deleting promo:", error);
      toast.error(error.response?.data?.message || "Gagal menghapus promo");
    }
  };

  // Handle status change
  const handleStatusChange = async () => {
    const newStatus = promo?.status === "aktif" ? "tidak_aktif" : "aktif";
    try {
      await promoService.changePromoStatus(id, newStatus);
      setPromo((prev) => ({ ...prev, status: newStatus }));
      toast.success(`Status promo berhasil diubah menjadi ${newStatus === "aktif" ? "Aktif" : "Tidak Aktif"}`);
    } catch (error) {
      console.error("Error changing status:", error);
      toast.error(error.response?.data?.message || "Gagal mengubah status promo");
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "-";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format discount value
  const formatDiskonValue = () => {
    if (!promo) return "-";
    if (promo.tipeDiskon === "PERSENTASE") {
      return `${promo.nilaiDiskon}%`;
    } else if (promo.tipeDiskon === "NOMINAL") {
      return formatCurrency(promo.nilaiDiskon);
    } else if (promo.tipeDiskon === "BUY_X_GET_Y") {
      return "Beli 1 Gratis 1";
    } else if (promo.tipeDiskon === "HARGA_SPESIAL") {
      return "Harga Spesial";
    } else if (promo.tipeDiskon === "CASHBACK") {
      return "Cashback";
    } else if (promo.tipeDiskon === "VOUCHER") {
      return "Voucher";
    }
    return "-";
  };

  // Get discount type label
  const getTipeDiskonLabel = () => {
    if (!promo) return "-";
    const labels = {
      PERSENTASE: "Persentase",
      NOMINAL: "Nominal",
      BUY_X_GET_Y: "Beli 1 Gratis 1",
      HARGA_SPESIAL: "Harga Spesial",
      CASHBACK: "Cashback",
      VOUCHER: "Voucher",
    };
    return labels[promo.tipeDiskon] || promo.tipeDiskon;
  };

  // Get scope label
  const getScopeLabel = () => {
    if (!promo) return "-";
    const labels = {
      GLOBAL: "Semua Cabang & Produk",
      CABANG_SPESIFIK: "Cabang Tertentu",
      PRODUK_SPESIFIK: "Produk Tertentu",
      KATEGORI_SPESIFIK: "Kategori Tertentu",
      CUSTOM: "Kustom",
    };
    return labels[promo.tipeScope] || promo.tipeScope;
  };

  // Get status badge
  const getStatusBadge = () => {
    if (!promo) return null;
    const isActive = promo.status === "aktif";
    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          isActive
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800"
        }`}
      >
        {isActive ? (
          <CheckCircle size={16} className="mr-1" />
        ) : (
          <XCircle size={16} className="mr-1" />
        )}
        {isActive ? "Aktif" : "Tidak Aktif"}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-screen">
        <div className="flex flex-col items-center">
          <RefreshCw size={40} className="animate-spin text-indigo-500 mb-4" />
          <p className="text-gray-500">Memuat detail promo...</p>
        </div>
      </div>
    );
  }

  if (!promo) {
    return (
      <div className="p-6 flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle size={40} className="text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Promo tidak ditemukan</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/promos")}
            className="flex items-center justify-center h-10 w-10 rounded-lg border hover:bg-gray-50"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-gray-800">
                {promo.namaPromo}
              </h1>
              {getStatusBadge()}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">
                {promo.kodePromo}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/promos/edit/${id}`)}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <Edit size={16} />
            <span>Edit</span>
          </button>
          <button
            onClick={handleStatusChange}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 ${
              promo.status === "aktif"
                ? "text-red-600 hover:text-red-800"
                : "text-green-600 hover:text-green-800"
            }`}
          >
            {promo.status === "aktif" ? (
              <XCircle size={16} />
            ) : (
              <CheckCircle size={16} />
            )}
            <span>{promo.status === "aktif" ? "Nonaktifkan" : "Aktifkan"}</span>
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <Trash2 size={16} />
            <span>Hapus</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b mb-6">
        <nav className="flex gap-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "overview"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "stats"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Statistik Penggunaan
          </button>
          <button
            onClick={() => setActiveTab("products")}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "products"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Produk Eligible
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-medium mb-4">Informasi Dasar</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">Tipe Diskon</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Tag size={16} className="text-indigo-500" />
                      <span className="font-medium">{getTipeDiskonLabel()}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Nilai Diskon</label>
                    <div className="flex items-center gap-2 mt-1">
                      {promo.tipeDiskon === "PERSENTASE" ? (
                        <Percent size={16} className="text-indigo-500" />
                      ) : (
                        <DollarSign size={16} className="text-indigo-500" />
                      )}
                      <span className="font-medium">{formatDiskonValue()}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Scope</label>
                    <div className="flex items-center gap-2 mt-1">
                      <ShoppingBag size={16} className="text-indigo-500" />
                      <span className="font-medium">{getScopeLabel()}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Status</label>
                    <div className="mt-1">{getStatusBadge()}</div>
                  </div>
                </div>

                {promo.deskripsi && (
                  <div className="mt-4 pt-4 border-t">
                    <label className="text-sm text-gray-500">Deskripsi</label>
                    <p className="mt-1 text-gray-800">{promo.deskripsi}</p>
                  </div>
                )}
              </div>

              {/* Limits & Conditions */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-medium mb-4">Batasan & Ketentuan</h2>
                <div className="grid grid-cols-2 gap-4">
                  {promo.minPembelian && (
                    <div>
                      <label className="text-sm text-gray-500">Minimum Pembelian</label>
                      <div className="font-medium text-gray-800 mt-1">
                        {formatCurrency(promo.minPembelian)}
                      </div>
                    </div>
                  )}
                  {promo.maxDiskon && (
                    <div>
                      <label className="text-sm text-gray-500">Maksimum Diskon</label>
                      <div className="font-medium text-gray-800 mt-1">
                        {formatCurrency(promo.maxDiskon)}
                      </div>
                    </div>
                  )}
                  {promo.limitPenggunaan && (
                    <div>
                      <label className="text-sm text-gray-500">Limit Penggunaan</label>
                      <div className="font-medium text-gray-800 mt-1">
                        {promo.limitPenggunaan}x
                      </div>
                    </div>
                  )}
                  {promo.maxPenggunaanTotal && (
                    <div>
                      <label className="text-sm text-gray-500">Max Penggunaan Total</label>
                      <div className="font-medium text-gray-800 mt-1">
                        {promo.maxPenggunaanTotal}x
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Date Range */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-medium mb-4">Periode Berlaku</h2>
                <div className="flex items-center gap-6">
                  <div className="flex-1">
                    <label className="text-sm text-gray-500">Tanggal Mulai</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar size={16} className="text-gray-400" />
                      <span className="font-medium text-gray-800">
                        {promo.tanggalMulai
                          ? format(new Date(promo.tanggalMulai), "dd MMM yyyy")
                          : "-"}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="text-sm text-gray-500">Tanggal Berakhir</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar size={16} className="text-gray-400" />
                      <span className="font-medium text-gray-800">
                        {promo.tanggalBerakhir
                          ? format(new Date(promo.tanggalBerakhir), "dd MMM yyyy")
                          : "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Info */}
            <div className="space-y-6">
              {/* Scope Details */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-medium mb-4">Detail Scope</h2>
                <div className="space-y-3">
                  {promo.cabangId && (
                    <div>
                      <label className="text-sm text-gray-500">Cabang</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Store size={16} className="text-gray-400" />
                        <span className="font-medium">{promo.namaCabang || promo.cabangId}</span>
                      </div>
                    </div>
                  )}
                  {promo.kategoriId && (
                    <div>
                      <label className="text-sm text-gray-500">Kategori</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Package size={16} className="text-gray-400" />
                        <span className="font-medium">{promo.namaKategori || promo.kategoriId}</span>
                      </div>
                    </div>
                  )}
                  {promo.produkId && (
                    <div>
                      <label className="text-sm text-gray-500">Produk</label>
                      <div className="flex items-center gap-2 mt-1">
                        <ShoppingBag size={16} className="text-gray-400" />
                        <span className="font-medium">{promo.namaProduk || promo.produkId}</span>
                      </div>
                    </div>
                  )}
                  {!promo.cabangId && !promo.kategoriId && !promo.produkId && (
                    <p className="text-sm text-gray-500">Berlaku untuk semua cabang dan produk</p>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              {stats && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-medium mb-4">Ringkasan</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Total Penggunaan</span>
                      <span className="font-medium">{stats.usage?.totalUsage || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Total Transaksi</span>
                      <span className="font-medium">{stats.usage?.totalTransactions || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Total Diskon</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(stats.usage?.totalDiscountGiven || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Audit Info */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-medium mb-4">Informasi Audit</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Dibuat</span>
                    <span className="text-gray-800">
                      {promo.createdAt
                        ? format(new Date(promo.createdAt), "dd MMM yyyy, HH:mm")
                        : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Diperbarui</span>
                    <span className="text-gray-800">
                      {promo.updatedAt
                        ? format(new Date(promo.updatedAt), "dd MMM yyyy, HH:mm")
                        : "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Tab */}
        {activeTab === "stats" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {stats ? (
              <div className="space-y-6">
                {/* Usage Stats */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-medium mb-4">Statistik Penggunaan</h2>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center p-4 bg-indigo-50 rounded-lg">
                      <Users className="mx-auto text-indigo-600 mb-2" size={24} />
                      <div className="text-2xl font-bold text-indigo-600">
                        {stats.usage?.totalUsage || 0}
                      </div>
                      <div className="text-sm text-gray-600">Total Penggunaan</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <TrendingUp className="mx-auto text-green-600 mb-2" size={24} />
                      <div className="text-2xl font-bold text-green-600">
                        {stats.usage?.totalTransactions || 0}
                      </div>
                      <div className="text-sm text-gray-600">Total Transaksi</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <Store className="mx-auto text-blue-600 mb-2" size={24} />
                      <div className="text-2xl font-bold text-blue-600">
                        {stats.usage?.branchesUsed || 0}
                      </div>
                      <div className="text-sm text-gray-600">Cabang Digunakan</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <DollarSign className="mx-auto text-purple-600 mb-2" size={24} />
                      <div className="text-2xl font-bold text-purple-600">
                        {formatCurrency(stats.usage?.totalDiscountGiven || 0)}
                      </div>
                      <div className="text-sm text-gray-600">Total Diskon Diberikan</div>
                    </div>
                  </div>
                </div>

                {/* Recent Transactions */}
                {stats.recentTransactions && stats.recentTransactions.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-medium mb-4">Transaksi Terakhir</h2>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">No. Transaksi</th>
                            <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Tanggal</th>
                            <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Cabang</th>
                            <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Pelanggan</th>
                            <th className="text-right py-2 px-3 text-sm font-medium text-gray-600">Total</th>
                            <th className="text-right py-2 px-3 text-sm font-medium text-gray-600">Diskon</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.recentTransactions.map((transaction, index) => (
                            <tr key={index} className="border-b last:border-0">
                              <td className="py-3 px-3 text-sm">{transaction.nomorTransaksi}</td>
                              <td className="py-3 px-3 text-sm">
                                {format(new Date(transaction.tanggal), "dd MMM yyyy")}
                              </td>
                              <td className="py-3 px-3 text-sm">{transaction.cabang}</td>
                              <td className="py-3 px-3 text-sm">{transaction.pelanggan || "-"}</td>
                              <td className="py-3 px-3 text-sm text-right">
                                {formatCurrency(transaction.total)}
                              </td>
                              <td className="py-3 px-3 text-sm text-right text-green-600">
                                -{formatCurrency(transaction.discount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <TrendingUp size={40} className="text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Belum ada statistik penggunaan</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Products Tab */}
        {activeTab === "products" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {eligibleProducts ? (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium">Produk Eligible</h2>
                  <span className="text-sm text-gray-500">
                    {eligibleProducts.totalProducts} produk
                  </span>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">SKU</th>
                        <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Nama Produk</th>
                        <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Kategori</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eligibleProducts.eligibleProducts.map((product, index) => (
                        <tr key={index} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="py-3 px-3 text-sm font-mono text-gray-600">{product.sku || "-"}</td>
                          <td className="py-3 px-3 text-sm font-medium">{product.namaProduk}</td>
                          <td className="py-3 px-3 text-sm text-gray-600">{product.namaKategori || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <Package size={40} className="text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Memuat produk eligible...</p>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center mb-4 text-red-600">
              <AlertCircle size={24} className="mr-2" />
              <h3 className="text-lg font-semibold">Konfirmasi Penghapusan</h3>
            </div>
            <p className="mb-6">
              Apakah Anda yakin ingin menghapus promo{" "}
              <span className="font-semibold">{promo?.namaPromo}</span>? Tindakan ini
              tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromoDetail;
