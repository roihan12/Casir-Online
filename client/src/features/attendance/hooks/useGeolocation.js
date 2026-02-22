import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for accessing and managing geolocation
 * @param {Object} options - Hook options
 * @param {boolean} options.watch - Watch position changes
 * @param {boolean} options.enableHighAccuracy - Enable high accuracy mode
 * @param {number} options.timeout - Position timeout in ms
 * @param {number} options.maximumAge - Maximum age of cached position
 * @returns {Object} Geolocation state and functions
 */
export const useGeolocation = (options = {}) => {
  const {
    watch = false,
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0
  } = options;

  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [watchId, setWatchId] = useState(null);

  /**
   * Get current position once
   */
  const getCurrentPosition = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const err = new Error('Geolocation is not supported by this browser');
        setError(err.message);
        reject(err);
        return;
      }

      setLoading(true);
      setError(null);

      const tryGetPosition = (options) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const positionData = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              altitude: pos.coords.altitude,
              altitudeAccuracy: pos.coords.altitudeAccuracy,
              heading: pos.coords.heading,
              speed: pos.coords.speed,
              timestamp: pos.timestamp
            };

            setPosition(positionData);
            setLoading(false);
            resolve(positionData);
          },
          (err) => {
            // First time it failed, if it was a timeout and we were using high accuracy, try again with low accuracy
            if (err.code === err.TIMEOUT && options.enableHighAccuracy) {
              console.warn('High accuracy geolocation timed out, falling back to low accuracy');
              tryGetPosition({ ...options, enableHighAccuracy: false, timeout: 15000 });
              return;
            }

            const errorMessage = getGeolocationErrorMessage(err);
            setError(errorMessage);
            setLoading(false);
            reject(new Error(errorMessage));
          },
          options
        );
      };

      tryGetPosition({ enableHighAccuracy, timeout, maximumAge });
    });
  }, [enableHighAccuracy, timeout, maximumAge]);

  /**
   * Start watching position changes
   */
  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    if (watchId !== null) {
      return; // Already watching
    }

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const positionData = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude,
          altitudeAccuracy: pos.coords.altitudeAccuracy,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          timestamp: pos.timestamp
        };

        setPosition(positionData);
        setError(null);
        setLoading(false);
      },
      (err) => {
        const errorMessage = getGeolocationErrorMessage(err);
        setError(errorMessage);
        setLoading(false);
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge
      }
    );

    setWatchId(id);
  }, [watchId, enableHighAccuracy, timeout, maximumAge]);

  /**
   * Stop watching position changes
   */
  const stopWatching = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  }, [watchId]);

  /**
   * Get user-friendly error message
   */
  const getGeolocationErrorMessage = (error) => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        if (window.isSecureContext === false) {
          return 'Izin lokasi ditolak karena koneksi tidak aman. Jika Anda mengakses via jaringan lokal (IP) di HP, fitur absensi lokasi membutuhkan HTTPS atau localhost.';
        }
        return 'Izin lokasi ditolak. Harap izinkan akses lokasi (location) di pengaturan browser Anda, lalu muat ulang halaman.';
      case error.POSITION_UNAVAILABLE:
        return 'Informasi lokasi tidak tersedia. Pastikan GPS/Lokasi perangkat Anda menyala.';
      case error.TIMEOUT:
        return 'Permintaan lokasi memakan waktu terlalu lama (timeout). Periksa sinyal GPS Anda dan coba lagi.';
      default:
        return 'Terjadi kesalahan tidak dikenal saat mengambil lokasi.';
    }
  };

  /**
   * Calculate distance between two coordinates (Haversine formula)
   * @param {number} lat1 - First point latitude
   * @param {number} lon1 - First point longitude
   * @param {number} lat2 - Second point latitude
   * @param {number} lon2 - Second point longitude
   * @returns {number} Distance in meters
   */
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }, []);

  /**
   * Check if point is within radius of another point
   * @param {number} pointLat - Point latitude
   * @param {number} pointLon - Point longitude
   * @param {number} centerLat - Center latitude
   * @param {number} centerLon - Center longitude
   * @param {number} radius - Radius in meters
   * @returns {boolean} True if point is within radius
   */
  const isWithinRadius = useCallback((pointLat, pointLon, centerLat, centerLon, radius) => {
    const distance = calculateDistance(pointLat, pointLon, centerLat, centerLon);
    return distance <= radius;
  }, [calculateDistance]);

  /**
   * Format coordinates for display
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @param {number} precision - Decimal places
   * @returns {string} Formatted coordinates
   */
  const formatCoordinates = useCallback((lat, lon, precision = 6) => {
    return `${lat.toFixed(precision)}, ${lon.toFixed(precision)}`;
  }, []);

  // Auto-start position tracking if watch option is enabled
  useEffect(() => {
    if (watch) {
      getCurrentPosition();
      startWatching();
    }

    return () => {
      if (watch) {
        stopWatching();
      }
    };
  }, [watch]);

  return {
    position,
    error,
    loading,
    isWatching: watchId !== null,
    getCurrentPosition,
    startWatching,
    stopWatching,
    calculateDistance,
    isWithinRadius,
    formatCoordinates
  };
};

export default useGeolocation;
