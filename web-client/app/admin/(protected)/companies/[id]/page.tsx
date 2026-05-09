'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { adminCompaniesApi, adminJobsApi } from '@/lib/admin-api';
import {
  Building2, MapPin, Globe, Users, FileText, CheckCircle2,
  XCircle, ArrowLeft, Mail, Clock, Briefcase, Calendar, ShieldAlert
} from 'lucide-react';
import Link from 'next/link';
import JobQuickViewModal from '../../jobs/JobQuickViewModal';

export default function AdminCompanyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [company, setCompany] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quickViewJob, setQuickViewJob] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setIsProcessing(id);
    try {
      await adminJobsApi.approve(id);
      setCompany((prev: any) => ({
        ...prev,
        jobPostings: prev.jobPostings.map((j: any) => 
          j.jobPostingId === id ? { ...j, status: 'APPROVED' } : j
        )
      }));
      setQuickViewJob(null);
    } catch (err) {
      alert('Lỗi duyệt tin');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Nhập lý do từ chối:');
    if (!reason) return;
    setIsProcessing(id);
    try {
      await adminJobsApi.reject(id, reason);
      setCompany((prev: any) => ({
        ...prev,
        jobPostings: prev.jobPostings.map((j: any) => 
          j.jobPostingId === id ? { ...j, status: 'REJECTED' } : j
        )
      }));
      setQuickViewJob(null);
    } catch (err) {
      alert('Lỗi từ chối tin');
    } finally {
      setIsProcessing(null);
    }
  };

  useEffect(() => {
    if (params.id) {
      adminCompaniesApi.getOne(params.id as string)
        .then(setCompany)
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-200">
        <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-800">Không tìm thấy công ty</h3>
        <button onClick={() => router.back()} className="mt-4 text-blue-500 hover:underline">Quay lại</button>
      </div>
    );
  }

  const jobsApproved = company.jobPostings?.filter((j: any) => j.status === 'APPROVED').length || 0;
  const jobsPending = company.jobPostings?.filter((j: any) => j.status === 'PENDING').length || 0;
  const jobsRejected = company.jobPostings?.filter((j: any) => j.status === 'REJECTED').length || 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Chi Tiết Doanh Nghiệp</h1>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
            Mã định danh: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs text-slate-600">{company.companyId}</code>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Company Profile */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-blue-500 to-blue-400 opacity-20"></div>
            
            <div className="relative z-10 flex flex-col items-center text-center mt-4">
              {company.logo ? (
                <img src={company.logo} alt={company.companyName} className="w-24 h-24 rounded-2xl object-contain bg-white border-4 border-white shadow-md" />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-white border-4 border-white shadow-md flex items-center justify-center">
                  <Building2 className="w-10 h-10 text-slate-300" />
                </div>
              )}
              <h2 className="text-xl font-bold text-slate-900 mt-4">{company.companyName}</h2>
              <div className="mt-2 flex items-center justify-center gap-2">
                {company.isRegistered ? (
                  <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md">
                    <CheckCircle2 className="w-3 h-3" /> Đã xác thực
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-md">
                    <Clock className="w-3 h-3" /> Chờ xác thực
                  </span>
                )}
              </div>
            </div>

            <div className="mt-8 space-y-4 text-sm">
              <div className="flex items-start gap-3 text-slate-600">
                <FileText className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Mã số thuế</span>
                  <span className="font-medium text-slate-900">{company.taxCode || 'N/A'}</span>
                </div>
              </div>
              <div className="flex items-start gap-3 text-slate-600">
                <MapPin className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Trụ sở chính</span>
                  <span className="font-medium text-slate-900">{company.address || 'Chưa cập nhật'}</span>
                </div>
              </div>
              <div className="flex items-start gap-3 text-slate-600">
                <Globe className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Website</span>
                  {company.websiteUrl ? (
                    <a href={company.websiteUrl} target="_blank" rel="noreferrer" className="font-medium text-blue-600 hover:underline">{company.websiteUrl}</a>
                  ) : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* KPI Mini-Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nhân sự</span>
              <span className="text-3xl font-black text-slate-900">{company.recruiters?.length || 0}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tin tuyển dụng</span>
              <span className="text-3xl font-black text-blue-600">{company.jobPostings?.length || 0}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Data Tables */}
        <div className="lg:col-span-2 space-y-6">
          {/* Members Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                Danh Sách Nhân Sự
              </h3>
            </div>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3">Nhân sự</th>
                    <th className="px-6 py-3">Trạng thái</th>
                    <th className="px-6 py-3 text-right">Ngày tham gia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {company.recruiters?.length > 0 ? company.recruiters.map((rec: any) => (
                    <tr key={rec.recruiterId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                            {rec.fullName?.[0] || rec.user?.email?.[0] || 'U'}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{rec.fullName || 'Chưa cập nhật'}</p>
                            <p className="text-xs text-slate-500">{rec.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          rec.user?.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                          rec.user?.status === 'LOCKED' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {rec.user?.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-500 text-xs font-medium">
                        {new Date(rec.user?.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-slate-400 italic">
                        Chưa có nhân sự nào được liên kết
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Job Postings Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-500" />
                Lịch Sử Đăng Tin ({company.jobPostings?.length || 0})
              </h3>
              <div className="flex gap-2">
                <span className="text-xs font-semibold px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md">{jobsApproved} Đã duyệt</span>
                <span className="text-xs font-semibold px-2 py-1 bg-amber-100 text-amber-700 rounded-md">{jobsPending} Chờ duyệt</span>
                <span className="text-xs font-semibold px-2 py-1 bg-rose-100 text-rose-700 rounded-md">{jobsRejected} Từ chối</span>
              </div>
            </div>
            <div className="p-0 max-h-[400px] overflow-y-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3">Tiêu đề tin</th>
                    <th className="px-6 py-3">AI Score</th>
                    <th className="px-6 py-3">Trạng thái</th>
                    <th className="px-6 py-3 text-right">Ngày đăng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {company.jobPostings?.length > 0 ? company.jobPostings.map((job: any) => (
                    <tr key={job.jobPostingId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => setQuickViewJob({ ...job, company: { companyName: company.companyName, logo: company.logo, address: company.address } })} 
                          className="font-semibold text-left text-slate-900 hover:text-blue-600 line-clamp-1 max-w-[250px] transition-colors"
                        >
                          {job.title}
                        </button>
                        <p className="text-[10px] text-slate-400 mt-0.5">{job.jobPostingId.slice(0, 8)}...</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${job.aiReliabilityScore >= 70 ? 'bg-emerald-500' : job.aiReliabilityScore >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} 
                              style={{ width: `${job.aiReliabilityScore || 0}%` }} 
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-600">{job.aiReliabilityScore || 0}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          job.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                          job.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                          job.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-500 text-xs font-medium">
                        {new Date(job.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic">
                        Chưa có tin tuyển dụng nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <JobQuickViewModal
        job={quickViewJob}
        onClose={() => setQuickViewJob(null)}
        onApprove={handleApprove}
        onReject={handleReject}
        isProcessing={!!isProcessing}
      />
    </div>
  );
}
