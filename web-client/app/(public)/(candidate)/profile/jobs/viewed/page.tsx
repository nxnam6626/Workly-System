"use client";

import React, { useState, useEffect } from "react";
import { 
  Eye, 
  Briefcase,
  Search,
  Filter,
  ArrowRight,
  Clock,
  MapPin,
  DollarSign,
  Building2
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { formatSalary } from "@/lib/utils";
import { ProfileSidebar } from "@/components/candidates/ProfileSidebar";
import { motion, AnimatePresence } from "framer-motion";

// Mock history data for UI demonstration
const MOCK_HISTORY = [
  {
    jobPostingId: "1",
    title: "Senior Product Designer",
    company: { companyName: "Google", logo: "https://vcdn.jobsgo.vn/company_logos/hDIdkXzJ9W.jpg" },
    salaryMin: 2500,
    salaryMax: 4500,
    currency: "USD",
    locationCity: "Hồ Chí Minh",
    viewedAt: new Date().toISOString()
  },
  {
    jobPostingId: "2",
    title: "Fullstack Developer (Next.js)",
    company: { companyName: "Vercel", logo: null },
    salaryMin: 1500,
    salaryMax: 3000,
    currency: "USD",
    locationCity: "Hà Nội",
    viewedAt: new Date(Date.now() - 3600000).toISOString()
  }
];

export default function ViewedJobsPage() {
  const [viewedJobs, setViewedJobs] = useState<any[]>(MOCK_HISTORY);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // In real implementation, this would fetch from an API
  /*
  const fetchHistory = async () => {
    try {
      const { data } = await api.get("/candidates/viewed-jobs");
      setViewedJobs(data);
    } catch (e) {
      setViewedJobs(MOCK_HISTORY);
    } finally {
      setLoading(false);
    }
  };
  */

  const filteredJobs = viewedJobs.filter(job => 
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company.companyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcfdfe] pt-32 pb-12 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-bold tracking-tight">Đang tải lịch sử xem...</p>
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
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Việc làm <span className="text-blue-500">Đã xem</span></h1>
                <p className="text-sm text-slate-500 font-medium font-sans">Lịch sử xem việc làm giúp bạn dễ định hướng và tìm lại những cơ hội đã lướt qua.</p>
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

            {/* History List */}
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {filteredJobs.length > 0 ? (
                  filteredJobs.map((job, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group relative bg-white rounded-3xl border border-slate-50 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all p-6"
                    >
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Company Logo */}
                        <div className="w-16 h-16 rounded-2xl border border-slate-50 bg-slate-50/50 flex items-center justify-center p-3 flex-shrink-0 group-hover:scale-105 transition-transform">
                          {job.company.logo ? (
                            <img
                              src={job.company.logo}
                              alt={job.company.companyName}
                              className="max-w-full max-h-full object-contain"
                            />
                          ) : (
                            <Building2 className="w-8 h-8 text-slate-200" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="grow space-y-4">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <Link href={`/jobs/${job.jobPostingId}`}>
                                <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors cursor-pointer capitalize leading-tight">
                                  {job.title}
                                </h3>
                              </Link>
                              <p className="text-sm font-bold text-slate-500">{job.company.companyName}</p>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg text-slate-400 group-hover:text-amber-500 transition-colors">
                               <Clock className="w-3.5 h-3.5" />
                               <span className="text-[11px] font-black uppercase tracking-tighter">Vừa xem</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-400">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg">
                              <DollarSign className="w-4 h-4 text-emerald-600" />
                              <span className="text-slate-700">{formatSalary(job.salaryMin, job.salaryMax, job.currency)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg">
                              <MapPin className="w-4 h-4 text-slate-400" />
                              <span className="text-slate-700">{job.locationCity}</span>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-slate-50 flex items-center justify-end">
                            <Link
                              href={`/jobs/${job.jobPostingId}`}
                              className="inline-flex items-center justify-center gap-1.5 px-6 py-2 bg-slate-900 text-white text-[11px] font-black rounded-xl hover:bg-blue-600 transition-all shadow-lg active:scale-95 group font-sans uppercase tracking-widest"
                            >
                              Xem lại ngay <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
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
                    className="bg-white rounded-[48px] border border-slate-100 shadow-sm p-24 text-center space-y-8"
                  >
                    <div className="relative mx-auto w-32 h-32">
                      <div className="absolute inset-0 bg-blue-50 rounded-full animate-ping opacity-20" />
                      <div className="relative w-full h-full bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                        <Eye className="w-16 h-16" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-2xl font-black text-slate-900 leading-tight">Bạn chưa xem <span className="text-blue-600 italic">công việc nào?</span></h3>
                      <p className="text-sm text-slate-400 max-w-sm mx-auto font-medium leading-relaxed">
                        Lịch sử xem sẽ giúp bạn lưu lại hành trình tìm kiếm. Hãy bắt đầu khám phá các cơ hội nghề nghiệp ngay!
                      </p>
                    </div>
                    <Link
                      href="/jobs"
                      className="inline-flex items-center justify-center gap-2 px-12 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-xl active:scale-95 text-xs font-sans uppercase tracking-widest"
                    >
                      Bắt đầu tìm kiếm <ArrowRight className="w-4 h-4" />
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
