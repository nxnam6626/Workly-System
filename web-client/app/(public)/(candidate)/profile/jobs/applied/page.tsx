"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Briefcase, Building2, Calendar, ChevronRight, Clock,
  DollarSign, FileText, MapPin, ArrowRight,
  Sparkles, ExternalLink, CheckCircle2, XCircle, Eye,
  Timer, Star, TrendingUp, Heart, MessageSquare, MoreVertical
} from "lucide-react";
import api, { getFileUrl } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatSalary } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { useSocketStore } from "@/stores/socket";
import toast from "react-hot-toast";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { ProfilePageShell, ProfileSearchBar } from "@/components/candidates/ProfilePageShell";
import { AppliedJobsPageSkeleton } from "@/components/candidates/AppliedJobSkeleton";
import { motion, AnimatePresence } from "framer-motion";
import { useFavoriteStore } from "@/stores/favorites";

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
    createdAt?: string;
    jobLevel?: string;
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
  INTERVIEWING: {
    label: "Mới phỏng vấn", icon: Sparkles,
    accentColor: "#8B5CF6", bgColor: "#F5F3FF", textColor: "#5B21B6",
    borderColor: "#DDD6FE", badgeBg: "bg-violet-50", step: 3,
  },
  INTERVIEW_CONFIRMED: {
    label: "Xác nhận phỏng vấn", icon: CheckCircle2,
    accentColor: "#10B981", bgColor: "#ECFDF5", textColor: "#064E3B",
    borderColor: "#A7F3D0", badgeBg: "bg-emerald-50", step: 4,
  },
  RESCHEDULE_REQUESTED: {
    label: "Yêu cầu dời lịch phỏng vấn", icon: Clock,
    accentColor: "#EF4444", bgColor: "#FEF2F2", textColor: "#7F1D1D",
    borderColor: "#FECACA", badgeBg: "bg-red-50", step: 3,
  },
  ACCEPTED: {
    label: "Được tuyển dụng 🎉", icon: CheckCircle2,
    accentColor: "#10B981", bgColor: "#ECFDF5", textColor: "#064E3B",
    borderColor: "#A7F3D0", badgeBg: "bg-emerald-50", step: 5,
  },
  REJECTED: {
    label: "Không phù hợp", icon: XCircle,
    accentColor: "#71717A", bgColor: "#F4F4F5", textColor: "#27272A",
    borderColor: "#E4E4E7", badgeBg: "bg-zinc-50", step: 0,
  },
};

const FILTERS = ["Tất cả", "Đang chờ", "Đang xử lý", "Đã tuyển", "Từ chối"];

const FILTER_TO_STATUS: Record<string, string[] | null> = {
  "Tất cả": null,
  "Đang chờ": ["PENDING"],
  "Đang xử lý": ["REVIEWED", "INTERVIEWING", "INTERVIEW_CONFIRMED", "RESCHEDULE_REQUESTED"],
  "Đã tuyển": ["ACCEPTED"],
  "Từ chối": ["REJECTED"],
};


