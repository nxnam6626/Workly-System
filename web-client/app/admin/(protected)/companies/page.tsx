'use client';

import { useState } from 'react';
import { RefreshCw, Search, Building2, CheckCircle, XCircle } from 'lucide-react';
import { adminCompaniesApi, type AdminCompany, type AdminCompanyFilters } from '@/lib/admin-api';
import Link from 'next/link';
import useSWR from 'swr';

const PAGE_SIZE = 15;

export default function CompaniesPage() {
  const [filters, setFilters] = useState<AdminCompanyFilters>({});
  const [page, setPage] = useState(1);

  // SWR Key based on filters and page
  const swrKey = ['/admin/companies', filters, page];
  
  const { data, error, isLoading, mutate } = useSWR(swrKey, () => 
    adminCompaniesApi.getAll({
      ...filters,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }), {
      revalidateOnFocus: false,
      dedupingInterval: 10000, // 10s
    }
  );

  const companies = data?.data ?? [];
  const total = data?.total ?? 0;
  const fetchCompanies = () => mutate();

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
               <Building2 className="w-6 h-6" />
             </div>
             <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                  Doanh Nghiệp
                </h1>
                <p className="text-slate-500 font-medium mt-1">
                  Xem danh sách công ty, hồ sơ nhà tuyển dụng và tin tuyển dụng tương ứng.
                </p>
             </div>
          </div>
        </div>
        <button
          onClick={fetchCompanies}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-[2.5rem] border border-indigo-100 shadow-2xl shadow-indigo-50/50 overflow-hidden flex flex-col min-h-[600px] relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 to-blue-500" />
        {/* Filters */}
        <div className="p-8 border-b border-indigo-50 bg-indigo-50/20">
          <div className="relative flex-1 min-w-[200px] max-w-md group">
            <div className="absolute inset-0 bg-indigo-500/5 rounded-2xl blur-xl group-focus-within:bg-indigo-500/10 transition-all" />
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Tìm theo tên công ty..."
                value={filters.search ?? ''}
                onChange={(e) => {
                  setFilters({ ...filters, search: e.target.value });
                  setPage(1);
                }}
                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-0 focus:border-indigo-500 transition-all shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Công ty</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mã số thuế</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Nhân sự</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Tin tuyển dụng</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : companies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Không tìm thấy doanh nghiệp nào.
                  </td>
                </tr>
              ) : (
                companies.map((company) => (
                  <tr key={company.companyId} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-8 py-4">
                      <Link href={`/admin/companies/${company.companyId}`} className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
                          {company.logo ? (
                            <img 
                              src={company.logo} 
                              alt={company.companyName} 
                              className="w-full h-full object-cover" 
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                const parent = (e.target as HTMLElement).parentElement;
                                if (parent) {
                                  const icon = document.createElement('div');
                                  icon.className = 'w-full h-full flex items-center justify-center';
                                  icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building-2 text-slate-400"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>';
                                  parent.appendChild(icon);
                                }
                              }}
                            />
                          ) : (
                            <Building2 className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[15px] font-black tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{company.companyName}</p>
                          <p className="text-[12px] font-medium text-slate-500 truncate max-w-[250px] mt-0.5">{company.address || 'Chưa cập nhật địa chỉ'}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-8 py-4">
                      <p className="text-[13px] font-bold text-slate-700 tracking-tight">{company.taxCode || 'N/A'}</p>
                    </td>
                    <td className="px-8 py-4 text-center">
                      <span className="inline-flex items-center justify-center min-w-[2.5rem] px-3 py-1.5 rounded-2xl bg-indigo-50 text-indigo-700 text-xs font-black shadow-sm">
                        {company._count?.recruiters || 0}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-center">
                      <span className="inline-flex items-center justify-center min-w-[2.5rem] px-3 py-1.5 rounded-2xl bg-emerald-50 text-emerald-700 text-xs font-black shadow-sm">
                        {company._count?.jobPostings || 0}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-center">
                      {company.verifyStatus === 1 ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black uppercase tracking-widest">
                          <CheckCircle className="w-3.5 h-3.5" /> Đã duyệt
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-black uppercase tracking-widest">
                          <XCircle className="w-3.5 h-3.5" /> Chờ duyệt
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-8 py-5 border-t border-slate-50 bg-slate-50/30">
            <div className="flex items-center gap-4">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                 Trang <span className="text-slate-900">{page}</span> / <span className="text-slate-900">{totalPages || 1}</span>
               </p>
               <div className="h-1 w-12 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-500" 
                    style={{ width: `${(page / (totalPages || 1)) * 100}%` }}
                  />
               </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-all active:scale-95"
              >
                Trước
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-all active:scale-95"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
