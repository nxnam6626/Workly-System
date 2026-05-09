import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import { Inbox, UserSearch, MessagesSquare, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow, isAfter } from 'date-fns';
import { vi } from 'date-fns/locale';
import CandidateDrawer from '@/components/recruiter/pipeline/CandidateDrawer';

const COLUMNS = [
  { id: 'PENDING', label: 'Ứng Tuyển', color: 'bg-slate-100 text-slate-700 border-slate-200', border: 'border-slate-200', icon: Inbox },
  { id: 'REVIEWED', label: 'Lọc Hồ Sơ', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', border: 'border-indigo-200', icon: UserSearch },
  { id: 'INTERVIEWING', label: 'Phỏng Vấn', color: 'bg-sky-50 text-sky-700 border-sky-200', border: 'border-sky-200', icon: MessagesSquare },
  { id: 'ACCEPTED', label: 'Trúng Tuyển', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', border: 'border-emerald-200', icon: CheckCircle2 },
  { id: 'REJECTED', label: 'Từ Chối', color: 'bg-rose-50 text-rose-700 border-rose-200', border: 'border-rose-200', icon: XCircle },
];

function SLABadge({ deadline, label, type }: { deadline: any, label: string, type: 'recruiter' | 'candidate' }) {
  if (!deadline) return null;
  const targetDate = new Date(deadline);
  const isOverdue = isAfter(new Date(), targetDate);
  const timeLeft = formatDistanceToNow(targetDate, { addSuffix: true, locale: vi });

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold border transition-colors ${
      isOverdue 
        ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' 
        : 'bg-slate-50 text-slate-500 border-slate-100'
    }`}>
      {isOverdue ? <AlertTriangle size={10} /> : <Clock size={10} />}
      <span className="uppercase tracking-wider">{label}:</span>
      <span>{isOverdue ? `Trễ ${timeLeft.replace('trước', '')}` : timeLeft}</span>
    </div>
  );
}

export default function KanbanBoard({ applications, mutate, jobId }: { applications: any[], mutate: any, jobId: string }) {
  const [columnsData, setColumnsData] = useState<Record<string, any[]>>({});
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<any>(null);

  useEffect(() => {
    // Group applications by status
    const grouped: Record<string, any[]> = {
      PENDING: [], REVIEWED: [], INTERVIEWING: [], ACCEPTED: [], REJECTED: []
    };
    const apps = Array.isArray(applications) ? applications : (applications as any)?.data || [];
    apps.forEach((app: any) => {
      // Map INTERVIEW_CONFIRMED and RESCHEDULE_REQUESTED to INTERVIEWING for display
      let status = app.appStatus;
      if (status === 'INTERVIEW_CONFIRMED' || status === 'RESCHEDULE_REQUESTED') status = 'INTERVIEWING';

      if (grouped[status]) {
        grouped[status].push(app);
      } else {
        grouped['PENDING'].push(app); // Fallback
      }
    });
    setColumnsData(grouped);
  }, [applications]);

  const handleDragStart = (e: React.DragEvent, appId: string) => {
    setDraggedAppId(appId);
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-50');
    setDraggedAppId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    if (!draggedAppId) return;

    const apps = Array.isArray(applications) ? applications : (applications as any)?.data || [];
    const sourceApp = apps.find((a: any) => a.applicationId === draggedAppId);
    if (!sourceApp || sourceApp.appStatus === targetStatus) return;

    const oldStatus = sourceApp.appStatus;

    setColumnsData(prev => {
      const next = { ...prev };
      let oldColId = oldStatus;
      if (oldStatus === 'INTERVIEW_CONFIRMED' || oldStatus === 'RESCHEDULE_REQUESTED') oldColId = 'INTERVIEWING';
      next[oldColId] = next[oldColId].filter(a => a.applicationId !== draggedAppId);
      next[targetStatus] = [{ ...sourceApp, appStatus: targetStatus }, ...next[targetStatus]];
      return next;
    });

    try {
      await api.patch(`/applications/${draggedAppId}/status`, { status: targetStatus });
      toast.success('Đã cập nhật trạng thái');
      mutate();
    } catch (err) {
      toast.error('Lỗi cập nhật trạng thái');
      mutate();
    }
  };

  return (
    <div className="flex h-full w-max min-w-full p-6 gap-6 items-start bg-slate-50/50">
      {COLUMNS.map(col => (
        <div
          key={col.id}
          className="flex flex-col w-80 max-h-full flex-shrink-0 bg-slate-100/50 rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, col.id)}
        >
          {/* Column Header */}
          <div className={`px-4 py-3.5 border-b ${col.border} bg-white flex items-center justify-between z-10 sticky top-0`}>
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-md border ${col.color}`}>
                <col.icon size={14} strokeWidth={2.5} />
              </div>
              <h3 className="font-bold text-slate-800 text-sm tracking-tight">{col.label}</h3>
            </div>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${col.color}`}>
              {columnsData[col.id]?.length || 0}
            </span>
          </div>

          {/* Cards Container */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar min-h-[150px]">
            {columnsData[col.id]?.map(app => (
              <div
                key={app.applicationId}
                draggable
                onDragStart={(e) => handleDragStart(e, app.applicationId)}
                onDragEnd={handleDragEnd}
                onClick={() => setSelectedApp(app)}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-sky-300 transition-all cursor-pointer group active:scale-[0.98]"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={app.candidate?.user?.avatar || '/default-avatar.png'}
                      alt="Avatar"
                      className="w-10 h-10 rounded-full object-cover border border-slate-100"
                    />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm group-hover:text-sky-600 transition-colors line-clamp-1">
                        {app.candidate?.fullName}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">
                        Score: <span className="text-sky-600 font-bold">{app.aiMatchScore || 0}%</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* SLA Status Badges */}
                <div className="flex flex-col gap-1.5 mb-3">
                  {(app.appStatus === 'PENDING' || app.appStatus === 'REVIEWED') && app.expectedResponseAt && (
                    <SLABadge 
                      deadline={app.expectedResponseAt} 
                      label="Phản hồi" 
                      type="recruiter"
                    />
                  )}

                  {app.appStatus === 'INTERVIEWING' && app.candidateResponseAt && (
                    <SLABadge 
                      deadline={app.candidateResponseAt} 
                      label="Chờ ứng viên" 
                      type="candidate"
                    />
                  )}

                  {(app.appStatus === 'INTERVIEWING' || app.appStatus === 'INTERVIEW_CONFIRMED' || app.appStatus === 'RESCHEDULE_REQUESTED') && !app.candidateResponseAt && app.expectedResultAt && (
                    <SLABadge 
                      deadline={app.expectedResultAt} 
                      label="Kết quả PV" 
                      type="recruiter"
                    />
                  )}
                </div>

                {app.candidate?.skills && app.candidate.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {app.candidate.skills.slice(0, 3).map((s: any, idx: number) => (
                      <span key={idx} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-medium">
                        {s.skillName}
                      </span>
                    ))}
                  </div>
                )}

                {app.candidate?.candidateReviews?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {app.candidate.candidateReviews.slice(0, 3).map((r: any, i: number) => (
                        <div key={i} className="w-6 h-6 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-indigo-700">
                          {r.recruiter?.fullName?.charAt(0)}
                        </div>
                      ))}
                    </div>
                    <span className="text-[10px] font-medium text-slate-400">
                      {app.candidate.candidateReviews.length} notes
                    </span>
                  </div>
                )}
              </div>
            ))}

            {(!columnsData[col.id] || columnsData[col.id].length === 0) && (
              <div className="h-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-200/70 rounded-xl bg-slate-50/50 mt-2">
                <span className="text-[11px] font-medium text-slate-400">Kéo thả ứng viên vào đây</span>
              </div>
            )}
          </div>
        </div>
      ))}

      <CandidateDrawer
        isOpen={!!selectedApp}
        onClose={() => setSelectedApp(null)}
        application={selectedApp}
        mutate={mutate}
      />
    </div>
  );
}
