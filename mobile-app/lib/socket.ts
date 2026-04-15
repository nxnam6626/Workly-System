import { io, Socket } from 'socket.io-client';
import { API_BASE_URL, getAccessToken } from './api';

let socket: Socket | null = null;

export const connectSocket = () => {
  if (socket?.connected) return socket;

  socket = io(API_BASE_URL, {
    transports: ['websocket'],
    auth: {
      token: getAccessToken(),
    },
  });

  socket.on('connect', () => {
    console.log('Socket.IO Connected:', socket?.id);
  });

  socket.on('connect_error', (error) => {
    console.log('Socket.IO Error:', error.message);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
