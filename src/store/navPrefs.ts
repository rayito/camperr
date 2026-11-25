import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type Key = 'vehicleMode' | 'avoidTolls' | 'avoidHighways';
interface NavPrefs extends Record<Key, boolean> {
  toggle: (k: Key) => void;
}

export const useNavPrefs = create<NavPrefs>()(
  persist(
    (set) => ({
      vehicleMode: true,
      avoidTolls: false,
      avoidHighways: false,
      toggle: (k) => set((s) => ({ [k]: !s[k] }) as Partial<NavPrefs>),
    }),
    { name: 'nav-prefs', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
