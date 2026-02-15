import React, { useState, useCallback } from 'react';
import { Clock, MapPin, Camera, AlertCircle, Loader2 } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';
import { clockIn, getMyLocations } from '../services/attendanceService';
import AttendanceCamera from './AttendanceCamera';

/**
 * ClockInButton Component
 * Handles clock in with location verification and face recognition
 */
// Helper to calculate distance between two coordinates in meters
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * ClockInButton Component
 * Handles clock in with location verification and face recognition
 */
const ClockInButton = ({ onSuccess, onError, className = '' }) => {
  const [showCamera, setShowCamera] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [availableLocations, setAvailableLocations] = useState([]);

  const {
    position,
    error: locationError,
    loading: locationLoading,
    getCurrentPosition
  } = useGeolocation({ enableHighAccuracy: true });

  /**
   * Handle clock in process
   */
  const handleClockIn = useCallback(async () => {
    try {
      setIsProcessing(true);
      setStatusMessage('Getting location...');
      setError(null);

      // Get location if not already available
      let currentPosition = position;
      if (!currentPosition) {
        currentPosition = await getCurrentPosition();
      }

      setStatusMessage('Checking available locations...');
      // Get available locations
      const response = await getMyLocations();
      // Handle response structure (array or { data: [...] })
      const locations = Array.isArray(response) ? response : (response.data || []);
      
      const accessibleLocations = locations.filter(loc => loc.canAccess !== false); // Assuming default is true if undefined, or check logic

      if (accessibleLocations.length === 0) {
        throw new Error('No accessible attendance locations found. Please contact your administrator.');
      }

      setAvailableLocations(accessibleLocations);

      // If multiple locations, show selector
      if (accessibleLocations.length > 1) {
        setSelectedLocation(null);
        setShowLocationSelector(true);
        setStatusMessage('');
        setIsProcessing(false);
        return;
      }

      // Single location - proceed with verification
      const location = accessibleLocations[0];
      await verifyAndOpen(location, currentPosition);

    } catch (err) {
      const errorMessage = err.message || 'Failed to prepare clock in';
      setError(errorMessage);
      setIsProcessing(false);
      setStatusMessage('');
      if (onError) onError(errorMessage);
    }
  }, [position, getCurrentPosition, onError]);

  /**
   * Verify distance and open camera
   */
  const verifyAndOpen = async (location, currentPos) => {
    try {
      setStatusMessage('Verifying distance...');
      
      // Calculate distance
      const distance = calculateDistance(
        currentPos.latitude,
        currentPos.longitude,
        location.latitude,
        location.longitude
      );

      // Check against radius (default to 100m if not set)
      const maxRadius = location.radius || 100;
      
      if (distance > maxRadius) {
        throw new Error(`You are too far from ${location.nama}. Distance: ${Math.round(distance)}m, Allowed: ${maxRadius}m.`);
      }

      setSelectedLocation(location);
      setShowCamera(true);
    } catch (err) {
      throw err;
    } finally {
      // Keep processing true if successful (camera opens), otherwise false
      if (!showCamera) {
        setIsProcessing(false);
        setStatusMessage('');
      }
    }
  };

  /**
   * Handle photo capture
   */
  const handlePhotoCapture = useCallback(async (captureResult) => {
    try {
      setIsProcessing(true);
      setStatusMessage('Analyzing liveness...');
      setShowCamera(false);

      // Handle both single photo (string) and multi-frame (object)
      let photo, frames;
      if (typeof captureResult === 'string') {
        photo = captureResult;
      } else {
        photo = captureResult.mainPhoto || captureResult.frames[0];
        frames = captureResult.frames;
      }

      // Call clock in API
      const result = await clockIn({
        lokasiAbsensiId: selectedLocation.id,
        latitude: position.latitude,
        longitude: position.longitude,
        photo,
        frames // Pass frames if available
      });

      setStatusMessage('Success!');
      if (onSuccess) {
        onSuccess(result);
      }

    } catch (err) {
      const errorMessage = err.message || 'Clock in failed';
      setError(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setIsProcessing(false);
      setStatusMessage('');
    }
  }, [selectedLocation, position, onSuccess, onError]);

  /**
   * Handle camera cancel
   */
  const handleCameraCancel = useCallback(() => {
    setShowCamera(false);
    setSelectedLocation(null);
    setIsProcessing(false);
    setStatusMessage('');
  }, []);

  /**
   * Handle location selection
   */
  const handleLocationSelect = useCallback(async (location) => {
    setShowLocationSelector(false);
    setIsProcessing(true);
    
    try {
      // Need current position again/still
      let currentPosition = position;
      if (!currentPosition) {
        currentPosition = await getCurrentPosition();
      }
      
      await verifyAndOpen(location, currentPosition);
    } catch (err) {
      setError(err.message);
      setIsProcessing(false);
      setStatusMessage('');
    }
  }, [position, getCurrentPosition]);

  return (
    <>
      <button
        onClick={handleClockIn}
        disabled={isProcessing || locationLoading}
        className={`inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${className}`}
      >
        {isProcessing || locationLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {statusMessage || 'Processing...'}
          </>
        ) : (
          <>
            <Clock className="w-5 h-5" />
            Clock In
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

      {/* Location Selector Modal */}
      {showLocationSelector && (
        <LocationSelectorModal
          locations={availableLocations}
          onSelect={handleLocationSelect}
          onClose={() => {
            setShowLocationSelector(false);
            setIsProcessing(false);
            setStatusMessage('');
          }}
        />
      )}

      {/* Camera Modal */}
      {showCamera && selectedLocation && (
        <AttendanceCamera
          onCapture={handlePhotoCapture}
          onCancel={handleCameraCancel}
        />
      )}
    </>
  );
};

/**
 * Location Selector Modal Component
 */
const LocationSelectorModal = ({ locations, onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Select Attendance Location</h3>
        </div>

        <div className="p-4 max-h-96 overflow-y-auto">
          {locations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No accessible locations found
            </div>
          ) : (
            <div className="space-y-2">
              {locations.map((location) => (
                <button
                  key={location.id}
                  onClick={() => onSelect(location)}
                  className="w-full p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{location.nama}</p>
                      <p className="text-sm text-gray-600 truncate">{location.alamat}</p>
                      {location.isAssigned && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded">
                          Assigned
                        </span>
                      )}
                      
                       {/* Show distance if available? We could calculate it here too but not strictly necessary */}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClockInButton;
