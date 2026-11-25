import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button, EmptyState } from '../../components/ui';
import { KIND_META } from '../../constants';
import { usePlaces } from '../../store/places';
import { colors, radius } from '../../theme';

export default function ListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const list = usePlaces((s) => s.lists.find((l) => l.id === id));
  const places = usePlaces((s) => s.places);
  const createList = usePlaces((s) => s.createList);
  const renameList = usePlaces((s) => s.renameList);
  const deleteList = usePlaces((s) => s.deleteList);

  const [name, setName] = useState(list?.name ?? '');
  const members = useMemo(() => Object.values(places).filter((p) => p.listIds.includes(String(id))), [places, id]);

  const onDelete = () =>
    Alert.alert('Eliminar lista', 'Los lugares no se borran: solo dejan de pertenecer a la lista.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => { deleteList(String(id)); router.back(); } },
    ]);

  return (
    <View style={s.page}>
      <Stack.Screen options={{ title: isNew ? 'Nueva lista' : 'Editar lista' }} />
      <Text style={s.label}>Nombre</Text>
      <TextInput
        style={s.input}
        value={name}
        onChangeText={setName}
        placeholder="Ruta por Portugal"
        placeholderTextColor={colors.muted}
        onEndEditing={() => !isNew && renameList(String(id), name)}
        autoFocus={isNew}
      />

      {isNew ? (
        <Button label="Crear lista" onPress={() => { createList(name); router.back(); }} />
      ) : (
        <>
          <FlatList
            data={members}
            keyExtractor={(p) => p.id}
            style={{ flex: 1 }}
            contentContainerStyle={{ gap: 8, paddingVertical: 12 }}
            ListEmptyComponent={<EmptyState title="Lista vacía" text="Abre un lugar y añádelo a esta lista desde su ficha." />}
            renderItem={({ item: p }) => (
              <Pressable onPress={() => router.push(`/place/${p.id}`)} style={s.row} accessibilityRole="button">
                <Text style={s.rowTitle}>{p.name}</Text>
                <Text style={s.rowSub}>{KIND_META[p.kind].label}</Text>
              </Pressable>
            )}
          />
          <Button label="Eliminar lista" variant="danger" onPress={onDelete} />
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, padding: 16, gap: 8 },
  label: { fontSize: 13, color: colors.muted },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: radius.input, paddingHorizontal: 12, paddingVertical: 11, fontSize: 16, color: colors.ink, marginBottom: 8 },
  row: { backgroundColor: colors.card, borderRadius: radius.card, padding: 12, borderWidth: 1, borderColor: colors.line },
  rowTitle: { fontSize: 16, fontWeight: '600', color: colors.ink },
  rowSub: { fontSize: 13, color: colors.muted },
});
