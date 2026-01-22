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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../features/auth/hooks/useAuth.js";
import { useCabang } from "../../../features/cabang/hooks/useCabang";
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
} from "../../../hooks/usePosQueries";
import useKeyboardShortcuts from "../../../hooks/useKeyboardShortcuts";
import useFrequentProducts from "../../../hooks/useFrequentProducts";
import useModalManager from "../../../hooks/useModalManager";
import useKeyboardManager from "../../../hooks/useKeyboardManager";

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
    <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
      {loading ? (
        <div className="flex flex-col items-center justify-center h-60">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-500">Memuat produk...</p>
        </div>
      ) : products?.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-60 text-gray-500">
          {isFrequentProductsView ? (
            <>
              <Star size={48} className="mb-4 opacity-30" />
              <p className="text-lg font-medium">
                Belum ada produk yang sering digunakan
              </p>
              <p className="text-sm mt-2">
                Produk akan muncul disini setelah sering digunakan dalam
                transaksi
              </p>
            </>
          ) : (
            <>
              <Package size={48} className="mb-4 opacity-30" />
              <p className="text-lg font-medium">Tidak ada produk ditemukan</p>
              <p className="text-sm mt-2">
                Coba pilih kategori lain atau cari dengan kata kunci berbeda
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {products.map((product) => {
            // Get category info for styling
            const categoryId = product.produkMaster?.kategori?.id;
            const categoryColor = categoryId
              ? categoryColors[categoryId] || "#374151"
              : "#374151";

            // Get product image or fallback to placeholder
            const productImage = product.produkMaster?.produkImage?.[0]?.url;

            return (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 hover:shadow-lg hover:border-blue-300 transition-all duration-200 cursor-pointer transform hover:-translate-y-1"
                onClick={() => addToCart(product)}
              >
                <div className="h-36 bg-gray-100 flex items-center justify-center overflow-hidden">
                  {productImage ? (
                    <img
                      src={productImage}
                      alt={product.produkMaster.namaProduk}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="p-4 flex items-center justify-center h-full w-full">
                      <Package size={48} className="text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <div className="mb-1 flex items-start gap-1">
                    {isFrequentProductsView && (
                      <Star
                        size={14}
                        className="text-yellow-500 mt-1 flex-shrink-0"
                      />
                    )}
                    {product.produkMaster?.kategori && (
                      <span
                        className="text-xs px-2 py-1 rounded-full text-white font-medium truncate"
                        style={{ backgroundColor: categoryColor }}
                      >
                        {product.produkMaster.kategori.namaKategori}
                      </span>
                    )}
                    {product.stok <= (product.minStok || 0) && (
                      <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 font-medium">
                        Stok Rendah
                      </span>
                    )}
                  </div>
                  <h3 className="font-medium text-gray-900 line-clamp-2 h-12">
                    {product.produkMaster?.namaProduk || "Unnamed Product"}
                  </h3>
                  <div className="mt-2">
                    <div className="text-sm text-gray-500 flex justify-between">
                      <span>Stok: {product.stok}</span>
                      <span>{product.produkMaster?.satuan || "pcs"}</span>
                    </div>
                    <div className="mt-1 flex justify-between items-end">
                      <div className="text-lg font-bold text-blue-600">
                        {formatCurrency(product.hargaJual)}
                      </div>
                      {product.hargaGrosir && (
                        <div className="text-xs text-gray-500">
                          Grosir: {formatCurrency(product.hargaGrosir)}
                        </div>
                      )}
                    </div>
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
    <div className="bg-white border-b border-gray-200">
      <div className="px-4 py-2 flex items-center overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`shrink-0 px-4 py-2 mr-2 rounded-lg font-medium ${
            selectedCategory === null
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Semua
        </button>

        <button
          onClick={fetchFrequentProducts}
          className={`shrink-0 px-4 py-2 mr-2 rounded-lg font-medium ${
            showFrequentProducts
              ? "bg-yellow-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <Star size={14} className="inline-block mr-1" />
          Sering Digunakan
        </button>

        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`shrink-0 px-4 py-2 mr-2 rounded-lg font-medium ${
              selectedCategory === category.id
                ? `text-white`
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            style={{
              backgroundColor:
                selectedCategory === category.id
                  ? categoryColors[category.id % categoryColors.length] || "#374151"
                  : "",
            }}
          >
            {category.namaKategori}
          </button>
        ))}
      </div>
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
    <div className="px-4 pt-4 pb-2 relative bg-gradient-to-r from-blue-50 to-indigo-50">
      <div className="flex items-center relative">
        <div className="w-full relative">
          <input
            ref={inputRef}
            type="text"
            placeholder="Cari produk..."
            className="w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-t-blue-500 rounded-full animate-spin"></div>
            ) : (
              <Search size={20} />
            )}
          </div>
        </div>
      </div>

      {/* Dropdown for search history and autocomplete */}
      {(showSearchHistory || showAutocomplete) && (
        <div className="absolute z-20 top-full left-4 right-4 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
          {showSearchHistory && searchHistory.length > 0 && (
            <div className="p-2">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-gray-700">
                  Riwayat Pencarian
                </h3>
                <button
                  className="text-xs text-gray-500 hover:text-gray-700"
                  onClick={() => clearHistory()}
                >
                  Hapus riwayat
                </button>
              </div>
              <div className="space-y-1">
                {searchHistory.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center px-3 py-2 hover:bg-gray-100 rounded-md cursor-pointer"
                    onClick={() => {
                      setProductSearch(item);
                      setShowSearchHistory(false);
                      setShowAutocomplete(true);
                    }}
                  >
                    <Clock size={16} className="mr-2 text-gray-400" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showAutocomplete && searchResults && searchResults.length > 0 && (
            <div className="p-2">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Hasil Pencarian
              </h3>
              <div className="space-y-1">
                {searchResults.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center px-3 py-2 hover:bg-gray-100 rounded-md cursor-pointer"
                    onClick={() => {
                      addToCart(product);
                      setShowAutocomplete(false);
                    }}
                  >
                    <div className="w-10 h-10 rounded-md bg-gray-200 mr-3 overflow-hidden">
                      {product.image_url ? (
                        <img
                          src={product.produkImage[0].filePath}
                          alt={product.produkMaster.namaProduk}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <LayoutGrid size={16} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {product.produkMaster.namaProduk}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {formatCurrency(product.hargaJual)}
                      </p>
                    </div>
                    <div className="ml-2 text-sm text-gray-500">
                      {product.stok} tersedia
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showAutocomplete &&
            (!searchResults || searchResults.length === 0) &&
            productSearch && (
              <div className="p-4 text-center text-gray-500">
                Produk tidak ditemukan
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
  customer,
  selectCustomer,
  totalAmount,
  tax,
  discount,
  setDiscount,
  discountType,
  setDiscountType,
  processPayment,
  handleQrisPayment,
}) => {
  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-white to-blue-50">
      {/* Cart header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold flex items-center">
            <ShoppingCart className="mr-2" size={20} />
            Keranjang
          </h2>
          <div className="flex space-x-2">
            <button
              className={`px-3 py-1 rounded-lg text-xs font-medium ${
                saleMode === "retail"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-800"
              }`}
              onClick={() => handleModeChange("retail")}
            >
              Retail
            </button>
            <button
              className={`px-3 py-1 rounded-lg text-xs font-medium ${
                saleMode === "wholesale"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-800"
              }`}
              onClick={() => handleModeChange("wholesale")}
            >
              Grosir
            </button>
          </div>
        </div>

        {/* Customer selection */}
        <div
          className="mt-3 p-3 bg-gray-50 rounded-lg flex justify-between items-center cursor-pointer hover:bg-gray-100"
          onClick={() => setShowCustomerSearch(true)}
        >
          <div className="flex items-center">
            <Users size={16} className="text-gray-500 mr-2" />
            <div>
              <p className="text-sm text-gray-500">Pelanggan</p>
              <p className="font-medium">
                {customer ? customer.name || customer.namaPelanggan : "Umum"}
              </p>
            </div>
          </div>
          <ChevronDown size={16} className="text-gray-500" />
        </div>
      </div>

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <ShoppingCart size={48} className="mb-4 opacity-50" />
            <p className="text-lg font-medium">Keranjang Kosong</p>
            <p className="text-sm mt-1">Tambahkan produk untuk memulai</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cart.map((item) => (
              <div key={item.id} className="bg-white rounded-lg p-3 shadow-sm">
                <div className="flex justify-between">
                  <div className="flex-1 pr-4">
                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatCurrency(
                        saleMode === "wholesale"
                          ? item.wholesale_price
                          : item.retail_price
                      )}{" "}
                      × {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      {formatCurrency(
                        (saleMode === "wholesale"
                          ? item.wholesale_price
                          : item.retail_price) * item.quantity
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-3">
                  <button
                    className="p-1 rounded-md text-red-600 hover:bg-red-50"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <Trash2 size={16} />
                  </button>

                  <div className="flex items-center">
                    <button
                      className="p-1 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
                      onClick={() =>
                        updateQuantity(item.id, Math.max(1, item.quantity - 1))
                      }
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center font-medium">
                      {item.quantity}
                    </span>
                    <button
                      className="p-1 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart summary */}
      <div className="p-4 border-t border-gray-200 bg-gradient-to-b from-blue-50 to-blue-100">
        {cart.length > 0 && (
          <>
            {/* Discount input */}
            <div className="mb-3 flex items-center">
              <div className="flex-1">
                <label className="block text-sm text-gray-500 mb-1">
                  Diskon
                </label>
                <div className="flex">
                  <input
                    type="number"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                    min="0"
                  />
                  <select
                    className="px-2 py-2 border border-l-0 border-gray-300 rounded-r-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                  >
                    <option value="percentage">%</option>
                    <option value="fixed">Rp</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Summary details */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">
                  {formatCurrency(
                    cart.reduce((sum, item) => {
                      const price =
                        saleMode === "wholesale"
                          ? item.wholesale_price
                          : item.retail_price;
                      return sum + price * item.quantity;
                    }, 0)
                  )}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Diskon</span>
                <span className="font-medium text-red-600">
                  -
                  {formatCurrency(
                    discountType === "percentage"
                      ? cart.reduce((sum, item) => {
                          const price =
                            saleMode === "wholesale"
                              ? item.wholesale_price
                              : item.retail_price;
                          return sum + price * item.quantity;
                        }, 0) *
                          (discount / 100)
                      : discount
                  )}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Pajak (10%)</span>
                <span className="font-medium">{formatCurrency(tax)}</span>
              </div>

              <div className="flex justify-between text-lg font-bold mt-3 pt-3 border-t border-gray-200">
                <span>Total</span>
                <span className="text-green-600">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>

            {/* Payment buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={processPayment}
                disabled={cart.length === 0}
              >
                <DollarSign className="mr-2" size={18} />
                Tunai
              </button>

              <button
                className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleQrisPayment}
                disabled={cart.length === 0}
              >
                <CreditCard className="mr-2" size={18} />
                QRIS
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Receipt component untuk struk
const ReceiptModal = ({ show, onClose, data, onPrint }) => {
  if (!show || !data) return null;

  const { user } = useAuth();
  const { transaction, payment, items, customer, branch } = data;

  // Format tanggal
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <FileText className="mr-2" size={20} /> Struk Pembayaran
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div id="receipt-content" className="p-6 space-y-4">
          {/* Header toko */}
          <div className="text-center mb-4">
            <h3 className="font-bold text-lg">
              {branch?.namaCabang || "CASIR Online"}
            </h3>
            <p className="text-sm text-gray-600">{branch?.alamat || ""}</p>
            <p className="text-sm text-gray-600">
              Telp: {branch?.telepon || "-"}
            </p>
          </div>

          {/* Informasi transaksi */}
          <div className="border-t border-b border-gray-200 py-2">
            <div className="flex justify-between text-sm">
              <span>No. Transaksi:</span>
              <span className="font-medium">{transaction?.id || "-"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tanggal:</span>
              <span>{formatDate(transaction?.tanggal || new Date())}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Kasir:</span>
              <span>{user?.name || "Admin"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Pelanggan:</span>
              <span>{customer?.namaPelanggan || customer?.name || "Umum"}</span>
            </div>
          </div>

          {/* Daftar item */}
          <div className="space-y-2">
            <div className="text-sm font-medium border-b border-gray-200 pb-1">
              Detail Pembelian
            </div>
            {items?.map((item, index) => (
              <div key={index} className="text-sm">
                <div className="flex justify-between">
                  <span>
                    {item.name} x{item.quantity}
                  </span>
                  <span>{formatCurrency(item.price * item.quantity)}</span>
                </div>
                <div className="text-xs text-gray-500 ml-4">
                  {formatCurrency(item.price)} / {item.unit || "pcs"}
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="border-t border-gray-200 pt-2 space-y-1">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>{formatCurrency(transaction?.subtotal || 0)}</span>
            </div>
            {transaction?.discount_amount > 0 && (
              <div className="flex justify-between text-sm">
                <span>
                  Diskon{" "}
                  {transaction?.discount_type === "percentage"
                    ? `(${transaction?.discount_value}%)`
                    : ""}
                  :
                </span>
                <span>
                  -{formatCurrency(transaction?.discount_amount || 0)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span>Pajak (10%):</span>
              <span>{formatCurrency(transaction?.tax_amount || 0)}</span>
            </div>
            <div className="flex justify-between text-base font-bold pt-1 border-t border-gray-200">
              <span>Total:</span>
              <span>{formatCurrency(transaction?.total_amount || 0)}</span>
            </div>
          </div>

          {/* Payment info */}
          <div className="border-t border-gray-200 pt-2 space-y-1">
            <div className="flex justify-between text-sm">
              <span>Metode Pembayaran:</span>
              <span>
                {payment?.metode_pembayaran === "TUNAI"
                  ? "Tunai"
                  : payment?.metode_pembayaran === "QRIS"
                  ? "QRIS"
                  : "Kartu"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Jumlah Bayar:</span>
              <span>{formatCurrency(payment?.jumlah_bayar || 0)}</span>
            </div>
            {payment?.jumlah_kembali > 0 && (
              <div className="flex justify-between text-sm font-medium">
                <span>Kembali:</span>
                <span>{formatCurrency(payment?.jumlah_kembali || 0)}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center text-sm pt-4 border-t border-gray-200">
            <p className="font-medium">Terima Kasih</p>
            <p className="text-xs text-gray-500 mt-1">
              Barang yang sudah dibeli tidak dapat dikembalikan
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Powered by CASIR Online
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-center">
          <button
            onClick={onPrint}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center"
          >
            <Printer className="mr-2" size={18} />
            Cetak Struk
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

  console.log("product data", productsData);

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
    useCustomerSearch(customerSearchQuery, {
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
      // If a branch is already selected in context, use it
      if (selectedCabang) {
        setCurrentBranch(selectedCabang);
        loadProductsForBranch(selectedCabang.id);
      } else {
        // Otherwise set the first branch as default
        setCurrentBranch(cabangList[0]);
        if (setSelectedCabangById) {
          setSelectedCabangById(cabangList[0].id);
        }
        loadProductsForBranch(cabangList[0].id);
      }
    }

    // Show branch selector for superadmin on initial load
    if (user && user.role === "superadmin" && !selectedCabang) {
      setShowBranchSelector(true);
    }
  }, [cabangList, selectedCabang, user]);

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
  const loadProductsForBranch = async (branchId) => {
    if (!branchId) return;

    // Produk akan diambil secara otomatis melalui React Query
    // ketika currentBranch.id berubah
    setCurrentBranch({ ...currentBranch, id: branchId });
  };

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
    setCurrentBranch(branch);

    if (setSelectedCabangById) {
      setSelectedCabangById(branch.id);
    }

    setShowBranchSelector(false);
    toast.success(`Cabang ${branch.namaCabang || branch.name} dipilih`);

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
    const originalContents = document.body.innerHTML;

    // Prepare for print
    const printStyles = `
      <style>
        @media print {
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
          #receipt-print-container { width: 80mm; padding: 5mm; margin: 0 auto; }
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }
          .text-lg { font-size: 16px; }
          .text-sm { font-size: 12px; }
          .text-xs { font-size: 10px; }
          .text-gray-600, .text-gray-500, .text-gray-400 { color: #666; }
          .mb-4 { margin-bottom: 16px; }
          .space-y-4 > * + * { margin-top: 16px; }
          .space-y-2 > * + * { margin-top: 8px; }
          .space-y-1 > * + * { margin-top: 4px; }
          .border-t, .border-b { border-color: #eee; }
          .border-t { border-top: 1px solid; padding-top: 8px; }
          .border-b { border-bottom: 1px solid; padding-bottom: 8px; }
          .py-2 { padding-top: 8px; padding-bottom: 8px; }
          .pt-2 { padding-top: 8px; }
          .pt-4 { padding-top: 16px; }
          .pb-1 { padding-bottom: 4px; }
          .flex { display: flex; }
          .justify-between { justify-content: space-between; }
          .font-medium { font-weight: 500; }
          .ml-4 { margin-left: 16px; }
          .mt-1 { margin-top: 4px; }
          .mt-2 { margin-top: 8px; }
        }
      </style>
    `;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Struk Pembayaran</title>
          ${printStyles}
        </head>
        <body>
          <div id="receipt-print-container">
            ${printContent.innerHTML}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    // Print the document
    printWindow.print();
    printWindow.onafterprint = function () {
      printWindow.close();
    };
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
      <header className="bg-white shadow z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div
                className="text-lg font-bold flex items-center cursor-pointer"
                onClick={() => navigate("/dashboard")}
              >
                <Store className="mr-2" size={24} />
                CASIR Online
              </div>

              <div className="ml-8 relative">
                <button
                  className="px-4 py-2 bg-gray-100 rounded-lg text-gray-800 flex items-center hover:bg-gray-200"
                  onClick={() => modalManager.openModal("branchSelector")}
                >
                  <span className="mr-2">{getCurrentBranchName()}</span>
                  <ChevronDown size={16} />
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                className="p-2 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100"
                onClick={toggleFullscreen}
                title={
                  isFullscreen
                    ? "Keluar dari mode layar penuh"
                    : "Masuk ke mode layar penuh"
                }
              >
                {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
              </button>
              <button
                className="p-2 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100"
                onClick={() => modalManager.openModal("shortcutsHelp")}
              >
                <Keyboard size={20} />
              </button>

              <button
                className="p-2 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100"
                onClick={() => navigate("/dashboard")}
              >
                <X size={20} />
              </button>
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
