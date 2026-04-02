"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Building2 } from "lucide-react";
import api from "@/lib/api";
import { CompanyCard } from "@/components/CompanyCard";
import { Pagination } from "@/components/Pagination";

export default function CompanySearchPage() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 12;

  const fetchCompanies = useCallback(
    async (p = page) => {
      setLoading(true);
      try {
        const { data } = await api.get("/companies", {
          params: {
            search: searchQuery || undefined,
            page: p,
            limit: LIMIT,
          },
        });

        setCompanies(data.items || []);
        setTotal(data.total || 0);
      } catch (error) {
        console.error("Error fetching companies:", error);
      } finally {
        setLoading(false);
      }
    },
    [searchQuery, page]
  );

  useEffect(() => {
    fetchCompanies(1);
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCompanies(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchCompanies(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
            Khám phá <span className="text-blue-600">công ty</span> nổi bật
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Tìm hiểu văn hóa và môi trường làm việc của các doanh nghiệp hàng đầu.
          </p>
        </div>

        <div className="bg-white p-4 rounded-3xl shadow-xl shadow-slate-200/50 mb-12 border border-slate-100 max-w-4xl mx-auto">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex items-center bg-slate-50 rounded-2xl px-5 py-3 border border-slate-100 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100 transition-all">
              <Building2 className="w-5 h-5 text-slate-400 mr-3" />
              <input
                type="text"
                placeholder="Tìm kiếm tên công ty..."
                className="w-full bg-transparent border-none outline-none text-slate-700 placeholder:text-slate-400 text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="px-10 py-3 bg-blue-600 text-white font-semibold rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95 whitespace-nowrap"
            >
              Tìm Kiếm
            </button>
          </form>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="animate-pulse bg-white rounded-3xl h-[420px] border border-slate-200"
              />
            ))}
          </div>
        ) : companies.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {companies.map((company: any) => (
                <CompanyCard key={company.companyId} company={company} />
              ))}
            </div>

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        ) : (
          <div className="text-center py-24 bg-white rounded-3xl border border-slate-200 max-w-4xl mx-auto">
            <Search className="w-8 h-8 text-slate-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Không tìm thấy công ty</h3>
            <p className="text-slate-500 max-w-md mx-auto">
              Thử thay đổi từ khóa tìm kiếm của bạn nhé.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
