'use client';

import { Search, ShieldCheck } from 'lucide-react';
import { JobStatus, AdminFilterJobPostingDto } from '@/lib/admin-api';

interface JobFiltersProps {
  filters: AdminFilterJobPostingDto;
  setFilters: (update: (prev: AdminFilterJobPostingDto) => AdminFilterJobPostingDto) => void;
}

export default function JobFilters({ filters, setFilters }: JobFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[280px] max-w-sm group">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
        <input
          type="text"
          placeholder="Tìm theo tiêu đề, công ty..."
          value={filters.searchTerm}
          onChange={(e) => setFilters((f) => ({ ...f, searchTerm: e.target.value }))}
          className="w-full pl-10 pr-4 py-2.5 text-sm font-medium border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 hover:border-slate-300 transition-all placeholder:text-slate-400"
        />
      </div>

      {/* Status Filter */}
      <div className="relative group">
        <select
          value={filters.status || ''}
          onChange={(e) => setFilters((f) => ({ ...f, status: (e.target.value as JobStatus) || undefined }))}
          className="appearance-none pl-4 pr-10 py-2.5 text-sm font-semibold border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 hover:border-slate-300 transition-all bg-white text-slate-700 cursor-pointer min-w-[160px]"
        >
          <option value="">Tất cả trạng thái</option>
          <option value={JobStatus.PENDING}>Chờ duyệt</option>
          <option value={JobStatus.APPROVED}>Đã duyệt</option>
          <option value={JobStatus.REJECTED}>Đã từ chối</option>
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>

      {/* AI Score Slider */}
      <div className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:border-indigo-400 hover:shadow-md hover:shadow-indigo-500/5 transition-all duration-300 group">
        <div className={`p-1.5 rounded-lg transition-colors duration-300 ${filters.minAiScore ? 'bg-indigo-50' : 'bg-slate-50 group-hover:bg-indigo-50/50'}`}>
          <ShieldCheck className={`w-4 h-4 transition-colors duration-300 ${filters.minAiScore ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500'}`} />
        </div>
        <div className="flex flex-col min-w-[160px]">
          <div className="flex items-center justify-between mb-1.5 gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Tin cậy AI tối thiểu</span>
            <span className={`text-[11px] font-black whitespace-nowrap ${filters.minAiScore ? 'text-indigo-600' : 'text-slate-400'}`}>
              {filters.minAiScore ? `≥ ${filters.minAiScore}%` : 'Tất cả'}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="10"
            value={filters.minAiScore || 0}
            onChange={(e) => {
              const val = Number(e.target.value);
              setFilters((f) => ({ ...f, minAiScore: val === 0 ? undefined : val }));
            }}
            className="w-full h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>
      </div>
    </div>
  );
}
