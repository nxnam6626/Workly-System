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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản Lý Doanh Nghiệp</h1>
          <p className="text-sm text-slate-500 mt-1">
            Xem danh sách công ty, hồ sơ nhà tuyển dụng và tin tuyển dụng tương ứng.
          </p>
        </div>
        <button
          onClick={fetchCompanies}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[560px]">
        {/* Filters */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/30 flex items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên công ty..."
              value={filters.search ?? ''}
              onChange={(e) => {
                setFilters({ ...filters, search: e.target.value });
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Công ty</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Mã số thuế</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Nhân sự (HR)</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Tin tuyển dụng</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Trạng thái</th>
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
                    <td className="px-6 py-4">
                      <Link href={`/admin/companies/${company.companyId}`} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
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
                        <div>
                          <p className="text-sm font-semibold text-indigo-600 group-hover:text-indigo-700 transition-colors">{company.companyName}</p>
                          <p className="text-xs text-slate-500 truncate max-w-[200px]">{company.address || 'Chưa cập nhật địa chỉ'}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-700 font-medium">{company.taxCode || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                        {company._count?.recruiters || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                        {company._count?.jobPostings || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {company.verifyStatus === 1 ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                          <CheckCircle className="w-3.5 h-3.5" /> Đã duyệt
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
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
          <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
            <span className="text-sm text-slate-500">
              Hiển thị <span className="font-semibold text-slate-700">{(page - 1) * PAGE_SIZE + 1}</span> -{' '}
              <span className="font-semibold text-slate-700">{Math.min(page * PAGE_SIZE, total)}</span> trong tổng số{' '}
              <span className="font-semibold text-slate-700">{total}</span>
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                Trang trước
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                Trang sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
