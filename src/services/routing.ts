import { CONFIG } from '../config';
import { decodePolyline } from '../lib/geo';
import { fetchJson } from '../lib/http';
import type { LngLat, Vehicle } from '../types';

export interface RouteOptions {
  vehicle: Vehicle | null;
  vehicleMode: boolean; // true = perfil "truck" con las medidas del vehículo
  avoidTolls: boolean;
  avoidHighways: boolean;
}

export interface RouteResult {
  coords: LngLat[];
  distanceM: number;
  durationS: number;
  steps: { instruction: string; lengthM: number }[];
}

// Valhalla (datos de OpenStreetMap). El perfil "truck" respeta restricciones de altura,
// anchura, longitud y peso. Unidades: metros y toneladas.
export async function getRoute(from: LngLat, to: LngLat, o: RouteOptions, signal?: AbortSignal): Promise<RouteResult> {
  const truck = o.vehicleMode && o.vehicle ? o.vehicle : null;
  const costing = truck ? 'truck' : 'auto';
  const options = {
    use_tolls: o.avoidTolls ? 0 : 0.5,
    use_highways: o.avoidHighways ? 0 : 1,
    // Sin estas medidas Valhalla asume un camión de 21 t y 4,11 m, que sería demasiado restrictivo.
    ...(truck && {
      height: truck.heightM,
      width: truck.widthM,
      length: truck.lengthM,
      weight: truck.weightKg / 1000,
    }),
  };
  const data = await fetchJson<any>(CONFIG.valhallaUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      locations: [{ lon: from[0], lat: from[1] }, { lon: to[0], lat: to[1] }],
      costing,
      costing_options: { [costing]: options },
      directions_options: { language: 'es-ES', units: 'kilometers' },
    }),
    signal,
  });
  const leg = data.trip.legs[0];
  return {
    coords: decodePolyline(leg.shape, 6),
    distanceM: data.trip.summary.length * 1000,
    durationS: data.trip.summary.time,
    steps: leg.maneuvers.map((m: any) => ({ instruction: m.instruction as string, lengthM: m.length * 1000 })),
  };
}
