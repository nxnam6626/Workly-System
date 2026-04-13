import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './auth';

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  
  connect: () => {
    const { accessToken } = useAuthStore.getState();
    if (!accessToken) return;
    
    if (get().socket?.connected || get().socket) return;

    const socketUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace('/api', '');
    
    const socket = io(socketUrl, {
      auth: {
        token: accessToken
      },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('Socket connected');
      set({ isConnected: true });
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      set({ isConnected: false });
    });

    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  }
}));
