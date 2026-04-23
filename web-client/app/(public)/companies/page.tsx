"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, ChevronLeft, ChevronRight, Building2, ChevronFirst, ChevronLast, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { COMPANY_CATEGORIES } from "@/lib/mock-data";

export default function CompaniesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [companies, setCompanies] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/companies", {
        params: {
          search: searchQuery,
          page: currentPage,
          limit: itemsPerPage
        }
      });
      setCompanies(data.items);
      setTotal(data.total);
    } catch (err) {
      console.error("Failed to fetch companies:", err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, currentPage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCompanies();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchCompanies]);

  const totalPages = Math.ceil(total / itemsPerPage) || 1;

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      {/* Search Hero Section */}
      <section className="relative h-[280px] w-full flex items-center justify-center overflow-hidden">
        {/* Abstract Blue Background with City Silhouette */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#e0f2fe] via-[#f0f9ff] to-white z-0" />
        <div className="absolute bottom-0 right-0 opacity-20 z-0 select-none pointer-events-none">
          <Building2 className="w-[400px] h-[400px] text-[#0056b3]" />
        </div>

        <div className="relative z-10 max-w-4xl w-full px-6 text-center">
          <h1 className="text-[28px] font-black text-slate-800 mb-8 uppercase tracking-tight">
            Các công ty hàng đầu đang tuyển dụng
          </h1>

          <div className="flex flex-col md:flex-row items-stretch gap-0 rounded-xl shadow-2xl overflow-hidden bg-white p-1">
            <div className="flex-1 flex items-center px-6 py-4 gap-3">
              <Search className="w-5 h-5 text-slate-300" />
              <input
                type="text"
                placeholder="Nhập tên công ty..."
                className="w-full outline-none text-[15px] font-medium text-slate-700 placeholder:text-slate-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="bg-[#1e60ad] hover:bg-[#164a8a] text-white font-black text-[14px] px-10 py-4 transition-colors uppercase tracking-widest active:scale-95">
              TÌM CÔNG TY
            </button>
          </div>
        </div>
      </section>

      {/* Breadcrumb */}
      <nav className="max-w-6xl mx-auto px-4 lg:px-6 py-5">
        <div className="flex items-center gap-2 text-[13px] font-medium">
          <Link href="/" className="text-slate-400 hover:text-mariner">Workly</Link>
          <span className="text-slate-300">/</span>
          <Link href="/companies" className="text-slate-400 hover:text-mariner">Công ty</Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-800">Công ty đang tuyển dụng</span>
        </div>
      </nav>

      {/* Categories / Top Businesses Section */}
      <section className="max-w-6xl mx-auto px-4 lg:px-6 mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[20px] font-black text-slate-900 uppercase">Doanh nghiệp hàng đầu đang tuyển dụng</h2>
          <div className="flex gap-2">
            <button className="p-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-400 hover:text-mariner transition-all opacity-50 cursor-not-allowed">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-400 hover:text-mariner transition-all">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar scroll-smooth">
          {COMPANY_CATEGORIES.map((cat) => (
            <div
              key={cat.title}
              className="min-w-[200px] flex-shrink-0 bg-white rounded-xl border border-slate-100 p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group"
            >
              <h3 className="text-[15px] font-black text-slate-800 group-hover:text-mariner transition-colors mb-1">{cat.title}</h3>
              <p className="text-[12px] font-medium text-slate-400">{cat.count}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Main Companies List */}
      <section className="max-w-6xl mx-auto px-4 lg:px-6 pb-20">
        <h2 className="text-[20px] font-black text-slate-900 mb-8">
          <span className="text-mariner">{total}</span> Doanh nghiệp đang tuyển dụng T4/2026
        </h2>

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
                    <h3 className="text-[15px] font-bold text-slate-800 leading-tight group-hover:text-mariner transition-colors line-clamp-2">
                      {company.companyName}
                    </h3>
                    <p className="text-[12px] font-medium text-slate-400 mt-1 flex items-center gap-1 line-clamp-1">
                      {company.mainIndustry}
                    </p>
                  </div>
                </div>

                <p className="text-[13px] text-slate-500 font-medium leading-relaxed mb-6 line-clamp-3">
                  {company.description}
                </p>

                <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                  <span className="bg-blue-50 text-mariner text-[12px] font-black px-4 py-1.5 rounded-full uppercase tracking-tighter">
                    {company.activeJobs || 0} việc làm đang tuyển
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-mariner group-hover:translate-x-1 transition-all" />
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
