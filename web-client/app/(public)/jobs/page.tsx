"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { Search, BellRing, Check, ChevronRight } from "lucide-react";
import { useSearchParams } from "next/navigation";

import api from "@/lib/api";
import { JobCard, Job } from "@/components/JobCard";
import { JobSearchHero } from "@/components/jobs/JobSearchHero";
import { CareerSidebar } from "@/components/jobs/CareerSidebar";
import { Pagination } from "@/components/Pagination";
import { JobCardSkeleton } from "@/components/jobs/JobCardSkeleton";

function JobSearchContent() {
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [locationParam, setLocationParam] = useState(searchParams.get("location") || "");
  const [industryParam, setIndustryParam] = useState(searchParams.get("industry") || "");
  const [jobTypeParam, setJobTypeParam] = useState("");
  const [salaryMinParam, setSalaryMinParam] = useState<number | undefined>(undefined);
  const [salaryMaxParam, setSalaryMaxParam] = useState<number | undefined>(undefined);
  const [experienceParam, setExperienceParam] = useState("");
  const [rankParam, setRankParam] = useState("");
  const [educationParam, setEducationParam] = useState("");
  
  const [sortBy, setSortBy] = useState("suitable");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isSavingAlert, setIsSavingAlert] = useState(false);
  const [alertSaved, setAlertSaved] = useState(false);
  const LIMIT = 12;

  const fetchJobs = useCallback(
    async (p = page) => {
      setLoading(true);
      try {
        const { data } = await api.get("/job-postings", {
          params: {
            search: searchQuery || undefined,
            location: locationParam || undefined,
            jobType: jobTypeParam || undefined,
            industry: industryParam || undefined,
            salaryMin: salaryMinParam,
            salaryMax: salaryMaxParam,
            experience: experienceParam || undefined,
            rank: rankParam || undefined,
            education: educationParam || undefined,
            page: p,
            limit: LIMIT,
          },
        });
        setJobs(data.items || []);
        setTotal(data.total || 0);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    },
    [searchQuery, locationParam, jobTypeParam, industryParam, salaryMinParam, salaryMaxParam, experienceParam, rankParam, educationParam, page]
  );

  useEffect(() => {
    fetchJobs(1);
  }, [locationParam, industryParam, jobTypeParam, salaryMinParam, salaryMaxParam, experienceParam, rankParam, educationParam]);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    setPage(1);
    fetchJobs(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchJobs(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveAlert = async () => {
    if (!searchQuery) return;
    setIsSavingAlert(true);
    try {
      await api.post("/job-alerts", { keywords: searchQuery });
      setAlertSaved(true);
      setTimeout(() => setAlertSaved(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingAlert(false);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  const sortOptions = [
    { id: "suitable", label: "Phù hợp nhất" },
    { id: "new", label: "Việc mới đăng" },
    { id: "updated", label: "Mới cập nhật" },
    { id: "salary", label: "Lương cao" },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <JobSearchHero
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        locationParam={locationParam}
        setLocationParam={setLocationParam}
        industryParam={industryParam}
        setIndustryParam={setIndustryParam}
        jobTypeParam={jobTypeParam}
        setJobTypeParam={setJobTypeParam}
        experienceParam={experienceParam}
        setExperienceParam={setExperienceParam}
        salaryMinParam={salaryMinParam}
        setSalaryMinParam={setSalaryMinParam}
        salaryMaxParam={salaryMaxParam}
        setSalaryMaxParam={setSalaryMaxParam}
        rankParam={rankParam}
        setRankParam={setRankParam}
        educationParam={educationParam}
        setEducationParam={setEducationParam}
        handleSearch={handleSearch}
        totalJobs={total}
      />

      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-8">
        {/* Breadcrumb-ish */}
        <div className="flex items-center gap-2 text-[12px] font-medium text-slate-400 mb-4">
          <span className="hover:text-[#1e60ad] cursor-pointer">Workly AI</span>
          <ChevronRight className="w-3 h-3 opacity-50" />
          <span className="text-slate-600">Việc làm</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Area (Left) */}
          <main className="flex-1 min-w-0">
             {/* Header Section */}
             <div className="mb-6">
                <h1 className="text-2xl font-black text-slate-900 mb-4">
                  Tuyển dụng <span className="text-[#1e60ad]">{total.toLocaleString()}</span> việc làm mới nhất năm 2026
                </h1>
                
                <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-slate-100">
                  <div className="flex items-center gap-4">
                    <span className="text-[13px] font-bold text-slate-600 uppercase tracking-wide">Hiển thị:</span>
                    <div className="flex items-center gap-1.5">
                      {sortOptions.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => setSortBy(opt.id)}
                          className={`flex items-center gap-2 h-8 px-4 rounded-full text-[13px] font-medium transition-all ${
                            sortBy === opt.id 
                                ? "bg-[#1e60ad] text-white shadow-md shadow-blue-100" 
                                : "bg-white text-slate-500 border border-slate-200 hover:border-[#1e60ad] hover:text-[#1e60ad]"
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full border-2 ${sortBy === opt.id ? "bg-white border-white" : "border-slate-300"}`} />
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="text-slate-400 text-[13px] font-medium">
                    Việc 1 - {jobs.length} / {total.toLocaleString()}
                  </div>
                </div>
             </div>

             {/* Jobs Grid (2 Columns) */}
             {loading ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {Array.from({ length: 6 }).map((_, i) => (
                   <JobCardSkeleton key={i} />
                 ))}
               </div>
             ) : jobs.length > 0 ? (
               <div className="space-y-4">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-4 gap-y-4">
                   {jobs.map((job) => (
                     <JobCard
                       key={job.jobPostingId}
                       job={job}
                       variant="horizontal"
                     />
                   ))}
                 </div>
                 
                 <div className="pt-8">
                    <Pagination
                      currentPage={page}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                 </div>
               </div>
             ) : (
               <div className="bg-white rounded-2xl border border-slate-100 py-32 text-center shadow-sm">
                 <Search className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                 <h3 className="text-xl font-black text-slate-900 mb-2">Không tìm thấy kết quả</h3>
                 <p className="text-slate-500 text-sm font-medium">Hãy thử thay đổi từ khóa hoặc sử dụng các bộ lọc khác.</p>
                 <button 
                  onClick={() => {setSearchQuery(""); setLocationParam("");}} 
                  className="mt-6 text-[#1e60ad] font-bold text-sm hover:underline"
                 >
                   Xóa tất cả bộ lọc
                 </button>
               </div>
             )}
          </main>

          {/* Sidebar (Right) */}
          <aside className="w-full lg:w-[320px] shrink-0">
             <div className="sticky top-28">
                <CareerSidebar />
             </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function JobSearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-slate-400">Đang tải kết quả tìm kiếm...</div>}>
      <JobSearchContent />
    </Suspense>
  );
}
