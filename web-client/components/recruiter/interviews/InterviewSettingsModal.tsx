import { useState, useEffect } from 'react';
import { X, Save, Clock, MapPin, Users, CalendarOff, AlertTriangle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface InterviewSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function InterviewSettingsModal({ isOpen, onClose, onSuccess }: InterviewSettingsModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    defaultLocation: '',
    timeSlots: ['08:00', '10:00', '14:00', '16:00'],
    blockedDates: [] as string[],
    maxCandidatesPerSlot: 1,
    minNoticeHours: 24,
    maxAdvanceDays: 14,
  });

  const [newSlot, setNewSlot] = useState('');
  const [newBlockDate, setNewBlockDate] = useState('');
  const [newBlockDateTo, setNewBlockDateTo] = useState('');
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/recruiters/me/interview-settings');
      if (res.data) {
        setSettings(res.data);
      }
    } catch (error) {
      console.error(error);
      toast.error('Lỗi khi tải cài đặt lịch phỏng vấn');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (forceSave = false) => {
    // If adding blocked dates, we might want to warn
    if (settings.blockedDates.length > 0 && !forceSave && !showWarning) {
      setShowWarning(true);
      return;
    }

    setSaving(true);
    try {
      await api.patch('/recruiters/me/interview-settings', settings);
      toast.success('Đã lưu cấu hình lịch phỏng vấn!');
      onClose();
      if (onSuccess) onSuccess();
      setShowWarning(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi lưu cài đặt');
    } finally {
      setSaving(false);
    }
  };

  const addTimeSlot = () => {
    if (newSlot && !settings.timeSlots.includes(newSlot)) {
      setSettings({ ...settings, timeSlots: [...settings.timeSlots, newSlot].sort() });
      setNewSlot('');
    }
  };

  const removeTimeSlot = (slot: string) => {
    setSettings({ ...settings, timeSlots: settings.timeSlots.filter(s => s !== slot) });
  };

  const addBlockDate = () => {
    if (!newBlockDate) return;
    
    const datesToAdd: string[] = [];
    if (newBlockDateTo) {
      const start = new Date(newBlockDate);
      const end = new Date(newBlockDateTo);
      if (start > end) {
        toast.error('Ngày kết thúc phải sau ngày bắt đầu');
        return;
      }
      let curr = new Date(start);
      while (curr <= end) {
        datesToAdd.push(curr.toISOString().split('T')[0]);
        curr.setDate(curr.getDate() + 1);
      }
    } else {
      datesToAdd.push(newBlockDate);
    }

    const newBlockedDates = [...settings.blockedDates];
    datesToAdd.forEach(date => {
      if (!newBlockedDates.includes(date)) {
        newBlockedDates.push(date);
      }
    });

    setSettings({ ...settings, blockedDates: newBlockedDates.sort() });
    setNewBlockDate('');
    setNewBlockDateTo('');
  };

  const removeBlockDate = (date: string) => {
    setSettings({ ...settings, blockedDates: settings.blockedDates.filter(d => d !== date) });
  };

  if (!isOpen) return null;

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
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                ⚙️ Cấu hình lịch phỏng vấn
              </h2>
              <p className="text-sm text-slate-500 mt-1">Tùy chỉnh lịch rảnh và địa điểm mặc định của bạn</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-200/50 text-slate-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
                <p className="text-sm text-slate-500 font-medium">Đang tải cài đặt...</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Location */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                    <MapPin className="w-4 h-4 text-rose-500" />
                    Địa điểm phỏng vấn mặc định
                  </label>
                  <input
                    type="text"
                    value={settings.defaultLocation}
                    onChange={(e) => setSettings({ ...settings, defaultLocation: e.target.value })}
                    placeholder="VD: Văn phòng Tầng 3, Tòa nhà Bitexco / Hoặc Link Google Meet"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  />
                  <p className="text-xs text-slate-500 mt-1">Địa điểm này sẽ được gán tự động khi ứng viên chốt lịch.</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Capacity */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      Số ứng viên tối đa / slot
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={settings.maxCandidatesPerSlot}
                      onChange={(e) => setSettings({ ...settings, maxCandidatesPerSlot: parseInt(e.target.value) || 1 })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    />
                  </div>

                  {/* Notice Hours */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                      <Clock className="w-4 h-4 text-emerald-500" />
                      Thời gian báo trước (Giờ)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={settings.minNoticeHours}
                      onChange={(e) => setSettings({ ...settings, minNoticeHours: parseInt(e.target.value) || 24 })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    />
                    <p className="text-xs text-slate-500 mt-1">Ứng viên phải đặt trước ít nhất {settings.minNoticeHours} tiếng.</p>
                  </div>
                </div>

                {/* Time Slots */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    Các khung giờ rảnh mỗi ngày
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {settings.timeSlots.map((slot) => (
                      <span key={slot} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-semibold">
                        {slot}
                        <button onClick={() => removeTimeSlot(slot)} className="hover:text-indigo-900">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="time"
                      value={newSlot}
                      onChange={(e) => setNewSlot(e.target.value)}
                      className="px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    />
                    <button
                      onClick={addTimeSlot}
                      disabled={!newSlot}
                      className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold disabled:opacity-50"
                    >
                      Thêm giờ
                    </button>
                  </div>
                </div>

                {/* Blocked Dates */}
                <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-2xl">
                  <label className="flex items-center gap-2 text-sm font-bold text-rose-700 mb-2">
                    <CalendarOff className="w-4 h-4" />
                    Các ngày bận (Khóa lịch)
                  </label>
                  <p className="text-xs text-rose-600 mb-4">
                    Ứng viên sẽ không thể đặt lịch vào những ngày này. Nếu có ứng viên ĐÃ đặt lịch, hệ thống sẽ tự động HỦY và yêu cầu họ đặt lại.
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {settings.blockedDates.map((date) => (
                      <span key={date} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-200 text-rose-700 rounded-lg text-sm font-semibold shadow-sm">
                        {new Date(date).toLocaleDateString('vi-VN')}
                        <button onClick={() => removeBlockDate(date)} className="hover:text-rose-900">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-xs text-rose-600 font-semibold whitespace-nowrap">Từ:</span>
                      <input
                        type="date"
                        value={newBlockDate}
                        onChange={(e) => setNewBlockDate(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-xs text-rose-600 font-semibold whitespace-nowrap">Đến (Tùy chọn):</span>
                      <input
                        type="date"
                        value={newBlockDateTo}
                        onChange={(e) => setNewBlockDateTo(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-sm"
                      />
                    </div>
                    <button
                      onClick={addBlockDate}
                      disabled={!newBlockDate}
                      className="px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-bold disabled:opacity-50 whitespace-nowrap"
                    >
                      Khóa ngày
                    </button>
                  </div>
                </div>
                
                {/* Warning View */}
                {showWarning && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-amber-900">Xác nhận khóa lịch!</h4>
                      <p className="text-sm text-amber-700 mt-1">
                        Hệ thống sẽ kiểm tra và <b>TỰ ĐỘNG HỦY LỊCH</b> của mọi ứng viên đã lỡ đặt vào các ngày bận bạn vừa cấu hình. Bạn có chắc chắn muốn lưu không?
                      </p>
                      <div className="mt-3 flex gap-2">
                        <button onClick={() => setShowWarning(false)} className="px-3 py-1.5 bg-white border border-amber-200 text-amber-700 rounded-lg text-xs font-bold hover:bg-amber-100">Hủy bỏ</button>
                        <button onClick={() => handleSave(true)} className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700">Vẫn lưu & Hủy lịch ứng viên</button>
                      </div>
                    </div>
                  </motion.div>
                )}

              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 shrink-0">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-200/50 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={saving || showWarning}
              className="px-6 py-2.5 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Lưu Cài Đặt
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
