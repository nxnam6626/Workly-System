'use client';

import Link from "next/link";
import { Sparkles, FileText, Upload } from "lucide-react";

export function RightHeroWidgets() {
  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Widget 1: Creator */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col justify-between group hover:shadow-md transition-all relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-slate-500 font-medium text-xs mb-1 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Tạo CV tự động
          </p>
          <h4 className="text-[#0047a5] font-black text-xl leading-tight mb-4">
            Hoàn thiện CV <br /> Chỉ trong 2 Phút
          </h4>
          <Link
            href="/cv-builder"
            className="inline-flex items-center gap-2 bg-[#f96d15] hover:bg-[#e85a00] text-white px-5 py-2 rounded-full font-bold text-xs transition-all shadow-lg shadow-orange-200"
          >
            TẠO CV NGAY
          </Link>
        </div>
        
        {/* Mascot Image */}
        <div className="absolute right-0 bottom-0 w-24 h-24 translate-x-1 translate-y-1 opacity-90 group-hover:scale-110 transition-transform">
           <img 
            src="file:///C:/Users/XuanNam/.gemini/antigravity/brain/55a3fbb6-6940-4ace-9e05-a3951c8708ed/mascot_cv_creator_1776188845635.png" 
            alt="Mascot CV" 
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      {/* Widget 2: Evaluator */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col justify-between group hover:shadow-md transition-all relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-slate-500 font-medium text-xs mb-1 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3 h-3 text-mariner" />
            Đánh giá CV
          </p>
          <h4 className="text-[#0047a5] font-black text-xl leading-tight mb-4">
            Tối ưu CV <br /> Cùng Workly AI
          </h4>
          <Link
            href="/candidates/profile"
            className="inline-flex items-center gap-2 bg-[#ffcc00] hover:bg-[#eebb00] text-blue-900 px-5 py-2 rounded-full font-bold text-xs transition-all shadow-lg shadow-yellow-200"
          >
            TẢI CV LÊN
          </Link>
        </div>

        {/* Mascot Image */}
        <div className="absolute right-0 bottom-0 w-24 h-24 translate-x-1 translate-y-1 opacity-90 group-hover:scale-110 transition-transform">
          <img 
            src="file:///C:/Users/XuanNam/.gemini/antigravity/brain/55a3fbb6-6940-4ace-9e05-a3951c8708ed/mascot_cv_evaluator_1776188859817.png" 
            alt="Mascot AI" 
            className="w-full h-full object-contain"
          />
        </div>
      </div>
    </div>
  );
}
