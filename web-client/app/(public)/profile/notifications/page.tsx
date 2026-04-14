'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BellRing,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  MailOpen,
  Info,
  Briefcase,
  AlertCircle,
} from 'lucide-react';
import { notificationsApi, type Notification } from '@/lib/notifications-api';
import { useAuthStore } from '@/stores/auth';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/profile/notifications');
      return;
    }
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await notificationsApi.getNotifications();
      // Sort by newest first
      const sorted = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotifications(sorted);
    } catch (error) {
      toast.error('Không thể tải thông báo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string, isRead: boolean) => {
    if (isRead) return;
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.notificationId === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadCount = notifications.filter(n => !n.isRead).length;
    if (unreadCount === 0) return;
    
    const toastId = toast.loading('Đang xử lý...');
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('Đã đánh dấu tất cả là đã đọc', { id: toastId });
    } catch (error) {
      toast.error('Có lỗi xảy ra', { id: toastId });
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'job':
        return <Briefcase className="w-5 h-5 text-blue-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      default:
        return <Info className="w-5 h-5 text-sky-500" />;
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Đang tải thông báo...</p>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900 pb-20">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <h1 className="text-lg font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                <div className="w-8 h-8 border border-slate-200 rounded-lg flex items-center justify-center text-blue-600 shadow-sm">
                  <BellRing className="w-4 h-4" />
                </div>
                Trung tâm việc làm
              </h1>
              <nav className="hidden md:flex items-center gap-5">
                <Link href="/profile" className="text-[13px] font-bold text-slate-400 hover:text-slate-700 transition-colors">Dashboard</Link>
                <div className="h-4 w-px bg-slate-200" />
                <span className="text-[13px] font-black text-blue-600">Thông báo</span>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 font-bold text-[13px] rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <MailOpen className="w-4 h-4" />
                  Đánh dấu đã đọc
                </button>
              )}
              <Link href="/profile" className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl font-bold text-[13px] hover:bg-blue-100 transition-all shadow-sm">
                Quay lại
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
             <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
               Thông báo của bạn
               {unreadCount > 0 && (
                 <span className="bg-red-500 text-white text-[11px] px-2 py-0.5 rounded-full font-bold">
                   {unreadCount} mới
                 </span>
               )}
             </h2>
             <p className="text-sm text-slate-500">Theo dõi các cập nhật mới nhất từ nhà tuyển dụng và hệ thống.</p>
          </div>
        </div>

        {/* List */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {notifications.length === 0 ? (
            <div className="p-16 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <BellRing className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Không có thông báo nào</h3>
              <p className="text-slate-500 text-sm mt-1 max-w-sm">
                Khi có nhà tuyển dụng xem hồ sơ hoặc gửi lời mời phỏng vấn, thông báo sẽ xuất hiện ở đây.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((notif) => (
                <div
                  key={notif.notificationId}
                  onClick={() => handleMarkAsRead(notif.notificationId, notif.isRead)}
                  className={`p-5 sm:p-6 flex gap-4 transition-colors cursor-pointer group ${
                    notif.isRead ? 'bg-white hover:bg-slate-50/50' : 'bg-blue-50/30 hover:bg-blue-50/50'
                  }`}
                >
                  <div className={`mt-1 shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${notif.isRead ? 'bg-slate-100' : 'bg-blue-100'}`}>
                    {getIconForType(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 mb-1">
                      <h4 className={`text-base font-bold ${notif.isRead ? 'text-slate-700' : 'text-slate-900'} pr-4`}>
                        {notif.title}
                      </h4>
                      <span className="text-[12px] font-medium text-slate-400 flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3" />
                        {new Date(notif.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className={`text-sm leading-relaxed ${notif.isRead ? 'text-slate-500' : 'text-slate-700 font-medium'}`}>
                      {notif.message}
                    </p>
                    {notif.link && (
                      <Link
                        href={notif.link}
                        className="inline-flex mt-3 text-[13px] font-bold text-blue-600 hover:text-blue-700 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Khám phá ngay &rarr;
                      </Link>
                    )}
                  </div>
                  {!notif.isRead && (
                    <div className="shrink-0 flex items-center justify-center w-4">
                      <div className="w-2.5 h-2.5 bg-blue-600 rounded-full shadow-sm shadow-blue-200"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
