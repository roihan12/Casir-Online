# POS (Point of Sale) System Documentation

## Overview

A modern, modular Point of Sale system built with React, featuring:
- Real-time product management
- Multi-branch support
- Customer and discount management
- Retail/Wholesale modes
- Keyboard shortcuts
- Receipt generation
- QRIS and Cash payment options

## Architecture

### Directory Structure

```
src/features/pos/
├── components/          # React components organized by feature
│   ├── layout/         # Layout components (POSLayout, POSHeader)
│   ├── products/       # Product-related components
│   ├── search/         # Search components
│   ├── cart/           # Cart and checkout components
│   ├── payment/        # Payment processing components
│   ├── receipt/        # Receipt components
│   ├── modals/         # Modal dialogs
│   ├── shared/         # Shared/reusable components
│   └── index.js       # Component exports
├── hooks/              # Custom React hooks
│   ├── usePOSCart.js           # Cart management
│   ├── usePOSProducts.js        # Product fetching
│   ├── usePOSPayment.js        # Payment processing
│   ├── usePOSKeyboard.js       # Keyboard shortcuts
│   ├── usePOSReceipt.js        # Receipt handling
│   └── index.js
├── context/            # Context API for state management
│   ├── POSContext.jsx          # POS context provider
│   └── index.js
├── pages/              # POS pages
│   └── PointOfSale.jsx         # Main POS page
└── index.js           # Main export file
```

## Components

### Core Components

#### ReceiptModal
Displays transaction receipt with print functionality.
```jsx
import { ReceiptModal } from '@/features/pos';

<ReceiptModal 
  show={showReceipt}
  onClose={handleClose}
  data={receiptData}
  onPrint={handlePrint}
/>
```

#### KeyboardShortcutsHelp
Modal displaying available keyboard shortcuts.
```jsx
import { KeyboardShortcutsHelp } from '@/features/pos';

<KeyboardShortcutsHelp 
  show={showHelp}
  setShow={setShowHelp}
/>
```

#### SearchBar
Product search with autocomplete and history.
```jsx
import { SearchBar } from '@/features/pos';

<SearchBar
  productSearch={productSearch}
  setProductSearch={setProductSearch}
  searchHistory={searchHistory}
  searchResults={searchResults}
  showAutocomplete={showAutocomplete}
  setShowAutocomplete={setShowAutocomplete}
  showSearchHistory={showSearchHistory}
  setShowSearchHistory={setShowSearchHistory}
  addToCart={addToCart}
  isLoading={isLoading}
  clearHistory={clearHistory}
  inputRef={searchInputRef}
/>
```

#### CategoriesSection
Category filter with frequent products option.
```jsx
import { CategoriesSection } from '@/features/pos';

<CategoriesSection
  categories={categories}
  selectedCategory={selectedCategory}
  setSelectedCategory={setSelectedCategory}
  categoryColors={categoryColors}
  showFrequentProducts={showFrequentProducts}
  fetchFrequentProducts={fetchFrequentProducts}
/>
```

#### ProductsSection
Product grid display with inventory status.
```jsx
import { ProductsSection } from '@/features/pos';

<ProductsSection
  products={products}
  addToCart={addToCart}
  loading={loading}
  categories={categories}
  categoryColors={categoryColors}
  isFrequentProductsView={isFrequentProductsView}
/>
```

#### CartSection
Shopping cart with quantity management and checkout.
```jsx
import { CartSection } from '@/features/pos';

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
  handleQrisPayment={handleQrisPayment}
/>
```

## Custom Hooks

### usePOSCart
Manages shopping cart state and operations.

```javascript
import { usePOSCart } from '@/features/pos';

const {
  cart,
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
  getCartItems,
  validateCart,
  calculateTotals,
  subtotal,
  itemCount,
  uniqueItems,
} = usePOSCart(saleMode);
```

**Returns:**
- `cart`: Array of cart items
- `addToCart(product)`: Add product to cart
- `updateQuantity(itemId, quantity)`: Update item quantity
- `removeFromCart(itemId)`: Remove item from cart
- `clearCart()`: Clear all items
- `getCartItems()`: Get formatted items for transaction
- `validateCart()`: Validate stock availability
- `calculateTotals()`: Calculate subtotal and counts

