'use client';

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ChevronRight, ChevronLeft, Briefcase, GraduationCap, MapPin, DollarSign } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import { useFavoriteStore } from "@/stores/favorites";
import { formatSalary } from "@/lib/utils";
import api from "@/lib/api";
import { JobCard, Job } from "@/components/JobCard";
import { JobCardSkeleton } from "@/components/jobs/JobCardSkeleton";

import { INTERNSHIP_CATEGORIES } from "@/lib/mock-data";

const ITEMS_PER_PAGE = 6; // 2 columns x 3 rows

export function InternshipJobsSection() {
  const router = useRouter();
  const sectionRef = useRef<HTMLElement>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState("Tất cả");

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const industryMap: Record<string, string> = {
        "IT": "CNTT / Phần mềm",
        "Marketing": "Marketing / Truyền thông",
        "Kinh Doanh": "Kinh doanh / CSKH",
        "Kế Toán": "Tài chính / Kế toán / Ngân hàng",
        "Nhân Sự": "Nhân sự / Hành / Pháp lý",
        "Tuyển Dụng": "Nhân sự / Hành / Pháp lý",
        "Thiết Kế": "Thiết kế / Sáng tạo",
        "Kỹ Thuật": "Kỹ thuật / Cơ khí / Sản xuất",
        "Đào Tạo": "Giáo dục / Đào tạo / Ngôn ngữ",
      };

      const params: any = {
        jobLevel: "INTERN",
        page: page + 1,
        limit: ITEMS_PER_PAGE,
      };

      if (activeTab !== "Tất cả") {
        params.industry = industryMap[activeTab] || activeTab;
      }

      const response = await api.get("/job-postings", { params });
      const { items, total } = response.data;
      setJobs(items || []);
      setTotalPages(Math.ceil(total / ITEMS_PER_PAGE) || 1);
    } catch (error) {
      console.error("Failed to fetch INTERNSHIP jobs:", error);
      setJobs([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [page, activeTab]);

  return (
    <section ref={sectionRef} className="w-full py-12 bg-white">
      <div className="max-w-6xl mx-auto px-4 lg:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Việc Thực Tập Sinh
          </h2>
          <Link
            href="/jobs?jobLevel=INTERN"
            className="text-slate-700 font-bold text-sm flex items-center gap-1 hover:text-mariner transition-colors group shrink-0"
          >
            Xem thêm <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto scrollbar-hide pb-2">
          {INTERNSHIP_CATEGORIES.map((cat: string) => (
            <button
              key={cat}
              onClick={() => { setActiveTab(cat); setPage(0); }}
              className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-200 border ${activeTab === cat
                ? "bg-[#0056b3] text-white border-[#0056b3] shadow-md"
                : "bg-blue-50/50 text-[#0062bd] border-blue-100 hover:bg-blue-100/50"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Banner + Grid Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Banner */}
          <div className="w-full lg:w-[35%] shrink-0">
            <div className="relative h-[360px] lg:h-full min-h-[400px] rounded-2xl overflow-hidden shadow-xl border border-slate-100 group cursor-pointer" onClick={() => router.push('/jobs?jobLevel=INTERN')}>
              <Image
                src="/assets/truy-tim-dong-nghiep.webp"
                alt="Tuyển dụng thực tập sinh 2026"
                fill
                sizes="(max-width: 1024px) 100vw, 400px"
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              {/* Subtle overlay to maintain text readability if needed later, but keeping it clean for the image requested */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          </div>

          {/* Right Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <JobCardSkeleton key={i} />
                ))
              ) : jobs.length > 0 ? (
                jobs.map((job) => (
                  <JobCard key={job.jobPostingId} job={job} variant="horizontal" />
                ))
              ) : (
                <div className="col-span-full py-16 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <Briefcase className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 font-medium">Chưa có vị trí thực tập thuộc danh mục này.</p>
                </div>
              )}
            </div>

            {/* Compact Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center mt-8 gap-3">
                <button
                  onClick={() => handlePageChange(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-[#0062bd] hover:border-[#0062bd] transition-all disabled:opacity-20 disabled:cursor-not-allowed shadow-md shadow-blue-900/5 border border-slate-100 group"
                >
                  <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => handlePageChange(i)}
                      className={`transition-all duration-300 rounded-full cursor-pointer overflow-hidden ${i === page
                        ? "w-8 h-1.5 bg-[#0056b3] shadow-sm"
                        : "w-6 h-1.5 bg-[#d0e1f3] hover:bg-slate-300"
                        }`}
                      aria-label={`Go to page ${i + 1}`}
                    />
                  ))}
                </div>

                <button
                  onClick={() => handlePageChange(Math.min(totalPages - 1, page + 1))}
                  disabled={page === totalPages - 1}
                  className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-[#0062bd] hover:border-[#0062bd] transition-all disabled:opacity-20 disabled:cursor-not-allowed shadow-md shadow-blue-900/5 border border-slate-100 group"
                >
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
