import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  FiArrowLeft,
  FiMapPin,
  FiUser,
  FiPhone,
  FiMail,
  FiCreditCard,
  FiTruck,
  FiShoppingBag,
  FiTag,
  FiLoader,
  FiAlertCircle,
  FiPackage,
} from "react-icons/fi";
import { useCart } from "../hooks/useCart";
import { useCreateOrder, useVerifyPromo } from "../hooks/useCatalog";
import { CURRENCY_FORMATTER } from "../../../config";
import catalogService from "../../../services/catalogService";
import toast from "react-hot-toast";

// Zod schema for checkout validation
const checkoutSchema = z
  .object({
    customer_name: z
      .string()
      .min(1, "Nama harus diisi")
      .max(100, "Nama maksimal 100 karakter"),
    customer_phone: z
      .string()
      .min(1, "Nomor telepon harus diisi")
      .regex(
        /^(\+62|62|0)8[1-9][0-9]{6,10}$/,
        "Format nomor telepon tidak valid"
      ),
    customer_email: z
      .string()
      .email("Format email tidak valid")
      .optional()
      .or(z.literal("")),
    customer_address: z.string().optional().or(z.literal("")),
    customer_notes: z.string().max(500).optional().or(z.literal("")),
    order_type: z.enum(["PICKUP", "DELIVERY"]),
    payment_method: z.enum(["PAYMENT_LINK", "COD", "PAY_AT_STORE"]),
  })
  .refine(
    (data) => {
      if (data.order_type === "DELIVERY" && !data.customer_address?.trim()) {
        return false;
      }
      return true;
    },
    { message: "Alamat harus diisi untuk delivery", path: ["customer_address"] }
  )
  .refine(
    (data) => {
      if (data.payment_method === "COD" && data.order_type !== "DELIVERY") {
        return false;
      }
      return true;
    },
    {
      message: "COD hanya untuk tipe Delivery",
      path: ["payment_method"],
    }
  )
  .refine(
    (data) => {
      if (
        data.payment_method === "PAY_AT_STORE" &&
        data.order_type !== "PICKUP"
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Bayar di Toko hanya untuk tipe Pickup",
      path: ["payment_method"],
    }
  );

const CheckoutPage = () => {
  const { cabangId } = useParams();
  const navigate = useNavigate();
  const cart = useCart(cabangId);
  const createOrder = useCreateOrder();
  const verifyPromo = useVerifyPromo(cabangId);
  const [promoCode, setPromoCode] = useState("");
  const [promoResult, setPromoResult] = useState(null);
  const [promoError, setPromoError] = useState("");
  const [deliveryFeeData, setDeliveryFeeData] = useState(null);
  const [taxData, setTaxData] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");
  const [customerCoords, setCustomerCoords] = useState(null);

  const BIAYA_TAMBAHAN = 1000;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      order_type: "PICKUP",
      payment_method: "PAYMENT_LINK",
      customer_name: "",
      customer_phone: "",
      customer_email: "",
      customer_address: "",
      customer_notes: "",
    },
  });

  const orderType = watch("order_type");
  const paymentMethod = watch("payment_method");

  // Reset payment method when order type changes
  const getAvailablePayments = () => {
    if (orderType === "DELIVERY") {
      return [
        { value: "PAYMENT_LINK", label: "Bayar Online", icon: FiCreditCard },
        { value: "COD", label: "COD (Bayar di Tempat)", icon: FiTruck },
      ];
    }
    return [
      { value: "PAYMENT_LINK", label: "Bayar Online", icon: FiCreditCard },
      {
        value: "PAY_AT_STORE",
        label: "Bayar di Toko",
        icon: FiShoppingBag,
      },
    ];
  };

  const discount = promoResult?.data?.discount || 0;
  const deliveryFee = deliveryFeeData?.delivery_fee || 0;
  const taxAmount = taxData?.tax_amount || 0;
  const total = Math.max(0, cart.subtotal - discount + (orderType === "DELIVERY" ? deliveryFee : 0) + taxAmount + BIAYA_TAMBAHAN);

  // Request geolocation when DELIVERY is selected
  useEffect(() => {
    if (orderType === "DELIVERY" && !customerCoords) {
      setGeoLoading(true);
      setGeoError("");
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setCustomerCoords({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
            setGeoLoading(false);
          },
          (err) => {
            setGeoError("Tidak bisa mendapatkan lokasi. Ongkir menggunakan tarif flat.");
            setGeoLoading(false);
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      } else {
        setGeoError("Browser tidak mendukung Geolocation.");
        setGeoLoading(false);
      }
    }
  }, [orderType, customerCoords]);

  // Fetch delivery fee when coords available
  useEffect(() => {
    if (orderType === "DELIVERY" && customerCoords) {
      catalogService
        .calculateDeliveryFee(cabangId, customerCoords)
        .then((res) => setDeliveryFeeData(res.data))
        .catch(() => setDeliveryFeeData({ delivery_fee: 3000, is_deliverable: true }));
    } else {
      setDeliveryFeeData(null);
    }
  }, [orderType, customerCoords, cabangId]);

  // Fetch tax preview
  useEffect(() => {
    const subtotalAfterDiskon = Math.max(0, cart.subtotal - discount);
    if (cart.subtotal > 0) {
      catalogService
        .getTaxPreview(cabangId, { subtotal: subtotalAfterDiskon })
        .then((res) => setTaxData(res.data))
        .catch(() => setTaxData(null));
    }
  }, [cart.subtotal, discount, cabangId]);

  const handleVerifyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoError("");
    setPromoResult(null);


    try {
      const result = await verifyPromo.mutateAsync({
        kodePromo: promoCode,
        subtotal: cart.subtotal,
        items: cart.items.map((i) => ({
          produkId: i.produk_id,
          produkMasterId: i.produk_master_id,
          quantity: i.jumlah,
          harga: i.harga,
          total: i.harga * i.jumlah,
        })),
      });
      setPromoResult(result);
    } catch (err) {
      setPromoError(
        err.response?.data?.errors || "Promo code tidak valid"
      );
    }
  };

  const onSubmit = async (formData) => {
    if (cart.isEmpty) {
      toast.error("Keranjang masih kosong");
      return;
    }

    try {
      const orderData = {
        cabang_id: cabangId,
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        customer_email: formData.customer_email || null,
        customer_address: formData.customer_address || null,
        customer_notes: formData.customer_notes || null,
        order_type: formData.order_type,
        payment_method: formData.payment_method,
        items: cart.items.map((i) => ({
          produk_id: i.produk_id,
          jumlah: i.jumlah,
          catatan: i.catatan || null,
        })),
        promo_codes: promoResult?.data?.valid ? [promoCode] : [],
        customer_lat: customerCoords?.latitude || null,
        customer_lng: customerCoords?.longitude || null,
      };

      const result = await createOrder.mutateAsync(orderData);

      // Clear cart
      cart.clearCart();

      // Redirect based on payment method
      if (
        formData.payment_method === "PAYMENT_LINK" &&
        result.data?.payment_url
      ) {
        // Redirect to Midtrans payment page
        window.location.href = result.data.payment_url;
      } else {
        // For COD/PAY_AT_STORE: go to order status page
        navigate(
          `/catalog/${cabangId}/order/${result.data?.transaksi_id}`
        );
      }
    } catch (err) {
      toast.error(
        err.response?.data?.errors || "Gagal membuat order"
      );
    }
  };

  if (cart.isEmpty) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <FiPackage className="w-20 h-20 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-600 mb-2">
            Keranjang Kosong
          </h2>
          <button
            onClick={() => navigate(`/catalog/${cabangId}`)}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← Kembali ke katalog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(`/catalog/${cabangId}`)}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-slate-800">Checkout</h1>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-2xl mx-auto px-4 py-6 space-y-6"
      >
        {/* Order Summary */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-3">
            Ringkasan Pesanan ({cart.totalItems} item)
          </h2>
          <div className="space-y-2">
            {cart.items.map((item) => (
              <div key={item.produk_id} className="flex justify-between text-sm">
                <span className="text-slate-600">
                  {item.nama_produk} × {item.jumlah}
                </span>
                <span className="font-medium text-slate-800">
                  {CURRENCY_FORMATTER.format(item.harga * item.jumlah)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Promo Code - Moved Up */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
          <h2 className="font-semibold text-slate-800 flex items-center">
            <FiTag className="w-4 h-4 mr-1.5" />
            Kode Promo
          </h2>
          <div className="flex gap-2">
            <input
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-all"
              placeholder="Masukkan kode promo"
            />
            <button
              type="button"
              onClick={handleVerifyPromo}
              disabled={!promoCode.trim() || verifyPromo.isPending}
              className="px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {verifyPromo.isPending ? "..." : "Gunakan"}
            </button>
          </div>
          {promoResult?.data?.valid && (
            <div className="bg-emerald-50 text-emerald-700 text-sm p-3 rounded-xl flex items-center gap-2 border border-emerald-100">
              <FiTag className="w-4 h-4" />
              Diskon {CURRENCY_FORMATTER.format(promoResult.data.discount)} diterapkan!
            </div>
          )}
          {promoError && (
            <div className="bg-rose-50 text-rose-600 text-sm p-3 rounded-xl flex items-center gap-2 border border-rose-100">
              <FiAlertCircle className="w-4 h-4" />
              {promoError}
            </div>
          )}
        </div>

        {/* Customer Info */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-4">
          <h2 className="font-semibold text-slate-800">Informasi Customer</h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              <FiUser className="inline w-4 h-4 mr-1" />
              Nama *
            </label>
            <input
              {...register("customer_name")}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-all"
              placeholder="Nama lengkap"
            />
            {errors.customer_name && (
              <p className="text-xs text-rose-500 mt-1">
                {errors.customer_name.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              <FiPhone className="inline w-4 h-4 mr-1" />
              No. Telepon *
            </label>
            <input
              {...register("customer_phone")}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-all"
              placeholder="08xxxxxxxxxx"
            />
            {errors.customer_phone && (
              <p className="text-xs text-rose-500 mt-1">
                {errors.customer_phone.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              <FiMail className="inline w-4 h-4 mr-1" />
              Email (opsional)
            </label>
            <input
              {...register("customer_email")}
              type="email"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-all"
              placeholder="email@example.com"
            />
          </div>
        </div>

        {/* Order Type */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-4">
          <h2 className="font-semibold text-slate-800">Tipe Order</h2>
          <div className="grid grid-cols-2 gap-3">
            <label
              className={`cursor-pointer rounded-xl border-2 p-4 text-center transition-all ${
                orderType === "PICKUP"
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <input
                {...register("order_type")}
                type="radio"
                value="PICKUP"
                className="sr-only"
              />
              <FiShoppingBag className="w-8 h-8 mx-auto mb-2 text-indigo-500" />
              <p className="text-sm font-semibold text-slate-800">Pickup</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Ambil di toko
              </p>
            </label>
            <label
              className={`cursor-pointer rounded-xl border-2 p-4 text-center transition-all ${
                orderType === "DELIVERY"
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <input
                {...register("order_type")}
                type="radio"
                value="DELIVERY"
                className="sr-only"
              />
              <FiTruck className="w-8 h-8 mx-auto mb-2 text-indigo-500" />
              <p className="text-sm font-semibold text-slate-800">Delivery</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Kirim ke alamat
              </p>
            </label>
          </div>

          {/* Address (for delivery) */}
          {orderType === "DELIVERY" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <FiMapPin className="inline w-4 h-4 mr-1" />
                Alamat Pengiriman *
              </label>
              <textarea
                {...register("customer_address")}
                rows={3}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-all resize-none"
                placeholder="Contoh: Jl. Sudirman No 12, RT/RW, Patokan depan apotek..."
              />
              {errors.customer_address && (
                <p className="text-xs text-rose-500 mt-1">
                  {errors.customer_address.message}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-4">
          <h2 className="font-semibold text-slate-800">Metode Pembayaran</h2>
          <div className="space-y-2">
            {getAvailablePayments().map((pm) => (
              <label
                key={pm.value}
                className={`flex items-center gap-3 cursor-pointer rounded-xl border-2 p-3.5 transition-all ${
                  paymentMethod === pm.value
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <input
                  {...register("payment_method")}
                  type="radio"
                  value={pm.value}
                  className="sr-only"
                />
                <pm.icon
                  className={`w-5 h-5 ${
                    paymentMethod === pm.value
                      ? "text-indigo-500"
                      : "text-slate-400"
                  }`}
                />
                <span className="text-sm font-medium text-slate-700">
                  {pm.label}
                </span>
              </label>
            ))}
          </div>
          {errors.payment_method && (
            <p className="text-xs text-rose-500">
              {errors.payment_method.message}
            </p>
          )}
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Catatan (opsional)
          </label>
          <textarea
            {...register("customer_notes")}
            rows={2}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-all resize-none"
            placeholder="Catatan untuk toko..."
          />
        </div>
      </form>

      {/* Bottom Pay Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-40 shadow-sm">
        <div className="max-w-2xl mx-auto">
          {/* Full Price Breakdown */}
          <div className="space-y-1.5 mb-3 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span>{CURRENCY_FORMATTER.format(cart.subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Diskon Promo</span>
                <span>- {CURRENCY_FORMATTER.format(discount)}</span>
              </div>
            )}
            {orderType === "DELIVERY" && (
              <div className="flex justify-between text-slate-500">
                <span>
                  Ongkos Kirim
                  {deliveryFeeData?.distance_km != null && (
                    <span className="text-xs text-slate-400 ml-1">
                      ({deliveryFeeData.distance_km} km)
                    </span>
                  )}
                </span>
                <span>{CURRENCY_FORMATTER.format(deliveryFee)}</span>
              </div>
            )}
            {taxData?.is_tax_enabled && taxAmount > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>{taxData.tax_name} ({taxData.tax_percentage}%)</span>
                <span>{CURRENCY_FORMATTER.format(taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500">
              <span>Biaya Layanan</span>
              <span>{CURRENCY_FORMATTER.format(BIAYA_TAMBAHAN)}</span>
            </div>
            <div className="border-t border-dashed border-slate-200 pt-2 flex justify-between font-bold text-slate-800 text-base">
              <span>Total</span>
              <span>{CURRENCY_FORMATTER.format(total)}</span>
            </div>
          </div>

          {/* Delivery warning */}
          {orderType === "DELIVERY" && deliveryFeeData && !deliveryFeeData.is_deliverable && (
            <div className="bg-rose-50 text-rose-600 text-xs p-2.5 rounded-xl mb-3 flex items-center gap-2 border border-rose-100">
              <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
              Lokasi Anda di luar jangkauan delivery (maks {deliveryFeeData.max_radius} km)
            </div>
          )}
          {geoError && orderType === "DELIVERY" && (
            <div className="bg-amber-50 text-amber-600 text-xs p-2.5 rounded-xl mb-3 border border-amber-100">
              {geoError}
            </div>
          )}

          <button
            onClick={handleSubmit(onSubmit)}
            disabled={createOrder.isPending || (orderType === "DELIVERY" && deliveryFeeData && !deliveryFeeData.is_deliverable)}
            className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm"
          >
            {createOrder.isPending ? (
              <>
                <FiLoader className="w-5 h-5 animate-spin" />
                Memproses...
              </>
            ) : (
              `Bayar ${CURRENCY_FORMATTER.format(total)}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
