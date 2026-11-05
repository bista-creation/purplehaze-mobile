import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.');
}

// Keep auth data encrypted on native. SecureStore has a small per-value limit,
// so larger Supabase sessions are split into short values.
const CHUNK_SIZE = 400;
const webStorage = {
  getItem: (key: string) => (typeof localStorage === 'undefined' ? null : localStorage.getItem(key)),
  setItem: (key: string, value: string) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
  },
};

const nativeStorage = {
  async getItem(key: string) {
    const countText = await SecureStore.getItemAsync(`${key}:count`);
    if (!countText) return null;
    const count = Number(countText);
    if (!Number.isInteger(count) || count < 1 || count > 100) return null;
    const chunks = await Promise.all(
      Array.from({ length: count }, (_, index) => SecureStore.getItemAsync(`${key}:${index}`)),
    );
    return chunks.some((chunk) => chunk === null) ? null : chunks.join('');
  },
  async setItem(key: string, value: string) {
    const previousCount = Number((await SecureStore.getItemAsync(`${key}:count`)) ?? '0');
    const chunks = value.match(new RegExp(`[\\s\\S]{1,${CHUNK_SIZE}}`, 'g')) ?? [''];
    await Promise.all(chunks.map((chunk, index) => SecureStore.setItemAsync(`${key}:${index}`, chunk)));
    await SecureStore.setItemAsync(`${key}:count`, String(chunks.length));
    await Promise.all(
      Array.from({ length: Math.max(0, previousCount - chunks.length) }, (_, index) =>
        SecureStore.deleteItemAsync(`${key}:${chunks.length + index}`),
      ),
    );
  },
  async removeItem(key: string) {
    const count = Number((await SecureStore.getItemAsync(`${key}:count`)) ?? '0');
    await Promise.all([
      SecureStore.deleteItemAsync(`${key}:count`),
      ...Array.from({ length: Math.min(100, Math.max(0, count)) }, (_, index) =>
        SecureStore.deleteItemAsync(`${key}:${index}`),
      ),
    ]);
  },
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: Platform.OS === 'web' ? webStorage : nativeStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
