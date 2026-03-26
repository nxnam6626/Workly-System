import { create } from 'zustand';
import api from '@/lib/api';

interface User {
  userId: string;
  email: string;
  name?: string;
  roles?: string[];
  candidate?: any;
  recruiter?: any;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setTokens: (accessToken: string) => void;
  login: (credentials: any) => Promise<User>;
  register: (data: any) => Promise<void>;
  logout: (localOnly?: boolean) => Promise<void>;
  checkAuth: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (data: any) => Promise<void>;
  setOAuthTokens: (accessToken: string, refreshToken: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  setTokens: (accessToken: string) => {
    set({ accessToken, isAuthenticated: true });
  },

  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/login', credentials);
      const { accessToken, refreshToken, user } = data;

      if (typeof window !== 'undefined') {
        localStorage.setItem('refreshToken', refreshToken);
      }

      // Map name for consistency
      if (user && user.candidate?.fullName) {
        user.name = user.candidate.fullName;
      }

      set({
        accessToken,
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      return user;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (userData) => {
    set({ isLoading: true });
    try {
      await api.post('/auth/register', userData);

      // Auto-login after successful registration
      await get().login({
        email: userData.email,
        password: userData.password
      });

    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async (localOnly = false) => {
    if (!localOnly) {
      try {
        await api.post('/auth/logout');
      } catch (e) {
        // Ignore remote logout errors
      }
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem('refreshToken');
    }

    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
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

  checkAuth: async () => {
    set({ isLoading: true }); // Block renders until auth is resolved
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;

    if (!refreshToken) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      // Dùng refreshToken để lấy accessToken mới, đồng thời lấy thông tin user
      const { data } = await api.post('/auth/refresh', { refreshToken });
      const { accessToken, refreshToken: newRefreshToken } = data;

      if (newRefreshToken && typeof window !== 'undefined') {
        localStorage.setItem('refreshToken', newRefreshToken);
      }

      // Dùng accessToken mới để lấy thông tin user (bao gồm role)
      const { data: validateData } = await api.get('/auth/validate', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      console.log('[checkAuth] user from validate:', validateData.user);
      
      const user = validateData.user;
      // Map candidate name if exists
      if (user && user.candidate?.fullName) {
        user.name = user.candidate.fullName;
      }

      set({
        accessToken,
        user: user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('refreshToken');
      }
      set({ isLoading: false, isAuthenticated: false, user: null, accessToken: null });
    }
  },

  setOAuthTokens: async (accessToken: string, refreshToken: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('refreshToken', refreshToken);
    }

    try {
      const { data: validateData } = await api.get('/auth/validate', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      set({
        accessToken,
        user: validateData.user,
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
