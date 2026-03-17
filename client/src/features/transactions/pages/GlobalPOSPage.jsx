import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  ShoppingCart,
  Users,
  Search,
  Plus,
  Minus,
  Trash2,
  X,
  CreditCard,
  DollarSign,
  Calendar,
  ChevronDown,
  Tag,
  Percent,
  FileText,
  Store,
  Clock,
  LayoutGrid,
  Keyboard,
  Info,
  Star,
  Package,
  Printer,
  Maximize,
  Minimize,
  MapPin,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../features/auth/hooks/useAuth.js";
import { useCabang, GLOBAL_CABANG_ID } from "@features/cabang/hooks/useCabang";
import toast, { Toaster } from "react-hot-toast";
import {
  useProductsByBranch,
  useCustomerSearch,
  useCompleteTransaction,
  useQrisTransaction,
  useCategories,
  useProductsByCategory,
  usePopularProducts,
  useProductSearch,
  useSearchHistory,
} from "../hooks/usePosQueries";
import useKeyboardShortcuts from "@common/hooks/useKeyboardShortcuts";
import useFrequentProducts from "../../products/hooks/useFrequentProducts"
import useModalManager from "@common/hooks/useModalManager";
import useKeyboardManager from "@common/hooks/useKeyboardManager";

// Utility function to format currency
const formatCurrency = (amount) => {
  const numAmount = parseFloat(amount) || 0;
  return `Rp${numAmount.toLocaleString("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

// Color mapping for categories with more vibrant colors
const categoryColors = [
  "bg-gradient-to-r from-blue-500 to-blue-600 text-white", // Kategori 1
  "bg-gradient-to-r from-green-500 to-green-600 text-white", // Kategori 2
  "bg-gradient-to-r from-purple-500 to-purple-600 text-white", // Kategori 3
  "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white", // Kategori 4
  "bg-gradient-to-r from-red-500 to-red-600 text-white", // Kategori 5
  "bg-gradient-to-r from-pink-500 to-pink-600 text-white", // Kategori 6
  "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white", // Kategori 7
  "bg-gradient-to-r from-teal-500 to-teal-600 text-white", // Kategori 8
  "bg-gradient-to-r from-orange-500 to-orange-600 text-white", // Kategori 9
];

// UI Components for POS
const ProductsSection = ({
  products,
  addToCart,
  loading,
  categories,
  categoryColors,
  isFrequentProductsView = false,
}) => {
  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 min-h-[500px]">
      {loading ? (
        <div className="flex flex-col items-center justify-center h-80">
          <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-500 font-medium">Memuat katalog produk...</p>
        </div>
      ) : products?.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-80 text-gray-400">
          {isFrequentProductsView ? (
            <>
              <Star size={48} className="mb-4 opacity-20" />
              <p className="text-lg font-semibold">Belum ada favorit</p>
              <p className="text-sm mt-1 text-center max-w-xs">
                Produk yang sering Anda transaksikan akan muncul secara otomatis di sini.
              </p>
            </>
          ) : (
            <>
              <Package size={48} className="mb-4 opacity-20" />
              <p className="text-lg font-semibold">Produk tidak ditemukan</p>
              <p className="text-sm mt-1">Coba gunakan kata kunci lain atau pilih kategori</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {products.map((product) => {
            const categoryId = product.produkMaster?.kategori?.id;
            const categoryColor = categoryId
              ? categoryColors[categoryId % categoryColors.length]
              : "bg-gray-500";
            const productImage = product.produkMaster?.produkImage?.[0]?.url;

            return (
              <div
                key={product.id}
                className="group bg-white rounded-xl border border-gray-100 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 cursor-pointer flex flex-col h-full overflow-hidden relative"
                onClick={() => addToCart(product)}
              >
                {/* Product Image / Icon */}
                <div className="h-32 bg-gray-50 flex items-center justify-center relative overflow-hidden group-hover:bg-indigo-50/30 transition-colors">
                  {productImage ? (
                    <img
                      src={productImage}
                      alt={product.produkMaster.namaProduk}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="p-4 flex items-center justify-center text-gray-300 group-hover:text-indigo-200 transition-colors">
                      <Package size={40} strokeWidth={1.5} />
                    </div>
                  )}
                  
                  {/* Stock Badge */}
                  <div className="absolute top-2 right-2">
                    <span className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider backdrop-blur-sm ${
                      product.stok <= (product.minStok || 0) 
                        ? "bg-red-500/90 text-white" 
                        : "bg-white/90 text-gray-600 shadow-sm border border-gray-100"
                    }`}>
                      {product.stok <= (product.minStok || 0) ? "Low Stock" : `Stock: ${product.stok}`}
                    </span>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-3 flex flex-col flex-1">
                  <div className="mb-2">
                    {product.produkMaster?.kategori && (
                      <span className={`text-[9px] px-2 py-0.5 rounded uppercase font-bold text-white bg-indigo-500/80`}>
                        {product.produkMaster.kategori.namaKategori}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-sm font-bold text-gray-800 line-clamp-2 leading-tight flex-1 mb-2">
                    {product.produkMaster?.namaProduk || "Unnamed Product"}
                  </h3>
                  
                  <div className="mt-auto">
                    <div className="text-sm font-black text-indigo-600 bg-indigo-50 inline-block px-2 py-1 rounded-lg">
                      {formatCurrency(product.hargaJual)}
                    </div>
                  </div>
                </div>
                
                {/* Hover Add Overlay */}
                <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                   <div className="bg-white p-2 rounded-full shadow-lg transform scale-50 group-hover:scale-100 transition-transform">
                     <Plus className="text-indigo-600" size={20} />
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const CategoriesSection = ({
  categories,
  selectedCategory,
  setSelectedCategory,
  categoryColors,
  showFrequentProducts,
  fetchFrequentProducts,
}) => {
  return (
    <div className="bg-gray-50/50 border-b border-gray-100 px-4 py-3 flex items-center gap-3 overflow-x-auto no-scrollbar">
      <button
        onClick={() => setSelectedCategory(null)}
        className={`flex-shrink-0 px-5 py-2 rounded-xl text-sm font-bold transition-all ${
          selectedCategory === null && !showFrequentProducts
            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105"
            : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm"
        }`}
      >
        Semua Produk
      </button>

      <button
        onClick={fetchFrequentProducts}
        className={`flex-shrink-0 px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
          showFrequentProducts
            ? "bg-amber-500 text-white shadow-lg shadow-amber-200 scale-105"
            : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm"
        }`}
      >
        <Star size={16} fill={showFrequentProducts ? "white" : "transparent"} strokeWidth={2.5} />
        Favorit
      </button>

      <div className="w-px h-6 bg-gray-200 mx-1" />

      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => setSelectedCategory(category.id)}
          className={`flex-shrink-0 px-5 py-2 rounded-xl text-sm font-bold transition-all ${
            selectedCategory === category.id
              ? "bg-white text-indigo-700 border-2 border-indigo-600 shadow-sm scale-105"
              : "bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 shadow-sm"
          }`}
        >
          {category.namaKategori}
        </button>
      ))}
    </div>
  );
};

