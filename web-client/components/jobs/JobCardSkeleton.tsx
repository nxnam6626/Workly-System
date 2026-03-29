"use client";

export function JobCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-14 h-14 bg-gray-200 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded-full w-3/4" />
          <div className="h-3 bg-gray-200 rounded-full w-1/2" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="h-3 bg-gray-100 rounded-full" />
          <div className="h-3 bg-gray-100 rounded-full" />
        </div>
        <div className="h-8 bg-gray-50 rounded-lg w-full mt-4" />
      </div>
    </div>
  );
}
