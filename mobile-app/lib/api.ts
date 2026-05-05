import axios from 'axios';
import { storage } from './storage';

/**
 * Global API Configuration
 * Handles base URL, auth token injection, and automatic token refreshing.
 */

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Internal memory store for the current active token
let _accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  _accessToken = token;
};

export const getAccessToken = () => _accessToken;

// Request Interceptor: Attach bearer token if available
api.interceptors.request.use((config) => {
  if (_accessToken) {
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }
  return config;
});

// Response Interceptor: Handle errors and automatic token refreshing
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors by attempting to refresh the token
    const isUnauthorized = error.response?.status === 401;
    const isRetryAlreadyAttempted = originalRequest._retry;

    if (isUnauthorized && !isRetryAlreadyAttempted) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = await storage.getItem('refreshToken');
        if (!refreshToken) {
          // No token to refresh? Trigger a full logout to sync UI
          const { useAuthStore } = require('../stores/auth');
          useAuthStore.getState().logout();
          throw new Error('No refresh token available');
        }

        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
        
        _accessToken = data.accessToken;
        if (data.refreshToken) {
          await storage.setItem('refreshToken', data.refreshToken);
        }

        originalRequest.headers.Authorization = `Bearer ${_accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear everything and trigger logout
        const { useAuthStore } = require('../stores/auth');
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
