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
  Target,
  BrainCircuit
} from "lucide-react";

import api from "@/lib/api";
import Link from "next/link";
import { formatSalary } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { motion, AnimatePresence } from "framer-motion";
import { ProfileSidebar } from "@/components/candidates/ProfileSidebar";

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
        <p className="text-slate-500 font-black tracking-widest uppercase text-xs animate-pulse">AI dang phân tích h? so c?a b?n...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfdfe] pt-24 pb-20 font-sans">
      <div className="max-w-6xl mx-auto px-4 lg:px-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <ProfileSidebar />
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* Page Header with AI Glow */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[48px] p-10 border border-slate-800 shadow-2xl overflow-hidden"
            >
              {/* Background animations */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                    <BrainCircuit className="w-3.5 h-3.5 animate-pulse" />
                    Workly AI Matching Engine
                  </div>
                  <h1 className="text-4xl font-black text-white tracking-tight leading-none">
                    Vi?c làm <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300 italic">Dành riêng</span> <br/> cho phong cách c?a b?n
                  </h1>
                  <p className="text-slate-400 max-w-lg text-[15px] leading-relaxed font-medium">
                    Thu?t toán AI c?a chúng tôi dã phân tích {user?.candidate?.skills?.length || 0} k? nang trong CV d? d? xu?t nh?ng v? trí có d? tuong thích cao nh?t.
                  </p>
                </div>

                <div className="shrink-0 bg-white/5 backdrop-blur-xl rounded-[32px] p-6 border border-white/10 flex flex-col items-center justify-center gap-2 text-center group hover:bg-white/10 transition-all">
                  <div className="relative group-hover:scale-110 transition-transform duration-500">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                      <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="251.2" strokeDashoffset="12.5" className="text-blue-500" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-white leading-none">95%</span>
                      <span className="text-[8px] font-black text-blue-400 uppercase tracking-tighter">Accuracy</span>
                    </div>
                  </div>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-2">D?a trên Workly Core II</p>
                </div>
              </div>
            </motion.div>

            {/* Jobs List */}
            <div className="space-y-6">
              <div className="flex items-center justify-between px-4">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.15em]">Ð? xu?t hàng d?u ({jobs.length})</h3>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-bold text-slate-500 italic">Ðang c?p nh?t theo th?i gian th?c</span>
                </div>
              </div>

              <AnimatePresence mode="popLayout">
                {jobs.length > 0 ? (
                  jobs.map((job, idx) => (
                    <motion.div
                      key={job.jobPostingId}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group relative bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-blue-100 transition-all p-8"
                    >
                      {/* Tier badges */}
                      <div className="absolute top-6 right-6 flex flex-col gap-2 z-10 items-end">
                        <div className="px-4 py-1.5 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.1em] shadow-lg shadow-blue-200/50 flex items-center gap-1.5">
                          <Target className="w-3 h-3" />
                          Match {job.score}%
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row gap-8">
                        {/* Company Logo Container */}
                        <div className="relative shrink-0 w-24 h-24">
                          <div className="w-full h-full bg-slate-50 rounded-[28px] border border-slate-50 flex items-center justify-center p-5 group-hover:bg-white transition-all duration-500">
                            {job.company.logo ? (
                              <img src={job.company.logo} alt={job.company.companyName} className="max-w-full max-h-full object-contain filter group-hover:drop-shadow-md transition-all" />
                            ) : (
                              <Building2 className="w-12 h-12 text-slate-200" />
                            )}
                          </div>
                          {job.score >= 90 && (
                            <div className="absolute -bottom-2 -left-2 bg-gradient-to-br from-amber-400 to-orange-500 text-white text-[10px] font-black w-10 h-10 rounded-[14px] flex items-center justify-center border-4 border-white shadow-lg">
                              ?
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="grow space-y-5">
                          <div>
                            <Link href={`/jobs/${job.jobPostingId}`}>
                              <h3 className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors tracking-tight leading-tight mb-1">
                                {job.title}
                              </h3>
                            </Link>
                            <p className="text-[15px] font-bold text-slate-400 flex items-center gap-2">
                              {job.company.companyName}
                              <span className="w-1 h-1 bg-slate-200 rounded-full" />
                              <span className="text-slate-300 font-medium">B?n tin dang 2 ngày tru?c</span>
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-[13px] font-bold">
                            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100 shadow-sm shadow-blue-50/50">
                              <DollarSign className="w-4 h-4" />
                              <span className="font-black">{formatSalary(job.salaryMin, job.salaryMax, job.currency)}</span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-2xl border border-slate-100">
                              <MapPin className="w-4 h-4 text-slate-400" />
                              <span>{job.locationCity}</span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-2xl border border-slate-100">
                              <Briefcase className="w-4 h-4 text-slate-400" />
                              <span className="uppercase tracking-tighter">{job.jobType}</span>
                            </div>
                          </div>

                          {/* Matching Insights */}
                          <div className="p-5 bg-[#fcfdfe] rounded-[24px] border border-slate-50 space-y-3">
                            <div className="flex items-center justify-between mb-1">
                               <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Sparkles className="w-3 h-3 text-blue-500" />
                                K? nang tuong thích
                               </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {job.matchedSkills?.map((skill, i) => (
                                <span key={i} className="px-3 py-1 bg-white border border-slate-100 text-slate-600 text-[11px] font-bold rounded-xl shadow-sm lowercase">
                                  {skill}
                                </span>
                              ))}
                              {(!job.matchedSkills || job.matchedSkills.length === 0) && (
                                <span className="text-xs text-slate-400 italic">Ðang phân tích k? nang...</span>
                              )}
                            </div>
                          </div>

                          <div className="pt-6 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <p className="text-[11px] font-bold text-slate-400 italic">H? th?ng g?i ý d?a trên h? so chuyên sâu c?a b?n</p>
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                              <Link
                                href={`/jobs/${job.jobPostingId}`}
                                className="flex-1 sm:flex-none inline-flex items-center justify-center px-6 py-3 bg-slate-100 text-slate-700 text-xs font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-wider"
                              >
                                Chi ti?t
                              </Link>
                              <Link
                                href={`/jobs/${job.jobPostingId}`}
                                className="flex-[2] sm:flex-none inline-flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 text-white text-xs font-black rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 uppercase tracking-widest group"
                              >
                                ?ng tuy?n ngay <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white rounded-[48px] border border-slate-100 p-24 text-center space-y-8"
                  >
                    <div className="relative mx-auto w-32 h-32">
                      <div className="absolute inset-0 bg-blue-50 rounded-full animate-ping opacity-20" />
                      <div className="relative w-full h-full bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                        <Search className="w-16 h-16" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-2xl font-black text-slate-900 leading-tight">Chua tìm th?y m?c <span className="text-blue-600 italic">Matching chính xác</span></h3>
                      <p className="text-sm text-slate-400 max-w-sm mx-auto font-medium leading-relaxed">
                        Ð?ng lo l?ng! Hãy c?p nh?t thêm k? nang vào h? so ho?c t?i lên CV m?i d? AI có th? phân tích chính xác hon.
                      </p>
                    </div>
                    <Link
                      href="/profile/cv-management"
                      className="inline-flex items-center justify-center px-12 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 active:scale-95 text-xs uppercase tracking-widest"
                    >
                      C?p nh?t H? so/CV ngay
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
