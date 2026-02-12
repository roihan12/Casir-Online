import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-hot-toast";

/**
 * useBarcodeScanner - Hook untuk mendeteksi input barcode dari scanner
 * Barcode scanner biasanya mengirim karakter dengan cepat diakhiri Enter
 * 
 * @param {Object} options
 * @param {Function} options.onScan - Callback saat barcode terdeteksi (barcode) => void
 * @param {number} options.minLength - Minimum panjang barcode (default: 4)
 * @param {number} options.maxDelay - Max delay antar karakter dalam ms (default: 50)
 * @param {boolean} options.enabled - Enable/disable scanner (default: true)
 * @returns {Object} { isScanning, lastBarcode, toggleScanner }
 */
const useBarcodeScanner = (options = {}) => {
  const {
    onScan,
    minLength = 4,
    maxDelay = 50,
    enabled = true,
  } = options;

  const [isScanning, setIsScanning] = useState(false);
  const [scannerEnabled, setScannerEnabled] = useState(enabled);
  const [lastBarcode, setLastBarcode] = useState("");

  const bufferRef = useRef("");
  const lastKeyTimeRef = useRef(0);

  // Toggle scanner mode
  const toggleScanner = useCallback(() => {
    setScannerEnabled((prev) => {
      const newState = !prev;
      if (newState) {
        toast.success("Barcode scanner aktif", { icon: "📷" });
      } else {
        toast("Barcode scanner nonaktif", { icon: "⏸️" });
      }
      return newState;
    });
  }, []);

  // Enable scanner
  const enableScanner = useCallback(() => {
    setScannerEnabled(true);
    toast.success("Barcode scanner aktif", { icon: "📷" });
  }, []);

  // Disable scanner
  const disableScanner = useCallback(() => {
    setScannerEnabled(false);
  }, []);

  useEffect(() => {
    if (!scannerEnabled) return;

    const handleKeyDown = (event) => {
      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTimeRef.current;

      // If time between keystrokes is too long, reset buffer
      if (timeDiff > maxDelay && bufferRef.current.length > 0) {
        bufferRef.current = "";
      }

      lastKeyTimeRef.current = currentTime;

      // Enter key signals end of barcode
      if (event.key === "Enter") {
        if (bufferRef.current.length >= minLength) {
          const barcode = bufferRef.current.trim();
          setLastBarcode(barcode);
          setIsScanning(false);
          
          // Call callback with detected barcode
          if (onScan) {
            onScan(barcode);
          }
          
          // Prevent form submission if inside form
          event.preventDefault();
        }
        bufferRef.current = "";
        return;
      }

      // Only accept printable characters
      if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
        // Don't capture if user is typing in an input
        if (
          document.activeElement?.tagName === "INPUT" ||
          document.activeElement?.tagName === "TEXTAREA" ||
          document.activeElement?.isContentEditable
        ) {
          return;
        }

        bufferRef.current += event.key;
        setIsScanning(true);

        // Clear scanning state after short delay if no more input
        setTimeout(() => {
          if (Date.now() - lastKeyTimeRef.current > maxDelay * 2) {
            setIsScanning(false);
          }
        }, maxDelay * 2);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [scannerEnabled, onScan, minLength, maxDelay]);

  return {
    isScanning,
    lastBarcode,
    scannerEnabled,
    toggleScanner,
    enableScanner,
    disableScanner,
  };
};

export default useBarcodeScanner;
