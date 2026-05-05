'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Clock, MapPin, DollarSign, Users, Eye, Edit, Sparkles,
  RefreshCw, Lock, BarChart3, MessageCircle, User, Star, Briefcase,
  ExternalLink, Building2, CheckCircle, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useWalletStore } from '@/stores/wallet';
import { UnlockConfirmModal } from '@/components/recruiter/UnlockConfirmModal';
import MatchingAnalysisModal from '@/components/recruiter/MatchingAnalysisModal';
import { formatSalary } from '@/lib/utils';
import { motion } from 'framer-motion';

const JOB_TYPE: Record<string, string> = { FULLTIME: 'Toàn thời gian', PARTTIME: 'Bán thời gian', REMOTE: 'Từ xa' };
const JOB_LEVEL: Record<string, string> = { INTERN: 'Thực tập sinh', STAFF: 'Nhân viên', MANAGER: 'Quản lý', DIRECTOR: 'Giám đốc' };
const JOB_STATUS: Record<string, { label: string; cls: string }> = {
  APPROVED: { label: 'Đang hiển thị', cls: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  PENDING: { label: 'Chờ duyệt', cls: 'bg-amber-50 text-amber-600 border-amber-100' },
  REJECTED: { label: 'Bị từ chối', cls: 'bg-rose-50 text-rose-600 border-rose-100' },
  PAUSED: { label: 'Tạm dừng', cls: 'bg-slate-100 text-slate-500 border-slate-200' },
  CLOSED: { label: 'Đã đóng', cls: 'bg-slate-200 text-slate-600 border-slate-300' },
};

export default function RecruiterJobDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [job, setJob] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);
  const [messagingId, setMessagingId] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [analysisTarget, setAnalysisTarget] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const wallet = useWalletStore((s) => s.wallet);
  const fetchWallet = useWalletStore((s) => s.fetchWallet);

  useEffect(() => {
    if (!id) return;
    fetchJobDetails();
    fetchCandidates();
    api.get('/subscriptions/current').then(({ data }) => setSubscription(data)).catch(() => {});
    fetchWallet();
  }, [id]);

  const fetchJobDetails = async () => {
    try {
      const { data } = await api.get(`/job-postings/${id}`);
      setJob(data);
    } catch {
      toast.error('Không tìm thấy tin tuyển dụng');
      router.push('/recruiter/jobs');
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidates = async () => {
    setLoadingCandidates(true);
    try {
      const { data } = await api.get(`/recruiters/matched/${id}`);
      setCandidates(data);
    } catch { } finally { setLoadingCandidates(false); }
  };

  const confirmUnlock = async () => {
    if (!selectedCandidate) return;
    setUnlockingId(selectedCandidate.candidateId);
    try {
      await api.post('/recruiters/unlock', { candidateId: selectedCandidate.candidateId, jobPostingId: id, cvId: selectedCandidate.cvId });
      toast.success('Mở khóa thành công');
      setShowUnlockModal(false);
      fetchWallet();
      fetchCandidates();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Mở khóa thất bại');
    } finally { setUnlockingId(null); }
  };

  const handleMessage = async (candidateId: string) => {
    setMessagingId(candidateId);
    try {
      await api.post('/messages/job-invitation', { candidateId, jobPostingId: id });
      toast.success('Đã gửi lời mời!');
    } catch { toast.error('Gửi thất bại.'); } finally { setMessagingId(null); }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-slate-400 text-sm font-medium">Đang tải...</p>
      </div>
    </div>
  );

  if (!job) return null;

  const status = JOB_STATUS[job.status] ?? { label: job.status, cls: 'bg-slate-100 text-slate-500 border-slate-200' };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">

      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 text-sm text-slate-500">
          <button onClick={() => router.back()} className="hover:text-indigo-600 transition-colors flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <ChevronRight className="w-3.5 h-3.5 opacity-40" />
          <Link href="/recruiter/jobs" className="hover:text-indigo-600 transition-colors font-medium">Quản lý tin tuyển dụng</Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-40" />
          <span className="text-slate-800 font-semibold truncate max-w-xs">{job.title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* ── LEFT: Job Detail ─────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Hero Card */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
              {/* Company info */}
              <div className="flex items-start gap-5 mb-6">
                <div className="w-16 h-16 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                  {job.company?.logo
                    ? <img src={job.company.logo} alt={job.company.companyName} className="w-full h-full object-contain p-1" />
                    : <Building2 className="w-7 h-7 text-slate-300" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-black text-slate-900 leading-tight mb-1">{job.title}</h1>
                  <p className="text-slate-500 font-semibold text-sm mb-3">{job.company?.companyName}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border ${status.cls}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {status.label}
                    </span>
                    {job.jobTier === 'URGENT' && (
                      <span className="px-2 py-1 bg-rose-50 text-rose-600 text-[11px] font-black rounded-full border border-rose-100 uppercase">Tuyển gấp</span>
                    )}
                    {job.jobTier === 'PROFESSIONAL' && (
                      <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[11px] font-black rounded-full border border-indigo-100 uppercase">Professional</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Meta chips */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                  { icon: DollarSign, label: 'Lương', value: formatSalary(job.salaryMin, job.salaryMax, job.currency), color: 'text-blue-600 bg-blue-50' },
                  { icon: MapPin, label: 'Địa điểm', value: job.locationCity || 'Toàn quốc', color: 'text-emerald-600 bg-emerald-50' },
                  { icon: Briefcase, label: 'Hình thức', value: JOB_TYPE[job.jobType] || 'Toàn thời gian', color: 'text-amber-600 bg-amber-50' },
                  { icon: Star, label: 'Cấp bậc', value: JOB_LEVEL[job.jobLevel] || 'Nhân viên', color: 'text-indigo-600 bg-indigo-50' },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{label}</p>
                      <p className="text-sm font-bold text-slate-800 truncate">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3">
                <Link href={`/recruiter/post-job?jobId=${id}`}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
                  <Edit className="w-4 h-4" /> Chỉnh sửa
                </Link>
                {job.slug && (
                  <Link href={`/jobs/${job.slug}`} target="_blank"
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all">
                    <ExternalLink className="w-4 h-4" /> Xem trang ứng viên
                  </Link>
                )}
              </div>
            </div>

            {/* Job Content */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-8 space-y-10">
                {job.description && (
                  <section>
                    <h2 className="text-base font-black text-slate-900 uppercase tracking-widest mb-5 flex items-center gap-2">
                      <span className="w-1 h-5 bg-indigo-500 rounded-full" />
                      Mô tả công việc
                    </h2>
                    <div className="prose prose-slate max-w-none text-slate-600 text-[15px] leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: job.description }} />
                  </section>
                )}

                {job.requirements && (
                  <section>
                    <h2 className="text-base font-black text-slate-900 uppercase tracking-widest mb-5 flex items-center gap-2">
                      <span className="w-1 h-5 bg-amber-500 rounded-full" />
                      Yêu cầu ứng viên
                    </h2>
                    <div className="prose prose-slate max-w-none text-slate-600 text-[15px] leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: job.requirements }} />
                  </section>
                )}

                {job.benefits && (
                  <section>
                    <h2 className="text-base font-black text-slate-900 uppercase tracking-widest mb-5 flex items-center gap-2">
                      <span className="w-1 h-5 bg-emerald-500 rounded-full" />
                      Quyền lợi
                    </h2>
                    <div className="prose prose-slate max-w-none text-slate-600 text-[15px] leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: job.benefits }} />
                  </section>
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT: Sidebar ───────────────────────────── */}
          <div className="space-y-6">

            {/* Stats */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Chỉ số</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Eye, label: 'Lượt xem', value: job.viewCount ?? 0, color: 'text-indigo-600 bg-indigo-50' },
                  { icon: Users, label: 'Matches', value: candidates.length, color: 'text-emerald-600 bg-emerald-50' },
                  { icon: Clock, label: 'Ngày đăng', value: new Date(job.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }), color: 'text-slate-500 bg-slate-50' },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="text-center p-3 bg-slate-50 rounded-2xl">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1.5 ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <p className="text-lg font-black text-slate-900">{value}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Candidates Panel */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 pt-6 pb-4 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <Sparkles className="w-4.5 h-4.5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-black text-slate-900 text-sm">Ứng viên phù hợp</p>
                    <p className="text-[11px] text-slate-400">AI đề xuất</p>
                  </div>
                </div>
                <button onClick={fetchCandidates} className="p-2 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-indigo-600 transition-colors">
                  <RefreshCw className={`w-4 h-4 ${loadingCandidates ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="p-4">
                {loadingCandidates ? (
                  <div className="py-10 flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-[3px] border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-400 text-xs font-medium">Đang phân tích...</p>
                  </div>
                ) : candidates.length === 0 ? (
                  <div className="py-10 text-center">
                    <Users className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm font-medium">Chưa có ứng viên phù hợp</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {candidates.slice(0, 8).map((c, idx) => {
                      const score = c.score ?? 0;
                      const scoreColor = score >= 70 ? 'bg-emerald-500' : score >= 50 ? 'bg-indigo-500' : score >= 30 ? 'bg-amber-500' : 'bg-slate-300';
                      const scoreText = score >= 70 ? 'text-emerald-600' : score >= 50 ? 'text-indigo-600' : score >= 30 ? 'text-amber-600' : 'text-slate-400';
                      return (
                        <motion.div
                          key={c.candidateId}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.04 }}
                          className={`flex items-center gap-3 p-3 rounded-2xl border transition-all group ${
                            c.isUnlocked
                              ? 'border-emerald-100 bg-emerald-50/30 hover:border-emerald-200'
                              : 'border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/20'
                          }`}
                        >
                          {/* Avatar */}
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 shrink-0 overflow-hidden ${
                            c.isUnlocked ? 'bg-slate-100' : 'bg-slate-100'
                          }`}>
                            {c.avatar
                              ? <img src={c.avatar} alt="" className="w-full h-full object-cover" />
                              : c.isUnlocked
                                ? <User className="w-5 h-5" />
                                : <Lock className="w-4 h-4 text-slate-400" />}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            {c.isUnlocked ? (
                              <p className="text-sm font-bold text-slate-800 truncate group-hover:text-indigo-700 transition-colors">
                                {c.fullName}
                                <CheckCircle className="inline w-3.5 h-3.5 text-emerald-500 ml-1" />
                              </p>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="h-3.5 w-24 bg-slate-200 rounded blur-[2px] select-none" />
                                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">Chưa mở khóa</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 mt-1">
                              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all ${scoreColor}`} style={{ width: `${score}%` }} />
                              </div>
                              <span className={`text-[10px] font-black shrink-0 ${scoreText}`}>{score}%</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-1.5 shrink-0">
                            <button onClick={() => setAnalysisTarget(c)}
                              className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm text-slate-400 hover:text-indigo-600 transition-all"
                              title="Xem phân tích AI">
                              <BarChart3 className="w-3.5 h-3.5" />
                            </button>
                            {c.isUnlocked ? (
                              <button onClick={() => handleMessage(c.candidateId)}
                                disabled={messagingId === c.candidateId}
                                className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all"
                                title="Nhắn tin mời">
                                {messagingId === c.candidateId
                                  ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  : <MessageCircle className="w-3.5 h-3.5" />}
                              </button>
                            ) : (
                              <button onClick={() => { setSelectedCandidate(c); setShowUnlockModal(true); }}
                                className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 hover:bg-indigo-100 transition-all"
                                title="Mở khóa hồ sơ">
                                <Lock className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                    {candidates.length > 8 && (
                      <p className="text-center text-[11px] text-slate-400 font-medium pt-1">
                        +{candidates.length - 8} ứng viên khác
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <UnlockConfirmModal
        isOpen={showUnlockModal}
        onClose={() => setShowUnlockModal(false)}
        onConfirm={confirmUnlock}
        isUnlocking={unlockingId === selectedCandidate?.candidateId}
        candidateName={selectedCandidate?.fullName || ''}
        wallet={wallet}
        subscription={subscription}
      />

      {analysisTarget && (
        <MatchingAnalysisModal
          isOpen={!!analysisTarget}
          onClose={() => setAnalysisTarget(null)}
          candidateName={analysisTarget.fullName}
          score={analysisTarget.matchScore ?? analysisTarget.score ?? 0}
          matchedSkills={analysisTarget.matchedSkills ?? []}
          missingSkills={analysisTarget.missingSkills ?? []}
          analysis={analysisTarget.analysis}
        />
      )}
    </div>
  );
}
