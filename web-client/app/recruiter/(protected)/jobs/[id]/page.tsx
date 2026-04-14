'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, MapPin, DollarSign, Calendar, Users, Eye, ArrowLeft, Loader2, Star, Sparkles } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/auth';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { formatSalary } from '@/lib/utils';

export default function JobDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  const [job, setJob] = useState<any>(null);
  const [suggestedCandidates, setSuggestedCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [invitingCandidate, setInvitingCandidate] = useState<any>(null);
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);
  const { accessToken } = useAuthStore();

  useEffect(() => {
    if (id) {
      fetchJobDetails();
    }
  }, [accessToken, id]);

  const fetchJobDetails = async () => {
    if (!accessToken || !id) return;
    try {
      // 1. Fetch Job
      const { data: jobData } = await api.get(`/job-postings/${id}`);
      setJob(jobData);

      // 2. Fetch Suggested Candidates
      setLoadingCandidates(true);
      const { data: candidatesData } = await api.get(`/job-postings/${id}/suggested-candidates`);
      setSuggestedCandidates(candidatesData || []);
    } catch (error) {
      console.error('Error fetching job details:', error);
      toast.error('Không thể tải thông tin công việc');
    } finally {
      setLoading(false);
      setLoadingCandidates(false);
    }
  };

  const handleInviteClick = (e: React.MouseEvent, candidate: any) => {
    e.preventDefault();
    e.stopPropagation();
    setInvitingCandidate(candidate);
  };

  const confirmInvite = async () => {
    if (!invitingCandidate) return;
    setIsSubmittingInvite(true);
    try {
      await api.post('/messages/job-invitation', { candidateId: invitingCandidate.candidateId, jobPostingId: id });
      toast.success('Đã gửi lời mời ứng tuyển thành công!');
      setInvitingCandidate(null);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Có lỗi xảy ra khi gửi lời mời.';
      toast.error(msg);
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh] text-slate-500 flex-col gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        Đang tải thông tin...
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex justify-center flex-col items-center h-[60vh] text-slate-500 gap-4">
        <p>Không tìm thấy công việc.</p>
        <Link href="/recruiter/jobs" className="text-indigo-600 hover:underline">Quay lại danh sách</Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 max-w-6xl mx-auto"
    >
      <Link href="/recruiter/jobs" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Job Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-10 blur-xl opacity-50" />
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold text-slate-800 tracking-tight">{job.title}</h1>
                <p className="text-slate-500 mt-2">{job.company?.companyName}</p>
              </div>
              <span className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${
                job.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                job.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                'bg-slate-50 text-slate-700 border-slate-200'
              }`}>
                {job.status}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 py-6 border-t border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Địa điểm</p>
                  <p className="text-sm font-semibold text-slate-700">{job.locationCity || 'Tất cả'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Loại hình</p>
                  <p className="text-sm font-semibold text-slate-700">{job.jobType}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Mức lương</p>
                  <p className="text-sm font-semibold text-slate-700">{formatSalary(job.salaryMin, job.salaryMax, job.currency)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Số lượng</p>
                  <p className="text-sm font-semibold text-slate-700">{job.numberOfVacancies || '1'} người</p>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-3">Mô tả công việc</h3>
                <div className="text-slate-600 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: job.description || 'Chưa cập nhật' }} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-3">Yêu cầu công việc</h3>
                <div className="text-slate-600 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: job.requirements || 'Chưa cập nhật' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: AI Suggestions */}
        <div className="space-y-6">
          {/* Stats Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Thống kê tin đăng</h3>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl mb-4">
              <div className="flex items-center gap-3">
                <Eye className="w-6 h-6 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-400 font-medium">Lượt xem</p>
                  <p className="text-xl font-bold text-slate-700">{job.viewCount}</p>
                </div>
              </div>
              <div className="h-10 w-px bg-slate-200" />
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-indigo-400" />
                <div>
                  <p className="text-xs text-slate-400 font-medium">Ứng viên</p>
                  <p className="text-xl font-bold text-indigo-600">{job.applications?.length || 0}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Calendar className="w-4 h-4" /> Đăng ngày {new Date(job.createdAt).toLocaleDateString('vi-VN')}
            </div>
          </div>

          {/* AI Suggested Candidates */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-6 rounded-2xl shadow-md text-white relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            
            <div className="relative z-10 flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-300" />
                AI Gợi Ý Ứng Viên
              </h3>
              <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
                Độ phù hợp cao
              </span>
            </div>

            {loadingCandidates ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-white/50" />
              </div>
            ) : suggestedCandidates.length === 0 ? (
              <div className="bg-white/10 border border-white/20 rounded-xl p-6 text-center backdrop-blur-md">
                <p className="text-white/80 text-sm">Chưa có gợi ý phù hợp cho Job này.</p>
              </div>
            ) : (
              <div className="space-y-4 relative z-10">
                {suggestedCandidates.map((candidate) => (
                  <Link 
                    key={candidate.candidateId} 
                    href={`/recruiter/jobs/${id}/matches`}
                    className="bg-white/10 border border-white/20 hover:bg-white/20 transition-colors p-4 rounded-xl cursor-pointer backdrop-blur-md flex items-center justify-between gap-4 block"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-bold text-indigo-600 shrink-0 overflow-hidden">
                        {candidate.user?.avatar ? (
                          <Image src={candidate.user.avatar} alt="Avatar" width={40} height={40} className="object-cover" />
                        ) : (
                          candidate.fullName.charAt(0)
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{candidate.fullName}</p>
                        <p className="text-xs text-indigo-200 truncate">{candidate.major}</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={(e) => handleInviteClick(e, candidate)}
                      className="text-xs bg-white text-indigo-600 px-3 py-1.5 rounded-lg font-semibold hover:bg-indigo-50 transition-colors shrink-0"
                    >
                      Mời
                    </button>
                  </Link>
                ))}
              </div>
            )}
            
            <Link 
              href={`/recruiter/jobs/${id}/matches`}
              className="w-full mt-6 bg-white/10 hover:bg-white/20 border border-white/30 transition-colors py-2.5 rounded-xl text-sm font-semibold relative z-10 flex items-center justify-center gap-2"
            >
              Xem tất cả <ArrowLeft className="w-4 h-4 rotate-180" />
            </Link>
          </div>
        </div>
      </div>
      {/* Modal xác nhận gửi lời mời */}
      {invitingCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-800 mb-2">Xác nhận gửi lời mời</h3>
              <p className="text-slate-600">
                Bạn có chắc chắn muốn gửi thông báo mời ứng viên <strong className="text-indigo-600">{invitingCandidate.fullName}</strong> ứng tuyển vào vị trí này?
              </p>
              <div className="flex justify-end gap-3 mt-8">
                <button
                  onClick={() => setInvitingCandidate(null)}
                  disabled={isSubmittingInvite}
                  className="px-4 py-2 rounded-xl text-slate-600 font-medium hover:bg-slate-100 transition-colors disabled:opacity-50"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={confirmInvite}
                  disabled={isSubmittingInvite}
                  className="px-6 py-2 rounded-xl text-white font-semibold bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmittingInvite ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Xác nhận gửi
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

    </motion.div>
  );
}
