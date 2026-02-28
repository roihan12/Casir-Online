import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FiArrowLeft,
  FiShoppingCart,
  FiPackage,
  FiMinus,
  FiPlus,
  FiTag,
  FiBox,
} from "react-icons/fi";
import { useProductDetail } from "../hooks/useCatalog";
import { useCart } from "../hooks/useCart";
import { CURRENCY_FORMATTER } from "../../../config";
import { useState } from "react";

const ProductDetailPage = () => {
  const { cabangId, produkId } = useParams();
  const navigate = useNavigate();
  const cart = useCart(cabangId);
  const [quantity, setQuantity] = useState(1);

  const { data: productData, isLoading } = useProductDetail(cabangId, produkId);
  const product = productData?.data || null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 animate-pulse">
        <div className="aspect-square bg-slate-200" />
        <div className="p-4 space-y-3">
          <div className="h-6 bg-slate-200 rounded w-3/4" />
          <div className="h-8 bg-slate-200 rounded w-1/2" />
          <div className="h-20 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <FiPackage className="w-20 h-20 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-600">
            Produk tidak ditemukan
          </h2>
          <Link
            to={`/catalog/${cabangId}`}
            className="mt-4 inline-block text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← Kembali ke katalog
          </Link>
        </div>
      </div>
    );
  }

  const inCart = cart.items.find((i) => i.produk_id === product.produk_id);

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      cart.addItem(product);
    }
    setQuantity(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Back Navigation */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(`/catalog/${cabangId}`)}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Kembali</span>
          </button>
          <button
            onClick={() => navigate(`/catalog/${cabangId}`)}
            className="relative p-2 text-slate-600 hover:text-indigo-600 transition-colors"
          >
            <FiShoppingCart className="w-5 h-5" />
            {cart.totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {cart.totalItems}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        {/* Product Image */}
        <div className="aspect-square bg-white relative overflow-hidden">
          {product.images?.length > 0 ? (
            <img
              src={product.images[0].file_path}
              alt={product.nama_produk}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50">
              <FiPackage className="w-24 h-24 text-slate-300" />
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4 md:p-6 space-y-4">
          {product.kategori && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
              <FiTag className="w-3 h-3" />
              {product.kategori.nama}
            </span>
          )}

          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
            {product.nama_produk}
          </h1>

          <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {CURRENCY_FORMATTER.format(product.harga_jual)}
          </p>

          {/* Stock Info */}
          <div className="flex items-center gap-2">
            <FiBox className="w-4 h-4 text-slate-400" />
            <span
              className={`text-sm font-medium ${
                product.stok <= 5 ? "text-amber-600" : "text-emerald-600"
              }`}
            >
              {product.stok > 0 ? `Stok: ${product.stok}` : "Stok habis"}
            </span>
            {product.satuan && (
              <span className="text-sm text-slate-400">
                per {product.satuan}
              </span>
            )}
          </div>

          {/* Description */}
          {product.deskripsi && (
            <div className="bg-white rounded-2xl p-4 border border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">
                Deskripsi
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {product.deskripsi}
              </p>
            </div>
          )}

          {/* Extra Info */}
          <div className="grid grid-cols-2 gap-3">
            {product.brand && (
              <div className="bg-white rounded-xl p-3 border border-slate-100 text-center">
                <p className="text-xs text-slate-400">Brand</p>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">
                  {product.brand}
                </p>
              </div>
            )}
            {product.sku && (
              <div className="bg-white rounded-xl p-3 border border-slate-100 text-center">
                <p className="text-xs text-slate-400">SKU</p>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">
                  {product.sku}
                </p>
              </div>
            )}
            {product.berat && (
              <div className="bg-white rounded-xl p-3 border border-slate-100 text-center">
                <p className="text-xs text-slate-400">Berat</p>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">
                  {product.berat}g
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 p-4 z-40">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          {/* Quantity */}
          <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              <FiMinus className="w-4 h-4" />
            </button>
            <span className="w-10 text-center font-semibold">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              disabled={product.stok && quantity >= product.stok}
              className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              <FiPlus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Cart */}
          <button
            onClick={handleAddToCart}
            disabled={product.stok <= 0}
            className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${
              product.stok <= 0
                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:shadow-lg hover:shadow-indigo-200"
            }`}
          >
            {product.stok <= 0
              ? "Stok Habis"
              : inCart
                ? `✓ Tambah ke Keranjang (${inCart.jumlah})`
                : "+ Tambah ke Keranjang"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
