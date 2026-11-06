import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform, type ColorSchemeName } from 'react-native';
import { colors, lightColors, darkColors, type ColorTheme } from '../theme/colors';

const THEME_STORAGE_KEY = 'purplehaze_theme_mode';

export type ThemeMode = 'system' | 'light' | 'dark';
export type ResolvedThemeMode = 'light' | 'dark';

const normalizeSystemScheme = (scheme: ColorSchemeName | null): 'light' | 'dark' =>
  scheme === 'dark' ? 'dark' : 'light';

const getColorsForMode = (mode: ThemeMode, systemScheme: 'light' | 'dark'): ColorTheme => {
  const resolvedMode = mode === 'system' ? systemScheme : mode;
  return (resolvedMode === 'dark' ? darkColors : lightColors) as ColorTheme;
};

interface ThemeState {
  /** Resolved appearance used by existing screens. */
  mode: ResolvedThemeMode;
  /** User's saved preference; system follows the device appearance. */
  preference: ThemeMode;
  systemScheme: 'light' | 'dark';
  colors: ColorTheme;
  initTheme: (systemScheme?: ColorSchemeName | null) => Promise<void>;
  setSystemScheme: (systemScheme: ColorSchemeName | null) => void;
  setMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'light',
  preference: 'system',
  systemScheme: 'light',
  colors: lightColors,

  initTheme: async (systemScheme = 'light') => {
    const normalizedSystemScheme = normalizeSystemScheme(systemScheme);
    set({ systemScheme: normalizedSystemScheme });
    let preference: ThemeMode = 'system';
    try {
      const saved = Platform.OS === 'web'
        ? (typeof localStorage !== 'undefined' ? localStorage.getItem(THEME_STORAGE_KEY) : null)
        : await SecureStore.getItemAsync(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light' || saved === 'system') preference = saved;
    } catch {
      // Follow the device appearance if saved preferences cannot be read.
    }

    const latestSystemScheme = get().systemScheme;
    const activeColors = getColorsForMode(preference, latestSystemScheme);
    Object.assign(colors, activeColors);
    set({
      mode: preference === 'system' ? latestSystemScheme : preference,
      preference,
      systemScheme: latestSystemScheme,
      colors: activeColors,
    });
  },

  setSystemScheme: (systemScheme) => {
    const normalizedSystemScheme = normalizeSystemScheme(systemScheme);
    const { preference } = get();
    if (preference !== 'system') {
      set({ systemScheme: normalizedSystemScheme });
      return;
    }
    const activeColors = getColorsForMode('system', normalizedSystemScheme);
    Object.assign(colors, activeColors);
    set({ mode: normalizedSystemScheme, systemScheme: normalizedSystemScheme, colors: activeColors });
  },

  setMode: async (mode: ThemeMode) => {
    const { systemScheme } = get();
    const activeColors = getColorsForMode(mode, systemScheme);
    Object.assign(colors, activeColors);
    set({ mode: mode === 'system' ? systemScheme : mode, preference: mode, colors: activeColors });
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') localStorage.setItem(THEME_STORAGE_KEY, mode);
      } else {
        await SecureStore.setItemAsync(THEME_STORAGE_KEY, mode);
      }
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
  const preference = useThemeStore((s) => s.preference);
  const themeColors = useThemeStore((s) => s.colors);
  const setMode = useThemeStore((s) => s.setMode);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  return {
    mode,
    preference,
    isDark: mode === 'dark',
    colors: themeColors,
    setMode,
    toggleTheme,
  };
};
