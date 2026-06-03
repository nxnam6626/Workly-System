'use client';

import { Search, Filter, UserCheck, Briefcase, Shield, X } from 'lucide-react';
import type { AdminUserFilters, UserStatus } from '@/lib/admin-api';
import { motion } from 'framer-motion';

interface UserFiltersProps {
  filters: AdminUserFilters;
  setFilters: (f: AdminUserFilters) => void;
  hideRoleFilter?: boolean;
}

const ROLE_OPTIONS = [
  { value: '', label: 'Tất cả', icon: Filter },
  { value: 'CANDIDATE', label: 'Ứng viên', icon: UserCheck },
  { value: 'RECRUITER', label: 'Nhà tuyển dụng', icon: Briefcase },
  { value: 'ADMIN', label: 'Quản trị viên', icon: Shield },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'ACTIVE', label: 'Đang hoạt động' },
  { value: 'LOCKED', label: 'Đã bị khóa' },
];

export default function UserFilters({ filters, setFilters, hideRoleFilter = false }: UserFiltersProps) {
  const activeRole = filters.role || '';

  return (
    <div className="flex flex-col gap-4">
      {/* Role Quick Filters */}
      {!hideRoleFilter && (
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/50">
            {ROLE_OPTIONS.map((role) => (
              <button
                key={role.value}
                onClick={() => setFilters({ ...filters, role: role.value || undefined, skip: 0 })}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  activeRole === role.value
                    ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                }`}
              >
                <role.icon className={`w-3.5 h-3.5 ${activeRole === role.value ? 'text-indigo-500' : 'text-slate-400'}`} />
                {role.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 group">
          <div className="absolute inset-0 bg-indigo-500/5 rounded-2xl blur-xl group-focus-within:bg-indigo-500/10 transition-all" />
          <div className="relative flex items-center h-full">
            <Search className="absolute left-4 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Tìm kiếm người dùng theo tên, email hoặc ID..."
              value={filters.search ?? ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, skip: 0 })}
              className="w-full h-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-0 focus:border-indigo-500 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Status Dropdown */}
        <div className="relative group shrink-0">
          <select
            value={filters.status ?? ''}
            onChange={(e) =>
              setFilters({ ...filters, status: (e.target.value as UserStatus) || undefined, skip: 0 })
            }
            className="w-full h-full appearance-none pl-12 pr-10 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-0 focus:border-indigo-500 transition-all cursor-pointer min-w-[200px] shadow-sm"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}


