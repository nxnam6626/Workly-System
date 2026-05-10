'use client';

import { useState } from "react";
import { 
  ChevronDown, 
  ChevronUp,
} from "lucide-react";
import dynamic from "next/dynamic";
import { Company } from "@/types/company";

const JobMap = dynamic(() => import("@/components/jobs/JobMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] w-full rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-200 animate-pulse">
      <span className="text-xs text-slate-400 font-medium">Đang tải bản đồ...</span>
    </div>
  )
});

interface AboutSectionProps {
  company: Partial<Company>;
}

export function AboutSection({ company }: AboutSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const description = company.description || "Thông tin giới thiệu về công ty đang được cập nhật.";
  
  const shouldTruncate = description.length > 500;
  const displayDescription = (!isExpanded && shouldTruncate) 
    ? description.substring(0, 500) + "..." 
    : description;

  const branches = company.branches || [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 md:p-7 space-y-8">
      {/* Main Introduction */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-900 tracking-tight">
          Giới thiệu công ty {company.companyName}
        </h2>
        
        <div className="relative">
          <div className="text-slate-600 text-xs leading-relaxed whitespace-pre-wrap">
            {displayDescription}
            {shouldTruncate && !isExpanded && (
              <button 
                onClick={() => setIsExpanded(true)}
                className="inline-block ml-1 text-mariner font-medium hover:underline focus:outline-none"
              >
                Xem thêm
              </button>
            )}
          </div>
          
          {isExpanded && (
            <button 
              onClick={() => setIsExpanded(false)}
              className="mt-2 block text-mariner font-medium hover:underline focus:outline-none text-xs"
            >
              Thu gọn
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Sections (Insurance, Policy, etc.) */}
      {company.sections?.map((section) => (
        <div key={section.id} className="space-y-2">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">
            {section.title}
          </h3>
          <ul className="space-y-1.5">
            {section.content.split('\n').filter(line => line.trim()).map((line, idx) => (
              <li key={idx} className="flex items-start gap-2 text-slate-600 text-xs leading-relaxed">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-400 shrink-0" />
                {line.startsWith('-') || line.startsWith('•') ? line.substring(1).trim() : line.trim()}
              </li>
            ))}
          </ul>
        </div>
      ))}

      {/* History */}
      {company.history && company.history.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Lịch sử thành lập</h3>
          <ul className="space-y-1.5">
            {company.history.map((item) => (
              <li key={item.id} className="flex items-start gap-2 text-slate-600 text-xs leading-relaxed">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-400 shrink-0" />
                <span className="font-bold shrink-0">{item.year}:</span>
                <span>{item.event}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Benefits */}
      {company.benefits && company.benefits.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Phúc lợi công ty</h3>
          <ul className="space-y-1.5">
            {company.benefits.map((benefit) => (
              <li key={benefit.id} className="flex items-start gap-2 text-slate-600 text-xs leading-relaxed">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-400 shrink-0" />
                {benefit.title}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Locations Map Integration */}
      {branches.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
            Địa điểm & Bản đồ chi nhánh
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {/* Optional summary list of branches can go here if wanted */}
            <div className="rounded-xl overflow-hidden shadow-sm border border-slate-200">
              <JobMap branches={branches} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