### usePOSProducts
Manages product data and categories.

```javascript
import { usePOSProducts } from '@/features/pos';

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
  getProductById,
} = usePOSProducts(branchId);
```

**Returns:**
- `products`: Array of products
- `categories`: Array of categories
- `loading`: Loading state
- `fetchProducts()`: Fetch products by category
- `fetchFrequentProducts()`: Fetch frequently purchased products
- `searchProducts(query)`: Search products by name/SKU/barcode

### usePOSPayment
Handles payment processing and receipt generation.

```javascript
import { usePOSPayment } from '@/features/pos';

const {
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
} = usePOSPayment();
```

**Methods:**
- `processPayment(params)`: Process payment transaction
- `handleQrisPayment(params)`: Process QRIS payment
- `handleCashPayment(params)`: Process cash payment
- `closeReceipt()`: Close receipt modal
- `reset()`: Reset payment state

### usePOSKeyboard
Manages keyboard shortcuts.

```javascript
import { usePOSKeyboard } from '@/features/pos';

usePOSKeyboard({
  onFocusSearch: () => searchInputRef.current?.focus(),
  onShowCategories: () => setShowCategories(true),
  onShowHelp: () => setShowHelp(true),
  onCloseModals: () => closeAllModals(),
  onSelectCategory: (index) => selectCategoryByIndex(index),
  onProcessCashPayment: () => processPayment({ method: 'cash' }),
  onProcessQrisPayment: () => processPayment({ method: 'qris' }),
  onToggleMode: () => setSaleMode(prev => prev === 'retail' ? 'wholesale' : 'retail'),
  onSelectCustomer: () => setShowCustomerSearch(true),
  onSelectBranch: () => setShowBranchSelector(true),
  onClearSearch: () => setProductSearch(''),
});
```

**Keyboard Shortcuts:**
- `F1`: Show keyboard help
- `F2`: Focus search input
- `F3`: Show categories
- `1-9`: Select category by index
- `Esc`: Close modals / clear search
- `Ctrl+P`: Process cash payment
- `Ctrl+Q`: Process QRIS payment
- `Ctrl+M`: Toggle retail/wholesale mode
- `Ctrl+C`: Select customer
- `Ctrl+B`: Select branch

### usePOSReceipt
Handles receipt printing and downloading.

```javascript
import { usePOSReceipt } from '@/features/pos';

const {
  printReceipt,
  downloadReceiptPDF,
  formatReceiptDate,
  formatReceiptTime,
} = usePOSReceipt();
```

**Methods:**
- `printReceipt(element)`: Print receipt content
- `downloadReceiptPDF(receiptData)`: Download as PDF
- `formatReceiptDate(date)`: Format date for receipt
- `formatReceiptTime(date)`: Format time for receipt

## Context API

### POSProvider
Wraps POS components with state management.

```jsx
import { POSProvider } from '@/features/pos';

function App() {
  return (
    <POSProvider>
      <PointOfSale />
    </POSProvider>
  );
}
```

### usePOSContext
Access POS state and actions.

```javascript
import { usePOSContext } from '@/features/pos';

const {
  // State
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
  user,
  
  // Actions
  actions: {
    setSelectedBranch,
    setSelectedCustomer,
    setSaleMode,
    setDiscount,
    setDiscountType,
    setShowCustomerSearch,
    setShowBranchSelector,
    setShowPaymentModal,
    setShowReceiptModal,
    setShowKeyboardHelp,
    setReceiptData,
    addToSearchHistory,
    clearSearchHistory,
    setPaymentAmount,
    resetState,
  },
} = usePOSContext();
```

## Usage Example

### Basic POS Setup

