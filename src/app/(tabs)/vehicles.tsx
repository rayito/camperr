import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Chip, EmptyState } from '../../components/ui';
import VehicleSketch from '../../components/VehicleSketch';
import { vehicleLabel } from '../../constants';
import { formatMeters } from '../../lib/geo';
import { useVehicles } from '../../store/vehicles';
import { colors, radius } from '../../theme';

export default function VehiclesScreen() {
  const vehicles = useVehicles((s) => s.vehicles);
  const activeId = useVehicles((s) => s.activeId);
  const setActive = useVehicles((s) => s.setActive);

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={vehicles}
        keyExtractor={(v) => v.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListEmptyComponent={<EmptyState title="Aún no tienes vehículos" text="Define las medidas de tu caravana o camper para que la ruta evite pasos por los que no cabe." />}
        renderItem={({ item: v }) => (
          <Pressable onPress={() => router.push(`/vehicle/${v.id}`)} style={s.card} accessibilityRole="button">
            <VehicleSketch type={v.type} subtype={v.subtype} color={v.color} width={110} />
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{v.name}</Text>
              <Text style={s.sub}>{vehicleLabel(v)}</Text>
              <Text style={s.sub}>
                {formatMeters(v.lengthM)} de largo, {formatMeters(v.heightM)} de alto
              </Text>
            </View>
            {v.id === activeId ? <Chip label="En uso" active /> : <Chip label="Usar" onPress={() => setActive(v.id)} />}
          </Pressable>
        )}
      />
      <View style={s.footer}>
        <Button label="Nuevo vehículo" icon="add" onPress={() => router.push('/vehicle/new')} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: radius.card, padding: 12, borderWidth: 1, borderColor: colors.line },
  name: { fontSize: 17, fontWeight: '600', color: colors.ink },
  sub: { fontSize: 13, color: colors.muted },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.card },
});
