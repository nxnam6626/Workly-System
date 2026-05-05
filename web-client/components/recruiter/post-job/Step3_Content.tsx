import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Sparkles, AlertTriangle, CheckCircle2, Loader2, BookOpen, ListChecks, Gift } from 'lucide-react';
import { AutoResizeTextarea } from '@/components/ui/auto-resize-textarea';
import { JobFormData } from '@/types/job';

interface Step3Props {
  formData: JobFormData;
  setFormData: React.Dispatch<React.SetStateAction<JobFormData>>;
  handlePreCheck: () => void;
  isChecking: boolean;
  modResult: any;
}

export const Step3_Content = ({
  formData,
  setFormData,
  handlePreCheck,
  isChecking,
  modResult
}: Step3Props) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-4">
      {/* Content Sections */}
      <div className="space-y-6">
        <div className="space-y-3">
          <label className="text-sm font-bold text-slate-700 flex items-center gap-2 ml-1">
            <BookOpen className="w-5 h-5 text-indigo-500" /> Mô tả công việc <span className="text-red-500">*</span>
          </label>
          <AutoResizeTextarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full min-h-[180px] p-6 rounded-2xl border-2 border-slate-100 outline-none focus:border-indigo-500 transition-all text-sm leading-relaxed font-medium text-slate-700 shadow-sm"
            placeholder="Nhiệm vụ hàng ngày, trách nhiệm chính của vị trí này là gì?..."
            required
          />
        </div>

        <div className="space-y-3">
          <label className="text-sm font-bold text-slate-700 flex items-center gap-2 ml-1">
            <ListChecks className="w-5 h-5 text-purple-500" /> Yêu cầu ứng viên <span className="text-red-500">*</span>
          </label>
          <AutoResizeTextarea
            name="requirements"
            value={formData.requirements}
            onChange={handleChange}
            className="w-full min-h-[180px] p-6 rounded-2xl border-2 border-slate-100 outline-none focus:border-purple-500 transition-all text-sm leading-relaxed font-medium text-slate-700 shadow-sm"
            placeholder="Những kỹ năng, bằng cấp hoặc tố chất nào là bắt buộc?..."
            required
          />
        </div>

        <div className="space-y-3">
          <label className="text-sm font-bold text-slate-700 flex items-center gap-2 ml-1">
            <Gift className="w-5 h-5 text-emerald-500" /> Quyền lợi & Chế độ đãi ngộ
          </label>
          <AutoResizeTextarea
            name="benefits"
            value={formData.benefits}
            onChange={handleChange}
            className="w-full min-h-[120px] p-6 rounded-2xl border-2 border-slate-100 outline-none focus:border-emerald-500 transition-all text-sm leading-relaxed font-medium text-slate-700 shadow-sm"
            placeholder="Lương thưởng, BHXH, du lịch, môi trường làm việc..."
          />
        </div>
      </div>

      {/* AI Moderation Pre-check Card */}
      <div className={`p-6 rounded-3xl border-2 transition-all duration-500 relative overflow-hidden ${
        modResult 
          ? modResult.safe ? 'bg-emerald-50/20 border-emerald-100' : 'bg-rose-50/20 border-rose-100'
          : 'bg-slate-50/40 border-slate-100 shadow-inner'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Shield className={`w-6 h-6 ${modResult ? modResult.safe ? 'text-emerald-500' : 'text-rose-500' : 'text-slate-400'}`} />
              <h4 className="text-base font-black text-slate-800 uppercase tracking-widest">Hệ thống AI Kiểm Duyệt</h4>
            </div>
            <p className="text-xs text-slate-500 font-bold max-w-lg">Phân tích nội dung để đảm bảo JD chuyên nghiệp và không vi phạm quy định sàn.</p>
          </div>
          <button
            type="button"
            onClick={handlePreCheck}
            disabled={isChecking || !formData.description || !formData.requirements}
            className="flex-shrink-0 flex items-center gap-3 px-8 py-4 bg-white border-2 border-slate-100 rounded-2xl text-xs font-black text-slate-600 hover:border-indigo-500 hover:text-indigo-600 transition-all hover:shadow-xl hover:shadow-indigo-50 disabled:opacity-40 shadow-sm"
          >
            {isChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-500" />}
            CHẠY AI PHÂN TÍCH
          </button>
        </div>

        {modResult && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-8 pt-8 border-t-2 border-white space-y-6">
            <div className="flex items-center justify-between bg-white/60 p-4 rounded-2xl border border-white">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shadow-inner ${
                  modResult.score >= 80 ? 'bg-emerald-100 text-emerald-600' : 
                  modResult.score >= 50 ? 'bg-amber-100 text-amber-600' : 
                  'bg-rose-100 text-rose-600'
                }`}>
                  {modResult.score}%
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chỉ số hấp dẫn JD</p>
                  <p className="text-xs font-bold text-slate-700 italic">"Đánh giá dựa trên mức độ đầy đủ của thông tin"</p>
                </div>
              </div>
              <div className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm ${
                modResult.safe ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
              }`}>
                {modResult.safe ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                {modResult.safe ? 'Đạt chuẩn' : 'Cần sửa đổi'}
              </div>
            </div>

            {!modResult.safe && (
              <div className="p-5 bg-rose-50 rounded-2xl border border-rose-100">
                <p className="text-xs font-bold text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 shrink-0" /> Phát hiện: {modResult.reason}
                </p>
              </div>
            )}

            {modResult.suggestions && (
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">AI đề xuất cải thiện:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {modResult.suggestions.map((s: string, i: number) => (
                    <motion.div 
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.1 }}
                      key={i} 
                      className="flex items-start gap-3 text-xs font-bold text-slate-600 bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm"
                    >
                      <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                      {s}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
