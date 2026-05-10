"use client";
 
import React, { useState, useEffect, useMemo } from "react";
import {
  CalendarDays, MapPin, Clock, Building2,
  Users, ChevronRight, ChevronLeft,
  CheckCircle2, AlertCircle, ArrowRight, X,
  Sparkles, ExternalLink, Calendar, Bell,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import { ProfilePageShell } from "@/components/candidates/ProfilePageShell";
 
interface Interview {
  applicationId: string;
  jobPostingId: string;
  interviewDate: string;
  interviewTime: string;
  interviewLocation?: string;
  note?: string;
  appStatus: "INTERVIEWING" | "ACCEPTED" | "REJECTED";
  jobPosting: {
    title: string;
    company: {
      companyName: string;
      logo: string | null;
    };
  };
}
 


const STATUS_LABEL = {
  PENDING: { label: "Chờ duyệt", color: "text-amber-600", bg: "bg-amber-50", accentColor: "#F59E0B" },
  REVIEWED: { label: "Đang xem xét", color: "text-violet-600", bg: "bg-violet-50", accentColor: "#8B5CF6" },
  INTERVIEWING: { label: "Đang phỏng vấn", color: "text-blue-600", bg: "bg-blue-50", accentColor: "#3B82F6" },
  INTERVIEW_CONFIRMED: { label: "Đã xác nhận", color: "text-emerald-600", bg: "bg-emerald-50", accentColor: "#10B981" },
  RESCHEDULE_REQUESTED: { label: "Yêu cầu dời lịch", color: "text-rose-600", bg: "bg-rose-50", accentColor: "#F43F5E" },
  ACCEPTED: { label: "Đã trúng tuyển", color: "text-emerald-600", bg: "bg-emerald-50", accentColor: "#10B981" },
  REJECTED: { label: "Không qua vòng", color: "text-slate-400", bg: "bg-slate-50", accentColor: "#94A3B8" },
} as const;



function formatInterviewDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const weekdayNames = ["CN", "Th 2", "Th 3", "Th 4", "Th 5", "Th 6", "Th 7"];
    const weekday = weekdayNames[d.getDay()];
    return `${weekday}, ${day} thg ${month}`;
  } catch (e) {
    return dateStr;
  }
}

function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

interface MiniCalendarProps {
  interviews: Interview[];
  selectedDate: string | null;
  onSelectDate: (dateStr: string | null) => void;
}

