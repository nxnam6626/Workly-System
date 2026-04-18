/**
 * VERSION: 1.0.1 - FIXED MODAL WITHOUT UI DIALOG
 */
'use client';

import React from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  BrainCircuit, 
  Scale, 
  History, 
  Lightbulb,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnalysisData {
  hardSkillsCount: number;
  matchedCount: number;
  missingCount: number;
  experienceMatch: boolean;
  totalYearsExp: number;
  requiredExp: number;
}

interface MatchingAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName: string;
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  analysis: AnalysisData;
}

const MatchingAnalysisModal: React.FC<MatchingAnalysisModalProps> = ({
  isOpen,
  onClose,
  candidateName,
  score,
  matchedSkills,
  missingSkills,
  analysis,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-6 bg-gradient-to-br from-indigo-600 to-violet-700 text-white relative">
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                aria-label="Đóng"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              <div className="flex justify-between items-center pr-8">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <BrainCircuit className="w-6 h-6" /> Phân tích AI Matching
                  </h2>
                  <p className="text-indigo-100 text-sm mt-1">
                    Chi tiết độ phù hợp của <strong>{candidateName}</strong>
                  </p>
                </div>
                <div className="text-center bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/30">
                  <div className="text-3xl font-black">{score}%</div>
                  <div className="text-[10px] uppercase font-bold tracking-tighter opacity-80">Điểm tổng quát</div>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
              {/* Section 1: Kỹ năng chuyên môn */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-slate-800 font-bold border-b pb-2">
                  <Scale className="w-5 h-5 text-indigo-600" />
                  <span>Kỹ năng chuyên môn (Trọng số 60%)</span>
                  <span className="ml-auto text-xs font-normal text-slate-500">
                    Khớp {analysis?.matchedCount || 0}/{analysis?.hardSkillsCount || 0}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Matched */}
                  <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100">
                    <h4 className="text-emerald-700 font-bold text-xs uppercase mb-3 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Điểm mạnh (Đã khớp)
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {matchedSkills.length > 0 ? (
                        matchedSkills.map((s, idx) => (
                          <motion.span 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            key={idx} 
                            className="px-2 py-1 bg-white border border-emerald-200 text-emerald-700 text-xs font-medium rounded-lg shadow-sm"
                          >
                            {s}
                          </motion.span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-xs italic">Không tìm thấy kỹ năng khớp</span>
                      )}
                    </div>
                  </div>

                  {/* Missing */}
                  <div className="bg-rose-50/50 rounded-xl p-4 border border-rose-100">
                    <h4 className="text-rose-700 font-bold text-xs uppercase mb-3 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> Kỹ năng còn thiếu
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {missingSkills.length > 0 ? (
                        missingSkills.map((s, idx) => (
                          <motion.span 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            key={idx} 
                            className="px-2 py-1 bg-white border border-rose-200 text-rose-700 text-xs font-medium rounded-lg shadow-sm"
                          >
                            {s}
                          </motion.span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-xs italic">Đã đáp ứng đầy đủ yêu cầu chính</span>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 2: Kinh nghiệm */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-slate-800 font-bold border-b pb-2">
                  <History className="w-5 h-5 text-indigo-600" />
                  <span>Kinh nghiệm làm việc (Trọng số 40%)</span>
                </div>
                
                <div className={`flex items-center gap-6 p-4 rounded-xl border ${analysis?.experienceMatch ? 'bg-indigo-50/50 border-indigo-100' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 font-medium tracking-tight">Số năm yêu cầu:</span>
                      <span className="font-bold text-slate-800">{analysis?.requiredExp || 0} năm</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 font-medium tracking-tight">Ứng viên hiện có:</span>
                      <span className={`font-bold ${analysis?.experienceMatch ? 'text-indigo-600' : 'text-slate-700'}`}>
                        {analysis?.totalYearsExp || 0} năm
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(((analysis?.totalYearsExp || 0) / Math.max(analysis?.requiredExp || 1, 1)) * 100, 100)}%` }}
                        className={`h-full ${analysis?.experienceMatch ? 'bg-indigo-500' : 'bg-slate-400'}`}
                      />
                    </div>
                  </div>
                  <div className="w-16 h-16 rounded-full flex flex-col items-center justify-center bg-white shadow-sm border border-slate-100 flex-shrink-0">
                    {analysis?.experienceMatch ? (
                       <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    ) : (
                       <XCircle className="w-8 h-8 text-slate-300" />
                    )}
                    <span className="text-[8px] font-bold uppercase mt-1">
                      {analysis?.experienceMatch ? 'Đạt' : 'Chưa đạt'}
                    </span>
                  </div>
                </div>
              </section>

              {/* Section 3: AI Advice */}
              <section className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                <h4 className="flex items-center gap-2 text-amber-800 font-bold text-sm mb-2">
                  <Lightbulb className="w-4 h-4" /> Gợi ý từ AI Workly
                </h4>
                <div className="text-sm text-amber-700 leading-relaxed">
                  {score >= 80 ? (
                    <p>Ứng viên này là sự lựa chọn <strong>xuất sắc</strong>. Các kỹ năng cốt lõi gần như khớp hoàn toàn. Bạn nên thực hiện phỏng vấn sớm để không bỏ lỡ tài năng này.</p>
                  ) : score >= 50 ? (
                    <p>Ứng viên có nền tảng tốt nhưng đang thiếu một vài kỹ năng quan trọng hoặc số năm kinh nghiệm chưa thực sự lý tưởng. Hãy cân nhắc phỏng vấn nếu bạn sẵn sàng đào tạo thêm.</p>
                  ) : (
                    <p>Ứng viên chưa thực sự phù hợp với yêu cầu chuyên sâu của vị trí này. Bạn có thể lưu hồ sơ để cân nhắc cho các vị trí khác thấp hơn.</p>
                  )}
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t flex justify-end">
              <button 
                onClick={onClose}
                className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-all shadow-md active:scale-95"
              >
                Đã hiểu
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MatchingAnalysisModal;
