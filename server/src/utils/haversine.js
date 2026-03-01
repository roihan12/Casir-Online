/**
 * Haversine formula to calculate the distance between two GPS coordinates.
 * Returns distance in kilometers.
 *
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers (rounded to 2 decimals)
 */
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // Round to 2 decimals
};

/**
 * Calculate delivery fee based on distance.
 *
 * Pricing:
 * - Base fee: Rp3.000 (covers first 1 km)
 * - Per km after first: Rp2.000/km (rounded up)
 * - Max delivery radius: 15 km
 *
 * @param {number} distanceKm - Distance in kilometers
 * @returns {{ fee: number, isDeliverable: boolean }}
 */
const calculateDeliveryFee = (distanceKm) => {
  const BASE_FEE = 3000;
  const PER_KM_RATE = 2000;
  const MAX_RADIUS_KM = 15;

  if (distanceKm > MAX_RADIUS_KM) {
    return { fee: 0, isDeliverable: false, maxRadius: MAX_RADIUS_KM };
  }

  const extraKm = Math.max(0, distanceKm - 1);
  const fee = BASE_FEE + Math.ceil(extraKm) * PER_KM_RATE;

  return { fee, isDeliverable: true, maxRadius: MAX_RADIUS_KM };
};

module.exports = {
  haversineDistance,
  calculateDeliveryFee,
};
