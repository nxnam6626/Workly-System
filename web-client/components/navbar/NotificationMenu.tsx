'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle, FileText, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { useSocketStore } from '@/stores/socket';
import { useAuthStore } from '@/stores/auth';
import { timeAgo } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export function NotificationMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
           <>
             {/* Backdrop exactly for mobile to click outside and close, but hidden on desktop since we have a global listener */}
             <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-[90] sm:hidden"
             />
             <motion.div
               initial={{ opacity: 0, scale: 0.95, y: 10 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 10 }}
               transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
               className="fixed left-4 right-4 top-20 z-[100] sm:absolute sm:top-full sm:-right-4 sm:left-auto sm:mt-3 sm:w-96 bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden text-left origin-top sm:origin-top-right flex flex-col"
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
            
            <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto">
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
             {notifications.length > 0 && (
                <div className="p-3 border-t border-slate-100 bg-slate-50 text-center">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setIsModalOpen(true);
                    }}
                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    Xem tất cả thông báo
                  </button>
                </div>
             )}
            </motion.div>
           </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <Bell className="w-5 h-5 text-indigo-600" />
                  Tất cả thông báo
                </h3>
                <div className="flex items-center gap-4">
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllAsRead}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      Đánh dấu đã đọc tất cả
                    </button>
                  )}
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    &times;
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-2">
                {notifications.length === 0 ? (
                  <div className="py-20 text-center text-slate-500">
                    <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-base font-medium">Bạn không có thông báo nào.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {notifications.map((notif) => (
                      <div 
                        key={notif.notificationId} 
                        onClick={() => {
                          handleNotificationClick(notif);
                          setIsModalOpen(false);
                        }}
                        className={`p-5 flex gap-4 transition-colors cursor-pointer hover:bg-slate-50 rounded-xl ${!notif.isRead ? 'bg-indigo-50/30' : ''}`}
                      >
                        <div className="flex-shrink-0 mt-1">
                          {getIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1.5">
                              <h4 className={`text-[15px] tracking-tight ${!notif.isRead ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                                {notif.title}
                              </h4>
                              <span className="text-xs font-medium text-slate-400 whitespace-nowrap ml-3">
                                {timeAgo(notif.createdAt)}
                              </span>
                          </div>
                          <p className={`text-sm leading-relaxed ${!notif.isRead ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>
                              {notif.message}
                          </p>
                        </div>
                        {!notif.isRead && (
                            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0 shadow-sm"></div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
