"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { SlidersHorizontal, Filter, Search, BellRing, Check } from "lucide-react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { JobCard, Job } from "@/components/JobCard";
import { JobSearchHero } from "@/components/jobs/JobSearchHero";
import { JobFilterSidebar } from "@/components/jobs/JobFilterSidebar";
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
  
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [isSavingAlert, setIsSavingAlert] = useState(false);
  const [alertSaved, setAlertSaved] = useState(false);
  const LIMIT = 12;

  const fetchJobs = useCallback(
    async (p = page) => {
      setLoading(true);
      try {
        const { data } = await axios.get("http://localhost:3001/job-postings", {
          params: {
            search: searchQuery || undefined,
            location: locationParam || undefined,
            jobType: jobTypeParam || undefined,
            industry: industryParam || undefined,
            salaryMin: salaryMinParam,
            salaryMax: salaryMaxParam,
            experience: experienceParam || undefined,
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
    [searchQuery, locationParam, jobTypeParam, industryParam, salaryMinParam, salaryMaxParam, experienceParam, page]
  );

  useEffect(() => {
    fetchJobs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationParam, industryParam, jobTypeParam, salaryMinParam, salaryMaxParam, experienceParam]);

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

  const toggleSave = (id: string, newSavedStatus: boolean) => {
    setSavedJobs((prev) => {
      const next = new Set(prev);
      if (newSavedStatus) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleSaveAlert = async () => {
    if (!searchQuery) return;
    setIsSavingAlert(true);
    try {
      await axios.post("http://localhost:3001/job-alerts", 
        { keywords: searchQuery },
        { withCredentials: true }
      );
      setAlertSaved(true);
      setTimeout(() => setAlertSaved(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingAlert(false);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="min-h-screen bg-gray-50">
      <JobSearchHero
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        locationParam={locationParam}
        setLocationParam={setLocationParam}
        industryParam={industryParam}
        setIndustryParam={setIndustryParam}
        handleSearch={handleSearch}
        totalJobs={total}
      />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-28">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-blue-500" />
                Bộ lọc tìm kiếm
              </h2>
              <JobFilterSidebar
                locationParam={locationParam}
                setLocationParam={setLocationParam}
                jobTypeParam={jobTypeParam}
                setJobTypeParam={setJobTypeParam}
                industryParam={industryParam}
                setIndustryParam={setIndustryParam}
                salaryMinParam={salaryMinParam}
                setSalaryMinParam={setSalaryMinParam}
                salaryMaxParam={salaryMaxParam}
                setSalaryMaxParam={setSalaryMaxParam}
                experienceParam={experienceParam}
                setExperienceParam={setExperienceParam}
                handleSearch={() => handleSearch()}
              />
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">
                  {loading ? (
                    "Đang tải..."
                  ) : (
                    <>
                      <span className="text-blue-600">{total.toLocaleString()}</span> tin tuyển
                      dụng
                    </>
                  )}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-gray-500 text-sm">Cập nhật mới nhất hôm nay</p>
                  {searchQuery && (
                    <button
                      onClick={handleSaveAlert}
                      disabled={isSavingAlert || alertSaved}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                        alertSaved 
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                          : "bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-600 hover:text-white"
                      }`}
                    >
                      {alertSaved ? <Check className="w-3 h-3" /> : <BellRing className="w-3 h-3" />}
                      {alertSaved ? "Đã lưu nhận thông báo" : "Nhận thông báo việc làm mới cho từ khóa này"}
                    </button>
                  )}
                </div>
              </div>
              <button
                onClick={() => setMobileFilterOpen(true)}
                className="flex lg:hidden items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Filter className="w-4 h-4" />
                Bộ lọc
              </button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <JobCardSkeleton key={i} />
                ))}
              </div>
            ) : jobs.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {jobs.map((job) => (
                    <JobCard
                      key={job.jobPostingId}
                      job={job}
                      saved={savedJobs.has(job.jobPostingId)}
                      onSave={toggleSave}
                    />
                  ))}
                </div>

                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 py-24 text-center">
                <Search className="w-9 h-9 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">Không tìm thấy kết quả</h3>
                <p className="text-gray-500 text-sm">Hãy thử thay đổi từ khóa hoặc bộ lọc.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function JobSearchPage() {
  return (
    <Suspense fallback={<div>Đang tải kết quả tìm kiếm...</div>}>
      <JobSearchContent />
    </Suspense>
  );
}
