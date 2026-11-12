import { create } from 'zustand';
import type { UserSessionDto, AuthResponseDto } from '../services/api-client';
import { api, onAuthExpired } from '../services/api-client';
import { tokenStorage } from '../services/token-storage';
import { saveCustomerProfile } from '../services/customer-data';
import { useFavoritesStore } from './favorites-store';
import {
  getFirebaseUser,
  firebaseEmailLogin,
  firebaseEmailRegister,
  firebaseGoogleLogin,
  firebaseSendPhoneCode,
  firebaseConfirmPhoneCode,
  firebaseLogout,
} from '../services/firebase-auth';

type AuthState = {
  user: UserSessionDto | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  checkAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  sendPhoneCode: (phoneNumber: string) => Promise<void>;
  verifyPhoneCode: (code: string) => Promise<void>;
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
  void useFavoritesStore.getState().initFavorites();
}

type FirebaseCustomer = {
  uid: string;
  displayName?: string | null;
  phoneNumber?: string | null;
  getIdToken: (forceRefresh?: boolean) => Promise<string>;
};

async function exchangeFirebaseSession(idToken: string | undefined, firebaseUser?: FirebaseCustomer) {
  if (!idToken) throw new Error('Firebase did not return a sign-in token. Please try again.');
  if (firebaseUser) {
    await saveCustomerProfile(firebaseUser.uid, {
      name: firebaseUser.displayName ?? undefined,
      phone: firebaseUser.phoneNumber ?? undefined,
    }).catch((error) => console.warn('[Firebase] Customer profile sync deferred:', error));
  }
  await saveAuth(await api.auth.firebaseSignIn(idToken));
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const firebaseUser = await getFirebaseUser();
      if (firebaseUser) {
        await exchangeFirebaseSession(await firebaseUser.getIdToken(), firebaseUser);
        return;
      }
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
    try {
      const credential = await firebaseEmailLogin(email, password);
      if (credential.user.email && !credential.user.emailVerified) {
        throw new Error('Please verify your email from the link we sent before signing in.');
      }
      await exchangeFirebaseSession(await credential.user.getIdToken(true), credential.user);
    }
    catch (error) { set({ isLoading: false }); throw error; }
  },

  register: async (name, email, password, phone) => {
    set({ isLoading: true });
    try {
      await tokenStorage.clearTokens();
      const credential = await firebaseEmailRegister(name, email, password);
      await saveCustomerProfile(credential.user.uid, { name, phone });
      set({ isLoading: false, isAuthenticated: false, user: null });
      throw new Error('Account created. Verify your email from the link we sent, then sign in.');
    }
    catch (error) { set({ isLoading: false }); throw error; }
  },

  loginWithGoogle: async (idToken) => {
    set({ isLoading: true });
    try {
      const credential = await firebaseGoogleLogin(idToken);
      await exchangeFirebaseSession(await credential.user.getIdToken(true), credential.user);
    }
    catch (error) { set({ isLoading: false }); throw error; }
  },

  sendPhoneCode: async (phoneNumber) => {
    set({ isLoading: true });
    try {
      await firebaseSendPhoneCode(phoneNumber);
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  verifyPhoneCode: async (code) => {
    set({ isLoading: true });
    try {
      const credential = await firebaseConfirmPhoneCode(code);
      await exchangeFirebaseSession(await credential.user.getIdToken(true), credential.user);
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    const refreshToken = await tokenStorage.getRefreshToken();
    try { if (refreshToken) await api.auth.logout(undefined, false, refreshToken); }
    finally {
      await firebaseLogout().catch(() => undefined);
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
