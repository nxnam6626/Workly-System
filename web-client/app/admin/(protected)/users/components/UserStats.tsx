'use client';

import { Users, UserCheck, Briefcase, ShieldOff } from 'lucide-react';

interface StatItem {
  label: string;
  value: number;
  color: string;
  icon: React.ElementType;
}

interface UserStatsProps {
  total: number;
  candidates: number;
  recruiters: number;
  locked: number;
}

export default function UserStats({ total, candidates, recruiters, locked }: UserStatsProps) {
  const stats: StatItem[] = [
    { label: 'Tổng người dùng', value: total, color: 'bg-indigo-50 text-indigo-600', icon: Users },
    { label: 'Ứng viên', value: candidates, color: 'bg-sky-50 text-sky-600', icon: UserCheck },
    { label: 'Nhà tuyển dụng', value: recruiters, color: 'bg-violet-50 text-violet-600', icon: Briefcase },
    { label: 'Bị khóa', value: locked, color: 'bg-red-50 text-red-500', icon: ShieldOff },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(({ label, value, color, icon: Icon }) => (
        <div
          key={label}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4 flex items-center gap-4"
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-bold text-slate-900 leading-tight">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5 truncate">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
