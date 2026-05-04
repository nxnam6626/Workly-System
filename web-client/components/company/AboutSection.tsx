'use client';

import { useState } from "react";
import { 
  ChevronDown, 
  ChevronUp,
} from "lucide-react";
import { Company } from "@/types/company";

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

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 space-y-8">
      {/* Main Introduction */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
          Giới thiệu công ty {company.companyName}
        </h2>
        
        <div className="relative">
          <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
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
              className="mt-2 block text-mariner font-medium hover:underline focus:outline-none text-sm"
            >
              Thu gọn
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Sections (Insurance, Policy, etc.) */}
      {company.sections?.map((section) => (
        <div key={section.id} className="space-y-3">
          <h3 className="text-[15px] font-bold text-slate-900 uppercase tracking-tight">
            {section.title}
          </h3>
          <ul className="space-y-2">
            {section.content.split('\n').filter(line => line.trim()).map((line, idx) => (
              <li key={idx} className="flex items-start gap-2 text-slate-600 text-[13px] leading-relaxed">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                {line.startsWith('-') || line.startsWith('•') ? line.substring(1).trim() : line.trim()}
              </li>
            ))}
          </ul>
        </div>
      ))}

      {/* History */}
      {company.history && company.history.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[15px] font-bold text-slate-900 uppercase tracking-tight">Lịch sử thành lập</h3>
          <ul className="space-y-2">
            {company.history.map((item) => (
              <li key={item.id} className="flex items-start gap-2 text-slate-600 text-[13px] leading-relaxed">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                <span className="font-bold shrink-0">{item.year}:</span>
                <span>{item.event}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Benefits */}
      {company.benefits && company.benefits.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[15px] font-bold text-slate-900 uppercase tracking-tight">Phúc lợi công ty</h3>
          <ul className="space-y-2">
            {company.benefits.map((benefit) => (
              <li key={benefit.id} className="flex items-start gap-2 text-slate-600 text-[13px] leading-relaxed">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                {benefit.title}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
