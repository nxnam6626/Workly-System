import React from "react";
import { CheckCircle2, AlertCircle, HelpCircle } from "lucide-react";

interface CriterionProps {
  label: string;
  score: number;
  maxScore: number;
  reasoning: string;
  type: 'skill' | 'experience' | 'education' | 'other';
}

export const AnalysisCriterion: React.FC<CriterionProps> = ({ label, score, maxScore, reasoning, type }) => {
  const percentage = (score / maxScore) * 100;
  
  const getStatusIcon = () => {
    if (percentage >= 80) return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    if (percentage >= 40) return <AlertCircle className="w-5 h-5 text-amber-500" />;
    return <AlertCircle className="w-5 h-5 text-red-500" />;
  };

  const getStatusColor = () => {
    if (percentage >= 80) return 'bg-emerald-500';
    if (percentage >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="p-5 bg-white border border-slate-100 rounded-2xl hover:shadow-md transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <h4 className="font-bold text-slate-800">{label}</h4>
        </div>
        <div className="text-right">
          <span className="text-sm font-black text-slate-900">{score}/{maxScore}</span>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Điểm thành phần</p>
        </div>
      </div>

      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-4">
        <div 
          className={`h-full ${getStatusColor()} transition-all duration-1000`} 
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
        <p className="text-xs text-slate-600 leading-relaxed italic">
          "{reasoning}"
        </p>
      </div>
    </div>
  );
};
