import React, { useState, useEffect } from "react";
import {
  ShoppingCart,
  Users,
  Search,
  Plus,
  Minus,
  Trash2,
  X,
  CreditCard,
  DollarSign,
  Calendar,
  ChevronDown,
  Tag,
  Percent,
  FileText,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth.js";
import { useCabang } from "../../features/cabang/hooks/useCabang";
import toast from "react-hot-toast";

// Utility function to format currency
const formatCurrency = (amount) => {
  const numAmount = parseFloat(amount) || 0;
  return `Rp${numAmount.toLocaleString("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

const PointOfSale = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedCabang } = useCabang();

  // State for sale mode
  const [saleMode, setSaleMode] = useState("retail"); // "retail" or "wholesale"

  // State for customer
  const [customer, setCustomer] = useState(null);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  // State for cart
  const [cart, setCart] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [tax, setTax] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState("percentage"); // "percentage" or "fixed"
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");

  // State for products
  const [productSearch, setProductSearch] = useState("");
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Mock data for customers
  const mockCustomers = [
    { id: 1, name: "John Doe", phone: "08123456789", address: "Jakarta" },
    { id: 2, name: "Jane Smith", phone: "08567891234", address: "Bandung" },
    { id: 3, name: "Ahmad Yusuf", phone: "08111223344", address: "Surabaya" },
  ];

  // Mock data for products
  const mockProducts = [
    {
      id: 1,
      name: "Apple Shimla 2 KG",
      sku: "98765432",
      price: 162000,
      wholesalePrice: 150000,
      stock: 50,
      productCode: "98765432",
    },
    {
      id: 2,
      name: "Green tea - Lipton 500g",
      sku: "98765433",
      price: 162000,
      wholesalePrice: 150000,
      stock: 30,
      productCode: "98765433",
    },
    {
      id: 3,
      name: "Coffee Beans - Arabica 1 KG",
      sku: "98765434",
      price: 250000,
      wholesalePrice: 230000,
      stock: 25,
      productCode: "98765434",
    },
    {
      id: 4,
      name: "Sugar - White 5 KG",
      sku: "98765435",
      price: 120000,
      wholesalePrice: 110000,
      stock: 40,
      productCode: "98765435",
    },
    {
      id: 5,
      name: "Rice - Premium 10 KG",
      sku: "98765436",
      price: 180000,
      wholesalePrice: 170000,
      stock: 60,
      productCode: "98765436",
    },
  ];

  useEffect(() => {
    // Load products
    setProducts(mockProducts);
    setFilteredProducts(mockProducts);

    // Calculate totals
    calculateTotal();
  }, [cart, saleMode]);

  // Search products based on query
  useEffect(() => {
    if (productSearch.trim() === "") {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(
        (product) =>
          product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
          product.sku.toLowerCase().includes(productSearch.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [productSearch, products]);

  // Calculate total amount
  const calculateTotal = () => {
    if (cart.length === 0) {
      setTotalAmount(0);
      setTax(0);
      return;
    }

    const subtotal = cart.reduce((sum, item) => {
      // Use wholesale price if in wholesale mode, otherwise retail price
      const price = saleMode === "wholesale" ? item.wholesalePrice : item.price;
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
    const taxAmount = (subtotal - discountAmount) * 0.1;

    setTotalAmount(subtotal - discountAmount + taxAmount);
    setTax(taxAmount);
  };

  // Add product to cart
  const addToCart = (product) => {
    const existingItemIndex = cart.findIndex((item) => item.id === product.id);

    if (existingItemIndex !== -1) {
      // Update quantity if product already in cart
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      // Add new product to cart
      setCart([...cart, { ...product, quantity: 1 }]);
    }

    toast.success(`${product.name} ditambahkan ke keranjang`);
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

  // Search customers
  const searchCustomers = (query) => {
    if (query.trim() === "") {
      setSearchResults([]);
      return;
    }

    const results = mockCustomers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(query.toLowerCase()) ||
        customer.phone.includes(query)
    );

    setSearchResults(results);
  };

  // Handle customer selection
  const selectCustomer = (customer) => {
    setCustomer(customer);
    setShowCustomerSearch(false);
    toast.success(`Pelanggan ${customer.name} dipilih`);
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

  // Complete the sale
  const completeSale = () => {
    if (paymentAmount < totalAmount) {
      toast.error("Pembayaran kurang dari total belanja", {
        icon: "⚠️",
      });
      return;
    }

    // Here you would normally process the sale in the backend

    toast.success("Transaksi berhasil!");
    setShowPaymentModal(false);
    setCart([]);
    setCustomer(null);
    setSaleMode("retail");
    setDiscount(0);
  };

  return (
    <div className="bg-gray-50 h-screen flex">
      {/* Left side - Products */}
      <div className="w-2/3 p-4 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Point of Sale</h2>

            {/* Sale Mode Selector */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                className={`px-4 py-2 rounded-lg ${
                  saleMode === "retail"
                    ? "bg-indigo-500 text-white"
                    : "text-gray-700"
                }`}
                onClick={() => handleModeChange("retail")}
              >
                Retail
              </button>
              <button
                className={`px-4 py-2 rounded-lg ${
                  saleMode === "wholesale"
                    ? "bg-indigo-500 text-white"
                    : "text-gray-700"
                }`}
                onClick={() => handleModeChange("wholesale")}
              >
                Wholesale
              </button>
            </div>

            {/* Customer Selection */}
            <div className="relative">
              {customer ? (
                <div className="flex items-center space-x-2 bg-indigo-50 px-3 py-2 rounded-lg">
                  <Users size={18} className="text-indigo-500" />
                  <span className="text-indigo-700">{customer.name}</span>
                  <button
                    onClick={() => setCustomer(null)}
                    className="text-gray-500 hover:text-red-500"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  className="flex items-center space-x-2 bg-indigo-50 px-3 py-2 rounded-lg text-indigo-700"
                  onClick={() => setShowCustomerSearch(true)}
                >
                  <Users size={18} />
                  <span>Pilih Pelanggan</span>
                </button>
              )}

              {/* Customer Search Modal */}
              {showCustomerSearch && (
                <div className="absolute top-full mt-2 right-0 w-80 bg-white rounded-lg shadow-lg z-10 p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium">Cari Pelanggan</h3>
                    <button
                      onClick={() => setShowCustomerSearch(false)}
                      className="text-gray-500 hover:text-red-500"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="relative mb-3">
                    <input
                      type="text"
                      placeholder="Nama atau No. Telp"
                      className="w-full px-3 py-2 border rounded-lg pr-10"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        searchCustomers(e.target.value);
                      }}
                    />
                    <Search
                      size={18}
                      className="absolute right-3 top-2.5 text-gray-400"
                    />
                  </div>

                  <div className="max-h-60 overflow-y-auto">
                    {searchResults.length > 0 ? (
                      searchResults.map((customer) => (
                        <div
                          key={customer.id}
                          className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                          onClick={() => selectCustomer(customer)}
                        >
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-gray-500">
                            {customer.phone}
                          </div>
                        </div>
                      ))
                    ) : searchQuery ? (
                      <div className="text-center py-3 text-gray-500">
                        Pelanggan tidak ditemukan
                      </div>
                    ) : (
                      <div className="text-center py-3 text-gray-500">
                        Ketik untuk mencari pelanggan
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Product Search */}
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Cari produk (nama, SKU, atau barcode)"
              className="w-full px-4 py-3 border rounded-lg pr-10"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
            />
            <Search
              size={20}
              className="absolute right-3 top-3 text-gray-400"
            />
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white border rounded-lg p-3 cursor-pointer hover:shadow-md transition"
                onClick={() => addToCart(product)}
              >
                <div className="flex items-center mb-2">
                  <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <ShoppingCart size={16} className="text-indigo-500" />
                  </div>
                  <div className="ml-2 flex-1 truncate">
                    <div className="font-medium truncate">{product.name}</div>
                    <div className="text-xs text-gray-500">
                      SKU: {product.sku}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="font-semibold text-indigo-600">
                    {formatCurrency(
                      saleMode === "wholesale"
                        ? product.wholesalePrice
                        : product.price
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    Stock: {product.stock}
                  </div>
                </div>
              </div>
            ))}

            {filteredProducts.length === 0 && (
              <div className="col-span-3 text-center py-8 text-gray-500">
                Produk tidak ditemukan
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right side - Cart */}
      <div className="w-1/3 bg-white shadow-lg p-4 flex flex-col">
        <h2 className="text-xl font-semibold mb-4">
          {saleMode === "retail" ? "Retail" : "Wholesale"} - Keranjang
        </h2>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto mb-4">
          {cart.length > 0 ? (
            <div>
              {cart.map((item) => (
                <div key={item.id} className="border-b py-3 last:border-b-0">
                  <div className="flex justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500">
                        SKU: {item.sku}
                      </div>
                      <div className="text-sm font-semibold mt-1 text-indigo-600">
                        {formatCurrency(
                          saleMode === "wholesale"
                            ? item.wholesalePrice
                            : item.price
                        )}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <button
                        className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                      >
                        <Minus size={16} />
                      </button>
                      <input
                        type="text"
                        className="h-8 w-12 mx-2 text-center border rounded"
                        value={item.quantity}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (!isNaN(value)) {
                            updateQuantity(item.id, value);
                          }
                        }}
                      />
                      <button
                        className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                      >
                        <Plus size={16} />
                      </button>
                      <button
                        className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center ml-2"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 flex flex-col items-center">
              <ShoppingCart size={40} className="text-gray-300 mb-2" />
              <p>Keranjang belanja kosong</p>
            </div>
          )}
        </div>

        {/* Discount Section */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              <Tag size={18} className="text-indigo-500 mr-2" />
              <span className="font-medium">Diskon</span>
            </div>
            <div className="flex items-center space-x-2">
              <select
                className="border rounded px-2 py-1 text-sm"
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
              >
                <option value="percentage">%</option>
                <option value="fixed">Rp</option>
              </select>
              <input
                type="text"
                className="w-20 border rounded px-2 py-1 text-right"
                value={discount}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value) || e.target.value === "") {
                    setDiscount(e.target.value === "" ? 0 : value);
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="border-t pt-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Subtotal</span>
            <span>
              {formatCurrency(
                cart.reduce((sum, item) => {
                  const price =
                    saleMode === "wholesale" ? item.wholesalePrice : item.price;
                  return sum + price * item.quantity;
                }, 0)
              )}
            </span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Diskon</span>
            <span className="text-red-500">
              -
              {formatCurrency(
                discountType === "percentage"
                  ? cart.reduce((sum, item) => {
                      const price =
                        saleMode === "wholesale"
                          ? item.wholesalePrice
                          : item.price;
                      return sum + price * item.quantity;
                    }, 0) *
                      (discount / 100)
                  : discount
              )}
            </span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Pajak (10%)</span>
            <span>{formatCurrency(tax)}</span>
          </div>
          <div className="flex justify-between items-center font-semibold text-lg mt-3">
            <span>Total</span>
            <span>{formatCurrency(totalAmount)}</span>
          </div>
        </div>

        {/* Payment Button */}
        <button
          className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 flex items-center justify-center"
          onClick={processPayment}
        >
          <CreditCard size={18} className="mr-2" />
          Bayar
        </button>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-1/3">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Complete The Sale</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-4">
              <div className="flex justify-between font-medium mb-3">
                <span>Payment Received:</span>
                <span className="text-green-600">250 SAR</span>
              </div>

              <div className="mb-4">
                <div className="text-gray-600 mb-1">Amount Added</div>
                <div className="flex flex-col space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Credit Card</span>
                    <span className="font-medium">250 SAR</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Cash</span>
                    <span className="font-medium">0 SAR</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Post Pay</span>
                    <span className="font-medium">0 SAR</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center text-red-500 font-medium mb-3">
                <span>Remaining</span>
                <span>248 SAR</span>
              </div>

              <div className="flex justify-between items-center text-xl font-semibold">
                <span>Amount To Pay</span>
                <span>498 SAR</span>
              </div>
            </div>

            <div className="flex space-x-3 mb-4">
              <button
                className={`flex-1 py-3 ${
                  paymentMethod === "credit_card"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700"
                } rounded-lg font-medium`}
                onClick={() => setPaymentMethod("credit_card")}
              >
                Credit Card
              </button>
              <button
                className={`flex-1 py-3 ${
                  paymentMethod === "cash"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700"
                } rounded-lg font-medium`}
                onClick={() => setPaymentMethod("cash")}
              >
                Cash
              </button>
              <button
                className={`flex-1 py-3 ${
                  paymentMethod === "post_pay"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700"
                } rounded-lg font-medium`}
                onClick={() => setPaymentMethod("post_pay")}
              >
                Post Pay
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-gray-600 mb-2">Date Of Supply</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="DD/MM/YYYY"
                  className="w-full px-4 py-3 border rounded-lg"
                />
                <Calendar
                  size={18}
                  className="absolute right-3 top-3.5 text-gray-400"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-600 mb-2">Add Customer</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Add Customer"
                  className="w-full px-4 py-3 border rounded-lg"
                />
                <X
                  size={18}
                  className="absolute right-3 top-3.5 text-gray-400"
                />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">Multi-Pay</span>
                <div className="relative inline-block w-14 align-middle select-none">
                  <input
                    type="checkbox"
                    name="multiPay"
                    id="multiPay"
                    className="absolute opacity-0 w-0 h-0"
                  />
                  <label
                    htmlFor="multiPay"
                    className="block overflow-hidden h-7 rounded-full bg-gray-300 cursor-pointer"
                  >
                    <span className="block h-7 w-7 rounded-full bg-white shadow transform transition-transform duration-300"></span>
                  </label>
                </div>
                <span className="text-indigo-600 text-xs font-medium">
                  Active
                </span>
              </div>

              <button
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
                onClick={completeSale}
              >
                Pay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PointOfSale;
