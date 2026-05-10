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
import MatchingAnalysisModal from "@/components/recruiter/MatchingAnalysisModal";

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
  analysis?: any;
}

export default function MatchingJobsPage() {
  const [jobs, setJobs] = useState<MatchingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  
  const [selectedJob, setSelectedJob] = useState<MatchingJob | null>(null);

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

  const customTitle = (
    <div className="space-y-4">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-slate-500 text-[12px] font-medium">
        <Link href="/" className="hover:text-[#1e60ad] transition-colors">Trang chủ</Link>
        <span>/</span>
        <Link href="/profile" className="hover:text-[#1e60ad] transition-colors">Quản lý hồ sơ</Link>
        <span>/</span>
        <span className="text-slate-400">Việc làm phù hợp AI</span>
      </div>
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">
          Việc làm phù hợp nhất
        </h1>
      </div>
    </div>
  );

  return (
    <ProfilePageShell
      title={customTitle}
      subtitle=""
      action={null}
    >
      {/* Standard Container from other dashboard pages */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
        {/* Sub Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
           <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Tìm thấy <span className="text-blue-600 font-extrabold">{jobs.length}</span> vị trí tối ưu
              </h3>
           </div>
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {jobs.length > 0 ? (
              <div className="space-y-4">
                {jobs.map((job, idx) => (
                  <motion.div
                    key={job.jobPostingId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group relative bg-white rounded-2xl border border-slate-100 p-5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 flex flex-col gap-3"
                  >
                    {/* High Match Edge Accent */}
                    {job.score >= 90 && (
                      <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-orange-500 rounded-l-2xl overflow-hidden" />
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 flex-1 min-w-0">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        {/* Company Logo */}
                        <div className="w-[52px] h-[52px] rounded-xl border border-slate-100 flex items-center justify-center shrink-0 bg-white p-1 shadow-sm overflow-hidden group-hover:scale-105 transition-transform duration-200">
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

                        {/* Main Content */}
                        <div className="flex-1 min-w-0">
                          <Link href={`/jobs/${job.jobPostingId}`}
                            className="font-bold text-slate-900 text-base hover:text-blue-600 transition-colors block leading-snug truncate pr-2 group-hover:text-blue-600">
                            {job.title}
                          </Link>
                          
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[13px] font-medium text-slate-500">
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="font-semibold">{job.company.companyName}</span>
                            </div>
                            <span className="text-slate-300 select-none">•</span>
                            <span className="text-slate-400 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" /> {job.locationCity}
                            </span>
                          </div>

                          {/* Salary & Tags badges */}
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="text-[#1e60ad] bg-[#EBF5FF] px-2 py-0.5 rounded font-bold text-[11px] flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
                            </span>
                            {job.jobType && (
                              <span className="text-[#1e60ad] bg-[#EBF5FF] px-2 py-0.5 rounded font-bold text-[11px]">
                                {job.jobType}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Side Action Group */}
                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0 border-t sm:border-t-0 border-slate-50 pt-3 sm:pt-0">
                        {/* Match Percentage Badge */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedJob(job);
                          }}
                          title="Nhấn để xem chi tiết phân tích"
                          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                            job.score >= 90 
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200 hover:bg-blue-700' 
                              : 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100'
                          }`}>
                          <BrainCircuit className={`w-3.5 h-3.5 ${job.score >= 90 ? 'animate-pulse' : ''}`} />
                          ĐỘ PHÙ HỢP {job.score}%
                        </button>

                        <Link href={`/jobs/${job.jobPostingId}`}
                          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-[11px] font-bold rounded-lg hover:bg-blue-600 shadow-sm transition-all duration-200 group/btn">
                          Ứng tuyển ngay
                          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl border border-slate-100 shadow-sm p-20 text-center space-y-6"
              >
                <div className="w-20 h-20 mx-auto rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300">
                  <BrainCircuit className="w-9 h-9" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Chưa tìm thấy mục <span className="text-blue-600 italic">Matching</span>
                  </h3>
                  <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Cập nhật thêm kỹ năng hoặc thiết lập vị trí mong muốn trong hồ sơ để AI gợi ý chính xác hơn.
                  </p>
                </div>
                <Link
                  href="/profile"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-blue-600 transition-all shadow-lg group/cta"
                >
                  Cập nhật hồ sơ ngay
                  <ArrowRight className="w-4 h-4 transition-transform group-hover/cta:translate-x-0.5" />
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Analysis Modal integration */}
      {selectedJob && (
        <MatchingAnalysisModal
          isOpen={!!selectedJob}
          onClose={() => setSelectedJob(null)}
          candidateName={user?.candidate?.fullName || user?.name || 'Ứng viên'}
          score={Math.round(selectedJob.score)}
          matchedSkills={selectedJob.matchedSkills || []}
          missingSkills={[]}
          analysis={selectedJob.analysis}
        />
      )}
    </ProfilePageShell>
  );
}
