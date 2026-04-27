'use client';

import Link from 'next/link';

export function AuthActions() {
  return (
    <div className="flex items-center gap-1.5">
      <Link
        href="/login"
        className="px-4 py-2 hover:bg-slate-50 text-slate-700 font-bold ml-4"
      >
        Đăng nhập
      </Link>
      <div className="w-[1px] h-6 bg-slate-200 mx-2" />
      <Link
        href="/recruiter/login"
        className="px-5 py-2.5 bg-[#313131] hover:bg-black text-white font-bold text-xs rounded-md uppercase tracking-wider transition-all shadow-md flex items-center justify-center"
      >
        NHÀ TUYỂN DỤNG
      </Link>
    </div>
  );
}
