"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Building2, 
  MapPin, 
  Globe, 
  BadgeCheck, 
  AlertCircle, 
  CalendarDays,
  Briefcase,
  Users
} from "lucide-react";
import api from "@/lib/api";
import dynamic from 'next/dynamic';
import Link from "next/link";
import { JobCard } from "@/components/JobCard";

const JobMap = dynamic(() => import('@/components/JobMap'), { ssr: false });

export default function CompanyDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const { data } = await api.get(`/companies/${id}`);
        setCompany(data);
      } catch (error) {
        console.error("Failed to load company:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCompany();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-32 pb-12 flex justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-slate-50 pt-32 pb-12 flex flex-col items-center">
        <Building2 className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-700">Không tìm thấy công ty</h2>
        <p className="text-slate-500 mt-2">Công ty này có thể không tồn tại hoặc đã bị xóa.</p>
        <button 
          onClick={() => router.push("/companies")}
          className="mt-6 px-6 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      {/* Header Banner */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            {/* Logo */}
            <div className="w-32 h-32 bg-white rounded-3xl shadow-lg border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
              {company.logo ? (
                <img src={company.logo} alt={company.companyName} className="w-full h-full object-contain p-2" />
              ) : (
                <Building2 className="w-12 h-12 text-slate-300" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                  {company.companyName}
                </h1>
                {company.verifyStatus === 1 ? (
                  <div className="flex items-center bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-sm font-bold border border-emerald-100 shrink-0">
                    <BadgeCheck className="w-4 h-4 mr-1" />
                    Đã xác thực
                  </div>
                ) : (
                  <div className="flex items-center bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-sm font-bold border border-amber-100 shrink-0">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Chưa xác thực
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap gap-4 text-slate-600 font-medium text-[15px] mt-4">
                {company.industry && (
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 opacity-70" />
                    <span>{company.industry}</span>
                  </div>
                )}
                {company.employeeCount && (
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 opacity-70" />
                    <span>Quy mô: {company.employeeCount.replace('_', ' - ')} nhân viên</span>
                  </div>
                )}
                {company.website && (
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-4 h-4 opacity-70" />
                    <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {company.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
              </div>
            </div>
            
            {/* Action */}
            <div className="md:text-right shrink-0">
              <div className="text-sm text-slate-500 font-medium bg-slate-100 px-4 py-3 rounded-2xl border border-slate-200 text-center">
                <div className="text-2xl font-black text-blue-600">{company.jobPostings?.length || 0}</div>
                <div className="mt-0.5">Việc làm đang tuyển</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content (Left) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Giới thiệu công ty */}
            <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 md:col-span-2">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                Giới thiệu công ty
              </h2>
              {company.description ? (
                <div 
                  className="prose prose-slate max-w-none text-[15px] leading-relaxed text-slate-700"
                  dangerouslySetInnerHTML={{ __html: company.description }}
                />
              ) : (
                <p className="text-slate-500 italic">Công ty chưa cập nhật phần giới thiệu.</p>
              )}
            </section>

            {/* Việc làm đang tuyển */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                Tuyển dụng ({company.jobPostings?.length || 0})
              </h2>
              {company.jobPostings?.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {company.jobPostings.map((job: any) => (
                    <JobCard key={job.jobPostingId} job={{ ...job, company }} />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm">
                  <p className="text-slate-500">Hiện công ty chưa có vị trí nào đang tuyển dụng.</p>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar (Right) */}
          <div className="space-y-8">
            {/* Contact Info Widget */}
            {company.taxCode && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-[17px] font-bold text-slate-900 mb-4 pb-3 border-b border-slate-50">Thông tin xác thực</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-[13px] text-slate-500 font-medium">Mã số thuế</p>
                    <p className="text-[15px] font-semibold text-slate-800">{company.taxCode}</p>
                  </div>
                  {company.verifyStatus === 1 ? (
                     <div className="bg-emerald-50 text-emerald-700 px-3 py-2 rounded-xl text-sm mt-2 border border-emerald-100">
                        Hồ sơ công ty này đã được xác thực an toàn thông qua cổng dịch vụ MST quốc gia.
                     </div>
                  ) : (
                     <div className="bg-amber-50 text-amber-700 px-3 py-2 rounded-xl text-sm mt-2 border border-amber-100">
                        Công ty này chưa hoàn tất quá trình xác minh thông tin doanh nghiệp.
                     </div>
                  )}
                </div>
              </div>
            )}

            {/* Map Widget */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-[17px] font-bold text-slate-900 mb-4 pb-3 border-b border-slate-50">Vị trí & Chi nhánh</h3>
              
              <div className="space-y-4 mb-5">
                {company.branches?.length > 0 ? (
                  company.branches.map((b: any, idx: number) => (
                    <div key={b.branchId} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-xs font-bold">{idx + 1}</span>
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-slate-800">{b.name}</p>
                        <p className="text-[13px] text-slate-500 mt-0.5">{b.address}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[14px] text-slate-500">Chưa có chi nhánh nào được cập nhật.</p>
                )}
              </div>

              {company.branches?.length > 0 && company.branches.some((b: any) => b.latitude && b.longitude) && (
                <div className="h-[250px] w-full rounded-2xl overflow-hidden border border-slate-200">
                  <JobMap 
                    branches={company.branches.filter((b: any) => b.latitude && b.longitude)}
                  />
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
