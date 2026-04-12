'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Users, 
  ChevronLeft, 
  Star, 
  MapPin, 
  Award, 
  Briefcase, 
  Unlock, 
  Lock,
  Mail,
  Phone,
  ExternalLink,
  Loader2,
  Sparkles
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface MatchedCandidate {
  candidateId: string;
  cvId: string;
  fullName: string;
  score: number;
  skillsMatch: string[];
  missingSkills: string[];
  experienceMatch: boolean;
  avatar?: string;
  email: string;
  phone: string;
  isUnlocked: boolean;
}

export default function JobMatchesPage() {
  const { id: jobId } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<MatchedCandidate[]>([]);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/recruiters/matched/${jobId}`);
      setCandidates(response.data);
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast.error('Không thể tải danh sách ứng viên phù hợp.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [jobId]);

  const handleUnlock = async (candidateId: string, cvId: string) => {
    if (!confirm('Bạn có chắc chắn muốn dùng 1 Credit để mở khóa thông tin liên hệ của ứng viên này?')) return;
    
    setUnlockingId(candidateId);
    try {
      await api.post('/recruiters/unlock', { candidateId, jobPostingId: jobId, cvId });
      toast.success('Mở khóa thành công!');
      // Refresh data
      fetchMatches();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi mở khóa.');
    } finally {
      setUnlockingId(null);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="text-slate-500 animate-pulse">Matching Engine đang tính toán...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Quay lại danh sách tin
        </button>
        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold">
          <Sparkles className="w-5 h-5" />
          AI Matching Engine
        </div>
      </div>

      <div className="border-b border-slate-100 pb-5">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Ứng viên phù hợp nhất</h1>
        <p className="text-slate-500">Dựa trên kỹ năng, kinh nghiệm và yêu cầu công việc của bạn.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {candidates.map((candidate, index) => (
          <motion.div
            key={candidate.candidateId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all group"
          >
            <div className="p-6 flex flex-col md:flex-row gap-6">
              {/* Left: Avatar & Score */}
              <div className="flex flex-col items-center space-y-3">
                <div className="relative">
                  <div className={`w-24 h-24 rounded-2xl overflow-hidden border-4 ${candidate.isUnlocked ? 'border-green-100' : 'border-slate-100'}`}>
                    <img 
                      src={candidate.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.fullName)}&background=random`} 
                      alt={candidate.fullName}
                      className={`w-full h-full object-cover ${!candidate.isUnlocked && 'blur-sm grayscale'}`}
                    />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-xs shadow-lg border-2 border-white">
                    {Math.round(candidate.score)}%
                  </div>
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${candidate.isUnlocked ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  {candidate.isUnlocked ? 'Đã mở khóa' : 'Đang khóa'}
                </span>
              </div>

              {/* Middle: Info */}
              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      {candidate.fullName}
                      {candidate.isUnlocked && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
                    </h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-slate-500">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Hà Nội, VN</span>
                      <span className="flex items-center gap-1 font-medium text-indigo-600"><Award className="w-3.5 h-3.5" /> {candidate.experienceMatch ? 'Đạt kinh nghiệm yêu cầu' : 'Chưa đạt kinh nghiệm'}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kỹ năng phù hợp</p>
                    <div className="flex flex-wrap gap-2">
                      {candidate.skillsMatch.map(skill => (
                        <span key={skill} className="px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded-md border border-green-100">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  {candidate.missingSkills.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kỹ năng còn thiếu</p>
                      <div className="flex flex-wrap gap-2">
                        {candidate.missingSkills.map(skill => (
                          <span key={skill} className="px-2 py-0.5 bg-slate-50 text-slate-400 text-xs font-medium rounded-md border border-slate-100">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex flex-col gap-3 justify-center md:border-l md:border-slate-100 md:pl-6 min-w-[200px]">
                {candidate.isUnlocked ? (
                  <>
                    <div className="space-y-2 mb-2">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Mail className="w-4 h-4 text-indigo-500" />
                        <span className="font-medium">{candidate.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Phone className="w-4 h-4 text-indigo-500" />
                        <span className="font-medium">{candidate.phone}</span>
                      </div>
                    </div>
                    <button className="w-full py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-all flex items-center justify-center gap-2">
                      <ExternalLink className="w-4 h-4" /> Xem chi tiết Profile
                    </button>
                    <button className="w-full py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all">
                      Liên hệ ngay
                    </button>
                  </>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                      <Lock className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 px-4">Dùng 1 Credit để xem thông tin liên hệ và Profile chi tiết.</p>
                    </div>
                    <button 
                      onClick={() => handleUnlock(candidate.candidateId, candidate.cvId)}
                      disabled={unlockingId === candidate.candidateId}
                      className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                      {unlockingId === candidate.candidateId ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Unlock className="w-4 h-4" />
                      )}
                      Mở khóa (1 Credit)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}

        {candidates.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Chưa tìm thấy ứng viên phù hợp</h3>
            <p className="text-slate-500 mt-1 max-w-sm mx-auto">Matching Engine đang tiếp tục quét kho CV. Bạn sẽ nhận được thông báo khi có ứng viên mới phù hợp.</p>
          </div>
        )}
      </div>
    </div>
  );
}
