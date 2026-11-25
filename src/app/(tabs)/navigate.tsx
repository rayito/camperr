import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppMap from '../../components/AppMap';
import { Button, Chip } from '../../components/ui';
import { useVoiceSearch } from '../../hooks/useVoiceSearch';
import { formatDistance, formatDuration, formatMeters } from '../../lib/geo';
import { searchAddress, type GeoResult } from '../../services/nominatim';
import { getRoute, type RouteResult } from '../../services/routing';
import { useNavPrefs } from '../../store/navPrefs';
import { useActiveVehicle } from '../../store/vehicles';
import { colors, radius } from '../../theme';
import type { LngLat } from '../../types';

const NO_ROUTE: LngLat[] = [];

export default function NavigateScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ lng?: string; lat?: string; name?: string }>();
  const vehicle = useActiveVehicle();
  const { vehicleMode, avoidTolls, avoidHighways, toggle } = useNavPrefs();

  const [origin, setOrigin] = useState<LngLat | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoResult[]>([]);
  const [dest, setDest] = useState<{ label: string; coord: LngLat } | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSteps, setShowSteps] = useState(false);

  // Ubicación actual como origen
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return setError('Sin permiso de ubicación no se puede calcular el origen.');
      const pos = await Location.getCurrentPositionAsync({});
      setOrigin([pos.coords.longitude, pos.coords.latitude]);
    })().catch(() => setError('No se pudo obtener tu ubicación.'));
  }, []);

  // Destino recibido desde la ficha de un lugar
  useEffect(() => {
    if (params.lng && params.lat) {
      setDest({ label: params.name ?? 'Destino', coord: [Number(params.lng), Number(params.lat)] });
      setQuery(params.name ?? '');
      setResults([]);
    }
  }, [params.lng, params.lat, params.name]);

  const runSearch = useCallback(
    async (text: string) => {
      if (text.trim().length < 3) return;
      try {
        setError(null);
        setResults(await searchAddress(text, origin ?? undefined));
      } catch {
        setError('No se pudo buscar. Revisa tu conexión.');
      }
    },
    [origin],
  );

  const voice = useVoiceSearch((text, isFinal) => {
    setQuery(text);
    if (isFinal) runSearch(text);
  });

  // Recalcula al cambiar origen, destino, vehículo u opciones
  useEffect(() => {
    if (!origin || !dest) return setRoute(null);
    const ctrl = new AbortController();
    setBusy(true);
    setError(null);
    getRoute(origin, dest.coord, { vehicle, vehicleMode, avoidTolls, avoidHighways }, ctrl.signal)
      .then(setRoute)
      .catch((e) => {
        if (e?.name === 'AbortError') return;
        setRoute(null);
        setError(
          vehicleMode && vehicle
            ? 'No hay una ruta apta para este vehículo. Revisa sus medidas o desactiva «Según vehículo».'
            : 'No se encontró una ruta hasta ese destino.',
        );
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setBusy(false);
      });
    return () => ctrl.abort();
  }, [origin, dest, vehicle, vehicleMode, avoidTolls, avoidHighways]);

  const focus = useMemo(() => (origin && !dest ? { center: origin, zoom: 12 } : undefined), [origin, dest]);
  const clear = () => { setQuery(''); setResults([]); setDest(null); setRoute(null); setShowSteps(false); };
  const shownError = error ?? voice.error;

  return (
    <View style={{ flex: 1 }}>
      <AppMap origin={origin} destination={dest?.coord ?? null} route={route?.coords ?? NO_ROUTE} fit={route?.coords} focus={focus} />

      <View style={[s.top, { top: insets.top + 8 }]}>
        <View style={s.search}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            style={s.input}
            value={query}
            onChangeText={setQuery}
            placeholder="¿A dónde vamos?"
            placeholderTextColor={colors.muted}
            returnKeyType="search"
            onSubmitEditing={() => runSearch(query)}
          />
          {query ? (
            <Pressable onPress={clear} hitSlop={8} accessibilityLabel="Borrar búsqueda">
              <Ionicons name="close-circle" size={20} color={colors.muted} />
            </Pressable>
          ) : null}
          <Pressable onPress={voice.toggle} accessibilityLabel="Buscar por voz" style={[s.mic, voice.listening && { backgroundColor: colors.danger }]}>
            <Ionicons name={voice.listening ? 'stop' : 'mic'} size={18} color="#FFFFFF" />
          </Pressable>
        </View>

        {results.length > 0 && (
          <View style={s.results}>
            {results.map((r) => (
              <Pressable key={r.id} style={s.result} onPress={() => { setDest({ label: r.label, coord: r.coord }); setQuery(r.label); setResults([]); }}>
                <Text numberOfLines={2} style={s.resultText}>{r.label}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
          <Chip icon="bus" label="Según vehículo" active={vehicleMode} onPress={() => toggle('vehicleMode')} />
          <Chip icon="cash" label="Evitar peajes" active={avoidTolls} onPress={() => toggle('avoidTolls')} />
          <Chip icon="speedometer" label="Evitar autopistas" active={avoidHighways} onPress={() => toggle('avoidHighways')} />
        </ScrollView>

        {vehicleMode && !vehicle && (
          <Pressable style={s.banner} onPress={() => router.push('/vehicle/new')}>
            <Text style={s.bannerText}>No hay vehículo activo: se calcula ruta de coche. Toca para añadir uno.</Text>
          </Pressable>
        )}
        {shownError ? <View style={[s.banner, { backgroundColor: '#FBE4DF' }]}><Text style={s.bannerText}>{shownError}</Text></View> : null}
      </View>

      {dest && (
        <View style={s.panel}>
          {busy && <ActivityIndicator color={colors.sign} />}
          {!busy && route && (
            <>
              <Text style={s.big}>{formatDuration(route.durationS)}</Text>
              <Text style={s.sub}>{formatDistance(route.distanceM)} hasta {dest.label.split(',')[0]}</Text>
              <Text style={s.mode}>
                {vehicleMode && vehicle
                  ? `Ruta para ${vehicle.name}: ${formatMeters(vehicle.heightM)} de alto y ${formatMeters(vehicle.lengthM)} de largo`
                  : 'Ruta de coche, sin restricciones de vehículo'}
              </Text>
              <Button variant="ghost" label={showSteps ? 'Ocultar pasos' : 'Ver pasos'} onPress={() => setShowSteps((v) => !v)} />
              {showSteps && (
                <ScrollView style={{ maxHeight: 180 }}>
                  {route.steps.map((st, i) => (
                    <Text key={i} style={s.step}>{st.instruction}</Text>
                  ))}
                </ScrollView>
              )}
            </>
          )}
        </View>
      )}
    </View>
  );
}

const shadow = { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 4 };

const s = StyleSheet.create({
  top: { position: 'absolute', left: 12, right: 12 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.card, borderRadius: radius.card, paddingLeft: 12, paddingRight: 6, ...shadow },
  input: { flex: 1, paddingVertical: 13, fontSize: 16, color: colors.ink },
  mic: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.sign, alignItems: 'center', justifyContent: 'center' },
  results: { marginTop: 6, backgroundColor: colors.card, borderRadius: radius.card, overflow: 'hidden', ...shadow },
  result: { paddingVertical: 11, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: colors.line },
  resultText: { fontSize: 14, color: colors.ink },
  chips: { gap: 8, paddingVertical: 10 },
  banner: { backgroundColor: colors.amberSoft, borderRadius: radius.input, padding: 10, marginTop: 4 },
  bannerText: { fontSize: 13, color: colors.ink },
  panel: { position: 'absolute', left: 12, right: 12, bottom: 12, backgroundColor: colors.card, borderRadius: radius.card, padding: 16, gap: 4, ...shadow },
  big: { fontSize: 28, fontWeight: '700', color: colors.ink },
  sub: { fontSize: 15, color: colors.ink },
  mode: { fontSize: 13, color: colors.muted, marginBottom: 8 },
  step: { fontSize: 14, color: colors.ink, paddingVertical: 5 },
});
