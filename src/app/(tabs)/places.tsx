import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import AppMap from '../../components/AppMap';
import { AmenityBadges, Button, Chip, EmptyState } from '../../components/ui';
import { CONFIG } from '../../config';
import { KIND_META } from '../../constants';
import { bboxAround, distanceKm, formatDistance } from '../../lib/geo';
import { searchAddress } from '../../services/nominatim';
import { fetchPlaces } from '../../services/overpass';
import { usePlaces } from '../../store/places';
import { colors, radius } from '../../theme';
import type { LngLat, Place } from '../../types';

type Scope = 'nearby' | 'favorites' | 'recent';
type FilterKey = 'overnight' | 'free' | 'paid' | 'electricity' | 'dump' | 'water';

const SCOPES: { key: Scope; label: string }[] = [
  { key: 'nearby', label: 'Cerca' },
  { key: 'favorites', label: 'Favoritos' },
  { key: 'recent', label: 'Recientes' },
];
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'overnight', label: 'Pernocta' },
  { key: 'free', label: 'Gratis' },
  { key: 'paid', label: 'De pago' },
  { key: 'electricity', label: 'Electricidad' },
  { key: 'dump', label: 'Vaciado de aguas' },
  { key: 'water', label: 'Agua' },
];
const NO_FILTERS: Record<FilterKey, boolean> = { overnight: false, free: false, paid: false, electricity: false, dump: false, water: false };

const matches = (p: Place, f: Record<FilterKey, boolean>) =>
  (!f.overnight || p.amenities.overnight) &&
  (!f.free || p.amenities.free === true) &&
  (!f.paid || p.amenities.free === false) &&
  (!f.electricity || p.amenities.electricity) &&
  (!f.dump || p.amenities.dump) &&
  (!f.water || p.amenities.water);

export default function PlacesScreen() {
  const [tab, setTab] = useState<'explore' | 'lists'>('explore');
  return (
    <View style={{ flex: 1 }}>
      <View style={s.segment}>
        <Chip label="Explorar" active={tab === 'explore'} onPress={() => setTab('explore')} />
        <Chip label="Mis listas" active={tab === 'lists'} onPress={() => setTab('lists')} />
      </View>
      {tab === 'explore' ? <Explore /> : <Lists />}
    </View>
  );
}

