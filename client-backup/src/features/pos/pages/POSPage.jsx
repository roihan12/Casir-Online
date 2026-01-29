
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  Store,
  MapPin,
  Maximize,
  Minimize,
  Keyboard,
  X,
  Plus,
  ChevronDown,
  ShoppingCart
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../features/auth/hooks/useAuth.js";
import { useCabang, GLOBAL_CABANG_ID } from "@features/cabang/hooks/useCabang";
import toast, { Toaster } from "react-hot-toast";
import {
  useProductsByBranch,
  useCustomerSearch,
  useCompleteTransaction,
  useAddPayment,
  useQrisTransaction,
  useCategories,
  useProductsByCategory,
  usePopularProducts,
  useProductSearch,
  useSearchHistory,
} from "../../transactions/hooks/usePosQueries";
import useKeyboardShortcuts from "@common/hooks/useKeyboardShortcuts";
import useFrequentProducts from "../../products/hooks/useFrequentProducts"
import useModalManager from "@common/hooks/useModalManager";
import useKeyboardManager from "@common/hooks/useKeyboardManager";
import useDebounce from "@common/hooks/useDebounce";
import { useActiveShift } from "../../shifts/hooks/useShiftQueries";

// Components
import ProductsSection from "../components/products/ProductsSection";
import CategoriesSection from "../components/products/CategoriesSection";
import SearchBar from "../components/search/SearchBar";
import CartSection from "../components/cart/CartSection";
import ReceiptModal from "../components/receipt/ReceiptModal";
import KeyboardShortcutsHelp from "../components/modals/KeyboardShortcutsHelp";
import PaymentModal from "../components/payment/PaymentModal";

// Color mapping for categories
const categoryColors = [
  "bg-gradient-to-r from-blue-500 to-blue-600 text-white", // Kategori 1
  "bg-gradient-to-r from-green-500 to-green-600 text-white", // Kategori 2
  "bg-gradient-to-r from-purple-500 to-purple-600 text-white", // Kategori 3
  "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white", // Kategori 4
  "bg-gradient-to-r from-red-500 to-red-600 text-white", // Kategori 5
  "bg-gradient-to-r from-pink-500 to-pink-600 text-white", // Kategori 6
  "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white", // Kategori 7
  "bg-gradient-to-r from-teal-500 to-teal-600 text-white", // Kategori 8
  "bg-gradient-to-r from-orange-500 to-orange-600 text-white", // Kategori 9
];

