import { Camera, GeoJSONSource, Layer, Map as MapLibreMap, type CameraRef } from '@maplibre/maplibre-react-native';
import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { CONFIG } from '../config';
import { KIND_META } from '../constants';
import { boundsOf } from '../lib/geo';
import { colors } from '../theme';
import type { LngLat, Place } from '../types';

// Toda la dependencia de MapLibre vive en este archivo: si cambias de librería, solo tocas aquí.
// Requiere development build (no funciona en Expo Go).

interface Props {
  center?: LngLat; // vista inicial
  places?: Place[];
  route?: LngLat[];
  origin?: LngLat | null;
  destination?: LngLat | null;
  focus?: { center: LngLat; zoom?: number }; // memoízalo: cada objeto nuevo mueve la cámara
  fit?: LngLat[]; // encuadra estos puntos (p. ej. la ruta)
  fitPadding?: { top: number; right: number; bottom: number; left: number };
  onPlacePress?: (id: string) => void;
  onCenterChange?: (center: LngLat) => void;
  style?: StyleProp<ViewStyle>;
}

const NO_PLACES: Place[] = [];
const NO_ROUTE: LngLat[] = [];
const DEFAULT_PADDING = { top: 190, right: 40, bottom: 240, left: 40 };

const point = (coord: LngLat, properties: Record<string, unknown>) => ({
  type: 'Feature' as const,
  properties,
  geometry: { type: 'Point' as const, coordinates: coord },
});

// Las expresiones de estilo se tipan como "any" porque sus tuplas literales no encajan con el tipado estricto.
const PLACE_PAINT: any = {
  'circle-radius': ['case', ['get', 'favorite'], 12, 9],
  'circle-color': ['match', ['get', 'kind'], ...Object.entries(KIND_META).flatMap(([k, m]) => [k, m.color]), colors.ink],
  'circle-stroke-width': 2.5,
  'circle-stroke-color': ['case', ['get', 'favorite'], colors.amber, '#FFFFFF'],
};
const END_PAINT: any = { 'circle-radius': 8, 'circle-color': ['get', 'color'], 'circle-stroke-width': 3, 'circle-stroke-color': '#FFFFFF' };
const LINE_LAYOUT: any = { 'line-cap': 'round', 'line-join': 'round' };

export default function AppMap({ center, places = NO_PLACES, route = NO_ROUTE, origin, destination, focus, fit, fitPadding = DEFAULT_PADDING, onPlacePress, onCenterChange, style }: Props) {
  const camera = useRef<CameraRef>(null);

  const placesData = useMemo(
    () => ({ type: 'FeatureCollection' as const, features: places.map((p) => point(p.coord, { id: p.id, kind: p.kind, favorite: p.favorite })) }),
    [places],
  );
  const routeData = useMemo(
    () => ({ type: 'Feature' as const, properties: {}, geometry: { type: 'LineString' as const, coordinates: route } }),
    [route],
  );
  const endsData = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: [origin ? point(origin, { color: colors.sign }) : null, destination ? point(destination, { color: colors.danger }) : null].filter(
        (f): f is ReturnType<typeof point> => f !== null,
      ),
    }),
    [origin, destination],
  );

  useEffect(() => {
    if (focus) camera.current?.flyTo({ center: focus.center, zoom: focus.zoom ?? 12, duration: 700 });
  }, [focus]);

  useEffect(() => {
    if (fit && fit.length > 1) camera.current?.fitBounds(boundsOf(fit), { padding: fitPadding, duration: 800 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fit]);

  return (
    <View style={[styles.fill, style]}>
      <MapLibreMap style={styles.fill} mapStyle={CONFIG.mapStyle as any} onRegionDidChange={(e) => onCenterChange?.(e.nativeEvent.center)}>
        <Camera ref={camera} initialViewState={{ center: center ?? CONFIG.defaultCenter, zoom: 11 }} />

        {route.length > 1 && (
          <GeoJSONSource id="route" data={routeData}>
            <Layer id="route-casing" source="route" type="line" layout={LINE_LAYOUT} paint={{ 'line-color': '#FFFFFF', 'line-width': 9 }} />
            <Layer id="route-line" source="route" type="line" layout={LINE_LAYOUT} paint={{ 'line-color': colors.sign, 'line-width': 5 }} />
          </GeoJSONSource>
        )}

        <GeoJSONSource
          id="places"
          data={placesData}
          onPress={(e) => {
            const id = e.nativeEvent.features?.[0]?.properties?.id;
            if (typeof id === 'string') onPlacePress?.(id);
          }}
        >
          <Layer id="places-dots" source="places" type="circle" paint={PLACE_PAINT} />
        </GeoJSONSource>

        {endsData.features.length > 0 && (
          <GeoJSONSource id="ends" data={endsData}>
            <Layer id="ends-dots" source="ends" type="circle" paint={END_PAINT} />
          </GeoJSONSource>
        )}
      </MapLibreMap>
    </View>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
