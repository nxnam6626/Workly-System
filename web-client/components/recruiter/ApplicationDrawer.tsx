'use client';
import { X, Eye, Clock, CheckCircle, XCircle, Calendar, MapPin, Briefcase, User, Lock, Star, Phone, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api, { getFileUrl } from '@/lib/api';

interface Props {
  app: any;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
  onUnlock: (appId: string, name: string) => void;
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  PENDING:            { label: 'Chờ duyệt',     cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  REVIEWING:          { label: 'Đang xem xét',  cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  INTERVIEWING:       { label: 'Phỏng vấn',     cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  INTERVIEW_CONFIRMED:{ label: 'Đã chốt lịch',  cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  ACCEPTED:           { label: 'Đã tuyển',      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  REJECTED:           { label: 'Từ chối',       cls: 'bg-red-50 text-red-700 border-red-200' },
};

export function ApplicationDrawer({ app, onClose, onStatusChange, onUnlock }: Props) {
  if (!app) return null;
  const st = STATUS_MAP[app.appStatus] ?? { label: app.appStatus, cls: 'bg-slate-100 text-slate-600 border-slate-200' };
  const score = app.aiMatchScore ?? 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-40 flex justify-end">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={onClose} />
        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full overflow-y-auto">

          {/* Header */}
          <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
            <h2 className="font-black text-slate-900 text-lg">Chi tiết đơn ứng tuyển</h2>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6 flex-1">
            {/* Candidate */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-md shrink-0">
                {app.isUnlocked && app.candidate?.user?.avatar
                  ? <img src={app.candidate.user.avatar} className="w-full h-full object-cover" />
                  : <span className="text-2xl font-black text-indigo-600">{(app.candidate?.fullName || 'U')[0].toUpperCase()}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-black text-slate-900 truncate">{app.candidate?.fullName}</h3>
                <p className="text-sm text-slate-500 font-medium truncate">Ứng tuyển: {app.jobTitle || app.jobPosting?.title}</p>
                <span className={`inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-black border ${st.cls}`}>{st.label}</span>
              </div>
            </div>

            {/* AI Score */}
            {score > 0 && (
              <div className="bg-gradient-to-br from-indigo-50 to-slate-50 rounded-2xl p-4 border border-indigo-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm font-black text-indigo-700"><Star className="w-4 h-4" />AI Match Score</div>
                  <span className="text-2xl font-black text-indigo-600">{score}%</span>
                </div>
                <div className="h-2 bg-indigo-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${score}%` }} />
                </div>
              </div>
            )}

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Clock,     label: 'Ngày ứng tuyển', value: new Date(app.applyDate).toLocaleDateString('vi-VN') },
                { icon: MapPin,    label: 'Nơi làm việc', value: app.desiredLocation || 'Không yêu cầu' },
                { icon: Briefcase, label: 'Vị trí', value: app.jobTitle || app.jobPosting?.title || '—' },
                { icon: User,      label: 'Họ tên', value: app.candidate?.fullName || '—' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1"><Icon className="w-3.5 h-3.5" /><span className="text-[10px] font-bold uppercase tracking-wider">{label}</span></div>
                  <p className="text-sm font-bold text-slate-800 truncate">{value}</p>
                </div>
              ))}
            </div>

            {/* Unlocked contact */}
            {app.isUnlocked && (
              <div className="space-y-2">
                {app.candidate?.user?.email && (
                  <a href={`mailto:${app.candidate.user.email}`} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-100 transition-colors">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-700 font-medium">{app.candidate.user.email}</span>
                  </a>
                )}
                {app.candidate?.user?.phoneNumber && (
                  <a href={`tel:${app.candidate.user.phoneNumber}`} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-100 transition-colors">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-700 font-medium">{app.candidate.user.phoneNumber}</span>
                  </a>
                )}
              </div>
            )}

            {/* Interview Info */}
            {app.appStatus === 'INTERVIEWING' && app.interviewDate && (
              <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100 space-y-2">
                <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-3">Lịch phỏng vấn</p>
                <div className="flex items-center gap-2 text-sm text-slate-700"><Calendar className="w-4 h-4 text-indigo-500" />{new Date(app.interviewDate).toLocaleDateString('vi-VN')}</div>
                {app.interviewTime && <div className="flex items-center gap-2 text-sm text-slate-700"><Clock className="w-4 h-4 text-indigo-500" />{app.interviewTime}</div>}
                {app.interviewLocation && <div className="flex items-center gap-2 text-sm text-slate-700"><MapPin className="w-4 h-4 text-indigo-500" />{app.interviewLocation}</div>}
              </div>
            )}

            {/* Cover Letter */}
            {app.coverLetter && (
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Thư xin việc</p>
                <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-4 border border-slate-100 leading-relaxed line-clamp-6">{app.coverLetter}</p>
              </div>
            )}
          </div>

          {/* Actions Footer */}
          <div className="sticky bottom-0 bg-white border-t border-slate-100 p-6 space-y-3">
            {/* CV */}
            {app.isUnlocked ? (
              <a href={getFileUrl(app.cvSnapshotUrl)} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors">
                <Eye className="w-4 h-4" /> Xem CV
              </a>
            ) : (
              <button onClick={() => onUnlock(app.applicationId, app.candidate?.fullName)}
                className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100">
                <Lock className="w-4 h-4" /> Mở khóa để xem CV
              </button>
            )}

            {/* Status actions */}
            {app.appStatus === 'PENDING' && (
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => onStatusChange(app.applicationId, 'INTERVIEWING')}
                  className="flex items-center justify-center gap-2 py-2.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl font-bold text-sm hover:bg-blue-100 transition-colors">
                  <Clock className="w-4 h-4" /> Hẹn phỏng vấn
                </button>
                <button onClick={() => onStatusChange(app.applicationId, 'REJECTED')}
                  className="flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors">
                  <XCircle className="w-4 h-4" /> Từ chối
                </button>
              </div>
            )}
            {app.appStatus === 'INTERVIEWING' && (
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => onStatusChange(app.applicationId, 'ACCEPTED')}
                  className="flex items-center justify-center gap-2 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-sm hover:bg-emerald-100 transition-colors">
                  <CheckCircle className="w-4 h-4" /> Đã tuyển
                </button>
                <button onClick={() => onStatusChange(app.applicationId, 'REJECTED')}
                  className="flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors">
                  <XCircle className="w-4 h-4" /> Từ chối
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
