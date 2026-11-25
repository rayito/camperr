export type LngLat = [number, number]; // [longitud, latitud], como GeoJSON y MapLibre

export type VehicleType = 'caravan' | 'campervan' | 'other';
export type CaravanSubtype = 'capuchina' | 'integral' | 'perfilada';

export interface Vehicle {
  id: string;
  name: string;
  type: VehicleType;
  subtype?: CaravanSubtype; // solo si type === 'caravan'
  color: string;
  lengthM: number;
  heightM: number;
  widthM: number;
  weightKg: number;
}

export type PlaceKind = 'caravan_site' | 'camp_site' | 'parking' | 'dump_station' | 'water_point' | 'fuel';

export interface PlaceAmenities {
  overnight: boolean;
  free: boolean | null; // null = OSM no lo indica
  electricity: boolean;
  dump: boolean; // vaciado de aguas grises/negras (OSM no distingue entre ambas)
  water: boolean;
  toilets: boolean;
  showers: boolean;
  wifi: boolean;
}

export interface Place {
  id: string; // 'osm-node-123': seguro para usar como parámetro de ruta
  source: 'osm' | 'user';
  kind: PlaceKind;
  name: string;
  coord: LngLat;
  amenities: PlaceAmenities;
  address?: string;
  website?: string;
  phone?: string;
  openingHours?: string;
  // Lo que añade el usuario (nunca se pisa al refrescar desde OSM)
  listIds: string[];
  favorite: boolean;
  lastVisitedAt?: number;
}

export interface PlaceList {
  id: string;
  name: string;
  createdAt: number;
}
