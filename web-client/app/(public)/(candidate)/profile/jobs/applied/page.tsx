"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Briefcase,
  Building2,
  Calendar,
  ChevronRight,
  Clock,
  DollarSign,
  FileText,
  MapPin,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  ExternalLink
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
    company: {
      companyName: string;
      logo: string | null;
    };
  };
}

const STATUS_MAP: Record<string, { label: string, color: string, bg: string, ring: string }> = {
  PENDING: { label: "Ðang ch?", color: "text-amber-600", bg: "bg-amber-50", ring: "ring-amber-500/20" },
  REVIEWED: { label: "Ðã xem", color: "text-blue-600", bg: "bg-blue-50", ring: "ring-blue-500/20" },
  SHORTLISTED: { label: "Ti?m nang", color: "text-indigo-600", bg: "bg-indigo-50", ring: "ring-indigo-500/20" },
  INTERVIEWING: { label: "Ðang ph?ng v?n", color: "text-purple-600", bg: "bg-purple-50", ring: "ring-purple-500/20" },
  ACCEPTED: { label: "Ðã tuy?n", color: "text-green-600", bg: "bg-green-50", ring: "ring-green-500/20" },
  REJECTED: { label: "T? ch?i", color: "text-red-600", bg: "bg-red-50", ring: "ring-red-500/20" },
};

