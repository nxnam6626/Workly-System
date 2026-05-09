'use client';

import { useEffect, useState, useMemo } from 'react';
import api from '@/lib/api';
import {
  ChevronLeft, ChevronRight, Settings, CalendarDays,
  Clock, MapPin, Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import { InterviewSettingsModal } from '@/components/recruiter/interviews/InterviewSettingsModal';
import { ApplicationDrawer } from '@/components/recruiter/ApplicationDrawer';
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
  const [selectedApp, setSelectedApp] = useState<any>(null); // For drawer

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
    <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden bg-slate-50/50 pb-6">
      {/* ── Header ── */}
      <div className="flex-shrink-0 px-8 py-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <CalendarDays className="w-7 h-7 text-indigo-600" />
            Lịch Phỏng Vấn
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 bg-white text-slate-400 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-200 hover:border-indigo-100 shadow-sm hover:shadow"
              title="Cấu hình lịch"
            >
              <Settings className="w-4.5 h-4.5 hover:rotate-90 transition-transform duration-300" />
            </button>
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Quản lý và theo dõi lịch phỏng vấn ứng viên</p>
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
            className="h-full flex px-8 gap-6"
          >
            {/* Calendar */}
            <div className="flex-1 flex flex-col overflow-hidden bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <button onClick={prevMonth} className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-600 transition-all active:scale-95 border border-transparent hover:border-slate-200 hover:shadow-sm">
                    <ChevronLeft size={20} />
                  </button>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    {MONTHS_VI[month]} <span className="text-indigo-600">{year}</span>
                  </h2>
                  <button onClick={nextMonth} className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-600 transition-all active:scale-95 border border-transparent hover:border-slate-200 hover:shadow-sm">
                    <ChevronRight size={20} />
                  </button>
                </div>
                <button
                  onClick={goToday}
                  className="px-5 py-2.5 text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white rounded-xl transition-all border border-indigo-100 hover:border-indigo-600 shadow-sm active:scale-95"
                >
                  Hôm nay
                </button>
              </div>

              {/* Grid */}
              <div className="flex-1 rounded-2xl border border-slate-100 overflow-hidden flex flex-col">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/80 backdrop-blur-sm">
                  {WEEKDAYS.map((d) => (
                    <div key={d} className={`py-3.5 text-center text-[11px] font-black uppercase tracking-widest ${d === 'CN' ? 'text-rose-500' : 'text-slate-500'}`}>
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
                        className={`relative border-b border-r border-slate-100 p-2.5 flex flex-col min-h-0 transition-all duration-300 last:border-r-0
                          ${hasInterviews ? 'cursor-pointer hover:bg-indigo-50/50 hover:shadow-md hover:z-10' : 'cursor-default'}
                          ${!isCurrentMonth ? 'bg-slate-50/50 opacity-60' : ''}
                          ${isSelected ? 'bg-indigo-50/80 ring-4 ring-inset ring-indigo-500/20 z-10' : ''}
                        `}
                      >
                        <span className={`text-[13px] font-bold self-start w-8 h-8 flex items-center justify-center rounded-xl transition-all shadow-sm
                          ${isToday ? 'bg-indigo-600 text-white shadow-indigo-600/30' : 'bg-white border border-slate-100 text-slate-700'}
                          ${isSunday && !isToday ? 'text-rose-500 border-rose-100' : ''}
                          ${!isCurrentMonth && !isToday ? 'text-slate-400 bg-transparent border-transparent shadow-none' : ''}
                          ${isSelected && !isToday ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : ''}
                        `}>
                          {date.getDate()}
                        </span>

                        {/* Interview dots */}
                        {hasInterviews && (
                          <div className="mt-2 space-y-1.5 flex-1 overflow-y-auto no-scrollbar min-h-0 pr-1">
                            {dayInterviews.map((iv: any, i: number) => (
                              <div key={i} className="flex items-center gap-1.5 bg-white border border-indigo-100 shadow-sm rounded-lg px-2 py-1 text-[11px] font-bold text-indigo-700 truncate shrink-0">
                                <Clock size={10} className="shrink-0 text-indigo-400" />
                                <span className="truncate">{iv.candidateName}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sidebar — Selected Date Detail */}
            <div className="w-[380px] bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col shrink-0">
              {selectedDate ? (
                <>
                  <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                    <p className="font-black text-slate-900 text-lg">
                      {new Date(selectedDate + 'T00:00:00').toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    <p className="text-[13px] font-bold text-indigo-600 mt-1.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      {selectedInterviews.length} buổi phỏng vấn
                    </p>
                  </div>

                  <div className="flex-1 p-5 space-y-4 overflow-y-auto">
                    {selectedInterviews.map((iv: any) => (
                      <div key={iv.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-indigo-200 transition-all duration-300 group">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <button
                              onClick={() => setSelectedApp(iv)}
                              className="w-full font-bold text-slate-900 text-[15px] hover:text-indigo-600 hover:underline underline-offset-4 decoration-2 text-left truncate transition-colors"
                            >
                              {iv.candidateName}
                            </button>
                            <p className="text-[13px] text-slate-500 font-medium truncate mt-0.5">{iv.jobTitle}</p>
                          </div>
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg border shadow-sm shrink-0 ${
                            iv.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' :
                            iv.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200/60' :
                            'bg-blue-50 text-blue-700 border-blue-200/60'
                          }`}>
                            {iv.status === 'ACCEPTED' ? 'Đậu' : iv.status === 'REJECTED' ? 'Rớt' : 'Chờ'}
                          </span>
                        </div>
                        <div className="space-y-2 text-[13px] font-medium text-slate-600 bg-slate-50 rounded-xl p-3 border border-slate-100">
                          {iv.time && <div className="flex items-center gap-2.5"><div className="w-6 h-6 shrink-0 rounded-md bg-white flex items-center justify-center shadow-sm"><Clock size={12} className="text-indigo-500" /></div> <span className="truncate">{iv.time}</span></div>}
                          {iv.location && <div className="flex items-center gap-2.5"><div className="w-6 h-6 shrink-0 rounded-md bg-white flex items-center justify-center shadow-sm"><MapPin size={12} className="text-indigo-500" /></div> <span className="truncate">{iv.location}</span></div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-8 py-12">
                  <div className="w-20 h-20 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-4 shadow-inner">
                    <Users size={32} className="text-slate-300" />
                  </div>
                  <p className="font-bold text-slate-800 text-lg mb-1.5">Chọn một ngày</p>
                  <p className="text-[13px] text-slate-500">Các buổi phỏng vấn trong ngày sẽ hiển thị chi tiết tại đây</p>
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

      {/* Side Drawer */}
      {selectedApp && (
        <ApplicationDrawer
          app={selectedApp}
          onClose={() => setSelectedApp(null)}
          onStatusChange={async (id, status) => {
            try {
              await api.patch(`/applications/${id}/status`, { status });
              toast.success('Đã cập nhật trạng thái ứng viên!');
              fetchInterviews();
              setSelectedApp(null);
            } catch (err: any) {
              toast.error(err.response?.data?.message || 'Cập nhật thất bại!');
            }
          }}
          onUnlock={async (id) => {
            try {
              await api.post(`/applications/${id}/unlock`);
              toast.success('Đã mở khóa CV ứng viên!');
              fetchInterviews();
              setSelectedApp({ ...selectedApp, isUnlocked: true });
            } catch (err: any) {
              toast.error(err.response?.data?.message || 'Không thể mở khóa CV');
            }
          }}
        />
      )}
    </div>
  );
}
