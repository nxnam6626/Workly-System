"use client";
import { useState } from "react";
import { X } from "lucide-react";
import Link from "next/link";

interface IndustryPanelProps {
  category: string;
  subCategories: string[];
  onSelect?: (value: string) => void;
  onClose?: () => void;
  variant?: "dropdown" | "sidebar";
}

export default function IndustryPanel({
  category,
  subCategories,
  onSelect,
  onClose,
  variant = "dropdown",
}: IndustryPanelProps) {
  const isSidebar = variant === "sidebar";
  const renderItem = (text: string, isAll: boolean = false) => {
    const className = isAll
      ? "px-3 py-1.5 bg-slate-200/60 text-slate-800 text-[12.5px] font-bold rounded-md hover:bg-[#1e60ad] hover:text-white transition-all active:scale-[0.98] shrink-0"
      : "px-3 py-1.5 bg-slate-100 text-slate-600 text-[12.5px] font-medium rounded-md hover:bg-[#1e60ad] hover:text-white transition-all active:scale-[0.98] shrink-0";

    if (onSelect) {
      return (
        <button key={text} onClick={() => onSelect(text)} className={className}>
          {isAll ? `Tất cả ${text}` : text}
        </button>
      );
    }

    return (
      <Link
        key={text}
        href={`/jobs?industry=${encodeURIComponent(text)}`}
        className={className}
      >
        {isAll ? `Tất cả ${text}` : text}
      </Link>
    );
  };

  if (!category) return <div className="flex-1 bg-white" />;

  return (
    <div className={`flex-1 bg-white flex flex-col h-full ${isSidebar ? "p-5" : "p-6"}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="inline-flex items-center px-4 py-1.5 bg-slate-100/80 text-slate-900 rounded-md">
          <h3 className="font-bold text-[14.5px] tracking-tight">{category}</h3>
        </div>
        
        {!isSidebar && onClose && (
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-wrap content-start gap-2 overflow-y-auto custom-sidebar-scroll pr-2">
        {renderItem(category, true)}
        {subCategories.map((sub) => renderItem(sub))}
      </div>
    </div>
  );
}
