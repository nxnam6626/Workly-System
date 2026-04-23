"use client";

import React, { useState, useEffect } from "react";
import { 
  Bookmark, 
  Briefcase,
  Search,
  Filter,
  ArrowRight,
  Heart
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { JobCard, Job } from "@/components/JobCard";
import { ProfileSidebar } from "@/components/candidates/ProfileSidebar";
import { motion, AnimatePresence } from "framer-motion";

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

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const handleUnsave = (id: string, isSaved: boolean) => {
    if (!isSaved) {
      setSavedJobs(prev => prev.filter(job => job.jobPostingId !== id));
    }
  };

  const filteredJobs = savedJobs.filter(job => 
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company.companyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcfdfe] pt-32 pb-12 flex flex-col items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full mb-4"
        />
        <p className="text-slate-400 font-bold tracking-tight">Đang tải danh sách đã lưu...</p>
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
          <div className="lg:col-span-3 space-y-6">
            
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-100">
              <div className="space-y-1">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Việc làm <span className="text-rose-500">Đã lưu</span></h1>
                <p className="text-sm text-slate-500 font-medium font-sans">Lưu trữ những cơ hội thú vị để chuẩn bị hồ sơ ứng tuyển tốt nhất.</p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="relative group">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-blue-600 transition-colors" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm..."
                    className="pl-10 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl text-sm w-full md:w-64 focus:border-blue-600 outline-none transition-all shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button className="p-3 bg-white border border-slate-100 rounded-xl text-slate-500 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm active:scale-95">
                  <Filter className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Jobs List */}
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {filteredJobs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredJobs.map((job, idx) => (
                      <motion.div
                        key={job.jobPostingId}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <JobCard 
                          job={job as Job} 
                          onToggleFavorite={handleUnsave}
                        />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white rounded-[48px] border border-slate-100 shadow-sm p-24 text-center space-y-8"
                  >
                    <div className="relative mx-auto w-32 h-32">
                      <div className="absolute inset-0 bg-rose-50 rounded-full animate-ping opacity-20" />
                      <div className="relative w-full h-full bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                        <Heart className="w-16 h-16" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-2xl font-black text-slate-900 leading-tight">Danh sách đã lưu <span className="text-rose-500 italic">đang trống</span></h3>
                      <p className="text-sm text-slate-400 max-w-sm mx-auto font-medium leading-relaxed">
                        Hãy lưu lại những công việc bạn quan tâm để dễ dàng theo dõi và ứng tuyển bất cứ lúc nào!
                      </p>
                    </div>
                    <Link
                      href="/jobs"
                      className="inline-flex items-center justify-center gap-2 px-12 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-blue-600 hover:-translate-y-1 transition-all shadow-xl active:scale-95 group font-sans uppercase tracking-wider text-xs"
                    >
                      Khám phá việc làm ngay <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
