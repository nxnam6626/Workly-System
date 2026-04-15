import { create } from 'zustand';
import api from '../lib/api';

interface MessageState {
  unreadCount: number;
  fetchUnreadCount: () => Promise<void>;
  incrementUnread: () => void;
  resetUnread: () => void;
}

export const useMessageStore = create<MessageState>((set) => ({
  unreadCount: 0,

  fetchUnreadCount: async () => {
    try {
      const { data } = await api.get('/messages/unread-count');
      set({ unreadCount: data.count || 0 });
    } catch {}
  },

  incrementUnread: () => set((s) => ({ unreadCount: s.unreadCount + 1 })),
  resetUnread: () => set({ unreadCount: 0 }),
}));
