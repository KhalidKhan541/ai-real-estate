export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface Address {
  street?: string;
  city: string;
  state: string;
  zip?: string;
  country?: string;
}

export interface GeocodingResult {
  coordinates: Coordinates;
  formattedAddress: string;
  components: {
    street?: string;
    city: string;
    state: string;
    zip?: string;
    country: string;
  };
  placeId?: string;
}

export interface DistanceResult {
  distance: number;
  duration: number;
  distanceText: string;
  durationText: string;
}

export interface MapBounds {
  center: Coordinates;
  zoom: number;
  bounds: BoundingBox;
}

const EARTH_RADIUS_KM = 6371;
const EARTH_RADIUS_MILES = 3959;

export function calculateDistance(
  from: Coordinates,
  to: Coordinates,
  unit: "km" | "miles" = "miles"
): number {
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLon = toRadians(to.longitude - from.longitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const radius = unit === "km" ? EARTH_RADIUS_KM : EARTH_RADIUS_MILES;
  return radius * c;
}

export function calculateDistanceText(
  from: Coordinates,
  to: Coordinates,
  unit: "km" | "miles" = "miles"
): string {
  const distance = calculateDistance(from, to, unit);
  const unitLabel = unit === "km" ? "km" : "mi";

  if (distance < 0.1) {
    return "Less than 0.1 " + unitLabel;
  }

  return `${distance.toFixed(1)} ${unitLabel}`;
}

export function getBoundingBox(
  coordinates: Coordinates[],
  padding: number = 0.01
): BoundingBox {
  if (coordinates.length === 0) {
    return {
      north: 0,
      south: 0,
      east: 0,
      west: 0,
    };
  }

  let north = coordinates[0].latitude;
  let south = coordinates[0].latitude;
  let east = coordinates[0].longitude;
  let west = coordinates[0].longitude;

  for (const coord of coordinates) {
    if (coord.latitude > north) north = coord.latitude;
    if (coord.latitude < south) south = coord.latitude;
    if (coord.longitude > east) east = coord.longitude;
    if (coord.longitude < west) west = coord.longitude;
  }

  return {
    north: north + padding,
    south: south - padding,
    east: east + padding,
    west: west - padding,
  };
}

export function getCenterPoint(coordinates: Coordinates[]): Coordinates {
  if (coordinates.length === 0) {
    return { latitude: 0, longitude: 0 };
  }

  if (coordinates.length === 1) {
    return coordinates[0];
  }

  let sumLat = 0;
  let sumLon = 0;

  for (const coord of coordinates) {
    sumLat += coord.latitude;
    sumLon += coord.longitude;
  }

  return {
    latitude: sumLat / coordinates.length,
    longitude: sumLon / coordinates.length,
  };
}

export function isPointInBoundingBox(
  point: Coordinates,
  bounds: BoundingBox
): boolean {
  return (
    point.latitude >= bounds.south &&
    point.latitude <= bounds.north &&
    point.longitude >= bounds.west &&
    point.longitude <= bounds.east
  );
}

export function isPointInRadius(
  point: Coordinates,
  center: Coordinates,
  radius: number,
  unit: "km" | "miles" = "miles"
): boolean {
  const distance = calculateDistance(point, center, unit);
  return distance <= radius;
}

export function getMapBounds(
  center: Coordinates,
  zoom: number,
  width: number,
  height: number
): BoundingBox {
  const latRad = toRadians(center.latitude);
  const metersPerPixel = 156543.03392 * Math.cos(latRad) / Math.pow(2, zoom);

  const halfWidth = (width / 2) * metersPerPixel;
  const halfHeight = (height / 2) * metersPerPixel;

  const earthRadius = EARTH_RADIUS_KM * 1000;

  const latDelta = (halfHeight / earthRadius) * (180 / Math.PI);
  const lonDelta = (halfWidth / earthRadius) * (180 / Math.PI) / Math.cos(latRad);

  return {
    north: center.latitude + latDelta,
    south: center.latitude - latDelta,
    east: center.longitude + lonDelta,
    west: center.longitude - lonDelta,
  };
}

export function getZoomLevel(
  bounds: BoundingBox,
  width: number,
  height: number
): number {
  const latDiff = bounds.north - bounds.south;
  const lonDiff = bounds.east - bounds.west;

  const latRad = toRadians((bounds.north + bounds.south) / 2);

  const metersPerDegreeLat = 111132.92;
  const metersPerDegreeLon = 111132.92 * Math.cos(latRad);

  const latMeters = latDiff * metersPerDegreeLat;
  const lonMeters = lonDiff * metersPerDegreeLon;

  const metersPerPixel = Math.max(latMeters / height, lonMeters / width);
  const zoom = Math.log2(156543.03392 / metersPerPixel);

  return Math.max(1, Math.min(22, Math.round(zoom)));
}

export function filterByDistance(
  items: Array<{ coordinates: Coordinates }>,
  center: Coordinates,
  radius: number,
  unit: "km" | "miles" = "miles"
): Array<{ coordinates: Coordinates; distance: number }> {
  return items
    .map((item) => ({
      ...item,
      distance: calculateDistance(center, item.coordinates, unit),
    }))
    .filter((item) => item.distance <= radius)
    .sort((a, b) => a.distance - b.distance);
}

export function generateHeatmapData(
  coordinates: Coordinates[],
  gridSize: number = 0.01
): Array<{ lat: number; lng: number; intensity: number }> {
  const grid = new Map<string, number>();

  for (const coord of coordinates) {
    const gridLat = Math.round(coord.latitude / gridSize) * gridSize;
    const gridLng = Math.round(coord.longitude / gridSize) * gridSize;
    const key = `${gridLat},${gridLng}`;
    grid.set(key, (grid.get(key) || 0) + 1);
  }

  const maxIntensity = Math.max(...Array.from(grid.values()));

  return Array.from(grid.entries()).map(([key, intensity]) => {
    const [lat, lng] = key.split(",").map(Number);
    return {
      lat,
      lng,
      intensity: intensity / maxIntensity,
    };
  });
}

export function formatDistance(distance: number, unit: "km" | "miles" = "miles"): string {
  const unitLabel = unit === "km" ? "km" : "mi";

  if (distance < 0.1) {
    return "Less than 0.1 " + unitLabel;
  }

  if (distance < 1) {
    return `${(distance * (unit === "km" ? 1000 : 5280)).toFixed(0)} ${unit === "km" ? "m" : "ft"}`;
  }

  return `${distance.toFixed(1)} ${unitLabel}`;
}

export function formatCoordinates(coords: Coordinates): string {
  const latDir = coords.latitude >= 0 ? "N" : "S";
  const lonDir = coords.longitude >= 0 ? "E" : "W";

  return `${Math.abs(coords.latitude).toFixed(6)}° ${latDir}, ${Math.abs(coords.longitude).toFixed(6)}° ${lonDir}`;
}

export function parseCoordinates(value: string): Coordinates | null {
  const parts = value.split(",").map((s) => s.trim());
  if (parts.length !== 2) return null;

  const lat = parseFloat(parts[0]);
  const lon = parseFloat(parts[1]);

  if (isNaN(lat) || isNaN(lon)) return null;
  if (lat < -90 || lat > 90) return null;
  if (lon < -180 || lon > 180) return null;

  return { latitude: lat, longitude: lon };
}

export function boundsToMapUrl(
  bounds: BoundingBox,
  zoom?: number
): string {
  const center = getCenterPoint([
    { latitude: bounds.north, longitude: bounds.east },
    { latitude: bounds.south, longitude: bounds.west },
  ]);

  const calculatedZoom = zoom || getZoomLevel(bounds, 800, 600);

  return `https://www.google.com/maps/@${center.latitude},${center.longitude},${calculatedZoom}z`;
}

export function getViewport(
  coordinates: Coordinates[],
  padding: number = 0.1
): { center: Coordinates; zoom: number } {
  if (coordinates.length === 0) {
    return { center: { latitude: 37.7749, longitude: -122.4194 }, zoom: 12 };
  }

  if (coordinates.length === 1) {
    return { center: coordinates[0], zoom: 15 };
  }

  const bounds = getBoundingBox(coordinates, padding);
  const center = getCenterPoint(coordinates);
  const zoom = getZoomLevel(bounds, 800, 600);

  return { center, zoom };
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function isWithinBounds(
  coordinates: Coordinates,
  mapBounds: BoundingBox
): boolean {
  return isPointInBoundingBox(coordinates, mapBounds);
}

export function clipToViewport(
  coordinates: Coordinates[],
  viewport: BoundingBox
): Coordinates[] {
  return coordinates.filter((coord) => isWithinBounds(coord, viewport));
}

export default {
  calculateDistance,
  calculateDistanceText,
  getBoundingBox,
  getCenterPoint,
  isPointInBoundingBox,
  isPointInRadius,
  getMapBounds,
  getZoomLevel,
  filterByDistance,
  generateHeatmapData,
  formatDistance,
  formatCoordinates,
  parseCoordinates,
  boundsToMapUrl,
  getViewport,
  isWithinBounds,
  clipToViewport,
};
