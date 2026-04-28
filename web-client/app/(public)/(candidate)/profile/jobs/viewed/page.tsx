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

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 px-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,700;1,9..144,400;1,9..144,600&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');`}</style>
      <div className="max-w-[1300px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <aside className="lg:col-span-3">
            <ProfileSidebar />
          </aside>

          <main className="lg:col-span-9 space-y-6">
            
            {/* Page Header */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-7">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div>
                  <p className="text-[10px] font-bold tracking-[0.3em] text-slate-400 uppercase mb-2">Lịch sử hoạt động</p>
                  <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700 }}
                    className="text-3xl text-slate-900 leading-none">
                    Việc làm <em className="text-slate-500">đã xem</em>
                  </h1>
                  <p className="text-sm text-slate-400 mt-1.5 font-medium">{viewedJobs.length} việc làm trong lịch sử</p>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm trong lịch sử..."
                    className="pl-11 pr-4 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-sm w-64 focus:border-blue-400 focus:outline-none transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* History List */}
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {filteredJobs.length > 0 ? (
                  filteredJobs.map((job, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05, duration: 0.22 }}
                      className="group relative bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300 p-5 flex gap-4 items-start overflow-hidden"
                    >
                      {/* Left bar on hover */}
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />

                      {/* Company Logo */}
                      <div className="w-12 h-12 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center p-2 flex-shrink-0">
                          {job.company.logo ? (
                            <img src={job.company.logo} alt={job.company.companyName} className="max-w-full max-h-full object-contain" />
                          ) : (
                            <Building2 className="w-6 h-6 text-slate-200" />
                          )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-3">
                          <div className="min-w-0">
                            <Link href={`/jobs/${job.jobPostingId}`}
                              className="font-bold text-slate-900 hover:text-blue-600 transition-colors text-base leading-snug block group-hover:text-blue-600">
                              {job.title}
                            </Link>
                            <p className="text-sm text-slate-400 font-medium mt-0.5">{job.company.companyName}</p>
                          </div>
                          <div className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg text-slate-400">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-semibold">Vừa xem</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mt-3 text-[12px] font-semibold">
                          <span className="flex items-center gap-1.5 text-emerald-600">
                            <DollarSign className="w-3.5 h-3.5" />
                            {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
                          </span>
                          <span className="flex items-center gap-1.5 text-slate-400">
                            <MapPin className="w-3.5 h-3.5" />
                            {job.locationCity}
                          </span>
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-50 flex justify-end">
                          <Link href={`/jobs/${job.jobPostingId}`}
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 text-white text-[11px] font-bold rounded-lg hover:bg-blue-600 transition-all">
                            Xem lại <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-3xl border border-slate-100 shadow-sm p-20 text-center space-y-6"
                    >
                      <div className="w-20 h-20 mx-auto rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center">
                        <Eye className="w-9 h-9 text-slate-200" />
                      </div>
                      <div className="space-y-2">
                        <h3 style={{ fontFamily: "'Fraunces', serif" }} className="text-2xl font-bold text-slate-900">
                          Chưa xem việc làm nào
                        </h3>
                        <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
                          Lịch sử xem sẽ giúp bạn lưu lại hành trình tìm kiếm.
                        </p>
                      </div>
                      <Link href="/jobs"
                        className="inline-flex items-center gap-2 px-8 py-3 bg-slate-900 text-white text-sm font-bold rounded-2xl hover:bg-blue-600 transition-all shadow-lg group/cta">
                        Bắt đầu tìm kiếm <ArrowRight className="w-4 h-4 group-hover/cta:translate-x-0.5" />
                      </Link>
                    </motion.div>
                  )}
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
