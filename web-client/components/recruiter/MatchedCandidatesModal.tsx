'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, CheckCircle, User, Star, Briefcase, Mail, MessageCircle } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface MatchedCandidatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
}

export const MatchedCandidatesModal = ({ isOpen, onClose, jobId }: MatchedCandidatesModalProps) => {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && jobId) {
      fetchMatches();
    }
  }, [isOpen, jobId]);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/recruiters/matched/${jobId}`);
      setCandidates(data);
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast.error('Không thể tải danh sách ứng viên phù hợp');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async (candidateId: string, cvId: string) => {
    setUnlockingId(candidateId);
    try {
      await api.post('/recruiters/unlock', {
        candidateId,
        jobPostingId: jobId,
        cvId,
      });
      toast.success('Mở khóa thành công (-50 xu)');
      // Làm mới danh sách để tải dữ liệu đã giải mã
      await fetchMatches();
    } catch (error: any) {
      console.error('Lỗi khi mở khóa:', error);
      const msg = error.response?.data?.message || 'Mở khóa thất bại do số dư không đủ hoặc lỗi hệ thống.';
      toast.error(msg);
    } finally {
      setUnlockingId(null);
    }
  };

    const [messagingId, setMessagingId] = useState<string | null>(null);

    const handleSendMessage = async (candidateId: string) => {
      setMessagingId(candidateId);
      try {
        await api.post('/messages/broadcast', {
          candidateIds: [candidateId],
          content: 'Chào bạn, chúng tôi nhận thấy hồ sơ phần mềm của bạn rất ấn tượng và phù hợp với vị trí chúng tôi đang tuyển dụng. Mong bạn hãy kiểm tra email để xem thông tin chi tiết hoặc phản hồi lại tin nhắn này nhé!'
        });
        toast.success('Đã gửi lời mời đến ứng viên!');
      } catch (error) {
        console.error('Lỗi gửi tin nhắn:', error);
        toast.error('Gửi tin nhắn thất bại.');
      } finally {
        setMessagingId(null);
      }
    };

    if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl max-h-[85vh] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Star className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Ứng Viên Phù Hợp</h2>
                <p className="text-sm text-slate-500">Danh sách do AI đề xuất dựa trên yêu cầu CV</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1 bg-slate-50 border-t border-b border-slate-100 relative">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              </div>
            ) : candidates.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Briefcase className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <p>Chưa tìm thấy ứng viên nào phù hợp.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {candidates.map((candidate) => (
                  <div key={candidate.candidateId} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-6">
                    {/* Candidate Info Left */}
                    <div className="flex items-center gap-4 flex-1 overflow-hidden">
                      <div className="w-14 h-14 bg-slate-100 rounded-full flex justify-center items-center overflow-hidden flex-shrink-0">
                        {candidate.avatar ? (
                          <img src={candidate.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-6 h-6 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 truncate">
                          {candidate.fullName}
                          {candidate.isUnlocked && <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                        </h3>
                        <div className="flex flex-col text-sm text-slate-500 mt-1">
                          <span className="truncate">Email: {candidate.email}</span>
                          <span>Trùng khớp: <span className="font-semibold text-indigo-600">{candidate.score}%</span></span>
                        </div>
                      </div>
                    </div>

                    {/* Middle -> Skills */}
                    <div className="flex-1 w-full md:w-auto">
                      <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Kỹ năng tìm thấy</p>
                      <div className="flex flex-wrap gap-2">
                        {candidate.matchedSkills?.slice(0, 5).map((skill: string, idx: number) => (
                          <span key={idx} className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-medium border border-indigo-100">
                            {skill}
                          </span>
                        ))}
                        {candidate.matchedSkills?.length > 5 && (
                          <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-medium border border-slate-200">
                            +{candidate.matchedSkills.length - 5}
                          </span>
                        )}
                        {(!candidate.matchedSkills || candidate.matchedSkills.length === 0) && <span className="text-xs text-slate-400">Không có kỹ năng cụ thể</span>}
                      </div>
                    </div>

                    {/* Right -> Unlock / View Actions */}
                    <div className="flex gap-2 w-full md:w-auto justify-end flex-shrink-0">
                      {candidate.isUnlocked ? (
                        <>
                          <button
                            onClick={() => handleSendMessage(candidate.candidateId)}
                            disabled={messagingId === candidate.candidateId}
                            className="px-4 py-2.5 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-lg text-sm font-medium transition-colors w-full md:w-auto text-center flex items-center justify-center gap-2"
                          >
                            {messagingId === candidate.candidateId ? (
                               <span className="w-4 h-4 border-2 border-indigo-400 border-t-indigo-700 rounded-full animate-spin"></span>
                            ) : (
                               <><MessageCircle className="w-4 h-4" /> Gửi Lời Mời</>
                            )}
                          </button>
                          <a
                            href={candidate.cvUrl || '#'}
                            onClick={(e) => {
                              if (!candidate.cvUrl) {
                                e.preventDefault();
                                toast.error('Không tìm thấy tệp CV của ứng viên này.');
                              }
                            }}
                            target="_blank"
                            rel="noreferrer"
                            className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-lg text-sm font-medium transition-colors w-full md:w-auto text-center flex items-center justify-center gap-2"
                          >
                            Xem CV
                          </a>
                        </>
                      ) : (
                        <button
                          onClick={() => handleUnlock(candidate.candidateId, candidate.cvId)}
                          disabled={unlockingId === candidate.candidateId}
                          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg text-sm font-medium transition-all shadow-sm w-full md:w-auto"
                        >
                          {unlockingId === candidate.candidateId ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                          ) : (
                            <>
                              <Lock className="w-4 h-4" />
                              Mở khóa (50 Xu)
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
