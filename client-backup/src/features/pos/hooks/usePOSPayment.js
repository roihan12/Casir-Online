import { useState, useCallback } from "react";
import posService from "../../transactions/services/transaksiService";

export const usePOSPayment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [receiptData, setReceiptData] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);

  // Calculate totals
  const calculateTotals = useCallback(
    (cartItems, saleMode, discount, discountType) => {
      const subtotal = cartItems.reduce((sum, item) => {
        const price =
          saleMode === "wholesale" ? item.wholesale_price : item.retail_price;
        return sum + price * item.quantity;
      }, 0);

      const discountAmount =
        discountType === "percentage" ? subtotal * (discount / 100) : discount;

      const afterDiscount = subtotal - discountAmount;
      const tax = afterDiscount * 0.1; // 10% tax
      const total = afterDiscount + tax;

      return {
        subtotal,
        discountAmount,
        tax,
        total,
      };
    },
    [],
  );

  // Process payment
  const processPayment = useCallback(
    async ({
      cartItems,
      customer,
      branch,
      user,
      saleMode,
      discount,
      discountType,
      paymentMethod,
      amountPaid,
    }) => {
      setLoading(true);
      setError(null);

      try {
        const totals = calculateTotals(
          cartItems,
          saleMode,
          discount,
          discountType,
        );

        const transactionData = {
          cabangId: branch.id,
          customerId: customer?.id || null,
          userId: user.id,
          jenisTransaksi: saleMode === "wholesale" ? "GROSIR" : "RETAIL",
          subtotal: totals.subtotal,
          discount_amount: totals.discountAmount,
          tax_amount: totals.tax,
          total_amount: totals.total,
          status_pembayaran: "LUNAS",
          metode_pembayaran: paymentMethod,
          items: cartItems.map((item) => ({
            produkId: item.id,
            namaProduk: item.name,
            hargaSatuan:
              saleMode === "wholesale"
                ? item.wholesale_price
                : item.retail_price,
            jumlah: item.quantity,
            subtotal:
              item.quantity *
              (saleMode === "wholesale"
                ? item.wholesale_price
                : item.retail_price),
          })),
        };

        const response = await posService.createTransaksi(transactionData);

        // Prepare receipt data
        const receiptInfo = {
          transaction: {
            id: response.data.id,
            tanggal: response.data.createdAt,
            subtotal: totals.subtotal,
            discount_amount: totals.discountAmount,
            tax_amount: totals.tax,
            total_amount: totals.total,
          },
          payment: {
            metode_pembayaran: paymentMethod,
            jumlah_bayar: amountPaid,
            jumlah_kembali: amountPaid - totals.total,
          },
          items: cartItems.map((item) => ({
            name: item.name,
            price:
              saleMode === "wholesale"
                ? item.wholesale_price
                : item.retail_price,
            quantity: item.quantity,
          })),
          customer,
          branch,
        };

        setReceiptData(receiptInfo);
        setShowReceipt(true);

        return { success: true, data: response.data };
      } catch (err) {
        console.error("Payment processing error:", err);
        setError(err.response?.data?.message || "Gagal memproses pembayaran");
        return { success: false, error: err };
      } finally {
        setLoading(false);
      }
    },
    [calculateTotals],
  );

  // Handle QRIS payment
  const handleQrisPayment = useCallback(
    async (params) => {
      return processPayment({
        ...params,
        paymentMethod: "QRIS",
      });
    },
    [processPayment],
  );

  // Handle cash payment
  const handleCashPayment = useCallback(
    async (params) => {
      return processPayment({
        ...params,
        paymentMethod: "TUNAI",
      });
    },
    [processPayment],
  );

  // Close receipt modal
  const closeReceipt = useCallback(() => {
    setShowReceipt(false);
    setReceiptData(null);
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setReceiptData(null);
    setShowReceipt(false);
  }, []);

  return {
    loading,
    error,
    receiptData,
    showReceipt,
    processPayment,
    handleQrisPayment,
    handleCashPayment,
    closeReceipt,
    reset,
    calculateTotals,
  };
};
