import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import type { UserSessionDto } from '../services/api-client';
import { supabase } from '../services/supabase';
import { onAuthExpired } from '../services/api-client';

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

function toAppUser(user: User): UserSessionDto {
  // Authorization roles are read only from app_metadata, which users cannot edit.
  const role = String(user.app_metadata?.role ?? 'CUSTOMER').toUpperCase();
  return {
    id: user.id,
    email: user.email ?? '',
    name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
    phone: user.user_metadata?.phone ?? user.phone ?? null,
    role: role === 'ADMIN' || role === 'STAFF' ? role : 'CUSTOMER',
    image: user.user_metadata?.avatar_url ?? null,
  };
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      const sessionUser = data.session?.user;
      set({
        user: sessionUser ? toAppUser(sessionUser) : null,
        isAuthenticated: !!sessionUser,
        isLoading: false,
      });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ isLoading: false });
      throw error;
    }
    set({ user: data.user ? toAppUser(data.user) : null, isAuthenticated: !!data.user, isLoading: false });
  },

  register: async (name, email, password, phone) => {
    set({ isLoading: true });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, ...(phone ? { phone } : {}) } },
    });
    if (error) {
      set({ isLoading: false });
      throw error;
    }
    if (!data.session) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      throw new Error('Account created. Check your email to confirm your address, then sign in.');
    }
    set({ user: data.user ? toAppUser(data.user) : null, isAuthenticated: !!data.user, isLoading: false });
  },

  loginWithGoogle: async (idToken) => {
    set({ isLoading: true });
    const { data, error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
    if (error) {
      set({ isLoading: false });
      throw error;
    }
    set({ user: data.user ? toAppUser(data.user) : null, isAuthenticated: !!data.user, isLoading: false });
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } finally {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));

supabase.auth.onAuthStateChange((_event, session) => {
  const user = session?.user ? toAppUser(session.user) : null;
  useAuthStore.setState({ user, isAuthenticated: !!user, isLoading: false });
});

onAuthExpired(() => {
  void supabase.auth.signOut();
});
