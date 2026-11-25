import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Vehicle } from '../types';

interface VehiclesState {
  vehicles: Vehicle[];
  activeId: string | null;
  save: (v: Vehicle) => void; // crea o actualiza
  remove: (id: string) => void;
  setActive: (id: string) => void;
}

export const useVehicles = create<VehiclesState>()(
  persist(
    (set) => ({
      vehicles: [],
      activeId: null,
      save: (v) =>
        set((s) => ({
          vehicles: s.vehicles.some((x) => x.id === v.id) ? s.vehicles.map((x) => (x.id === v.id ? v : x)) : [...s.vehicles, v],
          activeId: s.activeId ?? v.id,
        })),
      remove: (id) =>
        set((s) => {
          const vehicles = s.vehicles.filter((x) => x.id !== id);
          return { vehicles, activeId: s.activeId === id ? (vehicles[0]?.id ?? null) : s.activeId };
        }),
      setActive: (id) => set({ activeId: id }),
    }),
    { name: 'vehicles', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

export const useActiveVehicle = () => useVehicles((s) => s.vehicles.find((v) => v.id === s.activeId) ?? null);
