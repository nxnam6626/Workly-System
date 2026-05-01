import { Loader2 } from 'lucide-react';

export default function RecruiterLoading() {
  return (
    <div className="flex-1 min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-100 rounded-full animate-pulse" />
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin" />
        </div>
        <p className="text-slate-500 font-bold tracking-widest uppercase text-xs animate-pulse">
          Đang tải dữ liệu...
        </p>
      </div>
    </div>
  );
}
