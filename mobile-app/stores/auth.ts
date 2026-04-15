import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import api, { setAccessToken } from '../lib/api';

interface User {
  userId: string;
  email: string;
  name?: string;
  avatar?: string;
  roles?: string[];
  admin?: { adminLevel: number; permissions: string[] };
  candidate?: { fullName?: string };
  recruiter?: any;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<User>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateUser: (partial: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  updateUser: (partial) =>
    set((s) => ({ user: s.user ? { ...s.user, ...partial } : s.user })),

  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/login', credentials);
      const { accessToken, refreshToken, user } = data;

      // Store refresh token securely (no localStorage on mobile!)
      await SecureStore.setItemAsync('refreshToken', refreshToken);
      setAccessToken(accessToken);

      if (user?.candidate?.fullName) user.name = user.candidate.fullName;

      set({ user, isAuthenticated: true, isLoading: false });
      return user;
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  register: async (userData) => {
    set({ isLoading: true });
    try {
      await api.post('/auth/register', userData);
      await get().login({ email: userData.email, password: userData.password });
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  logout: async () => {
    try { await api.post('/auth/logout'); } catch {}
    await SecureStore.deleteItemAsync('refreshToken');
    setAccessToken(null);
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    if (!refreshToken) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }
    try {
      const { data } = await api.post('/auth/refresh', { refreshToken });
      const { accessToken, refreshToken: newRefresh } = data;
      if (newRefresh) await SecureStore.setItemAsync('refreshToken', newRefresh);
      setAccessToken(accessToken);

      const { data: val } = await api.get('/auth/validate', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const user = val.user;
      if (user?.candidate?.fullName) user.name = user.candidate.fullName;

      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      await SecureStore.deleteItemAsync('refreshToken');
      setAccessToken(null);
      set({ isLoading: false, isAuthenticated: false, user: null });
    }
  },
}));
