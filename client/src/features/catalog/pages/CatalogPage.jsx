import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FiSearch,
  FiShoppingCart,
  FiFilter,
  FiMapPin,
  FiClock,
  FiPhone,
  FiChevronLeft,
  FiChevronRight,
  FiPlus,
  FiMinus,
  FiX,
  FiPackage,
} from "react-icons/fi";
import {
  useCatalogProducts,
  useCatalogCategories,
  useCabangInfo,
} from "../hooks/useCatalog";
import { useCart } from "../hooks/useCart";
import { CURRENCY_FORMATTER } from "../../../config";
import toast from "react-hot-toast";

// Custom hook for debounce
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const CatalogPage = () => {
  const { cabangId } = useParams();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 500);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("terbaru");
  const [page, setPage] = useState(1);
  const [showCart, setShowCart] = useState(false);

  const cart = useCart(cabangId);

  // Fetch data
  const { data: productsData, isLoading: loadingProducts } =
    useCatalogProducts(cabangId, {
      search: debouncedSearch,
      kategoriId: selectedCategory,
      sortBy,
      page,
      limit: 12,
    });

  const { data: categoriesData } = useCatalogCategories(cabangId);
  const { data: cabangData } = useCabangInfo(cabangId);

  const products = productsData?.data || [];
  const pagination = productsData?.pagination || {};
  const categories = categoriesData?.data || [];
  const cabang = cabangData?.data || {};

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-800">
                {cabang.nama || "Katalog"}
              </h1>
              {cabang.alamat && (
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <FiMapPin className="w-3 h-3" />
                  {cabang.alamat}
                </p>
              )}
            </div>
            <button
              onClick={() => setShowCart(true)}
              className="relative p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <FiShoppingCart className="w-5 h-5" />
              {cart.totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {cart.totalItems}
                </span>
              )}
            </button>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="mt-3">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cari produk..."
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-0 rounded-xl text-sm focus:ring-2 focus:ring-indigo-300 focus:bg-white transition-all"
              />
            </div>
          </form>
        </div>
      </header>

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => {
              setSelectedCategory("");
              setPage(1);
            }}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              !selectedCategory
                ? "bg-indigo-600 text-white"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            Semua
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setPage(1);
              }}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat.id
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {cat.nama} ({cat.jumlah_produk})
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center justify-between mt-3">
          <p className="text-sm text-slate-500">
            {pagination.totalData || 0} produk
          </p>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-300"
          >
            <option value="terbaru">Terbaru</option>
            <option value="nama">Nama A-Z</option>
            <option value="harga_asc">Harga Terendah</option>
            <option value="harga_desc">Harga Tertinggi</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-24">
        {loadingProducts ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl overflow-hidden animate-pulse"
              >
                <div className="aspect-square bg-slate-200" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-5 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <FiPackage className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">Tidak ada produk ditemukan</p>
            <p className="text-slate-400 text-sm mt-1">
              Coba ubah filter atau kata kunci pencarian
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {products.map((product) => {
                const inCart = cart.items.find(
                  (i) => i.produk_id === product.produk_id
                );
                return (
                  <div
                    key={product.produk_id}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group cursor-pointer border border-slate-200"
                  >
                    <div
                      className="aspect-square bg-slate-100 relative overflow-hidden"
                      onClick={() =>
                        navigate(
                          `/catalog/${cabangId}/product/${product.produk_id}`
                        )
                      }
                    >
                      {product.images?.[0]?.file_path ? (
                        <img
                          src={product.images[0].file_path}
                          alt={product.nama_produk}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FiPackage className="w-12 h-12 text-slate-300" />
                        </div>
                      )}
                      {product.stok <= 5 && product.stok > 0 && (
                        <span className="absolute top-2 left-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
                          Sisa {product.stok}
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-slate-400 mb-0.5">
                        {product.kategori?.nama}
                      </p>
                      <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 mb-1">
                        {product.nama_produk}
                      </h3>
                      <p className="text-base font-bold text-indigo-600">
                        {CURRENCY_FORMATTER.format(product.harga_jual)}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          cart.addItem(product);
                          toast.success(`${product.nama_produk} ditambahkan ke keranjang`);
                        }}
                        disabled={product.stok <= 0}
                        className={`mt-2 w-full py-2 rounded-xl text-sm font-medium transition-colors ${
                          product.stok <= 0
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : inCart
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                              : "bg-indigo-600 text-white hover:bg-indigo-700"
                        }`}
                      >
                        {product.stok <= 0
                          ? "Habis"
                          : inCart
                            ? `✓ Di keranjang (${inCart.jumlah})`
                            : "+ Keranjang"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-2 rounded-lg bg-white border border-slate-200 disabled:opacity-50 hover:bg-slate-50 transition-colors"
                >
                  <FiChevronLeft />
                </button>
                <span className="text-sm text-slate-600">
                  {page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(pagination.totalPages, p + 1))
                  }
                  disabled={page >= pagination.totalPages}
                  className="p-2 rounded-lg bg-white border border-slate-200 disabled:opacity-50 hover:bg-slate-50 transition-colors"
                >
                  <FiChevronRight />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Cart Drawer */}
      {showCart && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowCart(false)}
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col animate-slide-in-right">
            {/* Cart Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold text-slate-800">
                Keranjang ({cart.totalItems})
              </h2>
              <button
                onClick={() => setShowCart(false)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.isEmpty ? (
                <div className="text-center py-12">
                  <FiShoppingCart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">Keranjang masih kosong</p>
                </div>
              ) : (
                cart.items.map((item) => (
                  <div
                    key={item.produk_id}
                    className="flex gap-3 bg-slate-50 rounded-xl p-3"
                  >
                    <div className="w-16 h-16 bg-white rounded-lg flex-shrink-0 overflow-hidden">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.nama_produk}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FiPackage className="text-slate-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-slate-800 truncate">
                        {item.nama_produk}
                      </h4>
                      <p className="text-sm font-bold text-indigo-600">
                        {CURRENCY_FORMATTER.format(item.harga)}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <button
                          onClick={() =>
                            cart.updateQuantity(
                              item.produk_id,
                              item.jumlah - 1
                            )
                          }
                          disabled={item.jumlah <= 1}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100 disabled:opacity-50 transition-colors"
                        >
                          <FiMinus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-semibold w-8 text-center">
                          {item.jumlah}
                        </span>
                        <button
                          onClick={() =>
                            cart.updateQuantity(
                              item.produk_id,
                              item.jumlah + 1
                            )
                          }
                          disabled={item.stok && item.jumlah >= item.stok}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100 disabled:opacity-50 transition-colors"
                        >
                          <FiPlus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => cart.removeItem(item.produk_id)}
                          className="ml-auto text-rose-400 hover:text-rose-600 transition-colors"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart Footer */}
            {!cart.isEmpty && (
              <div className="border-t p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="text-lg font-bold text-slate-800">
                    {CURRENCY_FORMATTER.format(cart.subtotal)}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setShowCart(false);
                    navigate(`/catalog/${cabangId}/checkout`);
                  }}
                  className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Cart Button (Mobile) */}
      {cart.totalItems > 0 && !showCart && (
        <div className="fixed bottom-4 left-4 right-4 md:hidden z-30">
          <button
            onClick={() => setShowCart(true)}
            className="w-full py-3.5 bg-indigo-600 text-white font-semibold rounded-2xl shadow-lg flex items-center justify-between px-5 hover:bg-indigo-700 transition-colors"
          >
            <span className="flex items-center gap-2">
              <FiShoppingCart className="w-5 h-5" />
              {cart.totalItems} item
            </span>
            <span>{CURRENCY_FORMATTER.format(cart.subtotal)}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default CatalogPage;
