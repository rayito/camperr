import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button, Chip, Field } from '../../components/ui';
import VehicleSketch from '../../components/VehicleSketch';
import { BODY_COLORS, CARAVAN_SUBTYPES, VEHICLE_DEFAULTS, VEHICLE_TYPES } from '../../constants';
import { uid } from '../../lib/id';
import { useVehicles } from '../../store/vehicles';
import { colors, radius } from '../../theme';
import type { CaravanSubtype, VehicleType } from '../../types';

type DimKey = 'lengthM' | 'heightM' | 'widthM' | 'weightKg';
const RANGES: Record<DimKey, [number, number]> = { lengthM: [2, 25], heightM: [1.5, 4.5], widthM: [1.5, 3], weightKg: [500, 44000] };

// El teclado decimal de iOS usa la coma en español: aceptamos ambas.
const num = (t: string) => parseFloat(t.replace(',', '.'));
const toText = (d: Record<DimKey, number>) => ({ lengthM: String(d.lengthM), heightM: String(d.heightM), widthM: String(d.widthM), weightKg: String(d.weightKg) });

export default function VehicleEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const existing = useVehicles((s) => s.vehicles.find((v) => v.id === id));
  const save = useVehicles((s) => s.save);
  const remove = useVehicles((s) => s.remove);

  const [name, setName] = useState(existing?.name ?? '');
  const [type, setType] = useState<VehicleType>(existing?.type ?? 'caravan');
  const [subtype, setSubtype] = useState<CaravanSubtype>(existing?.subtype ?? 'capuchina');
  const [color, setColor] = useState(existing?.color ?? BODY_COLORS[0]);
  const [dims, setDims] = useState(toText(existing ?? VEHICLE_DEFAULTS.caravan));
  const touched = useRef(false);

  const pickType = (t: VehicleType) => {
    setType(t);
    if (isNew && !touched.current) setDims(toText(VEHICLE_DEFAULTS[t])); // medidas orientativas hasta que el usuario edite
  };
  const setDim = (k: DimKey) => (t: string) => {
    touched.current = true;
    setDims((d) => ({ ...d, [k]: t }));
  };

  const valid = (Object.keys(RANGES) as DimKey[]).every((k) => num(dims[k]) >= RANGES[k][0] && num(dims[k]) <= RANGES[k][1]);

  const onSave = () => {
    save({
      id: isNew ? uid() : String(id),
      name: name.trim() || 'Mi vehículo',
      type,
      subtype: type === 'caravan' ? subtype : undefined,
      color,
      lengthM: num(dims.lengthM),
      heightM: num(dims.heightM),
      widthM: num(dims.widthM),
      weightKg: num(dims.weightKg),
    });
    router.back();
  };

  const onDelete = () =>
    Alert.alert('Eliminar vehículo', `Se borrará «${existing?.name}».`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => { remove(String(id)); router.back(); } },
    ]);

  return (
    <ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: isNew ? 'Nuevo vehículo' : 'Editar vehículo' }} />

      <View style={s.preview}>
        <VehicleSketch type={type} subtype={subtype} color={color} width={260} />
      </View>

      <Text style={s.label}>Nombre</Text>
      <TextInput value={name} onChangeText={setName} placeholder="Mi vehículo" placeholderTextColor={colors.muted} style={s.input} />

      <Text style={s.label}>Tipo</Text>
      <View style={s.chips}>
        {VEHICLE_TYPES.map((t) => <Chip key={t.value} label={t.label} active={type === t.value} onPress={() => pickType(t.value)} />)}
      </View>

      {type === 'caravan' && (
        <>
          <Text style={s.label}>Modelo de caravana</Text>
          <View style={s.chips}>
            {CARAVAN_SUBTYPES.map((t) => <Chip key={t.value} label={t.label} active={subtype === t.value} onPress={() => setSubtype(t.value)} />)}
          </View>
        </>
      )}

      <Text style={s.label}>Color de la carrocería</Text>
      <View style={s.chips}>
        {BODY_COLORS.map((c) => (
          <Pressable
            key={c}
            onPress={() => setColor(c)}
            accessibilityRole="button"
            accessibilityLabel={`Color ${c}`}
            style={[s.swatch, { backgroundColor: c }, color === c && s.swatchOn]}
          />
        ))}
      </View>

      <Text style={s.label}>Medidas para la ruta</Text>
      <View style={s.row}>
        <Field label="Longitud" suffix="m" value={dims.lengthM} onChangeText={setDim('lengthM')} keyboardType="decimal-pad" />
        <Field label="Altura" suffix="m" value={dims.heightM} onChangeText={setDim('heightM')} keyboardType="decimal-pad" />
      </View>
      <View style={s.row}>
        <Field label="Anchura" suffix="m" value={dims.widthM} onChangeText={setDim('widthM')} keyboardType="decimal-pad" />
        <Field label="Masa total" suffix="kg" value={dims.weightKg} onChangeText={setDim('weightKg')} keyboardType="decimal-pad" />
      </View>
      <Text style={s.hint}>
        Si llevas la caravana remolcada, indica la longitud y la masa del conjunto. La anchura y la masa evitan que el navegador te mande por pasos pensados para vehículos más pequeños o más grandes.
      </Text>
      {!valid && <Text style={s.error}>Revisa las medidas: longitud 2 a 25 m, altura 1,5 a 4,5 m, anchura 1,5 a 3 m, masa 500 a 44 000 kg.</Text>}

      <Button label="Guardar vehículo" onPress={onSave} disabled={!valid} />
      {!isNew && <Button label="Eliminar vehículo" variant="danger" onPress={onDelete} />}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { padding: 16, gap: 8, paddingBottom: 40 },
  preview: { alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.card, paddingVertical: 18, borderWidth: 1, borderColor: colors.line, marginBottom: 6 },
  label: { fontSize: 13, color: colors.muted, marginTop: 10 },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: radius.input, paddingHorizontal: 12, paddingVertical: 11, fontSize: 16, color: colors.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  swatch: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: colors.line },
  swatchOn: { borderWidth: 3, borderColor: colors.sign },
  row: { flexDirection: 'row', gap: 12 },
  hint: { fontSize: 13, color: colors.muted, marginBottom: 8 },
  error: { fontSize: 13, color: colors.danger, marginBottom: 8 },
});
