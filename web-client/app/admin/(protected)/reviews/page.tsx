'use client';

import { useState, useEffect } from 'react';
import { adminReviewsApi, CompanyReviewDto } from '@/lib/admin-api';
import {
  Star,
  Search,
  CheckCircle,
  EyeOff,
  Trash2,
  AlertTriangle,
  Loader2,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<CompanyReviewDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await adminReviewsApi.getAll({
        page,
        limit: 10,
        searchTerm,
        status: statusFilter || undefined,
      });
      setReviews(res.data);
      setTotalPages(res.meta.totalPages);
      setTotal(res.meta.total);
    } catch (error) {
      toast.error('Lỗi khi tải danh sách đánh giá');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchReviews();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, statusFilter, page]);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await adminReviewsApi.updateStatus(id, status);
      toast.success('Cập nhật trạng thái thành công');
      fetchReviews();
    } catch (error) {
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  };

  const handleDelete = async (id: string) => {
    toast.custom(
      (t) => (
        <div className={`bg-white rounded-2xl border border-slate-100 shadow-xl p-4 flex flex-col gap-3 min-w-[300px] ${t.visible ? 'animate-in fade-in slide-in-from-top-2' : 'animate-out fade-out slide-out-to-top-2'}`}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-red-50 text-red-600">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Xác nhận xóa đánh giá</h3>
              <p className="text-slate-500 text-xs mt-0.5">Bạn có chắc chắn muốn xóa đánh giá này? Hành động này không thể hoàn tác.</p>
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
                  await adminReviewsApi.delete(id);
                  toast.success('Đã xóa đánh giá');
                  fetchReviews();
                } catch (error) {
                  toast.error('Lỗi khi xóa đánh giá');
                }
              }}
              className="px-4 py-2 text-white text-xs font-bold rounded-xl transition-colors bg-red-600 hover:bg-red-700"
            >
              Xác nhận xóa
            </button>
          </div>
        </div>
      ),
      { duration: Infinity }
    );
  };

  const calculateAvg = (r: CompanyReviewDto) => {
    return ((r.ratingProcess + r.ratingInterviewer + r.ratingOffice) / 3).toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
               <Star className="w-6 h-6" />
             </div>
             <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                  Quản Lý Đánh Giá
                </h1>
                <p className="text-slate-500 font-medium mt-1">
                  Kiểm duyệt đánh giá công ty từ ứng viên. Tổng cộng: {total} bài.
                </p>
             </div>
          </div>
        </div>
      </div>

      {/* Filters section */}
      <div className="bg-white rounded-[2.5rem] border border-indigo-100 shadow-2xl shadow-indigo-50/50 overflow-hidden flex flex-col min-h-[600px] relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 to-blue-500" />
        <div className="p-8 border-b border-indigo-50 bg-indigo-50/20 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 group">
              <div className="absolute inset-0 bg-indigo-500/5 rounded-2xl blur-xl group-focus-within:bg-indigo-500/10 transition-all" />
              <div className="relative flex items-center h-full">
                <Search className="absolute left-4 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Tìm theo tên công ty, ứng viên hoặc nội dung..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="w-full h-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-0 focus:border-indigo-500 transition-all shadow-sm"
                />
              </div>
            </div>
            <div className="relative group shrink-0">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full h-full appearance-none pl-12 pr-10 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-0 focus:border-indigo-500 transition-all cursor-pointer min-w-[200px] shadow-sm"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="PUBLISHED">Đã duyệt</option>
                <option value="HIDDEN">Đã ẩn</option>
                <option value="FLAGGED">Cần chú ý</option>
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
                <th className="px-8 py-5">Công Ty</th>
                <th className="px-8 py-5">Ứng Viên</th>
                <th className="px-8 py-5">Đánh Giá</th>
                <th className="px-8 py-5 max-w-[200px]">Nội Dung</th>
                <th className="px-8 py-5">Trạng Thái</th>
                <th className="px-8 py-5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center">
                    <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-slate-400 font-medium">
                    Không tìm thấy đánh giá nào phù hợp.
                  </td>
                </tr>
              ) : (
                reviews.map((review) => (
                  <motion.tr 
                    key={review.reviewId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
                          {review.company.logo ? (
                            <img src={review.company.logo} alt="logo" className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-black text-slate-400 text-sm">
                              {review.company.companyName.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[14px] font-black tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{review.company.companyName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex flex-col min-w-0">
                        <span className="text-[14px] font-black tracking-tight text-slate-900 truncate">{review.isAnonymous ? 'Ẩn danh' : review.candidate.fullName}</span>
                        <span className="text-[11px] font-medium text-slate-400 truncate max-w-[180px] mt-0.5">{review.isAnonymous ? '---' : review.candidate.user.email}</span>
                        {review.application?.jobPosting?.title && (
                          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mt-1 truncate max-w-[180px]" title={review.application.jobPosting.title}>
                            {review.application.jobPosting.title}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-1.5 font-black text-amber-500 bg-amber-50 px-3 py-1.5 rounded-xl w-max border border-amber-100">
                        <Star className="w-4 h-4 fill-current" />
                        <span>{calculateAvg(review)}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4 max-w-[200px]">
                      <div className="text-[13px] font-medium text-slate-600 truncate" title={review.content || 'Không có nội dung'}>
                        {review.content || <span className="italic text-slate-400">Không có nội dung</span>}
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      {review.status === 'PUBLISHED' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black uppercase tracking-widest">
                          Đã duyệt
                        </span>
                      )}
                      {review.status === 'HIDDEN' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 text-slate-500 border border-slate-100 text-[10px] font-black uppercase tracking-widest">
                          Đã ẩn
                        </span>
                      )}
                      {review.status === 'FLAGGED' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 text-[10px] font-black uppercase tracking-widest">
                          Cảnh báo
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                        {review.status !== 'PUBLISHED' && (
                          <button
                            onClick={() => handleUpdateStatus(review.reviewId, 'PUBLISHED')}
                            title="Duyệt / Hiển thị"
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-100 hover:shadow-lg transition-all active:scale-90"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {review.status !== 'HIDDEN' && (
                          <button
                            onClick={() => handleUpdateStatus(review.reviewId, 'HIDDEN')}
                            title="Ẩn bài"
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 hover:shadow-lg transition-all active:scale-90"
                          >
                            <EyeOff className="w-4 h-4" />
                          </button>
                        )}
                        {review.status !== 'FLAGGED' && (
                          <button
                            onClick={() => handleUpdateStatus(review.reviewId, 'FLAGGED')}
                            title="Gắn cờ cảnh báo"
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-amber-500 hover:border-amber-100 hover:shadow-lg transition-all active:scale-90"
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(review.reviewId)}
                          title="Xóa vĩnh viễn"
                          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-100 hover:shadow-lg transition-all ml-1 active:scale-90"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
                    className="h-full bg-indigo-500 transition-all duration-500" 
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
