import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'ph_access_token';
const REFRESH_TOKEN_KEY = 'ph_refresh_token';
const USER_KEY = 'ph_user_session';

// In-memory fallback for non-supported/SSR environments
const memoryFallback: Record<string, string> = {};

function getWebItem(key: string): string | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return null;
}

function setWebItem(key: string, value: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // ignore local storage quota / private mode errors
    }
  }
}

function removeWebItem(key: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore local storage errors
    }
  }
}

async function isSecureStoreAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

export const tokenStorage = {
  async getAccessToken(): Promise<string | null> {
    if (Platform.OS === 'web') {
      return getWebItem(ACCESS_TOKEN_KEY) ?? memoryFallback[ACCESS_TOKEN_KEY] ?? null;
    }
    try {
      if (await isSecureStoreAvailable()) {
        const val = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
        if (val) return val;
      }
      return memoryFallback[ACCESS_TOKEN_KEY] || null;
    } catch {
      return memoryFallback[ACCESS_TOKEN_KEY] || null;
    }
  },

  async setAccessToken(token: string): Promise<void> {
    memoryFallback[ACCESS_TOKEN_KEY] = token;
    if (Platform.OS === 'web') {
      setWebItem(ACCESS_TOKEN_KEY, token);
      return;
    }
    try {
      if (await isSecureStoreAvailable()) {
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
      }
    } catch (e) {
      console.warn('Error saving access token to SecureStore', e);
    }
  },

  async getRefreshToken(): Promise<string | null> {
    if (Platform.OS === 'web') {
      return getWebItem(REFRESH_TOKEN_KEY) ?? memoryFallback[REFRESH_TOKEN_KEY] ?? null;
    }
    try {
      if (await isSecureStoreAvailable()) {
        const val = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
        if (val) return val;
      }
      return memoryFallback[REFRESH_TOKEN_KEY] || null;
    } catch {
      return memoryFallback[REFRESH_TOKEN_KEY] || null;
    }
  },

  async setRefreshToken(token: string): Promise<void> {
    memoryFallback[REFRESH_TOKEN_KEY] = token;
    if (Platform.OS === 'web') {
      setWebItem(REFRESH_TOKEN_KEY, token);
      return;
    }
    try {
      if (await isSecureStoreAvailable()) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
      }
    } catch (e) {
      console.warn('Error saving refresh token to SecureStore', e);
    }
  },

  async getUserSession(): Promise<string | null> {
    if (Platform.OS === 'web') {
      return getWebItem(USER_KEY) ?? memoryFallback[USER_KEY] ?? null;
    }
    try {
      if (await isSecureStoreAvailable()) {
        const val = await SecureStore.getItemAsync(USER_KEY);
        if (val) return val;
      }
      return memoryFallback[USER_KEY] || null;
    } catch {
      return memoryFallback[USER_KEY] || null;
    }
  },

  async setUserSession(userJson: string): Promise<void> {
    memoryFallback[USER_KEY] = userJson;
    if (Platform.OS === 'web') {
      setWebItem(USER_KEY, userJson);
      return;
    }
    try {
      if (await isSecureStoreAvailable()) {
        await SecureStore.setItemAsync(USER_KEY, userJson);
      }
    } catch (e) {
      console.warn('Error saving user session', e);
    }
  },

  async clearTokens(): Promise<void> {
    delete memoryFallback[ACCESS_TOKEN_KEY];
    delete memoryFallback[REFRESH_TOKEN_KEY];
    delete memoryFallback[USER_KEY];
    if (Platform.OS === 'web') {
      removeWebItem(ACCESS_TOKEN_KEY);
      removeWebItem(REFRESH_TOKEN_KEY);
      removeWebItem(USER_KEY);
      return;
    }
    try {
      if (await isSecureStoreAvailable()) {
        await Promise.all([
          SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
          SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
          SecureStore.deleteItemAsync(USER_KEY),
        ]);
      }
    } catch (e) {
      console.warn('Error clearing tokens from SecureStore', e);
    }
  },
};
