"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Bookmark, Search, ArrowRight, Heart, Building2,
  MapPin, DollarSign, Trash2, ExternalLink, Clock, X
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { ProfileSidebar } from "@/components/candidates/ProfileSidebar";
import { motion, AnimatePresence } from "framer-motion";
import { formatSalary } from "@/lib/utils";
import toast from "react-hot-toast";
import { useConfirm } from "@/components/ConfirmDialog";

interface SavedJob {
  jobPostingId: string;
  title: string;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  locationCity: string | null;
  createdAt: string;
  company: {
    companyName: string;
    logo: string | null;
  };
}

export default function SavedJobsPage() {
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const confirm = useConfirm();

  const fetchSavedJobs = async () => {
    try {
      const { data } = await api.get("/favorites/me");
      setSavedJobs(data);
    } catch (error) {
      console.error("Error fetching saved jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSavedJobs(); }, []);

  const handleUnsave = async (jobId: string) => {
    const ok = await confirm({
      title: "Xóa khỏi danh sách đã lưu?",
      message: "Bạn có chắc muốn bỏ lưu việc làm này không?",
      confirmText: "Xóa",
      variant: "danger",
    });
    if (!ok) return;
    setRemovingId(jobId);
    try {
      await api.delete(`/favorites/${jobId}`);
      setSavedJobs(prev => prev.filter(job => job.jobPostingId !== jobId));
      toast.success("Đã xóa khỏi danh sách đã lưu.");
    } catch {
      toast.error("Không thể xóa.");
    } finally {
      setRemovingId(null);
    }
  };

  const filteredJobs = useMemo(() =>
    savedJobs.filter(job =>
      !searchTerm ||
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.companyName.toLowerCase().includes(searchTerm.toLowerCase())
    ), [savedJobs, searchTerm]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] pt-32 pb-12 flex flex-col items-center justify-center gap-4"
        style={{ fontFamily: "'DM Sans', sans-serif" }}>
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

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 px-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,700;1,9..144,400;1,9..144,600&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');`}</style>

      <div className="max-w-[1300px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          <aside className="lg:col-span-3">
            <ProfileSidebar />
          </aside>

          <main className="lg:col-span-9 space-y-7">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
              <div>
                <p className="text-[10px] font-bold tracking-[0.3em] text-slate-400 uppercase mb-2">Bộ sưu tập</p>
                <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700 }}
                  className="text-4xl text-slate-900 leading-none">
                  Việc làm <em className="text-rose-500">đã lưu</em>
                </h1>
                <p className="text-sm text-slate-400 mt-2 font-medium">
                  {savedJobs.length} việc làm được lưu trữ
                </p>
              </div>

              {/* Search */}
              <div className="relative flex-shrink-0">
                <Search className="w-4 h-4 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm trong danh sách đã lưu..."
                  className="pl-11 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-sm w-72 focus:border-rose-300 focus:outline-none transition-all shadow-sm placeholder-slate-300"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Jobs Grid */}
            <AnimatePresence mode="popLayout">
              {filteredJobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredJobs.map((job, idx) => (
                    <motion.div
                      key={job.jobPostingId}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.94 }}
                      transition={{ duration: 0.2, delay: Math.min(idx * 0.04, 0.2) }}
                      layout
                      className="group relative bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-rose-100 transition-all duration-300 overflow-hidden flex flex-col"
                    >
                      {/* Rose top accent */}
                      <div className="h-[3px] bg-gradient-to-r from-rose-400 via-rose-500 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute top-0 left-0 right-0" />

                      <div className="p-5 flex-1 flex flex-col">
                        {/* Top row: logo + unsave */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center p-2 flex-shrink-0">
                            {job.company.logo ? (
                              <img src={job.company.logo} alt="" className="max-w-full max-h-full object-contain" />
                            ) : (
                              <Building2 className="w-6 h-6 text-slate-200" />
                            )}
                          </div>
                          <button
                            onClick={() => handleUnsave(job.jobPostingId)}
                            disabled={removingId === job.jobPostingId}
                            className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-200 hover:text-rose-400 hover:bg-rose-50 transition-all group/del">
                            {removingId === job.jobPostingId ? (
                              <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                                className="w-4 h-4 border-2 border-rose-200 border-t-rose-400 rounded-full" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>

                        {/* Job info */}
                        <div className="flex-1">
                          <p className="text-xs font-bold text-slate-400 mb-1">{job.company.companyName}</p>
                          <Link href={`/jobs/${job.jobPostingId}`}
                            className="font-bold text-slate-900 text-[15px] leading-snug hover:text-blue-600 transition-colors block line-clamp-2 group-hover:text-blue-600">
                            {job.title}
                          </Link>

                          <div className="mt-3 space-y-1.5">
                            {(job.salaryMin || job.salaryMax) && (
                              <div className="flex items-center gap-1.5 text-[12px] font-semibold text-emerald-600">
                                <DollarSign className="w-3.5 h-3.5 flex-shrink-0" />
                                {formatSalary(job.salaryMin || 0, job.salaryMax || 0, job.currency || "VND")}
                              </div>
                            )}
                            {job.locationCity && (
                              <div className="flex items-center gap-1.5 text-[12px] font-medium text-slate-400">
                                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                {job.locationCity}
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-300">
                              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                              Lưu {new Date(job.createdAt).toLocaleDateString('vi-VN')}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-4 pt-3.5 border-t border-slate-50 flex items-center gap-2">
                          <Link href={`/jobs/${job.jobPostingId}`}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-900 hover:bg-blue-600 text-white text-[11px] font-bold rounded-xl transition-all shadow-sm group/cta">
                            Xem chi tiết
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                          <Link href={`/jobs/${job.jobPostingId}?apply=true`}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[11px] font-bold rounded-xl border border-rose-100 transition-all">
                            <Heart className="w-3 h-3" />
                            Ứng tuyển
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div
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
                    <h3 style={{ fontFamily: "'Fraunces', serif" }} className="text-2xl font-bold text-slate-900">
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
                      className="inline-flex items-center gap-2 px-8 py-3 bg-slate-900 text-white text-sm font-bold rounded-2xl hover:bg-rose-500 transition-all shadow-lg group/cta">
                      Khám phá việc làm
                      <ArrowRight className="w-4 h-4 transition-transform group-hover/cta:translate-x-0.5" />
                    </Link>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}
