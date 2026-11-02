import { create } from "zustand";
import { api } from "../services/api";
import { tokenStorage } from "../services/token-storage";
import type { AuthTokens, UserProfileDto } from "../shared";

type AuthState = {
  user: UserProfileDto | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  checkAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: UserProfileDto | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const token = await tokenStorage.getAccessToken();
      if (!token) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      const user = await api.get<UserProfileDto>("/auth/me");
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      await tokenStorage.clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const data = await api.post<{ tokens: AuthTokens; user: UserProfileDto }>(
        "/auth/login",
        { email, password },
      );

      await tokenStorage.setAccessToken(data.tokens.accessToken);
      await tokenStorage.setRefreshToken(data.tokens.refreshToken);

      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (name, email, password, phone) => {
    set({ isLoading: true });
    try {
      const data = await api.post<{ tokens: AuthTokens; user: UserProfileDto }>(
        "/auth/register",
        { name, email, password, phone },
      );

      await tokenStorage.setAccessToken(data.tokens.accessToken);
      await tokenStorage.setRefreshToken(data.tokens.refreshToken);

      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.post("/auth/logout").catch(() => null);
    } finally {
      await tokenStorage.clearTokens();
      set({ user: null, isAuthenticated: false });
    }
  },
}));
