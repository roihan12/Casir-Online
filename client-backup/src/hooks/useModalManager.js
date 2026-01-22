import { useCallback } from "react";

/**
 * Hook untuk mengelola berbagai modal di aplikasi
 * @param {Object} modalStates - Object berisi state dan setState untuk modal
 * @returns {Object} fungsi untuk mengelola modal
 */
export default function useModalManager(modalStates) {
  // Destructure modal states dan setters
  const {
    showBranchSelector,
    setShowBranchSelector,
    showCustomerSearch,
    setShowCustomerSearch,
    showPaymentModal,
    setShowPaymentModal,
    showReceiptModal,
    setShowReceiptModal,
    showShortcutsHelp,
    setShowShortcutsHelp,
    showAutocomplete,
    setShowAutocomplete,
    showSearchHistory,
    setShowSearchHistory,
    // Tambahkan modal lain jika diperlukan
  } = modalStates;

  /**
   * Fungsi untuk menutup semua modal
   */
  const closeAllModals = useCallback(() => {
    setShowBranchSelector(false);
    setShowCustomerSearch(false);
    setShowPaymentModal(false);
    setShowReceiptModal(false);
    setShowShortcutsHelp(false);
    setShowAutocomplete(false);
    setShowSearchHistory(false);
  }, [
    setShowBranchSelector,
    setShowCustomerSearch,
    setShowPaymentModal,
    setShowReceiptModal,
    setShowShortcutsHelp,
    setShowAutocomplete,
    setShowSearchHistory,
  ]);

  /**
   * Fungsi untuk membuka suatu modal sambil menutup yang lain
   */
  const openModal = useCallback(
    (modalName) => {
      // Tutup semua modal dulu
      closeAllModals();

      // Buka modal yang diminta
      switch (modalName) {
        case "branchSelector":
          setShowBranchSelector(true);
          break;
        case "customerSearch":
          setShowCustomerSearch(true);
          break;
        case "paymentModal":
          setShowPaymentModal(true);
          break;
        case "receiptModal":
          setShowReceiptModal(true);
          break;
        case "shortcutsHelp":
          setShowShortcutsHelp(true);
          break;
        case "autocomplete":
          setShowAutocomplete(true);
          break;
        case "searchHistory":
          setShowSearchHistory(true);
          break;
        default:
          break;
      }
    },
    [
      closeAllModals,
      setShowBranchSelector,
      setShowCustomerSearch,
      setShowPaymentModal,
      setShowReceiptModal,
      setShowShortcutsHelp,
      setShowAutocomplete,
      setShowSearchHistory,
    ]
  );

  /**
   * Cek apakah ada modal yang sedang terbuka
   */
  const isAnyModalOpen = useCallback(() => {
    return (
      showBranchSelector ||
      showCustomerSearch ||
      showPaymentModal ||
      showReceiptModal ||
      showShortcutsHelp ||
      showAutocomplete ||
      showSearchHistory
    );
  }, [
    showBranchSelector,
    showCustomerSearch,
    showPaymentModal,
    showReceiptModal,
    showShortcutsHelp,
    showAutocomplete,
    showSearchHistory,
  ]);

  return {
    closeAllModals,
    openModal,
    isAnyModalOpen,
  };
}