```jsx
import React, { useState, useRef } from 'react';
import { 
  POSProvider, 
  usePOSCart, 
  usePOSProducts, 
  usePOSPayment,
  usePOSKeyboard,
  ReceiptModal,
  SearchBar,
  ProductsSection,
  CartSection,
} from '@/features/pos';
import { useAuth } from '@/features/auth';

function PointOfSale() {
  const { user } = useAuth();
  const searchInputRef = useRef(null);
  
  // Hooks
  const {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = usePOSCart('retail');
  
  const {
    products,
    categories,
    loading,
    searchProducts,
  } = usePOSProducts(user?.branchId);
  
  const {
    processPayment,
    handleQrisPayment,
    receiptData,
    showReceipt,
    closeReceipt,
  } = usePOSPayment();
  
  // Keyboard shortcuts
  usePOSKeyboard({
    onFocusSearch: () => searchInputRef.current?.focus(),
    onProcessCashPayment: () => processPayment({ ... }),
    onProcessQrisPayment: () => handleQrisPayment({ ... }),
    // ... other callbacks
  });
  
  const [productSearch, setProductSearch] = useState('');
  
  const handlePayment = async () => {
    const result = await processPayment({
      cartItems: cart,
      customer: selectedCustomer,
      branch: selectedBranch,
      user,
      saleMode,
      discount,
      discountType,
      paymentMethod: 'TUNAI',
      amountPaid: paymentAmount,
    });
    
    if (result.success) {
      clearCart();
      resetState();
    }
  };
  
  return (
    <div className="flex h-screen">
      <div className="flex-1">
        <SearchBar
          productSearch={productSearch}
          setProductSearch={setProductSearch}
          addToCart={addToCart}
          inputRef={searchInputRef}
          // ... other props
        />
        <ProductsSection
          products={products}
          addToCart={addToCart}
          loading={loading}
        />
      </div>
      <CartSection
        cart={cart}
        updateQuantity={updateQuantity}
        removeFromCart={removeFromCart}
        processPayment={handlePayment}
        handleQrisPayment={handleQrisPayment}
        // ... other props
      />
      <ReceiptModal
        show={showReceipt}
        onClose={closeReceipt}
        data={receiptData}
      />
    </div>
  );
}
```

## Integration with Existing Services

### Product Service
Ensure `productService` has these methods:
- `getCategories()`
- `getProductsByBranch(params)`
- `searchProducts(query, branchId)`
- `getFrequentProducts(branchId)`
- `getProductById(id)`

### POS Service
Ensure `posService` has:
- `createTransaction(transactionData)`

### Customer Service
Ensure `customerService` has:
- `searchCustomers(query)`
- `getCustomerById(id)`

## State Persistence

The POS system uses `localStorage` for:
- **Cart**: Saved automatically on cart changes
- **Search History**: Last 10 searches persisted

## Performance Optimization

### Implemented Optimizations:
1. **useCallback**: Memoized callbacks to prevent unnecessary re-renders
2. **useReducer**: Efficient state updates with reducer pattern
3. **Context API**: Centralized state management
4. **Debounced Search**: (To be implemented) Debounce search queries
5. **Virtual Scrolling**: (To be implemented) For large product lists

## Testing

### Unit Tests
```bash
# Run tests
npm test src/features/pos
```

### Integration Tests
Test scenarios:
1. Add to cart
2. Update quantity
3. Remove from cart
4. Process payment
5. Generate receipt
6. Keyboard shortcuts

## Future Enhancements

1. **Offline Mode**: Cache products for offline use
2. **Multiple Payment Methods**: Add credit card, debit, etc.
3. **Split Payments**: Allow multiple payment methods per transaction
4. **Hold Transactions**: Save and resume transactions
5. **Barcode Scanner**: Integrate hardware scanner
6. **Receipt Email**: Email receipts to customers
7. **Analytics Dashboard**: Sales analytics and reporting
8. **Quick Actions**: Customizable quick-action buttons
9. **Product Variants**: Support for size, color variants
10. **Multi-language**: Support for multiple languages

## Troubleshooting

### Common Issues

1. **Cart not persisting**: Check localStorage availability
2. **Products not loading**: Verify branch ID and API connectivity
3. **Payment failing**: Check transaction data format and API response
4. **Receipt not printing**: Check pop-up blocker settings

## Contributing

When adding new features:
1. Create component in appropriate subdirectory
2. Create custom hook if logic is complex
3. Update context if global state is needed
4. Add keyboard shortcut if applicable
5. Update documentation

## License

Part of CASIR-Online project