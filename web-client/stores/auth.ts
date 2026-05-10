import { create } from 'zustand';
import api from '@/lib/api';
import { useFavoriteStore } from './favorites';

interface User {
  userId: string;
  email: string;
  name?: string;
  avatar?: string;
  phoneNumber?: string;
  roles?: string[];
  lastLogin?: string | null;
  isFirstLogin?: boolean;
  candidate?: {
    fullName?: string;
    university?: string;
    major?: string;
    gpa?: number;
    isOpenToWork?: boolean;
    jobSearchExpiresAt?: string | null;
    skills?: { skillId: string; skillName: string }[];
  };
  recruiter?: any;
  admin?: {
    permissions: string[];
  };
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean; // true sau khi checkAuth() chạy xong lần đầu
  setTokens: (accessToken: string) => void;
  login: (credentials: any) => Promise<User>;
  register: (data: any) => Promise<void>;
  logout: (localOnly?: boolean) => Promise<void>;
  checkAuth: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (data: any) => Promise<void>;
  changePassword: (data: any) => Promise<void>;
  setOAuthTokens: (accessToken: string, refreshToken: string, isFirstLogin?: boolean) => Promise<void>;
  updateUser: (partial: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false, // Bắt đầu là false, set thành true sau checkAuth

  setTokens: (accessToken: string) => {
    set({ accessToken, isAuthenticated: true });
  },

  updateUser: (partial) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...partial } : state.user,
    }));
  },

  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/login', credentials);
      const { accessToken, refreshToken, user, isFirstLogin } = data;

      if (typeof window !== 'undefined') {
        localStorage.setItem('refreshToken', refreshToken);
      }

      // Map name for consistency
      if (user && user.candidate?.fullName) {
        user.name = user.candidate.fullName;
      }

      set({
        accessToken,
        user: { ...user, isFirstLogin },
        isAuthenticated: true,
        isLoading: false,
      });

      return { ...user, isFirstLogin };
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (userData) => {
    set({ isLoading: true });
    try {
      await api.post('/auth/register', userData);
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async (localOnly = false) => {
    // 1. Update UI state immediately
    set({
      user: null,
      accessToken: null, // Note: Web store uses accessToken in state, unlike Mobile which uses a local variable in api.ts
      isAuthenticated: false,
      isLoading: false,
    });
    
    useFavoriteStore.getState().clearFavorites();

    // 2. Revoke remotely
    if (!localOnly) {
      try {
        await api.post('/auth/logout');
      } catch (e) {
        console.warn('[Auth] Remote logout failed', e);
      }
    }

    // 3. Clear persistent storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('refreshToken');
    }
  },

  forgotPassword: async (email) => {
    try {
      await api.post('/auth/forgot-password', { email });
    } catch (error) {
      throw error;
    }
  },

  resetPassword: async (data) => {
    try {
      await api.post('/auth/reset-password', data);
    } catch (error) {
      throw error;
    }
  },

  changePassword: async (data: any) => {
    try {
      await api.patch('/auth/change-password', data);
    } catch (error) {
      throw error;
    }
  },

  checkAuth: async () => {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;

    if (!refreshToken) {
      set({ isLoading: false, isAuthenticated: false, isInitialized: true });
      return;
    }

    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/refresh', { refreshToken });
      const { accessToken, refreshToken: newRefreshToken } = data;

      if (newRefreshToken && typeof window !== 'undefined') {
        localStorage.setItem('refreshToken', newRefreshToken);
      }

      const { data: validateData } = await api.get('/auth/validate', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const user = validateData.user;
      if (user && user.candidate?.fullName) {
        user.name = user.candidate.fullName;
      }

      set({
        accessToken,
        user,
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
      });
    } catch (error) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('refreshToken');
      }
      set({ isLoading: false, isAuthenticated: false, user: null, accessToken: null, isInitialized: true });
    }
  },

  setOAuthTokens: async (accessToken: string, refreshToken: string, isFirstLogin = false) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('refreshToken', refreshToken);
    }

    try {
      const { data: validateData } = await api.get('/auth/validate', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      set({
        accessToken,
        user: { ...validateData.user, isFirstLogin },
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('refreshToken');
      }
      set({ isLoading: false, isAuthenticated: false, user: null, accessToken: null });
      throw err;
    }
  }
}));
