'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, MapPin, DollarSign, Calendar, Users, Eye, ArrowLeft, Loader2, Star, Sparkles, Edit, AlertTriangle, Brain, Bot } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/auth';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { formatSalary } from '@/lib/utils';



const formatText = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-bold text-amber-900">{part.slice(2, -2)}</strong>;
        }
        
        const subParts = part.split(/(\(\d+\))/g);
        return (
          <span key={i}>
            {subParts.map((sub, j) => {
              if (/^\(\d+\)$/.test(sub)) {
                return (
                  <span key={j}>
                    <br />
                    <span className="inline-block w-3" />
                    <span className="font-semibold text-amber-700">{sub}</span>
                  </span>
                );
              }
              return <span key={j}>{sub}</span>;
            })}
          </span>
        );
      })}
    </>
  );
};

const parseToHtml = (text: string) => {
  if (!text) return 'Chưa cập nhật';
  
  // Loại bỏ các tiêu đề bị lặp (do AI sinh ra) ở text đầu vào
  let cleanTxt = text.trim().replace(/^(?:\*\*.*?\*\*|#+)?\s*(?:mô tả công việc|yêu cầu công việc|yêu cầu ứng viên|thông tin chung|quyền lợi)\s*(?::|-)?\s*(?:\*\*.*?\*\*|#+)?\s*\n*/i, '');

  // Nếu đã có thẻ HTML cơ bản (từ React Quill hoặc AI nhả chuẩn HTML)
  if (cleanTxt.includes('<p>') || cleanTxt.includes('<ul>') || cleanTxt.includes('<li>')) {
    return cleanTxt;
  }
  
  let html = cleanTxt.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  const lines = html.split('\n');
  let result = '';
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('* ')) {
      if (!inList) {
        result += '<ul class="list-disc pl-5 my-2 space-y-1">\n';
        inList = true;
      }
      result += `<li>${line.substring(2)}</li>\n`;
    } else {
      if (inList) {
        result += '</ul>\n';
        inList = false;
      }
      if (line !== '') {
        result += `<p class="my-2">${line}</p>\n`;
      }
    }
  }

  if (inList) {
    result += '</ul>\n';
  }
  
  return result;
};

