'use client';

import { Loader2, Briefcase } from 'lucide-react';
import { JobPosting, JobStatus } from '@/lib/admin-api';
import JobTableRow from './JobTableRow';
import JobPagination from './JobPagination';

interface JobTableProps {
  jobs: JobPosting[];
  selectedIds: string[];
  toggleSelect: (id: string) => void;
  toggleSelectAll: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onQuickView: (job: JobPosting) => void;
  isProcessing: string | null;
  isLoading: boolean;
  totalItems: number;
  page: number;
  setPage: (page: number | ((p: number) => number)) => void;
  totalPages: number;
}

export default function JobTable({
  jobs,
  selectedIds,
  toggleSelect,
  toggleSelectAll,
  onApprove,
  onReject,
  onQuickView,
  isProcessing,
  isLoading,
  totalItems,
  page,
  setPage,
  totalPages,
}: JobTableProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="text-sm font-medium">Đang tải dữ liệu tin tuyển dụng...</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400">
        <Briefcase className="w-16 h-16 mb-4 opacity-10" />
        <p className="text-lg font-semibold text-slate-300">Không tìm thấy dữ liệu</p>
        <p className="text-sm mt-1">Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-8 py-5 w-10">
                <input
                  type="checkbox"
                  checked={
                    jobs.filter(j => j.status === JobStatus.PENDING).length > 0 &&
                    selectedIds.length === jobs.filter(j => j.status === JobStatus.PENDING).length
                  }
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
              </th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[300px]">Thông tin việc làm</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mức lương</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Loại hình</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Độ tin cậy AI</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {jobs.map((job, index) => (
              <JobTableRow
                key={`${job.jobPostingId}-${index}`}
                job={job}
                index={index}
                isSelected={selectedIds.includes(job.jobPostingId)}
                toggleSelect={toggleSelect}
                onApprove={onApprove}
                onReject={onReject}
                onQuickView={onQuickView}
                isProcessing={isProcessing === job.jobPostingId}
              />
            ))}
          </tbody>
        </table>
      </div>

      <JobPagination
        totalItems={totalItems}
        jobsLength={jobs.length}
        page={page}
        setPage={setPage}
        totalPages={totalPages}
        isLoading={isLoading}
      />
    </>
  );
}
