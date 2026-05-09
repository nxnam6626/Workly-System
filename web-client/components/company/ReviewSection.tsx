import React, { useState, useEffect } from 'react';
import { MessageSquare, Star, ShieldCheck, User, Loader2, PenLine } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import RatingStars from './RatingStars';
import WriteReviewModal from './WriteReviewModal';
import { useAuthStore } from '@/stores/auth';
import { useSocketStore } from '@/stores/socket';

interface ReviewSectionProps {
  companyId: string;
}

export default function ReviewSection({ companyId }: ReviewSectionProps) {
  const { user } = useAuthStore();
  const { socket, connect } = useSocketStore();
  const [reviews, setReviews] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [eligibleApp, setEligibleApp] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reviewsRes, statsRes] = await Promise.all([
        api.get(`/company-reviews/${companyId}`),
        api.get(`/company-reviews/${companyId}/stats`)
      ]);
      setReviews(reviewsRes.data);
      setStats(statsRes.data);

      // Check eligibility if user is logged in as candidate
      if (user?.candidate) {
        const appsRes = await api.get('/applications/my-applications');
        const apps = appsRes.data;
        // Find a completed/interviewing app for this company that hasn't been reviewed
        const eligible = apps.find((app: any) => 
          app.jobPosting.companyId === companyId && 
          ['INTERVIEWING', 'ACCEPTED', 'REJECTED', 'INTERVIEW_CONFIRMED'].includes(app.appStatus) &&
          !app.companyReview
        );
        setEligibleApp(eligible);
      }
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    connect();
    fetchData();
  }, [companyId]);

  useEffect(() => {
    if (socket) {
      const room = `company_${companyId}`;
      socket.emit('join_room', room);

      const handleSync = (data: any) => {
        if (data.type === 'NEW_REVIEW') {
          fetchData();
        }
      };

      socket.on('company.sync', handleSync);
      return () => {
        socket.off('company.sync', handleSync);
      };
    }
  }, [socket, companyId]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-mariner animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Summary */}
      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row gap-12 items-center">
        <div className="text-center md:text-left">
          <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">Đánh giá chung</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-6xl font-black text-slate-900">{stats?.avgTotal || 0}</h2>
            <span className="text-xl font-bold text-slate-400">/ 5</span>
          </div>
          <div className="mt-4">
            <RatingStars rating={Math.round(stats?.avgTotal || 0)} size={24} />
          </div>
          <p className="text-sm font-bold text-slate-500 mt-3">{stats?.count || 0} đánh giá đã xác thực</p>
        </div>

        <div className="flex-1 w-full space-y-4">
          <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
            <span className="text-sm font-bold text-slate-600">Quy trình tuyển dụng</span>
            <div className="flex items-center gap-3">
               <span className="text-sm font-black text-slate-900">{stats?.avgProcess || 0}</span>
               <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400" style={{ width: `${(stats?.avgProcess || 0) * 20}%` }} />
               </div>
            </div>
          </div>
          <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
            <span className="text-sm font-bold text-slate-600">Người phỏng vấn</span>
            <div className="flex items-center gap-3">
               <span className="text-sm font-black text-slate-900">{stats?.avgInterviewer || 0}</span>
               <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-500" style={{ width: `${(stats?.avgInterviewer || 0) * 20}%` }} />
               </div>
            </div>
          </div>
          <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
            <span className="text-sm font-bold text-slate-600">Môi trường làm việc</span>
            <div className="flex items-center gap-3">
               <span className="text-sm font-black text-slate-900">{stats?.avgOffice || 0}</span>
               <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${(stats?.avgOffice || 0) * 20}%` }} />
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA to write review */}
      {eligibleApp && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-mariner rounded-3xl p-8 text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl shadow-mariner/20"
        >
          <div className="text-center md:text-left">
            <h3 className="text-xl font-black mb-1">Bạn vừa phỏng vấn tại đây?</h3>
            <p className="text-mariner-50 font-bold opacity-90 text-sm">Hãy chia sẻ trải nghiệm của bạn để giúp cộng đồng ứng viên nhé!</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="px-8 py-4 bg-white text-mariner font-black rounded-2xl flex items-center gap-2 hover:shadow-lg transition-all active:scale-95 whitespace-nowrap"
          >
            <PenLine size={18} />
            Viết đánh giá ngay
          </button>
        </motion.div>
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
           Tất cả đánh giá
           <span className="text-sm font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{reviews.length}</span>
        </h3>

        {reviews.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100">
             <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare size={32} />
             </div>
             <p className="text-slate-400 font-bold italic">Chưa có đánh giá nào cho công ty này.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {reviews.map((review) => (
              <div key={review.reviewId} className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-4">
                 <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                          {review.isAnonymous ? (
                            <User className="text-slate-400" />
                          ) : (
                            <img src={review.candidate.user.avatar || '/default-avatar.png'} alt="avatar" className="w-full h-full object-cover" />
                          )}
                       </div>
                       <div>
                          <p className="font-black text-slate-900">{review.isAnonymous ? 'Ứng viên ẩn danh' : review.candidate.fullName}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(review.createdAt).toLocaleDateString()}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                       <ShieldCheck size={14} className="fill-emerald-100" />
                       <span className="text-[10px] font-black uppercase tracking-wider">Đã xác thực</span>
                    </div>
                 </div>

                 <div className="flex flex-wrap gap-x-6 gap-y-2">
                    <div className="flex items-center gap-2">
                       <span className="text-xs font-bold text-slate-500">Quy trình:</span>
                       <RatingStars rating={review.ratingProcess} size={14} />
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-xs font-bold text-slate-500">Interviewer:</span>
                       <RatingStars rating={review.ratingInterviewer} size={14} />
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-xs font-bold text-slate-500">Văn phòng:</span>
                       <RatingStars rating={review.ratingOffice} size={14} />
                    </div>
                 </div>

                 {review.content && (
                   <p className="text-slate-600 font-medium leading-relaxed bg-slate-50 p-4 rounded-2xl italic">
                      "{review.content}"
                   </p>
                 )}
              </div>
            ))}
          </div>
        )}
      </div>

      {eligibleApp && (
        <WriteReviewModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          companyId={companyId}
          applicationId={eligibleApp.applicationId}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}
