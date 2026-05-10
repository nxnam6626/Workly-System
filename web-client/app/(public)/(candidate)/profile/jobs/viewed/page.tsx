"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Eye, 
  Briefcase,
  ArrowRight,
  Clock,
  MapPin,
  DollarSign,
  Building2,
  Heart,
  SendHorizontal
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { formatSalary } from "@/lib/utils";
import { ProfilePageShell, ProfileSearchBar } from "@/components/candidates/ProfilePageShell";
import { motion, AnimatePresence } from "framer-motion";
import { useFavoriteStore } from "@/stores/favorites";
import { useAuthStore } from "@/stores/auth";
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

const jobTypeLabelMap: Record<string, string> = {
  FULLTIME: "Full-time",
  PARTTIME: "Part-time",
  REMOTE: "Remote",
};

export default function ViewedJobsPage() {
  const router = useRouter();
  const { favoriteIds, toggleFavorite } = useFavoriteStore();
  const { isAuthenticated } = useAuthStore();
  const [viewedJobs, setViewedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"NEWEST" | "OLDEST">("NEWEST");

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        setLoading(true);
        const viewedStr = localStorage.getItem("workly:viewed-jobs");
        if (viewedStr) {
          const viewed = JSON.parse(viewedStr);
          setViewedJobs(viewed);
        } else {
          setViewedJobs([]);
        }
      } catch (e) {
        console.error("Failed to load viewed jobs from localStorage:", e);
        setViewedJobs([]);
      } finally {
        setLoading(false);
      }
    }
  }, []);

  const handleToggleSave = async (job: any) => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    await toggleFavorite(job);
  };

  const filteredJobs = useMemo(() => {
    let result = viewedJobs.filter(job => 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.companyName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return [...result].sort((a, b) => {
      const dateA = new Date(a.viewedAt || "").getTime();
      const dateB = new Date(b.viewedAt || "").getTime();
      return sortBy === "NEWEST" ? dateB - dateA : dateA - dateB;
    });
  }, [viewedJobs, searchTerm, sortBy]);

  const customTitle = (
    <div className="space-y-4">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-slate-500 text-[12px] font-medium">
        <Link href="/" className="hover:text-[#1e60ad] transition-colors">Trang chủ</Link>
        <span>/</span>
        <Link href="/profile" className="hover:text-[#1e60ad] transition-colors">Quản lý hồ sơ</Link>
        <span>/</span>
        <span className="text-slate-400">Việc làm đã xem</span>
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">
        Việc làm đã xem
      </h1>
    </div>
  );

  return (
    <ProfilePageShell
      title={customTitle}
      action={
        <ProfileSearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Tìm trong lịch sử..."
          accentColor="focus:border-[#1e60ad]"
        />
      }
    >
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
        {/* Sort & Stats Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-5">
            <span className="text-sm font-bold text-slate-800">Sắp xếp</span>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer text-[13px] font-semibold text-slate-600 select-none">
                <input
                  type="radio"
                  name="sort"
                  checked={sortBy === "OLDEST"}
                  onChange={() => setSortBy("OLDEST")}
                  className="w-4 h-4 text-[#1e60ad] focus:ring-[#1e60ad] border-slate-300"
                />
                Cũ nhất
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-[13px] font-semibold text-slate-600 select-none">
                <input
                  type="radio"
                  name="sort"
                  checked={sortBy === "NEWEST"}
                  onChange={() => setSortBy("NEWEST")}
                  className="w-4 h-4 text-[#1e60ad] focus:ring-[#1e60ad] border-slate-300"
                />
                Mới nhất
              </label>
            </div>
          </div>
          <span className="text-[13px] text-slate-400 font-bold">
            {filteredJobs.length} kết quả phù hợp
          </span>
        </div>

        {/* History List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-100 p-6 animate-pulse flex gap-4">
                <div className="w-[72px] h-[72px] bg-slate-100 rounded-xl" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                  <div className="h-3 bg-slate-100 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredJobs.length > 0 ? (
                <div key="viewed-jobs-grid" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredJobs.map((job) => {
                    const isSaved = favoriteIds.has(job.jobPostingId);
                    return (
                      <div
                        key={job.jobPostingId}
                        onClick={() => router.push(`/jobs/${job.slug || job.jobPostingId}`)}
                        className="group relative bg-white rounded-xl border border-slate-100 p-4 hover:border-blue-200 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[145px]"
                      >
                        <div className="flex items-start gap-4">
                          {/* Logo */}
                          <div className="w-[52px] h-[52px] rounded-lg border border-slate-100 flex items-center justify-center shrink-0 bg-white p-1 overflow-hidden">
                            {job.company?.logo ? (
                              <img
                                src={job.company.logo}
                                alt={job.company.companyName}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <Building2 className="w-6 h-6 text-slate-300" />
                            )}
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0 pr-8">
                            <h3 className="font-extrabold text-slate-900 text-[14px] leading-snug line-clamp-2 group-hover:text-[#1e60ad] transition-colors">
                              {job.title}
                            </h3>
                            <p className="text-slate-400 text-[12px] mt-0.5 line-clamp-1">
                              {job.company?.companyName}
                            </p>
                            
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[#1e60ad] font-bold text-[12px]">
                                {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
                              </span>
                              <span className="text-slate-200 text-[10px]">|</span>
                              <span className="text-slate-500 font-medium text-[12px]">
                                {job.locationCity || "Toàn quốc"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Footer with tags and Apply CTA */}
                        <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-slate-50 text-slate-400 rounded text-[9px] font-bold uppercase tracking-wider">
                              {job.jobType ? (jobTypeLabelMap[job.jobType] ?? job.jobType) : "Full-time"}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {timeAgo(job.viewedAt)}
                            </span>
                          </div>

                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              router.push(`/jobs/${job.slug || job.jobPostingId}`);
                            }}
                            className="px-4 py-1.5 bg-[#1e60ad] hover:bg-[#164e8d] text-white rounded-full text-[12px] font-black flex items-center gap-1.5 transition-all shadow-sm active:scale-95 shrink-0"
                          >
                            <SendHorizontal className="w-3.5 h-3.5" />
                            Ứng tuyển
                          </button>
                        </div>

                        {/* Save Toggle */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleToggleSave(job);
                          }}
                          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-rose-50 transition-colors group/btn"
                        >
                          <Heart
                            className={`w-4 h-4 transition-colors ${isSaved ? "fill-red-500 text-red-500" : "text-slate-300 group-hover/btn:text-red-400"}`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <motion.div
                  key="empty-viewed-jobs"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl border border-slate-100 shadow-sm p-20 text-center space-y-6"
                >
                  <div className="w-20 h-20 mx-auto rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center">
                    <Eye className="w-9 h-9 text-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <h3 style={{ fontFamily: "'Inter', sans-serif" }} className="text-2xl font-bold text-slate-900">
                      Chưa xem việc làm nào
                    </h3>
                    <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
                      Lịch sử xem sẽ giúp bạn lưu lại hành trình tìm kiếm.
                    </p>
                  </div>
                  <Link href="/jobs"
                    className="inline-flex items-center gap-2 px-8 py-3 bg-slate-900 text-white text-sm font-bold rounded-2xl hover:bg-[#1e60ad] transition-all shadow-lg group/cta">
                    Bắt đầu tìm kiếm <ArrowRight className="w-4 h-4 group-hover/cta:translate-x-0.5" />
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </ProfilePageShell>
  );
}
