import React, { useState, useRef, useEffect } from "react";
import { Camera, X, Image, Upload, Check, AlertTriangle } from "lucide-react";

const InvoiceScanner = ({ onCapture, onClose }) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize camera
  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraOpen(true);
      }
    } catch (err) {
      setError("Camera access failed: " + err.message);
      console.error("Error accessing camera:", err);
    }
  };

  // Clean up camera resources
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  // Capture image from camera
  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to data URL
      const imageDataUrl = canvas.toDataURL("image/jpeg");
      setCapturedImage(imageDataUrl);

      // Stop camera after capture
      stopCamera();
    }
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage(e.target.result);
        setIsUploading(false);
      };
      reader.onerror = () => {
        setError("Failed to read file");
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Process the captured image
  const processImage = () => {
    if (capturedImage && onCapture) {
      onCapture(capturedImage);
    }
  };

  // Reset the component state
  const reset = () => {
    setCapturedImage(null);
    setError(null);
    setIsCameraOpen(false);
  };

  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-4 py-3 bg-indigo-600 text-white flex justify-between items-center">
          <div className="flex items-center">
            <Camera className="w-5 h-5 mr-2" />
            <h3 className="text-lg font-medium">Invoice Scanner</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {error && (
            <div className="text-center py-4 px-3 mb-4 bg-red-50 rounded-md border border-red-200">
              <AlertTriangle className="w-6 h-6 text-red-500 mx-auto mb-2" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {!capturedImage && !isCameraOpen && (
            <div className="flex flex-col gap-4">
              <button
                onClick={startCamera}
                className="flex items-center justify-center w-full py-3 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                <Camera className="w-5 h-5 mr-2" />
                Open Camera
              </button>

              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Upload Image
                </button>
              </div>
            </div>
          )}

          {isCameraOpen && (
            <div className="mb-4">
              <div className="relative rounded-lg overflow-hidden mb-3">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-[300px] object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 border-2 border-white border-opacity-50 pointer-events-none" />
              </div>

              <button
                onClick={captureImage}
                className="flex items-center justify-center w-full py-3 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                <Camera className="w-5 h-5 mr-2" />
                Capture Invoice
              </button>
            </div>
          )}

          {capturedImage && (
            <div className="mb-4">
              <div className="mb-3 rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={capturedImage}
                  alt="Captured invoice"
                  className="w-full object-contain max-h-[300px]"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={reset}
                  className="flex-1 flex items-center justify-center py-2 px-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  <X className="w-4 h-4 mr-1" />
                  Retake
                </button>

                <button
                  onClick={processImage}
                  className="flex-1 flex items-center justify-center py-2 px-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Process Image
                </button>
              </div>
            </div>
          )}

          {isUploading && (
            <div className="text-center py-8">
              <div className="w-10 h-10 border-t-2 border-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Uploading image...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceScanner;
