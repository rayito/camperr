import { CONFIG } from '../config';
import { KIND_META } from '../constants';
import type { BBox } from '../lib/geo';
import { fetchJson } from '../lib/http';
import type { Place, PlaceKind } from '../types';

const yes = (v?: string) => v === 'yes' || v === 'designated';

function buildQuery([w, s, e, n]: BBox) {
  const b = `${s},${w},${n},${e}`; // Overpass: sur, oeste, norte, este
  return `[out:json][timeout:25];(
nwr["tourism"="caravan_site"](${b});
nwr["tourism"="camp_site"]["caravans"!="no"](${b});
nwr["amenity"="parking"]["motorhome"="yes"](${b});
nwr["amenity"="sanitary_dump_station"](${b});
nwr["amenity"="water_point"](${b});
nwr["amenity"="fuel"](${b});
);out center tags 400;`;
}

function kindOf(t: Record<string, string>): PlaceKind | null {
  if (t.tourism === 'caravan_site') return 'caravan_site';
  if (t.tourism === 'camp_site') return 'camp_site';
  if (t.amenity === 'sanitary_dump_station') return 'dump_station';
  if (t.amenity === 'water_point') return 'water_point';
  if (t.amenity === 'fuel') return 'fuel';
  if (t.amenity === 'parking') return 'parking';
  return null;
}

function toPlace(el: any): Place | null {
  const t: Record<string, string> = el.tags ?? {};
  const kind = kindOf(t);
  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  if (!kind || lat == null || lon == null) return null;
  const site = kind === 'caravan_site' || kind === 'camp_site';
  const street = [t['addr:street'], t['addr:housenumber']].filter(Boolean).join(' ');
  return {
    id: `osm-${el.type}-${el.id}`,
    source: 'osm',
    kind,
    name: t.name ?? KIND_META[kind].label,
    coord: [lon, lat],
    amenities: {
      overnight: site || (kind === 'parking' && t.motorhome === 'yes'),
      free: t.fee === 'yes' ? false : t.fee === 'no' ? true : null,
      electricity: yes(t.power_supply),
      dump: kind === 'dump_station' || yes(t.sanitary_dump_station),
      water: kind === 'water_point' || yes(t.drinking_water) || yes(t.water_point),
      toilets: yes(t.toilets),
      showers: yes(t.shower),
      wifi: yes(t.internet_access) || t.internet_access === 'wlan',
    },
    address: [street, t['addr:city']].filter(Boolean).join(', ') || undefined,
    website: t.website ?? t['contact:website'],
    phone: t.phone ?? t['contact:phone'],
    openingHours: t.opening_hours,
    listIds: [],
    favorite: false,
  };
}

export async function fetchPlaces(bbox: BBox, signal?: AbortSignal): Promise<Place[]> {
  const data = await fetchJson<{ elements: any[] }>(CONFIG.overpassUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(buildQuery(bbox))}`,
    signal,
  });
  return data.elements.map(toPlace).filter((p): p is Place => p !== null);
}
