"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, MapPin, Building2, Zap } from "lucide-react";
import { formatSalary } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { useFavoriteStore } from "@/stores/favorites";
import { Job } from "./JobCard";
import { JOB_LEVEL_LABEL } from "@/lib/constants";
import MatchingAnalysisModal from "@/components/recruiter/MatchingAnalysisModal";

function timeAgo(dateStr: string): string {
  if (!dateStr) return "vừa xong";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  return `${Math.floor(hrs / 24)} ngày trước`;
}

export function RecommendedJobCard({ job }: { job: Job }) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const { favoriteIds, toggleFavorite } = useFavoriteStore();
  const isSaved = favoriteIds.has(job.jobPostingId);

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) { router.push("/login"); return; }
    await toggleFavorite(job);
  };

  const jobTypeLabelMap: Record<string, string> = {
    FULLTIME: "Full-time",
    PARTTIME: "Part-time",
    REMOTE: "Remote",
  };

  const expLabelMap: Record<string, string> = {
    NO_EXPERIENCE: "Không yêu cầu",
    UNDER_1_YEAR: "Dưới 1 năm",
    "1_TO_3_YEARS": "1-3 năm",
    "3_TO_5_YEARS": "3-5 năm",
    OVER_5_YEARS: "Trên 5 năm",
  };

  const jobTypeLabel = job.jobType ? (jobTypeLabelMap[job.jobType] ?? job.jobType) : "Full-time";
  const jobLevelLabel = job.jobLevel ? (JOB_LEVEL_LABEL[job.jobLevel] ?? null) : null;
  const expLabel = job.experience ? (expLabelMap[job.experience] ?? job.experience) : null;

  return (
    <>
      <div
        onClick={() => router.push(`/jobs/${job.slug || job.jobPostingId}`)}
        className="group relative bg-white rounded-2xl border border-slate-100/80 hover:border-blue-200 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 cursor-pointer overflow-hidden p-4 flex flex-col h-full"
      >
        {/* Header: Logo + Title */}
        <div className="flex gap-3.5 mb-3">
          <div className="w-12 h-12 rounded-xl border border-slate-100 flex items-center justify-center flex-shrink-0 bg-white shadow-sm p-1.5 overflow-hidden">
            {job.company?.logo ? (
              <img
                src={job.company.logo}
                alt={job.company.companyName}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300 rounded-lg">
                <Building2 className="w-5 h-5" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 pr-8">
            <h3 className="font-bold text-slate-900 text-[14px] leading-snug line-clamp-2 group-hover:text-[#1e60ad] transition-colors">
              {job.title}
            </h3>
            <p className="text-slate-500 text-[12px] mt-0.5 line-clamp-1">
              {job.company?.companyName}
            </p>
          </div>
        </div>

        {/* Info: Salary & Location */}
        <div className="flex items-center justify-between mb-3 mt-1">
          <span className="text-[#1e60ad] font-bold text-[13px]">
            {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
          </span>
          <span className="text-slate-500 font-medium text-[11px] flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md">
            <MapPin className="w-3 h-3 text-slate-400" />
            {job.locationCity || "Toàn quốc"}
          </span>
        </div>

        {/* Tags Row */}
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          <span className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded-md text-[9px] font-bold whitespace-nowrap uppercase tracking-wider">
            {jobTypeLabel}
          </span>
          {jobLevelLabel && (
            <span className="px-2 py-0.5 bg-blue-50 text-[#1e60ad] rounded-md text-[9px] font-black whitespace-nowrap uppercase tracking-wider">
              {jobLevelLabel}
            </span>
          )}
          {expLabel && (
            <span className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded-md text-[9px] font-bold whitespace-nowrap uppercase tracking-wider">
              {expLabel}
            </span>
          )}
          <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap ml-auto">
            {timeAgo(job.createdAt)}
          </span>
        </div>

        {/* Match Score Badge (Pro Max Element) */}
        {job.score && (
          <div className="mt-auto pt-3 border-t border-dashed border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Zap className={`w-3.5 h-3.5 ${job.score >= 80 ? 'text-emerald-500' : job.score >= 60 ? 'text-sky-500' : 'text-amber-500'}`} />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Độ phù hợp:</span>
              <span className={`text-[14px] font-black ${job.score >= 80 ? 'text-emerald-600' : job.score >= 60 ? 'text-sky-600' : 'text-amber-600'}`}>
                {Math.round(job.score)}%
              </span>
            </div>
            <div className="flex items-center gap-2.5">

              <button
                onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
                className="px-2.5 py-1 bg-[#f0f7ff] hover:bg-[#1e60ad] text-[#1e60ad] hover:text-white rounded-md text-[9px] font-black transition-all uppercase tracking-wider active:scale-95"
              >
                Xem phân tích chi tiết
              </button>
            </div>
          </div>
        )}

        {/* Favorite Button */}
        <button
          onClick={handleSave}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-red-50 transition-colors group/btn"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${isSaved ? "fill-red-500 text-red-500" : "text-slate-300 group-hover/btn:text-red-400"}`}
          />
        </button>
      </div>

      {/* Detail Modal */}
      {showModal && job.score && (
        <MatchingAnalysisModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          candidateName={job.title}
          score={Math.round(job.score)}
          matchedSkills={(job as any).matchedSkills || []}
          missingSkills={[]}
        />
      )}
    </>
  );
}

export function RecommendedJobCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col h-[180px] animate-pulse">
      <div className="flex gap-3.5 mb-3">
        <div className="w-12 h-12 rounded-xl bg-slate-50 shrink-0" />
        <div className="flex-1 py-1">
          <div className="h-3.5 bg-slate-100 rounded w-4/5 mb-2" />
          <div className="h-2.5 bg-slate-50 rounded w-3/5" />
        </div>
      </div>
      <div className="flex items-center justify-between mt-2 mb-3">
        <div className="h-4 bg-slate-50 rounded w-20" />
        <div className="h-4 bg-slate-50 rounded w-24" />
      </div>
      <div className="mt-auto space-y-3">
        <div className="h-3.5 bg-slate-100 rounded w-full" />
      </div>
    </div>
  );
}
