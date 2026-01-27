// Export all POS components for easy importing

// Layout Components
export { default as POSLayout } from './layout/POSLayout.jsx';
export { default as POSHeader } from './layout/POSHeader.jsx';

// Product Components
export { default as ProductsSection } from './products/ProductsSection.jsx';
export { default as CategoriesSection } from './products/CategoriesSection.jsx';

// Search Components
export { default as SearchBar } from './search/SearchBar.jsx';

// Cart Components
export { default as CartSection } from './cart/CartSection.jsx';

// Payment Components
export { default as PaymentModal } from './payment/PaymentModal.jsx';

// Receipt Components
export { default as ReceiptModal } from './receipt/ReceiptModal.jsx';

// Modal Components
export { default as KeyboardShortcutsHelp } from './modals/KeyboardShortcutsHelp.jsx';
export { default as BranchSelectorModal } from './modals/BranchSelectorModal.jsx';
export { default as CustomerSelectorModal } from './modals/CustomerSelectorModal.jsx';

// Shared Components
export { default as LoadingSpinner } from './shared/LoadingSpinner.jsx';
export { default as EmptyState } from './shared/EmptyState.jsx';
export { default as ErrorMessage, FullPageError } from './shared/ErrorMessage.jsx';