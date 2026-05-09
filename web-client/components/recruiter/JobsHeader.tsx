import React from 'react';
import Link from 'next/link';
import { Briefcase, Sparkles } from 'lucide-react';

export const JobsHeader = () => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-2">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <span className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-100">
            <Briefcase className="h-6 w-6 text-white" />
          </span>
          Quản Lý Tuyển Dụng
        </h1>
        <p className="text-slate-500 mt-2 font-medium text-sm max-w-lg">
          Hệ thống quản lý chiến dịch tuyển dụng thông minh hỗ trợ bởi AI.
        </p>
      </div>
      <Link
        href="/recruiter/post-job"
        className="group flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-3.5 rounded-2xl font-black text-[14px] transition-all shadow-xl shadow-slate-900/20 hover:-translate-y-1 active:scale-95 uppercase tracking-widest relative overflow-hidden"
      >
        {/* Shine effect */}
        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" />
        
        <Sparkles className="w-5 h-5 text-indigo-300 group-hover:text-white transition-colors" />
        ĐĂNG TIN MỚI
      </Link>
    </div>
  );
};
