"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, ArrowRight, Target, Bot, Zap, Search, UserCheck, Building2, MapPin, Briefcase } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { JobCard, Job } from "@/components/JobCard";
import { JobCardSkeleton } from "@/components/jobs/JobCardSkeleton";
import { useAuthStore } from "@/stores/auth";
import { motion, AnimatePresence } from "framer-motion";

interface MatchItem {
  id: string; // jobPostingId or candidateId
  title: string;
  subtitle: string;
  score: number;
  tags: string[];
  avatar?: string;
  jobTitle?: string; // For recruiters
  type: "JOB" | "CANDIDATE";
}

export function MatchingSection() {
  const [items, setItems] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, isAuthenticated } = useAuthStore();

  const isCandidate = user?.roles?.includes("CANDIDATE");
  const isRecruiter = user?.roles?.includes("RECRUITER");

  useEffect(() => {
    const fetchMatches = async () => {
      if (!isAuthenticated) return;
      setLoading(true);
      try {
        if (isCandidate) {
          const res = await api.get("/candidates/recommended-jobs");
          const mapped: MatchItem[] = res.data.slice(0, 4).map((j: any) => ({
            id: j.jobPostingId,
            title: j.title,
            subtitle: j.company.companyName,
            score: j.score || 95, // Default score if not provided by simple search
            tags: j.matchedSkills || (j.requirements ? j.requirements.split(',').slice(0, 3) : []),
            type: "JOB",
            raw: j
          }));
          setItems(mapped);
        } else if (isRecruiter) {
          const res = await api.get("/recruiters/top-matches");
          const mapped: MatchItem[] = res.data.slice(0, 4).map((c: any) => ({
            id: c.candidateId,
            title: c.fullName,
            subtitle: `Phù hợp cho vị trí: ${c.jobTitle}`,
            score: c.score,
            tags: c.skills || [],
            avatar: c.avatar,
            type: "CANDIDATE",
            raw: c
          }));
          setItems(mapped);
        }
      } catch (error) {
        console.error("Failed to fetch matches for homepage", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [isAuthenticated, isCandidate, isRecruiter]);

  // Nếu chưa đăng nhập, hiển thị Banner giới thiệu AI
  if (!isAuthenticated) {
    return (
      <section className="w-full max-w-7xl mx-auto px-6 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 rounded-[2.5rem] p-10 md:p-16 overflow-hidden shadow-2xl shadow-blue-200"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full text-white text-xs font-bold uppercase tracking-widest backdrop-blur-md">
                <Sparkles className="w-4 h-4 text-yellow-300" />
                Workly AI v4.0
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white leading-[1.1] tracking-tight">
                Tìm việc & Tuyển dụng <br /> 
                <span className="text-blue-200">với công nghệ AI bóc tách CV</span>
              </h2>
              <p className="text-blue-50 text-lg md:text-xl font-medium leading-relaxed max-w-xl">
                Hệ thống tự động so khớp kỹ năng giữa CV và JD với độ chính xác đến 95%. Tiết kiệm 80% thời gian tìm kiếm.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/register" 
                  className="bg-white text-blue-600 px-10 py-5 rounded-2xl font-black text-lg hover:bg-blue-50 transition-all shadow-xl shadow-blue-900/20 active:scale-95 text-center"
                >
                  Bắt đầu ngay
                </Link>
                <Link 
                  href="/jobs" 
                  className="bg-blue-500/30 border border-white/30 text-white px-8 py-5 rounded-2xl font-bold hover:bg-blue-500/40 transition-all backdrop-blur-sm text-center"
                >
                  Khám phá cơ hội
                </Link>
              </div>
            </div>

            <div className="hidden lg:flex justify-center relative">
               <motion.div 
                 animate={{ y: [0, -15, 0] }}
                 transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                 className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-[2rem] shadow-2xl space-y-6 w-full max-w-md relative z-10"
               >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-400 rounded-full flex items-center justify-center text-white font-black text-xl">95%</div>
                    <div>
                      <p className="text-white font-bold">Matching Rate</p>
                      <p className="text-blue-200 text-xs uppercase font-bold tracking-tighter">AI Precision Engine</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: "95%" }} transition={{ duration: 1.5, delay: 0.5 }} className="h-full bg-emerald-400" />
                    </div>
                    <p className="text-white/60 text-xs font-medium">Bóc tách: Kỹ năng ReactJS, Node.js, System Design thành công.</p>
                  </div>
               </motion.div>
            </div>
          </div>
        </motion.div>
      </section>
    );
  }

  const title = isCandidate ? "Việc làm Phù hợp nhất" : "Ứng viên Tiềm năng nhất";
  const subtitle = isCandidate ? "Dựa trên kỹ năng trong CV của bạn." : "Phù hợp với các vị trí bạn đang tuyển.";
  const linkLabel = isCandidate ? "Xem tất cả đề xuất" : "Quản lý tuyển dụng";
  const linkHref = isCandidate ? "/profile/jobs/matching" : "/recruiter/dashboard";

  return (
    <section className="w-full max-w-7xl mx-auto px-6 py-20 bg-white">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider">
            <Bot className="w-3.5 h-3.5" />
            Personalized For You
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
            {title.split(" ").slice(0, -1).join(" ")} <span className="text-blue-600 italic">{title.split(" ").slice(-1)}</span>
          </h2>
          <p className="text-slate-500 font-medium text-lg">{subtitle}</p>
        </div>
        <Link 
          href={linkHref} 
          className="group inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 active:scale-95"
        >
          {linkLabel} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <JobCardSkeleton key={i} />
          ))
        ) : items.length > 0 ? (
          <AnimatePresence>
            {items.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="h-full"
              >
                {item.type === "JOB" ? (
                  <JobCard job={(item as any).raw} />
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-100 p-6 h-full flex flex-col hover:shadow-xl transition-all duration-300 relative shadow-md shadow-slate-200/30">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 bg-blue-50 rounded-2xl overflow-hidden flex items-center justify-center shrink-0 border border-blue-100">
                         {item.avatar ? (
                            <img src={item.avatar} alt={item.title} className="w-full h-full object-cover" />
                         ) : (
                            <UserCheck className="w-7 h-7 text-blue-600" />
                         )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 text-[15px] truncate">{item.title}</h3>
                        <p className="text-blue-600 text-xs font-black uppercase tracking-tighter">{item.score}% MATCH</p>
                      </div>
                    </div>
                    
                    <p className="text-slate-500 text-xs mb-4 line-clamp-2 min-h-[32px] font-medium leading-relaxed">
                      {item.subtitle}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {item.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="px-2 py-1 bg-slate-50 text-slate-500 text-[10px] font-bold rounded-lg border border-slate-100">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="mt-auto pt-4 border-t border-slate-50">
                      <Link 
                        href={`/recruiter/candidates/${item.id}`} 
                        className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:bg-slate-900 transition-colors shadow-lg shadow-blue-100"
                      >
                         Xem hồ sơ <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="col-span-full py-20 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 space-y-4">
             <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                <Search className="text-slate-300 w-8 h-8" />
             </div>
             <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-800">Chưa tìm thấy dữ liệu phù hợp</h3>
                <p className="text-slate-500 max-w-sm mx-auto">
                    {isCandidate ? "Hãy đảm bảo bạn đã thiết lập CV mặc định." : "Hãy đăng thêm Job để nhận đề xuất ứng viên."}
                </p>
             </div>
             <Link href={isCandidate ? "/profile/cv-management" : "/recruiter/job-postings/create"} className="text-blue-600 font-bold hover:underline">
                 {isCandidate ? "Cập nhật CV ngay" : "Tạo Job ngay"} &rarr;
             </Link>
          </div>
        )}
      </div>
    </section>
  );
}
