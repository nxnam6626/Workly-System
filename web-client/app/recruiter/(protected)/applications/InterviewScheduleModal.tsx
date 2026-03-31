import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, MapPin, X } from 'lucide-react';

interface InterviewScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (date: string, time: string, location: string) => void;
  candidateName: string;
  isSubmitting?: boolean;
  initialData?: {
    date: string;
    time: string;
    location: string;
  };
}

export function InterviewScheduleModal({
  isOpen,
  onClose,
  onSubmit,
  candidateName,
  isSubmitting = false,
  initialData
}: InterviewScheduleModalProps) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setDate(initialData.date);
        setTime(initialData.time);
        setLocation(initialData.location);
      } else {
        setDate('');
        setTime('');
        setLocation('');
      }
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) return;
    onSubmit(date, time, location);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="absolute top-4 right-4">
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-1">
              {initialData ? 'Dời Lịch Phỏng Vấn' : 'Hẹn Lịch Phỏng Vấn'}
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              {initialData ? 'Cập nhật lại thời gian phỏng vấn' : 'Thiết lập thời gian phỏng vấn'} cho ứng viên <span className="font-bold text-slate-700">{candidateName}</span>
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 block">Ngày Phỏng Vấn <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors shadow-sm text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 block">Giờ Phỏng Vấn <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors shadow-sm text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 block">Địa Điểm / Link Online (Tùy chọn)</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <textarea
                    placeholder="VD: Phòng họp A, Tầng 3 hoặc Link Google Meet..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    rows={2}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors shadow-sm text-sm resize-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !date || !time}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-md shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Đang gửi...' : 'Gửi Thông Báo'}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
