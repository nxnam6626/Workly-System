'use client';

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Heart, Clock, ChevronRight, ChevronLeft, Briefcase } from "lucide-react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import { useFavoriteStore } from "@/stores/favorites";
import { formatSalary } from "@/lib/utils";
import { JobCard, Job } from "@/components/JobCard";
import { JobCardSkeleton } from "@/components/jobs/JobCardSkeleton";

const ITEMS_PER_PAGE = 12; // 3 columns x 4 rows

export function UrgentJobsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);




  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    if (sectionRef.current) {
      const topOffset = sectionRef.current.offsetTop - 100;
      window.scrollTo({ top: topOffset, behavior: 'smooth' });
    }
  };
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/job-postings", {
        params: {
          jobTier: "URGENT",
          page: page + 1,
          limit: ITEMS_PER_PAGE,
        },
      });

      // API structure: { items: [], total: number, page: number, limit: number }
      const { items, total } = response.data;
      setJobs(items || []);
      setTotalPages(Math.ceil(total / ITEMS_PER_PAGE) || 1);
    } catch (error) {
      console.error("Failed to fetch urgent jobs:", error);
      setJobs([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return (
    <section ref={sectionRef} className="w-full bg-[#ECF3F7]/50 py-8">
      <div className="max-w-6xl mx-auto px-4 lg:px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-6">
          <div className="flex items-center gap-6">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight whitespace-nowrap">
              Việc Tuyển Gấp
            </h2>

          </div>

          <Link
            href="/jobs?jobTier=URGENT"
            className="text-slate-700 font-bold text-sm flex items-center gap-1 hover:text-mariner transition-colors group shrink-0 hidden md:flex"
          >
            Xem thêm <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* 3-Col Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {loading
            ? Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => <JobCardSkeleton key={i} />)
            : jobs.length > 0
              ? jobs.map((job) => <JobCard key={job.jobPostingId} job={job} variant="horizontal" />)
              : (
                <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                  <Briefcase className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 font-medium">Chưa có việc làm tuyển gấp nào.</p>
                </div>
              )
          }
        </div>

        {/* Compact Pagination Navigation (Screenshot Style) */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center mt-6 gap-3">
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
