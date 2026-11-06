import { create } from 'zustand';
import type { UserSessionDto, AuthResponseDto } from '../services/api-client';
import { api, onAuthExpired } from '../services/api-client';
import { tokenStorage } from '../services/token-storage';

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

async function saveAuth(data: AuthResponseDto) {
  await Promise.all([
    tokenStorage.setAccessToken(data.tokens.accessToken),
    tokenStorage.setRefreshToken(data.tokens.refreshToken),
    tokenStorage.setUserSession(JSON.stringify(data.user)),
  ]);
  useAuthStore.setState({ user: data.user, isAuthenticated: true, isLoading: false });
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const [accessToken, refreshToken] = await Promise.all([
        tokenStorage.getAccessToken(), tokenStorage.getRefreshToken(),
      ]);
      if (!accessToken || !refreshToken) {
        await tokenStorage.clearTokens();
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }
      const user = await api.auth.getMe();
      await tokenStorage.setUserSession(JSON.stringify(user));
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      let user: UserSessionDto | null = null;
      try {
        const savedUser = await tokenStorage.getUserSession();
        user = savedUser ? JSON.parse(savedUser) as UserSessionDto : null;
      } catch { /* Ignore corrupt cached profile data. */ }
      const [accessToken, refreshToken] = await Promise.all([
        tokenStorage.getAccessToken(), tokenStorage.getRefreshToken(),
      ]);
      if (!user || !accessToken || !refreshToken) await tokenStorage.clearTokens();
      set({ user: user && accessToken && refreshToken ? user : null, isAuthenticated: !!user && !!accessToken && !!refreshToken, isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try { await saveAuth(await api.auth.login({ email, password })); }
    catch (error) { set({ isLoading: false }); throw error; }
  },

  register: async (name, email, password, phone) => {
    set({ isLoading: true });
    try { await saveAuth(await api.auth.register({ name, email, password, phone })); }
    catch (error) { set({ isLoading: false }); throw error; }
  },

  loginWithGoogle: async (idToken) => {
    set({ isLoading: true });
    try { await saveAuth(await api.auth.googleSignIn(idToken)); }
    catch (error) { set({ isLoading: false }); throw error; }
  },

  logout: async () => {
    set({ isLoading: true });
    const refreshToken = await tokenStorage.getRefreshToken();
    try { if (refreshToken) await api.auth.logout(undefined, false, refreshToken); }
    finally {
      await tokenStorage.clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));

onAuthExpired(() => {
  void tokenStorage.clearTokens().finally(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false });
  });
});
