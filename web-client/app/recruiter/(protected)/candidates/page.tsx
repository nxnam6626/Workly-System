'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, Filter, Bookmark, MapPin, GraduationCap, Briefcase, Mail, Send, X, CheckSquare, Loader2, Unlock } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/auth';
import api, { getFileUrl } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [major, setMajor] = useState('');
  const [skills, setSkills] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const { accessToken } = useAuthStore();
  const router = useRouter();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    // Add debounce for search typing
    const delayDebounceFn = setTimeout(() => {
      fetchCandidates();
      fetchSavedIds();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [accessToken, search, major, skills]);

  const fetchSavedIds = async () => {
    if (!accessToken) return;
    try {
      const { data } = await api.get('/candidates/saved');
      if (Array.isArray(data)) {
        setSavedIds(data.map((c: any) => c.candidateId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCandidates = async () => {
    if (!accessToken) return;
    try {
      const { data } = await api.get('/candidates', {
        params: { search, major, skills }
      });
      setCandidates(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.error('Error fetching candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSave = async (id: string, currentlySaved: boolean) => {
    try {
      const { data } = await api.post(`/candidates/${id}/save`);
      if (data.saved) {
        toast.success('Đã lưu ứng viên!');
        setSavedIds(prev => [...prev, id]);
      } else {
        toast.success('Đã bỏ lưu ứng viên!');
        setSavedIds(prev => prev.filter(x => x !== id));
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi lưu ứng viên');
    }
  };

  const toggleSelect = (candidate: any) => {
    if (!candidate.isUnlocked) {
      toast.error('Vui lòng mở khóa CV để gửi tin nhắn cho ứng viên này.');
      return;
    }
    const id = candidate.candidateId;
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim() || selectedIds.length === 0) return;
    setSending(true);
    try {
      await api.post('/messages/broadcast', {
        candidateIds: selectedIds,
        content: broadcastMessage
      });
      toast.success('Gửi tin nhắn thành công!');
      setIsBroadcastOpen(false);
      setBroadcastMessage('');
      setSelectedIds([]);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Lỗi khi gửi tin nhắn');
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 relative"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <Users className="h-8 w-8 text-indigo-600" />
            Tìm Kiếm Ứng Viên
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Khám phá nhân tài phù hợp với yêu cầu của doanh nghiệp bạn.</p>
        </div>
        {selectedIds.length > 0 && (
          <motion.button
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={() => setIsBroadcastOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl shadow-lg shadow-indigo-600/30 transition-all font-medium"
          >
            <Send className="w-5 h-5" />
            Gửi Tin cho {selectedIds.length} Ứng Viên
          </motion.button>
        )}
      </div>

      <div className="bg-slate-900 rounded-3xl p-8 relative overflow-hidden shadow-xl shadow-indigo-900/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-32 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

        <div className="relative z-10 max-w-2xl">
          <h2 className="text-2xl font-semibold text-white mb-6">Bạn đang tìm kiếm ai?</h2>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Nhập tên, từ khóa chung..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 h-14 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white/15 transition-all text-lg backdrop-blur-sm"
                />
              </div>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`h-14 px-6 rounded-2xl border transition-all flex items-center gap-2 font-medium 
                  ${showFilters ? 'bg-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/10 border-white/20 text-slate-200 hover:bg-white/20'}
                `}
              >
                <Filter className="w-5 h-5" /> Lọc chuyên sâu
              </button>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="relative">
                      <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Chuyên ngành (VD: Software Engineer)"
                        value={major}
                        onChange={(e) => setMajor(e.target.value)}
                        className="w-full pl-12 pr-4 h-12 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="relative">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Kỹ năng cụ thể (VD: React, Node.js)"
                        value={skills}
                        onChange={(e) => setSkills(e.target.value)}
                        className="w-full pl-12 pr-4 h-12 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 tracking-tight">
        {loading ? (
          <div className="col-span-full py-12 flex justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin"></div>
          </div>
        ) : candidates.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-3xl border border-dashed border-slate-300">
            Không tìm thấy ứng viên nào phù hợp.
          </div>
        ) : candidates.map(candidate => {
          const isSelected = selectedIds.includes(candidate.candidateId);
          const isSaved = savedIds.includes(candidate.candidateId);
          return (
            <div key={candidate.candidateId} className={`bg-white rounded-2xl border transition-all duration-300 group overflow-hidden relative cursor-pointer ${isSelected ? 'border-indigo-500 shadow-md ring-2 ring-indigo-500/20 ring-offset-2' : 'border-slate-100 hover:shadow-lg hover:border-indigo-100'}`}>
              <div className="absolute top-4 left-4 z-10" onClick={(e) => { e.stopPropagation(); toggleSelect(candidate); }}>
                <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white/80 backdrop-blur border-slate-300 text-transparent hover:border-indigo-400'}`}>
                  <CheckSquare className="w-4 h-4" />
                </div>
              </div>

              <div className="p-6 pt-10" onClick={() => toggleSelect(candidate)}>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center shadow-inner shadow-indigo-200/50">
                    {candidate.user?.avatar ? (
                      <img src={candidate.user.avatar} className="w-full h-full rounded-2xl object-cover" />
                    ) : (
                      <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                        {(candidate.fullName || 'U').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleSave(candidate.candidateId, isSaved); }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isSaved ? 'text-rose-500 bg-rose-50' : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'
                    }`}
                  >
                    <Bookmark className={`w-5 h-5 transition-transform group-hover:scale-110 ${isSaved ? 'fill-rose-500' : ''}`} />
                  </button>
                </div>

                <h3 className="text-xl font-bold text-slate-800 tracking-tight leading-tight line-clamp-1">
                  {candidate.fullName}
                  {!candidate.isUnlocked && <span className="ml-2 text-[10px] font-black uppercase text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full inline-block align-middle">Chưa mở</span>}
                </h3>
                <p className="text-indigo-600 font-medium text-sm mt-1 mb-2">{candidate.major || 'Software Engineer'}</p>
                {candidate.matchScore > 0 && (
                  <div className="inline-flex mt-1">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-md">
                      Phù hợp {candidate.matchScore}% với {candidate.bestMatchJob}
                    </span>
                  </div>
                )}

                <div className="mt-5 space-y-2.5">
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <GraduationCap className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{candidate.university || 'Đại học ẩn'}</span>
                    {candidate.gpa && <span className="ml-auto font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md text-xs">{candidate.gpa} GPA</span>}
                  </div>
                </div>

                {candidate.skills && candidate.skills.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2 h-7 overflow-hidden relative">
                    {candidate.skills.slice(0, 3).map((skill: any) => (
                      <span key={skill.skillId} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium">
                        {skill.skillName}
                      </span>
                    ))}
                    {candidate.skills.length > 3 && (
                      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
                    )}
                  </div>
                )}
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                {candidate.isUnlocked ? (
                  <>
                    {candidate.cvs && candidate.cvs[0] ? (
                      <a href={getFileUrl(candidate.cvs[0].fileUrl)} target="_blank" rel="noopener noreferrer" className="flex-1 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 font-medium text-sm transition-colors flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Briefcase className="w-4 h-4" /> Xem CV
                      </a>
                    ) : (
                      <button disabled className="flex-1 h-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 font-medium text-sm transition-colors flex items-center justify-center gap-2 cursor-not-allowed" onClick={(e) => e.stopPropagation()}>
                        <Briefcase className="w-4 h-4" /> Không CV
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedIds([candidate.candidateId]);
                        setIsBroadcastOpen(true);
                      }}
                      className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-colors shadow-sm shadow-indigo-200 mt-auto"
                    >
                      <Mail className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toast.error('Ứng viên chưa được mở khóa. Hãy dùng tính năng AI Matching trên tin tuyển dụng để mở khóa.');
                    }}
                    className="flex-1 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-md shadow-indigo-200"
                  >
                    <Unlock className="w-4 h-4" /> Đã ẩn thông tin
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <AnimatePresence>
        {isBroadcastOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
            >
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Send className="w-5 h-5 text-indigo-600" />
                  Bạn đang nhắn tới {selectedIds.length} người
                </h2>
                <button
                  onClick={() => setIsBroadcastOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Nội dung tin nhắn</label>
                <textarea
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Xin chào, chúng tôi có vị trí này đang tuyển dụng và nghĩ bạn rất phù hợp..."
                  className="w-full h-40 p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none transition-all"
                />
              </div>

              <div className="px-6 py-5 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3">
                <button
                  onClick={() => setIsBroadcastOpen(false)}
                  className="px-6 h-12 rounded-xl border border-slate-200 font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleBroadcast}
                  disabled={sending || !broadcastMessage.trim()}
                  className="px-6 h-12 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md shadow-indigo-500/30 flex items-center gap-2"
                >
                  {sending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Đang gửi...</>
                  ) : (
                    <><Send className="w-4 h-4" /> Gửi Tin Nhắn</>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
