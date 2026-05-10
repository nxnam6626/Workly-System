"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Bookmark, Search, ArrowRight, Building2, Trash2, SendHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ProfilePageShell, ProfileSearchBar } from "@/components/candidates/ProfilePageShell";
import { motion, AnimatePresence } from "framer-motion";
import { formatSalary } from "@/lib/utils";
import toast from "react-hot-toast";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useFavoriteStore } from "@/stores/favorites";

interface SavedJob {
  jobPostingId: string;
  title: string;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  locationCity: string | null;
  createdAt: string;
  jobType?: string;
  slug?: string | null;
  company: {
    companyName: string;
    logo: string | null;
  };
}

export default function SavedJobsPage() {
  const router = useRouter();
  const { favorites, isLoading, fetchFavorites, toggleFavorite } = useFavoriteStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"NEWEST" | "OLDEST">("NEWEST");
  const confirm = useConfirm();

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const handleUnsave = async (job: any) => {
    const ok = await confirm({
      title: "Xóa khỏi danh sách đã lưu?",
      message: "Bạn có chắc muốn bỏ lưu việc làm này không?",
      confirmText: "Xóa",
      variant: "danger",
    });
    if (!ok) return;
    setRemovingId(job.jobPostingId);
    try {
      await toggleFavorite(job);
      toast.success("Đã xóa khỏi danh sách đã lưu.");
    } catch {
      toast.error("Không thể xóa.");
    } finally {
      setRemovingId(null);
    }
  };

  const filteredJobs = useMemo(() => {
    let result = favorites.filter(job =>
      !searchTerm ||
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.companyName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return [...result].sort((a, b) => {
      const dateA = new Date(a.createdAt || "").getTime();
      const dateB = new Date(b.createdAt || "").getTime();
      return sortBy === "NEWEST" ? dateB - dateA : dateA - dateB;
    });
  }, [favorites, searchTerm, sortBy]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getJobTypeLabel = (type?: string | null) => {
    const map: Record<string, string> = {
      FULLTIME: "Toàn thời gian",
      PARTTIME: "Bán thời gian",
      REMOTE: "Từ xa",
    };
    return type ? (map[type] ?? type) : "Toàn thời gian";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] pt-32 pb-12 flex flex-col items-center justify-center gap-4"
        style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <motion.div key={i} className="w-2 h-2 bg-slate-300 rounded-full"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 0.6, delay: i * 0.1, repeat: Infinity }} />
          ))}
        </div>
        <p className="text-slate-400 text-sm font-medium">Đang tải danh sách đã lưu...</p>
      </div>
    );
  }

  const customTitle = (
    <div className="space-y-4">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-slate-500 text-[12px] font-medium">
        <Link href="/" className="hover:text-[#1e60ad] transition-colors">Trang chủ</Link>
        <span>/</span>
        <Link href="/profile" className="hover:text-[#1e60ad] transition-colors">Quản lý hồ sơ</Link>
        <span>/</span>
        <span className="text-slate-400">Việc làm đã lưu</span>
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">
        Việc làm đã lưu
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
          placeholder="Tìm trong danh sách đã lưu..."
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

        {/* Jobs List */}
        <AnimatePresence mode="popLayout">
          {filteredJobs.length > 0 ? (
            <div key="saved-jobs-grid" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredJobs.map((job) => (
                <div
                  key={job.jobPostingId}
                  onClick={() => router.push(`/jobs/${job.slug || job.jobPostingId}`)}
                  className="group relative bg-white rounded-xl border border-slate-100 p-4 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[160px]"
                >
                  {/* Top content */}
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

                    {/* Job Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-extrabold text-slate-900 text-[14px] leading-snug line-clamp-2 group-hover:text-[#1e60ad] transition-colors pr-6">
                        {job.title}
                      </h3>
                      {/* Tags */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="px-2 py-0.5 bg-blue-50/60 text-[#1e60ad] rounded text-[10px] font-bold">
                          {job.locationCity || "Toàn quốc"}
                        </span>
                        <span className="px-2 py-0.5 bg-blue-50/60 text-[#1e60ad] rounded text-[10px] font-bold">
                          {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
                        </span>
                        <span className="px-2 py-0.5 bg-blue-50/60 text-[#1e60ad] rounded text-[10px] font-bold">
                          {formatDate(job.createdAt)}
                        </span>
                        <span className="px-2 py-0.5 bg-blue-50/60 text-[#1e60ad] rounded text-[10px] font-bold">
                          {getJobTypeLabel(job.jobType)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom details */}
                  <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-[12px] text-slate-500 font-bold">
                      Ngày lưu: {formatDate(job.createdAt)}
                    </span>
                    <div className="flex items-center gap-2">
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
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleUnsave(job);
                        }}
                        disabled={removingId === job.jobPostingId}
                        className="w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 text-red-500 border border-red-100 flex items-center justify-center transition-colors shrink-0"
                        title="Bỏ lưu"
                      >
                        {removingId === job.jobPostingId ? (
                          <span className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              key="empty-saved-jobs"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm p-20 text-center space-y-6"
            >
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 bg-rose-50 rounded-2xl animate-pulse" />
                <div className="relative w-full h-full bg-white border-2 border-dashed border-rose-200 rounded-2xl flex items-center justify-center">
                  <Bookmark className="w-9 h-9 text-rose-200" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 style={{ fontFamily: "'Inter', sans-serif" }} className="text-2xl font-bold text-slate-900">
                  {searchTerm ? "Không tìm thấy kết quả" : "Danh sách đã lưu trống"}
                </h3>
                <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
                  {searchTerm
                    ? "Thử từ khóa khác."
                    : "Lưu lại những việc làm thú vị để ứng tuyển bất cứ lúc nào."}
                </p>
              </div>
              {!searchTerm && (
                <Link href="/jobs"
                  className="inline-flex items-center gap-2 px-8 py-3 bg-slate-900 text-white text-sm font-bold rounded-2xl hover:bg-[#1e60ad] transition-all shadow-lg group/cta">
                  Khám phá việc làm
                  <ArrowRight className="w-4 h-4 transition-transform group-hover/cta:translate-x-0.5" />
                </Link>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ProfilePageShell>
  );
}
