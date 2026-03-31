import { create } from 'zustand';
import api from '@/lib/api';

interface MessageStoreState {
  unreadCount: number;
  fetchUnreadCount: () => Promise<void>;
  setUnreadCount: (count: number) => void;
  decrementUnread: () => void;
  incrementUnread: () => void;
}

export const useMessageStore = create<MessageStoreState>((set) => ({
  unreadCount: 0,
  fetchUnreadCount: async () => {
    try {
      const { data } = await api.get('/messages/unread-count');
      set({ unreadCount: data.unreadCount || 0 });
    } catch (error) {
       console.error('Failed to fetch unread count:', error);
    }
  },
  setUnreadCount: (count) => set({ unreadCount: count }),
  decrementUnread: () => set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),
  incrementUnread: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
}));
