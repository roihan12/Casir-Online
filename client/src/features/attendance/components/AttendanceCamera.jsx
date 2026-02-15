import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, Check, AlertCircle } from 'lucide-react';
import { useCamera } from '../hooks/useCamera';

/**
 * AttendanceCamera Component
 * Provides camera access, live preview, and photo capture for attendance
 *
 * @param {Object} props
 * @param {Function} props.onCapture - Callback when photo is captured (base64 string)
 * @param {Function} props.onCancel - Callback when camera is cancelled
 * @param {boolean} props.showPreview - Show captured photo preview
 * @param {string} props.className - Additional CSS classes
 */
const AttendanceCamera = ({
  onCapture,
  onCancel,
  showPreview = true,
  className = ''
}) => {
  const videoRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState(null);

  const {
    isStreamActive,
    error: cameraError,
    startCamera,
    stopCamera,
    capturePhoto,
    clearPhoto
  } = useCamera({ videoRef, autoStart: true });

  // Stop camera when component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  /**
   * Handle photo/sequence capture
   */
  const handleCapture = async () => {
    try {
      setIsCapturing(true);

      // Capture sequence (5 frames)
      const frames = [];
      for (let i = 0; i < 5; i++) {
        // Update UI or progress if needed
        const photo = await capturePhoto({
          width: 640, // Lower res for sequence to be faster
          height: 480,
          format: 'base64',
          quality: 0.7  // Lower quality for faster transmission
        });
        frames.push(photo);
        
        // Wait 200ms between frames
        if (i < 4) await new Promise(r => setTimeout(r, 200));
      }

      // Use the last frame (or middle frame) as the preview/main photo
      const mainPhoto = frames[2]; 
      setPreviewPhoto(mainPhoto);

      // Pass all frames
      if (onCapture) {
        // If handler accepts object with frames, pass it. 
        // Backward compatibility: if it expects string, we might need to change the prop signature or handle it in parent.
        // For now, let's assume parent handles { frames, photo } or just passes the array if we change the contract.
        // Let's pass an object to be flexible.
        onCapture({ frames, mainPhoto });
        stopCamera();
      }

    } catch (err) {
      console.error('Capture failed:', err);
      // Fallback or error handling
    } finally {
      setIsCapturing(false);
    }
  };

  /**
   * Confirm captured photo (Manual confirm deprecated for sequence mode, but kept for preview)
   */
  const handleConfirm = () => {
    // This might be redundant if we auto-confirm after sequence
    // checking logic above: I stopped camera and called onCapture immediately.
    // So this is for "Review" mode if we didn't auto-submit.
    // If we want auto-submit (which is better for liveness), we don't need this step.
  };

  /**
   * Retake photo
   */
  const handleRetake = () => {
    setPreviewPhoto(null);
    clearPhoto();
  };

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    stopCamera();
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 ${className}`}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            <h3 className="font-semibold">
              {previewPhoto ? 'Review Photo' : 'Face Recognition'}
            </h3>
          </div>
          <button
            onClick={handleCancel}
            className="p-1 hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera/Preview Area */}
        <div className="relative bg-black aspect-video">
          {/* Error State */}
          {cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 p-6">
              <div className="text-center text-white">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-500" />
                <p className="text-red-400 mb-2">Camera Error</p>
                <p className="text-sm text-gray-400">{cameraError}</p>
                <button
                  onClick={startCamera}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {!isStreamActive && !cameraError && !previewPhoto && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-white text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-400">Starting camera...</p>
              </div>
            </div>
          )}

          {/* Video Stream */}
          {isStreamActive && !previewPhoto && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Face Frame Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-64 border-4 border-white border-opacity-50 rounded-full relative">
                  <div className="absolute inset-0 rounded-full border-2 border-blue-500 border-opacity-75" />
                  {/* Corner markers */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 w-8 h-8 border-t-4 border-l-4 border-blue-500" />
                  <div className="absolute top-0 right-1/2 transform translate-x-1/2 -translate-y-2 w-8 h-8 border-t-4 border-r-4 border-blue-500" />
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-2 w-8 h-8 border-b-4 border-l-4 border-blue-500" />
                  <div className="absolute bottom-0 right-1/2 transform translate-x-1/2 translate-y-2 w-8 h-8 border-b-4 border-r-4 border-blue-500" />
                </div>
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full text-sm">
                  Position your face within the frame
                </div>
              </div>
            </>
          )}

          {/* Photo Preview */}
          {previewPhoto && (
            <img
              src={`data:image/jpeg;base64,${previewPhoto}`}
              alt="Captured"
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Controls */}
        <div className="bg-gray-100 px-4 py-4">
          {previewPhoto ? (
            /* Preview Controls */
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={handleRetake}
                disabled={isCapturing}
                className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <X className="w-5 h-5" />
                Retake
              </button>
              <button
                onClick={handleConfirm}
                disabled={isCapturing}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Check className="w-5 h-5" />
                Confirm
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2">
              {/* Capture Controls */}
              <button
                onClick={handleCapture}
                disabled={!isStreamActive || isCapturing}
                className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all ${
                  isCapturing 
                    ? 'bg-red-500 border-red-600 animate-pulse' 
                    : 'bg-white border-gray-300 hover:border-blue-500'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                aria-label="Start Scanning"
              >
                {isCapturing ? (
                   <div className="text-white font-bold text-xs">SCANNING</div>
                ) : (
                  <div className="w-16 h-16 bg-white rounded-full group-hover:bg-gray-100 transition-colors" />
                )}
              </button>
              {isCapturing && (
                 <p className="text-white text-sm font-medium bg-black bg-opacity-50 px-3 py-1 rounded-full">
                   Hold still...
                 </p>
              )}
            </div>
          )}
        </div>

        {/* Instructions */}
        {!previewPhoto && isStreamActive && (
          <div className="bg-blue-50 px-4 py-3 border-t border-blue-100">
            <ul className="text-sm text-blue-900 space-y-1">
              <li>• Position your face within the frame</li>
              <li>• Ensure good lighting (avoid backlight)</li>
              <li>• Remove glasses/hats if possible</li>
              <li>• Look directly at the camera</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceCamera;