const SearchBar = ({
  productSearch,
  setProductSearch,
  searchHistory,
  searchResults,
  showAutocomplete,
  setShowAutocomplete,
  showSearchHistory,
  setShowSearchHistory,
  addToCart,
  isLoading,
  clearHistory,
  inputRef,
}) => {
  return (
    <div className="px-6 py-5 bg-white border-b border-gray-100">
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-t-indigo-500 rounded-full animate-spin"></div>
          ) : (
            <Search size={22} strokeWidth={2.5} />
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder="Cari produk dengan nama, SKU, atau Barcode... [F2]"
          className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-400 transition-all text-lg font-medium"
          value={productSearch}
          onChange={(e) => {
            setProductSearch(e.target.value);
            if (e.target.value) {
              setShowAutocomplete(true);
              setShowSearchHistory(false);
            } else {
              setShowAutocomplete(false);
            }
          }}
          onFocus={() => {
            if (!productSearch) {
              setShowSearchHistory(true);
            } else if (productSearch.length > 1) {
              setShowAutocomplete(true);
            }
          }}
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
           <kbd className="hidden sm:inline-block px-2 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-black text-gray-400 shadow-sm">
             F2
           </kbd>
        </div>
      </div>

      {/* Autocomplete Dropdown */}
      {(showSearchHistory || showAutocomplete) && (
        <div className="absolute z-50 top-full left-6 right-6 mt-2 bg-white rounded-2xl shadow-2xl shadow-indigo-900/10 border border-gray-100 max-h-[450px] overflow-hidden flex flex-col">
          {showSearchHistory && searchHistory.length > 0 && (
            <div className="p-4 border-b border-gray-50 bg-gray-50/50">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">
                  Riwayat Pencarian
                </h3>
                <button
                  className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors"
                  onClick={() => clearHistory()}
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {searchHistory.map((item, index) => (
                  <button
                    key={index}
                    className="flex items-center px-3 py-1.5 bg-white border border-gray-200 rounded-full hover:border-indigo-400 hover:text-indigo-600 transition-all text-sm font-medium text-gray-700 shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setProductSearch(item);
                      setShowSearchHistory(false);
                      setShowAutocomplete(true);
                    }}
                  >
                    <Clock size={14} className="mr-1.5 opacity-50" />
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showAutocomplete && searchResults && searchResults.length > 0 && (
            <div className="flex-1 overflow-y-auto p-2">
              <div className="px-3 py-2 text-xs font-black uppercase tracking-widest text-gray-400 mb-1">
                Hasil Pencarian
              </div>
              <div className="space-y-1">
                {searchResults.map((product) => (
                  <button
                    key={product.id}
                    className="w-full flex items-center px-3 py-3 hover:bg-indigo-50 rounded-xl transition-all group text-left"
                    onClick={() => {
                      addToCart(product);
                      setShowAutocomplete(false);
                      setProductSearch("");
                    }}
                  >
                    <div className="w-12 h-12 rounded-xl bg-gray-100 mr-4 overflow-hidden shadow-inner flex-shrink-0">
                      {product.produkMaster?.produkImage?.[0]?.url ? (
                        <img
                          src={product.produkMaster.produkImage[0].url}
                          alt={product.produkMaster.namaProduk}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Package size={24} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate group-hover:text-indigo-700 transition-colors">
                        {product.produkMaster?.namaProduk}
                      </p>
                      <div className="flex items-center gap-3">
                         <p className="text-sm font-black text-indigo-600">
                           {formatCurrency(product.hargaJual)}
                         </p>
                         <span className="w-1 h-1 bg-gray-300 rounded-full" />
                         <p className="text-xs font-medium text-gray-400">
                           Stock: {product.stok}
                         </p>
                      </div>
                    </div>
                    <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                       <Plus size={20} className="text-indigo-600" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {showAutocomplete &&
            (!searchResults || searchResults.length === 0) &&
            productSearch && (
              <div className="p-10 text-center text-gray-400">
                <Search size={40} className="mx-auto mb-3 opacity-20" />
                <p className="font-bold">Produk tidak ditemukan</p>
              </div>
            )}
        </div>
      )}
    </div>
  );
};

// Modifikasi KeyboardShortcutsHelp component untuk menampilkan info lebih lengkap
const KeyboardShortcutsHelp = ({ show, setShow }) => {
  if (!show) return null;

  const shortcutGroups = [
    {
      title: "Navigation",
      shortcuts: [
        { key: "F1", description: "Bantuan Keyboard Shortcuts" },
        { key: "F2", description: "Fokus ke Pencarian Produk" },
        { key: "F3", description: "Tampilkan Kategori" },
        { key: "1-9", description: "Pilih Kategori 1-9" },
        { key: "Esc", description: "Tutup Modal / Bersihkan Pencarian" },
      ],
    },
    {
      title: "Cart & Products",
      shortcuts: [
        { key: "Ctrl+P", description: "Pembayaran Tunai" },
        { key: "Ctrl+Q", description: "Pembayaran QRIS" },
        { key: "Ctrl+M", description: "Toggle Mode Retail/Grosir" },
        { key: "Ctrl+C", description: "Pilih Pelanggan" },
        { key: "Ctrl+B", description: "Pilih Cabang" },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Keyboard className="mr-2" size={20} /> Keyboard Shortcuts
          </h2>
          <button
            onClick={() => setShow(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          {shortcutGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="mb-6 last:mb-0">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center"
                  >
                    <span className="text-gray-700">
                      {shortcut.description}
                    </span>
                    <kbd className="px-3 py-1.5 bg-gray-100 border border-gray-300 rounded text-sm font-mono">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-gray-200 bg-gray-50 text-center text-sm text-gray-500">
          Tekan{" "}
          <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">
            F1
          </kbd>{" "}
          kapan saja untuk menampilkan bantuan ini atau{" "}
          <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">
            Esc
          </kbd>{" "}
          untuk menutup modal.
        </div>
      </div>
    </div>
  );
};

const CartSection = ({
  cart,
  updateQuantity,
  removeFromCart,
  saleMode,
  handleModeChange,
  customer,
  setShowCustomerSearch,
  totalAmount,
  tax,
  discount,
  setDiscount,
  discountType,
  setDiscountType,
  processPayment,
  handleQrisPayment,
}) => {
  const subtotal = cart.reduce((sum, item) => {
    const price = saleMode === "wholesale" ? item.wholesale_price : item.retail_price;
    return sum + price * item.quantity;
  }, 0);

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-100 shadow-xl">
      {/* Cart header */}
      <div className="p-5 border-b border-gray-100 bg-gray-50/50">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
            <ShoppingCart className="text-indigo-600" size={22} strokeWidth={2.5} />
            Keranjang
          </h2>
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
                saleMode === "retail"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
              onClick={() => handleModeChange("retail")}
            >
              RETAIL
            </button>
            <button
              className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
                saleMode === "wholesale"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
              onClick={() => handleModeChange("wholesale")}
            >
              GROSIR
            </button>
          </div>
        </div>

        {/* Customer selection */}
        <button
          className="w-full p-3 bg-white border border-gray-200 rounded-xl flex items-center justify-between group hover:border-indigo-400 hover:bg-indigo-50/30 transition-all shadow-sm"
          onClick={() => setShowCustomerSearch(true)}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Users size={18} />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pelanggan</p>
              <p className="font-bold text-gray-800 truncate max-w-[150px]">
                {customer ? customer.name || customer.namaPelanggan : "Umum (Non-Member)"}
              </p>
            </div>
          </div>
          <ChevronDown size={18} className="text-gray-300 group-hover:text-indigo-400" />
        </button>
      </div>

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 no-scrollbar">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-300 py-10">
            <div className="p-6 bg-gray-50 rounded-full mb-4">
               <ShoppingCart size={40} className="opacity-20" />
            </div>
            <p className="font-bold text-gray-400 uppercase tracking-wider text-sm">Keranjang Kosong</p>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.id} className="group bg-white rounded-xl p-3 border border-gray-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-800 text-sm leading-tight mb-1 truncate">
                    {item.name}
                  </h3>
                  <p className="text-xs font-black text-indigo-500">
                    {formatCurrency(saleMode === "wholesale" ? item.wholesale_price : item.retail_price)}
                  </p>
                </div>
                <button
                  className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  onClick={() => removeFromCart(item.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-50">
                <div className="flex items-center bg-gray-50 rounded-lg p-0.5 border border-gray-100">
                  <button
                    className="p-1 rounded-md text-gray-500 hover:bg-white hover:text-indigo-600 transition-all disabled:opacity-30"
                    onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                    disabled={item.quantity <= 1}
                  >
                    <Minus size={14} strokeWidth={3} />
                  </button>
                  <span className="w-8 text-center text-sm font-black text-gray-800">
                    {item.quantity}
                  </span>
                  <button
                    className="p-1 rounded-md text-gray-500 hover:bg-white hover:text-indigo-600 transition-all"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <Plus size={14} strokeWidth={3} />
                  </button>
                </div>
                <p className="font-black text-gray-900 text-sm">
                  {formatCurrency((saleMode === "wholesale" ? item.wholesale_price : item.retail_price) * item.quantity)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart summary */}
      <div className="p-6 bg-gray-50 border-t border-gray-100">
        <div className="space-y-3 mb-6">
          {/* Discount Section */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Tag size={14} />
              </div>
              <input
                type="number"
                placeholder="Diskon"
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none"
                value={discount || ""}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
              />
            </div>
            <select
              className="bg-white border border-gray-200 rounded-lg py-2 px-2 text-xs font-black text-gray-600 focus:ring-2 focus:ring-indigo-500/10 outline-none"
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value)}
            >
              <option value="percentage">%</option>
              <option value="fixed">IDR</option>
            </select>
          </div>

          <div className="space-y-1 text-sm font-medium">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span className="text-gray-800 font-bold">{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-red-500">
                <span>Diskon</span>
                <span className="font-bold">
                  -{formatCurrency(discountType === "percentage" ? subtotal * (discount / 100) : discount)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-gray-500">
              <span>Pajak (10%)</span>
              <span className="text-gray-800 font-bold">{formatCurrency(tax)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-end mb-6">
           <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Bayar</span>
           <span className="text-3xl font-black text-indigo-700 tracking-tight">
             {formatCurrency(totalAmount)}
           </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            className="group py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm flex items-center justify-center transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 active:scale-95"
            onClick={processPayment}
            disabled={cart.length === 0}
          >
            <DollarSign className="mr-2 group-hover:scale-110 transition-transform" size={20} strokeWidth={2.5} />
            TUNAI
          </button>

          <button
            className="group py-4 bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 rounded-2xl font-black text-sm flex items-center justify-center transition-all disabled:opacity-50 active:scale-95"
            onClick={handleQrisPayment}
            disabled={cart.length === 0}
          >
            <CreditCard className="mr-2 group-hover:scale-110 transition-transform" size={20} strokeWidth={2.5} />
            QRIS
          </button>
        </div>
      </div>
    </div>
  );
};

// Receipt component untuk struk
const ReceiptModal = ({ show, onClose, data, onPrint }) => {
  if (!show || !data) return null;

  const { user } = useAuth();
  const { transaction, payment, items, customer, branch } = data;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 text-green-600 rounded-xl">
              <FileText size={22} strokeWidth={2.5} />
            </div>
            <h2 className="text-lg font-black text-gray-800">Struk Pembayaran</h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-800 transition-colors">
            <X size={24} strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
          {/* Virtual Receipt Paper */}
          <div id="receipt-content" className="bg-white p-6 shadow-[0_0_40px_rgba(0,0,0,0.05)] border border-gray-100 rounded-lg mx-auto max-w-[320px] text-gray-800 font-mono text-[13px]">
            {/* Header */}
            <div className="text-center mb-6 space-y-1">
              <h3 className="font-black text-lg uppercase tracking-wider">{branch?.namaCabang || "CASIR Online"}</h3>
              {branch?.alamat && <p className="leading-tight">{branch.alamat}</p>}
              {branch?.telepon && <p>Telp: {branch.telepon}</p>}
            </div>

            <div className="border-t border-dashed border-gray-300 py-3 space-y-1">
              <div className="flex justify-between">
                <span>TRX ID:</span>
                <span className="font-bold">{transaction?.id?.slice(-8).toUpperCase() || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span>WAKTU:</span>
                <span>{formatDate(transaction?.tanggal || new Date())}</span>
              </div>
              <div className="flex justify-between">
                <span>KASIR:</span>
                <span className="uppercase">{user?.name?.split(' ')[0] || "ADMIN"}</span>
              </div>
              <div className="flex justify-between">
                <span>MEMBER:</span>
                <span className="uppercase truncate max-w-[120px]">{customer?.name || customer?.namaPelanggan || "UMUM"}</span>
              </div>
            </div>

            {/* Items */}
            <div className="border-t border-dashed border-gray-300 py-3 space-y-3">
              {items?.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between mb-0.5 font-bold">
                    <span className="uppercase">{item.name}</span>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] opacity-70">
                    <span>{formatCurrency(item.price)} x {item.quantity}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t-2 border-dashed border-gray-800 py-3 space-y-1.5">
              <div className="flex justify-between">
                <span>SUBTOTAL:</span>
                <span>{formatCurrency(transaction?.subtotal || 0)}</span>
              </div>
              {transaction?.discount_amount > 0 && (
                <div className="flex justify-between text-indigo-600">
                  <span>DISKON:</span>
                  <span>-{formatCurrency(transaction?.discount_amount || 0)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>PAJAK (10%):</span>
                <span>{formatCurrency(transaction?.tax_amount || 0)}</span>
              </div>
              <div className="flex justify-between text-lg font-black pt-2 border-t border-gray-200">
                <span>TOTAL:</span>
                <span>{formatCurrency(transaction?.total_amount || 0)}</span>
              </div>
            </div>

            {/* Payments */}
            <div className="border-t border-dashed border-gray-300 py-3 space-y-1">
              <div className="flex justify-between">
                <span>METODE:</span>
                <span className="font-bold uppercase">{payment?.metode_pembayaran || "TUNAI"}</span>
              </div>
              <div className="flex justify-between">
                <span>BAYAR:</span>
                <span>{formatCurrency(payment?.jumlah_bayar || 0)}</span>
              </div>
              {payment?.jumlah_kembali > 0 && (
                <div className="flex justify-between">
                  <span>KEMBALI:</span>
                  <span className="font-bold">{formatCurrency(payment?.jumlah_kembali || 0)}</span>
                </div>
              )}
            </div>

            <div className="text-center mt-8 pt-4 border-t border-dashed border-gray-300">
              <p className="font-bold mb-1 uppercase tracking-widest text-[11px]">Terima Kasih</p>
              <p className="text-[10px] opacity-50 italic">Powered by CASIR Online</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-4">
          <button
            onClick={onPrint}
            className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-lg shadow-indigo-200 transition-all active:scale-95"
          >
            <Printer size={20} />
            CETAK STRUK
          </button>
          <button
            onClick={onClose}
            className="px-6 py-4 bg-white border border-gray-200 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition-all active:scale-95"
          >
            SELESAI
          </button>
        </div>
      </div>
    </div>
  );
};

const GlobalPOS = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cabangList, selectedCabang, setSelectedCabangById } = useCabang();
  const searchInputRef = useRef(null);
  const posContainerRef = useRef(null); // Ref untuk container fullscreen

  // State untuk fullscreen mode
  const [isFullscreen, setIsFullscreen] = useState(false);

  // State for branch selection
  const [showBranchSelector, setShowBranchSelector] = useState(false);
  const [branchSearchQuery, setBranchSearchQuery] = useState("");
  const [filteredBranches, setFilteredBranches] = useState([]);
  const [currentBranch, setCurrentBranch] = useState(null);

  // State for category
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showCategoryList, setShowCategoryList] = useState(false);

  // State for sale mode
  const [saleMode, setSaleMode] = useState("retail"); // "retail" or "wholesale"

  // State for customer
  const [customer, setCustomer] = useState(null);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");

  // State for autocomplete
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [showSearchHistory, setShowSearchHistory] = useState(false);

  // State for cart
  const [cart, setCart] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [tax, setTax] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState("percentage"); // "percentage" or "fixed"
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  // State untuk menyimpan transaksi terakhir
  const [lastTransactionId, setLastTransactionId] = useState(null);
  const [lastTransactionData, setLastTransactionData] = useState(null);
  // State untuk receipt/struk
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  // State for shortcuts help
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  // State for products
  const [productSearch, setProductSearch] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);

  // Hook untuk search history
  const { searchHistory, addToHistory, clearHistory } = useSearchHistory(
    currentBranch?.id
  );

  // React Query hooks for products and categories
  const {
    data: productsData,
    isLoading: isLoadingProducts,
    isError: isProductsError,
    error: productsError,
  } = useProductsByBranch(currentBranch?.id, {
    enabled: !!currentBranch?.id && !selectedCategory,
  });



  const { data: categoriesData, isLoading: isLoadingCategories } =
    useCategories();

  const { data: categoryProductsData, isLoading: isLoadingCategoryProducts } =
    useProductsByCategory(currentBranch?.id, selectedCategory, {
      enabled: !!currentBranch?.id && !!selectedCategory,
    });



  const { data: popularProductsData, isLoading: isLoadingPopularProducts } =
    usePopularProducts(currentBranch?.id, 10, {
      enabled: !!currentBranch?.id && !selectedCategory && !productSearch,
    });

  const { data: searchResultsData, isLoading: isLoadingSearchResults } =
    useProductSearch(currentBranch?.id, productSearch, {
      enabled: !!currentBranch?.id && productSearch.length > 1,
    });

  const { data: customerSearchResults, isLoading: isLoadingCustomers } =
    useCustomerSearch(customerSearchQuery, currentBranch?.id, {
      enabled: customerSearchQuery.length > 2,
    });

  const { completeTransaction, isLoading: isProcessingTransaction } =
    useCompleteTransaction();

  const { createQrisTransaction, isLoading: isProcessingQris } =
    useQrisTransaction();

  // Derived data
  const categories = categoriesData || [];
  const searchResults = customerSearchResults || [];

  // Memoize the callback for useFrequentProducts to prevent recreation on every render
  const handleFrequentProductsToggle = useCallback((isActive) => {
    // Only update state when turning off frequent products view
    if (!isActive) {
      // Use functional update to avoid closure issues
      setSelectedCategory(() => null);
    }
  }, []); // Empty dependency array since this function only depends on its arguments

  // Get the current branch ID in a safe way
  const currentBranchId = useMemo(
    () => currentBranch?.id || null,
    [currentBranch]
  );

  // Replace the frequent products state and handler with our hook
  const {
    frequentProducts,
    isLoading: isLoadingFrequentProducts,
    isActive: showFrequentProducts,
    toggleFrequentProducts,
  } = useFrequentProducts(currentBranchId, handleFrequentProductsToggle);

  // Inisialisasi modal manager
  const modalManager = useModalManager({
    showBranchSelector,
    setShowBranchSelector,
    showCustomerSearch,
    setShowCustomerSearch,
    showPaymentModal,
    setShowPaymentModal,
    showReceiptModal,
    setShowReceiptModal,
    showShortcutsHelp,
    setShowShortcutsHelp,
    showAutocomplete,
    setShowAutocomplete,
    showSearchHistory,
    setShowSearchHistory,
  });

  // AFTER the hook calls, now determine which products to display
  let currentProducts;

  if (productSearch && productSearch.length > 1 && searchResultsData?.data) {
    // If there's an active search, show search results
    currentProducts = searchResultsData || [];
  } else if (selectedCategory) {
    // If a category is selected, show category products
    currentProducts = categoryProductsData || [];
  } else {
    // Otherwise show all products
    currentProducts = productsData?.data || [];
  }

  // Override current products when showing frequent products
  if (showFrequentProducts && frequentProducts.length > 0) {
    currentProducts = frequentProducts;
  }

  // Initialize component
  useEffect(() => {
    // Initialize branch data
    if (cabangList && cabangList.length > 0) {
      setFilteredBranches(cabangList);
      
      // If a branch is already selected in context, use it, but skip GLOBAL_CABANG_ID
      let branchToUse = selectedCabang;
      
      if (!branchToUse || branchToUse.id === GLOBAL_CABANG_ID) {
        // Fallback to first non-global branch
        branchToUse = cabangList.find(c => c.id !== GLOBAL_CABANG_ID) || cabangList[0];
      }

      // Important: Use the full branch object from cabangList to ensure metadata like name/address is present
      const fullBranchObject = cabangList.find(c => c.id === branchToUse.id) || branchToUse;
      
      setCurrentBranch(fullBranchObject);
      
      if (setSelectedCabangById && branchToUse.id !== selectedCabang?.id) {
        setSelectedCabangById(branchToUse.id);
      }
    }

    // Show branch selector for superadmin on initial load ONLY if no specific branch is selected
    if (user && user.role === "superadmin" && (!selectedCabang || selectedCabang.id === GLOBAL_CABANG_ID)) {
      setShowBranchSelector(true);
    }
  }, [cabangList, selectedCabang, user, setSelectedCabangById]);
  // Calculate totals when cart or sale mode changes
  useEffect(() => {
    calculateTotal();
  }, [cart, saleMode, discount, discountType]);

  // Filter branches based on search query
  useEffect(() => {
    if (cabangList && cabangList.length) {
      if (branchSearchQuery.trim() === "") {
        setFilteredBranches(cabangList);
      } else {
        const filtered = cabangList.filter(
          (branch) =>
            branch.namaCabang
              .toLowerCase()
              .includes(branchSearchQuery.toLowerCase()) ||
            (branch.alamat &&
              branch.alamat
                .toLowerCase()
                .includes(branchSearchQuery.toLowerCase()))
        );
        setFilteredBranches(filtered);
      }
    }
  }, [branchSearchQuery, cabangList]);

  // Search products based on query
  useEffect(() => {
    if (productSearch.trim() === "") {
      setFilteredProducts([]);
    } else {
      // Use productsData instead of undefined 'products' variable
      const allProducts = productsData?.data || [];
      const filtered = allProducts.filter(
        (product) =>
          (product.produkMaster?.namaProduk &&
            product.produkMaster.namaProduk
              .toLowerCase()
              .includes(productSearch.toLowerCase())) ||
          (product.produkMaster?.sku &&
            product.produkMaster.sku
              .toLowerCase()
              .includes(productSearch.toLowerCase())) ||
          (product.produkMaster?.barcode &&
            product.produkMaster.barcode
              .toLowerCase()
              .includes(productSearch.toLowerCase()))
      );
      setFilteredProducts(filtered);
    }
  }, [productSearch, productsData]);

  // Load branch-specific products
  const loadProductsForBranch = useCallback((branchId) => {
    if (!branchId) return;

    // We don't need to manually fetch here as React Query handles it.
    // However, if we need to sync local currentBranch with a specific ID:
    const branch = cabangList?.find(c => c.id === branchId);
    if (branch && currentBranch?.id !== branchId) {
      setCurrentBranch(branch);
    }
  }, [cabangList, currentBranch]);

  // Calculate total amount
  const calculateTotal = () => {
    if (cart.length === 0) {
      setTotalAmount(0);
      setTax(0);
      return;
    }

    const subtotal = cart.reduce((sum, item) => {
      // Use wholesale price if in wholesale mode, otherwise retail price
      const price =
        saleMode === "wholesale" ? item.wholesale_price : item.retail_price;
      return sum + price * item.quantity;
    }, 0);

    // Apply discount
    let discountAmount = 0;
    if (discountType === "percentage") {
      discountAmount = subtotal * (discount / 100);
    } else {
      discountAmount = discount;
    }

    // Calculate tax (assume 10% tax)
    const taxAmount = (subtotal - discountAmount) * 0.1;

    setTotalAmount(subtotal - discountAmount + taxAmount);
    setTax(taxAmount);
  };

  // Add product to cart
  const addToCart = (product) => {
    if (!currentBranch) {
      toast.error("Silakan pilih cabang terlebih dahulu", { icon: "⚠️" });
      setShowBranchSelector(true);
      return;
    }

    const existingItemIndex = cart.findIndex((item) => item.id === product.id);

    if (existingItemIndex !== -1) {
      // Update quantity if product already in cart
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      // Add new product to cart
      setCart([
        ...cart,
        {
          ...product,
          quantity: 1,
          name: product.produkMaster?.namaProduk || product.name || "Produk",
          retail_price: product.hargaJual || 0,
          wholesale_price: product.hargaGrosir || 0,
        },
      ]);
    }

    toast.success(
      `${
        product.produkMaster?.namaProduk || product.name || "Produk"
      } ditambahkan ke keranjang`
    );
  };

  // Remove product from cart
  const removeFromCart = (productId) => {
    const updatedCart = cart.filter((item) => item.id !== productId);
    setCart(updatedCart);
    toast.success("Item dihapus dari keranjang");
  };

  // Update product quantity in cart
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;

    const updatedCart = cart.map((item) => {
      if (item.id === productId) {
        return { ...item, quantity: newQuantity };
      }
      return item;
    });

    setCart(updatedCart);
  };

  // Search customers handled by React Query hook
  const searchCustomers = (query) => {
    // Pencarian pelanggan dihandle oleh useCustomerSearch hook
    setCustomerSearchQuery(query);
  };

  // Handle customer selection
  const selectCustomer = (customer) => {
    setCustomer(customer);
    setShowCustomerSearch(false);
    toast.success(
      `Pelanggan ${customer.namaPelanggan || customer.name} dipilih`
    );
  };

  // Handle branch selection
  const selectBranch = (branch) => {
    let targetBranch = branch;
    
    // Safety check: POS must use a specific branch, not "Global/All Branches"
    if (targetBranch.id === GLOBAL_CABANG_ID) {
      const firstBranch = cabangList.find(c => c.id !== GLOBAL_CABANG_ID);
      if (firstBranch) {
        targetBranch = firstBranch;
        toast.info("Otomatis menggunakan cabang pertama");
      }
    }

    setCurrentBranch(targetBranch);

    if (setSelectedCabangById) {
      setSelectedCabangById(targetBranch.id);
    }

    setShowBranchSelector(false);
    toast.success(`Cabang ${targetBranch.namaCabang || targetBranch.name} dipilih`);

    // Reset cart when branch changes
    setCart([]);
  };
  // Handle mode change
  const handleModeChange = (mode) => {
    setSaleMode(mode);

    // If switching to wholesale, prompt for customer if none selected
    if (mode === "wholesale" && !customer) {
      setShowCustomerSearch(true);
      toast.error("Untuk grosir, pelanggan harus dipilih", {
        icon: "⚠️",
      });
    }
  };

  // Handle payment
  const processPayment = () => {
    if (!currentBranch) {
      toast.error("Pilih cabang terlebih dahulu", {
        icon: "⚠️",
      });
      setShowBranchSelector(true);
      return;
    }

    if (saleMode === "wholesale" && !customer) {
      toast.error("Untuk grosir, pelanggan harus dipilih", {
        icon: "⚠️",
      });
      setShowCustomerSearch(true);
      return;
    }

    if (cart.length === 0) {
      toast.error("Keranjang belanja kosong", {
        icon: "⚠️",
      });
      return;
    }

    setShowPaymentModal(true);
    setPaymentAmount(totalAmount);
  };

  // Complete the sale using React Query
  const completeSale = async () => {
    if (paymentAmount < totalAmount) {
      toast.error("Pembayaran kurang dari total belanja", {
        icon: "⚠️",
      });
      return;
    }

    if (isProcessingTransaction) return;

    // Create payment data
    const paymentData = {
      metode_pembayaran: paymentMethod === "cash" ? "TUNAI" : "KARTU_DEBIT",
      jumlah_bayar: paymentAmount,
      jumlah_kembali: paymentAmount - totalAmount,
      tanggal_pembayaran: new Date().toISOString(),
      keterangan: `Pembayaran ${paymentMethod === "cash" ? "Tunai" : "Kartu"}`,
      generate_receipt: true,
    };

    try {
      let transactionData;

      // Gunakan transaksi yang sudah ada jika ada, atau buat baru jika belum ada
      if (lastTransactionId && lastTransactionData) {
        // Gunakan transaksi yang ada
        transactionData = lastTransactionData;
        transactionData.id = lastTransactionId;
      } else {
        // Buat transaksi baru
        transactionData = {
          cabang_id: currentBranch.id,
          jenis_transaksi: "PENJUALAN",
          tanggal: new Date().toISOString(),
          pelanggan_id: customer ? customer.id : null,
          details: cart.map((item) => ({
            produk_id: item.id,
            jumlah: item.quantity,
            harga_satuan:
              saleMode === "wholesale"
                ? item.wholesale_price
                : item.retail_price,
            diskon_persen: 0,
            pajak_persen: 10,
          })),
          biaya_tambahan: 0,
          keterangan: `${
            saleMode === "wholesale" ? "Penjualan Grosir" : "Penjualan Retail"
          }`,
        };

        // If customer is a guest (not registered), add customer info
        if (saleMode === "wholesale" && !customer?.id) {
          transactionData.customer_info = {
            nama: customer.name,
            telepon: customer.phone || "",
            alamat: customer.address || "",
          };
        }

        // Simpan data transaksi untuk digunakan kembali
        setLastTransactionData(transactionData);
      }

      // Used combined transaction/payment mutation from React Query
      const response = await completeTransaction(transactionData, paymentData);

      // Simpan ID transaksi jika berhasil dan belum disimpan sebelumnya
      if (response?.data?.id && !lastTransactionId) {
        setLastTransactionId(response.data.id);
      }

      // Cek jika response mengandung data receipt dalam format PDF bytes
      if (response?.data?.receipt?.receiptData?.pdf) {
        handlePdfReceipt(response.data.receipt);
        return;
      }

      // Persiapkan data struk
      const receiptItems = cart.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price:
          saleMode === "wholesale" ? item.wholesale_price : item.retail_price,
        unit: item.unit || "pcs",
      }));

      // Hitung subtotal dan jumlah diskon
      const subtotal = cart.reduce((sum, item) => {
        const price =
          saleMode === "wholesale" ? item.wholesale_price : item.retail_price;
        return sum + price * item.quantity;
      }, 0);

      const discountAmount =
        discountType === "percentage" ? subtotal * (discount / 100) : discount;

      // Buat data transaksi lengkap untuk struk
      const receiptData = {
        transaction: {
          id: response?.data?.id || "TRX" + new Date().getTime(),
          tanggal: new Date().toISOString(),
          subtotal: subtotal,
          discount_amount: discountAmount,
          discount_type: discountType,
          discount_value: discount,
          tax_amount: tax,
          total_amount: totalAmount,
        },
        payment: {
          metode_pembayaran: paymentMethod === "cash" ? "TUNAI" : "KARTU_DEBIT",
          jumlah_bayar: paymentAmount,
          jumlah_kembali: paymentAmount - totalAmount,
        },
        items: receiptItems,
        customer: customer || { name: "Umum" },
        branch: currentBranch,
      };

      // Simpan data struk dan tampilkan modal struk
      setReceiptData(receiptData);
      setShowReceiptModal(true);

      // Reset states
      setShowPaymentModal(false);

      // Kita tidak clear cart dan reset transaction data sampai modal receipt ditutup
      // Ini memungkinkan cetak ulang jika diperlukan
    } catch (error) {
      console.error("Transaction error:", error);
      toast.error("Pembayaran gagal, silakan coba lagi");
    }
  };

  // Fungsi untuk menangani receipt dalam format PDF
  const handlePdfReceipt = (receiptData) => {
    try {
      // Konversi byte array menjadi Uint8Array
      const pdfBytes = Object.values(receiptData.receiptData.pdf);
      const uint8Array = new Uint8Array(pdfBytes);

      // Buat Blob dari Uint8Array
      const blob = new Blob([uint8Array], { type: "application/pdf" });

      // Buat object URL dari Blob
      const pdfUrl = URL.createObjectURL(blob);

      // Reset states
      setShowPaymentModal(false);

      // Buka PDF di tab baru
      const newWindow = window.open(pdfUrl, "_blank");

      // Berikan nama file yang sesuai
      if (newWindow && "document" in newWindow) {
        newWindow.document.title = `Receipt-${
          receiptData.transactionNumber || "Transaction"
        }`;
      }

      // Bersihkan keranjang dan reset state setelah membuka PDF
      setCart([]);
      setCustomer(null);
      setDiscount(0);
      setLastTransactionId(null);
      setLastTransactionData(null);

      toast.success("Pembayaran berhasil! Receipt PDF dibuka di tab baru");

      // Tambahkan tombol download sebagai pop-up atau toast
      toast.success(
        (t) => (
          <div>
            <p>Klik untuk download receipt</p>
            <button
              onClick={() => {
                // Buat temporary link untuk download
                const a = document.createElement("a");
                a.href = pdfUrl;
                a.download = `Receipt-${
                  receiptData.transactionNumber || "Transaction"
                }.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                toast.dismiss(t.id);
              }}
              className="mt-2 px-3 py-1 bg-blue-600 text-white rounded-md text-sm"
            >
              Download PDF
            </button>
          </div>
        ),
        {
          duration: 10000,
          style: {
            minWidth: "250px",
          },
        }
      );
    } catch (error) {
      console.error("Error handling PDF receipt:", error);
      toast.error("Gagal menampilkan receipt PDF");

      // Fallback ke receipt normal jika gagal menampilkan PDF
      handleCloseReceipt();
    }
  };

  // Fungsi untuk menutup modal struk
  const handleCloseReceipt = () => {
    setShowReceiptModal(false);

    // Reset shopping state setelah struk ditutup
    setCart([]);
    setCustomer(null);
    setDiscount(0);
    setLastTransactionId(null);
    setLastTransactionData(null);
    setReceiptData(null);

    toast.success("Pembayaran berhasil!");
  };

  // Fungsi untuk mencetak struk
  const handlePrintReceipt = () => {
    const printContent = document.getElementById("receipt-content");
    
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak Struk</title>
          <style>
            @page {
              margin: 0;
              size: 80mm auto;
            }
            body {
              font-family: 'Courier New', Courier, monospace;
              margin: 0;
              padding: 5mm;
              width: 70mm; /* Account for 5mm padding on each side */
              color: #000;
              background: #fff;
            }
            #receipt-print-container {
              width: 100%;
            }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .font-black { font-weight: 900; }
            .uppercase { text-transform: uppercase; }
            .tracking-widest { letter-spacing: 0.1em; }
            .tracking-wider { letter-spacing: 0.05em; }
            .text-lg { font-size: 16px; }
            .text-3xl { font-size: 24px; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .items-end { align-items: flex-end; }
            .mb-6 { margin-bottom: 24px; }
            .mb-1 { margin-bottom: 4px; }
            .mb-0\\.5 { margin-bottom: 2px; }
            .mt-8 { margin-top: 32px; }
            .mt-3 { margin-top: 12px; }
            .pt-4 { padding-top: 16px; }
            .pt-2 { padding-top: 8px; }
            .pt-3 { padding-top: 12px; }
            .py-3 { padding-top: 12px; padding-bottom: 12px; }
            .space-y-1 > * + * { margin-top: 4px; }
            .space-y-1\\.5 > * + * { margin-top: 6px; }
            .space-y-3 > * + * { margin-top: 12px; }
            .border-t { border-top: 1px dashed #000; }
            .border-t-2 { border-top: 2px dashed #000; }
            .opacity-50 { opacity: 0.5; }
            .opacity-70 { opacity: 0.7; }
            .italic { font-style: italic; }
            .text-[11px] { font-size: 11px; }
            .text-[10px] { font-size: 10px; }
            .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .max-w-[120px] { max-width: 120px; }
            
            /* Remove some web-only styles that might break print */
            .shadow-lg, .shadow-\\[0_0_40px_rgba\\(0\\,0\\,0\\,0\\.05\\)\\], .border-gray-100, .rounded-lg {
              box-shadow: none !important;
              border: none !important;
              border-radius: 0 !important;
            }
          </style>
        </head>
        <body>
          <div id="receipt-print-container">
            ${printContent.innerHTML}
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  // Get current branch name for display
  const getCurrentBranchName = () => {
    if (currentBranch) {
      return currentBranch.namaCabang || currentBranch.name;
    } else {
      return "Pilih Cabang";
    }
  };

  useEffect(() => {
    // Keyboard shortcut for showing help F1
    const handleKeyDownHelp = (e) => {
      if (e.key === "F1") {
        e.preventDefault();
        setShowShortcutsHelp((prev) => !prev);
      } else if (e.key === "F2") {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      } else if (e.key === "Escape") {
        setShowShortcutsHelp(false);
        setShowAutocomplete(false);
        setShowSearchHistory(false);
      }
    };

    window.addEventListener("keydown", handleKeyDownHelp);
    return () => {
      window.removeEventListener("keydown", handleKeyDownHelp);
    };
  }, []);

  const handleSearch = (query) => {
    setProductSearch(query);
    if (query && query.length > 1) {
      addToHistory(query);
    }
  };

  // Handle QRIS payment
  const handleQrisPayment = async () => {
    if (!currentBranch) {
      toast.error("Pilih cabang terlebih dahulu", {
        icon: "⚠️",
      });
      setShowBranchSelector(true);
      return;
    }

    if (saleMode === "wholesale" && !customer) {
      toast.error("Untuk grosir, pelanggan harus dipilih", {
        icon: "⚠️",
      });
      setShowCustomerSearch(true);
      return;
    }

    if (cart.length === 0) {
      toast.error("Keranjang belanja kosong", {
        icon: "⚠️",
      });
      return;
    }

    if (isProcessingQris) return;

    try {
      let transactionData;

      // Gunakan transaksi yang sudah ada jika ada, atau buat baru jika belum ada
      if (lastTransactionId && lastTransactionData) {
        // Gunakan transaksi yang ada
        transactionData = lastTransactionData;
        transactionData.id = lastTransactionId;
      } else {
        // Buat transaksi baru
        transactionData = {
          cabang_id: currentBranch.id,
          jenis_transaksi: "PENJUALAN",
          tanggal: new Date().toISOString(),
          pelanggan_id: customer ? customer.id : null,
          details: cart.map((item) => ({
            produk_id: item.id,
            jumlah: item.quantity,
            harga_satuan:
              saleMode === "wholesale"
                ? item.wholesale_price
                : item.retail_price,
            diskon_persen: 0,
            pajak_persen: 10,
          })),
          biaya_tambahan: 0,
          keterangan: `${
            saleMode === "wholesale" ? "Penjualan Grosir" : "Penjualan Retail"
          } via QRIS`,
        };

        // Simpan data transaksi untuk digunakan kembali
        setLastTransactionData(transactionData);
      }

      // Call the QRIS transaction mutation
      const response = await createQrisTransaction(transactionData);

      // Cek jika response mengandung data receipt dalam format PDF bytes
      if (response?.data?.receipt?.receiptData?.pdf) {
        handlePdfReceipt(response.data.receipt);
        return;
      }

      // If successful, reset cart and show the QR code
      if (response?.data?.qr_content) {
        setShowQrisModal(true);
        setQrisContent(response.data.qr_content);
        setQrisTransactionId(response.data.transaction_id);
        // Reset will happen after successful callback
      }
    } catch (error) {
      console.error("QRIS Transaction error:", error);
      toast.error("Gagal membuat QRIS, coba lagi nanti");
    }
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      // Jika belum fullscreen, aktifkan
      if (posContainerRef.current.requestFullscreen) {
        posContainerRef.current.requestFullscreen();
      } else if (posContainerRef.current.webkitRequestFullscreen) {
        posContainerRef.current.webkitRequestFullscreen();
      } else if (posContainerRef.current.msRequestFullscreen) {
        posContainerRef.current.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      // Jika sudah fullscreen, nonaktifkan
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Deteksi perubahan fullscreen dari browser
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange
      );
    };
  }, []);

  // Inisialisasi keyboard manager setelah fungsi yang dibutuhkan tersedia
  const keyboardManager = useKeyboardManager({
    cart,
    isProcessingTransaction,
    searchInputRef,
    categories,
    isLoadingCategories,
    selectedCategory,
    setSelectedCategory,
    saleMode,
    handleModeChange,
    processPayment,
    handleQrisPayment,
    setProductSearch,
    setShowCategoryList,
    modalManager,
  });

  // Buat alias untuk fungsi modalManager agar mudah digunakan di komponen
  const { closeAllModals } = modalManager;

  // UI render
  return (
    <div
      ref={posContainerRef}
      className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-blue-50"
    >
      {/* Toast container */}
      <Toaster position="top-right" />

      {/* Header */}
      <header className="bg-white border-b border-gray-100 z-10 sticky top-0">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-8">
              <div
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => navigate("/dashboard")}
              >
                <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 rotate-3 group-hover:rotate-0 transition-transform">
                  <Store size={26} strokeWidth={2.5} />
                </div>
                <div>
                  <h1 className="text-xl font-black text-gray-800 tracking-tight">CASIR<span className="text-indigo-600">Online</span></h1>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] leading-none mt-1">Retail POS System</p>
                </div>
              </div>

              <div className="h-10 w-px bg-gray-100 hidden md:block" />

              <div className="relative group hidden md:block">
                <button
                  className="px-5 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-gray-700 font-bold text-sm flex items-center gap-3 hover:bg-white hover:border-indigo-200 transition-all shadow-sm"
                  onClick={() => modalManager.openModal("branchSelector")}
                >
                  <MapPin size={18} className="text-indigo-500" />
                  <span>{getCurrentBranchName()}</span>
                  <ChevronDown size={14} className="text-gray-400 group-hover:text-indigo-500" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden lg:flex flex-col items-end mr-4">
                 <p className="text-sm font-black text-gray-800">{user?.name || "Cashier User"}</p>
                 <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{user?.role || "Operator"}</p>
              </div>

              <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                <button
                  className="p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-white rounded-lg transition-all shadow-none hover:shadow-sm"
                  onClick={toggleFullscreen}
                  title="Fullscreen [F11]"
                >
                  {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                </button>
                <button
                  className="p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-white rounded-lg transition-all shadow-none hover:shadow-sm"
                  onClick={() => modalManager.openModal("shortcutsHelp")}
                  title="Keyboard Shortcuts [F1]"
                >
                  <Keyboard size={20} />
                </button>
                <button
                  className="p-2.5 text-gray-500 hover:text-red-600 hover:bg-white rounded-lg transition-all shadow-none hover:shadow-sm"
                  onClick={() => navigate("/dashboard")}
                  title="Close POS"
                >
                  <X size={20} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left section - Product display */}
        <div className="w-2/3 flex flex-col overflow-hidden">
          {/* Search bar */}
          <SearchBar
            productSearch={productSearch}
            setProductSearch={handleSearch}
            searchHistory={searchHistory || []}
            searchResults={searchResultsData || []}
            showAutocomplete={showAutocomplete}
            setShowAutocomplete={setShowAutocomplete}
            showSearchHistory={showSearchHistory}
            setShowSearchHistory={setShowSearchHistory}
            addToCart={addToCart}
            isLoading={isLoadingSearchResults}
            clearHistory={clearHistory}
            inputRef={searchInputRef}
          />

          {/* Categories */}
          <CategoriesSection
            categories={categories || []}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            categoryColors={categoryColors}
            showFrequentProducts={showFrequentProducts}
            fetchFrequentProducts={toggleFrequentProducts}
          />

          {/* Products grid */}
          <div className="flex-1 overflow-y-auto pb-20">
            <ProductsSection
              products={currentProducts}
              addToCart={addToCart}
              loading={
                isLoadingProducts ||
                isLoadingCategoryProducts ||
                isLoadingFrequentProducts
              }
              categories={categories || []}
              categoryColors={categoryColors}
              isFrequentProductsView={showFrequentProducts}
            />
          </div>
        </div>

        {/* Right section - Cart */}
        <div className="w-1/3 border-l border-gray-200 flex flex-col bg-gray-50">
          <CartSection
            cart={cart}
            updateQuantity={updateQuantity}
            removeFromCart={removeFromCart}
            saleMode={saleMode}
            customer={customer}
            selectCustomer={selectCustomer}
            totalAmount={totalAmount}
            tax={tax}
            discount={discount}
            setDiscount={setDiscount}
            discountType={discountType}
            setDiscountType={setDiscountType}
            processPayment={processPayment}
            handleQrisPayment={handleQrisPayment}
          />
        </div>
      </div>

      {/* Keyboard shortcuts help */}
      <KeyboardShortcutsHelp
        show={showShortcutsHelp}
        setShow={setShowShortcutsHelp}
      />

      {/* Modals */}
      {showBranchSelector && (
        // Branch selector modal
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Pilih Cabang</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => closeAllModals()}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4">
              <input
                type="text"
                placeholder="Cari cabang..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={branchSearchQuery}
                onChange={(e) => setBranchSearchQuery(e.target.value)}
              />

              <div className="max-h-96 overflow-y-auto">
                {filteredBranches.length > 0 ? (
                  filteredBranches.map((branch) => (
                    <div
                      key={branch.id}
                      className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      onClick={() => selectBranch(branch)}
                    >
                      <div className="font-medium">
                        {branch.namaCabang || branch.name}
                      </div>
                      {branch.alamat && (
                        <div className="text-sm text-gray-500 mt-1">
                          {branch.alamat}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    Tidak ada cabang ditemukan
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showCustomerSearch && (
        // Customer search modal
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Pilih Pelanggan</h2>
              <button
                className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
                onClick={() => closeAllModals()}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4">
              <input
                type="text"
                placeholder="Cari pelanggan..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={customerSearchQuery}
                onChange={(e) => searchCustomers(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.preventDefault();
                    closeAllModals();
                  }
                }}
              />

              <div className="max-h-96 overflow-y-auto">
                {/* Add new customer button */}
                <div
                  className="p-3 bg-blue-50 text-blue-700 rounded-lg mb-3 flex items-center cursor-pointer hover:bg-blue-100"
                  onClick={() => {
                    // For now, just create a simple customer object with the search text
                    if (customerSearchQuery.trim()) {
                      selectCustomer({
                        id: null, // No ID for new customers
                        name: customerSearchQuery,
                        phone: "",
                        address: "",
                      });
                    } else {
                      toast.error("Masukkan nama pelanggan", {
                        icon: "⚠️",
                      });
                    }
                  }}
                >
                  <Plus size={18} className="mr-2" />
                  <span>Tambah pelanggan baru</span>
                </div>

                {isLoadingCustomers ? (
                  <div className="p-4 text-center">
                    <div className="w-6 h-6 border-2 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
                    <p className="mt-2 text-gray-500">Mencari pelanggan...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((customer) => (
                    <div
                      key={customer.id}
                      className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      onClick={() => selectCustomer(customer)}
                    >
                      <div className="font-medium">
                        {customer.namaPelanggan || customer.name}
                      </div>
                      {(customer.telepon || customer.phone) && (
                        <div className="text-sm text-gray-500 mt-1">
                          {customer.telepon || customer.phone}
                        </div>
                      )}
                    </div>
                  ))
                ) : customerSearchQuery.length > 2 ? (
                  <div className="p-4 text-center text-gray-500">
                    Tidak ada pelanggan ditemukan
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    Ketik minimal 3 karakter untuk mencari
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && (
        // Payment modal
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Pembayaran</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => closeAllModals()}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <div className="mb-2 text-sm text-gray-600">
                  Total Pembayaran
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 text-transparent bg-clip-text">
                  {formatCurrency(totalAmount)}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm text-gray-600 mb-2">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    className={`px-4 py-3 rounded-lg font-medium flex items-center justify-center ${
                      paymentMethod === "cash"
                        ? "bg-blue-100 border-2 border-blue-500 text-blue-700"
                        : "bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200"
                    }`}
                    onClick={() => setPaymentMethod("cash")}
                  >
                    <DollarSign className="mr-2" size={18} />
                    Tunai
                  </button>

                  <button
                    className={`px-4 py-3 rounded-lg font-medium flex items-center justify-center ${
                      paymentMethod === "card"
                        ? "bg-blue-100 border-2 border-blue-500 text-blue-700"
                        : "bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200"
                    }`}
                    onClick={() => setPaymentMethod("card")}
                  >
                    <CreditCard className="mr-2" size={18} />
                    Kartu
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm text-gray-600 mb-2">
                  Jumlah Diterima
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xl font-bold"
                  value={paymentAmount}
                  onChange={(e) =>
                    setPaymentAmount(Number(e.target.value) || 0)
                  }
                  min={totalAmount}
                  autoFocus
                />
              </div>

              <div className="mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Kembalian</span>
                  <span
                    className={`font-bold ${
                      paymentAmount >= totalAmount
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(Math.max(0, paymentAmount - totalAmount))}
                  </span>
                </div>
              </div>

              <button
                className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-md transform transition-transform duration-200 hover:-translate-y-1 active:translate-y-0"
                onClick={completeSale}
                disabled={
                  paymentAmount < totalAmount || isProcessingTransaction
                }
              >
                {isProcessingTransaction ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-t-white rounded-full animate-spin mr-2"></div>
                    Memproses...
                  </div>
                ) : (
                  "Selesaikan Pembayaran"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt modal */}
      <ReceiptModal
        show={showReceiptModal}
        onClose={handleCloseReceipt}
        data={receiptData}
        onPrint={handlePrintReceipt}
      />
    </div>
  );
};

export default GlobalPOS;
