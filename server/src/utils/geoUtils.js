/**
 * Geolocation utility functions for distance calculations and geofencing
 */

/**
 * Calculate the Haversine distance between two coordinates
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in meters
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Check if a point is within a circular geofence
 * @param {number} pointLat - Latitude of the point to check
 * @param {number} pointLon - Longitude of the point to check
 * @param {number} centerLat - Latitude of the circle center
 * @param {number} centerLon - Longitude of the circle center
 * @param {number} radius - Radius in meters
 * @returns {boolean} True if point is within the circle
 */
function isPointInCircle(pointLat, pointLon, centerLat, centerLon, radius) {
  const distance = haversineDistance(pointLat, pointLon, centerLat, centerLon);
  return distance <= radius;
}

/**
 * Check if a point is within a polygon using ray casting algorithm
 * @param {number} pointLat - Latitude of the point to check
 * @param {number} pointLon - Longitude of the point to check
 * @param {Array<Array<number>>} polygon - Array of [lat, lon] pairs defining the polygon
 * @returns {boolean} True if point is within the polygon
 */
function isPointInPolygon(pointLat, pointLon, polygon) {
  const x = pointLon;
  const y = pointLat;

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][1], yi = polygon[i][0];
    const xj = polygon[j][1], yj = polygon[j][0];

    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Calculate the centroid of a polygon
 * @param {Array<Array<number>>} polygon - Array of [lat, lon] pairs
 * @returns {Array<number>} [lat, lon] of the centroid
 */
function calculatePolygonCentroid(polygon) {
  let lat = 0, lon = 0;
  polygon.forEach(point => {
    lat += point[0];
    lon += point[1];
  });
  return [lat / polygon.length, lon / polygon.length];
}

/**
 * Convert radius in meters to degrees (approximately)
 * @param {number} radiusInMeters - Radius in meters
 * @param {number} latitude - Latitude for more accurate conversion
 * @returns {number} Radius in degrees
 */
function metersToDegrees(radiusInMeters, latitude = 0) {
  // 1 degree of latitude = approximately 111,000 meters
  // 1 degree of longitude = approximately 111,000 * cos(latitude) meters
  const latDegrees = radiusInMeters / 111000;
  const lonDegrees = radiusInMeters / (111000 * Math.cos(latitude * Math.PI / 180));
  return { lat: latDegrees, lon: lonDegrees };
}

/**
 * Convert degrees to meters (approximately)
 * @param {number} degrees - Degrees to convert
 * @param {number} latitude - Latitude for more accurate conversion
 * @returns {number} Distance in meters
 */
function degreesToMeters(degrees, latitude = 0) {
  const latMeters = degrees * 111000;
  const lonMeters = degrees * 111000 * Math.cos(latitude * Math.PI / 180);
  return { lat: latMeters, lon: lonMeters };
}

/**
 * Validate GPS coordinates
 * @param {number} lat - Latitude to validate
 * @param {number} lon - Longitude to validate
 * @returns {boolean} True if coordinates are valid
 */
function isValidCoordinates(lat, lon) {
  return (
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    !isNaN(lat) &&
    !isNaN(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

/**
 * Format coordinates for display
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} precision - Decimal places (default: 6)
 * @returns {string} Formatted coordinates
 */
function formatCoordinates(lat, lon, precision = 6) {
  return `${lat.toFixed(precision)}, ${lon.toFixed(precision)}`;
}

/**
 * Calculate bounding box for a given center point and radius
 * @param {number} centerLat - Center latitude
 * @param {number} centerLon - Center longitude
 * @param {number} radius - Radius in meters
 * @returns {Object} Bounding box { minLat, maxLat, minLon, maxLon }
 */
function calculateBoundingBox(centerLat, centerLon, radius) {
  const { lat: latDeg, lon: lonDeg } = metersToDegrees(radius, centerLat);

  return {
    minLat: centerLat - latDeg,
    maxLat: centerLat + latDeg,
    minLon: centerLon - lonDeg,
    maxLon: centerLon + lonDeg
  };
}

/**
 * Get compass direction from point 1 to point 2
 * @param {number} lat1 - Starting latitude
 * @param {number} lon1 - Starting longitude
 * @param {number} lat2 - Ending latitude
 * @param {number} lon2 - Ending longitude
 * @returns {string} Compass direction (N, NE, E, SE, S, SW, W, NW)
 */
function getCompassDirection(lat1, lon1, lat2, lon2) {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);
  const bearing = ((θ * 180) / Math.PI + 360) % 360;

  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(bearing / 45) % 8;

  return directions[index];
}

module.exports = {
  haversineDistance,
  isPointInCircle,
  isPointInPolygon,
  calculatePolygonCentroid,
  metersToDegrees,
  degreesToMeters,
  isValidCoordinates,
  formatCoordinates,
  calculateBoundingBox,
  getCompassDirection
};
