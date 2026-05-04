'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Calendar, Clock, CheckCircle, XCircle, Loader2, Edit2, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import { InterviewSettingsModal } from '@/components/recruiter/interviews/InterviewSettingsModal';
import { useSocketStore } from '@/stores/socket';

export default function InterviewManagementPage() {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState<string>('');
  
  const [editingInterview, setEditingInterview] = useState<any>(null);
  const [editForm, setEditForm] = useState({ date: '', time: '', location: '' });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const fetchInterviews = async (date?: string) => {
    setLoading(true);
    try {
      const url = date ? `/recruiters/dashboard?date=${date}` : '/recruiters/dashboard';
      const res = await api.get(url);
      setInterviews(res.data.upcomingInterviews || []);
    } catch (err) {
      toast.error('Không thể tải lịch phỏng vấn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews(filterDate);
  }, [filterDate]);

  const { socket } = useSocketStore();

  useEffect(() => {
    if (!socket) return;
    const handleSync = () => {
      fetchInterviews(filterDate);
    };
    socket.on('dashboard.sync', handleSync);
    return () => {
      socket.off('dashboard.sync', handleSync);
    };
  }, [socket, filterDate]);

  const updateInterviewStatus = async (id: string, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      await api.patch(`/applications/${id}/status`, { status });
      toast.success(status === 'ACCEPTED' ? 'Đã duyệt trúng tuyển!' : 'Đã từ chối ứng viên.');
      fetchInterviews(filterDate);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Cập nhật thất bại!');
    }
  };

  const openEditModal = (interview: any) => {
    setEditingInterview(interview);
    setEditForm({
      date: new Date(interview.date).toISOString().split('T')[0],
      time: interview.time || '',
      location: interview.location || ''
    });
  };

  const handleUpdateSchedule = async () => {
    try {
      await api.patch(`/applications/${editingInterview.id}/status`, {
        status: 'INTERVIEWING',
        interviewDate: editForm.date,
        interviewTime: editForm.time,
        interviewLocation: editForm.location,
      });
      toast.success('Đã cập nhật lịch phỏng vấn!');
      setEditingInterview(null);
      fetchInterviews(filterDate);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Cập nhật thất bại!');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center flex-col items-center min-h-[50vh] gap-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-medium">Đang tải lịch phỏng vấn...</p>
      </div>
    );
  }

  // Nhóm phỏng vấn theo ngày
  const groupedInterviews = interviews.reduce((acc: any, interview: any) => {
    const date = new Date(interview.date).toLocaleDateString('vi-VN');
    if (!acc[date]) acc[date] = [];
    acc[date].push(interview);
    return acc;
  }, {});

  const handlePrevWeek = () => {
    const baseDate = filterDate ? new Date(filterDate) : new Date();
    baseDate.setDate(baseDate.getDate() - 7);
    // Format YYYY-MM-DD for input type="date"
    const offset = baseDate.getTimezoneOffset();
    const localDate = new Date(baseDate.getTime() - (offset * 60 * 1000));
    setFilterDate(localDate.toISOString().split('T')[0]);
  };

  const handleNextWeek = () => {
    const baseDate = filterDate ? new Date(filterDate) : new Date();
    baseDate.setDate(baseDate.getDate() + 7);
    const offset = baseDate.getTimezoneOffset();
    const localDate = new Date(baseDate.getTime() - (offset * 60 * 1000));
    setFilterDate(localDate.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            Quản Lý Phỏng Vấn
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              title="Cấu hình lịch phỏng vấn"
            >
              <Settings className="w-5 h-5" />
            </button>
          </h1>
          <p className="text-slate-500 mt-1">Lịch trình phỏng vấn của bạn</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={handlePrevWeek}
            className="px-3 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 font-medium transition-colors text-sm"
          >
            Tuần trước
          </button>
          
          <div className="relative">
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            />
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          <button 
            onClick={handleNextWeek}
            className="px-3 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 font-medium transition-colors text-sm"
          >
            Tuần sau
          </button>

          {filterDate && (
            <button
              onClick={() => setFilterDate('')}
              className="px-4 py-2 text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors ml-2"
            >
              Về hôm nay
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {Object.keys(groupedInterviews).length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <Calendar className="w-16 h-16 text-slate-200 mb-4" />
            <p className="text-lg font-medium">Chưa có lịch phỏng vấn nào</p>
            <p className="text-sm mt-1">Các lịch phỏng vấn sắp tới sẽ hiển thị tại đây.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {Object.entries(groupedInterviews).map(([dateStr, items]: [string, any]) => (
              <div key={dateStr} className="p-6">
                <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                  <div className={`w-2 h-6 rounded-full ${items.some((i: any) => i.status === 'RESCHEDULE_REQUESTED') ? 'bg-red-500' : 'bg-indigo-500'}`}></div>
                  Ngày {dateStr}
                  {items.some((i: any) => i.status === 'RESCHEDULE_REQUESTED') && (
                    <span className="text-[11px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-md ml-1 border border-orange-200 uppercase tracking-wider">
                      Bị khoá
                    </span>
                  )}
                  <span className="text-sm font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full ml-2">
                    {items.length} lịch
                  </span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((interview: any) => (
                    <div key={interview.id} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow bg-slate-50/50">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-bold text-slate-900">{interview.candidateName}</p>
                          <p className="text-sm text-indigo-600 font-medium line-clamp-1">{interview.jobTitle}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {['INTERVIEWING', 'INTERVIEW_CONFIRMED', 'RESCHEDULE_REQUESTED'].includes(interview.status) && (
                            <button
                              onClick={() => openEditModal(interview)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Cập nhật lịch"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          interview.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700' :
                          interview.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' :
                          interview.status === 'INTERVIEW_CONFIRMED' ? 'bg-blue-100 text-blue-700' :
                          interview.status === 'RESCHEDULE_REQUESTED' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {interview.status === 'ACCEPTED' ? 'Đã duyệt' : 
                           interview.status === 'REJECTED' ? 'Đã từ chối' : 
                           interview.status === 'INTERVIEW_CONFIRMED' ? 'Chờ phỏng vấn' :
                           interview.status === 'RESCHEDULE_REQUESTED' ? 'Chờ phản hồi' :
                           'Chờ phản hồi'}
                        </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span className="font-medium text-slate-700">{interview.time || 'Chưa hẹn'}</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-slate-600">
                          <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{interview.location || 'Chưa có địa điểm'}</span>
                        </div>
                      </div>

                      {['INTERVIEWING', 'INTERVIEW_CONFIRMED', 'RESCHEDULE_REQUESTED'].includes(interview.status) && (
                        <div className="flex items-center gap-2 pt-3 border-t border-slate-200/60">
                          <button
                            onClick={() => updateInterviewStatus(interview.id, 'ACCEPTED')}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-sm font-semibold transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" /> Đậu
                          </button>
                          <button
                            onClick={() => updateInterviewStatus(interview.id, 'REJECTED')}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-sm font-semibold transition-colors"
                          >
                            <XCircle className="w-4 h-4" /> Rớt
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Cập nhật lịch phỏng vấn</h3>
            <p className="text-sm text-slate-500 mb-4">Ứng viên: <strong className="text-slate-800">{editingInterview.candidateName}</strong></p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ngày phỏng vấn</label>
                <input
                  type="date"
                  value={editForm.date}
                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Giờ phỏng vấn</label>
                <input
                  type="time"
                  value={editForm.time}
                  onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Địa điểm / Link Google Meet</label>
                <textarea
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setEditingInterview(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateSchedule}
                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      <InterviewSettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onSuccess={() => fetchInterviews(filterDate)}
      />
    </div>
  );
}
