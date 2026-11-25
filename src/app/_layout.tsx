import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../theme';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerTintColor: colors.ink,
          headerStyle: { backgroundColor: colors.paper },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.paper },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="vehicle/[id]" options={{ title: 'Vehículo', presentation: 'modal' }} />
        <Stack.Screen name="place/[id]" options={{ title: 'Lugar' }} />
        <Stack.Screen name="list/[id]" options={{ title: 'Lista' }} />
      </Stack>
    </>
  );
}