function Explore() {
  const places = usePlaces((s) => s.places);
  const upsertMany = usePlaces((s) => s.upsertMany);

  const [center, setCenter] = useState<LngLat>(CONFIG.defaultCenter); // centro actual del mapa
  const [anchor, setAnchor] = useState<LngLat>(CONFIG.defaultCenter); // centro de la última búsqueda
  const [focus, setFocus] = useState<{ center: LngLat; zoom?: number }>();
  const [nearbyIds, setNearbyIds] = useState<string[]>([]);
  const [scope, setScope] = useState<Scope>('nearby');
  const [filters, setFilters] = useState(NO_FILTERS);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAround = useCallback(
    async (c: LngLat) => {
      setBusy(true);
      setError(null);
      setAnchor(c);
      try {
        const found = await fetchPlaces(bboxAround(c, CONFIG.placesRadiusKm));
        upsertMany(found);
        setNearbyIds(found.map((p) => p.id));
      } catch {
        setError('No se pudieron cargar los lugares. Inténtalo de nuevo en unos segundos.');
      } finally {
        setBusy(false);
      }
    },
    [upsertMany],
  );

  useEffect(() => {
    (async () => {
      let c = CONFIG.defaultCenter;
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const p = await Location.getCurrentPositionAsync({});
        c = [p.coords.longitude, p.coords.latitude];
      }
      setCenter(c);
      setFocus({ center: c, zoom: 11 });
      loadAround(c);
    })().catch(() => loadAround(CONFIG.defaultCenter));
  }, [loadAround]);

  const goTo = async () => {
    if (query.trim().length < 3) return;
    try {
      const [first] = await searchAddress(query);
      if (!first) return setError('No encontramos ese lugar.');
      setCenter(first.coord);
      setFocus({ center: first.coord, zoom: 11 });
      loadAround(first.coord);
    } catch {
      setError('No se pudo buscar. Revisa tu conexión.');
    }
  };

  const toggleFilter = (k: FilterKey) =>
    setFilters((f) => ({ ...f, [k]: !f[k], ...(k === 'free' && !f.free ? { paid: false } : {}), ...(k === 'paid' && !f.paid ? { free: false } : {}) }));

  const visible = useMemo(() => {
    const all = Object.values(places);
    let base: Place[];
    if (scope === 'favorites') base = all.filter((p) => p.favorite);
    else if (scope === 'recent') base = all.filter((p) => p.lastVisitedAt).sort((a, b) => (b.lastVisitedAt ?? 0) - (a.lastVisitedAt ?? 0)).slice(0, 30);
    else {
      const ids = new Set(nearbyIds);
      base = all.filter((p) => ids.has(p.id)).sort((a, b) => distanceKm(anchor, a.coord) - distanceKm(anchor, b.coord));
    }
    return base.filter((p) => matches(p, filters));
  }, [places, scope, nearbyIds, filters, anchor]);

  return (
    <View style={{ flex: 1 }}>
      <TextInput
        style={s.search}
        value={query}
        onChangeText={setQuery}
        placeholder="Buscar una ciudad o zona"
        placeholderTextColor={colors.muted}
        returnKeyType="search"
        onSubmitEditing={goTo}
      />
      <View style={{ height: 220 }}>
        <AppMap center={center} places={visible} focus={focus} onCenterChange={setCenter} onPlacePress={(id) => router.push(`/place/${id}`)} />
        <View style={s.mapBtn}>
          <Button label="Buscar en esta zona" icon="refresh" onPress={() => loadAround(center)} />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips} style={{ flexGrow: 0 }}>
        {SCOPES.map((o) => <Chip key={o.key} label={o.label} active={scope === o.key} onPress={() => setScope(o.key)} />)}
        <View style={s.sep} />
        {FILTERS.map((o) => <Chip key={o.key} label={o.label} active={filters[o.key]} onPress={() => toggleFilter(o.key)} />)}
      </ScrollView>

      {busy && <ActivityIndicator color={colors.sign} style={{ margin: 8 }} />}
      {error ? <Text style={s.error}>{error}</Text> : null}

      <FlatList
        data={visible}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: 12, gap: 8 }}
        ListEmptyComponent={
          busy ? null : (
            <EmptyState
              title="Sin resultados"
              text={scope === 'nearby' ? 'Prueba a quitar algún filtro o a buscar en otra zona del mapa.' : 'Aún no tienes lugares aquí. Abre un lugar y márcalo para verlo en esta lista.'}
            />
          )
        }
        renderItem={({ item: p }) => (
          <Pressable onPress={() => router.push(`/place/${p.id}`)} style={s.row} accessibilityRole="button">
            <View style={[s.dot, { backgroundColor: KIND_META[p.kind].color }]} />
            <View style={{ flex: 1 }}>
              <Text style={s.rowTitle} numberOfLines={1}>{p.name}</Text>
              <Text style={s.rowSub}>{KIND_META[p.kind].label}, a {formatDistance(distanceKm(anchor, p.coord) * 1000)}</Text>
              <AmenityBadges a={p.amenities} />
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

function Lists() {
  const lists = usePlaces((s) => s.lists);
  const places = usePlaces((s) => s.places);
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const p of Object.values(places)) for (const id of p.listIds) c[id] = (c[id] ?? 0) + 1;
    return c;
  }, [places]);

  return (
    <FlatList
      data={lists}
      keyExtractor={(l) => l.id}
      contentContainerStyle={{ padding: 12, gap: 8 }}
      ListEmptyComponent={<EmptyState title="Aún no tienes listas" text="Crea una lista para agrupar los lugares de un viaje, por ejemplo «Ruta por Portugal»." />}
      ListFooterComponent={<Button label="Nueva lista" icon="add" onPress={() => router.push('/list/new')} />}
      renderItem={({ item: l }) => (
        <Pressable onPress={() => router.push(`/list/${l.id}`)} style={s.row} accessibilityRole="button">
          <View style={{ flex: 1 }}>
            <Text style={s.rowTitle}>{l.name}</Text>
            <Text style={s.rowSub}>{counts[l.id] ?? 0} lugares</Text>
          </View>
        </Pressable>
      )}
    />
  );
}

const s = StyleSheet.create({
  segment: { flexDirection: 'row', gap: 8, padding: 12, paddingBottom: 4 },
  search: { margin: 12, marginTop: 8, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: radius.input, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, color: colors.ink },
  mapBtn: { position: 'absolute', bottom: 10, alignSelf: 'center' },
  chips: { gap: 8, paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center' },
  sep: { width: 1, height: 22, backgroundColor: colors.line },
  error: { color: colors.danger, fontSize: 13, paddingHorizontal: 12 },
  row: { flexDirection: 'row', gap: 12, backgroundColor: colors.card, borderRadius: radius.card, padding: 12, borderWidth: 1, borderColor: colors.line },
  dot: { width: 12, height: 12, borderRadius: 6, marginTop: 5 },
  rowTitle: { fontSize: 16, fontWeight: '600', color: colors.ink },
  rowSub: { fontSize: 13, color: colors.muted },
});
