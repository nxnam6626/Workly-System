import { useState, useEffect } from 'react';
import { X, Calendar, Clock, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface ScheduleInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  onSuccess: () => void;
}

export function ScheduleInterviewModal({ isOpen, onClose, applicationId, onSuccess }: ScheduleInterviewModalProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [availableDays, setAvailableDays] = useState<any[]>([]);
  const [defaultLocation, setDefaultLocation] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');

  useEffect(() => {
    if (isOpen && applicationId) {
      fetchSlots();
    }
  }, [isOpen, applicationId]);

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/applications/${applicationId}/available-slots`);
      setAvailableDays(data?.availableDays || []);
      setDefaultLocation(data?.defaultLocation || 'Trao đổi qua tin nhắn');
      
      if (data?.availableDays && data.availableDays.length > 0) {
        setSelectedDate(data.availableDays[0].date);
      }
    } catch (error) {
      console.error(error);
      toast.error('Không thể lấy danh sách lịch trống');
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Vui lòng chọn ngày và giờ');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/applications/${applicationId}/schedule`, {
        date: selectedDate,
        time: selectedTime,
      });
      toast.success('Đã xác nhận lịch phỏng vấn!');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi xếp lịch');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentDay = availableDays.find(d => d.date === selectedDate);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Chọn lịch phỏng vấn
              </h2>
              <p className="text-sm text-slate-500 mt-1">Vui lòng chọn khung giờ phù hợp với bạn nhất</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-200/50 text-slate-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
                <p className="text-sm text-slate-500 font-medium">Đang tìm các khung giờ khả dụng...</p>
              </div>
            ) : availableDays.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-slate-500 font-medium">Hiện tại không còn lịch trống nào trong 14 ngày tới.</p>
                <p className="text-sm text-slate-400 mt-1">Vui lòng nhắn tin trực tiếp với nhà tuyển dụng để thỏa thuận lại.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">1. Chọn ngày khả dụng</label>
                  
                  {defaultLocation && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">📍</span>
                      <div>
                        <p className="text-xs font-bold text-blue-900">Địa điểm / Hình thức phỏng vấn dự kiến:</p>
                        <p className="text-sm text-blue-800">{defaultLocation}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide">
                    {availableDays.map((day) => (
                      <button
                        key={day.date}
                        onClick={() => {
                          setSelectedDate(day.date);
                          setSelectedTime(''); // Reset time when day changes
                        }}
                        className={`flex-shrink-0 px-4 py-3 rounded-2xl border-2 transition-all ${
                          selectedDate === day.date
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                            : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <div className="text-xs font-semibold uppercase tracking-wider mb-1">
                          {new Date(day.date).toLocaleDateString('vi-VN', { weekday: 'short' })}
                        </div>
                        <div className="text-lg font-bold">
                          {new Date(day.date).getDate()}/{new Date(day.date).getMonth() + 1}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {currentDay && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                      2. Chọn giờ phỏng vấn <span className="text-slate-400 font-normal">({formatDate(selectedDate)})</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {currentDay.slots.map((slot: string) => (
                        <button
                          key={slot}
                          onClick={() => setSelectedTime(slot)}
                          className={`flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border-2 font-semibold transition-all ${
                            selectedTime === slot
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                              : 'border-slate-100 hover:border-slate-300 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <Clock className="w-4 h-4 opacity-70" />
                          {slot}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-200/50 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleSchedule}
              disabled={submitting || !selectedDate || !selectedTime}
              className="px-6 py-2.5 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              Xác nhận lịch
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
