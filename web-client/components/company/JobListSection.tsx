'use client';

import { ChevronRight } from "lucide-react";
import { JobCard } from "@/components/jobs/JobCard";
import { Company } from "@/types/company";

interface JobListSectionProps {
  company: Partial<Company>;
  isPreview?: boolean;
}

export function JobListSection({ company, isPreview }: JobListSectionProps) {
  const jobsCount = company.jobPostings?.length || 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between">
        <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
          Việc đang tuyển
          <span className="text-mariner bg-blue-50 px-2 py-0.5 rounded text-sm">
            {jobsCount}
          </span>
        </h2>
      </div>

      <div className="p-6">
        {jobsCount > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {company.jobPostings?.map((job: any) => (
              <JobCard
                key={job.jobPostingId}
                job={{ ...job, company: { companyName: company.companyName, logo: company.logo } }}
                variant="horizontal"
              />
            ))}
          </div>
        ) : (
          <EmptyJobsPlaceholder isPreview={isPreview} />
        )}

        {jobsCount > 4 && (
          <button className="w-full mt-6 py-3 border border-blue-100 rounded-xl text-mariner font-bold hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
            Xem thêm việc làm
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function EmptyJobsPlaceholder({ isPreview }: { isPreview?: boolean }) {
  return (
    <div className="text-center py-12 text-slate-400 font-medium italic">
      {isPreview ? "Các vị trí tuyển dụng mẫu sẽ hiển thị tại đây khi bạn đăng tin." : "Hiện tại công ty chưa có tin tuyển dụng nào mới."}
      {isPreview && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 opacity-40 grayscale pointer-events-none">
          {[1, 2].map(i => (
            <div key={i} className="p-4 border border-slate-100 rounded-xl bg-slate-50 flex gap-4">
              <div className="w-12 h-12 bg-slate-200 rounded-lg animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
