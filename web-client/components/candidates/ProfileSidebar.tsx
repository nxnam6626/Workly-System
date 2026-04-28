'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  User,
  ClipboardCheck,
  Heart,
  FileText,
  Briefcase,
  RefreshCcw,
  Eye,
  LogOut,
  ChevronRight,
  Sparkles,
  Camera,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export const ProfileSidebar = React.memo(function ProfileSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const displayName = user?.name || user?.candidate?.fullName || user?.email || 'Người dùng';
  const jobTitle = (user as any)?.candidate?.major || 'Ứng viên';
  const initial = displayName.charAt(0).toUpperCase();

  const menuItems = [
    {
      icon: User,
      label: 'Thông tin cá nhân',
      href: '/profile',
      isActive: pathname === '/profile',
      accent: 'text-blue-600 bg-blue-50',
    },
    {
      icon: ClipboardCheck,
      label: 'Việc làm ứng tuyển',
      href: '/profile/jobs/applied',
      isActive: pathname === '/profile/jobs/applied',
      accent: 'text-amber-600 bg-amber-50',
    },
    {
      icon: Heart,
      label: 'Việc làm đã lưu',
      href: '/profile/jobs/saved',
      isActive: pathname === '/profile/jobs/saved',
      accent: 'text-rose-500 bg-rose-50',
    },
    {
      icon: Eye,
      label: 'Việc làm đã xem',
      href: '/profile/jobs/viewed',
      isActive: pathname === '/profile/jobs/viewed',
      accent: 'text-slate-500 bg-slate-50',
    },
    {
      icon: Sparkles,
      label: 'Việc làm phù hợp',
      href: '/profile/jobs/matching',
      isActive: pathname === '/profile/jobs/matching',
      badge: 'AI',
      accent: 'text-indigo-600 bg-indigo-50',
    },
    {
      icon: RefreshCcw,
      label: 'NTD yêu cầu kết nối',
      href: '/profile/messages',
      isActive: pathname === '/profile/messages',
      accent: 'text-emerald-600 bg-emerald-50',
    },
  ];

  return (
    <aside className="w-full space-y-4">
      {/* Profile Card — nhất quán với trang /profile */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-5 flex flex-col items-center text-center overflow-hidden relative">
        {/* Ambient top gradient */}
        <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-[0.04]" />

        {/* Avatar */}
        <div className="relative w-20 h-20 mb-3 mt-1">
          <div className="w-full h-full rounded-2xl bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center border border-slate-100 overflow-hidden">
            {user?.avatar ? (
              <Image
                src={user.avatar}
                alt={displayName}
                fill
                className="object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-slate-400">{initial}</span>
            )}
          </div>
          {/* Online indicator */}
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-white rounded-full" />
          </div>
        </div>

        <h3 className="font-bold text-slate-900 text-base leading-tight truncate w-full px-2">{displayName}</h3>
        <p className="text-blue-600 text-xs font-semibold mt-1 px-3 py-0.5 bg-blue-50 rounded-full truncate max-w-full">{jobTitle}</p>

        {/* Link về profile chính */}
        <Link href="/profile"
          className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-bold text-slate-500 border border-slate-100 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-100 transition-all">
          <User className="w-3.5 h-3.5" />
          Xem hồ sơ đầy đủ
        </Link>
      </div>

      {/* Navigation Menu */}
      <nav className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-3 space-y-1">
        {menuItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div key={item.href}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.22 }}>
              <Link
                href={item.href}
                className={cn(
                  'group flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-200',
                  item.isActive
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn(
                    'flex-shrink-0 w-7 h-7 rounded-xl flex items-center justify-center transition-all',
                    item.isActive ? 'bg-white/10' : item.accent
                  )}>
                    <Icon className={cn('w-4 h-4', item.isActive ? 'text-white' : '')} />
                  </div>
                  <span className="text-[13px] font-semibold truncate">{item.label}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {item.badge && (
                    <span className={cn(
                      'px-1.5 py-0.5 rounded-md text-[9px] font-black tracking-wide',
                      item.isActive ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'
                    )}>
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight className={cn(
                    'w-3.5 h-3.5 transition-transform duration-200',
                    item.isActive ? 'text-white/60 translate-x-0.5' : 'text-slate-300 group-hover:translate-x-0.5'
                  )} />
                </div>
              </Link>
            </motion.div>
          );
        })}

        <div className="pt-2 mt-2 border-t border-slate-50">
          <button
            onClick={() => logout()}
            className="w-full group flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all duration-200"
          >
            <div className="w-7 h-7 rounded-xl bg-slate-50 group-hover:bg-red-50 flex items-center justify-center flex-shrink-0">
              <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            </div>
            <span className="text-[13px] font-semibold">Đăng xuất</span>
          </button>
        </div>
      </nav>

      {/* Promo card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-5 text-white shadow-xl shadow-slate-900/10">
        <div className="absolute top-0 right-0 w-28 h-28 bg-blue-500/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-indigo-500/10 rounded-full -translate-x-1/2 translate-y-1/2 blur-2xl" />
        <div className="relative z-10 text-center space-y-3">
          <div className="w-10 h-10 mx-auto bg-white/10 rounded-2xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-blue-300" />
          </div>
          <div>
            <h4 className="font-bold text-sm leading-tight">Workly AI</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
              Bật thông báo để không bỏ lỡ việc làm phù hợp nhất với bạn!
            </p>
          </div>
          <button className="w-full py-2 bg-white text-slate-900 font-bold rounded-xl text-[11px] hover:bg-blue-50 transition-all">
            Tải App ngay
          </button>
        </div>
      </div>
    </aside>
  );
});
