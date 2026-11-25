import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors, radius } from '../theme';
import type { PlaceAmenities } from '../types';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function Button({ label, onPress, icon, variant = 'primary', disabled }: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  variant?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
}) {
  const bg = variant === 'primary' ? colors.sign : variant === 'danger' ? colors.danger : 'transparent';
  const fg = variant === 'ghost' ? colors.sign : '#FFFFFF';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [s.btn, { backgroundColor: bg, borderColor: variant === 'ghost' ? colors.sign : bg, opacity: disabled ? 0.4 : pressed ? 0.85 : 1 }]}
    >
      {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
      <Text style={[s.btnText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function Chip({ label, active, onPress, icon }: { label: string; active?: boolean; onPress?: () => void; icon?: IconName }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: !!active }} style={[s.chip, active && s.chipOn]}>
      {icon ? <Ionicons name={icon} size={14} color={active ? '#FFFFFF' : colors.ink} /> : null}
      <Text style={[s.chipText, active && { color: '#FFFFFF' }]}>{label}</Text>
    </Pressable>
  );
}

export function Field({ label, suffix, ...input }: { label: string; suffix?: string } & TextInputProps) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={s.label}>{label}</Text>
      <View style={s.fieldBox}>
        <TextInput {...input} style={s.input} placeholderTextColor={colors.muted} />
        {suffix ? <Text style={s.suffix}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

export function EmptyState({ title, text, children }: { title: string; text: string; children?: ReactNode }) {
  return (
    <View style={s.empty}>
      <Text style={s.emptyTitle}>{title}</Text>
      <Text style={s.emptyText}>{text}</Text>
      {children}
    </View>
  );
}

export function AmenityBadges({ a }: { a: PlaceAmenities }) {
  const items: { on: boolean; icon: IconName; label: string }[] = [
    { on: a.overnight, icon: 'moon', label: 'Pernocta' },
    { on: a.free === true, icon: 'pricetag', label: 'Gratis' },
    { on: a.free === false, icon: 'cash', label: 'De pago' },
    { on: a.electricity, icon: 'flash', label: 'Electricidad' },
    { on: a.dump, icon: 'trash', label: 'Vaciado de aguas' },
    { on: a.water, icon: 'water', label: 'Agua' },
    { on: a.toilets, icon: 'male-female', label: 'WC' },
    { on: a.showers, icon: 'rainy', label: 'Duchas' },
    { on: a.wifi, icon: 'wifi', label: 'Wi-Fi' },
  ];
  return (
    <View style={s.badges}>
      {items.filter((i) => i.on).map((i) => (
        <View key={i.label} style={s.badge}>
          <Ionicons name={i.icon} size={12} color={colors.moss} />
          <Text style={s.badgeText}>{i.label}</Text>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 18, borderRadius: radius.input, borderWidth: 1.5 },
  btnText: { fontSize: 16, fontWeight: '600' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingHorizontal: 12, borderRadius: radius.pill, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  chipOn: { backgroundColor: colors.sign, borderColor: colors.sign },
  chipText: { fontSize: 14, fontWeight: '500', color: colors.ink },
  label: { fontSize: 13, color: colors.muted, marginBottom: 4 },
  fieldBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: radius.input, paddingHorizontal: 12 },
  input: { flex: 1, paddingVertical: 11, fontSize: 16, color: colors.ink },
  suffix: { color: colors.muted, marginLeft: 6 },
  empty: { padding: 24, alignItems: 'center', gap: 6 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  emptyText: { fontSize: 14, color: colors.muted, textAlign: 'center', maxWidth: 320 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 3, paddingHorizontal: 8, borderRadius: radius.pill, backgroundColor: colors.mossSoft },
  badgeText: { fontSize: 12, color: colors.moss, fontWeight: '500' },
});
