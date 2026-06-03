"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar, Clock, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  onSuccess: () => void;
}

interface AvailableSlot {
  date: string;
  slots: string[];
}

export function RescheduleModal({ isOpen, onClose, applicationId, onSuccess }: RescheduleModalProps) {
  const [loading, setLoading] = useState(false);
  const [availableDays, setAvailableDays] = useState<AvailableSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableSlots();
      setSelectedDate(null);
      setSelectedTime(null);
    }
  }, [isOpen]);

  const fetchAvailableSlots = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/applications/${applicationId}/available-slots`);
      setAvailableDays(data.availableDays || []);
      if (data.availableDays && data.availableDays.length > 0) {
        setSelectedDate(data.availableDays[0].date);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không thể tải danh sách ngày trống");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) return;
    try {
      setSubmitting(true);
      await api.post(`/applications/${applicationId}/schedule`, {
        date: selectedDate,
        time: selectedTime,
      });
      toast.success("Đã dời lịch phỏng vấn thành công!");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Đã xảy ra lỗi khi dời lịch");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('vi-VN', { 
        weekday: 'long', 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  if (!isOpen) return null;

  const currentDaySlots = availableDays.find(d => d.date === selectedDate)?.slots || [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Dời lịch phỏng vấn</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Chọn thời gian phù hợp với bạn</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-sm font-medium text-slate-500">Đang tải lịch trống...</p>
              </div>
            ) : availableDays.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                <AlertCircle className="w-12 h-12 text-slate-300" />
                <div>
                  <p className="text-sm font-bold text-slate-700">Không có lịch trống</p>
                  <p className="text-xs text-slate-500 mt-1">Nhà tuyển dụng hiện không có giờ trống nào trong thời gian tới.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Ngày */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <h3 className="text-sm font-bold text-slate-900">1. Chọn ngày</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {availableDays.map(day => (
                      <button
                        key={day.date}
                        onClick={() => {
                          setSelectedDate(day.date);
                          setSelectedTime(null);
                        }}
                        className={`px-3 py-2.5 rounded-xl border text-sm font-bold transition-all text-left ${
                          selectedDate === day.date
                            ? "bg-blue-50 border-blue-500 text-blue-700 shadow-sm"
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {formatDisplayDate(day.date)}
                        <span className="block text-[11px] font-medium text-slate-400 mt-0.5">
                          {day.slots.length} khung giờ trống
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Giờ */}
                {selectedDate && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <h3 className="text-sm font-bold text-slate-900">2. Chọn giờ phỏng vấn</h3>
                    </div>
                    {currentDaySlots.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {currentDaySlots.map(time => (
                          <button
                            key={time}
                            onClick={() => setSelectedTime(time)}
                            className={`px-3 py-2 rounded-xl border text-sm font-bold transition-all text-center ${
                              selectedTime === time
                                ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 rounded-xl text-center text-sm text-slate-500 font-medium">
                        Không còn khung giờ trống trong ngày này.
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 bg-slate-200/50 rounded-xl transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedDate || !selectedTime || submitting}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#1e60ad] hover:bg-[#154b8a] text-white text-sm font-bold rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Xác nhận dời lịch"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
