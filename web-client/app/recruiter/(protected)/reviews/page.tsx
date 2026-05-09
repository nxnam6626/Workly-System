"use client";

import React, { useEffect, useState } from "react";
import { Star, MessageSquare, Shield, CheckCircle2, AlertTriangle, Building2, Calendar, FileText } from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface Review {
  reviewId: string;
  ratingProcess: number;
  ratingInterviewer: number;
  ratingOffice: number;
  content: string;
  isAnonymous: boolean;
  status: string;
  createdAt: string;
  candidate?: {
    fullName: string;
    user?: { avatar?: string };
  };
  application?: {
    jobPosting?: { title: string };
  };
}

interface Stats {
  count: number;
  avgProcess: number;
  avgInterviewer: number;
  avgOffice: number;
  avgTotal: number;
}

import { useAuthStore } from "@/stores/auth";

export default function RecruiterReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const companyId = user?.recruiter?.companyId;

        if (!companyId) {
          toast.error("Tài khoản chưa thuộc công ty nào.");
          setIsLoading(false);
          return;
        }

        const [reviewsRes, statsRes] = await Promise.all([
          api.get(`/company-reviews/${companyId}`),
          api.get(`/company-reviews/${companyId}/stats`),
        ]);

        setReviews(reviewsRes.data);
        setStats(statsRes.data);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= Math.round(rating)
                ? "fill-orange-400 text-orange-400"
                : "fill-slate-100 text-slate-200"
            }`}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 min-h-screen">
        <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-slate-50 p-6 md:p-8" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Đánh Giá & Phản Hồi</h1>
          <p className="text-slate-500 mt-2 font-medium">Lắng nghe ứng viên để cải thiện quy trình tuyển dụng của công ty.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center items-center">
            <h3 className="text-slate-500 font-bold mb-2">Điểm trung bình</h3>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-black text-slate-900">{stats?.avgTotal?.toFixed(1) || "0.0"}</span>
              <span className="text-slate-400 font-bold mb-1">/ 5</span>
            </div>
            <div className="mt-3">{renderStars(stats?.avgTotal || 0)}</div>
            <p className="text-xs text-slate-400 font-medium mt-3">{stats?.count || 0} bài đánh giá</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-5 md:col-span-3">
            <h3 className="text-slate-900 font-bold">Chi tiết tiêu chí</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              
              <div>
                <p className="text-sm font-bold text-slate-500 mb-2">Quy trình phỏng vấn</p>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black text-slate-900">{stats?.avgProcess?.toFixed(1) || "0.0"}</span>
                  {renderStars(stats?.avgProcess || 0)}
                </div>
              </div>

              <div>
                <p className="text-sm font-bold text-slate-500 mb-2">Người phỏng vấn</p>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black text-slate-900">{stats?.avgInterviewer?.toFixed(1) || "0.0"}</span>
                  {renderStars(stats?.avgInterviewer || 0)}
                </div>
              </div>

              <div>
                <p className="text-sm font-bold text-slate-500 mb-2">Không gian văn phòng</p>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black text-slate-900">{stats?.avgOffice?.toFixed(1) || "0.0"}</span>
                  {renderStars(stats?.avgOffice || 0)}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-500" />
            Nhận xét mới nhất
          </h2>

          {reviews.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-16 text-center">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center mb-6">
                <FileText className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Chưa có đánh giá nào</h3>
              <p className="text-slate-500">Khi có ứng viên đánh giá buổi phỏng vấn, nội dung sẽ hiển thị ở đây.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {reviews.map((review) => (
                <div key={review.reviewId} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                        {review.isAnonymous ? (
                          <Shield className="w-5 h-5 text-slate-400" />
                        ) : review.candidate?.user?.avatar ? (
                          <img src={review.candidate.user.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-bold text-slate-500 text-sm">
                            {review.candidate?.fullName?.[0]?.toUpperCase() || "?"}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">
                          {review.isAnonymous ? "Ứng viên ẩn danh" : review.candidate?.fullName}
                        </p>
                        <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                          </span>
                          {review.application?.jobPosting?.title && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="text-blue-500 font-semibold line-clamp-1 max-w-[150px] md:max-w-[200px]" title={review.application.jobPosting.title}>
                                Vị trí: {review.application.jobPosting.title}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-xs font-bold border border-orange-100">
                      <Star className="w-3.5 h-3.5 fill-orange-500" />
                      {((review.ratingProcess + review.ratingInterviewer + review.ratingOffice) / 3).toFixed(1)}
                    </div>
                  </div>

                  <p className="text-slate-700 text-sm leading-relaxed mb-4 bg-slate-50 p-4 rounded-xl">
                    "{review.content}"
                  </p>

                  <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100 text-[11px] font-bold text-slate-500 text-center">
                    <div>
                      <p className="mb-1 text-slate-400">Quy trình</p>
                      <div className="flex justify-center gap-0.5">
                        <Star className="w-3 h-3 fill-slate-300 text-slate-300" />
                        <span className="text-slate-700 ml-1">{review.ratingProcess}</span>
                      </div>
                    </div>
                    <div>
                      <p className="mb-1 text-slate-400">Người PV</p>
                      <div className="flex justify-center gap-0.5">
                        <Star className="w-3 h-3 fill-slate-300 text-slate-300" />
                        <span className="text-slate-700 ml-1">{review.ratingInterviewer}</span>
                      </div>
                    </div>
                    <div>
                      <p className="mb-1 text-slate-400">Văn phòng</p>
                      <div className="flex justify-center gap-0.5">
                        <Star className="w-3 h-3 fill-slate-300 text-slate-300" />
                        <span className="text-slate-700 ml-1">{review.ratingOffice}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
