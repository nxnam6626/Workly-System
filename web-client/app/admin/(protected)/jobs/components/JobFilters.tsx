'use client';

import { Search, ShieldCheck } from 'lucide-react';
import { JobStatus, PostType, AdminFilterJobPostingDto } from '@/lib/admin-jobs-service';
import { CrawlSource } from '@/lib/crawler-admin';

interface JobFiltersProps {
  filters: AdminFilterJobPostingDto;
  setFilters: (update: (prev: AdminFilterJobPostingDto) => AdminFilterJobPostingDto) => void;
  sources: CrawlSource[];
}

export default function JobFilters({ filters, setFilters, sources }: JobFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[240px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Tìm theo tiêu đề, công ty..."
          value={filters.searchTerm}
          onChange={(e) => setFilters((f) => ({ ...f, searchTerm: e.target.value }))}
          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        />
      </div>

      <select
        value={filters.status || ''}
        onChange={(e) => setFilters((f) => ({ ...f, status: (e.target.value as JobStatus) || undefined }))}
        className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-white"
      >
        <option value="">Tất cả trạng thái</option>
        <option value={JobStatus.PENDING}>Chờ duyệt</option>
        <option value={JobStatus.APPROVED}>Đã duyệt</option>
        <option value={JobStatus.REJECTED}>Đã từ chối</option>
      </select>

      <select
        value={filters.postType || ''}
        onChange={(e) => setFilters((f) => ({ ...f, postType: (e.target.value as PostType) || undefined }))}
        className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-white"
      >
        <option value="">Loại tin</option>
        <option value={PostType.MANUAL}>Thủ công</option>
        <option value={PostType.CRAWLED}>Crawler</option>
      </select>

      <select
        value={filters.crawlSourceId || ''}
        onChange={(e) => setFilters((f) => ({ ...f, crawlSourceId: e.target.value || undefined }))}
        className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-white max-w-[150px]"
      >
        <option value="">Nguồn cào</option>
        {sources.map((s, idx) => (
          <option key={s.crawlSourceId || idx} value={s.crawlSourceId}>
            {s.sourceName}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl">
        <ShieldCheck className="w-4 h-4 text-slate-400" />
        <span className="text-xs font-semibold text-slate-500">Min Score:</span>
        <input
          type="number"
          min="0"
          max="100"
          value={filters.minAiScore || ''}
          onChange={(e) => setFilters((f) => ({ ...f, minAiScore: e.target.value ? Number(e.target.value) : undefined }))}
          className="w-12 text-xs font-bold text-indigo-600 focus:outline-none placeholder:text-slate-300"
          placeholder="0"
        />
      </div>
    </div>
  );
}
