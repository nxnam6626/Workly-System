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
  Filter,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Target
} from "lucide-react";

import api from "@/lib/api";
import Link from "next/link";
import { formatSalary } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { motion, AnimatePresence } from "framer-motion";

interface MatchingJob {
  jobPostingId: string;
  title: string;
  salaryMin: number;
  salaryMax: number;
  currency: string;
  locationCity: string;
  jobType: string;
  score: number;
  matchedSkills: string[];
  company: {
    companyName: string;
    logo: string | null;
  };
}

export default function MatchingJobsPage() {
  const [jobs, setJobs] = useState<MatchingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchMatchingJobs = async () => {
      try {
        const res = await api.get("/job-postings/matching");
        setJobs(res.data);
      } catch (error) {
        console.error("Error fetching matching jobs:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchMatchingJobs();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] pt-32 pb-12 flex flex-col items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full mb-4" 
        />
        <p className="text-slate-500 font-medium animate-pulse">AI đang tìm kiếm việc làm phù hợp cho bạn...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-24 pb-20 font-sans">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">

        {/* Page Header with AI Glow */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-white rounded-3xl p-8 border border-slate-100 shadow-sm overflow-hidden mb-8"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                AI Matching Engine
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Việc làm <span className="text-blue-600 underline decoration-blue-200 underline-offset-8">Phù hợp</span> nhất</h1>
              <p className="text-slate-500 max-w-lg">Dựa trên kỹ năng và kinh nghiệm trong CV chính của bạn, chúng tôi đề xuất những cơ hội tốt nhất.</p>
            </div>
            
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">Độ chính xác</p>
                <p className="text-xl font-black text-slate-900">~95% <span className="text-xs font-medium text-emerald-500 font-sans">+2%</span></p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Nav */}
          <aside className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-2">
              <div className="p-4 mb-2 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Dành cho bạn</p>
                <p className="text-sm font-bold text-slate-700">Tùy chọn hiển thị</p>
              </div>
              <div className="space-y-1">
                <Link href="/profile/jobs/matching" className="flex items-center justify-between px-4 py-3 text-sm font-bold text-blue-600 bg-blue-50/50 rounded-xl transition-all">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4" />
                    Việc làm phù hợp
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <Link href="/profile/jobs/applied" className="flex items-center justify-between px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-4 h-4" />
                    Đã ứng tuyển
                  </div>
                </Link>
                <Link href="/profile/jobs/saved" className="flex items-center justify-between px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4" />
                    Đã lưu
                  </div>
                </Link>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white relative overflow-hidden group">
              <div className="absolute -top-12 -right-12 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
              <TrendingUp className="w-10 h-10 text-blue-400 mb-4" />
              <h4 className="text-lg font-black mb-2 leading-tight">Cải thiện chỉ số Matching?</h4>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">Cập nhật CV với từ khóa kỹ năng mới để nhận được các đề xuất chính xác hơn.</p>
              <Link href="/profile/cv-management" className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-widest">
                Cập nhật CV ngay <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </aside>

          {/* Jobs List */}
          <div className="lg:col-span-3 space-y-4">
            <AnimatePresence mode="popLayout">
              {jobs.length > 0 ? (
                jobs.map((job, idx) => (
                  <motion.div
                    key={job.jobPostingId}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all p-6"
                  >
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Logo or Match Score */}
                      <div className="relative shrink-0">
                        <div className="w-20 h-20 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center p-4 group-hover:bg-white transition-colors">
                          {job.company.logo ? (
                            <img src={job.company.logo} alt={job.company.companyName} className="max-w-full max-h-full object-contain" />
                          ) : (
                            <Building2 className="w-10 h-10 text-slate-200" />
                          )}
                        </div>
                        <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] font-black w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                          {job.score}%
                        </div>
                      </div>

                      {/* Content */}
                      <div className="grow space-y-4">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors cursor-pointer capitalize">
                              {job.title}
                            </h3>
                            <p className="text-sm font-bold text-slate-500">{job.company.companyName}</p>
                          </div>
                          <div className="hidden md:flex flex-col items-end">
                            <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">VERY HIGH MATCH</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-400">
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg">
                            <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                            <span className="text-slate-700">{formatSalary(job.salaryMin, job.salaryMax, job.currency)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-slate-700">{job.locationCity}</span>
                          </div>
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-slate-700 uppercase">{job.jobType}</span>
                          </div>
                        </div>

                        {/* Matched Skills Pills */}
                        <div className="flex flex-wrap gap-2 pt-2">
                          {job.matchedSkills.slice(0, 4).map((skill, i) => (
                            <span key={i} className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-md flex items-center gap-1 lowercase">
                              <Target className="w-2.5 h-2.5" />
                              {skill}
                            </span>
                          ))}
                          {job.matchedSkills.length > 4 && (
                            <span className="px-2 py-1 bg-slate-50 text-slate-400 text-[10px] font-bold rounded-md">+{job.matchedSkills.length - 4} skills</span>
                          )}
                        </div>

                        <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                          <p className="text-[10px] font-bold text-slate-400">Ứng tuyển để mở khóa mức độ tương thích chi tiết</p>
                          <Link 
                            href={`/jobs/${job.jobPostingId}`}
                            className="inline-flex items-center gap-2 px-6 py-2 bg-slate-900 text-white text-xs font-black rounded-xl hover:bg-blue-600 transition-all shadow-lg shadow-slate-200"
                          >
                            Chi tiết <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white rounded-3xl border border-slate-100 p-20 text-center space-y-6"
                >
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                    <Search className="w-12 h-12" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-slate-900 leading-tight">Chưa tìm thấy Công việc Phù hợp</h3>
                    <p className="text-sm text-slate-500 max-w-sm mx-auto font-medium">Bạn có thể cần cập nhật CV hoặc bật trạng thái tìm việc để AI có thể gợi ý chính xác nhất.</p>
                  </div>
                  <Link
                    href="/profile/cv-management"
                    className="inline-flex items-center justify-center px-10 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
                  >
                    Cập nhật CV ngay
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}
