"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Briefcase, Building2, Calendar, ChevronRight, Clock,
  DollarSign, FileText, MapPin, Search, ArrowRight,
  Sparkles, ExternalLink, CheckCircle2, XCircle, Eye,
  Timer, Star, TrendingUp, X
} from "lucide-react";
import api, { getFileUrl } from "@/lib/api";
import Link from "next/link";
import { formatSalary } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { useSocketStore } from "@/stores/socket";
import toast from "react-hot-toast";
import { useConfirm } from "@/components/ConfirmDialog";
import { ProfileSidebar } from "@/components/candidates/ProfileSidebar";
import { AppliedJobsPageSkeleton } from "@/components/candidates/AppliedJobSkeleton";
import { motion, AnimatePresence } from "framer-motion";

interface AppliedJob {
  applicationId: string;
  jobPostingId: string;
  applyDate: string;
  appStatus: string;
  cvSnapshotUrl: string;
  interviewDate?: string;
  interviewTime?: string;
  interviewLocation?: string;
  jobPosting: {
    title: string;
    salaryMin: number;
    salaryMax: number;
    currency: string;
    locationCity: string;
    company: { companyName: string; logo: string | null };
  };
}

const STATUS_CONFIG: Record<string, {
  label: string;
  icon: React.ElementType;
  accentColor: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  badgeBg: string;
  step: number;
}> = {
  PENDING: {
    label: "Đang chờ xét duyệt", icon: Timer,
    accentColor: "#F59E0B", bgColor: "#FFFBEB", textColor: "#92400E",
    borderColor: "#FDE68A", badgeBg: "bg-amber-50", step: 1,
  },
  REVIEWED: {
    label: "Đã xem hồ sơ", icon: Eye,
    accentColor: "#3B82F6", bgColor: "#EFF6FF", textColor: "#1E40AF",
    borderColor: "#BFDBFE", badgeBg: "bg-blue-50", step: 2,
  },
  SHORTLISTED: {
    label: "Vào vòng tiếp theo", icon: Star,
    accentColor: "#6366F1", bgColor: "#EEF2FF", textColor: "#3730A3",
    borderColor: "#C7D2FE", badgeBg: "bg-indigo-50", step: 3,
  },
  INTERVIEWING: {
    label: "Đang phỏng vấn", icon: Sparkles,
    accentColor: "#8B5CF6", bgColor: "#F5F3FF", textColor: "#5B21B6",
    borderColor: "#DDD6FE", badgeBg: "bg-violet-50", step: 4,
  },
  ACCEPTED: {
    label: "Được tuyển dụng 🎉", icon: CheckCircle2,
    accentColor: "#10B981", bgColor: "#ECFDF5", textColor: "#064E3B",
    borderColor: "#A7F3D0", badgeBg: "bg-emerald-50", step: 5,
  },
  REJECTED: {
    label: "Không phù hợp", icon: XCircle,
    accentColor: "#EF4444", bgColor: "#FEF2F2", textColor: "#7F1D1D",
    borderColor: "#FECACA", badgeBg: "bg-red-50", step: 0,
  },
};

const FILTERS = ["Tất cả", "Đang chờ", "Đã xem", "Tiềm năng", "Phỏng vấn", "Đã tuyển", "Từ chối"];
const FILTER_TO_STATUS: Record<string, string | null> = {
  "Tất cả": null, "Đang chờ": "PENDING", "Đã xem": "REVIEWED",
  "Tiềm năng": "SHORTLISTED", "Phỏng vấn": "INTERVIEWING",
  "Đã tuyển": "ACCEPTED", "Từ chối": "REJECTED",
};

