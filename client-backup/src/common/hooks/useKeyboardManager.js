import { useEffect, useCallback } from "react";

/**
 * Hook untuk mengelola keyboard shortcuts di aplikasi
 * @param {Object} dependencies - Object berisi state dan setter yang dibutuhkan
 * @returns {Object} fungsi-fungsi terkait keyboard
 */
export default function useKeyboardManager(dependencies) {
  const {
    cart = [],
    isProcessingTransaction = false,
    searchInputRef,
    categories = [],
    isLoadingCategories = false,
    selectedCategory,
    setSelectedCategory,
    saleMode,
    handleModeChange,
    processPayment,
    setProductSearch,
    setShowCategoryList,
    modalManager,
  } = dependencies;

  /**
   * Fungsi untuk menangani pembayaran tunai
   */
  const handleCashPayment = useCallback(() => {
    if (
      cart.length > 0 &&
      !isProcessingTransaction &&
      !modalManager.isAnyModalOpen()
    ) {
      processPayment();
    }
  }, [cart, isProcessingTransaction, processPayment, modalManager]);

  /**
   * Fungsi untuk mengatur mode penjualan (retail/grosir)
   */
  const toggleSaleMode = useCallback(() => {
    if (!modalManager.isAnyModalOpen()) {
      handleModeChange(saleMode === "retail" ? "wholesale" : "retail");
    }
  }, [saleMode, handleModeChange, modalManager]);

  /**
   * Fungsi untuk fokus ke pencarian produk
   */
  const focusSearch = useCallback(() => {
    setProductSearch("");
    if (searchInputRef?.current) {
      searchInputRef.current.focus();
    }
  }, [searchInputRef, setProductSearch]);

  /**
   * Fungsi untuk menampilkan/sembunyikan kategori
   */
  const toggleCategories = useCallback(() => {
    if (!modalManager.isAnyModalOpen()) {
      setShowCategoryList((prev) => !prev);
    }
  }, [setShowCategoryList, modalManager]);

  /**
   * Fungsi untuk memilih kategori berdasarkan indeks
   */
  const selectCategory = useCallback(
    (index) => {
      if (
        !isLoadingCategories &&
        categories[index] &&
        !modalManager.isAnyModalOpen()
      ) {
        setSelectedCategory(categories[index].id);
      }
    },
    [categories, isLoadingCategories, setSelectedCategory, modalManager]
  );

  /**
   * Terapkan event listener untuk keyboard shortcuts global
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Shortcut hanya berlaku jika tidak sedang mengetik di input
      const isInputFocused =
        document.activeElement.tagName === "INPUT" ||
        document.activeElement.tagName === "TEXTAREA";

      // Shortcuts F1, F2, etc tidak memerlukan modifikasi tambahan
      if (e.key === "F1") {
        e.preventDefault();
        modalManager.openModal("shortcutsHelp");
        return;
      }

      if (e.key === "F2") {
        e.preventDefault();
        focusSearch();
        return;
      }

      if (e.key === "F3") {
        e.preventDefault();
        toggleCategories();
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        modalManager.closeAllModals();
        return;
      }

      // Shortcuts dengan Ctrl
      if (e.ctrlKey && !isInputFocused) {
        switch (e.key.toLowerCase()) {
          case "p":
            e.preventDefault();
            handleCashPayment();
            break;
          case "m":
            e.preventDefault();
            toggleSaleMode();
            break;
          case "c":
            e.preventDefault();
            if (!modalManager.isAnyModalOpen()) {
              modalManager.openModal("customerSearch");
            }
            break;
          case "b":
            e.preventDefault();
            if (!modalManager.isAnyModalOpen()) {
              modalManager.openModal("branchSelector");
            }
            break;
          default:
            break;
        }
      }

      // Shortcuts untuk kategori 1-9
      if (!isInputFocused && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        const num = parseInt(e.key);
        if (!isNaN(num) && num >= 1 && num <= 9) {
          e.preventDefault();
          selectCategory(num - 1);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    focusSearch,
    toggleCategories,
    selectCategory,
    handleCashPayment,
    toggleSaleMode,
    modalManager,
  ]);

  return {
    handleCashPayment,
    toggleSaleMode,
    focusSearch,
    toggleCategories,
    selectCategory,
  };
}
