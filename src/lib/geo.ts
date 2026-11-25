import type { LngLat } from '../types';

// Valhalla devuelve la ruta como polilínea codificada con precisión 6.
export function decodePolyline(str: string, precision = 6): LngLat[] {
  const factor = Math.pow(10, precision);
  const out: LngLat[] = [];
  let i = 0, lat = 0, lng = 0;
  while (i < str.length) {
    let result = 0, shift = 0, b: number;
    do { b = str.charCodeAt(i++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    result = 0; shift = 0;
    do { b = str.charCodeAt(i++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    out.push([lng / factor, lat / factor]);
  }
  return out;
}

export type BBox = [number, number, number, number]; // [oeste, sur, este, norte]

export function boundsOf(coords: LngLat[]): BBox {
  let w = 180, s = 90, e = -180, n = -90;
  for (const [lng, lat] of coords) {
    if (lng < w) w = lng;
    if (lng > e) e = lng;
    if (lat < s) s = lat;
    if (lat > n) n = lat;
  }
  return [w, s, e, n];
}

export function bboxAround([lng, lat]: LngLat, km: number): BBox {
  const dLat = km / 111.32;
  const dLng = km / (111.32 * Math.cos((lat * Math.PI) / 180));
  return [lng - dLng, lat - dLat, lng + dLng, lat + dLat];
}

export function distanceKm(a: LngLat, b: LngLat): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b[1] - a[1]);
  const dLng = rad(b[0] - a[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export function formatDistance(m: number) {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(m >= 10000 ? 0 : 1).replace('.', ',')} km`;
}

export function formatDuration(s: number) {
  const total = Math.round(s / 60);
  const h = Math.floor(total / 60);
  return h > 0 ? `${h} h ${total % 60} min` : `${total} min`;
}

export const formatMeters = (m: number) => `${m.toFixed(2).replace('.', ',')} m`;