export default function AppliedJobsPage() {
  const [applications, setApplications] = useState<AppliedJob[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("Tất cả");
  const { accessToken } = useAuthStore();
  const { socket } = useSocketStore();
  const confirm = useConfirm();

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setInitialLoading(true);
    try {
      const res = await api.get("/applications/me");
      setApplications(res.data);
    } catch (error) {
      console.error("Error fetching applied jobs:", error);
    } finally {
      if (!isSilent) setInitialLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [accessToken, fetchData]);

  useEffect(() => {
    if (!socket) return;
    socket.on('notification', () => fetchData(true));
    return () => { socket.off('notification'); };
  }, [socket, fetchData]);

  const handleCancelApplication = async (applicationId: string) => {
    const ok = await confirm({
      title: 'Hủy đơn ứng tuyển?',
      message: 'Bạn có chắc chắn muốn hủy đơn ứng tuyển này?',
      confirmText: 'Hủy ứng tuyển',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api.delete(`/applications/${applicationId}`);
      setApplications(prev => prev.filter(app => app.applicationId !== applicationId));
      toast.success('Đã hủy ứng tuyển.');
    } catch {
      toast.error('Không thể hủy đơn ứng tuyển.');
    }
  };

  const filteredApps = useMemo(() => {
    const statusFilter = FILTER_TO_STATUS[activeFilter];
    return applications.filter(app => {
      const matchSearch = !searchTerm ||
        app.jobPosting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.jobPosting.company.companyName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchFilter = !statusFilter || app.appStatus === statusFilter;
      return matchSearch && matchFilter;
    });
  }, [applications, searchTerm, activeFilter]);

  // Status count for filter badges
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    applications.forEach(app => {
      counts[app.appStatus] = (counts[app.appStatus] || 0) + 1;
    });
    return counts;
  }, [applications]);

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 px-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,700;1,9..144,400;1,9..144,600&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');`}</style>

      <div className="max-w-[1300px] mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          <aside className="lg:col-span-3">
            <ProfileSidebar />
          </aside>

          <main className="lg:col-span-9 space-y-7">

            {/* Header */}
            <div>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
                <div>
                  <p className="text-[10px] font-bold tracking-[0.3em] text-slate-400 uppercase mb-2">Hồ sơ ứng tuyển</p>
                  <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700 }}
                    className="text-4xl text-slate-900 leading-none">
                    Việc làm <em className="text-blue-600">ứng tuyển</em>
                  </h1>
                  <p className="text-sm text-slate-400 mt-2 font-medium">
                    {applications.length} đơn ứng tuyển • Cập nhật theo thời gian thực
                  </p>
                </div>

                {/* Search */}
                <div className="relative flex-shrink-0">
                  <Search className="w-4 h-4 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm theo tên việc, công ty..."
                    className="pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm w-72 focus:border-blue-400 focus:outline-none transition-all shadow-sm placeholder-slate-300"
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

              {/* Filter chips */}
              <div className="flex items-center gap-2 mt-5 flex-wrap">
                {FILTERS.map(f => {
                  const statusKey = FILTER_TO_STATUS[f];
                  const count = statusKey ? (statusCounts[statusKey] || 0) : applications.length;
                  const isActive = activeFilter === f;
                  return (
                    <button key={f} onClick={() => setActiveFilter(f)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                        isActive
                          ? "bg-slate-900 text-white border-slate-900 shadow-lg"
                          : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700"
                      }`}>
                      {f}
                      {count > 0 && (
                        <span className={`text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center ${
                          isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                        }`}>{count}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* List */}
            <div className="space-y-3">
              {initialLoading ? (
                <AppliedJobsPageSkeleton />
              ) : (
                <AnimatePresence mode="popLayout" initial={false}>
                  {filteredApps.length > 0 ? (
                    filteredApps.map((app, idx) => {
                      const status = STATUS_CONFIG[app.appStatus] || STATUS_CONFIG.PENDING;
                      const StatusIcon = status.icon;
                      return (
                        <motion.div
                          key={app.applicationId}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.96 }}
                          transition={{ duration: 0.22, delay: Math.min(idx * 0.04, 0.25) }}
                          className="group relative bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-slate-200 transition-all duration-300 overflow-hidden"
                        >
                          {/* Left status accent bar */}
                          <div className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-300"
                            style={{ backgroundColor: status.accentColor }} />

                          <div className="pl-6 pr-6 py-5">
                            <div className="flex gap-4 items-start">
                              {/* Logo */}
                              <div className="w-14 h-14 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center p-2 shrink-0 mt-0.5">
                                {app.jobPosting.company.logo ? (
                                  <img src={app.jobPosting.company.logo} alt="" className="max-w-full max-h-full object-contain" />
                                ) : (
                                  <Building2 className="w-7 h-7 text-slate-200" />
                                )}
                              </div>

                              {/* Main info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <Link href={`/jobs/${app.jobPostingId}`}
                                      className="font-bold text-slate-900 text-base hover:text-blue-600 transition-colors block leading-snug truncate pr-2 group-hover:text-blue-600">
                                      {app.jobPosting.title}
                                    </Link>
                                    <p className="text-sm text-slate-400 font-medium mt-0.5 flex items-center gap-1.5">
                                      <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                                      {app.jobPosting.company.companyName}
                                    </p>
                                  </div>

                                  {/* Status badge */}
                                  <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold"
                                    style={{
                                      backgroundColor: status.bgColor,
                                      color: status.textColor,
                                      borderColor: status.borderColor,
                                    }}>
                                    <StatusIcon className="w-3.5 h-3.5" />
                                    {status.label}
                                  </div>
                                </div>

                                {/* Meta row */}
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-[12px] font-semibold text-slate-400">
                                  <span className="flex items-center gap-1.5 text-emerald-600">
                                    <DollarSign className="w-3.5 h-3.5" />
                                    {formatSalary(app.jobPosting.salaryMin, app.jobPosting.salaryMax, app.jobPosting.currency)}
                                  </span>
                                  <span className="flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {app.jobPosting.locationCity}
                                  </span>
                                  <span className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5" />
                                    Nộp {new Date(app.applyDate).toLocaleDateString('vi-VN')}
                                  </span>
                                </div>

                                {/* Interview Info */}
                                {app.appStatus === 'INTERVIEWING' && (
                                  <div className="mt-3 flex items-center gap-3 px-4 py-3 rounded-xl border"
                                    style={{ backgroundColor: "#F5F3FF", borderColor: "#DDD6FE" }}>
                                    <Sparkles className="w-4 h-4 text-violet-600 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[12px] font-bold text-violet-800">Lịch phỏng vấn</p>
                                      <p className="text-[11px] text-violet-600 font-medium">
                                        {app.interviewTime} · {app.interviewDate ? new Date(app.interviewDate).toLocaleDateString('vi-VN') : '—'}
                                        {app.interviewLocation && ` · ${app.interviewLocation}`}
                                      </p>
                                    </div>
                                    <button className="flex-shrink-0 px-3 py-1.5 bg-violet-600 text-white text-[10px] font-black rounded-lg hover:bg-violet-700 uppercase tracking-wide transition-all">
                                      Tham gia
                                    </button>
                                  </div>
                                )}

                                {/* Footer actions */}
                                <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
                                  <a href={getFileUrl(app.cvSnapshotUrl)} target="_blank" rel="noreferrer"
                                    className="text-[11px] text-blue-500 font-bold hover:text-blue-700 flex items-center gap-1 transition-colors">
                                    <FileText className="w-3.5 h-3.5" />
                                    Xem hồ sơ đã nộp
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                  <div className="flex items-center gap-2">
                                    {app.appStatus === 'PENDING' && (
                                      <button onClick={() => handleCancelApplication(app.applicationId)}
                                        className="text-[11px] font-bold text-slate-300 hover:text-red-400 transition-colors px-2 py-1">
                                        Hủy đơn
                                      </button>
                                    )}
                                    <Link href={`/jobs/${app.jobPostingId}`}
                                      className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 text-white text-[11px] font-bold rounded-lg hover:bg-blue-600 transition-all group/btn shadow-sm">
                                      Xem chi tiết
                                      <ChevronRight className="w-3 h-3 transition-transform group-hover/btn:translate-x-0.5" />
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-3xl border border-slate-100 shadow-sm p-20 text-center space-y-6"
                    >
                      <div className="w-20 h-20 mx-auto rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center">
                        <Briefcase className="w-9 h-9 text-slate-200" />
                      </div>
                      <div className="space-y-2">
                        <h3 style={{ fontFamily: "'Fraunces', serif" }} className="text-2xl font-bold text-slate-900">
                          {searchTerm || activeFilter !== "Tất cả"
                            ? "Không tìm thấy kết quả"
                            : "Chưa có đơn ứng tuyển nào"}
                        </h3>
                        <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
                          {searchTerm || activeFilter !== "Tất cả"
                            ? "Thử thay đổi từ khóa hoặc bộ lọc khác."
                            : "Hãy bắt đầu hành trình sự nghiệp bằng cách ứng tuyển vào những vị trí phù hợp!"}
                        </p>
                      </div>
                      {!searchTerm && activeFilter === "Tất cả" && (
                        <Link href="/jobs"
                          className="inline-flex items-center gap-2 px-8 py-3 bg-slate-900 text-white text-sm font-bold rounded-2xl hover:bg-blue-600 transition-all shadow-lg group/cta">
                          Khám phá việc làm
                          <ArrowRight className="w-4 h-4 transition-transform group-hover/cta:translate-x-0.5" />
                        </Link>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
