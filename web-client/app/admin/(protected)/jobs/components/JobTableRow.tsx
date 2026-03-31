'use client';

import { CheckCircle2, XCircle, Loader2, ShieldAlert, Eye } from 'lucide-react';
import { JobPosting, JobStatus, PostType } from '@/lib/admin-api';
import toast from 'react-hot-toast';

interface JobTableRowProps {
  job: JobPosting;
  index: number;
  isSelected: boolean;
  toggleSelect: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onQuickView: (job: JobPosting) => void;
  isProcessing: boolean;
}

export default function JobTableRow({
  job,
  index,
  isSelected,
  toggleSelect,
  onApprove,
  onReject,
  onQuickView,
  isProcessing,
}: JobTableRowProps) {
  return (
    <tr
      key={`${job.jobPostingId}-${index}`}
      className={`group hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-indigo-50/30' : ''}`}
    >
      <td className="px-5 py-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => toggleSelect(job.jobPostingId)}
          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        />
      </td>
      <td className="px-5 py-4">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-900 line-clamp-1">{job.title}</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-slate-500 font-medium">{job.company?.companyName || 'N/A'}</span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-400">{job.locationCity || 'N/A'}</span>
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="text-xs font-bold text-emerald-600">
          {job.salaryMin || job.salaryMax 
            ? `${job.salaryMin?.toLocaleString() || '?'} - ${job.salaryMax?.toLocaleString() || '?'} ${job.currency || 'VND'}`
            : 'Thỏa thuận'}
        </div>
      </td>
      <td className="px-5 py-4">
        <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
          {job.jobType || 'N/A'}
        </span>
      </td>
      <td className="px-5 py-4">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
            job.postType === PostType.CRAWLED
              ? 'bg-amber-50 text-amber-600 border border-amber-100'
              : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
          }`}
        >
          {job.postType === PostType.CRAWLED ? 'Crawler' : 'Manual'}
        </span>
      </td>
      <td className="px-5 py-4">
        <span
          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            job.status === JobStatus.APPROVED
              ? 'bg-emerald-100 text-emerald-700'
              : job.status === JobStatus.REJECTED
              ? 'bg-red-100 text-red-700'
              : 'bg-amber-100 text-amber-700'
          }`}
        >
          {job.status === JobStatus.APPROVED ? 'Đã duyệt' : job.status === JobStatus.REJECTED ? 'Từ chối' : 'Chờ duyệt'}
        </span>
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-2 min-w-[120px]">
          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-[80px]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${job.aiReliabilityScore < 60 ? 'bg-red-500' : 'bg-emerald-500'}`}
              style={{ width: `${job.aiReliabilityScore}%` }}
            />
          </div>
          <span className={`text-xs font-bold ${job.aiReliabilityScore < 60 ? 'text-red-600' : 'text-emerald-600'}`}>
            {job.aiReliabilityScore}%
          </span>
        </div>
      </td>
      <td className="px-5 py-4 text-right">
        <div className="flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onQuickView(job)}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Xem nhanh"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => toast("Tính năng hiệu chỉnh dữ liệu tự động từ crawler đang được phát triển")}
            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            title="Hiệu chỉnh dữ liệu crawler"
          >
            <ShieldAlert className="w-4 h-4" />
          </button>
          <button
            onClick={() => onApprove(job.jobPostingId)}
            disabled={isProcessing || job.status === JobStatus.APPROVED}
            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-30"
            title="Duyệt"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onReject(job.jobPostingId)}
            disabled={isProcessing || job.status === JobStatus.REJECTED}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30"
            title="Từ chối"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
