import { create } from 'zustand';
import { api, type UserSessionDto } from '../services/api-client';
import { tokenStorage } from '../services/token-storage';
import { pushNotifications } from '../services/push-notifications';

type AuthState = {
  user: UserSessionDto | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  checkAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: UserSessionDto | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      // 1. Try to load cached user session for instant render
      const cached = await tokenStorage.getUserSession();
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as UserSessionDto;
          set({ user: parsed, isAuthenticated: true });
        } catch {
          // ignore corrupted cache
        }
      }

      const token = await tokenStorage.getAccessToken();
      if (!token) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      // 2. Revalidate with backend
      const user = await api.auth.getMe();
      await tokenStorage.setUserSession(JSON.stringify(user));
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      await tokenStorage.clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const data = await api.auth.login({ email, password });

      await tokenStorage.setAccessToken(data.tokens.accessToken);
      await tokenStorage.setRefreshToken(data.tokens.refreshToken);
      await tokenStorage.setUserSession(JSON.stringify(data.user));

      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (name, email, password, phone) => {
    set({ isLoading: true });
    try {
      const data = await api.auth.register({ name, email, password, phone });

      await tokenStorage.setAccessToken(data.tokens.accessToken);
      await tokenStorage.setRefreshToken(data.tokens.refreshToken);
      await tokenStorage.setUserSession(JSON.stringify(data.user));

      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  loginWithGoogle: async (idToken: string) => {
    set({ isLoading: true });
    try {
      const data = await api.auth.googleSignIn(idToken);

      await tokenStorage.setAccessToken(data.tokens.accessToken);
      await tokenStorage.setRefreshToken(data.tokens.refreshToken);
      await tokenStorage.setUserSession(JSON.stringify(data.user));

      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      const pushToken = pushNotifications.getPushToken() || undefined;
      await api.auth.logout(pushToken, false).catch(() => null);
    } finally {
      await tokenStorage.clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