export default function AppliedJobsPage() {
  const [applications, setApplications] = useState<AppliedJob[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { accessToken } = useAuthStore();
  const { socket } = useSocketStore();
  const confirm = useConfirm();

  // Optimized fetch with separate initial status
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

  useEffect(() => {
    fetchData();
  }, [accessToken, fetchData]);

  useEffect(() => {
    if (!socket) return;
    socket.on('notification', () => fetchData(true));
    return () => {
      socket.off('notification');
    };
  }, [socket, fetchData]);

  const handleCancelApplication = async (applicationId: string) => {
    const ok = await confirm({
      title: 'H?y don ?ng tuy?n?',
      message: 'B?n có ch?c ch?n mu?n h?y don ?ng tuy?n này?',
      confirmText: 'H?y ?ng tuy?n',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await api.delete(`/applications/${applicationId}`);
      setApplications(prev => prev.filter(app => app.applicationId !== applicationId));
      toast.success('Ðã h?y ?ng tuy?n.');
    } catch (error: any) {
      toast.error('Không th? h?y don ?ng tuy?n.');
    }
  };

  // Performance Optimization: Memoized filter logic
  const filteredApps = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return applications.filter(app =>
      app.jobPosting.title.toLowerCase().includes(term) ||
      app.jobPosting.company.companyName.toLowerCase().includes(term)
    );
  }, [applications, searchTerm]);

  return (
    <div className="min-h-screen bg-[#fcfdfe] pt-24 pb-20 font-sans">
      <div className="max-w-6xl mx-auto px-4 lg:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar - Memoized via Component Wrapper */}
          <aside className="lg:col-span-1">
            <ProfileSidebar />
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-100">
              <div className="space-y-1">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Vi?c làm <span className="text-blue-600">?ng tuy?n</span></h1>
                <p className="text-sm text-slate-500 font-medium">Theo dõi hành trình chinh ph?c s? nghi?p c?a b?n.</p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm ki?m..."
                    className="pl-10 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl text-sm w-full md:w-64 focus:border-blue-600 outline-none transition-all shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button className="p-3 bg-white border border-slate-100 rounded-xl text-slate-500 hover:text-blue-600 transition-all shadow-sm">
                  <Filter className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Optimized List Rendering */}
            <div className="space-y-4">
              {initialLoading ? (
                <AppliedJobsPageSkeleton />
              ) : (
                <AnimatePresence mode="popLayout" initial={false}>
                  {filteredApps.length > 0 ? (
                    filteredApps.map((app, idx) => {
                      const status = STATUS_MAP[app.appStatus] || STATUS_MAP.PENDING;
                      return (
                        <motion.div
                          key={app.applicationId}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2, delay: Math.min(idx * 0.03, 0.3) }}
                          className="group relative bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all p-6 overflow-hidden"
                        >
                          <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                          
                          <div className="flex flex-col md:flex-row gap-6">
                            {/* Company Logo */}
                            <div className="w-20 h-20 rounded-2xl border border-slate-50 bg-slate-50/30 flex items-center justify-center p-4 shrink-0">
                              {app.jobPosting.company.logo ? (
                                <img src={app.jobPosting.company.logo} alt="" className="max-w-full max-h-full object-contain" />
                              ) : (
                                <Building2 className="w-10 h-10 text-slate-200" />
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0 space-y-4">
                              <div className="flex justify-between items-start gap-4">
                                <div className="space-y-1">
                                  <Link href={`/jobs/${app.jobPostingId}`} className="text-xl font-black text-slate-900 hover:text-blue-600 transition-colors block truncate pr-4">
                                    {app.jobPosting.title}
                                  </Link>
                                  <p className="text-sm font-bold text-slate-500 flex items-center gap-2">
                                    <Building2 className="w-3.5 h-3.5" />
                                    {app.jobPosting.company.companyName}
                                  </p>
                                </div>
                                <div className={`px-3 py-1.5 rounded-xl border-2 ring-4 ${status.ring} ${status.bg} ${status.color} text-[11px] font-black uppercase tracking-wider shrink-0`}>
                                  {status.label}
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-y-3 gap-x-6 text-[13px] font-bold text-slate-500">
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-lg group-hover:bg-blue-50/50 transition-colors">
                                  <DollarSign className="w-4 h-4 text-emerald-600" />
                                  <span className="text-emerald-600 font-black">
                                    {formatSalary(app.jobPosting.salaryMin, app.jobPosting.salaryMax, app.jobPosting.currency)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="w-4 h-4 text-slate-400" />
                                  <span>{app.jobPosting.locationCity}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="w-4 h-4 text-slate-400" />
                                  <span>{new Date(app.applyDate).toLocaleDateString('vi-VN')}</span>
                                </div>
                              </div>

                              {/* Interview Info */}
                              {app.appStatus === 'INTERVIEWING' && (
                                <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border border-purple-100/50 flex items-center justify-between gap-4">
                                  <div className="flex items-start gap-3 text-purple-700">
                                    <Sparkles className="w-5 h-5 text-purple-600" />
                                    <div>
                                      <p className="text-[13px] font-black leading-tight">L?ch ph?ng v?n s?p t?i</p>
                                      <p className="text-[11px] font-bold opacity-80 italic">
                                        Th?i gian: {app.interviewTime} | Ngày {app.interviewDate ? new Date(app.interviewDate).toLocaleDateString('vi-VN') : ''}
                                      </p>
                                    </div>
                                  </div>
                                  <button className="px-4 py-2 bg-purple-600 text-white text-[11px] font-black rounded-lg hover:bg-purple-700 shadow-md">
                                    Tham gia
                                  </button>
                                </div>
                              )}

                              <div className="pt-4 border-t border-slate-50 flex items-center justify-between gap-4">
                                <a href={getFileUrl(app.cvSnapshotUrl)} target="_blank" rel="noreferrer" className="text-xs text-blue-600 font-bold hover:text-blue-800 flex items-center gap-1 transition-colors">
                                  <FileText className="w-3.5 h-3.5" />
                                  Xem h? so dã n?p <ExternalLink className="w-3 h-3" />
                                </a>

                                <div className="flex items-center gap-3">
                                  {app.appStatus === 'PENDING' && (
                                    <button onClick={() => handleCancelApplication(app.applicationId)} className="px-4 py-2 text-[11px] font-black text-slate-400 hover:text-red-500 transition-all">
                                      H?y don
                                    </button>
                                  )}
                                  <Link href={`/jobs/${app.jobPostingId}`} className="px-6 py-2 bg-slate-900 text-white text-[11px] font-black rounded-xl hover:bg-blue-600 shadow-lg active:scale-95 transition-all">
                                    Chi ti?t
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="bg-white rounded-[48px] border border-slate-100 shadow-sm p-24 text-center space-y-8">
                       <Briefcase className="w-16 h-16 mx-auto text-slate-200" />
                       <h3 className="text-2xl font-black text-slate-900">Danh sách <span className="text-blue-600 italic">dang tr?ng</span></h3>
                       <Link href="/jobs" className="inline-flex items-center gap-2 px-12 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:bg-blue-700 transition-all text-xs uppercase tracking-widest">
                         Tìm vi?c ngay <ArrowRight className="w-4 h-4" />
                       </Link>
                    </div>
                  )}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
