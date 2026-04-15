'use client';

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Heart, Clock, ChevronRight, ChevronLeft, Briefcase } from "lucide-react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import { useFavoriteStore } from "@/stores/favorites";
import { formatSalary } from "@/lib/utils";
import { Job } from "@/components/JobCard";

const ITEMS_PER_PAGE = 9; // 3x3 grid

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  return `${Math.floor(hrs / 24)} ngày trước`;
}

function UrgentJobCard({ job }: { job: Job }) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { favoriteIds, toggleFavorite } = useFavoriteStore();
  const isSaved = favoriteIds.has(job.jobPostingId);

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) { router.push("/login"); return; }
    await toggleFavorite(job);
  };

  const jobTypeLabelMap: Record<string, string> = {
    FULL_TIME: "Full-time", PART_TIME: "Part-time",
    CONTRACT: "Hợp đồng", INTERNSHIP: "Thực tập",
  };

  const expLabelMap: Record<string, string> = {
    NO_EXPERIENCE: "Không yêu cầu", UNDER_1_YEAR: "Dưới 1 năm",
    "1_TO_3_YEARS": "Trên 1 năm", "3_TO_5_YEARS": "Trên 3 năm",
    OVER_5_YEARS: "Trên 5 năm",
  };

  const jobTypeLabel = job.jobType ? (jobTypeLabelMap[job.jobType] ?? job.jobType) : "Full-time";
  const expLabel = job.experience ? (expLabelMap[job.experience] ?? job.experience) : null;

  return (
    <div
      onClick={() => router.push(`/jobs/${job.jobPostingId}`)}
      className="group relative bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/50 transition-all duration-200 cursor-pointer overflow-hidden"
    >
      {/* Card Body */}
      <div className="p-4">
        <div className="flex gap-3 mb-3">
          {/* Company Logo */}
          <div className="w-[52px] h-[52px] rounded-lg border border-slate-100 bg-white flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
            {job.company?.logo ? (
              <img
                src={job.company.logo}
                alt={job.company.companyName}
                className="w-full h-full object-contain p-1"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg">
                <span className="text-white font-bold text-lg">
                  {job.company?.companyName?.slice(0, 1).toUpperCase() ?? "W"}
                </span>
              </div>
            )}
          </div>

          {/* Title + Company */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-blue-600 text-[14px] leading-snug line-clamp-2 group-hover:text-blue-700 transition-colors pr-6">
              {job.title}
            </h3>
            <p className="text-slate-500 text-[13px] mt-0.5 line-clamp-1">
              {job.company?.companyName}
            </p>
          </div>

          {/* Favorite */}
          <button
            onClick={handleSave}
            className="absolute top-3 right-3 text-slate-300 hover:text-blue-400 transition-colors"
          >
            <Heart className={`w-4.5 h-4.5 ${isSaved ? "fill-blue-500 text-blue-500" : ""}`} />
          </button>
        </div>

        {/* Salary */}
        <p className="text-blue-600 font-semibold text-[13px] mb-2">
          {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
          {job.locationCity && (
            <span className="text-slate-400 font-normal"> &nbsp;|&nbsp; {job.locationCity}</span>
          )}
        </p>
      </div>

      {/* Card Footer */}
      <div className="border-t border-slate-100 px-4 py-2.5 flex items-center justify-between bg-slate-50/60">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="px-2.5 py-0.5 bg-white border border-slate-200 rounded text-[11px] text-slate-600 font-medium">
            {jobTypeLabel}
          </span>
          {expLabel && (
            <span className="px-2.5 py-0.5 bg-white border border-slate-200 rounded text-[11px] text-slate-600 font-medium">
              {expLabel}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-slate-400 text-[12px] shrink-0">
          <Clock className="w-3 h-3" />
          <span>{timeAgo(job.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

function UrgentJobCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse">
      <div className="p-4">
        <div className="flex gap-3 mb-3">
          <div className="w-[52px] h-[52px] rounded-lg bg-slate-200 shrink-0" />
          <div className="flex-1">
            <div className="h-3.5 bg-slate-200 rounded w-4/5 mb-2" />
            <div className="h-3 bg-slate-100 rounded w-3/5" />
          </div>
        </div>
        <div className="h-3 bg-slate-200 rounded w-2/3" />
      </div>
      <div className="border-t border-slate-100 px-4 py-2.5 flex gap-2 bg-slate-50/60">
        <div className="h-5 bg-slate-200 rounded w-16" />
        <div className="h-5 bg-slate-200 rounded w-20" />
      </div>
    </div>
  );
}

export function UrgentJobsSection() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0); // 0-indexed
  const [totalPages, setTotalPages] = useState(1);

  const fetchJobs = useCallback(async (pageIndex: number) => {
    setLoading(true);
    try {
      const { data } = await api.get("/job-postings", {
        params: { limit: ITEMS_PER_PAGE, page: pageIndex + 1, jobTier: "URGENT" },
      });
      setJobs(data.items || []);
      const total = data.total ?? (data.items?.length ?? 0);
      setTotalPages(Math.max(1, Math.ceil(total / ITEMS_PER_PAGE)));
    } catch (err) {
      console.error("Failed to fetch urgent jobs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchJobs(page); }, [page, fetchJobs]);

  return (
    <section className="w-full max-w-7xl mx-auto px-4 lg:px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[22px] font-extrabold text-slate-800 tracking-tight">
          Việc Tuyển Gấp
        </h2>
        <Link
          href="/jobs?filter=urgent"
          className="text-blue-600 font-semibold text-[14px] flex items-center gap-0.5 hover:text-blue-800 transition-colors group"
        >
          Xem thêm <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* 3-Col Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative">
        {loading
          ? Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => <UrgentJobCardSkeleton key={i} />)
          : jobs.length > 0
            ? jobs.map((job) => <UrgentJobCard key={job.jobPostingId} job={job} />)
            : (
              <div className="col-span-full py-16 text-center">
                <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 font-medium">Chưa có việc làm tuyển gấp nào.</p>
              </div>
            )
        }
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`transition-all duration-200 rounded-full ${
                i === page
                  ? "w-8 h-2.5 bg-blue-600 rounded-full"
                  : "w-2.5 h-2.5 bg-slate-300 hover:bg-blue-400"
              }`}
            />
          ))}

          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </section>
  );
}
