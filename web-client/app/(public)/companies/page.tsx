"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, ChevronLeft, ChevronRight, Building2, ChevronFirst, ChevronLast, Loader2 } from "lucide-react";
import api from "@/lib/api";

import { useSearchParams, useRouter } from "next/navigation";

export default function CompaniesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const initialIndustry = searchParams.get("industry") || "";
  const initialSortBy = searchParams.get("sortBy") || "ALPHABETICAL";
  
  const [searchQuery, setSearchQuery] = useState("");
  const [industry, setIndustry] = useState(initialIndustry);
  const [companies, setCompanies] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const itemsPerPage = 9;

  // Sync state with URL params
  useEffect(() => {
    const ind = searchParams.get("industry") || "";
    const sort = searchParams.get("sortBy");
    
    setIndustry(ind);
    
    if (sort) {
      setSortBy(sort);
    } else if (!ind) {
      // If neither industry nor sort is provided (e.g. going back to /companies), default to ALL
      setSortBy('ALPHABETICAL');
    }
    
    if (ind || sort) {
      setCurrentPage(1);
    }
  }, [searchParams]);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/companies", {
        params: {
          search: searchQuery,
          page: currentPage,
          limit: itemsPerPage,
          sortBy: sortBy,
          ...(industry ? { industry } : {})
        }
      });
      setCompanies(data.items);
      setTotal(data.total);
    } catch (err) {
      console.error("Failed to fetch companies:", err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, currentPage, sortBy, industry]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCompanies();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchCompanies]);

  const totalPages = Math.ceil(total / itemsPerPage) || 1;

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      {/* Breadcrumb */}
      <nav className="max-w-6xl mx-auto px-4 lg:px-6 pt-8 pb-4">
        <div className="flex items-center gap-2 text-[13px] font-medium">
          <Link href="/" className="text-slate-400 hover:text-mariner transition-colors">Trang chủ</Link>
          <span className="text-slate-300">/</span>
          <Link href="/companies" className="text-slate-800 font-semibold">Công ty</Link>
        </div>
      </nav>

      {/* Header Section */}
      <header className="max-w-6xl mx-auto px-4 lg:px-6 mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <Building2 className="w-8 h-8 text-mariner fill-blue-50" />
          {industry ? `Công ty ${industry}` : 'Khám phá Doanh nghiệp'}
        </h1>
        <p className="text-slate-500 text-sm font-medium mt-2 ml-11">
          {industry 
            ? `Tìm thấy ${total} công ty trong lĩnh vực ${industry}`
            : `Kết nối cùng ${total} công ty hàng đầu trên Workly`
          }
        </p>
      </header>

      {/* Main Unified Control Panel & List */}
      <section className="max-w-6xl mx-auto px-4 lg:px-6 pb-20">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-10 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/50">
          
          {/* Smart Search Box integrated inline */}
          <div className="flex-1 flex items-center gap-3 bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2 group focus-within:bg-white focus-within:border-mariner/40 focus-within:ring-4 focus-within:ring-blue-50 transition-all duration-200">
            <Search className="w-4 h-4 text-slate-400 group-focus-within:text-mariner transition-colors" />
            <input
              type="text"
              placeholder="Tìm nhanh theo tên doanh nghiệp..."
              className="w-full bg-transparent border-none outline-none text-[14px] font-medium text-slate-800 placeholder:text-slate-400 h-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-600 px-2 py-1 bg-slate-200/50 hover:bg-slate-200 rounded"
              >
                Xóa
              </button>
            )}
            
            {industry && (
              <button 
                onClick={() => router.push('/companies')}
                className="text-[10px] font-bold text-white bg-mariner hover:bg-blue-700 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                title="Xóa bộ lọc ngành nghề"
              >
                {industry} ✕
              </button>
            )}
          </div>

          {/* Filters adjacent */}
          <div className="bg-slate-100/80 p-1 rounded-xl flex items-center gap-1 flex-shrink-0">
            {[
              { title: "Tất Cả", type: 'ALPHABETICAL' },
              { title: "Tiêu Biểu", type: 'TYPICAL' },
              { title: "Nổi Bật", type: 'TRENDING' }
            ].map((cat) => (
              <button
                key={cat.title}
                onClick={() => {
                  setSortBy(cat.type as any);
                  setCurrentPage(1);
                }}
                className={`px-5 py-2 rounded-lg text-[13px] font-bold transition-all duration-200 whitespace-nowrap ${
                  sortBy === cat.type 
                    ? 'bg-white text-mariner shadow-sm ring-1 ring-black/[0.03]' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                }`}
              >
                {cat.title}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-mariner animate-spin" />
            <p className="text-slate-400 font-medium">Đang tải dữ liệu thực tế...</p>
          </div>
        ) : companies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
            <Building2 className="w-16 h-16 text-slate-200 mb-4" />
            <p className="text-slate-500 font-bold">Không tìm thấy doanh nghiệp nào</p>
            <p className="text-slate-400 text-sm">Thử lại với từ khóa khác nhé!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company) => (
              <Link
                key={company.companyId}
                href={`/companies/${company.companyId}`}
                className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all group flex flex-col h-full"
              >
                <div className="flex gap-4 mb-5">
                  <div className="w-16 h-16 rounded-xl border border-slate-50 p-2 flex-shrink-0 relative overflow-hidden bg-white shadow-sm group-hover:scale-105 transition-transform">
                    <Image
                      src={company.logo || "/logos/logo.png"}
                      alt={company.companyName}
                      fill
                      sizes="64px"
                      className="object-contain p-1"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] font-bold text-slate-900 leading-snug group-hover:text-mariner transition-colors line-clamp-2 mb-1">
                      {company.companyName}
                    </h3>
                    <p className="text-[12px] text-slate-500 font-medium line-clamp-1">
                      {company.mainIndustry || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="mt-auto">
                  <div className="inline-flex items-center bg-[#eef2ff] px-2 py-1 rounded-md group-hover:bg-blue-100 transition-colors">
                    <span className="text-[#2563eb] text-[13px] font-bold">
                      {company.activeJobs || 0}
                    </span>
                    <span className="text-[#2563eb] text-[12px] font-medium ml-1">
                      việc làm đang tuyển
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination Section */}
        <div className="mt-16 flex items-center justify-center gap-2">
          <button
            className="w-10 h-10 flex items-center justify-center rounded-full border border-slate-100 text-slate-300 hover:border-mariner hover:text-mariner transition-all"
            onClick={() => setCurrentPage(1)}
          >
            <ChevronFirst className="w-4 h-4" />
          </button>
          <button
            className="w-10 h-10 flex items-center justify-center rounded-full border border-slate-100 text-slate-300 hover:border-mariner hover:text-mariner transition-all"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {[...Array(totalPages)].map((_, i) => {
            const page = i + 1;
            return (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 flex items-center justify-center rounded-full text-[14px] font-bold transition-all ${currentPage === page
                    ? "bg-mariner text-white shadow-lg shadow-blue-200 scale-110"
                    : "text-slate-400 hover:bg-slate-50 border border-transparent hover:border-slate-100"
                  }`}
              >
                {page}
              </button>
            );
          })}

          <button
            className="w-10 h-10 flex items-center justify-center rounded-full border border-slate-100 text-slate-300 hover:border-mariner hover:text-mariner transition-all"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            className="w-10 h-10 flex items-center justify-center rounded-full border border-slate-100 text-slate-300 hover:border-mariner hover:text-mariner transition-all"
            onClick={() => setCurrentPage(totalPages)}
          >
            <ChevronLast className="w-4 h-4" />
          </button>
        </div>
      </section>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </main>
  );
}
