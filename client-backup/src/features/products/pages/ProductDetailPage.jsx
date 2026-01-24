import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Package,
  ArrowLeft,
  Edit,
  Trash2,
  Tag,
  Hash,
  Truck,
  Calendar,
  Box,
  Clipboard,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  XCircle,
  Layers,
  Star,
  DollarSign,
  ShoppingCart,
  BarChart2,
  History,
  TrendingUp,
  MapPin,
  Clock,
  User,
  Activity
} from "lucide-react";
import useProdukQueries from "../hooks/useProdukQueries";
import { usePriceManagementQueries } from "../hooks/usePriceManagementQueries";
import { useAuth } from "../../auth/hooks/useAuth.js";
import { toast } from "react-hot-toast";
import Spinner from "../../../features/common/Spinner";
import Alert from "../../../features/common/Alert";

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isSuperAdmin, hasPermission } = useAuth();
  const { useProductById, useInventoryMovements, } = useProdukQueries();
  const { usePriceHistory } = usePriceManagementQueries();

  const [activeTab, setActiveTab] = useState("info");
  const [selectedImage, setSelectedImage] = useState(0);

  // Fetch product details
  const {
    data: productResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useProductById(id);

  const product = productResponse?.data;

  // Permissions
  const adminMode = isSuperAdmin();
  const canUpdate = hasPermission("produk:update");
  const canDelete = hasPermission("produk:delete");

  // Fetch Movements and Price History
  const { data: movementsResponse, isLoading: movementsLoading } = useInventoryMovements(id, { limit: 10 });
  const { data: priceHistoryResponse, isLoading: priceLoading } = usePriceHistory(id, { limit: 10 });

  const movements = movementsResponse?.data || [];
  const priceHistory = priceHistoryResponse?.data || [];

  // Handle edit product
  const handleEdit = () => {
    navigate(`/products/edit/${id}`);
  };

  // Handle delete product
  const handleDelete = () => {
    if (window.confirm("Apakah Anda yakin ingin menghapus produk ini dari cabang ini?")) {
      // Implement delete logic if needed
      toast.error("Fitur hapus produk cabang segera hadir");
    }
  };

  // Handle go back
  const handleBack = () => {
    navigate("/products");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Spinner />
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <Alert
            type="error"
            title="Error"
            message={`Gagal memuat data produk: ${error.message}`}
          />
          <div className="mt-4 flex space-x-4">
            <button
              onClick={refetch}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              <RefreshCw className="h-4 w-4" /> Coba lagi
            </button>
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              <ArrowLeft className="h-4 w-4" /> Kembali
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <Alert
            type="warning"
            title="Produk tidak ditemukan"
            message="Produk yang Anda cari tidak ditemukan atau telah dihapus dari cabang ini."
          />
          <button
            onClick={handleBack}
            className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke Manajemen Produk
          </button>
        </div>
      </div>
    );
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price || 0);
  };

  const productMaster = product.produkMaster;
  const primaryImage =
    productMaster?.produkImage && productMaster.produkImage.length > 0
      ? productMaster.produkImage.find((img) => img.isPrimary)?.filePath ||
        productMaster.produkImage[0].filePath
      : null;

  return (
    <div className="p-0 bg-gray-50 min-h-screen">
      {/* Dynamic Header / Breadcrumbs */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 mb-6 sticky top-0 z-10 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center">
            <button
              onClick={handleBack}
              className="mr-4 p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <nav className="flex text-xs text-gray-500 mb-1" aria-label="Breadcrumb">
                <span className="cursor-pointer hover:text-blue-600" onClick={() => navigate("/products")}>Produk</span>
                <span className="mx-2">/</span>
                <span className="text-gray-800 font-medium">Detail Produk</span>
              </nav>
              <h1 className="text-xl font-bold text-gray-900 flex items-center">
                {productMaster?.namaProduk}
                <span className={`ml-3 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  product.status === "tersedia" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}>
                  {product.status === "tersedia" ? "Tersedia" : "Tidak Tersedia"}
                </span>
              </h1>
            </div>
          </div>

          <div className="flex space-x-2">
            {canUpdate && (
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center transition-colors shadow-sm"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Produk
              </button>
            )}
            {canDelete && adminMode && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 font-medium flex items-center transition-colors shadow-sm"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - 4 cols */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
              <div className="aspect-square bg-gray-50 relative group">
                {productMaster?.produkImage && productMaster.produkImage.length > 0 ? (
                  <img
                    src={productMaster.produkImage[selectedImage]?.filePath || primaryImage}
                    alt={productMaster.namaProduk}
                    className="w-full h-full object-contain p-4"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <Package className="h-20 w-20 mb-3 opacity-20" />
                    <p className="text-sm">Gambar tidak tersedia</p>
                  </div>
                )}
              </div>
              
              {productMaster?.produkImage && productMaster.produkImage.length > 1 && (
                <div className="p-4 border-t border-gray-100 flex gap-2 overflow-x-auto no-scrollbar">
                  {productMaster.produkImage.map((img, idx) => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedImage(idx)}
                      className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                        selectedImage === idx ? "border-blue-500 ring-2 ring-blue-50" : "border-gray-100 hover:border-gray-300"
                      }`}
                    >
                      <img src={img.filePath} className="w-full h-full object-cover" alt="" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Branch Card */}
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center">
                <MapPin className="h-4 w-4 mr-2" /> Informasi Cabang
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Nama Cabang</span>
                  <span className="font-bold text-gray-900">{product.cabang?.namaCabang || "-"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Lokasi</span>
                  <span className="text-sm text-gray-800">{product.cabang?.alamat || "-"}</span>
                </div>
              </div>
            </div>

            {/* Meta Info */}
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center">
                <Clock className="h-4 w-4 mr-2" /> Log Sistem
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Dibuat:</span>
                  <div className="text-right">
                    <p className="font-medium text-gray-800">{new Date(product.createdAt).toLocaleDateString("id-ID")}</p>
                    <p className="text-[10px] text-gray-400 flex items-center justify-end"><User className="h-3 w-3 mr-1" /> {product.created_by || "System"}</p>
                  </div>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Update:</span>
                  <div className="text-right">
                    <p className="font-medium text-gray-800">{new Date(product.updatedAt).toLocaleDateString("id-ID")}</p>
                    <p className="text-[10px] text-gray-400 flex items-center justify-end"><User className="h-3 w-3 mr-1" /> {product.updated_by || "System"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - 8 cols */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase">Stok Saat Ini</p>
                  <p className="text-xl font-bold text-gray-900">{product.stok} <span className="text-sm font-normal text-gray-500 uppercase">{productMaster?.satuan || "pcs"}</span></p>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex items-center gap-4">
                <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase">Harga Jual</p>
                  <p className="text-xl font-bold text-gray-900">{formatPrice(product.hargaJual)}</p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex items-center gap-4">
                <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase">Minimum Stok</p>
                  <p className="text-xl font-bold text-gray-900">{product.minStok || 0}</p>
                </div>
              </div>
            </div>

            {/* Main Tabs Container */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="border-b border-gray-100 bg-gray-50/50">
                <nav className="flex">
                  {[
                    { id: "info", label: "Informasi Produk", icon: Clipboard },
                    { id: "pricing", label: "Harga & Biaya", icon: DollarSign },
                    { id: "stock", label: "Histori Stok", icon: History },
                    { id: "prices", label: "Histori Harga", icon: TrendingUp },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center px-6 py-4 text-sm font-medium transition-all relative ${
                        activeTab === tab.id 
                          ? "text-blue-600 bg-white" 
                          : "text-gray-500 hover:text-gray-700 hover:bg-gray-100/50"
                      }`}
                    >
                      <tab.icon className={`h-4 w-4 mr-2 ${activeTab === tab.id ? "text-blue-600" : "text-gray-400"}`} />
                      {tab.label}
                      {activeTab === tab.id && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                      )}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {/* Information Tab */}
                {activeTab === "info" && (
                  <div className="space-y-8">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 mb-4 border-l-4 border-blue-500 pl-3">Identitas Produk</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-start py-2 border-b border-gray-50">
                            <span className="text-gray-500 text-sm">Nama Produk</span>
                            <span className="font-medium text-right max-w-[200px]">{productMaster?.namaProduk}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-50">
                            <span className="text-gray-500 text-sm">SKU</span>
                            <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">{productMaster?.sku}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-50">
                            <span className="text-gray-500 text-sm">Barcode</span>
                            <span className="font-medium">{productMaster?.barcode || "-"}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-50">
                            <span className="text-gray-500 text-sm">Kategori</span>
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-semibold">{productMaster?.kategori?.namaKategori || "Uncategorized"}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 mb-4 border-l-4 border-blue-500 pl-3">Atribut Fisik</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center py-2 border-b border-gray-50">
                            <span className="text-gray-500 text-sm">Satuan Jual</span>
                            <span className="font-medium">{productMaster?.satuan || "pcs"}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-50">
                            <span className="text-gray-500 text-sm">Berat</span>
                            <span className="font-medium">{productMaster?.berat ? `${productMaster.berat} gram` : "-"}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-50">
                            <span className="text-gray-500 text-sm">Dimensi</span>
                            <span className="font-medium text-sm">
                              {productMaster?.dimensiP || 0} x {productMaster?.dimensiL || 0} x {productMaster?.dimensiT || 0} cm
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 mb-3 border-l-4 border-blue-500 pl-3">Deskripsi</h4>
                      <div className="bg-gray-50 rounded-lg p-4 text-gray-700 text-sm leading-relaxed whitespace-pre-line border border-gray-100">
                        {productMaster?.deskripsi || "Tidak ada deskripsi tersedia untuk produk ini."}
                      </div>
                    </div>
                  </div>
                )}

                {/* Pricing Tab */}
                {activeTab === "pricing" && (
                  <div className="max-w-2xl">
                    <h4 className="text-sm font-bold text-gray-900 mb-6 border-l-4 border-emerald-500 pl-3">Detail Harga & Margin</h4>
                    <div className="bg-emerald-50/30 rounded-xl p-6 border border-emerald-100 space-y-4">
                      <div className="flex justify-between items-center py-3 border-b border-emerald-100/50">
                        <div className="flex items-center">
                          <div className="p-2 bg-emerald-100 rounded-lg mr-3 text-emerald-700">
                            <ShoppingCart className="h-4 w-4" />
                          </div>
                          <span className="text-gray-700 font-medium">Harga Beli (Modal)</span>
                        </div>
                        <span className="text-lg font-bold text-gray-900">{formatPrice(product.hargaBeli)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center py-3 border-b border-emerald-100/50">
                        <div className="flex items-center">
                          <div className="p-2 bg-blue-100 rounded-lg mr-3 text-blue-700">
                            <Tag className="h-4 w-4" />
                          </div>
                          <span className="text-gray-700 font-medium">Harga Jual Ritel</span>
                        </div>
                        <span className="text-xl font-extrabold text-blue-600">{formatPrice(product.hargaJual)}</span>
                      </div>

                      <div className="flex justify-between items-center py-3 border-b border-emerald-100/50">
                        <div className="flex items-center">
                          <div className="p-2 bg-indigo-100 rounded-lg mr-3 text-indigo-700">
                            <Layers className="h-4 w-4" />
                          </div>
                          <span className="text-gray-700 font-medium">Harga Grosir</span>
                        </div>
                        <span className="text-lg font-bold text-gray-900">{formatPrice(product.hargaGrosir)}</span>
                      </div>

                      <div className="pt-4 flex justify-between items-center">
                        <span className="text-emerald-700 font-bold uppercase text-[10px] tracking-widest">Estimasi Profit</span>
                        <div className="text-right">
                          <p className="text-2xl font-black text-emerald-600">
                            {formatPrice(product.hargaJual - product.hargaBeli)}
                          </p>
                          <p className="text-xs text-emerald-500 font-medium">
                            {(((product.hargaJual - product.hargaBeli) / product.hargaBeli) * 100).toFixed(1)}% Margin Profit
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stock History Tab */}
                {activeTab === "stock" && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="text-sm font-bold text-gray-900 border-l-4 border-amber-500 pl-3">Mutasi Stok Terakhir</h4>
                      <button 
                        onClick={() => navigate("/inventory/movements", { state: { productId: id } })}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 uppercase tracking-tighter"
                      >
                        Lihat Semua →
                      </button>
                    </div>

                    {movementsLoading ? (
                      <div className="flex justify-center py-12"><Spinner /></div>
                    ) : movements.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead>
                            <tr className="text-gray-400 font-bold uppercase text-[10px] border-b border-gray-100">
                              <th className="pb-3 pr-4">Tanggal</th>
                              <th className="pb-3 px-4">Tipe</th>
                              <th className="pb-3 px-4">Perubahan</th>
                              <th className="pb-3 px-4">Sisa Stok</th>
                              <th className="pb-3 pl-4">Keterangan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 text-gray-700">
                            {movements.map((move) => (
                              <tr key={move.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="py-4 pr-4 whitespace-nowrap">
                                  <p className="font-medium">{new Date(move.createdAt).toLocaleDateString("id-ID")}</p>
                                  <p className="text-[10px] text-gray-400">{new Date(move.createdAt).toLocaleTimeString("id-ID")}</p>
                                </td>
                                <td className="py-4 px-4">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                    move.tipe === "in" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                                  }`}>
                                    {move.tipe === "in" ? "Masuk" : "Keluar"}
                                  </span>
                                </td>
                                <td className={`py-4 px-4 font-bold ${move.tipe === "in" ? "text-emerald-600" : "text-red-600"}`}>
                                  {move.tipe === "in" ? "+" : "-"}{move.jumlahPerubahan}
                                </td>
                                <td className="py-4 px-4 font-bold text-gray-900">{move.jumlahSetelah}</td>
                                <td className="py-4 pl-4 text-xs text-gray-500 max-w-[200px] truncate">{move.keterangan || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <Activity className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm italic">Belum ada histori mutasi stok.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Price History Tab */}
                {activeTab === "prices" && (
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-6 border-l-4 border-indigo-500 pl-3">Histori Perubahan Harga</h4>
                    
                    {priceLoading ? (
                      <div className="flex justify-center py-12"><Spinner /></div>
                    ) : priceHistory.length > 0 ? (
                      <div className="space-y-4">
                        {priceHistory.map((item) => (
                          <div key={item.id} className="flex items-center bg-gray-50 rounded-xl p-4 border border-gray-100 group hover:border-indigo-200 transition-all">
                            <div className={`p-3 rounded-lg mr-4 ${
                              item.tipeHarga === "jual" ? "bg-blue-100 text-blue-600" : 
                              item.tipeHarga === "beli" ? "bg-emerald-100 text-emerald-600" : "bg-purple-100 text-purple-600"
                            }`}>
                              <TrendingUp className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter mb-1">
                                    {item.tipeHarga === "jual" ? "Harga Jual" : item.tipeHarga === "beli" ? "Harga Beli (Modal)" : "Harga Grosir"}
                                  </p>
                                  <div className="flex items-center">
                                    <span className="text-gray-400 line-through text-xs mr-2">{formatPrice(item.hargaLama)}</span>
                                    <span className="text-blue-600 font-black">→ {formatPrice(item.hargaBaru)}</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs font-bold text-gray-900">{new Date(item.tanggalPerubahan).toLocaleDateString("id-ID")}</p>
                                  <p className="text-[10px] text-gray-400 flex items-center justify-end">
                                    <Activity className="h-3 w-3 mr-1" /> {item.alasanPerubahan || "Update rutin"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <TrendingUp className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm italic">Belum ada histori perubahan harga.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
