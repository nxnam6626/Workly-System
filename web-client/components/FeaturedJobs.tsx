"use client";

import { useState, useEffect } from "react";
import { ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { JobCard, Job } from "@/components/JobCard";
import { JobCardSkeleton } from "@/components/jobs/JobCardSkeleton";

export function FeaturedJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/job-postings", {
          params: {
            limit: 4,
            page: 1,
          },
        });
        setJobs(data.items || []);
      } catch (error) {
        console.error("Failed to fetch featured jobs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  return (
    <section className="w-full max-w-7xl mx-auto px-6 py-20 pb-24">
      <div className="flex items-end justify-between mb-12">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Việc Làm Nổi Bật</h2>
          <p className="text-slate-500 mt-2">Đừng bỏ lỡ những cơ hội nghề nghiệp tốt nhất dành cho bạn</p>
        </div>
        <Link href="/jobs" className="text-blue-600 text-sm font-bold flex items-center gap-1 hover:underline group">
          Xem tất cả <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <JobCardSkeleton key={i} />
          ))
        ) : jobs.length > 0 ? (
          jobs.map((job) => (
            <JobCard key={job.jobPostingId} job={job} />
          ))
        ) : (
          <div className="col-span-full py-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
            <p className="text-slate-500 font-medium font-sans">Hiện tại chưa có công việc nổi bật nào.</p>
          </div>
        )}
      </div>

      {/* Trust Banner (Tiny) */}
      <div className="mt-16 py-6 px-10 bg-slate-900 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-white text-sm font-bold">Hãy để AI tìm việc giúp bạn</p>
            <p className="text-slate-400 text-xs">Phân tích hồ sơ và đề xuất việc làm phù hợp nhất</p>
          </div>
        </div>
        <button className="px-6 py-2.5 bg-white text-slate-900 text-sm font-bold rounded-xl hover:bg-slate-100 transition-colors">
          Thử ngay miễn phí
        </button>
      </div>
    </section>
  );
}

