"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { Search, BellRing, Check, ChevronRight } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";

import api from "@/lib/api";
import { JobCard, Job } from "@/components/JobCard";
import { JobSearchHero } from "@/components/jobs/JobSearchHero";
import { CareerSidebar } from "@/components/jobs/CareerSidebar";
import { Pagination } from "@/components/Pagination";
import { JobCardSkeleton } from "@/components/jobs/JobCardSkeleton";

function JobSearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [locationParam, setLocationParam] = useState(searchParams.get("location") || "");
  const [industryParam, setIndustryParam] = useState(searchParams.get("industry") || "");
  const [jobTypeParam, setJobTypeParam] = useState(searchParams.get("jobType") || "");
  const [salaryMinParam, setSalaryMinParam] = useState<number | undefined>(
    searchParams.get("salaryMin") ? Number(searchParams.get("salaryMin")) : undefined
  );
  const [salaryMaxParam, setSalaryMaxParam] = useState<number | undefined>(
    searchParams.get("salaryMax") ? Number(searchParams.get("salaryMax")) : undefined
  );
  const [experienceParam, setExperienceParam] = useState(searchParams.get("experience") || "");
  const [rankParam, setRankParam] = useState(searchParams.get("rank") || "");
  const [educationParam, setEducationParam] = useState(searchParams.get("education") || "");
  
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "suitable");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isSavingAlert, setIsSavingAlert] = useState(false);
  const [alertSaved, setAlertSaved] = useState(false);
  const LIMIT = 12;

  // 1. Sync state FROM URL when searchParams change (e.g., clicking sidebar links)
  useEffect(() => {
    setSearchQuery(searchParams.get("search") || "");
    setLocationParam(searchParams.get("location") || "");
    setIndustryParam(searchParams.get("industry") || "");
    setJobTypeParam(searchParams.get("jobType") || "");
    setSalaryMinParam(searchParams.get("salaryMin") ? Number(searchParams.get("salaryMin")) : undefined);
    setSalaryMaxParam(searchParams.get("salaryMax") ? Number(searchParams.get("salaryMax")) : undefined);
    setExperienceParam(searchParams.get("experience") || "");
    setRankParam(searchParams.get("rank") || "");
    setEducationParam(searchParams.get("education") || "");
    setSortBy(searchParams.get("sortBy") || "suitable");
  }, [searchParams]);

  // 2. Sync state TO URL when local filters change (e.g., using search hero dropdowns)
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (locationParam) params.set("location", locationParam);
    if (industryParam) params.set("industry", industryParam);
    if (jobTypeParam) params.set("jobType", jobTypeParam);
    if (salaryMinParam) params.set("salaryMin", salaryMinParam.toString());
    if (salaryMaxParam) params.set("salaryMax", salaryMaxParam.toString());
    if (experienceParam) params.set("experience", experienceParam);
    if (rankParam) params.set("rank", rankParam);
    if (educationParam) params.set("education", educationParam);
    if (sortBy !== "suitable") params.set("sortBy", sortBy);
    
    const newUrl = `/jobs?${params.toString()}`;
    if (window.location.search !== `?${params.toString()}`) {
      router.replace(newUrl, { scroll: false });
    }
    fetchJobs(1);
  }, [searchQuery, locationParam, industryParam, jobTypeParam, salaryMinParam, salaryMaxParam, experienceParam, rankParam, educationParam, sortBy]);

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
            sortBy: sortBy,
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
                  {industryParam ? `Tìm việc ${industryParam}` : 
                   searchQuery ? `Tìm việc làm ${searchQuery}` : 
                   `Tuyển dụng ${total.toLocaleString()} việc làm mới nhất năm 2026`}
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
               <div className="bg-white rounded-3xl border border-slate-100 py-20 px-6 text-center shadow-sm flex flex-col items-center">
                 <img 
                   src="/assets/mascot-no-results.png" 
                   alt="No jobs found" 
                   className="w-48 h-48 object-contain mb-6 grayscale-[0.2] opacity-90"
                 />
                 <h3 className="text-[17px] font-bold text-slate-600 mb-2">
                   Hiện tại chưa có công việc phù hợp với yêu cầu của bạn
                 </h3>
                 <p className="text-slate-400 text-[15px] font-medium max-w-md">
                   Đừng lo lắng! Hãy thử khám phá các cơ hội nghề nghiệp thú vị bên dưới để tìm kiếm công việc phù hợp với bạn.
                 </p>
                 <button 
                  onClick={() => {
                    setSearchQuery(""); 
                    setLocationParam(""); 
                    setIndustryParam("");
                    setJobTypeParam("");
                    setExperienceParam("");
                    setRankParam("");
                    setEducationParam("");
                  }} 
                  className="mt-8 px-6 py-2 rounded-full border border-blue-100 text-[#1e60ad] font-bold text-sm hover:bg-blue-50 transition-colors"
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
