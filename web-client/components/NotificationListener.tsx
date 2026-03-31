'use client';

import { useEffect } from 'react';
import { useSocketStore } from '@/stores/socket';
import { useAuthStore } from '@/stores/auth';
import toast, { Toast } from 'react-hot-toast';
import { Bell, Briefcase, FileText, CheckCircle } from 'lucide-react';

export function NotificationListener() {
  const { socket, isConnected, connect, disconnect } = useSocketStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      connect();
    } else {
      disconnect();
    }
  }, [isAuthenticated, connect, disconnect]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNotification = (data: { title: string; message: string; type: string }) => {
      // Different toast styles based on notification title/type
      if (data.title.includes('ứng viên')) {
        toast.custom(
          (t: Toast) => (
            <div className={`flex gap-3 bg-white p-4 rounded-lg shadow-lg border border-gray-100 max-w-sm ${t.visible ? 'animate-enter' : 'animate-leave'}`}>
               <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-blue-600" />
               </div>
               <div>
                  <h4 className="font-bold text-slate-800 text-sm">{data.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{data.message}</p>
               </div>
            </div>
          ),
          { duration: 5000, position: 'top-right' }
        );
      } else if (data.title.includes('duyệt')) {
        toast.custom(
          (t: Toast) => (
            <div className={`flex gap-3 bg-white p-4 rounded-lg shadow-lg border border-gray-100 max-w-sm ${t.visible ? 'animate-enter' : 'animate-leave'}`}>
               <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
               </div>
               <div>
                  <h4 className="font-bold text-slate-800 text-sm">{data.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{data.message}</p>
               </div>
            </div>
          ),
          { duration: 5000, position: 'top-right' }
        );
      } else {
        toast.success(`${data.title}: ${data.message}`, { duration: 5000, position: 'top-right' });
      }
    };

    socket.on('notification', handleNotification);

    return () => {
      socket.off('notification', handleNotification);
    };
  }, [socket, isConnected]);

  return null;
}
