import { create } from 'zustand';
import api, { setAccessToken } from '../lib/api';
import { storage } from '../lib/storage';

interface User {
  userId: string;
  email: string;
  name?: string;
  avatar?: string;
  isEmailVerified?: boolean;
  roles?: string[];
  admin?: { permissions: string[] };
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

/**
 * Normalizes user data from different roles/schema structures
 */
const normalizeUser = (user: User): User => {
  if (user?.candidate?.fullName) {
    return { ...user, name: user.candidate.fullName };
  }
  return user;
};

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

      await storage.setItem('refreshToken', refreshToken);
      setAccessToken(accessToken);

      const normalizedUser = normalizeUser(user);
      set({ user: normalizedUser, isAuthenticated: true, isLoading: false });
      return normalizedUser;
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
    // 1. Update UI state immediately to trigger redirect
    set({ user: null, isAuthenticated: false, isLoading: false });

    // 2. Call server-side logout BEFORE clearing the token from memory/storage
    // but after UI update. This ensures the request has the Authorization header.
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('[Auth] Remote logout notification failed', err);
    } finally {
      // 3. Finally clear storage and memory token
      await storage.deleteItem('refreshToken');
      setAccessToken(null);
    }
  },

  checkAuth: async () => {
    const refreshToken = await storage.getItem('refreshToken');
    
    if (!refreshToken) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      // 1. Refresh Access Token
      const { data: refreshData } = await api.post('/auth/refresh', { refreshToken });
      const { accessToken, refreshToken: newRefresh } = refreshData;
      
      if (newRefresh) await storage.setItem('refreshToken', newRefresh);
      setAccessToken(accessToken);

      // 2. Validate & Get User Data
      const { data: valData } = await api.get('/auth/validate');
      const normalizedUser = normalizeUser(valData.user);

      set({ user: normalizedUser, isAuthenticated: true, isLoading: false });
    } catch (error) {
      console.error('[Auth] Background check failed', error);
      await storage.deleteItem('refreshToken');
      setAccessToken(null);
      set({ isLoading: false, isAuthenticated: false, user: null });
    }
  },
}));
