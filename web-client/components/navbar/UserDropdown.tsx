'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Sparkles, User, LogOut, ChevronDown, Bell, Briefcase, UserCheck, MessageSquare, FileText } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';

export function UserDropdown() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [jobMenuOpen, setJobMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setJobMenuOpen(false);
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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen((o) => !o)}
        className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 hover:bg-slate-100 transition-all duration-200 active:scale-95 shadow-sm"
        aria-expanded={dropdownOpen}
      >
        <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold ring-2 ring-white shadow-sm overflow-hidden">
          {user?.avatar ? (
            <img src={user.avatar} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            initial
          )}
        </div>
        <span className="text-sm font-medium max-w-[120px] truncate hidden sm:block text-slate-700">{displayName}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 animate-in fade-in slide-in-from-top-2 z-50 overflow-hidden ring-1 ring-black/5">
          <div className="px-5 py-3.5 border-b border-slate-50 bg-slate-50/50">
            <p className="text-xs font-bold text-slate-800 truncate uppercase tracking-wider">{displayName}</p>
            <p className="text-xs text-slate-400 truncate mt-0.5">{user?.email}</p>
          </div>

          <div className="py-1">
            {/* Hồ sơ của tôi */}
            <Link
              href="/profile"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-3.5 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200"
            >
              <User className="w-5 h-5 text-blue-500" />
              Hồ sơ của tôi
            </Link>

            {/* Tạo CV */}
            <Link
              href="/cv-builder"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-3.5 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200"
            >
              <Sparkles className="w-5 h-5 text-blue-500" />
              Tạo CV
            </Link>

            {/* Quản lý CV */}
            <Link
              href="/profile/cv-management"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-3.5 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200"
            >
              <FileText className="w-5 h-5 text-blue-500" />
              Quản lý CV
            </Link>

            {/* Tin nhắn */}
            <Link
              href="/profile/messages"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-3.5 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200"
            >
              <MessageSquare className="w-5 h-5 text-blue-500" />
              Tin nhắn
            </Link>

            {/* Quản lý việc làm - Collapsible */}
            <div className="relative">
              <button
                onClick={() => setJobMenuOpen((o) => !o)}
                className={`w-full flex items-center justify-between px-5 py-3 text-sm font-medium transition-all duration-200 ${jobMenuOpen ? 'text-blue-700 bg-blue-50/50' : 'text-slate-700 hover:bg-blue-50 hover:text-blue-700'
                  }`}
              >
                <div className="flex items-center gap-3.5">
                  <Briefcase className="w-5 h-5 text-blue-500" />
                  <span>Quản lý việc làm</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${jobMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {jobMenuOpen && (
                <div className="bg-slate-50/30 animate-in slide-in-from-top-1 duration-300 pb-1">
                  <Link
                    href="/applied-jobs"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-12 py-2.5 text-sm text-slate-600 hover:text-blue-600 transition-colors duration-200"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mr-2" />
                    Việc làm đã ứng tuyển
                  </Link>
                  <Link
                    href="/saved-jobs"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-12 py-2.5 text-sm text-slate-600 hover:text-blue-600 transition-colors duration-200"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mr-2" />
                    Việc làm đã lưu
                  </Link>
                  <Link
                    href="/jobs"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-12 py-2.5 text-sm text-slate-600 hover:text-blue-600 transition-colors duration-200"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mr-2" />
                    Việc làm chờ ứng tuyển
                  </Link>

                </div>
              )}
            </div>

            {/* Hỗ trợ và thông báo */}
            <Link
              href="/notifications"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-3.5 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200"
            >
              <Bell className="w-5 h-5 text-blue-500" />
              Hỗ trợ và thông báo
            </Link>

            {/* Quản lý tài khoản */}
            <div className="group/item relative">
              <Link
                href="/profile/account"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center justify-between px-5 py-3 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200"
              >
                <div className="flex items-center gap-3.5">
                  <UserCheck className="w-5 h-5 text-blue-500" />
                  <span>Quản lý tài khoản</span>
                </div>
                {!user?.isEmailVerified && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Email chưa xác minh" />
                )}
              </Link>

              {!user?.isEmailVerified && (
                <Link
                  href={`/verify-email?email=${user?.email}`}
                  onClick={() => setDropdownOpen(false)}
                  className="absolute right-10 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-rose-50 text-[10px] font-bold text-rose-600 rounded border border-rose-100 opacity-0 group-hover/item:opacity-100 transition-opacity whitespace-nowrap"
                >
                  Xác minh ngay
                </Link>
              )}
            </div>
          </div>

          <div className="mt-1 border-t border-slate-50 pt-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3.5 px-5 py-3 text-sm font-medium text-rose-500 hover:bg-rose-50 transition-colors duration-200"
            >
              <LogOut className="w-5 h-5" />
              Đăng xuất
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
