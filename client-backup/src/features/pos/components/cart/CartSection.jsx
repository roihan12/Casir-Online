import React from "react";
import {
  ShoppingCart,
  Users,
  Minus,
  Plus,
  Trash2,
  Tag,
  DollarSign,
  CreditCard,
  ChevronDown,
} from "lucide-react";

// Utility function to format currency
const formatCurrency = (amount) => {
  const numAmount = parseFloat(amount) || 0;
  return `Rp${numAmount.toLocaleString("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
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
          className={`w-full p-3 bg-white border rounded-xl flex items-center justify-between group hover:border-indigo-400 hover:bg-indigo-50/30 transition-all shadow-sm ${
             saleMode === "wholesale" && !customer ? "border-red-300 ring-2 ring-red-100" : "border-gray-200"
          }`}
          onClick={() => setShowCustomerSearch(true)}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors ${
               saleMode === "wholesale" && !customer ? "bg-red-50 text-red-500" : "bg-indigo-50 text-indigo-600"
            }`}>
              <Users size={18} />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {saleMode === "wholesale" ? "Pelanggan (Wajib)" : "Pelanggan"}
              </p>
              <p className={`font-bold truncate max-w-[150px] ${
                 !customer ? "text-gray-400 italic" : "text-gray-800"
              }`}>
                {customer ? customer.name || customer.namaPelanggan : "Pilih Pelanggan..."}
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

export default CartSection;