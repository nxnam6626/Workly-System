import React from "react";
import { Zap, Target, TrendingUp } from "lucide-react";

interface MatchingSummaryProps {
  totalScore: number;
  matchLevel: string;
  recommendation: string;
}

export const MatchingSummary: React.FC<MatchingSummaryProps> = ({ totalScore, matchLevel, recommendation }) => {
  const getLevelColor = () => {
    if (totalScore >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (totalScore >= 60) return 'text-blue-600 bg-blue-50 border-blue-100';
    if (totalScore >= 40) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-red-600 bg-red-50 border-red-100';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className={`p-6 rounded-3xl border ${getLevelColor()} flex flex-col items-center justify-center text-center space-y-2`}>
        <div className="p-3 bg-white/50 rounded-2xl shadow-sm">
          <Target className="w-6 h-6" />
        </div>
        <div className="text-3xl font-black">{totalScore}%</div>
        <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Chỉ số tương thích</div>
      </div>

      <div className="md:col-span-2 p-6 bg-slate-900 rounded-3xl text-white flex flex-col justify-center space-y-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Zap className="w-20 h-20" />
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Đánh giá hệ thống</span>
        </div>
        <div className="text-xl font-bold tracking-tight">Mức độ: {matchLevel}</div>
        <p className="text-slate-400 text-xs leading-relaxed max-w-md">
          {recommendation}
        </p>
      </div>
    </div>
  );
};
