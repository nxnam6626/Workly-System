'use client';

import { useEffect, useState } from 'react';
import { adminDashboardApi, type LatestViolation } from '@/lib/admin-api';
import { AlertTriangle, Clock, ShieldAlert, User, MoreVertical } from 'lucide-react';
import Link from 'next/link';

export default function ViolationsList() {
  const [violations, setViolations] = useState<LatestViolation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    adminDashboardApi.getLatestViolations(5)
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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <h3 className="font-bold text-slate-900">Vi Phạm Gần Đây</h3>
        </div>
        <Link 
          href="/admin/revenue" 
          className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
        >
          Xem tất cả
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto">
        {violations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400 italic text-sm">
            <ShieldAlert className="w-8 h-8 mb-2 opacity-20" />
            Chưa có vi phạm nào
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {violations.map((v) => (
              <div key={v.recruiterId} className="px-5 py-4 hover:bg-slate-50/80 transition-colors group">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold shrink-0 overflow-hidden border border-slate-200 shadow-sm">
                    {v.avatar ? (
                      <img src={v.avatar} alt={v.companyName} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-slate-900 truncate text-sm">{v.companyName}</p>
                      <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black ${v.violationCount >= 3 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                        <AlertTriangle className="w-3 h-3" />
                        {v.violationCount}/3
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mb-2">{v.email}</p>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Clock className="w-3 h-3" />
                        {formatTime(v.updatedAt)}
                      </div>
                      <span className={`text-[10px] font-bold ${v.status === 'LOCKED' ? 'text-red-600' : 'text-emerald-600'}`}>
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
