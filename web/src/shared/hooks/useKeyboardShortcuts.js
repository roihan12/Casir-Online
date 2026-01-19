import { useEffect, useCallback } from 'react';

/**
 * POS Keyboard Shortcuts Configuration
 */
const POS_SHORTCUTS = {
  F1: 'help',
  F2: 'focusSearch',
  F3: 'barcodeMode',
  F4: 'selectCustomer',
  F5: 'holdTransaction',
  F6: 'resumeTransaction',
  F8: 'openPayment',
  F9: 'printReceipt',
  F10: 'closeShift',
  Escape: 'escape',
  Delete: 'deleteItem',
};

/**
 * useKeyboardShortcuts Hook
 * Handles keyboard shortcuts for POS operations
 * 
 * @param {Object} handlers - Object with handler functions for each action
 * @param {boolean} enabled - Whether shortcuts are active (default: true)
 * 
 * @example
 * useKeyboardShortcuts({
 *   focusSearch: () => searchRef.current?.focus(),
 *   openPayment: () => setShowPaymentModal(true),
 *   escape: () => setShowPaymentModal(false),
 * });
 */
export const useKeyboardShortcuts = (handlers = {}, enabled = true) => {
  const handleKeyDown = useCallback((event) => {
    if (!enabled) return;
    
    // Don't trigger shortcuts when typing in input fields (except for function keys)
    const tagName = event.target.tagName.toLowerCase();
    const isInputField = tagName === 'input' || tagName === 'textarea';
    const isFunctionKey = event.key.startsWith('F') && !isNaN(event.key.slice(1));
    
    if (isInputField && !isFunctionKey && event.key !== 'Escape') {
      return;
    }
    
    // Check if it's a known shortcut
    const action = POS_SHORTCUTS[event.key];
    if (action && handlers[action]) {
      event.preventDefault();
      handlers[action](event);
    }
    
    // Handle +/- for quantity adjustment
    if (event.key === '+' && handlers.increaseQty) {
      event.preventDefault();
      handlers.increaseQty();
    }
    if (event.key === '-' && handlers.decreaseQty) {
      event.preventDefault();
      handlers.decreaseQty();
    }
    
    // Handle Enter for confirmation
    if (event.key === 'Enter' && handlers.confirm && !isInputField) {
      event.preventDefault();
      handlers.confirm();
    }
  }, [handlers, enabled]);
  
  useEffect(() => {
    if (!enabled) return;
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
};

/**
 * Shortcut help modal data
 */
export const SHORTCUT_HELP = [
  { key: 'F1', description: 'Tampilkan bantuan' },
  { key: 'F2', description: 'Fokus pencarian produk' },
  { key: 'F3', description: 'Mode scan barcode' },
  { key: 'F4', description: 'Pilih pelanggan' },
  { key: 'F5', description: 'Hold transaksi' },
  { key: 'F6', description: 'Resume transaksi' },
  { key: 'F8', description: 'Buka pembayaran' },
  { key: 'F9', description: 'Print struk terakhir' },
  { key: 'F10', description: 'Tutup shift' },
  { key: 'Esc', description: 'Tutup modal / Batal' },
  { key: '+/-', description: 'Tambah/kurang qty' },
  { key: 'Del', description: 'Hapus item' },
];

export default useKeyboardShortcuts;
