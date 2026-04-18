'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BrainCircuit, 
  Target, 
  CheckCircle2, 
  XCircle, 
  Briefcase, 
  MapPin, 
  DollarSign, 
  ChevronRight,
  TrendingUp,
  Award,
  Search,
  Loader2
} from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'next/navigation';
import MatchingAnalysisModal from '@/components/recruiter/MatchingAnalysisModal';
import { formatSalary } from '@/lib/utils';

export default function CandidateMatchingPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchRecommendations();
  }, [isAuthenticated]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      // Endpoint này trả về danh sách job kèm analysis data
      const { data } = await api.get('/job-postings/recommendations');
      setRecommendations(data || []);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Đang phân tích cơ hội việc làm...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-10 text-center md:text-left">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold mb-4"
          >
            <TrendingUp className="w-4 h-4" /> Phân tích cơ hội AI
          </motion.div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">
            Gợi ý Việc làm <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Phù hợp Nhất</span>
          </h1>
          <p className="text-slate-600 text-lg max-w-2xl">
            Dựa trên hồ sơ của bạn, Workly AI đã phân tích và liệt kê các tin tuyển dụng có độ tương đồng cao nhất về kỹ năng và kinh nghiệm.
          </p>
        </div>

        {/* CV Score Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hồ sơ của bạn</p>
              <p className="text-lg font-bold text-slate-900">Đã tối ưu (95%)</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cơ hội hiện có</p>
              <p className="text-lg font-bold text-slate-900">{recommendations.length} Job phù hợp</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
              <Award className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Thứ hạng ưu tiên</p>
              <p className="text-lg font-bold text-slate-900">Top 15% ứng viên</p>
            </div>
          </div>
        </div>

        {/* Recommendations List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6">
            <BrainCircuit className="w-6 h-6 text-indigo-600" /> Danh sách Phân tích Cơ hội
          </h2>

          <AnimatePresence>
            {recommendations.length > 0 ? (
              recommendations.map((job, idx) => (
                <motion.div
                  key={job.jobPostingId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white border border-slate-100 rounded-3xl p-6 hover:shadow-xl hover:border-indigo-100 transition-all group flex flex-col md:flex-row items-center gap-6"
                >
                  {/* Score circle */}
                  <div className="relative w-20 h-20 flex-shrink-0">
                    <svg className="w-20 h-20 -rotate-90">
                      <circle
                        cx="40"
                        cy="40"
                        r="34"
                        fill="transparent"
                        stroke="#f1f5f9"
                        strokeWidth="8"
                      />
                      <motion.circle
                        initial={{ strokeDasharray: "0, 1000" }}
                        animate={{ strokeDasharray: `${(job.score / 100) * 213.6}, 1000` }}
                        cx="40"
                        cy="40"
                        r="34"
                        fill="transparent"
                        stroke={job.score >= 80 ? "#10b981" : job.score >= 50 ? "#6366f1" : "#94a3b8"}
                        strokeWidth="8"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-lg font-black text-slate-900">{job.score}%</span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-black text-xl text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {job.title}
                      </h3>
                      {job.score >= 80 && (
                        <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-1 rounded-lg font-black uppercase">Tuyệt vời</span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-slate-500 font-medium tracking-tight">
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4 text-slate-400" /> {job.company?.companyName}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-slate-400" /> {job.locationCity}
                      </div>
                      <div className="flex items-center gap-1.5 font-bold text-indigo-600">
                        <DollarSign className="w-4 h-4" /> {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <button
                      onClick={() => setSelectedAnalysis({
                        jobPostingId: job.jobPostingId,
                        candidateName: user?.name || 'Bạn',
                        score: job.score,
                        matchedSkills: job.matchedSkills || [],
                        missingSkills: job.missingSkills || [],
                        analysis: job.analysis 
                      })}
                      className="px-6 py-3 bg-white border border-slate-200 text-slate-800 font-bold rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                    >
                      <BrainCircuit className="w-4 h-4 text-indigo-600" /> Phân tích AI
                    </button>
                    <button
                      onClick={() => router.push(`/jobs/${job.slug || job.jobPostingId}`)}
                      className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      Xem chi tiết <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="bg-white rounded-3xl p-20 text-center border border-dashed border-slate-200">
                <Search className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-800">Chưa tìm thấy cơ hội phù hợp</h3>
                <p className="text-slate-500 max-w-sm mx-auto mt-2">Hãy thử cập nhật thêm kỹ năng vào CV của bạn để AI có thể đánh giá tốt hơn.</p>
                <button 
                  onClick={() => router.push('/candidate/profile')}
                  className="mt-6 px-8 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:opacity-90 transition-all"
                >
                  Cập nhật ngay
                </button>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Analysis Modal */}
      {selectedAnalysis && (
        <MatchingAnalysisModal
          isOpen={!!selectedAnalysis}
          onClose={() => setSelectedAnalysis(null)}
          candidateName={selectedAnalysis.candidateName}
          score={selectedAnalysis.score}
          matchedSkills={selectedAnalysis.matchedSkills}
          missingSkills={selectedAnalysis.missingSkills}
          analysis={selectedAnalysis.analysis}
        />
      )}
    </div>
  );
}
