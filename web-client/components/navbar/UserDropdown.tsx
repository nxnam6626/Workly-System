'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  User,
  Edit3,
  Download,
  ClipboardCheck,
  Heart,
  FileText,
  Briefcase,
  RefreshCcw,
  Eye,
  LogOut,
  Sparkles,
  Lock,
  Bell
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import Image from 'next/image';

export function UserDropdown() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isLookingForJob, setIsLookingForJob] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    router.push('/');
  };

  const displayName = user?.name || user?.candidate?.fullName || user?.email || 'Người dùng';
  const initial = displayName.charAt(0).toUpperCase();

  const isCandidate = user?.roles?.includes('CANDIDATE');
  const isRecruiter = user?.roles?.includes('RECRUITER');
  const isAdmin = user?.roles?.includes('ADMIN');

  const navItems = [];

  if (isCandidate) {
    navItems.push(
      { icon: <User className="w-5 h-5" />, label: "Quản lý hồ sơ", href: "/profile" },
      { icon: <Edit3 className="w-5 h-5" />, label: "Cập nhật hồ sơ", href: "/profile/edit" },
      { icon: <ClipboardCheck className="w-5 h-5" />, label: "Việc làm đã ứng tuyển", href: "/profile/jobs/applied" },
      { icon: <Heart className="w-5 h-5" />, label: "Việc làm đã lưu", href: "/profile/jobs/saved" },
      { icon: <FileText className="w-5 h-5" />, label: "Việc làm đã xem", href: "/profile/jobs/viewed" },
      { icon: <Briefcase className="w-5 h-5" />, label: "Việc làm phù hợp", href: "/profile/jobs/matching" },
      { icon: <RefreshCcw className="w-5 h-5" />, label: "Nhắn tin với nhà tuyển dụng", href: "/profile/connections" },
    );
  }

  if (isRecruiter) {
    navItems.push(
      { icon: <Sparkles className="w-5 h-5" />, label: "Trang quản lý Tuyển dụng", href: "/recruiter/dashboard" },
      { icon: <Briefcase className="w-5 h-5" />, label: "Đăng tin tuyển dụng", href: "/recruiter/jobs/create" },
    );
  }

  if (isAdmin) {
    navItems.push(
      { icon: <Sparkles className="w-5 h-5" />, label: "Trang Quản trị Hệ thống", href: "/admin/dashboard" },
    );
  }

  navItems.push(
    { icon: <Lock className="w-5 h-5" />, label: "Đổi mật khẩu", href: "/profile/change-password" },
    { icon: <Bell className="w-5 h-5" />, label: "Cài đặt thông báo email", href: "/profile/settings/notifications" },
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen((o) => !o)}
        className="flex items-center gap-2.5 hover:bg-slate-50 px-2 py-1.5 rounded-xl transition-all duration-200"
        aria-expanded={dropdownOpen}
      >
        <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-100 shadow-sm relative">
          {user?.avatar ? (
            <img src={user.avatar} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-[#1e60ad] text-white flex items-center justify-center text-[15px] font-bold">
              {initial}
            </div>
          )}
        </div>
        <div className="flex flex-col items-start text-left">
          <span className="text-[14px] font-bold text-slate-800 leading-tight">{displayName}</span>
          <span className={`text-[12px] font-medium ${isCandidate ? 'text-[#22c55e]' : 'text-indigo-500'}`}>
            {isCandidate ? 'Đang tìm việc' : (isAdmin ? 'Quản trị viên' : 'Nhà tuyển dụng')}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-3 w-[340px] bg-white rounded-[32px] shadow-2xl border border-slate-50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="px-5 pt-6 pb-4">
            {/* Toggle Section */}
            {isCandidate && (
              <div className="flex items-center justify-between mb-5 px-1">
                <span className="text-[15px] font-bold text-[#22c55e]">Đang tìm việc</span>
                <button
                  onClick={() => setIsLookingForJob(!isLookingForJob)}
                  className={`w-12 h-6 rounded-full transition-all duration-300 relative flex items-center ${isLookingForJob ? 'bg-[#22c55e]' : 'bg-slate-200'
                    }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute transition-all duration-300 shadow-sm ${isLookingForJob ? 'left-[25px]' : 'left-0.5'
                    }`} />
                </button>
              </div>
            )}

            {/* Nav List with Scrollbar */}
            <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
              {navItems.map((item, idx) => (
                <Link
                  key={idx}
                  href={item.href}
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-4 px-4 py-3 bg-[#f8fafc] hover:bg-[#f1f5f9] rounded-2xl text-slate-700 hover:text-mariner group transition-all"
                >
                  <div className="text-mariner opacity-70 group-hover:opacity-100 transition-opacity">
                    {item.icon}
                  </div>
                  <span className="text-[14.5px] font-bold">{item.label}</span>
                </Link>
              ))}
            </div>

            {/* Logout Button */}
            <div className="mt-4 pt-4 border-t border-slate-50 px-1">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-4 px-4 py-3 bg-[#fff5f5] hover:bg-[#ffebeb] rounded-2xl text-[#f04438] transition-all group"
              >
                <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                <span className="text-[14.5px] font-bold">Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f8fafc;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
