'use client';

import { Users, UserCheck, Briefcase, ShieldOff, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface UserStatsProps {
  total: number;
  candidates: number;
  recruiters: number;
  locked: number;
}

export default function UserStats({ total, candidates, recruiters, locked }: UserStatsProps) {
  const stats = [
    { 
      label: 'Tổng người dùng', 
      value: total, 
      color: 'from-indigo-500 to-blue-600', 
      lightColor: 'bg-indigo-50', 
      textColor: 'text-indigo-600',
      icon: Users,
      trend: '+12%'
    },
    { 
      label: 'Ứng viên', 
      value: candidates, 
      color: 'from-emerald-500 to-teal-600', 
      lightColor: 'bg-emerald-50', 
      textColor: 'text-emerald-600',
      icon: UserCheck,
      trend: '+5%'
    },
    { 
      label: 'Nhà tuyển dụng', 
      value: recruiters, 
      color: 'from-violet-500 to-purple-600', 
      lightColor: 'bg-violet-50', 
      textColor: 'text-violet-600',
      icon: Briefcase,
      trend: '+8%'
    },
    { 
      label: 'Tài khoản bị khóa', 
      value: locked, 
      color: 'from-rose-500 to-red-600', 
      lightColor: 'bg-rose-50', 
      textColor: 'text-rose-600',
      icon: ShieldOff,
      trend: '-2%'
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
          className="relative group bg-white rounded-[2rem] border border-slate-100 p-6 shadow-xl shadow-slate-100/50 overflow-hidden"
        >
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${stat.lightColor} ${stat.textColor} shadow-inner`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-slate-50 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                {stat.trend}
              </div>
            </div>
            
            <div>
              <div className="flex items-baseline gap-1">
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">
                  {new Intl.NumberFormat().format(stat.value)}
                </h3>
              </div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">{stat.label}</p>
            </div>
          </div>

          {/* Decorative background element */}
          <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-[0.03] rounded-full blur-2xl group-hover:opacity-[0.08] transition-opacity`} />
        </motion.div>
      ))}
    </div>
  );
}

