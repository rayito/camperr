import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AmenityBadges, Button, Chip, EmptyState } from '../../components/ui';
import { KIND_META } from '../../constants';
import { usePlaces } from '../../store/places';
import { colors, radius } from '../../theme';

export default function PlaceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const place = usePlaces((s) => s.places[String(id)]);
  const lists = usePlaces((s) => s.lists);
  const toggleFavorite = usePlaces((s) => s.toggleFavorite);
  const markVisited = usePlaces((s) => s.markVisited);
  const toggleInList = usePlaces((s) => s.toggleInList);

  if (!place) return <EmptyState title="Lugar no encontrado" text="Vuelve a buscarlo desde la pestaña Lugares." />;

  // 'osm-node-123' -> 'node/123'
  const osmPath = place.id.slice(4).replace('-', '/');
  const info = [place.address, place.openingHours && `Horario: ${place.openingHours}`, place.phone, place.website].filter(Boolean) as string[];

  return (
    <ScrollView contentContainerStyle={s.page}>
      <Stack.Screen options={{ title: place.name }} />
      <Text style={s.title}>{place.name}</Text>
      <Text style={s.sub}>{KIND_META[place.kind].label}</Text>
      <AmenityBadges a={place.amenities} />

      {info.length > 0 && (
        <View style={s.card}>
          {info.map((t) => <Text key={t} style={s.info}>{t}</Text>)}
        </View>
      )}

      <Button
        label="Navegar hasta aquí"
        icon="navigate"
        onPress={() => router.navigate({ pathname: '/navigate', params: { lng: String(place.coord[0]), lat: String(place.coord[1]), name: place.name } })}
      />
      <Button label={place.favorite ? 'Quitar de favoritos' : 'Añadir a favoritos'} icon={place.favorite ? 'heart' : 'heart-outline'} variant="ghost" onPress={() => toggleFavorite(place.id)} />
      <Button label="Marcar como visitado" icon="checkmark-circle-outline" variant="ghost" onPress={() => markVisited(place.id)} />

      <Text style={s.section}>Listas</Text>
      <View style={s.chips}>
        {lists.map((l) => <Chip key={l.id} label={l.name} active={place.listIds.includes(l.id)} onPress={() => toggleInList(place.id, l.id)} />)}
        <Chip label="Nueva lista" icon="add" onPress={() => router.push('/list/new')} />
      </View>

      {place.source === 'osm' && (
        <Button label="Ver o corregir en OpenStreetMap" icon="open-outline" variant="ghost" onPress={() => Linking.openURL(`https://www.openstreetmap.org/${osmPath}`)} />
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { padding: 16, gap: 10, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', color: colors.ink },
  sub: { fontSize: 14, color: colors.muted },
  card: { backgroundColor: colors.card, borderRadius: radius.card, padding: 14, gap: 6, borderWidth: 1, borderColor: colors.line, marginVertical: 4 },
  info: { fontSize: 15, color: colors.ink },
  section: { fontSize: 15, fontWeight: '700', color: colors.ink, marginTop: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
