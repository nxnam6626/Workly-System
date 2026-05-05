import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Cross-platform Storage Utility
 * Uses SecureStore on Native for encryption and localStorage on Web.
 */
export const storage = {
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.error(`[Storage] Failed to set item: ${key}`, error);
    }
  },

  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      }
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`[Storage] Failed to get item: ${key}`, error);
      return null;
    }
  },

  async deleteItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error(`[Storage] Failed to delete item: ${key}`, error);
    }
  },
};
