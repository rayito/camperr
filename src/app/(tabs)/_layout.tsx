import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { IconName } from '../../components/ui';
import { colors } from '../../theme';

const icon = (name: IconName) => ({ color, size }: { color: string; size: number }) => <Ionicons name={name} color={color} size={size} />;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.sign,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.line },
        headerStyle: { backgroundColor: colors.paper },
        headerShadowVisible: false,
        headerTitleStyle: { color: colors.ink, fontWeight: '700' },
        sceneStyle: { backgroundColor: colors.paper },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio', tabBarIcon: icon('home') }} />
      <Tabs.Screen name="navigate" options={{ title: 'Navegar', headerShown: false, tabBarIcon: icon('navigate') }} />
      <Tabs.Screen name="vehicles" options={{ title: 'Vehículos', tabBarIcon: icon('bus') }} />
      <Tabs.Screen name="places" options={{ title: 'Lugares', tabBarIcon: icon('location') }} />
    </Tabs>
  );
}
