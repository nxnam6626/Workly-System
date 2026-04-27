import React from "react";

export function AppliedJobSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Company Logo Skeleton */}
        <div className="w-20 h-20 rounded-2xl bg-slate-100 animate-pulse shrink-0" />

        {/* Info Skeleton */}
        <div className="flex-1 space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-2 w-full max-w-[200px]">
              <div className="h-6 bg-slate-100 rounded-lg animate-pulse w-full" />
              <div className="h-4 bg-slate-50 rounded-md animate-pulse w-2/3" />
            </div>
            <div className="w-24 h-8 bg-slate-100 rounded-xl animate-pulse" />
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="w-28 h-6 bg-slate-50 rounded-lg animate-pulse" />
            <div className="w-24 h-6 bg-slate-50 rounded-lg animate-pulse" />
            <div className="w-32 h-6 bg-slate-50 rounded-lg animate-pulse" />
          </div>

          <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
            <div className="w-32 h-4 bg-slate-50 rounded animate-pulse" />
            <div className="flex gap-2">
              <div className="w-20 h-8 bg-slate-50 rounded-xl animate-pulse" />
              <div className="w-24 h-8 bg-slate-100 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppliedJobsPageSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <AppliedJobSkeleton key={i} />
      ))}
    </div>
  );
}
