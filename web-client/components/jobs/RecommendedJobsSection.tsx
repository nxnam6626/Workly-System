'use client';

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Heart, ChevronRight, ChevronLeft, Briefcase } from "lucide-react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import { useFavoriteStore } from "@/stores/favorites";
import { formatSalary } from "@/lib/utils";
import { Job } from "@/components/jobs/JobCard";
import { RecommendedJobCard, RecommendedJobCardSkeleton } from "./RecommendedJobCard";

const ITEMS_PER_PAGE = 6; // 3 columns x 2 rows

export function RecommendedJobsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const { isAuthenticated, user } = useAuthStore();

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    if (sectionRef.current) {
      const topOffset = sectionRef.current.offsetTop - 100;
      window.scrollTo({ top: topOffset, behavior: 'smooth' });
    }
  };

  const fetchJobs = async () => {
    if (!isAuthenticated || !user?.roles?.includes('CANDIDATE')) return;
    setLoading(true);
    try {
      const response = await api.get("/candidates/recommended-jobs", {
        params: {
          page: page + 1,
          limit: ITEMS_PER_PAGE,
        },
      });
      // New structure: { items: [], total: number, page: number, limit: number }
      const { items, total } = response.data;
      setJobs(items || []);
      setTotalPages(Math.ceil(total / ITEMS_PER_PAGE) || 1);
    } catch (error) {
      console.error("Failed to fetch recommended jobs:", error);
      setJobs([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [isAuthenticated, page]);

  if (!isAuthenticated) return null;

  return (
    <section ref={sectionRef} className="w-full py-8 bg-white">
      <div className="max-w-6xl mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Việc Đề Xuất Cho Bạn
          </h2>
          <Link
            href="/jobs"
            className="text-slate-700 font-bold text-sm flex items-center gap-1 hover:text-mariner transition-colors group shrink-0"
          >
            Xem thêm <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {loading 
            ? Array.from({ length: 6 }).map((_, i) => <RecommendedJobCardSkeleton key={i} />)
            : jobs.length > 0 
              ? jobs.map((job) => <RecommendedJobCard key={job.jobPostingId} job={job} />)
              : (
                <div className="col-span-full py-16 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Briefcase className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 font-medium">Chưa có đề xuất phù hợp cho bạn.</p>
                </div>
              )
          }
        </div>

        {/* Compact Pagination */}
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
