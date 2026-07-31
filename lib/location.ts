/** EWKT for PostGIS geography(point, 4326) inserts via PostgREST. */
export function pointEwkt(lng: number, lat: number): string {
  return `SRID=4326;POINT(${lng} ${lat})`;
}

export function parseLatLng(location: unknown): { lat: number; lng: number } | null {
  if (location == null) return null;

  if (typeof location === "object" && location !== null) {
    const geo = location as {
      type?: string;
      coordinates?: [number, number];
      lat?: number;
      lng?: number;
    };
    if (Array.isArray(geo.coordinates) && geo.coordinates.length >= 2) {
      const [lng, lat] = geo.coordinates;
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    }
    if (typeof geo.lat === "number" && typeof geo.lng === "number") {
      return { lat: geo.lat, lng: geo.lng };
    }
  }

  if (typeof location === "string") {
    const trimmed = location.trim();
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      return parseLatLng(parsed);
    } catch {
      // WKT / EWKT
    }
    const match = trimmed.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
    if (match) {
      const lng = Number(match[1]);
      const lat = Number(match[2]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    }
  }

  return null;
}
