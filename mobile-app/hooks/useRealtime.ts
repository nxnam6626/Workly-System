import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '../stores/auth';
import { useSocketStore } from '../stores/socket';
import { useNotificationStore } from '../stores/notification';
import { useMessageStore } from '../stores/message';

/**
 * hook useRealtime — gắn kết tất cả Socket.IO listeners toàn hệ thống.
 * Gọi 1 lần duy nhất trong root layout sau khi user đăng nhập.
 */
export function useRealtime() {
  const { user, isAuthenticated } = useAuthStore();
  const { connect, disconnect, socket } = useSocketStore();
  const { addNotification, fetchNotifications } = useNotificationStore();
  const { fetchUnreadCount, incrementUnread } = useMessageStore();
  const appState = useRef(AppState.currentState);

  // Connect/disconnect socket theo auth state
  useEffect(() => {
    if (isAuthenticated && user) {
      connect();
      fetchNotifications();
      fetchUnreadCount();
    } else {
      disconnect();
    }
  }, [isAuthenticated, user?.userId]);

  // AppState — reconnect khi app foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        if (isAuthenticated) connect();
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, [isAuthenticated]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Tin nhắn mới
    const handleNewMessage = (msg: any) => {
      if (msg.senderId !== user?.userId) {
        incrementUnread();
      }
    };

    // Thông báo mới
    const handleNewNotification = (notification: any) => {
      addNotification(notification);
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('newNotification', handleNewNotification);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('newNotification', handleNewNotification);
    };
  }, [socket, user?.userId]);
}
