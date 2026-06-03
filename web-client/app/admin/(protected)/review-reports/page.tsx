'use client';

import { useState, useEffect } from 'react';
import { adminReviewReportsApi, CompanyReviewReportDto } from '@/lib/admin-api';
import {
  ShieldAlert,
  Search,
  CheckCircle,
  XCircle,
  Loader2,
  Filter,
  Eye,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function AdminReviewReportsPage() {
  const [reports, setReports] = useState<CompanyReviewReportDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await adminReviewReportsApi.getAll({
        page,
        limit: 10,
        status: statusFilter || undefined,
      });
      setReports(res.data);
      setTotalPages(res.meta.totalPages);
      setTotal(res.meta.total);
    } catch (error) {
      toast.error('Lỗi khi tải danh sách báo cáo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchReports();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [statusFilter, page]);

  const handleResolve = async (id: string, action: 'DELETE_REVIEW' | 'REJECT_REPORT') => {
    const title = action === 'DELETE_REVIEW' ? 'Chấp nhận báo cáo và xóa đánh giá này?' : 'Từ chối báo cáo này?';
    
    toast.custom(
      (t) => (
        <div className={`bg-white rounded-2xl border border-slate-100 shadow-xl p-4 flex flex-col gap-3 min-w-[300px] ${t.visible ? 'animate-in fade-in slide-in-from-top-2' : 'animate-out fade-out slide-out-to-top-2'}`}>
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${action === 'DELETE_REVIEW' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Xác nhận thao tác</h3>
              <p className="text-slate-500 text-xs mt-0.5">{title}</p>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-1">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-4 py-2 bg-slate-50 text-slate-600 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  await adminReviewReportsApi.resolve(id, action);
                  toast.success('Xử lý báo cáo thành công');
                  fetchReports();
                } catch (error) {
                  toast.error('Lỗi khi xử lý báo cáo');
                }
              }}
              className={`px-4 py-2 text-white text-xs font-bold rounded-xl transition-colors ${action === 'DELETE_REVIEW' ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-800 hover:bg-slate-900'}`}
            >
              Xác nhận
            </button>
          </div>
        </div>
      ),
      { duration: Infinity }
    );
  };

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case 'FALSE_INFORMATION': return 'Sai sự thật';
      case 'OFFENSIVE': return 'Từ ngữ xúc phạm';
      case 'SPAM': return 'Spam / Quảng cáo';
      default: return 'Khác';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
               <ShieldAlert className="w-6 h-6" />
             </div>
             <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                  Báo Cáo Đánh Giá
                </h1>
                <p className="text-slate-500 font-medium mt-1">
                  Kiểm duyệt các báo cáo sai phạm từ Nhà Tuyển Dụng. Tổng cộng: {total} báo cáo.
                </p>
             </div>
          </div>
        </div>
      </div>

      {/* Filters section */}
      <div className="bg-white rounded-[2.5rem] border border-red-100 shadow-2xl shadow-red-50/50 overflow-hidden flex flex-col min-h-[600px] relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-400 to-rose-500" />
        <div className="p-8 border-b border-red-50 bg-red-50/20 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative group shrink-0 w-full md:w-64">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full h-full appearance-none pl-12 pr-10 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-0 focus:border-red-500 transition-all cursor-pointer min-w-[200px] shadow-sm"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="PENDING">Chờ xử lý</option>
                <option value="APPROVED">Đã xóa đánh giá (Chấp nhận BC)</option>
                <option value="REJECTED">Đã từ chối</option>
              </select>
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

      {/* Data Table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/80 backdrop-blur-sm">
                <th className="px-8 py-5">Nhà Tuyển Dụng</th>
                <th className="px-8 py-5 max-w-[200px]">Đánh Giá Bị Báo Cáo</th>
                <th className="px-8 py-5 max-w-[250px]">Lý Do & Bằng Chứng</th>
                <th className="px-8 py-5">Trạng Thái</th>
                <th className="px-8 py-5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center">
                    <Loader2 className="w-6 h-6 text-red-500 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-medium">
                    Không tìm thấy báo cáo nào.
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <motion.tr 
                    key={report.reportId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-8 py-4">
                      <div className="flex flex-col min-w-0">
                        <span className="text-[14px] font-black tracking-tight text-slate-900 truncate">{report.recruiter?.fullName || 'Ẩn danh'}</span>
                        <span className="text-[12px] font-medium text-slate-500 truncate mt-0.5">{report.recruiter?.company?.companyName}</span>
                        <span className="text-[10px] text-slate-400 mt-1">{new Date(report.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4 max-w-[200px] whitespace-normal">
                      <div className="text-[13px] font-medium text-slate-600 line-clamp-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        {report.review?.content || <span className="italic text-slate-400">Không có nội dung</span>}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Từ ứng viên: <b>{report.review?.candidate?.fullName || 'Ẩn danh'}</b>
                      </p>
                    </td>
                    <td className="px-8 py-4 max-w-[250px] whitespace-normal">
                      <span className="inline-block px-2 py-1 bg-red-50 text-red-600 text-[10px] font-bold rounded-md mb-2 border border-red-100">
                        {getReasonLabel(report.reason)}
                      </span>
                      <div className="text-[13px] font-medium text-slate-600 break-words line-clamp-3">
                        {report.evidence}
                      </div>
                      {report.evidence.includes('http') && (
                        <a href={report.evidence.match(/https?:\/\/[^\s]+/)?.[0] || '#'} target="_blank" rel="noreferrer" className="text-blue-500 text-[11px] font-bold mt-2 flex items-center gap-1 hover:underline">
                          <ExternalLink className="w-3 h-3" /> Xem link bằng chứng
                        </a>
                      )}
                    </td>
                    <td className="px-8 py-4">
                      {report.status === 'APPROVED' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black uppercase tracking-widest">
                          Đã xóa ĐG
                        </span>
                      )}
                      {report.status === 'REJECTED' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 text-slate-500 border border-slate-100 text-[10px] font-black uppercase tracking-widest">
                          Từ chối
                        </span>
                      )}
                      {report.status === 'PENDING' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-black uppercase tracking-widest">
                          Chờ xử lý
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-4">
                      {report.status === 'PENDING' && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleResolve(report.reportId, 'DELETE_REVIEW')}
                            title="Đồng ý xóa đánh giá"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 transition-colors font-bold text-xs"
                          >
                            <CheckCircle className="w-4 h-4" /> Duyệt xóa
                          </button>
                          <button
                            onClick={() => handleResolve(report.reportId, 'REJECT_REPORT')}
                            title="Từ chối báo cáo"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors font-bold text-xs"
                          >
                            <XCircle className="w-4 h-4" /> Bỏ qua
                          </button>
                        </div>
                      )}
                    </td>
                  </motion.tr>
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
                    className="h-full bg-red-500 transition-all duration-500" 
                    style={{ width: `${(page / (totalPages || 1)) * 100}%` }}
                  />
               </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-all active:scale-95"
              >
                Trước
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
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
