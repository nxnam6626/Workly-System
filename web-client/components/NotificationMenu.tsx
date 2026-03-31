'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle, FileText, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { useSocketStore } from '@/stores/socket';
import { useAuthStore } from '@/stores/auth';
import { timeAgo } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export function NotificationMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  
  const { socket, isConnected } = useSocketStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewNotification = (data: any) => {
      setUnreadCount(prev => prev + 1);
      // If menu is open, we can prepend the new notification or refetch
      if (isOpen) {
        setNotifications(prev => [{
           notificationId: 'temp-' + Date.now(),
           title: data.title,
           message: data.message,
           type: data.type || 'info',
           isRead: false,
           createdAt: new Date().toISOString()
        }, ...prev]);
      }
    };

    socket.on('notification', handleNewNotification);

    return () => {
      socket.off('notification', handleNewNotification);
    };
  }, [socket, isConnected, isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const { data } = await api.get('/notifications/unread-count');
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch unread count', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data || []);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  const markAsRead = async (id: string) => {
     try {
        await api.patch(`/notifications/read/${id}`);
        setNotifications(prev => prev.map(n => n.notificationId === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
     } catch (err) {
        console.error('Failed to mark as read', err);
     }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const handleNotificationClick = (notif: any) => {
     if (!notif.isRead) {
        markAsRead(notif.notificationId);
     }
     if (notif.link) {
        router.push(notif.link);
        setIsOpen(false);
     }
  };

  const getIcon = (type: string) => {
    switch (type) {
       case 'success': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
       case 'info': return <FileText className="w-5 h-5 text-blue-500" />;
       default: return <Info className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors focus:outline-none"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-white translate-x-1 -translate-y-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 text-left"
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-slate-800">Thông báo</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                >
                  Đánh dấu đã đọc tất cả
                </button>
              )}
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <Bell className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm">Bạn không có thông báo nào.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.notificationId} 
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-4 flex gap-3 transition-colors cursor-pointer hover:bg-slate-50 ${!notif.isRead ? 'bg-indigo-50/30' : ''}`}
                    >
                      <div className="flex-shrink-0 mt-1">
                         {getIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="flex justify-between items-start mb-1">
                            <h4 className={`text-sm tracking-tight truncate ${!notif.isRead ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                               {notif.title}
                            </h4>
                            <span className="text-[11px] text-slate-400 whitespace-nowrap ml-2">
                               {timeAgo(notif.createdAt)}
                            </span>
                         </div>
                         <p className={`text-xs leading-relaxed line-clamp-2 ${!notif.isRead ? 'text-slate-700' : 'text-slate-500'}`}>
                            {notif.message}
                         </p>
                      </div>
                      {!notif.isRead && (
                         <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0"></div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
