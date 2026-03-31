'use client';

import { useEffect } from 'react';
import { useSocketStore } from '@/stores/socket';
import { useAuthStore } from '@/stores/auth';
import toast, { Toast } from 'react-hot-toast';
import { Bell, Briefcase, FileText, CheckCircle, Info } from 'lucide-react';
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

    const handleAccountLocked = () => {
       toast.error('Tài khoản của bạn đã bị khoá bởi Quản trị viên. Hệ thống tự động đăng xuất.', { duration: 8000 });
       logout();
       router.push('/login');
    };

    socket.on('notification', handleNotification);
    socket.on('accountLocked', handleAccountLocked);

    return () => {
      socket.off('notification', handleNotification);
      socket.off('accountLocked', handleAccountLocked);
    };
  }, [socket, isConnected, logout, router]);

  return null;
}
