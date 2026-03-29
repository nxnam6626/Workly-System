'use client';

import Link from 'next/link';
import { Heart, Bell } from 'lucide-react';

export function NavIcons() {
  return (
    <div className="flex items-center gap-3">
      {/* Favorites Icon */}
      <Link
        href="/saved-jobs"
        className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all shadow-sm hover:scale-110 active:scale-95 duration-200"
        title="Việc làm đã lưu"
      >
        <Heart className="w-5 h-5" />
      </Link>

      {/* Notifications Icon */}
      <Link
        href="/notifications"
        className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all shadow-sm relative hover:scale-110 active:scale-95 duration-200"
        title="Thông báo"
      >
        <Bell className="w-5 h-5" />
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
          16
        </span>
      </Link>
    </div>
  );
}
