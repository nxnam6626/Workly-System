'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import { ProfileSidebar } from '@/components/candidates/ProfileSidebar';

const FONT = "'Inter', sans-serif";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfilePageShellProps {

  /** Nội dung h1 — có thể truyền JSX để dùng <em> màu accent */
  title: React.ReactNode;
  /** Dòng mô tả nhỏ bên dưới tiêu đề */
  subtitle?: string;
  /** Slot cho search bar, nút CTA, … ở góc phải header */
  action?: React.ReactNode;
  /** Filter chips hoặc bất kỳ row nào dưới header */
  filters?: React.ReactNode;
  /** Nội dung chính của trang */
  children: React.ReactNode;

  // Props cho trang /profile (open-to-work toggle)
  isOpenToWork?: boolean;
  onToggleOpenToWork?: () => void;
}

// ─── SearchBar helper (re-export để các trang dùng) ──────────────────────────

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  accentColor?: string; // focus ring color class, e.g. 'focus:border-blue-400'
}

export function ProfileSearchBar({
  value,
  onChange,
  placeholder = 'Tìm kiếm...',
  accentColor = 'focus:border-blue-400',
}: SearchBarProps) {
  return (
    <div className="relative flex-shrink-0">
      <Search className="w-4 h-4 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="text"
        placeholder={placeholder}
        className={`pl-11 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-sm w-64 md:w-72 ${accentColor} focus:outline-none transition-all shadow-sm placeholder-slate-300`}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

// ─── Main Shell ───────────────────────────────────────────────────────────────

export function ProfilePageShell({
  title,
  subtitle,
  action,
  filters,
  children,
}: ProfilePageShellProps) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          {/* Title group */}
          <div>
            <h1 className="text-4xl font-bold text-slate-900 leading-none">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-slate-400 mt-2 font-medium">
                {subtitle}
              </p>
            )}
          </div>

          {/* Action slot (search bar, CTA button, …) */}
          {action && (
            <div className="flex-shrink-0 flex items-start">
              {action}
            </div>
          )}
        </div>

        {/* Filter row */}
        {filters && (
          <div className="flex items-center gap-2 flex-wrap">
            {filters}
          </div>
        )}
      </div>

      {/* Page body */}
      {children}
    </div>
  );
}
