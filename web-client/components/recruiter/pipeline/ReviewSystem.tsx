import React, { useState } from 'react';
import useSWR from 'swr';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import { Star, Send, Trash2 } from 'lucide-react';

const fetcher = (url: string) => api.get(url).then(res => res.data);

export default function ReviewSystem({ candidateId, jobId, mutate: mutateParent }: { candidateId: string, jobId: string, mutate: any }) {
  const { data: reviews, mutate, isLoading } = useSWR(`/reviews/candidate/${candidateId}`, fetcher);
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scores, setScores] = useState({ nghiepVu: 0, iq: 0, kienThuc: 0 });

  const handleSubmit = async () => {
    if (!content.trim()) return toast.error('Vui lòng nhập nội dung đánh giá');
    setIsSubmitting(true);

    // Format content with scores
    const hasScores = scores.nghiepVu > 0 || scores.iq > 0 || scores.kienThuc > 0;
    const finalContent = hasScores
      ? `[SCORES_DATA]\nNghiệp vụ: ${scores.nghiepVu}/5\nIQ/Logic: ${scores.iq}/5\nKiến thức: ${scores.kienThuc}/5\n[END_SCORES]\n${content}`
      : content;

    try {
      await api.post('/reviews', {
        candidateId,
        jobPostingId: jobId,
        content: finalContent,
        rating
      });
      toast.success('Đã thêm đánh giá');
      setContent('');
      setRating(0);
      setScores({ nghiepVu: 0, iq: 0, kienThuc: 0 });
      mutate();
      mutateParent();
    } catch (err) {
      toast.error('Có lỗi xảy ra khi thêm đánh giá');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa đánh giá này?')) return;
    try {
      await api.delete(`/reviews/${id}`);
      toast.success('Đã xóa đánh giá');
      mutate();
      mutateParent();
    } catch (err) {
      toast.error('Không thể xóa đánh giá này (chỉ có thể xóa đánh giá do bạn tạo)');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Review List */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {isLoading ? (
          <div className="text-center text-sm text-slate-500 py-10">Đang tải đánh giá...</div>
        ) : reviews?.length === 0 ? (
          <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Star size={24} className="text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-700">Chưa có đánh giá nào</p>
            <p className="text-xs text-slate-500 mt-1">Hãy là người đầu tiên để lại đánh giá nội bộ cho ứng viên này.</p>
          </div>
        ) : (
          reviews?.map((review: any) => (
            <div key={review.reviewId} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative group">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <img
                    src={review.recruiter?.user?.avatar || '/default-avatar.png'}
                    className="w-8 h-8 rounded-full border border-slate-100 object-cover"
                    alt=""
                  />
                  <div>
                    <p className="text-sm font-bold text-slate-900 leading-none">
                      {review.recruiter?.fullName || 'Nhà tuyển dụng'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium mt-1">
                      {new Date(review.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                {review.rating > 0 && (
                  <div className="flex text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={14} fill={i < review.rating ? 'currentColor' : 'none'} className={i < review.rating ? '' : 'text-slate-200'} />
                    ))}
                  </div>
                )}
              </div>

              {/* Parse Scores if exists */}
              {review.content.includes('[SCORES_DATA]') ? (
                <>
                  <div className="flex gap-2 mt-3 mb-3 pb-3 border-b border-slate-50">
                    {review.content.match(/Nghiệp vụ: (\d+)\/5/) && (
                      <span className="bg-sky-50 text-sky-700 text-[10px] font-bold px-2.5 py-1 rounded-md border border-sky-100 flex items-center gap-1">
                        Nghiệp vụ: <span className="text-sky-900">{review.content.match(/Nghiệp vụ: (\d+)\/5/)[1]}/5</span>
                      </span>
                    )}
                    {review.content.match(/IQ\/Logic: (\d+)\/5/) && (
                      <span className="bg-purple-50 text-purple-700 text-[10px] font-bold px-2.5 py-1 rounded-md border border-purple-100 flex items-center gap-1">
                        IQ: <span className="text-purple-900">{review.content.match(/IQ\/Logic: (\d+)\/5/)[1]}/5</span>
                      </span>
                    )}
                    {review.content.match(/Kiến thức: (\d+)\/5/) && (
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-md border border-emerald-100 flex items-center gap-1">
                        Kiến thức: <span className="text-emerald-900">{review.content.match(/Kiến thức: (\d+)\/5/)[1]}/5</span>
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">
                    {review.content.split('[END_SCORES]\n')[1] || review.content}
                  </p>
                </>
              ) : (
                <p className="text-sm text-slate-700 mt-3 whitespace-pre-wrap">{review.content}</p>
              )}

              <button
                onClick={() => handleDelete(review.reviewId)}
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-1.5 text-rose-500 bg-rose-50 rounded-lg hover:bg-rose-100 transition-all"
                title="Xóa đánh giá"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Đánh giá chung:</span>
          <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                className="focus:outline-none transition-transform hover:scale-110"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
              >
                <Star
                  size={20}
                  className={`transition-colors ${(hoverRating || rating) >= star ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <button onClick={() => setRating(0)} className="text-[10px] text-slate-400 hover:text-slate-600 ml-2 font-medium">Xóa sao</button>
          )}
        </div>

        {/* Detailed Criteria */}
        <div className="mb-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
          {[
            { key: 'nghiepVu', label: 'Nghiệp vụ' },
            { key: 'iq', label: 'IQ/Logic' },
            { key: 'kienThuc', label: 'Kiến thức' }
          ].map(criterion => (
            <div key={criterion.key} className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex flex-col items-center">
              <span className="text-[10px] font-bold text-slate-600 mb-1">{criterion.label}</span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setScores(prev => ({ ...prev, [criterion.key]: s === prev[criterion.key as keyof typeof scores] ? 0 : s }))}
                    className="focus:outline-none"
                  >
                    <div className={`w-3 h-3 rounded-full transition-colors ${s <= scores[criterion.key as keyof typeof scores] ? 'bg-sky-400' : 'bg-slate-200 hover:bg-slate-300'}`}></div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Viết đánh giá nội bộ..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-3 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none resize-none min-h-[80px]"
          />
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !content.trim()}
            className="absolute right-3 bottom-3 p-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 disabled:opacity-50 disabled:bg-slate-300 transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-[10px] text-center text-slate-400 mt-3 font-medium">Đánh giá này chỉ hiển thị cho nội bộ hệ thống công ty của bạn.</p>
      </div>
    </div>
  );
}
