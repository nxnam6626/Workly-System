'use client';

import { useEffect } from 'react';
import { useSocketStore } from '@/stores/socket';
import { useAuthStore } from '@/stores/auth';
import toast, { Toast } from 'react-hot-toast';
import { Bell, Briefcase, FileText, CheckCircle, Info, X, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function NotificationListener() {
  const { socket, isConnected, connect, disconnect } = useSocketStore();
  const { isAuthenticated, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      connect();
    } else {
      disconnect();
    }
  }, [isAuthenticated, connect, disconnect]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNotification = (data: { title: string; message: string; type: string; link?: string }) => {
      const handleToastClick = (t: Toast) => {
         toast.dismiss(t.id);
         if (data.link) router.push(data.link);
      };

      const getIcon = () => {
         if (data.title.includes('mới cần duyệt')) return <Briefcase className="w-5 h-5 text-orange-600" />;
         if (data.type === 'success' || data.title.includes('duyệt')) return <CheckCircle className="w-5 h-5 text-emerald-600" />;
         if (data.title.includes('ứng viên') || data.title.includes('hồ sơ')) return <FileText className="w-5 h-5 text-blue-600" />;
         return <Info className="w-5 h-5 text-indigo-600" />;
      };

      const getBg = () => {
         if (data.title.includes('mới cần duyệt')) return 'bg-orange-100';
         if (data.type === 'success' || data.title.includes('duyệt')) return 'bg-emerald-100';
         if (data.title.includes('ứng viên') || data.title.includes('hồ sơ')) return 'bg-blue-100';
         if (data.type === 'error') return 'bg-red-100';
         return 'bg-indigo-100';
      };

      toast.custom(
        (t: Toast) => (
          <div 
            onClick={() => handleToastClick(t)}
            className={`flex gap-3 bg-white p-4 rounded-xl shadow-xl border border-slate-100 max-w-sm cursor-pointer hover:bg-slate-50 transition-colors ${t.visible ? 'animate-enter' : 'animate-leave'}`}
          >
             <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getBg()}`}>
                {getIcon()}
             </div>
             <div>
                <h4 className="font-bold text-slate-800 text-sm whitespace-pre-wrap">{data.title}</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-3">{data.message}</p>
             </div>
          </div>
        ),
        { duration: 5000, position: 'top-right' }
      );
    };

    const handleViolationWarn = (msg: string) => {
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? 'animate-in slide-in-from-top-2 fade-in duration-300' : 'animate-out slide-out-to-top-2 fade-out duration-300'
            } max-w-sm w-full bg-white shadow-xl shadow-red-900/5 rounded-2xl pointer-events-auto flex flex-col ring-1 ring-black/5 overflow-hidden border border-red-100 z-[999]`}
          >
            <div className="p-5 flex items-start gap-4">
              <div className="flex-shrink-0 p-2.5 bg-red-50 rounded-2xl border border-red-100/50">
                <EyeOff className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1 pt-1">
                <h3 className="text-[15px] font-bold text-slate-800">Cảnh cáo Hệ thống</h3>
                <p className="mt-1.5 text-[14px] text-slate-600 leading-relaxed font-medium">
                  {msg}
                </p>
              </div>
            </div>
            <div className="border-t border-slate-100/60 bg-slate-50/50 flex">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="w-full py-3 flex items-center justify-center text-sm font-bold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
              >
                Tôi đã hiểu
              </button>
            </div>
          </div>
        ),
        { duration: 6000 }
      );
    };

    const handleAccountLocked = (msg?: string) => {
      const displayMsg = msg || 'Tài khoản của bạn đã bị khoá bởi Quản trị viên do vi phạm điều khoản.';
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? 'animate-in zoom-in-95 fade-in duration-300' : 'animate-out zoom-out-95 fade-out duration-300'
            } max-w-md w-full bg-slate-900 shadow-2xl shadow-red-900/20 rounded-2xl pointer-events-auto flex flex-col ring-1 ring-white/10 overflow-hidden border border-red-900/30 z-[999]`}
          >
            <div className="p-6 flex items-start gap-4 bg-gradient-to-br from-red-900/20 to-slate-900">
              <div className="flex-shrink-0 p-3 bg-red-500/10 rounded-2xl ring-1 ring-red-500/20 shadow-inner">
                <X className="w-7 h-7 text-red-400" />
              </div>
              <div className="flex-1 pt-1">
                <h3 className="text-base font-bold text-red-400 tracking-wide uppercase text-sm">Lệnh khóa vĩnh viễn</h3>
                <p className="mt-2 text-[15px] text-slate-300 leading-relaxed">
                  {displayMsg}
                </p>
              </div>
            </div>
          </div>
        ),
        { duration: 8000 }
      );
      setTimeout(() => {
        logout();
        router.push('/login');
      }, 5000);
    };

    socket.on('notification', handleNotification);
    socket.on('accountLocked', handleAccountLocked);
    socket.on('violationWarn', handleViolationWarn);

    return () => {
      socket.off('notification', handleNotification);
      socket.off('accountLocked', handleAccountLocked);
      socket.off('violationWarn', handleViolationWarn);
    };
  }, [socket, isConnected, logout, router]);

  return null;
}
