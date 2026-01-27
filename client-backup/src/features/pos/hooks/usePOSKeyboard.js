import { useCallback, useEffect } from "react";

export const usePOSKeyboard = ({
  onFocusSearch,
  onShowCategories,
  onShowHelp,
  onCloseModals,
  onSelectCategory,
  onProcessCashPayment,
  onProcessQrisPayment,
  onToggleMode,
  onSelectCustomer,
  onSelectBranch,
  onClearSearch,
}) => {
  const handleKeyDown = useCallback((event) => {
    // Don't trigger shortcuts when typing in inputs
    if (
      event.target.tagName === "INPUT" ||
      event.target.tagName === "TEXTAREA" ||
      event.target.isContentEditable
    ) {
      // Allow Escape to clear search or close modals
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseModals();
      }
      return;
    }

    switch (event.key) {
      case "F1":
        event.preventDefault();
        onShowHelp();
        break;

      case "F2":
        event.preventDefault();
        onFocusSearch();
        break;

      case "F3":
        event.preventDefault();
        onShowCategories();
        break;

      case "Escape":
        event.preventDefault();
        onCloseModals();
        break;

      case "1":
      case "2":
      case "3":
      case "4":
      case "5":
      case "6":
      case "7":
      case "8":
      case "9":
        event.preventDefault();
        onSelectCategory(parseInt(event.key) - 1);
        break;

      default:
        // Handle Ctrl+ combinations
        if (event.ctrlKey || event.metaKey) {
          switch (event.key.toLowerCase()) {
            case "p":
              event.preventDefault();
              onProcessCashPayment();
              break;

            case "q":
              event.preventDefault();
              onProcessQrisPayment();
              break;

            case "m":
              event.preventDefault();
              onToggleMode();
              break;

            case "c":
              event.preventDefault();
              onSelectCustomer();
              break;

            case "b":
              event.preventDefault();
              onSelectBranch();
              break;

            default:
              break;
          }
        }
        break;
    }
  }, [
    onFocusSearch,
    onShowCategories,
    onShowHelp,
    onCloseModals,
    onSelectCategory,
    onProcessCashPayment,
    onProcessQrisPayment,
    onToggleMode,
    onSelectCustomer,
    onSelectBranch,
    onClearSearch,
  ]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    handleKeyDown,
  };
};