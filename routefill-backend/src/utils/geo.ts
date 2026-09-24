/**
 * Geospatial computation utilities supporting Haversine distances,
 * corridor vector alignments, and spatial boundary lookups.
 */

/**
 * Calculates the great-circle distance between two points on the Earth's surface in kilometers.
 */
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's mean radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

/**
 * Computes cosine directional alignment between two route vectors to measure corridor overlap.
 * Returns a normalized value between 0.0 (opposite/perpendicular) and 1.0 (parallel along the same path).
 */
export function calculateRouteSimilarity(
  origin1Lat: number,
  origin1Lon: number,
  dest1Lat: number,
  dest1Lon: number,
  origin2Lat: number,
  origin2Lon: number,
  dest2Lat: number,
  dest2Lon: number
): number {
  const v1X = dest1Lon - origin1Lon;
  const v1Y = dest1Lat - origin1Lat;
  const v2X = dest2Lon - origin2Lon;
  const v2Y = dest2Lat - origin2Lat;

  const mag1 = Math.sqrt(v1X * v1X + v1Y * v1Y);
  const mag2 = Math.sqrt(v2X * v2X + v2Y * v2Y);

  if (mag1 === 0 || mag2 === 0) return 0.5;

  const dot = v1X * v2X + v1Y * v2Y;
  const cosTheta = dot / (mag1 * mag2);

  // Normalize from [-1, 1] to [0, 1]
  const normalized = (cosTheta + 1) / 2;
  return Math.round(normalized * 1000) / 1000;
}
