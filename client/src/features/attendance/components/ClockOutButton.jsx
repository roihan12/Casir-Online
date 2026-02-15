import React, { useState, useCallback } from 'react';
import { Clock, MapPin, AlertCircle, Loader2 } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';
import { clockOut } from '../services/attendanceService';
import AttendanceCamera from './AttendanceCamera';

/**
 * ClockOutButton Component
 * Handles clock out with location verification and face recognition
 */
const ClockOutButton = ({ attendanceRecord, onSuccess, onError, className = '' }) => {
  const [showCamera, setShowCamera] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const {
    position,
    error: locationError,
    loading: locationLoading,
    getCurrentPosition
  } = useGeolocation({ enableHighAccuracy: true });

  /**
   * Handle clock out process
   */
  const handleClockOut = useCallback(async () => {
    try {
      setIsProcessing(true);
      setError(null);

      // Get location if not already available
      let currentPosition = position;
      if (!currentPosition) {
        currentPosition = await getCurrentPosition();
      }

      // Show camera for face verification
      setShowCamera(true);

    } catch (err) {
      const errorMessage = err.message || 'Failed to prepare clock out';
      setError(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [position, getCurrentPosition, onError]);

  /**
   * Handle photo capture
   */
  const handlePhotoCapture = useCallback(async (photo) => {
    try {
      setIsProcessing(true);
      setShowCamera(false);

      // Use the same location from clock in
      const lokasiAbsensiId = attendanceRecord?.lokasiAbsensiId;

      if (!lokasiAbsensiId) {
        throw new Error('Attendance location not found');
      }

      // Handle both single photo (string) and multi-frame (object)
      let photoPayload, framesPayload;
      
      if (typeof photo === 'string') {
        photoPayload = photo;
      } else {
        photoPayload = photo.mainPhoto || photo.frames[0];
        framesPayload = photo.frames;
      }

      // Call clock out API
      const result = await clockOut({
        lokasiAbsensiId,
        latitude: position.latitude,
        longitude: position.longitude,
        photo: photoPayload,
        frames: framesPayload
      });

      if (onSuccess) {
        onSuccess(result);
      }

    } catch (err) {
      const errorMessage = err.message || 'Clock out failed';
      setError(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [attendanceRecord, position, onSuccess, onError]);

  /**
   * Handle camera cancel
   */
  const handleCameraCancel = useCallback(() => {
    setShowCamera(false);
  }, []);

  return (
    <>
      <button
        onClick={handleClockOut}
        disabled={isProcessing || locationLoading}
        className={`inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${className}`}
      >
        {isProcessing || locationLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Clock className="w-5 h-5" />
            Clock Out
          </>
        )}
      </button>

      {/* Error Display */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-800">{error}</p>
            {locationError && (
              <p className="text-xs text-red-600 mt-1">Location: {locationError}</p>
            )}
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800"
          >
            ×
          </button>
        </div>
      )}

      {/* Camera Modal */}
      {showCamera && (
        <AttendanceCamera
          onCapture={handlePhotoCapture}
          onCancel={handleCameraCancel}
        />
      )}
    </>
  );
};

export default ClockOutButton;
