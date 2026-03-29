'use client';

import { Flame, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { JobCard, Job } from "@/components/JobCard";
import { JobCardSkeleton } from "@/components/jobs/JobCardSkeleton";
import api from "@/lib/api";

export function UrgentJobsSection() {
  const [activeTab, setActiveTab] = useState("Tất cả");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  
  const locations = ["Tất cả", "TP.HCM", "Hà Nội", "Đà Nẵng", "Cần Thơ", "Bình Dương"];

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const params: any = {
          limit: 6,
          page: 1,
        };

        if (activeTab !== "Tất cả") {
          params.location = activeTab;
        }

        const { data } = await api.get("/job-postings", { params });
        setJobs(data.items || []);
      } catch (error) {
        console.error("Failed to fetch urgent jobs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [activeTab]);


  return (
    <section className="w-full max-w-7xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
            <Flame className="w-6 h-6 fill-orange-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Việc làm tuyển gấp</h2>
        </div>
        <Link 
          href="/jobs?filter=urgent" 
          className="text-blue-600 font-bold text-sm flex items-center gap-1 hover:underline"
        >
          Xem thêm <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-8 border-b border-slate-100 pb-4">
        {locations.map((loc) => (
          <button
            key={loc}
            onClick={() => setActiveTab(loc)}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
              activeTab === loc 
                ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
                : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-100"
            }`}
          >
            {loc}
          </button>
        ))}
      </div>

      {/* Job Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <JobCardSkeleton key={i} />
          ))
        ) : jobs.length > 0 ? (
          jobs.map((job) => (
            <JobCard key={job.jobPostingId} job={job} />
          ))
        ) : (
          <div className="col-span-full py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-slate-500 font-medium">Hiện tại chưa có công việc nào ở khu vực này.</p>
          </div>
        )}
      </div>
    </section>
  );
}
