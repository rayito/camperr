import type { LngLat } from './types';

export const CONFIG = {
  // Nominatim y Overpass piden identificar la app: pon tu nombre y un contacto real.
  userAgent: 'Camperr/0.1 (edenhernandez@proton.me)',
  nominatimUrl: 'https://nominatim.openstreetmap.org',
  overpassUrl: 'https://overpass-api.de/api/interpreter',
  // Servidor público de demostración (FOSSGIS). Para producción: tu propio Valhalla o un proveedor.
  valhallaUrl: 'https://valhalla1.openstreetmap.de/route',
  defaultCenter: [-3.7038, 40.4168] as LngLat, // solo si no hay permiso de ubicación
  placesRadiusKm: 25,
  // Teselas raster de OpenStreetMap: válidas para desarrollo. En producción usa un proveedor
  // (MapTiler, Stadia...) o tu servidor, porque tile.openstreetmap.org limita el uso intensivo.
  mapStyle: {
    version: 8,
    sources: {
      osm: {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        maxzoom: 19,
        attribution: '© OpenStreetMap contributors',
      },
    },
    layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
  },
};
