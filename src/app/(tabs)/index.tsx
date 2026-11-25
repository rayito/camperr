import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, type IconName } from '../../components/ui';
import VehicleSketch from '../../components/VehicleSketch';
import { vehicleLabel } from '../../constants';
import { formatMeters } from '../../lib/geo';
import { usePlaces } from '../../store/places';
import { useActiveVehicle, useVehicles } from '../../store/vehicles';
import { colors, radius } from '../../theme';

export default function Home() {
  const vehicle = useActiveVehicle();
  const vehicleCount = useVehicles((s) => s.vehicles.length);
  const favorites = usePlaces((s) => Object.values(s.places).filter((p) => p.favorite).length);
  const lists = usePlaces((s) => s.lists.length);

  const actions: { icon: IconName; title: string; text: string; href: Href }[] = [
    { icon: 'navigate', title: 'Navegar', text: 'Ruta que respeta las medidas de tu vehículo', href: '/navigate' },
    { icon: 'location', title: 'Lugares', text: `${favorites} favoritos y ${lists} listas`, href: '/places' },
    { icon: 'bus', title: 'Vehículos', text: `${vehicleCount} guardados`, href: '/vehicles' },
  ];

  return (
    <ScrollView contentContainerStyle={s.page}>
      <View style={s.vehicle}>
        {vehicle ? (
          <>
            <VehicleSketch type={vehicle.type} subtype={vehicle.subtype} color={vehicle.color} width={250} />
            <Text style={s.name}>{vehicle.name}</Text>
            <Text style={s.sub}>{vehicleLabel(vehicle)}</Text>
            {/* Cotas: lo que la ruta tendrá en cuenta */}
            <View style={s.dims}>
              <Text style={s.dim}>Altura {formatMeters(vehicle.heightM)}</Text>
              <Text style={s.dim}>Longitud {formatMeters(vehicle.lengthM)}</Text>
            </View>
          </>
        ) : (
          <>
            <Text style={s.name}>Aún no tienes vehículo</Text>
            <Text style={s.sub}>Añade las medidas de tu caravana o camper para calcular rutas por donde cabe.</Text>
            <Button label="Añadir vehículo" icon="add" onPress={() => router.push('/vehicle/new')} />
          </>
        )}
      </View>

      {actions.map((a) => (
        <Pressable key={a.title} onPress={() => router.navigate(a.href)} style={s.row} accessibilityRole="button">
          <View style={s.iconBox}>
            <Ionicons name={a.icon} size={22} color={colors.sign} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.rowTitle}>{a.title}</Text>
            <Text style={s.sub}>{a.text}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </Pressable>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { padding: 16, gap: 12 },
  vehicle: { backgroundColor: colors.card, borderRadius: radius.card, padding: 20, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.line },
  name: { fontSize: 22, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  sub: { fontSize: 14, color: colors.muted, textAlign: 'center' },
  dims: { flexDirection: 'row', gap: 20, marginTop: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.line, alignSelf: 'stretch', justifyContent: 'center' },
  dim: { fontSize: 15, fontWeight: '600', color: colors.ink },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.card, borderRadius: radius.card, padding: 14, borderWidth: 1, borderColor: colors.line },
  iconBox: { width: 42, height: 42, borderRadius: 10, backgroundColor: colors.signSoft, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 17, fontWeight: '600', color: colors.ink },
});
