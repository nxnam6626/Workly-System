import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// ⚠️ Change to your LAN IP when testing on physical device (set in .env EXPO_PUBLIC_API_URL)
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.100:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token from memory store
let _accessToken: string | null = null;
export const setAccessToken = (token: string | null) => { _accessToken = token; };
export const getAccessToken = () => _accessToken;

api.interceptors.request.use((config) => {
  if (_accessToken) {
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
        _accessToken = data.accessToken;
        if (data.refreshToken) {
          await SecureStore.setItemAsync('refreshToken', data.refreshToken);
        }
        original.headers.Authorization = `Bearer ${_accessToken}`;
        return api(original);
      } catch {
        _accessToken = null;
        await SecureStore.deleteItemAsync('refreshToken');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