export default function AppliedJobsPage() {
  const router = useRouter();
  const { favoriteIds, toggleFavorite } = useFavoriteStore();
  const [applications, setApplications] = useState<AppliedJob[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("Tất cả");
  const [activeKebabId, setActiveKebabId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"NEWEST" | "OLDEST">("NEWEST");
  const { accessToken } = useAuthStore();
  const { socket } = useSocketStore();
  const confirm = useConfirm();

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setInitialLoading(true);
    try {
      const { data } = await api.get('/applications/me');
      setApplications(data || []);
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast.error("Không thể tải danh sách đơn ứng tuyển.");
    } finally {
      if (!isSilent) setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [accessToken, fetchData]);

  useEffect(() => {
    if (!socket) return;
    socket.on('notification', () => fetchData(true));
    return () => { socket.off('notification'); };
  }, [socket, fetchData]);

  const handleCancelApplication = useCallback(async (applicationId: string) => {
    const ok = await confirm({
      title: 'Hủy đơn ứng tuyển?',
      message: 'Bạn có chắc chắn muốn hủy đơn ứng tuyển này? Hành động này không thể hoàn tác.',
      confirmText: 'Hủy ứng tuyển',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api.delete(`/applications/${applicationId}`);
      setApplications(prev => prev.filter(app => app.applicationId !== applicationId));
      toast.success('Đã hủy đơn ứng tuyển thành công.');
    } catch {
      toast.error('Không thể hủy đơn ứng tuyển.');
    }
  }, [confirm]);

  const handleToggleSave = useCallback((jobId: string, jobPosting: any) => {
    toggleFavorite({
      jobPostingId: jobId,
      ...jobPosting
    });
  }, [toggleFavorite]);

  const filteredApplications = useMemo(() => {
    const statusFilter = FILTER_TO_STATUS[activeFilter];
    const result = applications.filter(app => {
      const matchSearch = !searchTerm ||
        app.jobPosting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.jobPosting.company.companyName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchFilter = !statusFilter || statusFilter.includes(app.appStatus);
      return matchSearch && matchFilter;
    });
    return [...result].sort((a, b) => {
      const dateA = new Date(a.applyDate).getTime();
      const dateB = new Date(b.applyDate).getTime();
      return sortBy === "NEWEST" ? dateB - dateA : dateA - dateB;
    });
  }, [applications, searchTerm, activeFilter, sortBy]);

  // Status counts for filter badges
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    applications.forEach(app => {
      counts[app.appStatus] = (counts[app.appStatus] || 0) + 1;
    });
    return counts;
  }, [applications]);

  const customTitle = (
    <div className="space-y-4">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-slate-500 text-[12px] font-medium">
        <Link href="/" className="hover:text-[#1e60ad] transition-colors">Trang chủ</Link>
        <span>/</span>
        <Link href="/profile" className="hover:text-[#1e60ad] transition-colors">Quản lý hồ sơ</Link>
        <span>/</span>
        <span className="text-slate-400">Việc làm đã ứng tuyển</span>
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">
        Việc làm đã ứng tuyển
      </h1>
    </div>
  );

  return (
    <ProfilePageShell
      title={customTitle}
      subtitle=""
      action={
        <ProfileSearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Tìm theo tên việc, công ty..."
          accentColor="focus:border-[#1e60ad]"
        />
      }
      filters={
        <>
          {FILTERS.map(f => {
            const statusList = FILTER_TO_STATUS[f];
            const count = statusList
              ? statusList.reduce((acc, sKey) => acc + (statusCounts[sKey] || 0), 0)
              : applications.length;
            const isActive = activeFilter === f;
            return (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
                }`}
              >
                {f}
                {count > 0 && (
                  <span
                    className={`text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </>
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
            {filteredApplications.length} kết quả phù hợp
          </span>
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="popLayout" initial={false}>
            {initialLoading ? (
              <AppliedJobsPageSkeleton />
            ) : filteredApplications.length > 0 ? (
              <div key="applied-jobs-list" className="space-y-4">
                {filteredApplications.map((app) => {
                  const status = STATUS_CONFIG[app.appStatus] || STATUS_CONFIG.PENDING;
                  const StatusIcon = status.icon;

                  return (
                    <div
                      key={app.applicationId}
                      className="group relative bg-white rounded-2xl border border-slate-100 p-5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-5 overflow-visible"
                    >
                      {/* Left Block: Logo, Title, Status, Company, Location & Salary badges */}
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        {/* Company Logo */}
                        <div className="w-[52px] h-[52px] rounded-xl border border-slate-100 flex items-center justify-center shrink-0 bg-white p-1 shadow-sm overflow-hidden group-hover:scale-105 transition-transform duration-200">
                          {app.jobPosting.company?.logo ? (
                            <img
                              src={getFileUrl(app.jobPosting.company.logo)}
                              alt={app.jobPosting.company.companyName}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <Building2 className="w-6 h-6 text-slate-300" />
                          )}
                        </div>

                        {/* Text details */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-extrabold text-slate-900 text-[15px] sm:text-[16px] leading-snug hover:text-[#1e60ad] transition-colors cursor-pointer truncate" onClick={() => router.push(`/jobs/${app.jobPostingId}`)}>
                              {app.jobPosting.title}
                            </h3>
                            
                            {/* Status badge - Matching reference photo exactly */}
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold shrink-0 select-none bg-[#EFF6FF] text-[#1e60ad]">
                              <StatusIcon className="w-3.5 h-3.5 text-[#1e60ad]" />
                              {status.label}
                            </span>
                          </div>

                          {/* Company Name and Job Posting Date with a sleek bullet separator */}
                          <p className="text-[#64748B] text-[11px] font-bold tracking-wide uppercase flex flex-wrap items-center gap-1.5">
                            <span>{app.jobPosting.company?.companyName ? app.jobPosting.company.companyName.toUpperCase() : ""}</span>
                            {app.jobPosting.createdAt && (
                              <>
                                <span className="text-slate-300 font-normal select-none">•</span>
                                <span className="text-[#64748B] font-semibold text-[10px] normal-case bg-slate-50 border border-slate-100/50 px-1.5 py-0.2 rounded-md">
                                  Đăng ngày: {new Date(app.jobPosting.createdAt).toLocaleDateString('vi-VN')}
                                </span>
                              </>
                            )}
                          </p>

                          {/* Location, Salary and Job Level (Vị trí công việc) badges with matching styles */}
                          <div className="flex flex-wrap items-center gap-2 pt-0.5">
                            <span className="text-[#1e60ad] bg-[#EBF5FF] px-2 py-0.5 rounded font-bold text-[11px]">
                              {app.jobPosting.locationCity || "Toàn quốc"}
                            </span>
                            <span className="text-[#1e60ad] bg-[#EBF5FF] px-2 py-0.5 rounded font-bold text-[11px]">
                              {formatSalary(app.jobPosting.salaryMin, app.jobPosting.salaryMax, app.jobPosting.currency)}
                            </span>
                            {app.jobPosting.jobLevel && (
                              <span className="text-[#1e60ad] bg-[#EBF5FF] px-2 py-0.5 rounded font-bold text-[11px]">
                                {app.jobPosting.jobLevel}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Middle Block: More / Kebab dropdown menu */}
                      <div className="relative shrink-0 self-center">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setActiveKebabId(activeKebabId === app.applicationId ? null : app.applicationId);
                          }}
                          className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors flex items-center justify-center w-8 h-8"
                        >
                          <MoreVertical className="w-4 h-4 text-slate-400" />
                        </button>

                        {activeKebabId === app.applicationId && (
                          <>
                            {/* Backdrop overlay to close kebab when clicking outside */}
                            <div
                              className="fixed inset-0 z-20"
                              onClick={() => setActiveKebabId(null)}
                            />
                            
                            <div className="absolute right-0 md:left-1/2 md:-translate-x-1/2 mt-2 w-52 bg-white border border-slate-100 rounded-xl shadow-xl py-1 z-30 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                              <button
                                onClick={() => {
                                  setActiveKebabId(null);
                                  router.push(`/jobs/${app.jobPostingId}`);
                                }}
                                className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#1e60ad] transition-colors flex items-center gap-2"
                              >
                                <Briefcase className="w-3.5 h-3.5" />
                                Xem tin tuyển dụng gốc
                              </button>

                              {app.appStatus === 'PENDING' && (
                                <button
                                  onClick={() => {
                                    setActiveKebabId(null);
                                    handleCancelApplication(app.applicationId);
                                  }}
                                  className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 border-t border-slate-50"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  Hủy đơn ứng tuyển
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Right Block: CV box with Date & Chat - Exactly matching reference photo */}
                      <div className="bg-[#F1F7FC] border border-slate-100 p-4 rounded-xl flex items-center justify-between gap-5 min-w-[280px] md:max-w-[340px] flex-1">
                        <div className="space-y-1 min-w-0 flex-1">
                          <span className="text-[11px] text-[#64748B] font-medium block">
                            CV đã ứng tuyển:
                          </span>
                          <a
                            href={getFileUrl(app.cvSnapshotUrl)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#1e60ad] hover:underline text-[12px] font-bold truncate block max-w-[160px]"
                            title="Xem hồ sơ đã ứng tuyển"
                          >
                            CV/Tài liệu - Xuân Nam Nguyễn
                          </a>
                          <span className="text-[11px] text-[#64748B] font-medium block">
                            Ngày ứng tuyển: {new Date(app.applyDate).toLocaleDateString('vi-VN')}
                          </span>
                        </div>

                        {/* Interactive Chat button matching photo exactly */}
                        <button
                          onClick={() => {
                            toast.success(`Đang kết nối chat trực tiếp với Nhà tuyển dụng ${app.jobPosting.company?.companyName || ""}...`);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-white border border-[#E2E8F0] hover:bg-slate-50 text-slate-500 hover:text-slate-700 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer shadow-sm"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                          Chat
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <motion.div
                key="empty-applied-jobs"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border border-slate-100 shadow-sm p-20 text-center space-y-6"
              >
                <div className="w-20 h-20 mx-auto rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center">
                  <Briefcase className="w-9 h-9 text-slate-200" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-slate-900">
                    {searchTerm || activeFilter !== 'Tất cả'
                      ? 'Không tìm thấy kết quả'
                      : 'Chưa có đơn ứng tuyển nào'}
                  </h3>
                  <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
                    {searchTerm || activeFilter !== 'Tất cả'
                      ? 'Thử thay đổi từ khóa hoặc bộ lọc khác.'
                      : 'Hãy bắt đầu hành trình sự nghiệp bằng cách ứng tuyển vào những vị trí phù hợp!'}
                  </p>
                </div>
                {!searchTerm && activeFilter === 'Tất cả' && (
                  <Link
                    href="/jobs"
                    className="inline-flex items-center gap-2 px-8 py-3 bg-slate-900 text-white text-sm font-bold rounded-2xl hover:bg-[#1e60ad] transition-all shadow-lg group/cta"
                  >
                    Khám phá việc làm
                    <ArrowRight className="w-4 h-4 transition-transform group-hover/cta:translate-x-0.5" />
                  </Link>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </ProfilePageShell>
  );
}
