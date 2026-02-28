import React, { useEffect, useState } from "react";
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode";
import { X, Camera } from "lucide-react";

const CameraScannerModal = ({ isOpen, onClose, onScan }) => {
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setError(null);
      return;
    }

    // Initialize scanner
    const scanner = new Html5QrcodeScanner(
      "camera-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        rememberLastUsedCamera: true,
      },
      false // Verbose logging off
    );

    const onScanSuccess = (decodedText) => {
      onScan(decodedText);
      onClose(); // Auto close the scanner after successful scan
    };

    const onScanFailure = (err) => {
      // Ignored: html5-qrcode scans every frame and fails frequently when no QR/barcode
    };

    scanner.render(onScanSuccess, onScanFailure);

    // Cleanup function
    return () => {
      scanner.clear().catch((error) => {
        console.error("Failed to clear scanner", error);
      });
    };
  }, [isOpen, onScan, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-2 text-gray-800 font-bold text-xl">
            <Camera className="w-5 h-5 text-indigo-500" />
            <h2>Scan Barcode Kamera</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-50 text-gray-500 hover:text-red-500 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex flex-col items-center">
          <p className="text-gray-600 text-sm mb-4 text-center">
            Arahkan kamera ke barcode produk untuk otomatis mencari dan menambahkan produk ke keranjang.
          </p>
          
          <div id="camera-reader" className="w-full max-w-sm rounded overflow-hidden"></div>
          
          {error && (
            <p className="text-red-500 mt-4 text-sm text-center font-medium">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CameraScannerModal;
