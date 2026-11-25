import { CONFIG } from '../config';
import { bboxAround } from '../lib/geo';
import { fetchJson, qs } from '../lib/http';
import type { LngLat } from '../types';

export interface GeoResult {
  id: string;
  label: string;
  coord: LngLat;
}

// Política de Nominatim: máx. 1 petición/s y sin autocompletado mientras se escribe.
// Por eso solo se llama al enviar el texto o al terminar el dictado por voz.
export async function searchAddress(query: string, near?: LngLat, signal?: AbortSignal): Promise<GeoResult[]> {
  const params: Record<string, string | number> = { q: query, format: 'jsonv2', limit: 6, 'accept-language': 'es' };
  if (near) {
    const [w, s, e, n] = bboxAround(near, 300);
    params.viewbox = `${w},${n},${e},${s}`; // sesga los resultados hacia la zona, sin limitarlos
  }
  const data = await fetchJson<any[]>(`${CONFIG.nominatimUrl}/search?${qs(params)}`, { signal });
  return data.map((d) => ({
    id: `${d.osm_type}-${d.osm_id}`,
    label: d.display_name as string,
    coord: [parseFloat(d.lon), parseFloat(d.lat)] as LngLat,
  }));
}
