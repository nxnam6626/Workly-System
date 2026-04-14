'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bell, Check, Clock, Briefcase, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore } from '@/stores/notification';
import { useAuthStore } from '@/stores/auth';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export function NotificationsDropdown() {
  const { isAuthenticated } = useAuthStore();
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    fetchNotifications, 
    fetchUnreadCount, 
    markAsRead, 
    markAllAsRead 
  } = useNotificationStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
    }
  }, [isAuthenticated, fetchUnreadCount]);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchNotifications();
    }
  }, [isOpen, isAuthenticated, fetchNotifications]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isAuthenticated) {
    return (
      <Link
        href="/login"
        className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
        title="Đăng nhập để xem thông báo"
      >
        <Bell className="w-5 h-5" />
      </Link>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm hover:scale-110 active:scale-95 z-10 relative ${
          isOpen 
            ? 'bg-blue-600 text-white border-blue-600 shadow-blue-200' 
            : 'bg-white border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200'
        }`}
        title="Thông báo"
      >
        <Bell className={`w-5 h-5 ${isOpen ? 'fill-current' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm ring-1 ring-rose-200">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute right-0 mt-3 w-85 bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.18)] border border-slate-100 z-50 overflow-hidden ring-1 ring-black/5"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between bg-gradient-to-r from-slate-50/80 to-white">
              <h3 className="font-bold text-slate-800 text-[16px] tracking-tight">
                Thông báo
              </h3>
              {unreadCount > 0 && (
                <button 
                  onClick={() => markAllAsRead()}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-emerald-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  Đánh dấu là đã đọc
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[440px] overflow-y-auto custom-scrollbar bg-slate-50/20">
              {isLoading ? (
                <div className="p-12 flex flex-col items-center justify-center space-y-4">
                  <div className="w-10 h-10 border-3 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Đang tải thông báo</p>
                </div>
              ) : notifications.length > 0 ? (
                <div className="divide-y divide-slate-100/50">
                  {notifications.map((notification) => (
                    <div
                      key={notification.notificationId}
                      className={`relative flex items-start gap-4 p-4 transition-all duration-300 group cursor-pointer border-l-4 ${
                        notification.isRead 
                          ? 'bg-white border-transparent hover:bg-slate-50' 
                          : 'bg-blue-50/40 border-blue-500 hover:bg-blue-50/60'
                      }`}
                      onClick={() => !notification.isRead && markAsRead(notification.notificationId)}
                    >
                      <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center shadow-sm relative ${
                        notification.type === 'JOB_ALERT' 
                          ? 'bg-emerald-100 text-emerald-600 group-hover:scale-110 transition-transform duration-300' 
                          : 'bg-blue-100 text-blue-600'
                      }`}>
                        {notification.type === 'JOB_ALERT' ? <Briefcase className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                        {!notification.isRead && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white ring-1 ring-blue-200" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-0.5">
                          <h4 className={`text-[14px] leading-snug truncate pr-4 ${notification.isRead ? 'font-semibold text-slate-700' : 'font-bold text-slate-900'}`}>
                            {notification.title}
                          </h4>
                        </div>
                        <p className={`text-[13px] leading-relaxed mb-1.5 line-clamp-2 ${notification.isRead ? 'text-slate-500 font-medium' : 'text-slate-700 font-semibold'}`}>
                          {notification.content}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: vi })}
                        </div>
                      </div>

                      {/* Link overlay for Job Alert */}
                      {notification.metadata?.jobPostingId && (
                        <Link 
                          href={`/jobs/${notification.metadata.jobPostingId}`}
                          className="absolute inset-0 z-10"
                          onClick={() => {
                            setIsOpen(false);
                            if (!notification.isRead) markAsRead(notification.notificationId);
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-16 text-center flex flex-col items-center justify-center space-y-5">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 shadow-inner">
                    <Bell className="w-10 h-10" />
                  </div>
                  <div className="space-y-2 px-6">
                    <p className="text-[15px] font-bold text-slate-700">Chưa có thông báo nào</p>
                    <p className="text-[13px] text-slate-400 leading-relaxed font-medium">Chúng tôi sẽ thông báo cho bạn khi có tin tuyển dụng phù hợp hoặc cập nhật mới.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex gap-2">
              <Link
                href="/profile/notifications"
                onClick={() => setIsOpen(false)}
                className="flex-1 py-2.5 flex items-center justify-center gap-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 shadow-sm transition-all duration-300 active:scale-[0.98]"
              >
                Xem tất cả thông báo
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