export default function JobDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  const [job, setJob] = useState<any>(null);
  const [suggestedCandidates, setSuggestedCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [invitingCandidate, setInvitingCandidate] = useState<any>(null);
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);
  const [isAiFeedbackExpanded, setIsAiFeedbackExpanded] = useState(false);
  const [planType, setPlanType] = useState<string | null>(null);
  const { accessToken } = useAuthStore();

  // Chỉ hiển thị AI cố vấn cho gói LITE hoặc GROWTH
  const hasAiAdvisorAccess = planType === 'LITE' || planType === 'GROWTH';

  useEffect(() => {
    if (id) {
      fetchJobDetails();
    }
    api.get('/subscriptions/current')
      .then(res => setPlanType(res.data?.planType ?? null))
      .catch(() => setPlanType(null));
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

  const handleAutoFix = async () => {
    const aiFeedback = (job?.structuredRequirements as any)?.aiFeedback;
    if (!aiFeedback) return;
    
    // Combine feedback to instruction string
    const insightInstruction = Array.isArray(aiFeedback) 
      ? aiFeedback.join('\n') 
      : String(aiFeedback);

    const loadingToast = toast.loading('AI đang tự động tối ưu JD...');
    try {
      await api.post('/ai/fix-job', { jobId: id, insightInstruction });
      toast.success('Đã cập nhật JD thành công!', { id: loadingToast });
      fetchJobDetails(); // reload the page data
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Có lỗi xảy ra khi gọi AI!';
      toast.error(msg, { id: loadingToast });
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
      <div className="flex items-center justify-between">
        <Link href="/recruiter/jobs" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
        </Link>
        <Link
          href={`/recruiter/post-job?jobId=${id}`}
          title="Chỉnh sửa tin (sẽ chờ duyệt lại sau khi sửa)"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-indigo-200 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 font-medium text-sm transition-all active:scale-95"
        >
          <Edit className="w-4 h-4" /> Chỉnh sửa JD
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Job Info */}
        <div className="lg:col-span-2 space-y-6 min-w-0 break-words">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-10 blur-xl opacity-50" />
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold text-slate-800 tracking-tight">{job.title}</h1>
                <p className="text-slate-500 mt-2">{job.company?.companyName}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <span className={`px-4 py-1.5 rounded-full text-sm font-semibold border flex items-center gap-1.5 ${
                  job.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  job.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-slate-50 text-slate-700 border-slate-200'
                }`}>
                  {job.status}
                </span>

                {/* Badge: AI Generated */}
                {(job.structuredRequirements as any)?.isAiGenerated && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm">
                    <Bot className="w-4 h-4" />
                    Tạo bởi AI
                  </span>
                )}

                {job.autoInviteMatches && (
                  <span className="px-3 py-1.5 rounded-full text-sm font-semibold border bg-indigo-50 text-indigo-700 border-indigo-200 flex items-center gap-1.5 shadow-sm">
                    <Brain className="w-4 h-4" />
                    Auto Invite
                  </span>
                )}
              </div>
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
                <div className="text-slate-600 prose prose-sm max-w-none break-words overflow-hidden" dangerouslySetInnerHTML={{ __html: parseToHtml(job.description) }} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-3">Yêu cầu công việc</h3>
                <div className="text-slate-600 prose prose-sm max-w-none break-words overflow-hidden" dangerouslySetInnerHTML={{ __html: parseToHtml(job.requirements) }} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-3">Quyền lợi</h3>
                <div className="text-slate-600 prose prose-sm max-w-none break-words overflow-hidden" dangerouslySetInnerHTML={{ __html: parseToHtml(job.benefits) }} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: AI Suggestions */}
        <div className="space-y-6 lg:col-span-1 min-w-0 break-words">
          {/* AI Moderation Feedback - chỉ hiển thị với gói LITE / GROWTH và JD không phải AI-generated */}
          {hasAiAdvisorAccess && !(job.structuredRequirements as any)?.isAiGenerated && (job.structuredRequirements as any)?.aiFeedback && (
            <div className="bg-amber-50 p-5 rounded-2xl shadow-sm border border-amber-200 transition-all duration-300">
              <div
                className="flex items-center justify-between cursor-pointer group"
                onClick={() => setIsAiFeedbackExpanded(!isAiFeedbackExpanded)}
              >
                <div className="flex items-center gap-2 text-amber-800">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <h3 className="text-lg font-bold tracking-tight">Nhận xét của AI Cố Vấn</h3>
                </div>
                <div className="w-8 h-8 rounded-full bg-amber-100/50 flex items-center justify-center text-amber-600 group-hover:bg-amber-200/50 transition-colors">
                  <svg
                    className={`w-4 h-4 transition-transform duration-300 ${isAiFeedbackExpanded ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              
              <div
                className={`transition-all duration-500 overflow-hidden ${
                  isAiFeedbackExpanded ? "max-h-[3000px] opacity-100 mt-4" : "max-h-0 opacity-0"
                }`}
              >
                <div className="text-sm font-medium text-amber-900/80 leading-relaxed pb-1">
                  {Array.isArray((job.structuredRequirements as any).aiFeedback) ? (
                    <ul className="list-disc space-y-1.5 pl-4 marker:text-amber-500">
                      {((job.structuredRequirements as any).aiFeedback).map((str: string, i: number) => (
                        <li key={i}>{formatText(str)}</li>
                      ))}
                    </ul>
                  ) : (
                    <ul className="list-disc space-y-1.5 pl-4 marker:text-amber-500">
                      {((job.structuredRequirements as any).aiFeedback as string)
                        .replace(/v\.v\./g, 'v_v_')
                        .replace(/([0-9])\.([0-9])/g, '$1_$2')
                        .split('.')
                        .filter((s: string) => s.trim().length > 5)
                        .map((s: string, i: number) => (
                          <li key={i}>{formatText(s.replace(/v_v_/g, 'v.v.').replace(/([0-9])\_([0-9])/g, '$1.$2').trim() + '.')}</li>
                        ))
                      }
                    </ul>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-amber-200/50 flex justify-end">
                  {(job.structuredRequirements as any)?.autoFixedByAI ? (
                    <button
                      disabled
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 text-[11px] font-bold rounded-lg shadow-sm opacity-80 cursor-not-allowed"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Đã được chỉnh sửa
                    </button>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAutoFix(); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-400 to-orange-500 hover:opacity-90 text-white text-[11px] font-bold rounded-lg transition-all shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Sửa tự động (GROWTH)
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

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
