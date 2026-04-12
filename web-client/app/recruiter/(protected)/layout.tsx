'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/auth';
import api from '@/lib/api';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  LogOut,
  Sparkles,
  LayoutDashboard,
  Briefcase,
  PlusCircle,
  Building,
  Users,
  MessageSquare,
  FileText,
  Wallet,
  Heart
} from 'lucide-react';
import { NotificationMenu } from '@/components/NotificationMenu';
import { useMessageStore } from '@/stores/message';
import { useSocketStore } from '@/stores/socket';
import toast from 'react-hot-toast';

const navItems = [
  { label: 'Bảng Điều Khiển', href: '/recruiter/dashboard', icon: LayoutDashboard },
  { label: 'Công Ty', href: '/recruiter/company', icon: Building },
  { label: 'Tin Tuyển Dụng', href: '/recruiter/jobs', icon: Briefcase },
  { label: 'Yêu Cầu Tuyển Dụng', href: '/recruiter/post-job', icon: PlusCircle },
  { label: 'Ví Nội Bộ', href: '/recruiter/wallet', icon: Wallet },
  { label: 'Đơn Ứng Tuyển', href: '/recruiter/applications', icon: FileText },
  { label: 'Tìm Ứng Viên', href: '/recruiter/candidates', icon: Users },
  { label: 'Yêu Thích', href: '/recruiter/candidates/saved', icon: Heart },
  { label: 'Nhắn Tin', href: '/recruiter/messages', icon: MessageSquare },
];

interface Wallet {
  balance: number;
}

export default function RecruiterLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, logout, user } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const { socket } = useSocketStore();
  const { unreadCount, fetchUnreadCount, incrementUnread } = useMessageStore();

  useEffect(() => {
    if (isAuthenticated && user?.roles?.includes('RECRUITER')) {
      const fetchWallet = async () => {
        try {
          const response = await api.get('/recruiters/wallet');
          setWallet(response.data);
        } catch (error) {
          console.error('Error fetching wallet:', error);
        }
      };
      fetchWallet();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        // Include callbackUrl so after login they return to the page they were on
        const callbackUrl = encodeURIComponent(pathname);
        router.push(`/recruiter/login?callbackUrl=${callbackUrl}`);
      } else if (!user?.roles?.includes('RECRUITER')) {
        // Wrong role: send back to recruiter login, NOT to getDashboardByRole
        // (getDashboardByRole defaults to "/" for undefined/unknown roles which
        //  causes the recruiter to be thrown into the candidate homepage)
        router.push('/recruiter/login');
      } else if (pathname === '/recruiter') {
        router.push('/recruiter/dashboard');
      }

      if (isAuthenticated && user?.roles?.includes('RECRUITER')) {
         fetchUnreadCount();
      }
    }
  }, [isAuthenticated, isLoading, user, router, pathname, fetchUnreadCount]);

  useEffect(() => {
    if (!socket || !user) return;
    const handleNewMessage = (msg: any) => {
      if (msg.senderId === user.userId) return;
      
      if (!pathname.startsWith('/recruiter/messages')) {
        incrementUnread();
        toast.custom((t) => (
          <div onClick={() => { toast.dismiss(t.id); router.push('/recruiter/messages'); }} className="cursor-pointer bg-white border border-slate-100 rounded-xl shadow-lg p-4 flex gap-3 items-center hover:bg-slate-50 transition-colors w-80 animate-in slide-in-from-right-2">
             <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5" />
             </div>
             <div>
                <p className="font-bold text-slate-800 text-sm">Tin nhắn mới</p>
                <p className="text-xs text-slate-500 line-clamp-1">{msg.content || 'Bạn có thông báo tin nhắn mới'}</p>
             </div>
          </div>
        ), { duration: 4000, position: 'bottom-right' });
      } else {
        setTimeout(() => fetchUnreadCount(), 1000);
      }
    };
    socket.on('newMessage', handleNewMessage);
    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, [socket, user, pathname, router, incrementUnread]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user?.roles?.includes('RECRUITER')) return null;

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="relative flex flex-col bg-slate-900 text-white overflow-hidden shrink-0"
        style={{ minHeight: '100vh' }}
      >
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="text-lg font-bold tracking-tight whitespace-nowrap"
              >
                Workly Recruiter
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || (pathname.startsWith(href + '/') && (href !== '/recruiter/candidates' || !pathname.startsWith('/recruiter/candidates/saved')));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group ${
                  active
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <Icon className="w-5 h-5 shrink-0" />
                  {label === 'Nhắn Tin' && unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-slate-900 shadow-sm leading-none">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.15 }}
                      className="text-sm font-medium whitespace-nowrap"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 px-2 py-3 space-y-1">
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-all"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm font-medium whitespace-nowrap"
                >
                  Đăng xuất
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        <button
          onClick={() => setCollapsed((c) => !c)}
          className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-300 hover:bg-indigo-600 hover:text-white transition-colors z-10 shadow-md"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <LayoutDashboard className="w-4 h-4" />
            <span>Recruiter Dashboard</span>
          </div>

          {user && (
            <div className="flex items-center gap-6">
              {wallet && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-amber-700 shadow-sm">
                  <div className="w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center text-[10px] text-white font-black">
                    $
                  </div>
                  <span className="text-sm font-bold">{wallet.balance} Credits</span>
                  <button className="ml-1 text-[10px] bg-white px-2 py-0.5 rounded-full border border-amber-300 hover:bg-amber-100 transition-colors uppercase font-black">
                    Nạp
                  </button>
                </div>
              )}
              <NotificationMenu />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm">
                  {(user.name || user.email).charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-slate-700 font-medium hidden sm:block">
                  {user.name || user.email}
                </span>
              </div>
            </div>
          )}
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
