import { useEffect } from "react";

/**
 * Custom hook untuk mengelola keyboard shortcuts
 *
 * @param {Object} shortcuts - Object dengan key sebagai handler name dan value sebagai fungsi callback
 * @param {Array} dependencies - Array of dependencies untuk useEffect
 */
const useKeyboardShortcuts = (shortcuts, dependencies = []) => {
  useEffect(() => {
    // Handler untuk keyboard events
    const handleKeyDown = (event) => {
      // Skip jika user sedang mengetik di input, textarea, atau select
      if (
        event.target.tagName === "INPUT" ||
        event.target.tagName === "TEXTAREA" ||
        event.target.tagName === "SELECT"
      ) {
        return;
      }

      // Definisi shortcuts
      const shortcutHandlers = {
        // Shortcut untuk fokus ke pencarian produk (/)
        searchProduct: () => {
          if (event.key === "/") {
            event.preventDefault();
            const searchInput = document.getElementById("product-search");
            if (searchInput) {
              searchInput.focus();
            }
          }
        },

        // Shortcut untuk proses pembayaran (F2)
        processPayment: () => {
          if (event.key === "F2") {
            event.preventDefault();
            if (shortcuts.processPayment) {
              shortcuts.processPayment();
            }
          }
        },

        // Shortcut untuk reset pencarian (Escape)
        resetSearch: () => {
          if (event.key === "Escape") {
            event.preventDefault();
            if (shortcuts.resetSearch) {
              shortcuts.resetSearch();
            }
          }
        },

        // Shortcut untuk menampilkan kategori (F3)
        toggleCategories: () => {
          if (event.key === "F3") {
            event.preventDefault();
            if (shortcuts.toggleCategories) {
              shortcuts.toggleCategories();
            }
          }
        },

        // Shortcut untuk mempercepat navigasi tab kategori (1-9)
        navigateCategories: () => {
          // Tombol 1-9 untuk memilih kategori 1-9
          if (/^[1-9]$/.test(event.key)) {
            event.preventDefault();
            const categoryIndex = parseInt(event.key) - 1;
            if (shortcuts.selectCategory) {
              shortcuts.selectCategory(categoryIndex);
            }
          }
        },

        // Shortcut untuk toggle mode retail/wholesale (F4)
        toggleMode: () => {
          if (event.key === "F4") {
            event.preventDefault();
            if (shortcuts.toggleMode) {
              shortcuts.toggleMode();
            }
          }
        },

        // Shortcut untuk pilih pelanggan (F5)
        selectCustomer: () => {
          if (event.key === "F5") {
            event.preventDefault();
            if (shortcuts.selectCustomer) {
              shortcuts.selectCustomer();
            }
          }
        },

        // Shortcut untuk pembayaran QRIS (F6)
        qrisPayment: () => {
          if (event.key === "F6") {
            event.preventDefault();
            if (shortcuts.qrisPayment) {
              shortcuts.qrisPayment();
            }
          }
        },

        // Shortcut untuk pilih cabang (F7)
        selectBranch: () => {
          if (event.key === "F7") {
            event.preventDefault();
            if (shortcuts.selectBranch) {
              shortcuts.selectBranch();
            }
          }
        },

        // Custom shortcuts yang disediakan dari props
        ...shortcuts,
      };

      // Execute semua handler
      Object.values(shortcutHandlers).forEach((handler) => {
        if (typeof handler === "function") {
          handler();
        }
      });
    };

    // Add event listener
    window.addEventListener("keydown", handleKeyDown);

    // Cleanup event listener
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [...dependencies]);
};

export default useKeyboardShortcuts;
