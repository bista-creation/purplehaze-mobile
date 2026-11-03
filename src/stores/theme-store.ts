import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { lightColors, darkColors, type ColorTheme } from '../theme/colors';

const THEME_STORAGE_KEY = 'purplehaze_theme_mode';

export type ThemeMode = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  colors: ColorTheme;
  initTheme: () => Promise<void>;
  setMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'light',
  colors: lightColors,

  initTheme: async () => {
    try {
      const saved = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') {
        set({
          mode: saved,
          colors: saved === 'dark' ? (darkColors as ColorTheme) : lightColors,
        });
      }
    } catch {
      // default light
    }
  },

  setMode: async (mode: ThemeMode) => {
    const activeColors = mode === 'dark' ? (darkColors as ColorTheme) : lightColors;
    set({ mode, colors: activeColors });
    try {
      await SecureStore.setItemAsync(THEME_STORAGE_KEY, mode);
    } catch {
      // ignore
    }
  },

  toggleTheme: async () => {
    const next = get().mode === 'dark' ? 'light' : 'dark';
    await get().setMode(next);
  },
}));

export const useTheme = () => {
  const mode = useThemeStore((s) => s.mode);
  const themeColors = useThemeStore((s) => s.colors);
  const setMode = useThemeStore((s) => s.setMode);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  return {
    mode,
    isDark: mode === 'dark',
    colors: themeColors,
    setMode,
    toggleTheme,
  };
};
