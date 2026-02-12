import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-hot-toast";

/**
 * useAutoSave - Hook untuk auto-save draft ke localStorage
 * @param {string} key - Unique key untuk localStorage
 * @param {Object} data - Data yang akan di-save
 * @param {Object} options - Options
 * @param {number} options.debounceMs - Debounce delay in ms (default: 1000)
 * @param {boolean} options.enabled - Enable/disable auto-save (default: true)
 * @returns {Object} { hasDraft, loadDraft, clearDraft, lastSaved }
 */
const useAutoSave = (key, data, options = {}) => {
  const { debounceMs = 1000, enabled = true } = options;
  
  const [hasDraft, setHasDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const timeoutRef = useRef(null);
  const isInitialMount = useRef(true);

  const storageKey = `draft_${key}`;

  // Check for existing draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(storageKey);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed && parsed.data) {
          setHasDraft(true);
          setLastSaved(parsed.savedAt ? new Date(parsed.savedAt) : null);
          setShowRestorePrompt(true);
        }
      } catch (e) {
        console.error("Error parsing draft:", e);
        localStorage.removeItem(storageKey);
      }
    }
  }, [storageKey]);

  // Auto-save with debounce
  useEffect(() => {
    if (!enabled) return;
    
    // Skip initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for debounced save
    timeoutRef.current = setTimeout(() => {
      // Only save if data has meaningful content
      const hasContent = data && (
        (Array.isArray(data.selectedProducts) && data.selectedProducts.length > 0) ||
        (data.productPrices && Object.keys(data.productPrices).length > 0)
      );

      if (hasContent) {
        const saveData = {
          data,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(storageKey, JSON.stringify(saveData));
        setLastSaved(new Date());
        setHasDraft(true);
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, storageKey, debounceMs, enabled]);

  // Load draft from localStorage
  const loadDraft = useCallback(() => {
    const savedDraft = localStorage.getItem(storageKey);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setShowRestorePrompt(false);
        toast.success("Draft berhasil dimuat!");
        return parsed.data;
      } catch (e) {
        console.error("Error loading draft:", e);
        return null;
      }
    }
    return null;
  }, [storageKey]);

  // Clear draft from localStorage
  const clearDraft = useCallback(() => {
    localStorage.removeItem(storageKey);
    setHasDraft(false);
    setLastSaved(null);
    setShowRestorePrompt(false);
  }, [storageKey]);

  // Dismiss restore prompt
  const dismissRestorePrompt = useCallback(() => {
    setShowRestorePrompt(false);
  }, []);

  return {
    hasDraft,
    loadDraft,
    clearDraft,
    lastSaved,
    showRestorePrompt,
    dismissRestorePrompt,
  };
};

export default useAutoSave;
