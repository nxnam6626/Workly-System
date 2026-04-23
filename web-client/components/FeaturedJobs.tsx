'use client';

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Heart, ChevronRight, ChevronLeft, Briefcase } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { useFavoriteStore } from "@/stores/favorites";
import { formatSalary } from "@/lib/utils";
import { Job } from "@/components/JobCard";

const ITEMS_PER_PAGE = 12; // 3 columns x 4 rows

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

function FeaturedJobCard({ job }: { job: Job }) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { favoriteIds, toggleFavorite } = useFavoriteStore();
  const isSaved = favoriteIds.has(job.jobPostingId);

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) { router.push("/login"); return; }
    await toggleFavorite(job);
  };

  const isHot = job.jobTier === "PROFESSIONAL";
  const isUrgent = job.jobTier === "URGENT";

  const jobTypeLabelMap: Record<string, string> = {
    FULLTIME: "Full-time",
    PARTTIME: "Part-time",
    INTERNSHIP: "Thực tập",
    REMOTE: "Remote",
  };

  const expLabelMap: Record<string, string> = {
    NO_EXPERIENCE: "Không yêu cầu",
    UNDER_1_YEAR: "Dưới 1 năm",
    "1_TO_3_YEARS": "Trên 1 năm",
    "3_TO_5_YEARS": "Trên 3 năm",
    OVER_5_YEARS: "Trên 5 năm",
  };

  const jobTypeLabel = job.jobType ? (jobTypeLabelMap[job.jobType] ?? job.jobType) : "Full-time";
  const expLabel = job.experience ? (expLabelMap[job.experience] ?? job.experience) : null;

  return (
    <div
      onClick={() => router.push(`/jobs/${job.jobPostingId}`)}
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
            <span className="text-[#0062bd] font-bold text-[12px]">
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
          <span className="px-1.5 py-0.5 bg-slate-50 rounded text-[9px] text-slate-400 font-bold whitespace-nowrap">
            {jobTypeLabel}
          </span>
          {expLabel && (
            <span className="px-1.5 py-0.5 bg-slate-50 rounded text-[9px] text-slate-400 font-bold whitespace-nowrap">
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
        onClick={handleSave}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-blue-50 transition-colors"
      >
        <Heart
          className={`w-4 h-4 transition-colors ${isSaved ? "fill-blue-500 text-blue-500" : "text-slate-300"
            }`}
        />
      </button>
    </div>
  );
}

function FeaturedJobSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-slate-100 p-2 flex gap-3 h-[110px] animate-pulse">
      <div className="w-[48px] h-[48px] rounded-lg bg-slate-50 shrink-0 mt-1" />
      <div className="flex-1 py-1">
        <div className="h-3.5 bg-slate-100 rounded w-4/5 mb-1.5" />
        <div className="h-2.5 bg-slate-50 rounded w-3/5" />
        <div className="mt-3 h-3 bg-slate-100 rounded w-1/2" />
      </div>
    </div>
  );
}

export function FeaturedJobs() {
  const sectionRef = useRef<HTMLElement>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/job-postings", {
        params: {
          jobTier: "PROFESSIONAL",
          page: page + 1,
          limit: ITEMS_PER_PAGE,
        },
      });

      const { items, total } = response.data;
      setJobs(items || []);
      setTotalPages(Math.ceil(total / ITEMS_PER_PAGE) || 1);
    } catch (error) {
      console.error("Failed to fetch featured jobs:", error);
      setJobs([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    if (sectionRef.current) {
      const topOffset = sectionRef.current.offsetTop - 100;
      window.scrollTo({ top: topOffset, behavior: 'smooth' });
    }
  };

  return (
    <section ref={sectionRef} className="w-full py-12 bg-[#F0F7FF]/30">
      <div className="max-w-6xl mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
              Việc Làm Nổi Bật
            </h2>
            <div className="bg-yellow-400 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-sm">HOT</div>
          </div>
          <Link
            href="/jobs?jobTier=PROFESSIONAL"
            className="text-slate-700 font-bold text-sm flex items-center gap-1 hover:text-mariner transition-colors group shrink-0"
          >
            Xem thêm <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {loading ? (
            Array.from({ length: 9 }).map((_, i) => <FeaturedJobSkeleton key={i} />)
          ) : jobs.length > 0 ? (
            jobs.map((job) => (
              <FeaturedJobCard key={job.jobPostingId} job={job} />
            ))
          ) : (
            <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200">
              <Briefcase className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">Chưa có việc làm nổi bật nào.</p>
            </div>
          )}
        </div>

        {/* Compact Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center mt-10 gap-3">
            <button
              onClick={() => handlePageChange(Math.max(0, page - 1))}
              disabled={page === 0}
              className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-[#0062bd] hover:border-[#0062bd] transition-all disabled:opacity-20 disabled:cursor-not-allowed shadow-md shadow-blue-900/5 border border-slate-100 group"
            >
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            </button>

            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => handlePageChange(i)}
                  className={`transition-all duration-300 rounded-full cursor-pointer overflow-hidden ${i === page
                      ? "w-8 h-1.5 bg-[#0056b3] shadow-sm"
                      : "w-6 h-1.5 bg-[#d0e1f3] hover:bg-slate-300"
                    }`}
                  aria-label={`Go to page ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={() => handlePageChange(Math.min(totalPages - 1, page + 1))}
              disabled={page === totalPages - 1}
              className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-[#0062bd] hover:border-[#0062bd] transition-all disabled:opacity-20 disabled:cursor-not-allowed shadow-md shadow-blue-900/5 border border-slate-100 group"
            >
              <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
