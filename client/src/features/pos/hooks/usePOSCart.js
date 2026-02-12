import { useState, useCallback, useEffect } from "react";

// Utility function to format currency
export const formatCurrency = (amount) => {
  const numAmount = parseFloat(amount) || 0;
  return `Rp${numAmount.toLocaleString("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

export const usePOSCart = (saleMode = "retail") => {
  const [cart, setCart] = useState([]);

  // Calculate totals
  const calculateTotals = useCallback(() => {
    const subtotal = cart.reduce((sum, item) => {
      const price =
        saleMode === "wholesale"
          ? item.wholesalePrice || item.wholesale_price || item.price || 0
          : item.price || item.retailPrice || item.retail_price || 0;
      return sum + price * (item.quantity || 0);
    }, 0);

    return {
      subtotal,
      itemCount: cart.reduce((sum, item) => sum + (item.quantity || 0), 0),
      uniqueItems: cart.length,
    };
  }, [cart, saleMode]);

  // Add item to cart
  const addToCart = useCallback((product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);

      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: (item.quantity || 0) + 1 }
            : item,
        );
      }

      return [
        ...prevCart,
        {
          id: product.id,
          name:
            product.produkMaster?.namaProduk ||
            product.name ||
            "Unknown Product",
          // Support both snake_case and camelCase property names
          retailPrice:
            product.hargaJual ||
            product.retail_price ||
            product.retailPrice ||
            product.price ||
            0,
          wholesalePrice:
            product.hargaGrosir ||
            product.wholesale_price ||
            product.wholesalePrice ||
            product.hargaJual ||
            product.price ||
            0,
          price: product.hargaJual || product.retail_price || product.retailPrice || product.price || 0, // Default retail price
          quantity: 1,
          stock: product.stok || 0,
          image: product.produkMaster?.produkImage?.[0]?.url || null,
        },
      ];
    });
  }, []);

  // Update quantity
  const updateQuantity = useCallback((itemId, newQuantity) => {
    if (newQuantity < 1) return;

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item,
      ),
    );
  }, []);

  // Remove from cart
  const removeFromCart = useCallback((itemId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== itemId));
  }, []);

  // Clear cart
  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Get cart items for transaction
  const getCartItems = useCallback(() => {
    return cart.map((item) => ({
      produkId: item.id,
      namaProduk: item.name,
      hargaSatuan:
        saleMode === "wholesale"
          ? item.wholesalePrice || item.wholesale_price || item.price || 0
          : item.price || item.retailPrice || item.retail_price || 0,
      jumlah: item.quantity || 0,
      subtotal:
        (item.quantity || 0) *
        (saleMode === "wholesale"
          ? item.wholesalePrice || item.wholesale_price || item.price || 0
          : item.price || item.retailPrice || item.retail_price || 0),
    }));
  }, [cart, saleMode]);

  // Validate cart
  const validateCart = useCallback(() => {
    const invalidItems = cart.filter((item) => (item.quantity || 0) > (item.stock || 0));
    if (invalidItems.length > 0) {
      return {
        valid: false,
        message: `Stok tidak cukup untuk ${invalidItems.length} produk`,
        invalidItems,
      };
    }
    return { valid: true };
  }, [cart]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("posCart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error("Failed to load cart from localStorage:", error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("posCart", JSON.stringify(cart));
  }, [cart]);

  return {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartItems,
    validateCart,
    calculateTotals,
    ...calculateTotals(),
  };
};