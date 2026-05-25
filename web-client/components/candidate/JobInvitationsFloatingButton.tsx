'use client';

import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { useSocketStore } from '@/stores/socket';
import { Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

export default function JobInvitationsFloatingButton() {
  const pathname = usePathname();
  const { user, isAuthenticated, isInitialized } = useAuthStore();
  const { socket, isConnected } = useSocketStore();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const fetchInvitations = async () => {
      if (!isAuthenticated || !user?.roles?.includes('CANDIDATE')) return;
      try {
        const res = await api.get('/candidates/me/invitations');
        const items = res.data?.items || res.data || [];
        const pending = items.filter((i: any) => i.status === 'PENDING');
        if (isMounted) {
          setPendingCount(pending.length);
        }
      } catch (err) {
        // ignore
      }
    };

    if (isInitialized) {
      fetchInvitations();
    }
    
    // Polling every 60s as backup
    const interval = setInterval(fetchInvitations, 60000);
    
    // Real-time updates via Socket.IO
    const handleSocketNotification = () => {
      // Whenever there's a notification, re-fetch invitations to ensure data is fresh
      fetchInvitations();
    };

    if (socket && isConnected) {
      socket.on('notification', handleSocketNotification);
    }

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (socket) {
        socket.off('notification', handleSocketNotification);
      }
    };
  }, [user, isAuthenticated, isInitialized, socket, isConnected]);

  // Ẩn trên các trang admin hoặc không phải candidate
  if (pathname?.startsWith('/admin')) return null;
  if (!isInitialized || !isAuthenticated || !user?.roles?.includes('CANDIDATE')) return null;

  return (
    <div className="fixed bottom-[104px] right-6 z-[9999] font-sans">
      <AnimatePresence>
        <Link href="/profile/jobs/invitations" className="block">
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.95 }}
            className="w-14 h-14 bg-gradient-to-br from-[#1e60ad] via-blue-600 to-indigo-600 text-white rounded-full shadow-[0_8px_30px_rgba(30,96,173,0.3)] shadow-[#1e60ad]/40 flex items-center justify-center relative group ring-4 ring-[#1e60ad]/20 backdrop-blur-md transition-all duration-300 hover:shadow-[#1e60ad]/60"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 to-[#1e60ad] opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />
            <Briefcase className="w-6 h-6 relative z-10 drop-shadow-md" />
            
            {pendingCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1.5 -right-1.5 min-w-[24px] h-[24px] px-1.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white text-[11px] font-bold rounded-full border-[3px] border-[#f8fafc] flex items-center justify-center z-20 shadow-lg"
              >
                {pendingCount > 99 ? '99+' : pendingCount}
              </motion.div>
            )}
          </motion.button>
        </Link>
      </AnimatePresence>
    </div>
  );
}
