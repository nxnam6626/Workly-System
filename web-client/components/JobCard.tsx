"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, MapPin, Briefcase, Send, DollarSign } from "lucide-react";
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
  deadline?: string | null;
  isSaved?: boolean;
  postType: 'CRAWLED' | 'MANUAL';
  originalUrl?: string;
  hasApplied?: boolean;
}

interface JobCardProps {
  job: Job;
  saved?: boolean;
  onSave?: (id: string, newSavedStatus: boolean) => void;
}

export function JobCard({ job }: JobCardProps) {
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
      router.push(`/jobs/${job.jobPostingId}`);
    }
  };

  return (
    <Link href={`/jobs/${job.jobPostingId}`} className="group block">
      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col hover:shadow-xl transition-all duration-300 relative shadow-md shadow-slate-200/30">

        {/* Top: Logo, Title & Company */}
        <div className="flex gap-3 mb-3">
          {/* Logo container */}
          <div className="w-10 h-10 bg-[#eff6ff] rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
            {job.company?.logo ? (
              <img
                src={job.company.logo}
                alt={job.company.companyName}
                className="w-full h-full object-contain p-1"
              />
            ) : (
              <span className="text-base font-bold text-blue-600">
                {job.company?.companyName?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "TC"}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-center pr-8">
            <h3 className="font-bold text-[#1e293b] text-[15px] line-clamp-1 group-hover:text-blue-600 transition-colors tracking-tight">
              {job.title}
            </h3>
            <p className="text-[#64748b] text-[13px] truncate">
              {job.company?.companyName}
            </p>
          </div>

          <button
            onClick={handleToggleFavorite}
            className={`absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center transition-all bg-white shadow-sm border border-slate-50 hover:scale-110 active:scale-95 ${isSaved ? "text-red-500 border-red-50" : "text-slate-300 hover:text-red-400"
              }`}
          >
            <Heart className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
          </button>
        </div>

        {/* Middle: Key details */}
        <div className="space-y-1 mb-4 ml-0.5">
          <div className="flex items-center gap-2 text-[#64748b]">
            <MapPin className="w-3.5 h-3.5 opacity-60" />
            <span className="text-[13px] font-medium truncate">{job.locationCity || "Toàn quốc"}</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-600 mt-1.5 mb-1.5">
            <DollarSign className="w-4 h-4" />
            <span className="text-[13px] font-bold">
              {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
            </span>
          </div>
        </div>

        {job.hasApplied ? (
          <button
            disabled
            className="w-3/4 py-2 mx-auto bg-slate-100 text-[13px] text-slate-400 font-bold rounded-2xl border border-slate-200 cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
          >
            <Send className="w-3.5 h-3.5 opacity-40" />
            Đã ứng tuyển
          </button>
        ) : (
          <button
            onClick={handleApply}
            className="w-3/4 py-2 mx-auto bg-[#1e5aff] text-[13px] text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200/40 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            Ứng tuyển ngay
          </button>
        )}
      </div>
    </Link>
  );
}
