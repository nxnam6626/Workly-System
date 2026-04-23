"use client";

import { useRouter } from "next/navigation";
import { Heart, MapPin, Send, DollarSign, Building2 } from "lucide-react";
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
  category?: string;
}

interface JobCardProps {
  job: Job;
  variant?: 'vertical' | 'horizontal';
  onToggleFavorite?: (jobId: string, isSaved: boolean) => void;
}

export function JobCard({ job, variant = 'vertical', onToggleFavorite }: JobCardProps) {
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

  const handleApply = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (job.postType === 'CRAWLED' && job.originalUrl) {
      window.open(job.originalUrl, '_blank');
    } else {
      router.push(`/jobs/${job.slug || job.jobPostingId}`);
    }
  };

  if (variant === 'horizontal') {
    return (
      <div
        onClick={() => router.push(`/jobs/${job.slug || job.jobPostingId}`)}
        className="bg-white rounded-xl p-5 border border-slate-100 hover:shadow-lg transition-all duration-300 cursor-pointer group flex gap-5 relative"
      >
        {/* Logo Container */}
        <div className="w-20 h-20 bg-slate-50 rounded-xl flex items-center justify-center shrink-0 border border-slate-50 overflow-hidden p-2">
          {job.company?.logo ? (
            <img src={job.company.logo} alt={job.company.companyName} className="w-full h-full object-contain" />
          ) : (
            <Building2 className="w-8 h-8 text-slate-300" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-8">
          <div className="flex items-start gap-2 mb-1">
             {job.jobTier === 'URGENT' && (
               <span className="shrink-0 bg-red-50 text-red-600 text-[10px] font-black px-1.5 py-0.5 rounded border border-red-100 uppercase mt-0.5">GẤP</span>
             )}
             <h3 className="font-bold text-slate-900 text-[15px] group-hover:text-[#1e60ad] transition-colors line-clamp-1 leading-tight">
               {job.title}
             </h3>
          </div>
          <p className="text-slate-500 text-[13px] font-medium mb-3 line-clamp-1">{job.company?.companyName}</p>
          
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-1.5 text-[#1e60ad] font-bold text-[13px]">
              <span className="opacity-80"><DollarSign className="w-3.5 h-3.5" /></span>
              {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 text-[13px]">
               <MapPin className="w-3.5 h-3.5 opacity-60" />
               {job.locationCity || "Toàn quốc"}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3">
             <span className="px-2 py-1 bg-slate-50 text-slate-500 text-[11px] font-bold rounded border border-slate-100 uppercase shrink-0">
               {job.jobType || "Full-time"}
             </span>
             <span className="px-2 py-1 bg-slate-50 text-slate-500 text-[11px] font-bold rounded border border-slate-100 uppercase shrink-0">
                {job.experience || "Kinh nghiệm"}
             </span>
             <span className="text-slate-400 text-[11px] font-medium ml-auto">18 phút trước</span>
          </div>
        </div>

        {/* Action icons */}
        <button
          onClick={handleToggleFavorite}
          className={`absolute top-5 right-5 w-8 h-8 flex items-center justify-center transition-all ${isSaved ? "text-red-500" : "text-slate-300 hover:text-red-400"}`}
        >
          <Heart className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`} />
        </button>
      </div>
    );
  }

  // Original Vertical Design
  const tierBorder = job.jobTier === 'URGENT' ? 'border-2 border-red-400' : job.jobTier === 'PROFESSIONAL' ? 'border-2 border-amber-400' : 'border border-slate-100';
  const applyBtnClass = job.jobTier === 'URGENT' ? 'bg-gradient-to-r from-red-500 to-rose-600 shadow-lg shadow-red-500/30 hover:opacity-90' : job.jobTier === 'PROFESSIONAL' ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30 hover:opacity-90' : 'bg-[#1e5aff] hover:bg-blue-700 shadow-lg shadow-blue-200/40';

  return (
    <div
      onClick={() => router.push(`/jobs/${job.slug || job.jobPostingId}`)}
      className="group block h-full cursor-pointer"
    >
      <div className={`bg-white rounded-2xl p-4 flex flex-col h-full hover:shadow-xl transition-all duration-300 relative shadow-md shadow-slate-200/30 ${tierBorder}`}>
        <div className="absolute -top-3 -right-2 flex flex-col gap-1 z-10 items-end">
          {job.jobTier === 'URGENT' && (
            <div className="bg-gradient-to-r from-red-500 to-rose-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg shadow-red-500/30 flex items-center gap-1 animate-pulse shrink-0">
              <span>🔥</span>Tuyển Gấp
            </div>
          )}
          {job.jobTier === 'PROFESSIONAL' && (
            <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg shadow-amber-500/30 flex items-center gap-1 shrink-0">
              <span>⭐️</span>Nổi Bật
            </div>
          )}
        </div>

        <div className="flex gap-3 mb-3">
          <div className="w-10 h-10 bg-[#eff6ff] rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
            {job.company?.logo ? (
              <img src={job.company.logo} alt={job.company.companyName} className="w-full h-full object-contain p-2" />
            ) : (
              <Building2 className="w-6 h-6 text-slate-300" />
            )}
          </div>
          <div className="flex-1 min-w-0 pr-6">
            <h3 className="font-bold text-[#111827] text-[16px] line-clamp-2 group-hover:text-mariner transition-colors leading-snug">
              {job.title}
            </h3>
            <p className="text-slate-500 text-[14px] mt-1 line-clamp-1">{job.company?.companyName}</p>
          </div>
          <button onClick={handleToggleFavorite} className={`absolute top-5 right-5 w-6 h-6 rounded-full flex items-center justify-center transition-all ${isSaved ? "text-red-500" : "text-slate-300 hover:text-red-400"}`}>
            <Heart className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`} />
          </button>
        </div>

        <div className="space-y-2 mb-3 ml-0.5">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-slate-500">
              <MapPin className="w-3.5 h-3.5 opacity-70 shrink-0" />
              <span className="text-[13px] font-medium line-clamp-1">{job.locationCity || "Toàn quốc"}</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-600">
              <DollarSign className="w-4 h-4 shrink-0" />
              <span className="text-[13px] font-bold">{formatSalary(job.salaryMin, job.salaryMax, job.currency)}</span>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-4 flex justify-end">
          {job.hasApplied ? (
            <button disabled className="px-4 py-2 bg-slate-100 text-[13px] text-slate-400 font-bold rounded-2xl border border-slate-200 cursor-not-allowed flex items-center gap-2 shadow-sm whitespace-nowrap">
              <Send className="w-3.5 h-3.5 opacity-40" /> Đã nộp
            </button>
          ) : (
            <button onClick={handleApply} className={`px-4 py-2 text-[13px] text-white font-bold rounded-2xl transition-all active:scale-[0.98] flex items-center gap-2 whitespace-nowrap overflow-hidden ${applyBtnClass}`}>
              <Send className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">Ứng tuyển</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
