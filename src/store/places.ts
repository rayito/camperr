import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { uid } from '../lib/id';
import type { Place, PlaceList } from '../types';

interface PlacesState {
  places: Record<string, Place>;
  lists: PlaceList[];
  upsertMany: (items: Place[]) => void;
  toggleFavorite: (id: string) => void;
  markVisited: (id: string) => void;
  toggleInList: (placeId: string, listId: string) => void;
  createList: (name: string) => string;
  renameList: (id: string, name: string) => void;
  deleteList: (id: string) => void;
}

const patch = (all: Record<string, Place>, id: string, fn: (p: Place) => Partial<Place>) =>
  all[id] ? { ...all, [id]: { ...all[id], ...fn(all[id]) } } : all;

// Solo se guardan en disco los lugares que el usuario ha tocado; el resto es caché en memoria.
const isSaved = (p: Place) => p.favorite || p.listIds.length > 0 || !!p.lastVisitedAt;

export const usePlaces = create<PlacesState>()(
  persist(
    (set) => ({
      places: {},
      lists: [],
      upsertMany: (items) =>
        set((s) => {
          const next = { ...s.places };
          for (const p of items) {
            const old = next[p.id];
            // Metadatos desde OSM; lo que ha añadido el usuario se conserva.
            next[p.id] = old ? { ...p, listIds: old.listIds, favorite: old.favorite, lastVisitedAt: old.lastVisitedAt } : p;
          }
          return { places: next };
        }),
      toggleFavorite: (id) => set((s) => ({ places: patch(s.places, id, (p) => ({ favorite: !p.favorite })) })),
      markVisited: (id) => set((s) => ({ places: patch(s.places, id, () => ({ lastVisitedAt: Date.now() })) })),
      toggleInList: (placeId, listId) =>
        set((s) => ({
          places: patch(s.places, placeId, (p) => ({
            listIds: p.listIds.includes(listId) ? p.listIds.filter((x) => x !== listId) : [...p.listIds, listId],
          })),
        })),
      createList: (name) => {
        const id = uid();
        set((s) => ({ lists: [...s.lists, { id, name: name.trim() || 'Lista sin nombre', createdAt: Date.now() }] }));
        return id;
      },
      renameList: (id, name) =>
        set((s) => ({ lists: s.lists.map((l) => (l.id === id ? { ...l, name: name.trim() || l.name } : l)) })),
      deleteList: (id) =>
        set((s) => ({
          lists: s.lists.filter((l) => l.id !== id),
          places: Object.fromEntries(Object.entries(s.places).map(([k, p]) => [k, { ...p, listIds: p.listIds.filter((x) => x !== id) }])),
        })),
    }),
    {
      name: 'places',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        lists: s.lists,
        places: Object.fromEntries(Object.entries(s.places).filter(([, p]) => isSaved(p))),
      }),
    },
  ),
);
