'use client';

import { Search } from 'lucide-react';
import type { AdminUserFilters, UserStatus } from '@/lib/admin-api';

interface UserFiltersProps {
  filters: AdminUserFilters;
  setFilters: (f: AdminUserFilters) => void;
}

const ROLE_OPTIONS = [
  { value: '', label: 'Tất cả vai trò' },
  { value: 'CANDIDATE', label: 'Ứng viên' },
  { value: 'RECRUITER', label: 'Nhà tuyển dụng' },
  { value: 'ADMIN', label: 'Admin' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'ACTIVE', label: 'Hoạt động' },
  { value: 'LOCKED', label: 'Bị khóa' },
];

export default function UserFilters({ filters, setFilters }: UserFiltersProps) {
  const selectClass =
    'px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 cursor-pointer';

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Tìm theo email..."
          value={filters.search ?? ''}
          onChange={(e) => setFilters({ ...filters, search: e.target.value, skip: 0 })}
          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
        />
      </div>

      {/* Role */}
      <select
        value={filters.role ?? ''}
        onChange={(e) => setFilters({ ...filters, role: e.target.value || undefined, skip: 0 })}
        className={selectClass}
      >
        {ROLE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* Status */}
      <select
        value={filters.status ?? ''}
        onChange={(e) =>
          setFilters({ ...filters, status: (e.target.value as UserStatus) || undefined, skip: 0 })
        }
        className={selectClass}
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
