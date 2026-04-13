'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Search, BookmarkMinus, Phone, Mail, FileText, X, Loader2, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/auth';
import api, { getFileUrl } from '@/lib/api';

export default function SavedCandidatesPage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { accessToken } = useAuthStore();
  const [candidateToRemove, setCandidateToRemove] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    fetchSavedCandidates();
  }, [accessToken]);

  const fetchSavedCandidates = async () => {
    if (!accessToken) return;
    try {
      const { data } = await api.get('/candidates/saved');
      setCandidates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching saved candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmRemove = async () => {
    if (!candidateToRemove) return;
    setRemoving(true);
    try {
      await api.post(`/candidates/${candidateToRemove}/save`);
      setCandidates(candidates.filter(c => c.candidateId !== candidateToRemove));
      toast.success('Đã bỏ lưu ứng viên');
    } catch (error: any) {
       toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi bỏ lưu');
    } finally {
      setRemoving(false);
      setCandidateToRemove(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <Heart className="h-8 w-8 text-rose-500 fill-rose-500/20" />
            Ứng Viên Yêu Thích
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Danh sách các tài năng bạn đang quan tâm và muốn liên hệ.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm trong danh sách đã lưu..." 
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/70 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Ứng viên</th>
                <th className="px-6 py-4">Chuyên ngành</th>
                <th className="px-6 py-4">Liên hệ</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-400">Đang tải danh sách...</td></tr>
              ) : candidates.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-400">
                    <Heart className="w-12 h-12 mx-auto text-slate-200 mb-3" />
                    <p>Chưa có ứng viên nào trong danh sách yêu thích.</p>
                  </td>
                </tr>
              ) : candidates.map(candidate => (
                <tr key={candidate.candidateId} className="hover:bg-rose-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-lg overflow-hidden shrink-0">
                         {candidate.user?.avatar ? (
                           <img src={candidate.user.avatar} className="w-full h-full object-cover" />
                         ) : (
                           (candidate.fullName || 'U').charAt(0)
                         )}
                       </div>
                       <div>
                         <div className="font-semibold text-slate-800 text-base">{candidate.fullName}</div>
                         <div className="text-slate-400 text-xs flex items-center gap-1 mt-0.5 max-w-[200px] truncate">
                            {candidate.university || 'N/A'}
                         </div>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-slate-700">{candidate.major || 'Chưa cập nhật'}</span>
                    {candidate.gpa && <div className="text-xs text-slate-500 mt-1">GPA: <span className="text-indigo-600 font-semibold">{candidate.gpa}</span></div>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1.5">
                       {candidate.user?.email && (
                         <div className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer">
                           <Mail className="w-4 h-4 text-indigo-400" />
                           <span className="text-sm truncate max-w-[150px]">{candidate.user.email}</span>
                         </div>
                       )}
                       {candidate.user?.phoneNumber && (
                         <div className="flex items-center gap-2 text-slate-600">
                           <Phone className="w-4 h-4 text-emerald-500" />
                           <span className="text-sm">{candidate.user.phoneNumber}</span>
                         </div>
                       )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {candidate.isUnlocked ? (
                        candidate.cvs && candidate.cvs[0] ? (
                          <a 
                            href={getFileUrl(candidate.cvs[0].fileUrl)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors font-medium text-sm"
                          >
                            <FileText className="w-4 h-4" /> Xem CV
                          </a>
                        ) : (
                          <button disabled className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-400 font-medium text-sm transition-colors cursor-not-allowed">
                            <FileText className="w-4 h-4" /> Không có CV
                          </button>
                        )
                      ) : (
                        <button disabled className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-400 font-medium text-sm transition-colors cursor-not-allowed">
                          <Lock className="w-4 h-4" /> Đã ẩn CV
                        </button>
                      )}
                      <button 
                        onClick={() => setCandidateToRemove(candidate.candidateId)}
                        title="Bỏ lưu"
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <BookmarkMinus className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {candidateToRemove && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 10 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 10 }}
               className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col"
            >
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  Xác nhận
                </h2>
                <button 
                  onClick={() => setCandidateToRemove(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 text-slate-600">
                Bạn có chắc chắn muốn bỏ lưu ứng viên này không? Ứng viên sẽ bị xóa khỏi danh sách yêu thích của bạn.
              </div>

              <div className="px-6 py-5 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3">
                 <button 
                   onClick={() => setCandidateToRemove(null)}
                   className="px-5 h-10 rounded-xl border border-slate-200 font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                 >
                   Hủy
                 </button>
                 <button 
                   onClick={confirmRemove}
                   disabled={removing}
                   className="px-5 h-10 rounded-xl bg-rose-500 text-white font-medium hover:bg-rose-600 disabled:opacity-50 transition-colors shadow-md shadow-rose-500/30 flex items-center gap-2"
                 >
                   {removing ? <Loader2 className="w-4 h-4 animate-spin"/> : <BookmarkMinus className="w-4 h-4"/>}
                   Bỏ lưu
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
