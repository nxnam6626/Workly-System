'use client';

import { Shield, Loader2 } from 'lucide-react';

export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-slate-200 rounded-xl animate-pulse" />
          <div className="h-4 w-96 bg-slate-100 rounded-lg animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-slate-200 rounded-xl animate-pulse" />
      </div>

      {/* Stats Skeleton (Optional - if shared by pages) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 bg-slate-100 rounded-xl animate-pulse" />
              <div className="w-12 h-6 bg-slate-50 rounded-lg animate-pulse" />
            </div>
            <div className="h-6 w-20 bg-slate-200 rounded-lg animate-pulse" />
          </div>
        ))}
      </div>

      {/* Table Card Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        {/* Filter Bar Skeleton */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/30">
          <div className="h-10 w-full max-w-sm bg-white border border-slate-200 rounded-xl animate-pulse" />
        </div>

        {/* Table Rows Skeleton */}
        <div className="flex-1 p-6 space-y-4">
          <div className="h-10 w-full bg-slate-50 rounded-lg animate-pulse mb-6" />
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center gap-4 py-2">
              <div className="w-10 h-10 bg-slate-100 rounded-lg animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/4 bg-slate-200 rounded animate-pulse" />
                <div className="h-3 w-1/3 bg-slate-100 rounded animate-pulse" />
              </div>
              <div className="w-24 h-4 bg-slate-100 rounded animate-pulse" />
              <div className="w-16 h-4 bg-slate-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
