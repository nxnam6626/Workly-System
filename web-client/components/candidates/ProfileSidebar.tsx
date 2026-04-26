'use client';

import React from 'react';
import Link from 'next/link';
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
  Award
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { cn } from '@/lib/utils';

export const ProfileSidebar = React.memo(function ProfileSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  
  const displayName = user?.name || user?.candidate?.fullName || user?.email || 'Người dùng';
  const initial = displayName.charAt(0).toUpperCase();

  const menuItems = [
    { 
      icon: <User className="w-5 h-5" />, 
      label: "Thông tin cá nhân", 
      href: "/profile",
      isActive: pathname === "/profile"
    },
    { 
      icon: <ClipboardCheck className="w-5 h-5" />, 
      label: "Việc làm đã ứng tuyển", 
      href: "/profile/jobs/applied",
      isActive: pathname === "/profile/jobs/applied"
    },
    { 
      icon: <Heart className="w-5 h-5" />, 
      label: "Việc làm đã lưu", 
      href: "/profile/jobs/saved",
      isActive: pathname === "/profile/jobs/saved"
    },
    { 
      icon: <FileText className="w-5 h-5" />, 
      label: "Việc làm đã xem", 
      href: "/profile/jobs/viewed",
      isActive: pathname === "/profile/jobs/viewed"
    },
    { 
      icon: <Briefcase className="w-5 h-5" />, 
      label: "Việc làm phù hợp", 
      href: "/profile/jobs/matching",
      isActive: pathname === "/profile/jobs/matching",
      badge: "AI"
    },
    { 
      icon: <RefreshCcw className="w-5 h-5" />, 
      label: "NTD yêu cầu kết nối", 
      href: "/profile/messages",
      isActive: pathname === "/profile/messages"
    },
  ];

  return (
    <aside className="w-full space-y-6">
      {/* Profile Summary Card */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 pb-4 border-b border-slate-50 bg-gradient-to-br from-[#f8fafc] to-white">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-100 overflow-hidden shrink-0">
                {user?.avatar ? (
                  <img src={user.avatar} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  initial
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center shadow-sm">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              </div>
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-slate-900 truncate leading-tight">{displayName}</h3>
              <p className="text-xs text-slate-400 mt-1 font-medium truncate italic">{user?.email}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded-md uppercase tracking-wider">Cơ bản</span>
                <span className="w-1 h-1 bg-slate-200 rounded-full" />
                <span className="text-[10px] text-slate-400 font-bold">#102938</span>
              </div>
            </div>
          </div>
        </div>

        {/* Level Progress */}
        <div className="px-6 py-4 bg-[#fcfdfe]">
          <div className="flex items-center justify-between mb-2">
             <div className="flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[11px] font-bold text-slate-700">Độ tin cậy hồ sơ</span>
             </div>
             <span className="text-[11px] font-black text-blue-600">85%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
             <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 w-[85%] rounded-full shadow-[0_0_8px_rgba(59,130,246,0.3)]" />
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => (
            <Link 
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300",
                item.isActive 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-100 translate-x-1" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex items-center justify-center w-5 h-5 transition-transform duration-300 group-hover:scale-110",
                  item.isActive ? "text-white" : "text-slate-400 group-hover:text-blue-600"
                )}>
                  {item.icon}
                </div>
                <span className="text-[14px] font-bold tracking-tight">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {item.badge && (
                  <span className={cn(
                    "px-1.5 py-0.5 rounded-md text-[10px] font-black tracking-tighter",
                    item.isActive ? "bg-white/20 text-white" : "bg-blue-50 text-blue-600"
                  )}>
                    {item.badge}
                  </span>
                )}
                <ChevronRight className={cn(
                  "w-4 h-4 transition-transform duration-300",
                  item.isActive ? "text-white/70" : "text-slate-300 group-hover:translate-x-1"
                )} />
              </div>
            </Link>
          ))}

          <div className="mt-4 pt-4 border-t border-slate-50">
            <button 
              onClick={() => logout()}
              className="w-full group flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all duration-300"
            >
              <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
              <span className="text-[14px] font-bold tracking-tight">Đăng xuất</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Ad Banner Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[32px] p-6 text-white group shadow-xl shadow-blue-100">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl group-hover:scale-125 transition-transform duration-700" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-400/20 rounded-full -translate-x-1/2 translate-y-1/2 blur-2xl" />
        
        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center animate-bounce">
            <Sparkles className="w-6 h-6 text-blue-100" />
          </div>
          <div className="space-y-1">
            <h4 className="text-lg font-black leading-tight">Workly AI App</h4>
            <p className="text-[11px] text-blue-100 leading-relaxed font-medium">Bật thông báo để không bỏ lỡ <br/> việc làm phù hợp nhất!</p>
          </div>
          <button className="w-full py-3 bg-white text-blue-600 font-black rounded-xl text-xs hover:bg-blue-50 transition-all shadow-lg active:scale-95">
            Tải App ngay
          </button>
        </div>
      </div>
    </aside>
  );
});
