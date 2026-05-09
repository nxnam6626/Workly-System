'use client';

import React, { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronDown, Clock, AlertCircle, FileText } from 'lucide-react';

const fetcher = (url: string) => api.get(url).then((r) => r.data);

interface Props { jobId: string; initialDate?: string; onRefresh?: () => void }

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  INTERVIEW_CONFIRMED: { label: 'Chờ phỏng vấn', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  INTERVIEWING:        { label: 'Đang phỏng vấn', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  RESCHEDULE_REQUESTED:{ label: 'Chờ phản hồi', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  ACCEPTED:            { label: 'Trúng tuyển', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  REJECTED:            { label: 'Từ chối', color: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export default function SessionListView({ jobId, initialDate, onRefresh }: Props) {
  // '__all__' = fetch across all jobs; otherwise fetch by specific jobId
  const swrKey = jobId === '__all__'
    ? '/evaluations/all-sessions'
    : jobId ? `/evaluations/sessions?jobId=${jobId}` : null;

  const { data: sessions, isLoading } = useSWR(swrKey, fetcher);

  const [expandedDates, setExpandedDates] = useState<Set<string>>(() => initialDate ? new Set([initialDate]) : new Set(['__all__']));
  const sessionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!initialDate || !sessions) return;
    setExpandedDates(new Set([initialDate]));
    setTimeout(() => {
      const el = sessionRefs.current[initialDate];
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
  }, [initialDate, sessions]);

  const toggleDate = (date: string) => {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      next.has(date) ? next.delete(date) : next.add(date);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
          <Calendar size={28} className="text-slate-400" />
        </div>
        <p className="font-bold text-slate-700 text-lg">Chưa có buổi phỏng vấn nào</p>
        <p className="text-sm text-slate-500 mt-1 max-w-xs">Các ứng viên được mời phỏng vấn sẽ hiển thị tại đây.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Session List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-full">
        {sessions.map((session: any) => {
          const isExpanded = expandedDates.has(session.date) || expandedDates.has('__all__');
          const dateLabel = session.date === 'unscheduled'
            ? 'Chưa có lịch'
            : new Date(session.date + 'T00:00:00').toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

          return (
            <div
              key={session.date}
              ref={(el) => { sessionRefs.current[session.date] = el; }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
              {/* Session Header */}
              <button
                onClick={() => toggleDate(session.date)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    session.date === 'unscheduled' ? 'bg-slate-100' : 'bg-sky-50'
                  }`}>
                    {session.date === 'unscheduled'
                      ? <AlertCircle size={18} className="text-slate-400" />
                      : <Calendar size={18} className="text-sky-600" />}
                  </div>
                  <div className="text-left min-w-0">
                    <p className="font-bold text-slate-800 text-sm capitalize truncate">{dateLabel}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {session.applications.length} ứng viên
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <ChevronDown
                    size={18}
                    className={`text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </div>
              </button>

              {/* Candidate Rows */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-slate-100 overflow-hidden"
                  >
                    <div className="divide-y divide-slate-50">
                      {session.applications.map((app: any) => {
                        const statusBadge = STATUS_BADGE[app.appStatus] || { label: app.appStatus, color: 'bg-slate-100 text-slate-600 border-slate-200' };

                        return (
                          <div
                            key={app.applicationId}
                            className="px-5 py-3.5 flex items-center gap-4 hover:bg-slate-50/70 transition-colors"
                          >
                            {/* Avatar */}
                            <img
                              src={app.candidate?.user?.avatar || '/default-avatar.png'}
                              className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
                              alt=""
                            />

                            {/* Name + Status */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-sm text-slate-800 truncate">
                                  {app.candidate?.fullName}
                                </span>
                                {app.cv?.fileUrl && (
                                  <a
                                    href={app.cv.fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-slate-400 hover:text-sky-600 transition-colors p-1 rounded-md hover:bg-slate-200 shrink-0"
                                    title="Xem CV"
                                  >
                                    <FileText size={14} />
                                  </a>
                                )}
                                {app.jobTitle && (
                                  <span className="text-[10px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100 max-w-[150px] truncate">
                                    {app.jobTitle}
                                  </span>
                                )}
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge.color}`}>
                                  {statusBadge.label}
                                </span>
                              </div>
                              {app.candidate?.skills?.slice(0, 3).map((s: any, i: number) => (
                                <span key={i} className="text-[10px] text-slate-500 mr-1">{s.skillName}{i < 2 ? ' ·' : ''}</span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
