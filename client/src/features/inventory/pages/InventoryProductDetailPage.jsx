import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Package, History, DollarSign, Activity, 
  MapPin, AlertCircle, BarChart2, Tag, Calendar
} from "lucide-react";
import Spinner from "../../common/Spinner";
import useProdukQueries from "../../products/hooks/useProdukQueries";
import Pagination from "../../common/Pagination";
import formatCurrency from "@common/utils/formatCurrency"; // Assuming this exists or create a local fallback

// Fallback format if utility doesn't exist
const fallbackFormatCurrency = (val) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val || 0);
const currencyFormatter = formatCurrency || fallbackFormatCurrency;

const formatDate = (iso) => {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
};

const STATUS_CONFIG = {
  tersedia: "bg-green-100 text-green-800",
  tidak_tersedia: "bg-red-100 text-red-800",
  draft: "bg-gray-100 text-gray-800",
};

const InventoryProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("movements");
  
  // Pagination states for history tables
  const [movementPage, setMovementPage] = useState(1);
  const [pricePage, setPricePage] = useState(1);

  const { useProductById, useInventoryMovements, usePriceHistory } = useProdukQueries();
  
  const { data: productResp, isLoading: isProductLoading, isError: isProductError } = useProductById(id);
  const { data: movementsResp, isLoading: isMoveLoading } = useInventoryMovements(id, { page: movementPage, limit: 10 });
  const { data: priceResp, isLoading: isPriceLoading } = usePriceHistory(id, { page: pricePage, limit: 10 });

  if (isProductLoading) return (
    <div className="flex justify-center items-center min-h-[500px]">
      <Spinner size="large" />
    </div>
  );

  if (isProductError || !productResp?.data) return (
    <div className="flex flex-col items-center justify-center min-h-[500px] text-gray-500">
      <AlertCircle size={48} className="text-red-400 mb-4" />
      <h2 className="text-xl font-semibold text-gray-800 mb-2">Produk Tidak Ditemukan</h2>
      <button onClick={() => navigate("/inventory")} className="text-indigo-600 hover:underline">
        Kembali ke Inventori
      </button>
    </div>
  );

  const product = productResp.data;
  const pm = product.produkMaster || {};
  const statusBadge = STATUS_CONFIG[product.status] || "bg-gray-100 text-gray-800";
  
  const movements = movementsResp?.data || [];
  const movePagination = movementsResp?.pagination || {};
  
  const prices = priceResp?.data || [];
  const pricePagination = priceResp?.pagination || {};

  return (
    <div className="pb-10 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white rounded-b-3xl py-8 px-6 sm:px-10 shadow-lg">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-indigo-100 hover:text-white mb-6 transition-colors font-medium"
        >
          <ArrowLeft size={18} /> Kembali
        </button>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-3 py-1 text-xs font-semibold rounded-full bg-white/20 backdrop-blur-sm text-white border border-white/30`}>
                {product.status?.toUpperCase() || "UNKNOWN"}
              </span>
              <span className="text-indigo-200 text-sm flex items-center gap-1">
                <Tag size={14} /> {pm.kategori?.namaKategori || "Tanpa Kategori"}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{pm.namaProduk}</h1>
            <p className="text-indigo-200 mt-2 text-sm sm:text-base flex items-center gap-2">
              <Package size={16} /> SKU: {pm.sku} {pm.barcode && `• Barcode: ${pm.barcode}`}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center min-w-[140px]">
            <p className="text-indigo-100 text-xs font-medium uppercase tracking-wider mb-1">Total Stok</p>
            <p className="text-3xl font-bold">{product.stok} <span className="text-lg font-normal text-indigo-200">{pm.satuanTertinggi || "Pcs"}</span></p>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Info Cards */}
        <div className="lg:col-span-1 space-y-6">
          {/* Detailed Info Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Activity size={20} className="text-indigo-500" /> Informasi Produk
            </h3>
            <div className="space-y-4">
              <InfoRow label="Cabang" value={product.cabang?.namaCabang || "-"} icon={MapPin} />
              <InfoRow label="Harga Beli" value={currencyFormatter(product.hargaBeli)} highlight />
              <InfoRow label="Harga Jual" value={currencyFormatter(product.hargaJual)} highlight />
              {product.hargaGrosir && <InfoRow label="Harga Grosir" value={currencyFormatter(product.hargaGrosir)} />}
              <div className="pt-3 mt-3 border-t border-gray-100 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Stok Minimum</p>
                  <p className="font-semibold text-gray-800">{product.minStok || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Stok Maksimum</p>
                  <p className="font-semibold text-gray-800">{product.maxStok || "-"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-sm border border-blue-100">
             <div className="flex gap-4">
                <div className="bg-blue-100 p-3 rounded-full h-12 w-12 flex items-center justify-center shrink-0">
                  <BarChart2 className="text-blue-600" size={24} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Nilai Persediaan</h4>
                  <p className="text-2xl font-bold text-blue-700 mt-1">
                    {currencyFormatter((product.stok || 0) * (product.hargaBeli || 0))}
                  </p>
                  <p className="text-xs text-blue-600/70 mt-1">Estimasi aset berdasarkan harga beli</p>
                </div>
             </div>
          </div>
        </div>

        {/* Right Col: Tabs for History */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          <div className="flex border-b border-gray-100 px-4 pt-2">
            <TabButton 
              active={activeTab === "movements"} 
              onClick={() => setActiveTab("movements")} 
              icon={History} 
              label="Pergerakan Stok" 
            />
            <TabButton 
              active={activeTab === "prices"} 
              onClick={() => setActiveTab("prices")} 
              icon={DollarSign} 
              label="Riwayat Harga" 
            />
          </div>

          <div className="p-0 sm:p-4 flex-1">
            {activeTab === "movements" && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50/50 text-gray-500">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium rounded-tl-xl whitespace-nowrap">Tanggal</th>
                        <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Tipe</th>
                        <th className="px-4 py-3 text-right font-medium whitespace-nowrap">Jumlah</th>
                        <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Keterangan</th>
                        <th className="px-4 py-3 text-left font-medium rounded-tr-xl">Oleh</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {isMoveLoading ? (
                        <tr><td colSpan={5} className="py-10 text-center"><Spinner size="small" /></td></tr>
                      ) : movements.length === 0 ? (
                        <tr><td colSpan={5} className="py-10 text-center text-gray-400">Belum ada riwayat pergerakan</td></tr>
                      ) : (
                        movements.map((m, i) => (
                          <tr key={m.id || i} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-4 text-gray-600 whitespace-nowrap">{formatDate(m.createdAt)}</td>
                            <td className="px-4 py-4">
                              <span className={`px-2 py-1 text-xs rounded-md ${
                                m.tipe === "IN" ? "bg-green-100 text-green-700" : 
                                m.tipe === "OUT" ? "bg-red-100 text-red-700" : 
                                "bg-blue-100 text-blue-700"
                              }`}>
                                {m.tipe}
                              </span>
                            </td>
                            <td className={`px-4 py-4 text-right font-semibold whitespace-nowrap ${
                              m.tipe === "IN" ? "text-green-600" : 
                              m.tipe === "OUT" ? "text-red-500" : 
                              "text-blue-600"
                            }`}>
                              {m.tipe === "IN" ? "+" : m.tipe === "OUT" ? "-" : ""}{m.jumlah}
                            </td>
                            <td className="px-4 py-4 text-gray-700 min-w-[150px]">{m.keterangan || "-"}</td>
                            <td className="px-4 py-4 text-gray-500 whitespace-nowrap">{m.User?.nama?.split(" ")[0] || "-"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {movePagination.totalPages > 1 && (
                  <div className="p-4 border-t border-gray-100">
                    <Pagination 
                      currentPage={movementPage} 
                      totalPages={movePagination.totalPages} 
                      onPageChange={setMovementPage} 
                    />
                  </div>
                )}
              </div>
            )}

            {activeTab === "prices" && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50/50 text-gray-500">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium rounded-tl-xl whitespace-nowrap">Tanggal</th>
                        <th className="px-4 py-3 text-right font-medium whitespace-nowrap">Harga Lama</th>
                        <th className="px-4 py-3 text-right font-medium whitespace-nowrap">Harga Baru</th>
                        <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Alasan</th>
                        <th className="px-4 py-3 text-left font-medium rounded-tr-xl">Oleh</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {isPriceLoading ? (
                        <tr><td colSpan={5} className="py-10 text-center"><Spinner size="small" /></td></tr>
                      ) : prices.length === 0 ? (
                        <tr><td colSpan={5} className="py-10 text-center text-gray-400">Belum ada riwayat perubahan harga</td></tr>
                      ) : (
                        prices.map((p, i) => (
                          <tr key={p.id || i} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-4 text-gray-600 whitespace-nowrap">{formatDate(p.createdAt)}</td>
                            <td className="px-4 py-4 text-right text-gray-500 line-through whitespace-nowrap">{currencyFormatter(p.hargaLama)}</td>
                            <td className="px-4 py-4 text-right font-semibold text-gray-900 whitespace-nowrap">{currencyFormatter(p.hargaBaru)}</td>
                            <td className="px-4 py-4 text-gray-700 min-w-[150px]">{p.alasanPerubahan || "Update rutin"}</td>
                            <td className="px-4 py-4 text-gray-500 whitespace-nowrap">{p.User?.nama?.split(" ")[0] || "-"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {pricePagination.totalPages > 1 && (
                  <div className="p-4 border-t border-gray-100">
                    <Pagination 
                      currentPage={pricePage} 
                      totalPages={pricePagination.totalPages} 
                      onPageChange={setPricePage} 
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const InfoRow = ({ label, value, icon: Icon, highlight }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 border-dashed">
    <div className="flex items-center gap-2 text-sm text-gray-500">
      {Icon && <Icon size={16} className="text-gray-400" />} {label}
    </div>
    <div className={`font-medium ${highlight ? "text-indigo-700 font-bold" : "text-gray-900"}`}>
      {value}
    </div>
  </div>
);

const TabButton = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
      active 
        ? "border-indigo-600 text-indigo-600 bg-indigo-50/30" 
        : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50/50"
    }`}
  >
    <Icon size={16} /> {label}
  </button>
);

export default InventoryProductDetailPage;
