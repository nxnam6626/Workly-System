import React from "react";
import { Award, X } from "lucide-react";
import { UseFormSetValue } from "react-hook-form";
import { CVFormData } from "./cv-review.schema";

interface CertificationsSectionProps {
  certifications: string[];
  setValue: UseFormSetValue<CVFormData>;
}

export const CertificationsSection: React.FC<CertificationsSectionProps> = ({ 
  certifications, 
  setValue 
}) => {
  if (!certifications || certifications.length === 0) return null;

  return (
    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100">
          <Award className="w-5 h-5" />
        </div>
        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Chứng chỉ & Bằng cấp</h3>
      </div>
      <div className="flex flex-wrap gap-3">
        {certifications.map((cert, index) => (
          <div key={index} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 group">
            <span className="text-sm font-bold text-slate-700">{cert}</span>
            <button
              type="button"
              onClick={() => {
                setValue("certifications", certifications.filter((_, i) => i !== index));
              }}
              className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
