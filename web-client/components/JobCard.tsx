"use client";

import { useRouter } from "next/navigation";
import { Heart, MapPin, Send, DollarSign, Building2, Briefcase } from "lucide-react";
import { formatSalary } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { useFavoriteStore } from "@/stores/favorites";

export interface Job {
  jobPostingId: string;
  title: string;
  company: { companyName: string; logo: string | null; address?: string | null };
  locationCity: string | null;
  jobType: string | null;
  experience: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  createdAt: string;
  isVerified: boolean;
  isSaved?: boolean;
  postType: 'CRAWLED' | 'MANUAL';
  originalUrl?: string;
  hasApplied?: boolean;
  slug?: string | null;
  jobTier?: 'BASIC' | 'PROFESSIONAL' | 'URGENT';
  score?: number;
  aiReliabilityScore?: number;
  description?: string;
  requirements?: string;
  benefits?: string;
  vacancies?: number | null;
  category?: string;
  jobLevel?: 'INTERN' | 'STAFF' | 'MANAGER' | 'DIRECTOR' | null;
}

interface JobCardProps {
  job: Job;
  variant?: 'vertical' | 'horizontal';
  onToggleFavorite?: (jobId: string, isSaved: boolean) => void;
}

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

export function JobCard({ job, variant = 'horizontal', onToggleFavorite }: JobCardProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { favoriteIds, toggleFavorite } = useFavoriteStore();
  const isSaved = favoriteIds.has(job.jobPostingId);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    try {
      await toggleFavorite(job);
      if (onToggleFavorite) {
        onToggleFavorite(job.jobPostingId, !isSaved);
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  const isHot = job.jobTier === "PROFESSIONAL";
  const isUrgent = job.jobTier === "URGENT";

  const jobTypeLabelMap: Record<string, string> = {
    FULLTIME: "Full-time",
    PARTTIME: "Part-time",
    REMOTE: "Remote",
  };

  const jobLevelLabelMap: Record<string, string> = {
    INTERN: "Thực tập sinh",
    STAFF: "Nhân viên",
    MANAGER: "Quản lý",
    DIRECTOR: "Giám đốc",
  };

  const expLabelMap: Record<string, string> = {
    NO_EXPERIENCE: "Không yêu cầu",
    UNDER_1_YEAR: "Dưới 1 năm",
    "1_TO_3_YEARS": "Trên 1 năm",
    "3_TO_5_YEARS": "Trên 3 năm",
    OVER_5_YEARS: "Trên 5 năm",
  };

  const jobTypeLabel = job.jobType ? (jobTypeLabelMap[job.jobType] ?? job.jobType) : "Full-time";
  const jobLevelLabel = job.jobLevel ? (jobLevelLabelMap[job.jobLevel] ?? null) : null;
  const expLabel = job.experience ? (expLabelMap[job.experience] ?? job.experience) : null;

  if (variant === 'horizontal') {
    return (
      <div
        onClick={() => router.push(`/jobs/${job.slug || job.jobPostingId}`)}
        className="group relative bg-white rounded-lg border border-slate-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden p-2 flex gap-2.5 min-h-[110px]"
      >
        {/* 1. Logo Section (Left) */}
        <div className="w-[48px] h-[48px] rounded-lg border border-slate-50 flex items-center justify-center flex-shrink-0 bg-white shadow-sm mt-1">
          {job.company?.logo ? (
            <img
              src={job.company.logo}
              alt={job.company.companyName}
              className="w-full h-full object-contain p-1"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
              <Briefcase className="w-5 h-5" />
            </div>
          )}
        </div>

        {/* 2. Content Section (Right) */}
        <div className="flex-1 flex flex-col justify-between py-0.5">
          <div>
            <h3 className="font-bold text-slate-800 text-[13px] leading-tight line-clamp-2 pr-6 group-hover:underline transition-all">
              {isHot && <span className="bg-[#FF4D4D] text-white text-[10px] px-1.5 py-0.5 rounded mr-1 inline-block align-middle font-black tracking-tighter">HOT</span>}
              {isUrgent && <span className="bg-[#E12B28] text-white text-[10px] px-1.5 py-0.5 rounded mr-1 inline-block align-middle font-black tracking-tighter">GẤP</span>}
              {job.title}
            </h3>
            <p className="text-slate-400 text-[11px] mt-0.5 line-clamp-1">
              {job.company?.companyName}
            </p>

            <div className="flex items-center gap-2 mt-1">
              <span className="text-[#1e60ad] font-bold text-[12px]">
                {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
              </span>
              <span className="text-slate-200 text-[10px]">|</span>
              <span className="text-slate-400 font-medium text-[12px]">
                {job.locationCity || "Toàn quốc"}
              </span>
            </div>
          </div>

          {/* Tags Row */}
          <div className="flex items-center gap-2 mt-auto pt-1.5 overflow-hidden">
            <span className="px-1.5 py-0.5 bg-slate-50 rounded text-[9px] text-slate-400 font-bold whitespace-nowrap uppercase">
              {jobTypeLabel}
            </span>
            {jobLevelLabel && (
              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-500 rounded text-[9px] font-bold whitespace-nowrap uppercase border border-blue-100">
                {jobLevelLabel}
              </span>
            )}
            {expLabel && (
              <span className="px-1.5 py-0.5 bg-slate-50 rounded text-[9px] text-slate-400 font-bold whitespace-nowrap uppercase">
                {expLabel}
              </span>
            )}
            <span className="text-[9px] text-slate-400 font-medium whitespace-nowrap flex items-center gap-1">
              {timeAgo(job.createdAt)}
            </span>
          </div>
        </div>

        {/* Favorite Button (Top Right) */}
        <button
          onClick={handleToggleFavorite}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-blue-50 transition-colors"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${isSaved ? "fill-[#1e60ad] text-[#1e60ad]" : "text-slate-300"
              }`}
          />
        </button>
      </div>
    );
  }

  // Fallback Vertical Design (if needed)
  return (
    <div
      onClick={() => router.push(`/jobs/${job.slug || job.jobPostingId}`)}
      className="bg-white rounded-xl p-4 border border-slate-100 hover:shadow-lg transition-all cursor-pointer h-full flex flex-col"
    >
      <div className="flex gap-3 mb-3">
        <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border border-slate-50 overflow-hidden">
          {job.company?.logo ? <img src={job.company.logo} className="w-full h-full object-contain" /> : <Building2 className="w-6 h-6 text-slate-300" />}
        </div>
        <div className="flex-1 min-w-0 pr-6">
          <h3 className="font-bold text-slate-900 text-[15px] group-hover:text-[#1e60ad] transition-colors line-clamp-1">{job.title}</h3>
          <p className="text-slate-500 text-[13px] line-clamp-1 mt-0.5">{job.company?.companyName}</p>
        </div>
      </div>
      <div className="mt-auto pt-3 border-t border-slate-50">
        <div className="flex items-center justify-between">
          <span className="text-[#1e60ad] font-bold text-[13px]">{formatSalary(job.salaryMin, job.salaryMax, job.currency)}</span>
          <span className="text-slate-400 text-[11px] font-medium">{job.locationCity}</span>
        </div>
      </div>
    </div>
  );
}
