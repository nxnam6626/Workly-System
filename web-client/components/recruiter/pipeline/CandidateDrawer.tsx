import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, MessageSquare, Calendar as CalendarIcon, ClipboardList } from 'lucide-react';
import ReviewSystem from '@/components/recruiter/pipeline/ReviewSystem';
import ScorecardPanel from '@/components/recruiter/pipeline/ScorecardPanel';
import api from '@/lib/api';
import { ShieldAlert, AlertCircle } from 'lucide-react';
import ReportCandidateModal from './ReportCandidateModal';
import { useSocketStore } from '@/stores/socket';

interface CandidateDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  application: any;
  mutate: () => void;
}

export default function CandidateDrawer({ isOpen, onClose, application, mutate }: CandidateDrawerProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'reviews'>('profile');
  const [showReportModal, setShowReportModal] = useState(false);
  const { socket, connect } = useSocketStore();

  React.useEffect(() => {
    connect();
  }, []);

  React.useEffect(() => {
    if (socket) {
      const handleSync = (data: any) => {
        if (data.type === 'CANDIDATE_REPORTED' && data.applicationId === application?.applicationId) {
          mutate();
        }
      };

      socket.on('dashboard.sync', handleSync);
      return () => {
        socket.off('dashboard.sync', handleSync);
      };
    }
  }, [socket, application?.applicationId]);

  if (!application) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[100]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%', opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.5 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-[550px] max-w-[100vw] bg-white shadow-2xl z-[101] flex flex-col border-l border-slate-200"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-4">
                <img 
                  src={application.candidate?.user?.avatar || '/default-avatar.png'} 
                  alt="Avatar" 
                  className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900 leading-tight">
                      {application.candidate?.fullName}
                    </h2>
                    {application.candidate?.user?.violations > 0 && (
                      <div className="flex items-center gap-1 bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-100 animate-pulse">
                        <AlertCircle size={12} />
                        <span className="text-[10px] font-black">{application.candidate.user.violations} Vi phạm</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-medium text-slate-500">
                    Ứng tuyển vào <span className="text-slate-800">{new Date(application.applyDate).toLocaleDateString()}</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2.5 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex px-6 border-b border-slate-200 gap-1">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-3.5 px-3 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'profile' ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <FileText size={15} /> Hồ sơ
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`py-3.5 px-3 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'reviews' ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <MessageSquare size={15} />
                Ghi chú
                {application.candidate?.candidateReviews?.length > 0 && (
                  <span className="bg-sky-100 text-sky-700 py-0.5 px-2 rounded-full text-[10px] ml-1">
                    {application.candidate.candidateReviews.length}
                  </span>
                )}
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-slate-50 custom-scrollbar">
              {activeTab === 'profile' && (
                <div className="p-6">
                  {application.cvSnapshotUrl && (
                    <div className="mb-6">
                      <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">CV Đính kèm</h3>
                      <a href={application.cvSnapshotUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:border-sky-300 transition-colors">
                        <div className="w-10 h-10 bg-red-50 text-red-500 rounded-lg flex items-center justify-center">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-700 text-sm">Xem file CV Gốc</p>
                          <p className="text-xs text-slate-400">PDF Document</p>
                        </div>
                      </a>
                    </div>
                  )}
                  <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Kinh nghiệm & Kỹ năng</h3>
                    <div className="space-y-4">
                      {application.candidate?.skills?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 mb-2">Kỹ năng</p>
                          <div className="flex flex-wrap gap-2">
                            {application.candidate.skills.map((s: any, i: number) => (
                              <span key={i} className="px-3 py-1 bg-slate-100 text-slate-700 text-xs rounded-md font-medium">
                                {s.skillName}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <ReviewSystem candidateId={application.candidateId} jobId={application.jobPostingId} mutate={mutate} />
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-white">
              <div className="flex items-center gap-3">
                <select 
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-sky-500"
                  value={application.appStatus}
                  onChange={async (e) => {
                    try {
                      await api.patch(`/applications/${application.applicationId}/status`, { status: e.target.value });
                      mutate();
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                >
                  <option value="PENDING">Trạng thái: Ứng tuyển</option>
                  <option value="REVIEWING">Trạng thái: Đang xem xét</option>
                  <option value="INTERVIEWING">Trạng thái: Phỏng vấn</option>
                  <option value="OFFERED">Trạng thái: Đề nghị (Offer)</option>
                  <option value="HIRED">Trạng thái: Đã Tuyển</option>
                  <option value="REJECTED">Trạng thái: Từ Chối</option>
                </select>
                <a 
                  href={`/recruiter/jobs/${application.jobPostingId}/candidates?view=${application.applicationId}`}
                  className="px-6 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors text-center"
                >
                  Chi tiết
                </a>
                <button 
                  onClick={() => setShowReportModal(true)}
                  className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all flex items-center justify-center border border-red-100"
                  title="Báo cáo vi phạm"
                >
                  <ShieldAlert size={18} />
                </button>
              </div>
            </div>

            <ReportCandidateModal
              isOpen={showReportModal}
              onClose={() => setShowReportModal(false)}
              candidateId={application.candidateId}
              applicationId={application.applicationId}
              candidateName={application.candidate?.fullName}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
