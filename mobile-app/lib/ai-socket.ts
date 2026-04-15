import { io, Socket } from 'socket.io-client';
import { getAccessToken } from './api';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || process.env.EXPO_PUBLIC_API_URL || 'http://192.168.100.53:3001';

let aiSocket: Socket | null = null;

export const connectAiSocket = (): Socket => {
  if (aiSocket?.connected) return aiSocket;

  aiSocket = io(`${SOCKET_URL}/ai-chat`, {
    transports: ['websocket'],
    auth: { token: getAccessToken() },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  aiSocket.on('connect', () => {
    console.log('[AI Socket] Connected:', aiSocket?.id);
  });

  aiSocket.on('connect_error', (err) => {
    console.warn('[AI Socket] Connection error:', err.message);
  });

  aiSocket.on('disconnect', () => {
    console.log('[AI Socket] Disconnected');
  });

  return aiSocket;
};

export const getAiSocket = () => aiSocket;

export const disconnectAiSocket = () => {
  if (aiSocket) {
    aiSocket.disconnect();
    aiSocket = null;
  }
};
