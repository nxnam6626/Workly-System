'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface JobPaginationProps {
  totalItems: number;
  jobsLength: number;
  page: number;
  setPage: (page: number | ((p: number) => number)) => void;
  totalPages: number;
  isLoading: boolean;
}

export default function JobPagination({
  totalItems,
  jobsLength,
  page,
  setPage,
  totalPages,
  isLoading,
}: JobPaginationProps) {
  return (
    <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
      <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
        Hiển thị <span className="text-slate-900 font-bold">{jobsLength}</span> trên <span className="text-slate-900 font-bold">{totalItems}</span> tin tuyển dụng
      </span>
      <div className="flex items-center gap-2">
        <button
          disabled={page === 1 || isLoading}
          onClick={() => setPage((p: number) => p - 1)}
          className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 transition-colors shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const p = i + 1;
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                  page === p ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-white'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>
        <button
          disabled={page === totalPages || isLoading}
          onClick={() => setPage((p: number) => p + 1)}
          className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 transition-colors shadow-sm"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
