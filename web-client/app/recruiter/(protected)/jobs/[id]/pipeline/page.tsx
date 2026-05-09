'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, Search, LayoutGrid, CalendarDays } from 'lucide-react';
import useSWR from 'swr';
import api from '@/lib/api';
import KanbanBoard from '@/components/recruiter/pipeline/KanbanBoard';
import SessionListView from '@/components/recruiter/pipeline/SessionListView';
import { useState } from 'react';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default function PipelinePage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const [viewMode, setViewMode] = useState<'kanban' | 'session'>('kanban');
  const [search, setSearch] = useState('');

  const { data: applications, mutate, isLoading } = useSWR(`/applications/kanban/${jobId}`, fetcher);
  const { data: job } = useSWR(`/job-postings/${jobId}`, fetcher);

  const handleExportCSV = () => {
    if (!applications) return;
    const headers = ['Tên ứng viên', 'Email', 'SĐT', 'Trạng thái', 'Ngày nộp'];
    const rows = applications.map((app: any) => [
      app.candidate?.fullName || '',
      app.candidate?.user?.email || '',
      app.candidate?.user?.phoneNumber || '',
      app.appStatus,
      new Date(app.applyDate).toLocaleDateString(),
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      headers.join(',') +
      '\n' +
      rows.map((e: any[]) => e.map((item) => `"${item}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `pipeline_${jobId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between shadow-sm z-10 gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight truncate">
              {job?.title || 'Đang tải...'}
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-0.5">Quản lý ứng viên</p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* View Mode Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white text-sky-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <LayoutGrid size={15} />
              Kanban
            </button>
            <button
              onClick={() => setViewMode('session')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                viewMode === 'session'
                  ? 'bg-white text-sky-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <CalendarDays size={15} />
              Theo buổi
            </button>
          </div>

          {viewMode === 'kanban' && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Tìm ứng viên..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-sky-500 w-56 transition-all"
              />
            </div>
          )}

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 text-sm font-semibold shadow-sm transition-all active:scale-95"
          >
            <Download size={16} />
            CSV
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : viewMode === 'kanban' ? (
          <KanbanBoard applications={applications || []} mutate={mutate} jobId={jobId} />
        ) : (
          <div className="h-full overflow-y-auto">
            <SessionListView jobId={jobId} />
          </div>
        )}
      </div>
    </div>
  );
}
