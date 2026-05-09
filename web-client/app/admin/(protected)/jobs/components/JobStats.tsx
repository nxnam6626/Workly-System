'use client';

import { LucideIcon } from 'lucide-react';

interface StatItem {
  label: string;
  value: number;
  color: string;
  icon: LucideIcon;
}

interface JobStatsProps {
  stats: StatItem[];
}

export default function JobStats({ stats }: JobStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl transition-all duration-300 flex items-center gap-4 group">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
            <stat.icon className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1 truncate">{stat.label}</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight leading-none truncate">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
