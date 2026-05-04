"use client";

import React, { useMemo } from "react";
import { X, Sparkles, BrainCircuit } from "lucide-react";
import { motion } from "framer-motion";
import { AnalysisCriterion } from "./matching/AnalysisCriterion";
import { MatchingSummary } from "./matching/MatchingSummary";

interface MatchingAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisData: any;
  candidateName: string;
  jobTitle: string;
}

export function MatchingAnalysisModal({
  isOpen,
  onClose,
  analysisData,
  candidateName,
  jobTitle,
}: MatchingAnalysisModalProps) {
  const analysis = useMemo(() => {
    if (!analysisData) return null;

    const data = analysisData.matching_analysis || analysisData;
    
    return {
      totalScore: data.overall_match_score || data.score || 0,
      matchLevel: data.match_level || "Chưa xác định",
      recommendation: data.hiring_recommendation || data.recommendation || "Không có đề xuất cụ thể.",
      criteria: [
        {
          label: "Kỹ năng chuyên môn",
          score: data.technical_skills_match?.score || 0,
          maxScore: 40,
          reasoning: data.technical_skills_match?.reasoning || "Không có dữ liệu.",
          type: 'skill' as const
        },
        {
          label: "Kinh nghiệm làm việc",
          score: data.experience_match?.score || 0,
          maxScore: 30,
          reasoning: data.experience_match?.reasoning || "Không có dữ liệu.",
          type: 'experience' as const
        },
        {
          label: "Nền tảng học vấn",
          score: data.education_match?.score || 0,
          maxScore: 15,
          reasoning: data.education_match?.reasoning || "Không có dữ liệu.",
          type: 'education' as const
        },
        {
          label: "Chứng chỉ & Khác",
          score: data.other_criteria?.score || 0,
          maxScore: 15,
          reasoning: data.other_criteria?.reasoning || "Không có dữ liệu.",
          type: 'other' as const
        }
      ]
    };
  }, [analysisData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative z-10 border border-slate-200"
      >
        <div className="p-8 bg-white border-b border-slate-100 flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600" />
          
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
              <BrainCircuit className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">AI Intelligent Analysis</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Phân tích mức độ phù hợp</h2>
              <p className="text-xs text-slate-500 font-bold">
                Ứng viên: <span className="text-blue-600">{candidateName}</span> • Vị trí: <span className="text-slate-800">{jobTitle}</span>
              </p>
            </div>
          </div>

          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-xl transition-all text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 space-y-8">
          {analysis && (
            <>
              <MatchingSummary 
                totalScore={analysis.totalScore}
                matchLevel={analysis.matchLevel}
                recommendation={analysis.recommendation}
              />

              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-2">
                  Chi tiết tiêu chí <div className="h-px flex-1 bg-slate-200" />
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.criteria.map((criterion, idx) => (
                    <AnalysisCriterion 
                      key={idx}
                      label={criterion.label}
                      score={criterion.score}
                      maxScore={criterion.maxScore}
                      reasoning={criterion.reasoning}
                      type={criterion.type}
                    />
                  ))}
                </div>
              </div>

              <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100 flex items-start gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-100 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-slate-800">Lưu ý cho Nhà tuyển dụng</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Kết quả này được tạo ra bởi AI dựa trên việc so sánh CV và Mô tả công việc (JD). Hãy sử dụng kết quả này như một tài liệu tham khảo để đưa ra quyết định phỏng vấn chính xác hơn.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-6 bg-white border-t border-slate-100 flex justify-end">
          <button 
            onClick={onClose}
            className="px-10 py-3.5 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-blue-600 transition-all shadow-xl shadow-slate-200"
          >
            Đã hiểu
          </button>
        </div>
      </motion.div>
    </div>
  );
}
