'use client';

import Link from 'next/link';

export function AuthActions() {
  return (
    <div className="flex items-center gap-3">
      <Link
        href="/register"
        className="hidden sm:flex px-4 py-2 rounded-lg text-sm font-medium text-blue-600 bg-white border border-blue-600 hover:bg-blue-50 transition-colors shadow-sm active:scale-95 duration-200"
      >
        Đăng ký
      </Link>
      <Link
        href="/login"
        className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-md active:scale-95 duration-200"
      >
        Đăng nhập
      </Link>
      <div className="hidden sm:block w-[1px] h-6 bg-slate-200 mx-1" />
      <Link
        href="/recruiter/login"
        className="hidden md:flex px-4 py-2 rounded-lg text-sm font-bold bg-slate-800 text-white hover:bg-slate-900 transition-all shadow-md items-center justify-center tracking-wide active:scale-95 duration-200"
      >
        NHÀ TUYỂN DỤNG
      </Link>
    </div>
  );
}