// Formatting helper (for internal usage if needed)
const formatCurrency = (amount) => {
  const numAmount = parseFloat(amount) || 0;
  return `Rp${numAmount.toLocaleString("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};


const POSPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cabangList, selectedCabang, setSelectedCabangById } = useCabang();
  const searchInputRef = useRef(null);
  const posContainerRef = useRef(null); // Ref untuk container fullscreen

  // State untuk fullscreen mode
  const [isFullscreen, setIsFullscreen] = useState(false);

  // State for branch selection
  const [showBranchSelector, setShowBranchSelector] = useState(false);
  const [branchSearchQuery, setBranchSearchQuery] = useState("");
  const [filteredBranches, setFilteredBranches] = useState([]);
  const [currentBranch, setCurrentBranch] = useState(null);

  // State for category
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showCategoryList, setShowCategoryList] = useState(false);

  // State for sale mode
  const [saleMode, setSaleMode] = useState("retail"); // "retail" or "wholesale"

  // State for customer
  const [customer, setCustomer] = useState(null);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const debouncedCustomerSearch = useDebounce(customerSearchQuery, 500);

  // State for autocomplete
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [showSearchHistory, setShowSearchHistory] = useState(false);

  // State for cart
  const [cart, setCart] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [tax, setTax] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState("percentage"); // "percentage" or "fixed"
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("TUNAI");
  
  // State untuk menyimpan transaksi terakhir
  const [lastTransactionId, setLastTransactionId] = useState(null);
  const [lastTransactionData, setLastTransactionData] = useState(null);
  
  // State untuk receipt/struk
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  // State for shortcuts help
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  // State for products
  const [productSearch, setProductSearch] = useState("");
  const debouncedProductSearch = useDebounce(productSearch, 500);
  const [filteredProducts, setFilteredProducts] = useState([]);

  // Hook untuk search history
  const { searchHistory, addToHistory, clearHistory } = useSearchHistory(
    currentBranch?.id
  );

  // React Query hooks for products and categories
  const {
    data: productsData,
    isLoading: isLoadingProducts,
    isError: isProductsError,
    error: productsError,
  } = useProductsByBranch(currentBranch?.id, {
    enabled: !!currentBranch?.id && !selectedCategory,
  });

  const { data: categoriesData, isLoading: isLoadingCategories } =
    useCategories();

  const { data: categoryProductsData, isLoading: isLoadingCategoryProducts } =
    useProductsByCategory(currentBranch?.id, selectedCategory, {
      enabled: !!currentBranch?.id && !!selectedCategory,
    });

  const { data: popularProductsData, isLoading: isLoadingPopularProducts } =
    usePopularProducts(currentBranch?.id, 10, {
      enabled: !!currentBranch?.id && !selectedCategory && !debouncedProductSearch,
    });

  const { data: searchResultsData, isLoading: isLoadingSearchResults } =
    useProductSearch(currentBranch?.id, debouncedProductSearch, {
      enabled: !!currentBranch?.id && debouncedProductSearch.length > 1,
    });

  const { data: customerSearchResults, isLoading: isLoadingCustomers } =
    useCustomerSearch(debouncedCustomerSearch, {
      enabled: debouncedCustomerSearch.length > 2,
    });

  const { data: activeShiftData } = useActiveShift(user?.id);

  console.log("activeShiftData",activeShiftData);
    console.log("customerSearchResults",customerSearchResults);

  const { completeTransaction, isLoading: isProcessingTransaction } =
    useCompleteTransaction();

  const { addPayment } = useAddPayment();

  const { createQrisTransaction, isLoading: isProcessingQris } =
    useQrisTransaction();

  // Derived data
  const categories = categoriesData || [];
  const searchResults = customerSearchResults?.data || [];

  // Memoize the callback for useFrequentProducts to prevent recreation on every render
  const handleFrequentProductsToggle = useCallback((isActive) => {
    // Only update state when turning off frequent products view
    if (!isActive) {
      // Use functional update to avoid closure issues
      setSelectedCategory(() => null);
    }
  }, []); 

  // Get the current branch ID in a safe way
  const currentBranchId = useMemo(
    () => currentBranch?.id || null,
    [currentBranch]
  );

  // Replace the frequent products state and handler with our hook
  const {
    frequentProducts,
    isLoading: isLoadingFrequentProducts,
    isActive: showFrequentProducts,
    toggleFrequentProducts,
  } = useFrequentProducts(currentBranchId, handleFrequentProductsToggle);

  // Inisialisasi modal manager
  const modalManager = useModalManager({
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
  });
  
  const { closeAllModals } = modalManager;


  // AFTER the hook calls, now determine which products to display
  let currentProducts;

  if (debouncedProductSearch && debouncedProductSearch.length > 1 && searchResultsData?.data) {
    // If there's an active search, show search results
    currentProducts = searchResultsData || [];
  } else if (selectedCategory) {
    // If a category is selected, show category products
    currentProducts = categoryProductsData || [];
  } else {
    // Otherwise show all products
    currentProducts = productsData?.data || [];
  }

  // Override current products when showing frequent products
  if (showFrequentProducts && frequentProducts.length > 0) {
    currentProducts = frequentProducts;
  }

  // Initialize component
  useEffect(() => {
    // Initialize branch data
    if (cabangList && cabangList.length > 0) {
      setFilteredBranches(cabangList);
      
      // If a branch is already selected in context, use it, but skip GLOBAL_CABANG_ID
      let branchToUse = selectedCabang;
      
      if (!branchToUse || branchToUse.id === GLOBAL_CABANG_ID) {
        // Fallback to first non-global branch
        branchToUse = cabangList.find(c => c.id !== GLOBAL_CABANG_ID) || cabangList[0];
      }

      // Important: Use the full branch object from cabangList to ensure metadata like name/address is present
      const fullBranchObject = cabangList.find(c => c.id === branchToUse.id) || branchToUse;
      
      setCurrentBranch(fullBranchObject);
      
      if (setSelectedCabangById && branchToUse.id !== selectedCabang?.id) {
        setSelectedCabangById(branchToUse.id);
      }
    }

    // Show branch selector for superadmin on initial load ONLY if no specific branch is selected
    if (user && user.role === "superadmin" && (!selectedCabang || selectedCabang.id === GLOBAL_CABANG_ID)) {
      setShowBranchSelector(true);
    }
  }, [cabangList, selectedCabang, user, setSelectedCabangById]);

  // Calculate totals when cart or sale mode changes
  useEffect(() => {
    calculateTotal();
  }, [cart, saleMode, discount, discountType]);

  // Filter branches based on search query
  useEffect(() => {
    if (cabangList && cabangList.length) {
      if (branchSearchQuery.trim() === "") {
        setFilteredBranches(cabangList);
      } else {
        const filtered = cabangList.filter(
          (branch) =>
            branch.namaCabang
              .toLowerCase()
              .includes(branchSearchQuery.toLowerCase()) ||
            (branch.alamat &&
              branch.alamat
                .toLowerCase()
                .includes(branchSearchQuery.toLowerCase()))
        );
        setFilteredBranches(filtered);
      }
    }
  }, [branchSearchQuery, cabangList]);

  // Search products based on query -- Note: this logic is mostly redundant with currentProducts calculation but kept for filteredProducts state if needed elsewhere
  useEffect(() => {
    if (debouncedProductSearch.trim() === "") {
      setFilteredProducts([]);
    } else {
      const allProducts = productsData?.data || [];
      const filtered = allProducts.filter(
        (product) =>
          (product.produkMaster?.namaProduk &&
            product.produkMaster.namaProduk
              .toLowerCase()
              .includes(debouncedProductSearch.toLowerCase())) ||
          (product.produkMaster?.sku &&
            product.produkMaster.sku
              .toLowerCase()
              .includes(debouncedProductSearch.toLowerCase())) ||
          (product.produkMaster?.barcode &&
            product.produkMaster.barcode
              .toLowerCase()
              .includes(debouncedProductSearch.toLowerCase()))
      );
      setFilteredProducts(filtered);
    }
  }, [debouncedProductSearch, productsData]);

  // Calculate total amount
  const calculateTotal = () => {
    if (cart.length === 0) {
      setTotalAmount(0);
      setTax(0);
      return;
    }

    const subtotal = cart.reduce((sum, item) => {
      // Use wholesale price if in wholesale mode, otherwise retail price
      const price =
        saleMode === "wholesale" ? item.wholesale_price : item.retail_price;
      return sum + price * item.quantity;
    }, 0);

    // Apply discount
    let discountAmount = 0;
    if (discountType === "percentage") {
      discountAmount = subtotal * (discount / 100);
    } else {
      discountAmount = discount;
    }

    // Calculate tax (assume 10% tax)
    const taxAmount = Math.round((subtotal - discountAmount) * 0.1);

    setTotalAmount(Math.round(subtotal - discountAmount + taxAmount));
    setTax(taxAmount);
  };

  // Add product to cart
  const addToCart = (product) => {
    if (!currentBranch) {
      toast.error("Silakan pilih cabang terlebih dahulu", { icon: "⚠️" });
      setShowBranchSelector(true);
      return;
    }

    const existingItemIndex = cart.findIndex((item) => item.id === product.id);

    if (existingItemIndex !== -1) {
      // Update quantity if product already in cart
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      // Add new product to cart
      setCart([
        ...cart,
        {
          ...product,
          quantity: 1,
          name: product.produkMaster?.namaProduk || product.name || "Produk",
          retail_price: product.hargaJual || 0,
          wholesale_price: product.hargaGrosir || 0,
        },
      ]);
    }

    toast.success(
      `${
        product.produkMaster?.namaProduk || product.name || "Produk"
      } ditambahkan ke keranjang`
    );
  };

  // Remove product from cart
  const removeFromCart = (productId) => {
    const updatedCart = cart.filter((item) => item.id !== productId);
    setCart(updatedCart);
    toast.success("Item dihapus dari keranjang");
  };

  // Update product quantity in cart
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;

    const updatedCart = cart.map((item) => {
      if (item.id === productId) {
        return { ...item, quantity: newQuantity };
      }
      return item;
    });

    setCart(updatedCart);
  };

  // Search customers handled by React Query hook
  const searchCustomers = (query) => {
    // Pencarian pelanggan dihandle oleh useCustomerSearch hook
    setCustomerSearchQuery(query);
  };

  // Handle customer selection
  const selectCustomer = (customer) => {
    setCustomer(customer);
    setShowCustomerSearch(false);
    toast.success(
      `Pelanggan ${customer.namaPelanggan || customer.name} dipilih`
    );
  };

  // Handle branch selection
  const selectBranch = (branch) => {
    let targetBranch = branch;
    
    // Safety check: POS must use a specific branch, not "Global/All Branches"
    if (targetBranch.id === GLOBAL_CABANG_ID) {
      const firstBranch = cabangList.find(c => c.id !== GLOBAL_CABANG_ID);
      if (firstBranch) {
        targetBranch = firstBranch;
        toast.info("Otomatis menggunakan cabang pertama");
      }
    }

    setCurrentBranch(targetBranch);

    if (setSelectedCabangById) {
      setSelectedCabangById(targetBranch.id);
    }

    setShowBranchSelector(false);
    toast.success(`Cabang ${targetBranch.namaCabang || targetBranch.name} dipilih`);

    // Reset cart when branch changes
    setCart([]);
  };

  // Handle mode change
  const handleModeChange = (mode) => {
    setSaleMode(mode);

    // If switching to wholesale, prompt for customer if none selected
    if (mode === "wholesale" && !customer) {
      setShowCustomerSearch(true);
      toast.error("Untuk grosir, pelanggan harus dipilih", {
        icon: "⚠️",
      });
    }
  };

  // Handle payment
  const processPayment = () => {
    if (!currentBranch) {
      toast.error("Pilih cabang terlebih dahulu", {
        icon: "⚠️",
      });
      setShowBranchSelector(true);
      return;
    }

    // REQUIRED CHECK: Customer for Wholesale
    if (saleMode === "wholesale" && !customer) {
      toast.error("Untuk grosir, pelanggan harus dipilih", {
        icon: "⚠️",
      });
      setShowCustomerSearch(true);
      return;
    }

    if (cart.length === 0) {
      toast.error("Keranjang belanja kosong", {
        icon: "⚠️",
      });
      return;
    }

    setShowPaymentModal(true);
    setPaymentAmount(totalAmount);
  };

  // Complete the sale using React Query
  const completeSale = async (paymentData = null) => {
    if (isProcessingTransaction) return;

    // If paymentData is provided (from PaymentModal), use it; otherwise use legacy logic
    const actualPaymentMethod = paymentData?.paymentMethod || paymentMethod;
    const actualAmountPaid = paymentData?.amountPaid ?? paymentAmount;
    const actualPostPayAmount = paymentData?.postPayAmount || 0;

    // Determine payment method and status
    const paymentMethodEnum = actualPaymentMethod; // Values are already correct from PaymentModal: TUNAI, KARTU_DEBIT, KARTU_KREDIT, TRANSFER, E_WALLET, QRIS, KREDIT_PELANGGAN

    let statusPembayaran = "BELUM_LUNAS";
    const lunasMethods = ['TUNAI', 'CASH', 'DEBIT', 'KARTU_DEBIT', 'KREDIT', 'KARTU_KREDIT', 'QRIS', 'TRANSFER', 'E_WALLET', 'EWALLET'];
    const belumLunasMethods = ['KREDIT_PELANGGAN', 'PIUTANG', 'TEMPO'];

    if (lunasMethods.includes(paymentMethodEnum)) {
      statusPembayaran = "LUNAS";
    } else if (belumLunasMethods.includes(paymentMethodEnum)) {
      statusPembayaran = "BELUM_LUNAS";
    }

    // Check if this is a TEMPO (credit) payment - skip payment API call
    const isTempoPayment = paymentMethodEnum === 'KREDIT_PELANGGAN' || paymentMethodEnum === 'TEMPO';

    try {
      let response;
      let transactionId;

      // For QRIS payment, transaction was already created - just add payment
      if ((paymentData?.paymentMethod === "qris" || paymentData?.paymentMethod === "QRIS") && paymentData.transactionId) {
        transactionId = paymentData.transactionId;

        // Create payment data
        const finalPaymentData = {
          metode_pembayaran: paymentMethodEnum,
          status_pembayaran: statusPembayaran,
          jumlah_bayar: Math.round(actualAmountPaid + actualPostPayAmount),
          jumlah_kembali: Math.round(actualAmountPaid - totalAmount),
          tanggal_pembayaran: new Date().toISOString(),
          keterangan: `Pembayaran ${actualPaymentMethod}`,
          generate_receipt: true,
          ...(paymentData?.qrisData && { qris_data: paymentData.qrisData }),
          transaksi_id: paymentData.transactionId,
        };
        response = await addPayment(finalPaymentData);
      } else if (isTempoPayment) {
        // For TEMPO/KREDIT_PELANGGAN: create transaction WITHOUT payment
        // Transaction status will be BELUM_LUNAS automatically
        let transactionData;

        if (lastTransactionId && lastTransactionData) {
          transactionData = lastTransactionData;
          transactionData.id = lastTransactionId;
        } else {
          transactionData = {
            cabang_id: currentBranch.id,
            shift_id: activeShiftData?.data?.id || null,
            jenis_transaksi: "PENJUALAN",
            tanggal: new Date().toISOString(),
            pelanggan_id: customer ? customer.id : null,
            metode_pembayaran: paymentMethodEnum, // Include payment method in transaction data
            details: cart.map((item) => ({
              produk_id: item.id,
              jumlah: item.quantity,
              harga_satuan:
                saleMode === "wholesale"
                  ? item.wholesale_price
                  : item.retail_price,
              diskon_persen: 0,
              pajak_persen: 10,
            })),
            biaya_tambahan: 0,
            keterangan: `${
              saleMode === "wholesale" ? "Penjualan Grosir" : "Penjualan Retail"
            }`,
          };

          if (saleMode === "wholesale" && !customer?.id) {
            transactionData.customer_info = {
              nama: customer.name,
              telepon: customer.phone || "",
              alamat: customer.address || "",
            };
          }

          setLastTransactionData(transactionData);
        }

        // Call completeTransaction without payment data for TEMPO
        response = await completeTransaction(transactionData, null);
      } else {
        // Normal flow: create transaction and add payment
        // Validate payment amount
        if (!paymentData && actualAmountPaid < totalAmount) {
          toast.error("Pembayaran kurang dari total belanja", {
            icon: "⚠️",
          });
          return;
        }

        // Create payment data
        const finalPaymentData = {
          metode_pembayaran: paymentMethodEnum,
          status_pembayaran: statusPembayaran,
          jumlah_bayar: Math.round(actualAmountPaid + actualPostPayAmount),
          jumlah_kembali: Math.round(actualAmountPaid - totalAmount),
          tanggal_pembayaran: new Date().toISOString(),
          keterangan: `Pembayaran ${actualPaymentMethod}`,
          generate_receipt: true,
          ...(paymentData?.qrisData && { qris_data: paymentData.qrisData }),
        };

        let transactionData;

        if (lastTransactionId && lastTransactionData) {
          transactionData = lastTransactionData;
          transactionData.id = lastTransactionId;
        } else {
          transactionData = {
            cabang_id: currentBranch.id,
            shift_id: activeShiftData?.data?.id || null,
            jenis_transaksi: "PENJUALAN",
            tanggal: new Date().toISOString(),
            pelanggan_id: customer ? customer.id : null,
            metode_pembayaran: paymentMethodEnum, // Include payment method in transaction data
            details: cart.map((item) => ({
              produk_id: item.id,
              jumlah: item.quantity,
              harga_satuan:
                saleMode === "wholesale"
                  ? item.wholesale_price
                  : item.retail_price,
              diskon_persen: 0,
              pajak_persen: 10,
            })),
            biaya_tambahan: 0,
            keterangan: `${
              saleMode === "wholesale" ? "Penjualan Grosir" : "Penjualan Retail"
            }`,
          };

          if (saleMode === "wholesale" && !customer?.id) {
            transactionData.customer_info = {
              nama: customer.name,
              telepon: customer.phone || "",
              alamat: customer.address || "",
            };
          }

          setLastTransactionData(transactionData);
        }

        response = await completeTransaction(transactionData, finalPaymentData);
      }

      if (response?.data?.receipt?.receiptData?.pdf) {
        handlePdfReceipt(response.data.receipt);
        return;
      }

      const receiptItems = cart.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price:
          saleMode === "wholesale" ? item.wholesale_price : item.retail_price,
        unit: item.unit || "pcs",
      }));

      const subtotal = cart.reduce((sum, item) => {
        const price =
          saleMode === "wholesale" ? item.wholesale_price : item.retail_price;
        return sum + price * item.quantity;
      }, 0);

      const discountAmount =
        discountType === "percentage" ? subtotal * (discount / 100) : discount;

      const receiptData = {
        transaction: {
          id: transactionId || response?.data?.id || paymentData?.transactionId || "TRX" + new Date().getTime(),
          nomor_transaksi: paymentData?.transactionNumber || response?.data?.nomor_transaksi,
          tanggal: new Date().toISOString(),
          subtotal: subtotal,
          discount_amount: discountAmount,
          discount_type: discountType,
          discount_value: discount,
          tax_amount: tax,
          total_amount: totalAmount,
        },
        payment: {
          metode_pembayaran: paymentMethodEnum,
          jumlah_bayar: Math.round(actualAmountPaid),
          jumlah_kembali: Math.round(actualAmountPaid - totalAmount),
        },
        items: receiptItems,
        customer: customer || { name: "Umum" },
        branch: currentBranch,
      };

      setReceiptData(receiptData);
      setShowReceiptModal(true);
      setShowPaymentModal(false);

      // Reset cart and payment amount when sale is complete
      setPaymentAmount(0);
      setCart([]);
      setCustomer(null);
      setDiscount(0);
      setLastTransactionId(null);
      setLastTransactionData(null);

    } catch (error) {
      console.error("Transaction error:", error);
      toast.error("Pembayaran gagal, silakan coba lagi");
    }
  };

  const handlePdfReceipt = (receiptData) => {
    try {
      const pdfBytes = Object.values(receiptData.receiptData.pdf);
      const uint8Array = new Uint8Array(pdfBytes);
      const blob = new Blob([uint8Array], { type: "application/pdf" });
      const pdfUrl = URL.createObjectURL(blob);

      setShowPaymentModal(false);
      const newWindow = window.open(pdfUrl, "_blank");

      if (newWindow && "document" in newWindow) {
        newWindow.document.title = `Receipt-${
          receiptData.transactionNumber || "Transaction"
        }`;
      }

      setCart([]);
      setCustomer(null);
      setDiscount(0);
      setLastTransactionId(null);
      setLastTransactionData(null);

      toast.success("Pembayaran berhasil! Receipt PDF dibuka di tab baru");

      toast.success(
        (t) => (
          <div>
            <p>Klik untuk download receipt</p>
            <button
              onClick={() => {
                const a = document.createElement("a");
                a.href = pdfUrl;
                a.download = `Receipt-${
                  receiptData.transactionNumber || "Transaction"
                }.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                toast.dismiss(t.id);
              }}
              className="mt-2 px-3 py-1 bg-blue-600 text-white rounded-md text-sm"
            >
              Download PDF
            </button>
          </div>
        ),
        {
          duration: 10000,
          style: {
            minWidth: "250px",
          },
        }
      );
    } catch (error) {
      console.error("Error handling PDF receipt:", error);
      toast.error("Gagal menampilkan receipt PDF");
      handleCloseReceipt();
    }
  };

  const handleCloseReceipt = () => {
    setShowReceiptModal(false);
    setCart([]);
    setCustomer(null);
    setDiscount(0);
    setLastTransactionId(null);
    setLastTransactionData(null);
    setReceiptData(null);
    toast.success("Pembayaran berhasil!");
  };

  const handlePrintReceipt = () => {
    const printContent = document.getElementById("receipt-content");
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak Struk</title>
          <style>
            @page { margin: 0; size: 80mm auto; }
            body { font-family: 'Courier New', Courier, monospace; margin: 0; padding: 5mm; width: 70mm; color: #000; background: #fff; }
            #receipt-print-container { width: 100%; }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .font-black { font-weight: 900; }
            .uppercase { text-transform: uppercase; }
            .tracking-widest { letter-spacing: 0.1em; }
            .tracking-wider { letter-spacing: 0.05em; }
            .text-lg { font-size: 16px; }
            .text-3xl { font-size: 24px; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .items-end { align-items: flex-end; }
            .mb-6 { margin-bottom: 24px; }
            .mb-1 { margin-bottom: 4px; }
            .mb-0\\.5 { margin-bottom: 2px; }
            .mt-8 { margin-top: 32px; }
            .mt-3 { margin-top: 12px; }
            .pt-4 { padding-top: 16px; }
            .pt-2 { padding-top: 8px; }
            .pt-3 { padding-top: 12px; }
            .py-3 { padding-top: 12px; padding-bottom: 12px; }
            .space-y-1 > * + * { margin-top: 4px; }
            .space-y-1\\.5 > * + * { margin-top: 6px; }
            .space-y-3 > * + * { margin-top: 12px; }
            .border-t { border-top: 1px dashed #000; }
            .border-t-2 { border-top: 2px dashed #000; }
            .opacity-50 { opacity: 0.5; }
            .opacity-70 { opacity: 0.7; }
            .italic { font-style: italic; }
            .text-[11px] { font-size: 11px; }
            .text-[10px] { font-size: 10px; }
            .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .max-w-[120px] { max-width: 120px; }
            .shadow-lg, .shadow-\\[0_0_40px_rgba\\(0\\,0\\,0\\,0\\.05\\)\\], .border-gray-100, .rounded-lg { box-shadow: none !important; border: none !important; border-radius: 0 !important; }
          </style>
        </head>
        <body>
          <div id="receipt-print-container">${printContent.innerHTML}</div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getCurrentBranchName = () => {
    if (currentBranch) {
      return currentBranch.namaCabang || currentBranch.name;
    } else {
      return "Pilih Cabang";
    }
  };

  const handleSearch = (query) => {
    setProductSearch(query);
    if (query && query.length > 1) {
      addToHistory(query);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (posContainerRef.current.requestFullscreen) {
        posContainerRef.current.requestFullscreen();
      } else if (posContainerRef.current.webkitRequestFullscreen) {
        posContainerRef.current.webkitRequestFullscreen();
      } else if (posContainerRef.current.msRequestFullscreen) {
        posContainerRef.current.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, []);

  const keyboardManager = useKeyboardManager({
    cart,
    isProcessingTransaction,
    searchInputRef,
    categories,
    isLoadingCategories,
    selectedCategory,
    setSelectedCategory,
    saleMode,
    handleModeChange,
    processPayment,
    setProductSearch,
    setShowCategoryList,
    modalManager,
  });


  // State for mobile tab navigation
  const [activeMobileTab, setActiveMobileTab] = useState("products");

  return (
    <div
      ref={posContainerRef}
      className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-blue-50"
    >
      <Toaster position="top-right" />

      {/* Header */}
      <header className="bg-white border-b border-gray-100 z-10 sticky top-0">
        <div className="px-4 md:px-6 py-3 md:py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4 md:gap-8">
              <div
                className="flex items-center gap-2 md:gap-3 cursor-pointer group"
                onClick={() => navigate("/dashboard")}
              >
                <div className="p-1.5 md:p-2 bg-indigo-600 text-white rounded-lg md:rounded-xl shadow-lg shadow-indigo-100 rotate-3 group-hover:rotate-0 transition-transform">
                  <Store size={20} className="md:w-[26px] md:h-[26px]" strokeWidth={2.5} />
                </div>
                <div>
                  <h1 className="text-lg md:text-xl font-black text-gray-800 tracking-tight">CASIR<span className="text-indigo-600">Online</span></h1>
                  <p className="hidden md:block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] leading-none mt-1">Retail POS System</p>
                </div>
              </div>

              <div className="h-8 md:h-10 w-px bg-gray-100 hidden md:block" />

              <div className="relative group hidden md:block">
                <button
                  className="px-3 md:px-5 py-2 md:py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-gray-700 font-bold text-sm flex items-center gap-2 md:gap-3 hover:bg-white hover:border-indigo-200 transition-all shadow-sm"
                  onClick={() => modalManager.openModal("branchSelector")}
                >
                  <MapPin size={16} className="text-indigo-500 md:w-[18px] md:h-[18px]" />
                  <span className="max-w-[150px] truncate">{getCurrentBranchName()}</span>
                  <ChevronDown size={14} className="text-gray-400 group-hover:text-indigo-500" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden lg:flex flex-col items-end mr-4">
                 <p className="text-sm font-black text-gray-800">{user?.namaLengkap || "Cashier User"}</p>
                 <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{user?.roles[0]?.namaRole || "Operator"}</p>
              </div>

              {/* Mobile Branch Selector Button */}
              <button 
                 className="md:hidden p-2 text-gray-500 bg-gray-50 rounded-lg border border-gray-100"
                 onClick={() => modalManager.openModal("branchSelector")}
              >
                 <MapPin size={20} className="text-indigo-500" />
              </button>

              <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                <button
                  className="hidden md:block p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-white rounded-lg transition-all shadow-none hover:shadow-sm"
                  onClick={toggleFullscreen}
                  title="Fullscreen [F11]"
                >
                  {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                </button>
                <button
                  className="hidden md:block p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-white rounded-lg transition-all shadow-none hover:shadow-sm"
                  onClick={() => modalManager.openModal("shortcutsHelp")}
                  title="Keyboard Shortcuts [F1]"
                >
                  <Keyboard size={20} />
                </button>
                <button
                  className="p-2 md:p-2.5 text-gray-500 hover:text-red-600 hover:bg-white rounded-lg transition-all shadow-none hover:shadow-sm"
                  onClick={() => navigate("/dashboard")}
                  title="Close POS"
                >
                  <X size={20} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left section - Product display */}
        <div className={`w-full lg:w-2/3 flex flex-col overflow-hidden transition-all duration-300 ${activeMobileTab === 'products' ? 'flex' : 'hidden lg:flex'}`}>
          {/* Search bar */}
          <SearchBar
            productSearch={productSearch}
            setProductSearch={handleSearch}
            searchHistory={searchHistory || []}
            searchResults={searchResultsData || []}
            showAutocomplete={showAutocomplete}
            setShowAutocomplete={setShowAutocomplete}
            showSearchHistory={showSearchHistory}
            setShowSearchHistory={setShowSearchHistory}
            addToCart={addToCart}
            isLoading={isLoadingSearchResults}
            clearHistory={clearHistory}
            inputRef={searchInputRef}
          />

          {/* Categories */}
          <CategoriesSection
            categories={categories || []}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            categoryColors={categoryColors}
            showFrequentProducts={showFrequentProducts}
            fetchFrequentProducts={toggleFrequentProducts}
          />

          {/* Products grid */}
          <div className="flex-1 overflow-y-auto pb-24 lg:pb-20">
            <ProductsSection
              products={currentProducts}
              addToCart={addToCart}
              loading={
                isLoadingProducts ||
                isLoadingCategoryProducts ||
                isLoadingFrequentProducts
              }
              categories={categories || []}
              categoryColors={categoryColors}
              isFrequentProductsView={showFrequentProducts}
            />
          </div>
        </div>

        {/* Right section - Cart */}
        <div className={`w-full lg:w-1/3 border-l border-gray-200 flex flex-col bg-gray-50 transition-all duration-300 ${activeMobileTab === 'cart' ? 'flex' : 'hidden lg:flex'}`}>
          <CartSection
            cart={cart}
            updateQuantity={updateQuantity}
            removeFromCart={removeFromCart}
            saleMode={saleMode}
            handleModeChange={handleModeChange}
            customer={customer}
            setShowCustomerSearch={setShowCustomerSearch}
            totalAmount={totalAmount}
            tax={tax}
            discount={discount}
            setDiscount={setDiscount}
            discountType={discountType}
            setDiscountType={setDiscountType}
            processPayment={processPayment}
            // Add extra padding bottom for mobile nav
            className="pb-20 lg:pb-0"
          />
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="lg:hidden absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 z-30 flex shadow-[0_-5px_10px_rgba(0,0,0,0.05)]">
           <button 
             onClick={() => setActiveMobileTab('products')}
             className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl transition-all ${
               activeMobileTab === 'products' 
                 ? 'text-indigo-600 bg-indigo-50 font-bold' 
                 : 'text-gray-400 hover:bg-gray-50'
             }`}
           >
             <Store size={24} />
             <span className="text-[10px] mt-1 font-bold uppercase tracking-wider">Produk</span>
           </button>
           
           <div className="w-px bg-gray-100 mx-2 my-1"></div>
           
           <button 
             onClick={() => setActiveMobileTab('cart')}
             className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl transition-all relative ${
               activeMobileTab === 'cart' 
                 ? 'text-indigo-600 bg-indigo-50 font-bold' 
                 : 'text-gray-400 hover:bg-gray-50'
             }`}
           >
             <div className="relative">
               {cart.length > 0 && (
                 <span className="absolute -top-2 -right-3 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center border-2 border-white">
                   {cart.reduce((a, b) => a + b.quantity, 0)}
                 </span>
               )}
               <div className="flex items-center gap-1.5">
                  <ShoppingCart size={24} />
                  {totalAmount > 0 && (
                     <span className="text-xs font-black text-gray-800 bg-white px-2 py-0.5 rounded border border-gray-200">
                       {formatCurrency(totalAmount)}
                     </span>
                  )}
               </div>
             </div>
             <span className="text-[10px] mt-1 font-bold uppercase tracking-wider">Keranjang</span>
           </button>
        </div>
      </div>

      <KeyboardShortcutsHelp
        show={showShortcutsHelp}
        setShow={setShowShortcutsHelp}
      />

      {/* Modals - Branch Selector */}
      {showBranchSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Pilih Cabang</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => closeAllModals()}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4">
              <input
                type="text"
                placeholder="Cari cabang..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={branchSearchQuery}
                onChange={(e) => setBranchSearchQuery(e.target.value)}
              />

              <div className="max-h-96 overflow-y-auto">
                {filteredBranches.length > 0 ? (
                  filteredBranches.map((branch) => (
                    <div
                      key={branch.id}
                      className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      onClick={() => selectBranch(branch)}
                    >
                      <div className="font-medium">
                        {branch.namaCabang || branch.name}
                      </div>
                      {branch.alamat && (
                        <div className="text-sm text-gray-500 mt-1">
                          {branch.alamat}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    Tidak ada cabang ditemukan
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals - Customer Search */}
      {showCustomerSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold">
                {saleMode === 'wholesale' ? "Pilih Pelanggan (Wajib)" : "Pilih Pelanggan"}
              </h2>
              <button
                className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
                onClick={() => closeAllModals()}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4">
              <input
                type="text"
                placeholder="Cari pelanggan..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={customerSearchQuery}
                onChange={(e) => searchCustomers(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.preventDefault();
                    closeAllModals();
                  }
                }}
              />

              <div className="max-h-96 overflow-y-auto">
                <div
                  className="p-3 bg-blue-50 text-blue-700 rounded-lg mb-3 flex items-center cursor-pointer hover:bg-blue-100"
                  onClick={() => {
                    if (customerSearchQuery.trim()) {
                      selectCustomer({
                        id: null,
                        name: customerSearchQuery,
                        phone: "",
                        address: "",
                      });
                    } else {
                      toast.error("Masukkan nama pelanggan", { icon: "⚠️" });
                    }
                  }}
                >
                  <Plus size={18} className="mr-2" />
                  <span>Tambah pelanggan baru</span>
                </div>

                {isLoadingCustomers ? (
                  <div className="p-4 text-center">
                    <div className="w-6 h-6 border-2 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
                    <p className="mt-2 text-gray-500">Mencari pelanggan...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((customer) => (
                    <div
                      key={customer.id}
                      className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      onClick={() => selectCustomer(customer)}
                    >
                      <div className="font-medium">
                        {customer.namaPelanggan || customer.name}
                      </div>
                      {(customer.telepon || customer.phone) && (
                        <div className="text-sm text-gray-500 mt-1">
                          {customer.telepon || customer.phone}
                        </div>
                      )}
                    </div>
                  ))
                ) : customerSearchQuery.length > 2 ? (
                  <div className="p-4 text-center text-gray-500">
                    Tidak ada pelanggan ditemukan
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    Ketik minimal 3 karakter untuk mencari
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals - Payment */}
      <PaymentModal
        show={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setPaymentAmount(0);
        }}
        totalAmount={totalAmount}
        subtotal={cart.reduce((sum, item) => {
          const price = saleMode === "wholesale" ? item.wholesale_price : item.retail_price;
          return sum + price * item.quantity;
        }, 0)}
        discountAmount={discountType === "percentage"
          ? cart.reduce((sum, item) => {
              const price = saleMode === "wholesale" ? item.wholesale_price : item.retail_price;
              return sum + price * item.quantity;
            }, 0) * (discount / 100)
          : discount}
        tax={tax}
        onProcessPayment={completeSale}
        loading={isProcessingTransaction}
        transactionData={{
          cabang_id: currentBranch?.id,
          shift_id: activeShiftData?.data?.id || null,
          jenis_transaksi: "PENJUALAN",
          tanggal: new Date().toISOString(),
          pelanggan_id: customer ? customer.id : null,
          details: cart.map((item) => ({
            produk_id: item.id,
            jumlah: item.quantity,
            harga_satuan: saleMode === "wholesale" ? item.wholesale_price : item.retail_price,
            diskon_persen: 0,
            pajak_persen: 10,
          })),
          biaya_tambahan: 0,
          keterangan: `${
            saleMode === "wholesale" ? "Penjualan Grosir" : "Penjualan Retail"
          }`,
        }}
        cart={cart}
        saleMode={saleMode}
        customer={customer}
        currentBranch={currentBranch}
        activeShiftId={activeShiftData?.data?.id}
      />

      {/* Receipt modal */}
      <ReceiptModal
        show={showReceiptModal}
        onClose={handleCloseReceipt}
        data={receiptData}
        onPrint={handlePrintReceipt}
      />
    </div>
  );
};

export default POSPage;
