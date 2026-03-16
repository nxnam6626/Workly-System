import { create } from 'zustand';
import api from '@/lib/api';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setTokens: (accessToken: string) => void;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: (localOnly?: boolean) => Promise<void>;
  checkAuth: () => Promise<void>;
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
      
      set({
        accessToken,
        user,
        isAuthenticated: true,
        isLoading: false,
      });
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

  checkAuth: async () => {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
    
    if (!refreshToken) {
       set({ isLoading: false, isAuthenticated: false });
       return;
    }
    
    try {
      const { data } = await api.get('/auth/validate');
      set({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false, isAuthenticated: false });
    }
  }
}));
