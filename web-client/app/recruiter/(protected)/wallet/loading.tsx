'use client';

export default function WalletLoading() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="space-y-2">
          <div className="h-10 w-48 bg-slate-200 rounded-xl"></div>
          <div className="h-4 w-64 bg-slate-100 rounded-lg"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="h-48 bg-slate-200 rounded-3xl"></div>
          <div className="h-64 bg-slate-200 rounded-3xl"></div>
        </div>
        <div className="lg:col-span-2 space-y-6">
          <div className="h-40 bg-slate-200 rounded-3xl"></div>
          <div className="h-[400px] bg-slate-200 rounded-3xl"></div>
        </div>
      </div>
    </div>
  );
}
