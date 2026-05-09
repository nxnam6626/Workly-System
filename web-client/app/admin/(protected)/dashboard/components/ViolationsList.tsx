'use client';

import { useEffect, useState } from 'react';
import { adminDashboardApi, type LatestViolation } from '@/lib/admin-api';
import { AlertTriangle, Clock, ShieldAlert, User, MoreVertical } from 'lucide-react';
import Link from 'next/link';

export default function ViolationsList() {
  const [violations, setViolations] = useState<LatestViolation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    adminDashboardApi.getLatestViolations()
      .then(setViolations)
      .catch((err) => console.error('Failed to fetch latest violations:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const formatTime = (d: string) => {
    const date = new Date(d);
    return date.toLocaleString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };


  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center border border-rose-100 shadow-sm shadow-rose-100/50">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <h3 className="font-black text-slate-900 tracking-tight text-sm">Vi Phạm Gần Đây</h3>
            <p className="text-[10px] font-medium text-slate-500 mt-0.5">Nhà tuyển dụng rủi ro</p>
          </div>
        </div>
        <Link 
          href="/admin/revenue" 
          className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 hover:underline px-3 py-1.5 bg-indigo-50 rounded-lg transition-colors"
        >
          Tất cả
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto">
        {violations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 italic text-sm h-full min-h-[200px]">
            <ShieldAlert className="w-8 h-8 mb-3 opacity-20" />
            <span className="font-bold">Hệ thống an toàn</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-50/80">
            {violations.map((v) => (
              <div key={v.recruiterId} className="px-5 py-4 hover:bg-slate-50 transition-colors group">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold shrink-0 overflow-hidden border border-slate-200 shadow-sm group-hover:scale-105 transition-transform">
                    {v.avatar ? (
                      <img src={v.avatar} alt={v.companyName} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-black text-slate-900 truncate text-[13px] tracking-tight">{v.companyName}</p>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black border shadow-sm ${v.violationCount >= 3 ? 'bg-rose-50 text-rose-700 border-rose-200/60' : 'bg-amber-50 text-amber-700 border-amber-200/60'}`}>
                        <AlertTriangle className="w-3 h-3" />
                        {v.violationCount}/3
                      </span>
                    </div>
                    <p className="text-[12px] font-medium text-slate-500 truncate mb-2">{v.email}</p>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <Clock className="w-3 h-3" />
                        {formatTime(v.updatedAt)}
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${v.status === 'LOCKED' ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {v.status === 'LOCKED' ? '• Đã khóa' : '• Hoạt động'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
