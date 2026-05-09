"use client";

import React, { useState, useEffect } from "react";
import {
  Briefcase,
  Building2,
  MapPin,
  Search,
  Sparkles,
  ArrowRight,
  Target,
  BrainCircuit,
  DollarSign
} from "lucide-react";

import api from "@/lib/api";
import Link from "next/link";
import { formatSalary } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { motion, AnimatePresence } from "framer-motion";
import { ProfilePageShell } from "@/components/candidates/ProfilePageShell";

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
  jobTier?: 'BASIC' | 'PROFESSIONAL' | 'URGENT';
}

export default function MatchingJobsPage() {
  const [jobs, setJobs] = useState<MatchingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchMatchingJobs = async () => {
      try {
        const res = await api.get("/candidates/recommended-jobs");
        setJobs(res.data.items || []);
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
      <div className="min-h-screen bg-[#fcfdfe] pt-32 pb-12 flex flex-col items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-b-4 border-l-4 border-blue-600 rounded-full mb-6 relative"
        >
          <div className="absolute inset-2 border-r-2 border-t-2 border-indigo-400 rounded-full animate-spin-slow" />
        </motion.div>
        <p className="text-slate-500 font-black tracking-widest uppercase text-xs animate-pulse">AI đang phân tích hồ sơ của bạn...</p>
      </div>
    );
  }

  return (
    <ProfilePageShell
      title={<>Việc làm <em className="text-blue-600 not-italic">phù hợp</em></>}
      subtitle={`Phân tích ${user?.candidate?.skills?.length || 0} kỹ năng trong CV để tìm ra các vị trí có độ tương thích cao nhất.`}
      action={
        <div className="shrink-0 bg-white rounded-2xl p-4 border border-blue-100 flex items-center gap-4 shadow-sm shadow-blue-50">
          <div className="relative">
            <svg className="w-12 h-12 transform -rotate-90">
              <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100" />
              <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray="125.6" strokeDashoffset="6.28" className="text-blue-500" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[12px] font-black text-slate-900 leading-none">95%</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1 text-[10px] font-black text-blue-600 uppercase tracking-widest mb-0.5">
              <BrainCircuit className="w-3 h-3" /> AI Matching
            </div>
            <p className="text-[11px] font-bold text-slate-400">Độ chính xác cao</p>
          </div>
        </div>
      }
    >
      {/* Jobs List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
            Đề xuất hàng đầu <span className="text-blue-600">({jobs.length})</span>
          </h3>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100/50">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Cập nhật realtime</span>
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          {jobs.length > 0 ? (
            jobs.map((job, idx) => (
              <motion.div
                key={job.jobPostingId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.4, ease: "easeOut" }}
                className="group relative bg-white/60 backdrop-blur-xl rounded-[32px] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500 p-6 md:p-8 overflow-hidden"
              >
                {/* Ambient Glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/10 transition-colors duration-500 pointer-events-none" />
                
                <div className="relative z-10 flex flex-col gap-6">
                  {/* Header: Logo, Title, Score */}
                  <div className="flex flex-col sm:flex-row items-start gap-5">
                    <div className="shrink-0 w-20 h-20 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center p-3 relative group-hover:shadow-md transition-shadow">
                      {job.company.logo ? (
                        <img src={job.company.logo} alt={job.company.companyName} className="max-w-full max-h-full object-contain filter group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <Building2 className="w-10 h-10 text-slate-200" />
                      )}
                      {job.score >= 90 && (
                        <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-amber-400 to-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm" title="Độ tương thích cực cao">
                          <Sparkles className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    
                    <div className="grow w-full min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="min-w-0">
                          <Link href={`/jobs/${job.jobPostingId}`}>
                            <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-tight group-hover:text-blue-600 transition-colors truncate">
                              {job.title}
                            </h3>
                          </Link>
                          <p className="text-[13px] font-semibold text-slate-500 mt-1.5 flex items-center gap-2">
                             {job.company.companyName}
                             <span className="w-1 h-1 bg-slate-300 rounded-full"/>
                             <span className="text-slate-400 font-medium">Đăng 2 ngày trước</span>
                          </p>
                        </div>
                        
                        {/* Match Score Badge */}
                        <div className="shrink-0">
                           <div className="px-4 py-2 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black text-[11px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform duration-300">
                             <Target className="w-3.5 h-3.5" />
                             MATCH {job.score}%
                           </div>
                        </div>
                      </div>
                      
                      {/* Tags Row */}
                      <div className="flex flex-wrap items-center gap-2.5 mt-5">
                         <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center gap-1.5 border border-emerald-100/50 transition-colors group-hover:bg-emerald-100/50">
                           <DollarSign className="w-3.5 h-3.5" />
                           {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
                         </div>
                         <div className="px-3 py-1.5 rounded-xl bg-slate-50 text-slate-600 text-xs font-bold flex items-center gap-1.5 border border-slate-100 transition-colors group-hover:bg-slate-100/50">
                           <MapPin className="w-3.5 h-3.5 text-slate-400" />
                           {job.locationCity}
                         </div>
                         {job.jobType && (
                           <div className="px-3 py-1.5 rounded-xl bg-slate-50 text-slate-600 text-xs font-bold flex items-center gap-1.5 border border-slate-100 transition-colors group-hover:bg-slate-100/50">
                             <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                             {job.jobType}
                           </div>
                         )}
                      </div>
                    </div>
                  </div>
                  
                  {/* AI Matching Insights */}
                  <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-2xl p-4 md:p-5 border border-blue-100/50 group-hover:border-blue-200/50 transition-colors">
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-3 flex items-center gap-1.5">
                        <BrainCircuit className="w-3.5 h-3.5" /> Phân tích kỹ năng tương thích
                     </p>
                     <div className="flex flex-wrap gap-2">
                        {job.matchedSkills?.map((skill, i) => (
                          <span key={i} className="px-3 py-1 bg-white text-slate-700 text-[11px] font-bold rounded-lg shadow-sm border border-slate-100/50 lowercase">
                            {skill}
                          </span>
                        ))}
                        {(!job.matchedSkills || job.matchedSkills.length === 0) && (
                          <span className="text-xs text-slate-400 italic">Đang phân tích kỹ năng...</span>
                        )}
                     </div>
                  </div>
                  
                  {/* Footer CTA */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
                     <p className="text-[11px] font-medium text-slate-400 italic hidden md:block">
                        Hệ thống gợi ý dựa trên hồ sơ chuyên sâu của bạn
                     </p>
                     <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Link
                          href={`/jobs/${job.jobPostingId}`}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center px-6 py-2.5 bg-slate-50 text-slate-700 text-[11px] font-black rounded-xl hover:bg-slate-100 transition-colors uppercase tracking-widest border border-slate-200"
                        >
                          Chi tiết
                        </Link>
                        <Link
                          href={`/jobs/${job.jobPostingId}`}
                          className="flex-[2] sm:flex-none inline-flex items-center justify-center gap-2 px-8 py-2.5 bg-blue-600 text-white text-[11px] font-black rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 uppercase tracking-widest group/btn"
                        >
                          Ứng tuyển ngay <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                        </Link>
                     </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/60 backdrop-blur-xl rounded-[40px] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-16 md:p-24 text-center space-y-8"
            >
              <div className="relative mx-auto w-24 h-24">
                <div className="absolute inset-0 bg-blue-500/10 rounded-full animate-ping" />
                <div className="relative w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full flex items-center justify-center text-blue-600 border border-blue-100 shadow-inner">
                  <BrainCircuit className="w-10 h-10" />
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-black text-slate-900 leading-tight">
                  Chưa tìm thấy mục <span className="text-blue-600 italic">Matching chính xác</span>
                </h3>
                <p className="text-[13px] text-slate-500 max-w-sm mx-auto font-medium leading-relaxed">
                  Đừng lo lắng! Hãy cập nhật thêm kỹ năng vào hồ sơ hoặc tải lên CV mới để thuật toán AI có thể phân tích và đề xuất chính xác hơn.
                </p>
              </div>
              <Link
                href="/profile/cv-management"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-slate-900 text-white font-black rounded-xl hover:bg-blue-600 transition-all shadow-lg hover:shadow-blue-500/25 text-[11px] uppercase tracking-widest group"
              >
                Cập nhật Hồ sơ/CV ngay
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ProfilePageShell>
  );
}
