import { useState, useCallback, useEffect, useRef } from "react";

const CART_STORAGE_KEY = "casir_catalog_cart";

/**
 * Load cart from localStorage (used for lazy init)
 */
const loadCartFromStorage = (cabangId) => {
  if (!cabangId) return [];
  try {
    const stored = localStorage.getItem(`${CART_STORAGE_KEY}_${cabangId}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load cart:", e);
  }
  return [];
};

/**
 * useCart — manages shopping cart with localStorage persistence
 * Uses lazy initialization so cart data is available on first render
 */
export const useCart = (cabangId) => {
  // Lazy init: read from localStorage immediately, not via useEffect
  const [items, setItems] = useState(() => loadCartFromStorage(cabangId));
  const initialized = useRef(false);

  // Re-load if cabangId changes (e.g. user switches branch)
  useEffect(() => {
    if (!cabangId) return;
    setItems(loadCartFromStorage(cabangId));
    initialized.current = true;
  }, [cabangId]);

  // Save cart to localStorage (skip first render to avoid overwriting)
  useEffect(() => {
    if (!cabangId) return;
    if (!initialized.current) {
      initialized.current = true;
      return;
    }
    localStorage.setItem(
      `${CART_STORAGE_KEY}_${cabangId}`,
      JSON.stringify(items)
    );
  }, [items, cabangId]);

  const addItem = useCallback(
    (product) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.produk_id === product.produk_id);
        if (existing) {
          return prev.map((i) =>
            i.produk_id === product.produk_id
              ? { ...i, jumlah: i.jumlah + 1 }
              : i
          );
        }
        return [
          ...prev,
          {
            produk_id: product.produk_id,
            nama_produk: product.nama_produk,
            harga: product.harga_jual,
            image: product.images?.[0]?.file_path || null,
            jumlah: 1,
            stok: product.stok,
            catatan: "",
          },
        ];
      });
    },
    []
  );

  const removeItem = useCallback((produkId) => {
    setItems((prev) => prev.filter((i) => i.produk_id !== produkId));
  }, []);

  const updateQuantity = useCallback((produkId, jumlah) => {
    if (jumlah < 1) return;
    setItems((prev) =>
      prev.map((i) => (i.produk_id === produkId ? { ...i, jumlah } : i))
    );
  }, []);

  const updateNote = useCallback((produkId, catatan) => {
    setItems((prev) =>
      prev.map((i) => (i.produk_id === produkId ? { ...i, catatan } : i))
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    if (cabangId) {
      localStorage.removeItem(`${CART_STORAGE_KEY}_${cabangId}`);
    }
  }, [cabangId]);

  const subtotal = items.reduce((sum, i) => sum + i.harga * i.jumlah, 0);
  const totalItems = items.reduce((sum, i) => sum + i.jumlah, 0);

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    updateNote,
    clearCart,
    subtotal,
    totalItems,
    isEmpty: items.length === 0,
  };
};
