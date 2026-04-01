"use client";

import React, { useState, useEffect } from "react";
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
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  ExternalLink,
  Filter
} from "lucide-react";
import axios from "axios";
import api from "@/lib/api";
import Link from "next/link";
import { formatSalary, timeAgo } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { useSocketStore } from "@/stores/socket";
import { getFileUrl } from "@/lib/api";

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

const STATUS_MAP: Record<string, { label: string, color: string, bg: string }> = {
  PENDING: { label: "Đang chờ", color: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
  REVIEWED: { label: "Đã xem", color: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
  SHORTLISTED: { label: "Tiềm năng", color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-100" },
  INTERVIEWING: { label: "Đang phỏng vấn", color: "text-purple-600", bg: "bg-purple-50 border-purple-100" },
  ACCEPTED: { label: "Đã tuyển", color: "text-green-600", bg: "bg-green-50 border-green-100" },
  REJECTED: { label: "Từ chối", color: "text-red-600", bg: "bg-red-50 border-red-100" },
};

export default function AppliedJobsPage() {
  const [applications, setApplications] = useState<AppliedJob[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { accessToken } = useAuthStore();
  const { socket } = useSocketStore();

  const fetchData = async () => {
    try {
      const [appRes, profileRes] = await Promise.all([
        api.get("/applications/me"),
        api.get("/candidates/me")
      ]);
      setApplications(appRes.data);
      setProfile(profileRes.data);
    } catch (error) {
      console.error("Error fetching applied jobs data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [accessToken]);

  useEffect(() => {
    if (!socket) return;
    const handleNotification = (msg: any) => {
      fetchAppliedJobs();
    };
    socket.on('notification', handleNotification);
    return () => {
      socket.off('notification', handleNotification);
    };
  }, [socket]);

  const handleCancelApplication = async (applicationId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy đơn ứng tuyển này? Hành động này không thể hoàn tác.")) {
      return;
    }

    try {
      await api.delete(`/applications/${applicationId}`);
      setApplications(prev => prev.filter(app => app.applicationId !== applicationId));
      toast.success("Đã hủy ứng tuyển thành công.");
    } catch (error: any) {
      console.error("Error canceling application:", error);
      toast.error(error.response?.data?.message || "Không thể hủy đơn ứng tuyển. Vui lòng thử lại sau.");
    }
  };

  const filteredApps = applications.filter(app =>
    app.jobPosting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.jobPosting.company.companyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f7f6] pt-32 pb-12 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-50 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-medium font-sans">Đang tải danh sách việc làm đã ứng tuyển...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7f6] pt-24 pb-20 font-sans">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Việc làm đã ứng tuyển</h1>
            <p className="text-sm text-slate-500">Xem và theo dõi trạng thái các công việc bạn đã nộp hồ sơ.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="text"
                placeholder="Tìm theo tên công việc, công ty..."
                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm w-full md:w-64 focus:border-blue-600 focus:ring-0 outline-none transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Sidebar Navigation */}
          <aside className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-50 bg-gradient-to-br from-blue-600/5 to-indigo-600/5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-blue-100 overflow-hidden">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={profile?.fullName || "Candidate"} className="w-full h-full object-cover" />
                    ) : (
                      (profile?.fullName || user?.email || "C").charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{profile?.fullName || "Người dùng Workly"}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  </div>
                </div>
              </div>
              <div className="p-2">
                <Link href="#" className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-blue-600 bg-blue-50 rounded-lg transition-colors">
                  <Briefcase className="w-4 h-4" />
                  Việc làm đã ứng tuyển
                </Link>
                <Link href="#" className="flex items-center gap-3 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                  <CheckCircle2 className="w-4 h-4" />
                  Việc làm phù hợp
                </Link>
                <Link href="#" className="flex items-center gap-3 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                  <FileText className="w-4 h-4" />
                  Hồ sơ của tôi
                </Link>
              </div>
            </div>

            {/* Ad banner or quick tips */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white text-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full translate-x-1/2 -translate-y-1/2" />
              <h4 className="font-bold mb-2 relative z-10">Tải App Workly</h4>
              <p className="text-xs text-blue-100 mb-4 relative z-10">Ứng tuyển nhanh hơn, cập nhật trạng thái mọi lúc mọi nơi.</p>
              <button className="w-full py-2.5 bg-white text-blue-600 font-bold rounded-lg text-xs hover:bg-blue-50 transition-colors relative z-10 shadow-lg">
                Khám phá ngay
              </button>
            </div>
          </aside>

          {/* Main List Column */}
          <div className="lg:col-span-3 space-y-4">
            {filteredApps.length > 0 ? (
              filteredApps.map((app) => {
                const status = STATUS_MAP[app.appStatus] || STATUS_MAP.PENDING;
                return (
                  <div key={app.applicationId} className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all group p-5">
                    <div className="flex flex-col md:flex-row gap-5 items-start">

                      {/* Company Logo */}
                      <div className="w-16 h-16 rounded-xl border border-slate-100 bg-white flex items-center justify-center p-3 flex-shrink-0 group-hover:border-blue-200 transition-colors">
                        {app.jobPosting.company.logo ? (
                          <img
                            src={app.jobPosting.company.logo}
                            alt={app.jobPosting.company.companyName}
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : (
                          <Building2 className="w-8 h-8 text-slate-200" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 space-y-3">
                        <div>
                          <Link
                            href={`/jobs/${app.jobPostingId}`}
                            className="text-lg font-bold text-slate-900 hover:text-blue-600 transition-colors line-clamp-1 leading-tight"
                          >
                            {app.jobPosting.title}
                          </Link>
                          <p className="text-sm font-medium text-slate-500 mt-0.5">{app.jobPosting.company.companyName}</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="font-bold text-emerald-600 text-[13px]">
                              {formatSalary(app.jobPosting.salaryMin, app.jobPosting.salaryMax, app.jobPosting.currency)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{app.jobPosting.locationCity}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>Nộp ngày: <b>{new Date(app.applyDate).toLocaleDateString('vi-VN')}</b></span>
                          </div>
                        </div>

                        {app.appStatus === 'INTERVIEWING' && (
                          <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 flex items-start gap-3 mt-2">
                            <div className="w-8 h-8 rounded-full bg-white text-purple-600 flex items-center justify-center shrink-0 shadow-sm">
                              <Calendar className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">Lịch phỏng vấn sắp tới</p>
                              <p className="text-xs text-slate-600 mt-1">
                                Thời gian: <span className="font-semibold text-slate-800">{app.interviewTime} ngày {app.interviewDate ? new Date(app.interviewDate).toLocaleDateString('vi-VN') : ''}</span>
                              </p>
                              {app.interviewLocation && (
                                <p className="text-xs text-slate-600 mt-0.5">
                                  Địa điểm/Link: <span className="font-semibold text-slate-800">{app.interviewLocation}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-50">
                          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${status.bg} ${status.color}`}>
                            <div className={`w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_8px_currentColor]`} />
                            {status.label}
                          </div>

                          <div className="flex items-center gap-3">
                            <a
                              href={getFileUrl(app.cvSnapshotUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
                            >
                              Xem CV <ExternalLink className="w-3 h-3" />
                            </a>
                            <div className="w-[1px] h-3 bg-slate-200" />
                            {app.appStatus === 'PENDING' && (
                              <button
                                onClick={() => handleCancelApplication(app.applicationId)}
                                className="p-1 px-2 text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors"
                              >
                                Hủy ứng tuyển
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-20 text-center space-y-6">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                  <Briefcase className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-800">Bạn chưa ứng tuyển công việc nào</h3>
                  <p className="text-sm text-slate-500 max-w-sm mx-auto">Hàng ngàn cơ hội việc làm hấp dẫn đang chờ đón bạn. Ứng tuyển ngay để không bỏ lỡ!</p>
                </div>
                <Link
                  href="/jobs"
                  className="inline-flex items-center justify-center px-10 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                >
                  Tìm việc ngay
                </Link>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
