import { colors } from './theme';
import type { CaravanSubtype, PlaceKind, Vehicle, VehicleType } from './types';

export const VEHICLE_TYPES: { value: VehicleType; label: string }[] = [
  { value: 'caravan', label: 'Caravana' },
  { value: 'campervan', label: 'Campervan' },
  { value: 'other', label: 'Otros' },
];

export const CARAVAN_SUBTYPES: { value: CaravanSubtype; label: string }[] = [
  { value: 'capuchina', label: 'Capuchina' },
  { value: 'integral', label: 'Integral' },
  { value: 'perfilada', label: 'Perfilada' },
];

export const VEHICLE_DEFAULTS: Record<VehicleType, { lengthM: number; heightM: number; widthM: number; weightKg: number }> = {
  caravan: { lengthM: 7.2, heightM: 3.1, widthM: 2.3, weightKg: 3500 },
  campervan: { lengthM: 5.4, heightM: 2.1, widthM: 2.0, weightKg: 3000 },
  other: { lengthM: 8, heightM: 3.2, widthM: 2.5, weightKg: 5000 },
};

export const BODY_COLORS = ['#F5F5F2', '#D3D8DB', '#8E9AA3', '#2B3A44', '#0E5A9C', '#2F7D4F', '#B93A24', '#E8A317', '#7A4E2D', '#111111'];

export const KIND_META: Record<PlaceKind, { label: string; color: string }> = {
  caravan_site: { label: 'Área de autocaravanas', color: colors.moss },
  camp_site: { label: 'Camping', color: '#6B8F3A' },
  parking: { label: 'Parking', color: colors.sign },
  dump_station: { label: 'Vaciado de aguas', color: '#7A4E9C' },
  water_point: { label: 'Punto de agua', color: '#1B8FB5' },
  fuel: { label: 'Gasolinera', color: '#C26A1B' },
};

export function vehicleLabel(v: Pick<Vehicle, 'type' | 'subtype'>) {
  if (v.type === 'caravan') return `Caravana ${v.subtype ?? ''}`.trim();
  return v.type === 'campervan' ? 'Campervan' : 'Otro vehículo';
}
