'use client';

import Link from "next/link";
import { Sparkles, User, LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/auth";

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();

  return (
    <nav className="flex items-center justify-between px-6 py-4 md:px-12 bg-white/70 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100">
      <div className="flex items-center gap-2 cursor-pointer">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
          <Sparkles className="w-5 h-5" />
        </div>
        <span className="text-xl font-bold tracking-tight">Workly</span>
      </div>

      <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-600">
        <Link href="#" className="hover:text-slate-900 transition-colors">Tìm kiếm thực tập</Link>
        <Link href="#" className="hover:text-slate-900 transition-colors">Đánh giá CV AI</Link>
        <Link href="#" className="hover:text-slate-900 transition-colors">Tài nguyên</Link>
        <Link href="#" className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-full hover:bg-orange-100 transition-colors">
          <Sparkles className="w-3.5 h-3.5" />
          Tìm kiếm AI
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
              <User className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium">{user?.name || user?.email || "Người dùng"}</span>
            </div>
            <button
              onClick={() => logout()}
              className="flex items-center gap-2 text-slate-600 hover:text-red-600 font-medium transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              Đăng xuất
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/register"
              className="hidden sm:flex px-4 py-2 rounded-lg text-sm font-medium text-blue-600 bg-white border border-blue-600 hover:bg-blue-50 transition-colors"
            >
              Đăng ký
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
            >
              Đăng nhập
            </Link>
            
            <div className="hidden sm:block w-[1px] h-6 bg-slate-300 mx-1"></div>
            
            <Link
              href="/recruiter"
              className="hidden md:flex px-4 py-2 rounded-lg text-sm font-bold bg-slate-800 text-white hover:bg-slate-900 transition-colors shadow-sm items-center justify-center tracking-wide"
            >
              NHÀ TUYỂN DỤNG
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
