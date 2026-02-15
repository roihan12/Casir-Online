import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook for accessing and managing camera
 * @param {Object} options - Hook options
 * @param {Object} options.videoRef - Video element ref
 * @param {boolean} options.autoStart - Auto-start camera on mount
 * @returns {Object} Camera state and functions
 */
export const useCamera = (options = {}) => {
  const { videoRef, autoStart = false } = options;

  const [isStreamActive, setIsStreamActive] = useState(false);
  const [error, setError] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const streamRef = useRef(null);

  /**
   * Start camera stream
   */
  const startCamera = useCallback(async () => {
    try {
      setError(null);

      // Check if browser supports mediaDevices
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser');
      }

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // Front camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      // Store stream reference
      streamRef.current = stream;

      // Attach stream to video element if provided
      if (videoRef?.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsStreamActive(true);
      return stream;

    } catch (err) {
      console.error('Camera start error:', err);
      setError(getCameraErrorMessage(err));
      setIsStreamActive(false);
      throw err;
    }
  }, [videoRef]);

  /**
   * Stop camera stream
   */
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      // Stop all tracks
      streamRef.current.getTracks().forEach(track => track.stop());

      // Clear video element if provided
      if (videoRef?.current) {
        videoRef.current.srcObject = null;
      }

      streamRef.current = null;
      setIsStreamActive(false);
    }
  }, [videoRef]);

  /**
   * Capture photo from video stream
   * @param {Object} options - Capture options
   * @param {number} options.width - Photo width
   * @param {number} options.height - Photo height
   * @param {string} options.format - Output format ('base64' or 'blob')
   * @param {number} options.quality - JPEG quality (0-1, default 0.85)
   * @param {number} options.maxWidth - Maximum width for compression (default 800)
   * @param {number} options.maxSizeKB - Maximum size in KB (default 300)
   * @returns {Promise<string|Blob>} Captured photo
   */
  const capturePhoto = useCallback(async (captureOptions = {}) => {
    const {
      width = 640,
      height = 480,
      format = 'base64',
      quality = 0.85,
      maxWidth = 800,
      maxSizeKB = 300
    } = captureOptions;

    if (!isStreamActive || !videoRef?.current) {
      throw new Error('Camera is not active');
    }

    try {
      const video = videoRef.current;

      // Calculate dimensions maintaining aspect ratio
      const videoRatio = video.videoWidth / video.videoHeight;
      let targetWidth = Math.min(width, maxWidth);
      let targetHeight = targetWidth / videoRatio;

      // Create canvas for capture
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');

      // Mirror the image (selfie mode)
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Reset transform
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      // Convert to desired format with compression
      if (format === 'base64') {
        // Start with initial quality
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        let currentQuality = quality;

        // Compress further if needed to meet max size
        while (dataUrl.length > maxSizeKB * 1024 * 1.37 && currentQuality > 0.1) {
          // 1.37 is approximate base64 overhead factor
          currentQuality -= 0.05;
          dataUrl = canvas.toDataURL('image/jpeg', currentQuality);
        }

        const base64 = dataUrl.split(',')[1]; // Remove data URL prefix
        setCapturedPhoto(base64);

        console.log(`Photo captured: ${(dataUrl.length / 1024).toFixed(2)} KB (quality: ${(currentQuality * 100).toFixed(0)}%)`);

        return base64;
      } else {
        return new Promise((resolve) => {
          canvas.toBlob((blob) => {
            resolve(blob);
          }, 'image/jpeg', quality);
        });
      }

    } catch (err) {
      console.error('Photo capture error:', err);
      throw new Error('Failed to capture photo');
    }
  }, [isStreamActive, videoRef]);

  /**
   * Clear captured photo
   */
  const clearPhoto = useCallback(() => {
    setCapturedPhoto(null);
  }, []);

  /**
   * Get user-friendly error message
   */
  const getCameraErrorMessage = (error) => {
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      return 'Camera permission denied. Please allow camera access in your browser settings.';
    }
    if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      return 'No camera found on this device.';
    }
    if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      return 'Camera is already in use by another application.';
    }
    if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
      return 'Camera does not support the required settings.';
    }
    if (error.name === 'TypeError') {
      return 'Camera not supported in this browser.';
    }
    return 'Failed to access camera: ' + error.message;
  };

  // Auto-start camera on mount if requested
  useEffect(() => {
    if (autoStart) {
      startCamera();
    }

    // Cleanup on unmount
    return () => {
      stopCamera();
    };
  }, [autoStart]);

  return {
    isStreamActive,
    error,
    capturedPhoto,
    startCamera,
    stopCamera,
    capturePhoto,
    clearPhoto
  };
};

export default useCamera;
