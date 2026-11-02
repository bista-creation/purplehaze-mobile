import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'ph_access_token';
const REFRESH_TOKEN_KEY = 'ph_refresh_token';
const USER_KEY = 'ph_user_session';

// In-memory fallback for web and non-supported environments
const memoryFallback: Record<string, string> = {};

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
    try {
      if (await isSecureStoreAvailable()) {
        return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
      }
      return memoryFallback[ACCESS_TOKEN_KEY] || null;
    } catch {
      return memoryFallback[ACCESS_TOKEN_KEY] || null;
    }
  },

  async setAccessToken(token: string): Promise<void> {
    memoryFallback[ACCESS_TOKEN_KEY] = token;
    try {
      if (await isSecureStoreAvailable()) {
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
      }
    } catch (e) {
      console.warn('Error saving access token to SecureStore', e);
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      if (await isSecureStoreAvailable()) {
        return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      }
      return memoryFallback[REFRESH_TOKEN_KEY] || null;
    } catch {
      return memoryFallback[REFRESH_TOKEN_KEY] || null;
    }
  },

  async setRefreshToken(token: string): Promise<void> {
    memoryFallback[REFRESH_TOKEN_KEY] = token;
    try {
      if (await isSecureStoreAvailable()) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
      }
    } catch (e) {
      console.warn('Error saving refresh token to SecureStore', e);
    }
  },

  async getUserSession(): Promise<string | null> {
    try {
      if (await isSecureStoreAvailable()) {
        return await SecureStore.getItemAsync(USER_KEY);
      }
      return memoryFallback[USER_KEY] || null;
    } catch {
      return memoryFallback[USER_KEY] || null;
    }
  },

  async setUserSession(userJson: string): Promise<void> {
    memoryFallback[USER_KEY] = userJson;
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
