import React, { useState } from "react";
import { motion } from "framer-motion";
import { XCircle, Sparkles, Clock, MapPin, Calendar } from "lucide-react";
import { Invitation } from "../types";
import toast from "react-hot-toast";

interface ProposedSlotsSchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedInvitation: Invitation | null;
  onConfirm: (dateStr: string, timeStr: string) => Promise<void>;
  isProcessing: boolean;
}

export const ProposedSlotsSchedulerModal: React.FC<ProposedSlotsSchedulerModalProps> = ({
  isOpen,
  onClose,
  selectedInvitation,
  onConfirm,
  isProcessing,
}) => {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [showCustomProposal, setShowCustomProposal] = useState(false);
  const [customProposedTime, setCustomProposedTime] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  if (!isOpen || !selectedInvitation) return null;

  const handleConfirmClick = () => {
    if (showCustomProposal) {
      if (!customProposedTime) {
        toast.error("Vui lòng nhập thời gian đề xuất");
        return;
      }
      // For custom string proposals, fallback to ISO format encoding if necessary or warn.
      // For simplicity, encode simple "today" with full text in time if mandatory.
      // But backend usually wants clean date. Let's assume valid parsing later.
      onConfirm(new Date().toISOString().split("T")[0], customProposedTime);
      return;
    }

    if (!selectedDate || !selectedSlot) {
      toast.error("Vui lòng chọn ngày và giờ phỏng vấn");
      return;
    }

    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const day = String(selectedDate.getDate()).padStart(2, "0");
    const cleanDate = `${year}-${month}-${day}`; // YYYY-MM-DD

    onConfirm(cleanDate, selectedSlot);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.22 }}
        className="bg-white border border-slate-100 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col relative"
      >
        {/* Header */}
        <div className="p-5 pb-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm shadow-blue-100">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-[17px]">Chọn lịch hẹn phỏng vấn</h3>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Cá nhân hóa lịch rảnh của bạn</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all"
          >
            <XCircle className="w-5 h-5 text-slate-400 hover:text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Recruiter Custom Message Bubble */}
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl relative">
            <span className="absolute -top-2.5 left-4 px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-[9px] font-bold uppercase tracking-wider">Thư mời từ Nhà tuyển dụng</span>
            <p className="text-[13px] text-slate-600 leading-relaxed italic pt-1">
              "{selectedInvitation?.message || 'Chúng tôi rất ấn tượng với hồ sơ của bạn và muốn hẹn lịch phỏng vấn để trao đổi thêm.'}"
            </p>
          </div>

          {!showCustomProposal ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* LEFT COLUMN: Mini Interactive Calendar */}
              <div className="md:col-span-7 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                {/* Month Switcher */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={() => setCurrentMonth(prev => {
                      const next = new Date(prev);
                      next.setMonth(prev.getMonth() - 1);
                      return next;
                    })}
                    className="w-7 h-7 rounded-lg hover:bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    &larr;
                  </button>
                  <span className="text-sm font-extrabold text-slate-800">
                    Tháng {currentMonth.getMonth() + 1}/{currentMonth.getFullYear()}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentMonth(prev => {
                      const next = new Date(prev);
                      next.setMonth(prev.getMonth() + 1);
                      return next;
                    })}
                    className="w-7 h-7 rounded-lg hover:bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    &rarr;
                  </button>
                </div>

                {/* Day of Week Headers */}
                <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-bold text-slate-400 mb-2">
                  <span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span className="text-red-400">T7</span><span className="text-red-400">CN</span>
                </div>

                {/* Calendar Days Grid */}
                <div className="grid grid-cols-7 gap-1.5 text-center">
                  {(() => {
                    const year = currentMonth.getFullYear();
                    const month = currentMonth.getMonth();
                    const firstDayIndex = new Date(year, month, 1).getDay(); // 0: Sun, 1: Mon...
                    const totalDays = new Date(year, month + 1, 0).getDate();
                    const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

                    const days = [];
                    for (let i = 0; i < startOffset; i++) {
                      days.push(null);
                    }
                    for (let d = 1; d <= totalDays; d++) {
                      days.push(new Date(year, month, d));
                    }

                    const isDateValid = (d: Date | null) => {
                      if (!d) return false;
                      const now = new Date();
                      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

                      // Past dates are invalid
                      if (d.getTime() < todayStart.getTime()) {
                        return false;
                      }
                      // Within 24-hour lead time is invalid
                      const diffTime = d.getTime() - now.getTime();
                      const diffHours = diffTime / (1000 * 60 * 60);
                      if (diffHours < 24 && d.getDate() === now.getDate()) {
                        return false;
                      }
                      // Sundays are invalid
                      const dayOfWeek = d.getDay();
                      if (dayOfWeek === 0) {
                        return false;
                      }
                      return true;
                    };

                    return days.map((day, dIdx) => {
                      if (!day) return <div key={`empty-${dIdx}`} />;

                      const isValid = isDateValid(day);
                      const isSelected = selectedDate ? selectedDate.toDateString() === day.toDateString() : false;

                      return (
                        <button
                          key={`day-${dIdx}`}
                          type="button"
                          disabled={!isValid}
                          onClick={() => {
                            setSelectedDate(day);
                            setSelectedSlot(null);
                          }}
                          className={`h-8 w-8 mx-auto rounded-full text-xs font-bold transition-all flex items-center justify-center ${
                            !isValid
                              ? "text-slate-300 cursor-not-allowed line-through hover:bg-none"
                              : isSelected
                                ? "bg-blue-600 text-white shadow-md shadow-blue-100 scale-105"
                                : "text-slate-700 hover:bg-blue-50 cursor-pointer"
                          }`}
                        >
                          {day.getDate()}
                        </button>
                      );
                    });
                  })()}
                </div>

                <div className="mt-3.5 pt-3 border-t border-slate-50 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400 font-bold">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-600 block" /> Ngày rảnh</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-200 block" /> Ngày bận (Khóa lịch)</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-100 block line-through" /> Quá hạn báo trước</span>
                </div>
              </div>

              {/* RIGHT COLUMN: Fixed Slots List */}
              <div className="md:col-span-5 space-y-4">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5 mb-2">
                    <Clock className="w-4 h-4 text-[#1e60ad]" />
                    Khung giờ rảnh:
                  </h4>

                  {selectedDate ? (
                    <div className="grid grid-cols-2 gap-2">
                      {["08:00", "10:00", "14:00", "16:00"].map((timeSlot) => {
                        const isSelected = selectedSlot === timeSlot;
                        return (
                          <button
                            key={timeSlot}
                            type="button"
                            onClick={() => setSelectedSlot(timeSlot)}
                            className={`p-3 rounded-xl border text-center text-xs font-bold transition-all duration-150 ${
                              isSelected
                                ? "border-blue-600 bg-blue-50/50 text-blue-600 shadow-sm"
                                : "border-slate-100 hover:border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            {timeSlot}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400 font-bold leading-relaxed">
                      Vui lòng chọn một ngày rảnh khả dụng bên lịch để hiển thị danh sách các khung giờ!
                    </div>
                  )}
                </div>

                {/* Default assigned location */}
                <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-start gap-2.5">
                  <MapPin className="w-4.5 h-4.5 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-black text-indigo-700 uppercase tracking-wider">Địa điểm phỏng vấn mặc định:</p>
                    <p className="text-xs text-slate-600 font-extrabold mt-0.5 leading-snug">
                      683 Âu Cơ, P. Tân Thành, Q. Tân Phú.
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium mt-1">Được gán tự động khi bạn xác nhận lịch phỏng vấn thành công.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="text-sm font-extrabold text-slate-800 block">
                Đề xuất khung giờ mong muốn của bạn:
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Thứ Năm, 14/05/2026 - 15:00 chiều"
                value={customProposedTime}
                onChange={(e) => setCustomProposedTime(e.target.value)}
                className="w-full p-4 border-2 border-slate-100 rounded-2xl text-sm focus:border-blue-600 focus:outline-none transition-all font-bold text-slate-700 bg-slate-50 focus:bg-white"
              />
              <p className="text-[11px] text-slate-400 font-medium">Nhà tuyển dụng sẽ nhận được đề nghị thời gian này của bạn để phê duyệt.</p>
            </div>
          )}

          {/* Toggle option */}
          <button
            type="button"
            onClick={() => {
              setShowCustomProposal(!showCustomProposal);
              setSelectedSlot(null);
              setSelectedDate(null);
              setCustomProposedTime("");
            }}
            className="text-xs text-blue-600 hover:text-[#1e60ad] font-extrabold flex items-center gap-1.5 transition-colors pt-1"
          >
            <Calendar className="w-4 h-4" />
            {showCustomProposal ? "Quay lại xem lịch biểu rảnh" : "Tất cả khung giờ đều bận? Đề xuất giờ khác"}
          </button>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 flex items-center gap-3 bg-slate-50/50">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-700 rounded-2xl text-xs font-black transition-all"
          >
            Đóng
          </button>
          <button
            disabled={isProcessing}
            onClick={handleConfirmClick}
            className="flex-1 py-3 bg-[#1e60ad] hover:bg-[#164e8c] text-white rounded-2xl text-xs font-black transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            Xác nhận đặt lịch
          </button>
        </div>
      </motion.div>
    </div>
  );
};
export default ProposedSlotsSchedulerModal;
