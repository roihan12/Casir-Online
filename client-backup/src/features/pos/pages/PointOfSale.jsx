import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@features/auth/hooks/useAuth.js";
import { useCabang } from "@features/cabang/hooks/useCabang";
import { usePOSContext } from "../context";
import { 
  usePOSCart, 
  usePOSProducts, 
  usePOSPayment,
  usePOSKeyboard,
  usePOSReceipt,
  formatCurrency as formatCurrencyHook
} from "../hooks";
import {
  SearchBar,
  ProductsSection,
  CategoriesSection,
  CartSection,
  ReceiptModal,
  KeyboardShortcutsHelp,
  POSHeader,
  PaymentModal,
  BranchSelectorModal,
  CustomerSelectorModal,
  LoadingSpinner,
  EmptyState,
  ErrorMessage,
} from "../components";
import toast from "react-hot-toast";

const formatCurrency = formatCurrencyHook;

const PointOfSale = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedCabang } = useCabang();
  const searchInputRef = useRef(null);
  
  // Context state
  const {
    selectedBranch,
    selectedCustomer,
    saleMode,
    discount,
    discountType,
    showCustomerSearch,
    showBranchSelector,
    showPaymentModal,
    showReceiptModal,
    showKeyboardHelp,
    receiptData,
    searchHistory,
    paymentAmount,
    user: contextUser,
    actions,
  } = usePOSContext();

  // Set branch from Cabang context
  useEffect(() => {
    if (selectedCabang && !selectedBranch) {
      actions.setSelectedBranch(selectedCabang);
    }
  }, [selectedCabang, selectedBranch, actions]);

  // Custom hooks
  const {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    validateCart,
  } = usePOSCart(saleMode);

  const {
    products,
    categories,
    loading,
    selectedCategory,
    setSelectedCategory,
    showFrequentProducts,
    setShowFrequentProducts,
    frequentProducts,
    fetchProducts,
    fetchFrequentProducts,
    searchProducts,
  } = usePOSProducts(selectedBranch?.id || user?.branchId);

  const {
    processPayment,
    handleQrisPayment,
    handleCashPayment,
    receiptData: paymentReceiptData,
    showReceipt: showPaymentReceipt,
    closeReceipt: closePaymentReceipt,
  } = usePOSPayment();

  const {
    printReceipt,
    downloadReceiptPDF,
    formatReceiptDate,
    formatReceiptTime,
  } = usePOSReceipt();

  // Local state
  const [productSearch, setProductSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [tax, setTax] = useState(0);
  const [branches, setBranches] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Calculate totals
  useEffect(() => {
    if (cart.length === 0) {
      setTotalAmount(0);
      setTax(0);
      return;
    }

    const subtotal = cart.reduce((sum, item) => {
      const price = saleMode === "wholesale" 
        ? (item.wholesalePrice || item.wholesale_price || item.price || item.retail_price || 0)
        : (item.price || item.retail_price || item.retailPrice || 0);
      return sum + (price * (item.quantity || 0));
    }, 0);

    let discountAmount = 0;
    if (discountType === "percentage") {
      discountAmount = subtotal * (discount / 100);
    } else {
      discountAmount = discount;
    }

    const taxAmount = (subtotal - discountAmount) * 0.1;
    setTotalAmount(subtotal - discountAmount + taxAmount);
    setTax(taxAmount);
  }, [cart, saleMode, discount, discountType]);

  // Keyboard shortcuts
  usePOSKeyboard({
    onFocusSearch: () => searchInputRef.current?.focus(),
    onShowCategories: () => setSelectedCategory(null),
    onShowHelp: () => actions.setShowKeyboardHelp(true),
    onCloseModals: () => {
      actions.setShowCustomerSearch(false);
      actions.setShowBranchSelector(false);
      actions.setShowPaymentModal(false);
      actions.setShowReceiptModal(false);
      actions.setShowKeyboardHelp(false);
      setShowAutocomplete(false);
      setShowSearchHistory(false);
    },
    onSelectCategory: (index) => {
      if (categories && categories[index]) {
        setSelectedCategory(categories[index]);
      }
    },
    onProcessCashPayment: () => processPayment({
      cartItems: cart,
      customer: selectedCustomer,
      branch: selectedBranch,
      user: contextUser,
      saleMode,
      discount,
      discountType,
      paymentMethod: 'TUNAI',
      amountPaid: totalAmount,
    }),
    onProcessQrisPayment: () => handleQrisPayment({
      cartItems: cart,
      customer: selectedCustomer,
      branch: selectedBranch,
      user: contextUser,
      saleMode,
      discount,
      discountType,
    }),
    onToggleMode: () => {
      const newMode = saleMode === "retail" ? "wholesale" : "retail";
      actions.setSaleMode(newMode);
      if (newMode === "wholesale" && !selectedCustomer) {
        actions.setShowCustomerSearch(true);
        toast.error("Untuk grosir, pelanggan harus dipilih", { icon: "⚠️" });
      }
    },
    onSelectCustomer: () => actions.setShowCustomerSearch(!showCustomerSearch),
    onSelectBranch: () => actions.setShowBranchSelector(!showBranchSelector),
    onClearSearch: () => {
      setProductSearch("");
      setSearchResults([]);
      setShowAutocomplete(false);
    },
  });

  // Handle product search
  const handleSearch = async (query) => {
    setProductSearch(query);
    
    if (query.trim()) {
      actions.addToSearchHistory(query);
      const results = await searchProducts(query);
      setSearchResults(results);
      setShowAutocomplete(true);
    } else {
      setSearchResults([]);
      setShowAutocomplete(false);
    }
  };

  // Handle add to cart from search
  const handleAddToCart = (product) => {
    addToCart(product);
    setSearchResults([]);
    setShowAutocomplete(false);
    setProductSearch("");
  };

  // Handle payment - open payment modal
  const handlePaymentClick = () => {
    if (saleMode === "wholesale" && !selectedCustomer) {
      toast.error("Untuk grosir, pelanggan harus dipilih", { icon: "⚠️" });
      actions.setShowCustomerSearch(true);
      return;
    }

    if (cart.length === 0) {
      toast.error("Keranjang belanja kosong", { icon: "⚠️" });
      return;
    }

    actions.setShowPaymentModal(true);
  };

  // Process actual payment after modal confirmation
  const processActualPayment = async (paymentData) => {
    setPaymentLoading(true);
    
    try {
      const result = await processPayment({
        cartItems: cart,
        customer: selectedCustomer,
        branch: selectedBranch,
        user: contextUser,
        saleMode,
        discount,
        discountType,
        paymentMethod: paymentData.paymentMethod,
        amountPaid: paymentData.amountPaid || totalAmount,
        dateOfSupply: paymentData.dateOfSupply,
        multiPay: paymentData.multiPay,
      });

      if (result.success) {
        clearCart();
        actions.resetState();
        setProductSearch("");
        setSearchResults([]);
        actions.setShowPaymentModal(false);
      }
    } catch (error) {
      toast.error("Gagal memproses pembayaran", { icon: "⚠️" });
    } finally {
      setPaymentLoading(false);
    }
  };

  // Handle receipt print
  const handlePrintReceipt = () => {
    const receiptElement = document.getElementById("receipt-content");
    if (receiptElement) {
      printReceipt(receiptElement);
    }
  };

  // Handle receipt download
  const handleDownloadReceipt = () => {
    downloadReceiptPDF(receiptData || paymentReceiptData);
  };

  // Calculate subtotal
  const subtotal = cart.reduce((sum, item) => {
    const price = saleMode === "wholesale" 
      ? (item.wholesalePrice || item.wholesale_price || item.price || item.retail_price || 0)
      : (item.price || item.retail_price || item.retailPrice || 0);
    return sum + (price * (item.quantity || 0));
  }, 0);

  // Calculate discount amount
  const discountAmount = discountType === "percentage" 
    ? subtotal * (discount / 100)
    : discount;

  // Handle mode change
  const handleModeChange = (mode) => {
    actions.setSaleMode(mode);
    if (mode === "wholesale" && !selectedCustomer) {
      actions.setShowCustomerSearch(true);
      toast.error("Untuk grosir, pelanggan harus dipilih", { icon: "⚠️" });
    }
  };

  // Handle customer selection
  const handleSelectCustomer = (customer) => {
    actions.setSelectedCustomer(customer);
    actions.setShowCustomerSearch(false);
    toast.success(`Pelanggan ${customer.name} dipilih`);
  };

  // Handle customer removal
  const handleRemoveCustomer = () => {
    actions.setSelectedCustomer(null);
    toast.success("Pelanggan dihapus");
  };

  // Handle clear search history
  const handleClearHistory = () => {
    actions.clearSearchHistory();
    setShowSearchHistory(false);
  };

  return (
    <div className="bg-gray-50 h-screen flex flex-col">
      {/* Header */}
      <POSHeader
        branchName={selectedBranch?.name}
        userName={contextUser?.name || user?.name}
        onOpenHelp={() => actions.setShowKeyboardHelp(true)}
        onOpenSettings={() => navigate('/settings')}
        onLogout={() => navigate('/logout')}
        cartItemCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left side - Products */}
        <div className="flex-1 p-4 overflow-y-auto">
        <SearchBar
          productSearch={productSearch}
          setProductSearch={setProductSearch}
          searchHistory={searchHistory}
          searchResults={searchResults}
          showAutocomplete={showAutocomplete}
          setShowAutocomplete={setShowAutocomplete}
          showSearchHistory={showSearchHistory}
          setShowSearchHistory={setShowSearchHistory}
          addToCart={handleAddToCart}
          isLoading={loading}
          clearHistory={handleClearHistory}
          inputRef={searchInputRef}
        />

        <CategoriesSection
          categories={categories || []}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categoryColors={{}}
          showFrequentProducts={showFrequentProducts}
          fetchFrequentProducts={fetchFrequentProducts}
        />

        <ProductsSection
          products={showFrequentProducts ? frequentProducts : products}
          addToCart={addToCart}
          loading={loading}
          categories={categories || []}
          categoryColors={{}}
          isFrequentProductsView={showFrequentProducts}
        />
      </div>

      {/* Right side - Cart */}
      <CartSection
        cart={cart}
        updateQuantity={updateQuantity}
        removeFromCart={removeFromCart}
        saleMode={saleMode}
        handleModeChange={handleModeChange}
        customer={selectedCustomer}
        setShowCustomerSearch={actions.setShowCustomerSearch}
        totalAmount={totalAmount}
        tax={tax}
        discount={discount}
        setDiscount={actions.setDiscount}
        discountType={discountType}
        setDiscountType={actions.setDiscountType}
        processPayment={handlePaymentClick}
        handleQrisPayment={handlePaymentClick}
        subtotal={subtotal}
        discountAmount={discountAmount}
      />

      {/* Modals */}
      <KeyboardShortcutsHelp
        show={showKeyboardHelp}
        setShow={actions.setShowKeyboardHelp}
      />

      <BranchSelectorModal
        show={showBranchSelector}
        onClose={() => actions.setShowBranchSelector(false)}
        branches={branches}
        selectedBranch={selectedBranch}
        onSelectBranch={(branch) => actions.setSelectedBranch(branch)}
      />

      <CustomerSelectorModal
        show={showCustomerSearch}
        onClose={() => actions.setShowCustomerSearch(false)}
        customers={customers}
        selectedCustomer={selectedCustomer}
        onSelectCustomer={handleSelectCustomer}
        onCreateNewCustomer={() => navigate('/customers/create')}
        loading={loading}
      />

      {showReceiptModal && receiptData && (
        <ReceiptModal
          show={showReceiptModal}
          onClose={actions.setShowReceiptModal}
          data={receiptData}
          onPrint={handlePrintReceipt}
          onDownload={handleDownloadReceipt}
        />
      )}

      {showPaymentReceipt && paymentReceiptData && (
        <ReceiptModal
          show={showPaymentReceipt}
          onClose={closePaymentReceipt}
          data={paymentReceiptData}
          onPrint={handlePrintReceipt}
          onDownload={handleDownloadReceipt}
        />
      )}

      <PaymentModal
        show={showPaymentModal}
        onClose={() => actions.setShowPaymentModal(false)}
        totalAmount={totalAmount}
        subtotal={subtotal}
        discountAmount={discountAmount}
        tax={tax}
        onProcessPayment={processActualPayment}
        loading={paymentLoading}
      />
      </div>
    </div>
  );
};

export default PointOfSale;