function MiniCalendar({ interviews, selectedDate, onSelectDate }: MiniCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const interviewDates = new Set(
    interviews.map(inv => {
      const d = new Date(inv.interviewDate);
      const pad = (n: number) => n.toString().padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    })
  );

  const monthNames = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
  ];

  const cells = [];
  const startPad = firstDay === 0 ? 6 : firstDay - 1;
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(new Date(year, month - 1))}
          className="p-1.5 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 text-slate-400" />
        </button>
        <h3 className="text-sm font-bold text-slate-900">
          {monthNames[month]} {year}
        </h3>
        <button
          onClick={() => setCurrentMonth(new Date(year, month + 1))}
          className="p-1.5 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-slate-300 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} />;
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          const pad = (n: number) => n.toString().padStart(2, "0");
          const key = `${year}-${pad(month + 1)}-${pad(day)}`;
          const hasInterview = interviewDates.has(key);
          const isSelected = selectedDate === key;

          return (
            <button
              key={idx}
              onClick={() => {
                onSelectDate(isSelected ? null : key);
              }}
              className={`relative flex items-center justify-center h-8 rounded-lg text-[12px] font-semibold transition-all duration-200 cursor-pointer active:scale-95
                ${isSelected 
                  ? "bg-blue-600 text-white shadow-sm font-bold" 
                  : isToday 
                    ? "bg-slate-900 text-white" 
                    : hasInterview 
                      ? "text-blue-700 bg-blue-50/50 hover:bg-blue-50" 
                      : "text-slate-500 hover:bg-slate-50"
                }`}
            >
              {day}
              {hasInterview && (
                <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${isSelected || isToday ? "bg-white" : "bg-blue-500 animate-pulse"}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        const { data } = await api.get('/applications/me');
        const interviewApps = (data || []).filter((app: any) =>
          ["INTERVIEWING", "INTERVIEW_CONFIRMED", "RESCHEDULE_REQUESTED", "ACCEPTED", "REJECTED"].includes(app.appStatus) &&
          app.interviewDate
        );
        setInterviews(interviewApps);
      } catch (error) {
        console.error("Error fetching interviews:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInterviews();
  }, []);

  const now = new Date();

  const upcoming = useMemo(() =>
    interviews.filter(inv => new Date(inv.interviewDate) >= now),
    [interviews]
  );

  const past = useMemo(() =>
    interviews.filter(inv => new Date(inv.interviewDate) < now),
    [interviews]
  );

  const displayed = filter === "upcoming" ? upcoming : filter === "past" ? past : interviews;

  const filteredByDate = useMemo(() => {
    if (!selectedDate) return displayed;
    return displayed.filter(inv => {
      const d = new Date(inv.interviewDate);
      const pad = (n: number) => n.toString().padStart(2, "0");
      const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      return key === selectedDate;
    });
  }, [displayed, selectedDate]);

  const nextInterview = upcoming.sort((a, b) =>
    new Date(a.interviewDate).getTime() - new Date(b.interviewDate).getTime()
  )[0];

  return (
    <ProfilePageShell
      title={
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-slate-500 text-[12px] font-medium">
            <Link href="/" className="hover:text-[#1e60ad] transition-colors">Trang chủ</Link>
            <span>/</span>
            <Link href="/profile" className="hover:text-[#1e60ad] transition-colors">Quản lý hồ sơ</Link>
            <span>/</span>
            <span className="text-slate-400">Lịch phỏng vấn</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">
            Lịch phỏng vấn
          </h1>
        </div>
      }
      subtitle={`${upcoming.length} buổi phỏng vấn sắp tới dành cho bạn`}
      filters={
        <div className="flex items-center gap-2">
          {(["all", "upcoming", "past"] as const).map(f => {
            const labels = { all: "Tất cả", upcoming: "Sắp tới", past: "Đã qua" };
            const counts = { all: interviews.length, upcoming: upcoming.length, past: past.length };
            const isActive = filter === f;
            return (
              <button key={f} onClick={() => setFilter(f)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-150 border active:scale-95 ${isActive
                  ? "bg-[#1e60ad] text-white border-[#1e60ad] shadow-sm"
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700"
                  }`}>
                {labels[f]}
                {counts[f] > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                    {counts[f]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      }
    >

      {/* Grid layout: calendar + next interview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Mini Calendar */}
        <MiniCalendar interviews={interviews} selectedDate={selectedDate} onSelectDate={setSelectedDate} />

        {/* Next Interview Spotlight */}
        {nextInterview ? (
          <div className="relative bg-white rounded-2xl p-5 border border-slate-100 shadow-sm overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-500/5 rounded-full -translate-x-1/2 translate-y-1/2 blur-2xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-orange-500 animate-pulse" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Phỏng vấn sắp tới</span>
              </div>

              {(() => {
                const daysUntil = getDaysUntil(nextInterview.interviewDate);
                return (
                  <>
                    <h3 className="font-bold text-[17px] leading-tight text-slate-900 mb-1 line-clamp-1">
                      {nextInterview.jobPosting.title}
                    </h3>
                    <p className="text-slate-500 text-xs font-semibold mb-4">
                      {nextInterview.jobPosting.company.companyName}
                    </p>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Ngày</p>
                        <p className="text-xs font-bold text-slate-900">
                          {formatInterviewDate(nextInterview.interviewDate)}
                        </p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Giờ</p>
                        <p className="text-xs font-bold text-slate-900">{nextInterview.interviewTime}</p>
                      </div>
                    </div>

                    {nextInterview.interviewLocation && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 mb-4 text-slate-600">
                        <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="text-xs font-medium truncate">{nextInterview.interviewLocation}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${daysUntil === 0 ? "bg-orange-50 text-orange-600" :
                        daysUntil === 1 ? "bg-amber-50 text-amber-600" :
                          "bg-blue-50 text-blue-600"
                        }`}>
                        {daysUntil === 0 ? "⚡ Hôm nay!" :
                          daysUntil === 1 ? "🗓 Ngày mai" :
                            `📅 ${daysUntil} ngày nữa`}
                      </span>
                      <Link href={`/jobs/${nextInterview.jobPostingId}`}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-[#1e60ad] transition-colors">
                        Xem chi tiết <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 flex flex-col items-center justify-center text-center gap-3">
            <CalendarDays className="w-10 h-10 text-slate-200" />
            <p className="text-sm font-bold text-slate-400">Không có phỏng vấn sắp tới</p>
            <p className="text-xs text-slate-300 max-w-[180px] leading-relaxed">
              Ứng tuyển thêm để có cơ hội phỏng vấn mới!
            </p>
          </div>
        )}
      </div>



      {/* Date Filter Notification Banner */}
      {selectedDate && (
        <div className="mb-4 flex items-center justify-between px-4 py-3 bg-blue-50/70 border border-blue-100/80 rounded-2xl text-xs font-bold text-blue-700">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span>
              Đang lọc lịch phỏng vấn ngày: {new Date(selectedDate).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <button
            onClick={() => setSelectedDate(null)}
            className="px-3 py-1 bg-white hover:bg-blue-100 text-blue-600 rounded-xl border border-blue-200 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            Hiển thị tất cả
          </button>
        </div>
      )}

      {/* Interview list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 animate-pulse">
              <div className="flex gap-4">
                <div className="w-14 h-14 rounded-xl bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 rounded-lg w-2/3" />
                  <div className="h-3 bg-slate-100 rounded-lg w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <AnimatePresence mode="popLayout" initial={false}>
          {filteredByDate.length > 0 ? (
            <div className="space-y-3">
              {filteredByDate.map((inv, idx) => {
                const statusCfg = STATUS_LABEL[inv.appStatus as keyof typeof STATUS_LABEL] || STATUS_LABEL.PENDING;
                const daysUntil = getDaysUntil(inv.interviewDate);
                const isPast = new Date(inv.interviewDate) < now;

                return (
                  <motion.div
                    key={inv.applicationId}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.2, delay: Math.min(idx * 0.06, 0.3) }}
                    className={`group relative bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden ${isPast && inv.appStatus === "INTERVIEWING" ? "opacity-60" : ""}`}
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1"
                      style={{ backgroundColor: statusCfg.accentColor }} />

                    <div className="pl-6 pr-6 py-5">
                      <div className="flex gap-4 items-start">
                        {/* Company logo */}
                        <div className="w-12 h-12 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center p-2 flex-shrink-0">
                          {inv.jobPosting.company.logo ? (
                            <img src={inv.jobPosting.company.logo} alt="" className="max-w-full max-h-full object-contain" />
                          ) : (
                            <Building2 className="w-6 h-6 text-slate-200" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <Link href={`/jobs/${inv.jobPostingId}`}
                                className="font-bold text-slate-900 text-[15px] hover:text-[#1e60ad] transition-colors block truncate">
                                {inv.jobPosting.title}
                              </Link>
                              <p className="text-xs text-slate-400 font-semibold mt-0.5 flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5" />
                                {inv.jobPosting.company.companyName}
                              </p>
                            </div>

                            <div className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold ${statusCfg.color} ${statusCfg.bg}`}>
                              {inv.appStatus === "ACCEPTED" ? (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              ) : (
                                <CalendarDays className="w-3.5 h-3.5" />
                              )}
                              {statusCfg.label}
                            </div>
                          </div>

                          {/* Combined Meta Info Row (Date • Time • Location) */}
                          <div className="mt-2.5 flex flex-wrap items-center gap-y-1.5 gap-x-3 text-[12px] font-medium text-slate-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{formatInterviewDate(inv.interviewDate)}</span>
                            </div>
                            <span className="text-slate-300">•</span>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{inv.interviewTime}</span>
                            </div>
                            {inv.interviewLocation && (
                              <>
                                <span className="text-slate-300">•</span>
                                <div className="flex items-center gap-1 min-w-0 flex-1 sm:flex-initial">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                  <span className="truncate">{inv.interviewLocation}</span>
                                </div>
                              </>
                            )}
                          </div>

                          {/* Note */}
                          {inv.note && (
                            <div className="mt-3 px-4 py-2.5 bg-amber-50 rounded-xl border border-amber-100/60">
                              <p className="text-[11px] font-bold text-amber-600 mb-0.5 flex items-center gap-1.5">
                                <Bell className="w-3 h-3" />
                                Lưu ý từ nhà tuyển dụng
                              </p>
                              <p className="text-[12px] text-amber-700 leading-relaxed">{inv.note}</p>
                            </div>
                          )}

                          {/* Footer */}
                          <div className="mt-3 pt-2.5 border-t border-slate-50 flex items-center justify-between">
                            <div>
                              {!isPast && inv.appStatus === "INTERVIEWING" && (
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${daysUntil === 0 ? "bg-orange-100 text-orange-600" :
                                  daysUntil === 1 ? "bg-amber-100 text-amber-600" :
                                    "bg-blue-50 text-blue-500"
                                  }`}>
                                  {daysUntil === 0 ? "⚡ Hôm nay!" :
                                    daysUntil === 1 ? "🗓 Ngày mai" :
                                      `📅 ${daysUntil} ngày nữa`}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm p-20 text-center space-y-5"
            >
              <div className="w-20 h-20 mx-auto rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center">
                <CalendarDays className="w-9 h-9 text-slate-200" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                  Chưa có lịch phỏng vấn
                </h3>
                <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Khi nhà tuyển dụng lên lịch phỏng vấn, bạn sẽ thấy thông tin tại đây.
                </p>
              </div>
              <Link href="/profile/jobs/applied"
                className="inline-flex items-center gap-2 px-8 py-3 bg-slate-900 text-white text-sm font-bold rounded-2xl hover:bg-orange-500 transition-all shadow-lg group/cta">
                Xem đơn ứng tuyển
                <ArrowRight className="w-4 h-4 transition-transform group-hover/cta:translate-x-0.5" />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </ProfilePageShell>
  );
}
