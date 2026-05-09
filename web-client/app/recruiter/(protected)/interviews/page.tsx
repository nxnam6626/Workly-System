'use client';

import { useEffect, useState, useMemo } from 'react';
import api from '@/lib/api';
import {
  ChevronLeft, ChevronRight, Settings, CalendarDays,
  Clock, MapPin, Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import { InterviewSettingsModal } from '@/components/recruiter/interviews/InterviewSettingsModal';
import { useSocketStore } from '@/stores/socket';
import { AnimatePresence, motion } from 'framer-motion';

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const MONTHS_VI = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];

export default function InterviewManagementPage() {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { socket } = useSocketStore();

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const res = await api.get('/evaluations/all-sessions');
      // The API returns an array of { date: string, applications: any[] }.
      // Flatten it so the calendar logic works exactly as before.
      const flattenedInterviews = res.data.flatMap((session: any) => 
        session.applications.map((app: any) => ({
          ...app,
          id: app.applicationId,
          jobPostingId: app.jobPostingId,
          candidateName: app.candidate?.fullName || 'Ứng viên',
          jobTitle: app.jobTitle || 'Công việc',
          time: app.interviewTime,
          date: session.date, // Add mapped date for grouping
          location: app.interviewLocation,
          status: app.appStatus,
        }))
      );
      setInterviews(flattenedInterviews);
    } catch {
      toast.error('Không thể tải lịch phỏng vấn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInterviews(); }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('dashboard.sync', fetchInterviews);
    return () => { socket.off('dashboard.sync', fetchInterviews); };
  }, [socket]);



  // ── Calendar logic ───────────────────────────────────────────────────
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  // Build calendar grid (6 rows x 7 cols)
  const calendarDays = useMemo(() => {
    const days: { date: Date; isCurrentMonth: boolean }[] = [];
    const totalCells = 42;
    for (let i = 0; i < totalCells; i++) {
      if (i < firstDayOfMonth) {
        days.push({ date: new Date(year, month - 1, daysInPrev - firstDayOfMonth + i + 1), isCurrentMonth: false });
      } else if (i < firstDayOfMonth + daysInMonth) {
        days.push({ date: new Date(year, month, i - firstDayOfMonth + 1), isCurrentMonth: true });
      } else {
        days.push({ date: new Date(year, month + 1, i - firstDayOfMonth - daysInMonth + 1), isCurrentMonth: false });
      }
    }
    return days;
  }, [year, month, firstDayOfMonth, daysInMonth, daysInPrev]);

  // Map interview dates to ISO date keys
  const interviewsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    interviews.forEach((iv) => {
      // The API might return 'unscheduled', ignore it for the calendar dots
      if (iv.date === 'unscheduled') return;
      const key = iv.date;
      if (!map[key]) map[key] = [];
      map[key].push(iv);
    });
    return map;
  }, [interviews]);

  const todayDate = new Date();
  const todayStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;

  const handleDayClick = (date: Date, hasInterviews: boolean) => {
    if (!hasInterviews) return;
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    setSelectedDate(dateStr);
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => { setCurrentDate(new Date()); setSelectedDate(null); };

  // Interviews for selected date (for sidebar)
  const selectedInterviews = selectedDate ? (interviewsByDate[selectedDate] || []) : [];

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden bg-slate-50">
      {/* ── Header ── */}
      <div className="flex-shrink-0 px-6 py-4 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            Quản Lý Phỏng Vấn
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-sky-50 hover:text-sky-600 transition-colors"
              title="Cấu hình lịch"
            >
              <Settings size={15} />
            </button>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Xem lịch phỏng vấn ứng viên</p>
        </div>

        <div className="flex items-center gap-3">


        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key="calendar"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="h-full flex"
          >
            {/* Calendar */}
            <div className="flex-1 flex flex-col p-6 overflow-hidden">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors">
                    <ChevronLeft size={18} />
                  </button>
                  <h2 className="text-lg font-bold text-slate-800">
                    {MONTHS_VI[month]} {year}
                  </h2>
                  <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors">
                    <ChevronRight size={18} />
                  </button>
                </div>
                <button
                  onClick={goToday}
                  className="px-4 py-2 text-sm font-semibold text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-xl transition-colors border border-sky-200"
                >
                  Hôm nay
                </button>
              </div>

              {/* Grid */}
              <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 border-b border-slate-100">
                  {WEEKDAYS.map((d) => (
                    <div key={d} className={`py-3 text-center text-xs font-bold uppercase tracking-wider ${d === 'CN' ? 'text-rose-500' : 'text-slate-500'}`}>
                      {d}
                    </div>
                  ))}
                </div>

                {/* Day Cells */}
                <div className="flex-1 grid grid-cols-7 grid-rows-6">
                  {calendarDays.map(({ date, isCurrentMonth }, idx) => {
                    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                    const dayInterviews = interviewsByDate[dateStr] || [];
                    const hasInterviews = dayInterviews.length > 0;
                    const isToday = dateStr === todayStr;
                    const isSelected = dateStr === selectedDate;
                    const isSunday = date.getDay() === 0;

                    return (
                      <div
                        key={idx}
                        onClick={() => handleDayClick(date, hasInterviews)}
                        className={`relative border-b border-r border-slate-100 p-2 flex flex-col transition-colors last:border-r-0
                          ${hasInterviews ? 'cursor-pointer hover:bg-sky-50' : 'cursor-default'}
                          ${!isCurrentMonth ? 'bg-slate-50/50' : ''}
                          ${isSelected ? 'bg-sky-50 ring-2 ring-inset ring-sky-400' : ''}
                        `}
                      >
                        <span className={`text-sm font-semibold self-start w-7 h-7 flex items-center justify-center rounded-full transition-colors
                          ${isToday ? 'bg-sky-600 text-white' : ''}
                          ${isSunday && !isToday ? 'text-rose-500' : ''}
                          ${!isCurrentMonth && !isToday ? 'text-slate-300' : ''}
                          ${isCurrentMonth && !isToday && !isSunday ? 'text-slate-700' : ''}
                        `}>
                          {date.getDate()}
                        </span>

                        {/* Interview dots */}
                        {hasInterviews && (
                          <div className="mt-1 space-y-0.5">
                            {dayInterviews.slice(0, 2).map((iv: any, i: number) => (
                              <div key={i} className="flex items-center gap-1 bg-sky-100 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-sky-800 truncate">
                                <Clock size={8} className="shrink-0" />
                                <span className="truncate">{iv.candidateName}</span>
                              </div>
                            ))}
                            {dayInterviews.length > 2 && (
                              <div className="text-[10px] text-slate-400 font-medium px-1">
                                +{dayInterviews.length - 2} thêm
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sidebar — Selected Date Detail */}
            <div className="w-80 border-l border-slate-200 bg-white overflow-y-auto flex flex-col shrink-0">
              {selectedDate ? (
                <>
                  <div className="px-5 py-4 border-b border-slate-100">
                    <p className="font-bold text-slate-800">
                      {new Date(selectedDate + 'T00:00:00').toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    <p className="text-sm text-slate-500 mt-0.5">{selectedInterviews.length} buổi phỏng vấn</p>
                  </div>

                  <div className="flex-1 p-4 space-y-3">
                    {selectedInterviews.map((iv: any) => (
                      <div key={iv.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{iv.candidateName}</p>
                            <p className="text-xs text-sky-600 font-medium line-clamp-1">{iv.jobTitle}</p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                            iv.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            iv.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {iv.status === 'ACCEPTED' ? 'Đậu' : iv.status === 'REJECTED' ? 'Rớt' : 'Chờ'}
                          </span>
                        </div>
                        <div className="space-y-1 text-xs text-slate-500">
                          {iv.time && <div className="flex items-center gap-1.5"><Clock size={11} /> {iv.time}</div>}
                          {iv.location && <div className="flex items-center gap-1.5"><MapPin size={11} /> <span className="line-clamp-1">{iv.location}</span></div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12 text-slate-400">
                  <Users size={36} className="mb-3 text-slate-200" />
                  <p className="font-semibold text-slate-500">Chọn một ngày</p>
                  <p className="text-sm mt-1">Các buổi phỏng vấn trong ngày sẽ hiển thị tại đây</p>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <InterviewSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSuccess={fetchInterviews}
      />
    </div>
  );
}
