import { useState, useEffect } from "react";
import { X, Plus, Tag, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import api from "@/common/utils/api";

/**
 * PromoSection Component
 *
 * Handles promo code input and display for POS
 * Supports multiple promo codes
 */
const PromoSection = ({
  cabangId,
  pelangganId,
  subtotal,
  metodePembayaran,
  cartItems = [],
  onPromosChange,
  appliedPromos = [],
  disabled = false,
}) => {
  const [promoCode, setPromoCode] = useState("");
  const [promoList, setPromoList] = useState([]);
  const [isValidating, setIsValidating] = useState(false);
  const [errors, setErrors] = useState([]);

  // Initialize promo list from appliedPromos prop
  useEffect(() => {
    if (appliedPromos && appliedPromos.length > 0) {
      setPromoList(appliedPromos);
    }
  }, [appliedPromos]);

  // Notify parent of promo changes
  useEffect(() => {
    if (onPromosChange) {
      const promoCodes = promoList.map((p) => p.kode_promo);
      const totalDiscount = promoList.reduce(
        (sum, p) => sum + (p.discount || 0),
        0
      );
      onPromosChange({
        codes: promoCodes,
        promos: promoList,
        totalDiscount,
      });
    }
  }, [promoList, onPromosChange]);

  const handleAddPromo = async () => {
    if (!promoCode.trim() || disabled) return;

    // Check if already applied
    if (promoList.some((p) => p.kode_promo === promoCode.toUpperCase())) {
      setErrors((prev) => [
        ...prev,
        { kode_promo: promoCode, message: "Promo already applied" },
      ]);
      setPromoCode("");
      return;
    }

    setIsValidating(true);
    setErrors([]);

    try {
      // Format cart items for API
      const details = cartItems.map((item) => ({
        produk_id: item.id,
        produk_master_id: item.produkMaster?.id || item.produk_master_id,
        jumlah: item.quantity,
        harga_satuan: item.retail_price || 0,
        total: (item.retail_price || 0) * item.quantity,
      }));

      // Call preview endpoint to validate promo
      const response = await api.post("/transaksi/preview-promo", {
        promo_codes: [promoCode.toUpperCase()],
        cabang_id: cabangId,
        pelanggan_id: pelangganId,
        subtotal: subtotal,
        metode_pembayaran: metodePembayaran,
        details: details, // Include cart items for product-specific promo validation
      });

      if (response.data.data.applicable_promos && response.data.data.applicable_promos.length > 0) {
        const newPromo = response.data.data.applicable_promos[0];
        setPromoList((prev) => [...prev, newPromo]);
        setPromoCode("");
      } else {
        // Add error from result
        if (response.data.errors && response.data.errors.length > 0) {
          setErrors(response.data.errors);
        } else {
          setErrors([
            { kode_promo: promoCode, message: "Promo is not applicable" },
          ]);
        }
      }
    } catch (error) {
      setErrors([
        {
          kode_promo: promoCode,
          message: error.response?.data?.message || "Failed to validate promo",
        },
      ]);
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemovePromo = (kodePromo) => {
    setPromoList((prev) => prev.filter((p) => p.kode_promo !== kodePromo));
    setErrors((prev) => prev.filter((e) => e.kode_promo !== kodePromo));
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleAddPromo();
    }
  };

  const totalDiscount = promoList.reduce(
    (sum, p) => sum + (p.discount || 0),
    0
  );

  return (
    <div className="space-y-3">
      {/* Promo Code Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            onKeyPress={handleKeyPress}
            placeholder="Enter promo code"
            disabled={disabled || isValidating}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm uppercase"
          />
        </div>
        <button
          onClick={handleAddPromo}
          disabled={!promoCode.trim() || disabled || isValidating}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isValidating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Apply
        </button>
      </div>

      {/* Applied Promos List */}
      {promoList.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700 flex items-center justify-between">
            <span>Applied Promos ({promoList.length})</span>
            <span className="text-green-600 font-semibold">
              -Rp{totalDiscount.toLocaleString()}
            </span>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {promoList.map((promo) => (
              <div
                key={promo.kode_promo}
                className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="font-medium text-sm text-green-800">
                      {promo.kode_promo}
                    </span>
                  </div>
                  <p className="text-xs text-green-700 truncate ml-6">
                    {promo.nama_promo} - Rp{promo.discount?.toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleRemovePromo(promo.kode_promo)}
                  disabled={disabled}
                  className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((error, index) => (
            <div
              key={`${error.kode_promo}-${index}`}
              className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded-lg"
            >
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-800">
                  {error.kode_promo}
                </p>
                <p className="text-xs text-red-700">{error.message}</p>
              </div>
              <button
                onClick={() => setErrors((prev) => prev.filter((_, i) => i !== index))}
                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Promo Info */}
      {promoList.length === 0 && errors.length === 0 && (
        <p className="text-xs text-gray-500 text-center">
          Add promo codes to get discounts on your order
        </p>
      )}
    </div>
  );
};

export default PromoSection;
