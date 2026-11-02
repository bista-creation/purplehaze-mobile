import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

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
      const data = await SecureStore.getItemAsync(FAVORITES_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          set({ favoriteDishIds: parsed });
        }
      }
    } catch {
      // In-memory fallback
    }
  },

  toggleFavorite: async (dishId: string) => {
    const current = get().favoriteDishIds;
    const exists = current.includes(dishId);
    const updated = exists ? current.filter((id) => id !== dishId) : [...current, dishId];

    set({ favoriteDishIds: updated });
    try {
      await SecureStore.setItemAsync(FAVORITES_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // In-memory fallback
    }
  },

  isFavorite: (dishId: string) => {
    return get().favoriteDishIds.includes(dishId);
  },
}));
