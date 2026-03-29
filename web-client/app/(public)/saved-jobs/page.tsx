"use client";

import React, { useState, useEffect } from "react";
import { 
  Bookmark, 
  Briefcase,
  FileText,
  Search,
  Filter
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { JobCard, Job } from "@/components/JobCard";

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
      // If it was just unsaved, remove from list
      setSavedJobs(prev => prev.filter(job => job.jobPostingId !== id));
    }
  };

  const filteredJobs = savedJobs.filter(job => 
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company.companyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f7f6] pt-32 pb-12 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-50 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-medium tracking-tight">Đang tải danh sách việc làm đã lưu...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7f6] pt-24 pb-20 font-sans">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
             <h1 className="text-2xl font-bold text-slate-900 mb-1 tracking-tight">Việc làm đã lưu</h1>
             <p className="text-sm text-slate-500">Xem lại các công việc bạn đã lưu để ứng tuyển sau.</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="relative group">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-blue-600 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Tìm kiếm việc làm..."
                  className="pl-10 pr-4 py-2 bg-white border border-slate-100 rounded-lg text-sm w-full md:w-64 focus:border-blue-600 focus:ring-1 focus:ring-blue-100 outline-none transition-all shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             <button className="p-2.5 bg-white border border-slate-100 rounded-lg text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm active:scale-95">
                <Filter className="w-4 h-4" />
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-1 space-y-6">
             <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50 bg-gradient-to-br from-blue-600/5 to-indigo-600/5">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-blue-100">
                         N
                      </div>
                      <div>
                         <p className="text-sm font-bold text-slate-900">Nguyễn Xuân Nam</p>
                         <p className="text-[10px] text-slate-500 font-medium">Mã: #123456</p>
                      </div>
                   </div>
                </div>
                <div className="p-2 space-y-1">
                   <Link href="/applied-jobs" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 rounded-xl transition-colors font-medium">
                      <Briefcase className="w-4 h-4 opacity-70" />
                      Việc làm đã ứng tuyển
                   </Link>
                   <Link href="#" className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-blue-600 bg-blue-50/50 rounded-xl transition-colors">
                      <Bookmark className="w-4 h-4" />
                      Việc làm đã lưu
                   </Link>
                   <Link href="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 rounded-xl transition-colors font-medium">
                      <FileText className="w-4 h-4 opacity-70" />
                      Hồ sơ của tôi
                   </Link>
                </div>
             </div>
          </aside>

          {/* Main List Column */}
          <div className="lg:col-span-3">
             {filteredJobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredJobs.map((job) => (
                    <JobCard 
                      key={job.jobPostingId} 
                      job={{
                        ...job,
                        jobType: "Full-time",
                        experience: "Chưa cập nhật",
                        createdAt: job.createdAt,
                        isVerified: true
                      } as Job} 
                      saved={true}
                      onSave={handleUnsave}
                    />
                  ))}
                </div>
             ) : (
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-20 text-center space-y-6">
                   <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                      <Bookmark className="w-10 h-10" />
                   </div>
                   <div className="space-y-2">
                      <h3 className="text-lg font-bold text-slate-800 tracking-tight">Danh sách việc làm đã lưu trống</h3>
                      <p className="text-sm text-slate-500 max-w-sm mx-auto">Lưu lại những công việc thú vị để không bỏ lỡ cơ hội ứng tuyển sau này.</p>
                   </div>
                   <Link 
                     href="/jobs" 
                     className="inline-flex items-center justify-center px-10 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
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
