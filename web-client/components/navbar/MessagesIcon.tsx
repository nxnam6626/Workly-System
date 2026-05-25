'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { useMessageStore } from '@/stores/message';
import { useSocketStore } from '@/stores/socket';

export function MessagesIcon() {
  const { isAuthenticated } = useAuthStore();
  const { unreadCount, fetchUnreadCount, incrementUnread } = useMessageStore();
  const { socket, isConnected } = useSocketStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
    }
  }, [isAuthenticated, fetchUnreadCount]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewMessage = (message: any) => {
      // If the message is received from someone else, we increment the unread count
      // We check if the current user is not the sender
      const currentUserId = useAuthStore.getState().user?.userId;
      if (message.senderId && message.senderId !== currentUserId) {
        incrementUnread();
      }
    };

    socket.on('newMessage', handleNewMessage);

    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, [socket, isConnected, incrementUnread]);

  if (!isAuthenticated) return null;

  return (
    <Link
      href="/profile/messages"
      className="relative w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm hover:scale-110 active:scale-95 duration-200"
      title="Tin nhắn"
    >
      <MessageCircle className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
}
