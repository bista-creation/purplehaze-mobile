import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { getFirebaseUser } from '../services/firebase-auth';
import { readFavoriteIds, writeFavorite } from '../services/customer-data';

const FAVORITES_STORAGE_KEY = 'purple_haze_user_favorites';

interface FavoritesState {
  favoriteDishIds: string[];
  initFavorites: () => Promise<void>;
  toggleFavorite: (dishId: string) => Promise<void>;
  isFavorite: (dishId: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favoriteDishIds: [],

  initFavorites: async () => {
    try {
      const firebaseUser = await getFirebaseUser();
      if (firebaseUser) {
        const stored = await SecureStore.getItemAsync(FAVORITES_STORAGE_KEY);
        const localIds = stored ? JSON.parse(stored) as unknown : [];
        const localFavorites = Array.isArray(localIds)
          ? localIds.filter((id): id is string => typeof id === 'string')
          : [];
        const remoteIds = await readFavoriteIds(firebaseUser.uid);
        const merged = Array.from(new Set([...remoteIds, ...localFavorites]));
        await Promise.all(localFavorites
          .filter((id) => !remoteIds.includes(id))
          .map((id) => writeFavorite(firebaseUser.uid, id, true)));
        await SecureStore.deleteItemAsync(FAVORITES_STORAGE_KEY).catch(() => undefined);
        set({ favoriteDishIds: merged });
        return;
      }
      const data = await SecureStore.getItemAsync(FAVORITES_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          set({ favoriteDishIds: parsed });
        }
      }
    } catch {
      try {
        const data = await SecureStore.getItemAsync(FAVORITES_STORAGE_KEY);
        const parsed = data ? JSON.parse(data) : [];
        if (Array.isArray(parsed)) set({ favoriteDishIds: parsed });
      } catch { /* In-memory fallback. */ }
    }
  },

  toggleFavorite: async (dishId: string) => {
    const current = get().favoriteDishIds;
    const exists = current.includes(dishId);
    const updated = exists ? current.filter((id) => id !== dishId) : [...current, dishId];

    set({ favoriteDishIds: updated });
    try {
      const firebaseUser = await getFirebaseUser();
      if (firebaseUser) await writeFavorite(firebaseUser.uid, dishId, !exists);
      else await SecureStore.setItemAsync(FAVORITES_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      await SecureStore.setItemAsync(FAVORITES_STORAGE_KEY, JSON.stringify(updated)).catch(() => undefined);
    }
  },

  isFavorite: (dishId: string) => {
    return get().favoriteDishIds.includes(dishId);
  },
}));
